// Build Ehel Academy Science runtime packages for every stage from the
// extracted science content model. Mirrors the mathematics builder but parses
// the science document conventions: Part N concepts, Section A-E practice
// with answer keys, Experiment N investigations, and reference glossaries.
// Usage: node tools/build-ehel-science-runtime.js [grade ...]   (default: all)

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const modelPath = path.join(root, "outputs", "science-content", "science-content-model.json");
const sciRoot = path.join(root, "src", "prototypes", "ehel-academy", "science");
const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));

const grades = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : Object.keys(model.grades).map(Number).sort((a, b) => a - b);

const tidy = (value = "") => String(value).replace(/�/g, "–").replace(/\s+/g, " ").trim();
const slug = (value = "") => tidy(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sentence = (value = "", max = 250) => {
  const text = tidy(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "");
  return `${cut}…`;
};

const EMPTY_DOC = { blocks: [], source_file: "(not provided)" };

// Hand-authored Grade 1 content. The Grade 1 source is a parent/teacher
// guide, not a student workbook, so it lacks concept headings, named
// experiments and multiple-choice questions. These age-5-6 overrides give
// each unit clean concept titles, real investigation names, corrected
// vocabulary and picture-friendly quiz questions.
const q = (question, options, answer, explanation) => ({ question, options, answer, explanation });
const GRADE1 = {
  1: {
    outcomes: [
      "Sort things into living and non-living, and say why.",
      "Say that living things move, feed, grow and can have young.",
      "Name some animals and say that they are living.",
      "Name some plants and say that they are living.",
      "Say what living things need to stay alive: food, water and air.",
      "Show care and kindness towards a living animal or plant.",
    ],
    conceptTitles: ["Living Things", "Non-Living Things", "Animals Are Alive", "Plants Are Alive", "What Living Things Need", "Caring for Living Things"],
    experimentTitles: ["Watch a Seed Grow", "Living or Not-Living Hunt", "Does a Plant Need Water?", "Sort Living and Non-Living Things", "Find the Baby Animals", "Draw a Living Thing You Care For"],
    quiz: [
      q("Which one is alive?", ["a camel", "a rock", "a metal spoon", "a plastic cup"], "a camel", "A camel moves, eats and grows, so it is alive."),
      q("Which one is NOT alive?", ["a mango tree", "a goat", "a stone", "a bird"], "a stone", "A stone never eats, grows or moves by itself, so it is not alive."),
      q("What do living things need to stay alive?", ["food and water", "toys", "a phone", "a car"], "food and water", "All living things need food and water."),
      q("A baby goat grows into a...", ["big goat", "tree", "rock", "car"], "big goat", "Living things grow. A baby goat grows into a big goat."),
      q("Which of these is a plant?", ["a mango tree", "a dog", "a fish", "a cat"], "a mango tree", "A mango tree is a plant. It is living."),
      q("How do we care for a living plant?", ["give it water and light", "put it in a box", "hide it in the dark", "never touch it"], "give it water and light", "Plants need water and light to stay alive and grow."),
    ],
  },
  2: {
    outcomes: [
      "Name the main parts of a plant: roots, stem, leaves and flower.",
      "Say what each part of a plant does.",
      "Say what a plant needs to grow: water, light and warmth.",
      "Describe how a seed grows into a new plant.",
      "Observe and record how a plant changes as it grows.",
      "Care for a growing plant over time.",
    ],
    conceptTitles: ["The Parts of a Plant", "Roots Hold and Drink", "The Stem Carries Water", "Leaves and Flowers", "What Plants Need to Grow", "Looking After a Plant"],
    experimentTitles: ["Grow a Bean in a Jar", "Plant a Seed and Watch", "Does a Plant Reach for Light?", "Look Inside a Flower", "Water One, Not the Other", "Make a Plant Diary"],
    quiz: [
      q("Which part holds the plant in the soil?", ["roots", "flower", "leaf", "petal"], "roots", "Roots hold the plant firm and drink water from the soil."),
      q("Which part makes food using sunlight?", ["leaves", "roots", "seed", "soil"], "leaves", "Green leaves catch sunlight to make food for the plant."),
      q("A new plant grows from a...", ["seed", "stone", "spoon", "cup"], "seed", "A seed holds a tiny plant that grows when it gets water and warmth."),
      q("What do plants need to grow?", ["water, light and air", "toys", "milk", "shoes"], "water, light and air", "Plants need water, light and air to grow well."),
      q("Which part carries water up to the leaves?", ["the stem", "the flower", "the root hair", "the petal"], "the stem", "The stem holds the plant up and carries water to the leaves."),
      q("To care for a plant we should...", ["water it and give it light", "keep it in the dark", "never water it", "put it in a bag"], "water it and give it light", "A plant stays healthy with water and light."),
    ],
  },
  3: {
    outcomes: [
      "Point to and name parts of the body: head, arms, legs, hands and feet.",
      "Point to and name parts of the face: eyes, ears, nose and mouth.",
      "Name the five senses and the body part used for each.",
      "Say one way a sense helps to keep us safe.",
      "Sort objects using touch, such as soft and hard or rough and smooth.",
      "Say ways to keep our bodies clean and healthy.",
    ],
    conceptTitles: ["Parts of My Body", "My Face", "My Five Senses", "Same and Different", "Keeping Clean and Healthy", "Staying Safe"],
    experimentTitles: ["Point and Name Body Parts", "Feely Bag: Soft or Hard?", "Listen and Point to the Sound", "Taste Test: Sweet or Sour", "Which Nose Knows? Smell Test", "Draw Myself and Label"],
    vocabulary: [
      ["Head", "The top part of your body, above your neck."], ["Arms", "The two long parts joined to your shoulders."],
      ["Legs", "The two long parts you stand and walk on."], ["Hands", "The parts at the end of your arms, used to hold things."],
      ["Feet", "The parts at the end of your legs that you stand on."], ["Eyes", "The body part we use to see."],
      ["Ears", "The body part we use to hear."], ["Nose", "The body part we use to smell."],
      ["Mouth", "The body part we use to taste and to speak."], ["Senses", "The five ways we learn about the world: see, hear, smell, taste and touch."],
    ],
    quiz: [
      q("Which body part do we use to see?", ["eyes", "ears", "nose", "hands"], "eyes", "We use our eyes to see."),
      q("Which body part do we use to hear?", ["ears", "eyes", "feet", "mouth"], "ears", "We use our ears to hear sounds."),
      q("We smell a flower with our...", ["nose", "eyes", "hands", "knees"], "nose", "We use our nose to smell."),
      q("How many senses do we have?", ["five", "two", "ten", "one"], "five", "We have five senses: sight, hearing, smell, taste and touch."),
      q("We taste food with our...", ["mouth", "ears", "eyes", "feet"], "mouth", "We taste food using our tongue in our mouth."),
      q("Which keeps us clean and healthy?", ["washing our hands", "eating mud", "never sleeping", "skipping water"], "washing our hands", "Washing our hands keeps germs away and keeps us healthy."),
    ],
  },
  4: {
    outcomes: [
      "Name the material an everyday object is made from.",
      "Describe materials using words like hard, soft, rough, smooth, bendy and stiff.",
      "Sort objects by their material or by a property.",
      "Say why a material is chosen for a particular job.",
      "Test and compare how different materials feel and behave.",
      "Observe and record the properties of materials.",
    ],
    conceptTitles: ["What Things Are Made Of", "Hard and Soft", "Rough and Smooth", "Bendy and Stiff", "Sorting Materials", "Choosing the Right Material"],
    experimentTitles: ["Feel and Sort: Hard or Soft", "Rough or Smooth Hunt", "Bendy or Stiff Test", "Will It Float or Sink?", "Build the Strongest Tower", "Sort Toys by Material"],
    quiz: [
      q("A pillow feels...", ["soft", "hard", "rough", "stiff"], "soft", "A pillow is soft, so it is nice to rest on."),
      q("A stone feels...", ["hard", "soft", "bendy", "fluffy"], "hard", "A stone is hard. It does not squash."),
      q("Which material is bendy?", ["a rubber band", "a brick", "a glass", "a rock"], "a rubber band", "A rubber band bends easily, so it is bendy."),
      q("Sandpaper feels...", ["rough", "smooth", "soft", "wet"], "rough", "Sandpaper is rough and scratchy to touch."),
      q("Glass is usually...", ["smooth", "rough", "bendy", "furry"], "smooth", "Glass feels smooth and flat."),
      q("Which is best for a warm blanket?", ["soft cloth", "hard metal", "sharp glass", "cold stone"], "soft cloth", "Soft cloth is warm and comfy, so it is best for a blanket."),
    ],
  },
  5: {
    outcomes: [
      "Recognise a push and a pull as forces.",
      "Make an object move by pushing or pulling it.",
      "Make a moving object slow down or stop.",
      "Change how fast an object moves.",
      "Change the direction in which an object moves.",
      "Observe and describe pushes and pulls in play and at home.",
    ],
    conceptTitles: ["Pushes", "Pulls", "Making Things Move", "Making Things Stop", "Fast and Slow", "Changing Direction"],
    experimentTitles: ["Push a Toy Car", "Pull a Toy on a String", "Ramp Race: Fast or Slow", "Make a Ball Stop", "Push Hard, Push Gently", "Change the Way It Goes"],
    quiz: [
      q("Opening a door by pulling it is a...", ["pull", "push", "lift", "drop"], "pull", "Pulling the door towards you is a pull."),
      q("Kicking a ball away from you is a...", ["push", "pull", "twist", "stop"], "push", "Kicking pushes the ball away, so it is a push."),
      q("A push or a pull is called a...", ["force", "colour", "shape", "sound"], "force", "A push or a pull is a force."),
      q("To make a moving toy stop, you...", ["push against it", "sing to it", "close your eyes", "wait a year"], "push against it", "A force such as a push can make a moving thing stop."),
      q("If you push a swing harder, it goes...", ["faster", "slower", "backwards only", "nowhere"], "faster", "A bigger push makes things move faster."),
      q("A push on the side of a ball can...", ["change its direction", "change its colour", "make it sing", "make it vanish"], "change its direction", "A force can change the direction a thing moves in."),
    ],
  },
  6: {
    outcomes: [
      "Say that sounds are made when things shake or vibrate.",
      "Name the ear as the body part we use to hear.",
      "Sort sounds into loud and quiet.",
      "Make sounds in different ways.",
      "Describe the sounds we hear around us.",
      "Listen carefully and identify different sounds.",
    ],
    conceptTitles: ["What Is Sound?", "How We Hear", "Loud Sounds", "Quiet Sounds", "Making Sounds", "Sounds Around Us"],
    experimentTitles: ["Listen for One Minute", "Shake a Sound Maker", "Loud and Quiet Sorting", "Feel a Drum Vibrate", "Make a String Buzz", "Guess That Sound"],
    quiz: [
      q("We hear with our...", ["ears", "eyes", "nose", "hands"], "ears", "We use our ears to hear sounds."),
      q("A drum banged hard makes a...", ["loud sound", "quiet sound", "no sound", "cold sound"], "loud sound", "Banging a drum hard makes a loud sound."),
      q("A whisper is a...", ["quiet sound", "loud sound", "bright light", "warm smell"], "quiet sound", "A whisper is a very quiet sound."),
      q("Sounds are made when things...", ["shake or vibrate", "sit still", "go to sleep", "turn cold"], "shake or vibrate", "Sounds are made when things vibrate — they shake very fast."),
      q("Which is a loud sound?", ["a shouting crowd", "a falling feather", "a sleeping cat", "a soft breath"], "a shouting crowd", "A shouting crowd makes a loud sound."),
      q("To hear a soft sound better, we should...", ["listen quietly", "shout", "cover our ears", "run away"], "listen quietly", "Listening quietly helps us hear soft sounds."),
    ],
  },
};

function buildGrade(grade) {
  const source = model.grades[String(grade)];
  if (!source) throw new Error(`Grade ${grade} missing from the science content model.`);
  const stageId = `s${String(grade).padStart(2, "0")}`;
  const stageLabel = `Stage ${grade}`;
  const contentPackage = `Ehel-Academy-Science-Grade-${grade}-Content-Package`;
  // Official Cambridge framework: Primary Science 0097 (Stages 1-6),
  // Lower Secondary Science 0893 (Stages 7-9).
  const cambridge = grade <= 6
    ? { level: "Cambridge Primary Science", code: "0097", stage: grade }
    : { level: "Cambridge Lower Secondary Science", code: "0893", stage: grade };
  const cambridgeLabel = `${cambridge.level} ${cambridge.code} — Stage ${grade}`;
  const gradeDir = path.join(sciRoot, `grade-${grade}`);
  const unitDir = path.join(gradeDir, "data", "units");

  const docFor = (unit, type) => source.documents.find((doc) => doc.unit === unit && doc.document_type === type) || EMPTY_DOC;
  const sectionBlocks = (doc, pattern) => doc.blocks.filter((block) => pattern.test(block.section) && block.content_kind !== "Heading");
  const sectionNames = (doc) => [...new Set(doc.blocks.map((block) => block.section))];

  function unitTitle(lesson, fallback, unitNo) {
    for (const block of lesson.blocks.slice(0, 4)) {
      const match = tidy(block.text).match(/^Year\s+\d+(?:\s+Science)?\s*[-–—]\s*Unit\s+\d+\s*:\s*(.+)$/i);
      if (match && match[1].length > 1 && match[1].length <= 90) return tidy(match[1]);
    }
    for (let index = 0; index < Math.min(6, lesson.blocks.length - 1); index += 1) {
      const text = tidy(lesson.blocks[index].text);
      const next = tidy(lesson.blocks[index + 1].text);
      if (/^Year\s+\d+\s+Science/i.test(next) && text.length > 2 && text.length <= 90 && !/^Year\s+\d+/i.test(text)) return text;
    }
    if (fallback && !/^(learning objectives|key words glossary|teacher and parent guide)/i.test(fallback)) return fallback;
    return `Unit ${unitNo}`;
  }

  function outcomeList(lesson) {
    let list = sectionBlocks(lesson, /able to do|learning objectives|what you will learn/i)
      .map((block) => tidy(block.text))
      .filter((text) => text.length > 20 && !/^(read them now|by the time|these are)/i.test(text))
      .slice(0, 10);
    if (!list.length) {
      list = lesson.blocks.map((block) => tidy(block.text))
        .filter((text) => /^(sort|name|describe|explain|identify|compare|plan|record|measure|observe|predict|investigate|use|give|connect|state|label)\b/i.test(text) && text.length > 25)
        .slice(0, 8);
    }
    return list;
  }

  function conceptList(lesson, title) {
    // Source docs mark concepts as "Part N:", "Concept N:", "Topic N:" or
    // "Section N:" — accept them all.
    const CONCEPT_MARKER = /^(?:Part|Concept|Topic|Section|Idea)\s+\d+\s*[—:.\-]/i;
    const starts = lesson.blocks
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => CONCEPT_MARKER.test(tidy(block.text)));
    let concepts = starts.map(({ block, index }, position) => {
      const end = starts[position + 1]?.index ?? lesson.blocks.length;
      const body = lesson.blocks.slice(index + 1, Math.min(end, index + 10))
        .map((item) => tidy(item.text))
        .filter((text) => text.length > 40 && !/Ask Your AI Tutor|^Remember\b/i.test(text));
      const heading = tidy(block.text).replace(/^(?:Part|Concept|Topic|Section|Idea)\s+\d+\s*[—:.\-]\s*/i, "");
      return {
        id: `concept-${position + 1}-${slug(heading) || position + 1}`,
        title: heading,
        explanation: sentence(body.slice(0, 2).join(" "), 520),
        example: sentence(body[2] || body[0] || heading, 220),
      };
    });
    if (!concepts.length) {
      // Look for genuine topic sub-headings; reject workbook scaffolding.
      const BLOCK = /^(example|step by step|worked example|answer|recording|analysis|going further|remember|key|assessment|about this unit|learning objectives|unit overview|welcome|materials|method|aim|hypothesis|conclusion|lesson\s*\d|part\s*\d\b|section|introduction|summary|glossary|vocabulary|self[- ]|checklist|what you will|how to use|ask your ai)/i;
      const topicHeadings = lesson.blocks
        .filter((block) => block.content_kind === "Heading")
        .map((block) => tidy(block.text).replace(/^(Part|Lesson)\s*\d+\s*[—:\-]\s*/i, ""))
        .filter((text) => text.length >= 6 && text.length <= 52 && !/[.!?]$/.test(text) && !BLOCK.test(text));
      const paragraphs = lesson.blocks.map((block) => tidy(block.text)).filter((text) => text.length > 90).slice(0, 6);
      concepts = paragraphs.map((text, index) => ({
        id: `concept-${index + 1}-${slug(title)}-${index + 1}`,
        title: topicHeadings[index] || `${title} — part ${index + 1}`,
        explanation: sentence(text, 520),
        example: sentence(paragraphs[(index + 1) % paragraphs.length] || text, 220),
      }));
    }
    return concepts.slice(0, 6);
  }

  function termPairsFromTables(doc, pattern) {
    const cells = doc.blocks.filter((block) => pattern.test(block.section) && block.block_type === "Table cell");
    const byRow = new Map();
    for (const cell of cells) {
      const key = `${cell.section}::${cell.table_row}`;
      if (!byRow.has(key)) byRow.set(key, {});
      byRow.get(key)[cell.table_col] = tidy(cell.text);
    }
    const pairs = [];
    for (const row of byRow.values()) {
      if (row[1] && row[2] && row[1].length < 100 && row[2].length < 260
          && !/^(word|term|what it means|meaning|mistake|misconception|error|the truth|why it is wrong|correct( approach)?|q|question|answer|explanation|example)$/i.test(row[1])) pairs.push([row[1], row[2]]);
    }
    return pairs;
  }

  function sentencesFrom(...docs) {
    const out = [];
    for (const doc of docs) for (const block of doc.blocks) {
      const text = tidy(block.text);
      if (text.length < 40) continue;
      for (const part of text.split(/(?<=[.!?])\s+(?=[A-Z“"])/)) {
        const s = tidy(part);
        if (s.length >= 40 && s.length <= 240) out.push(s);
      }
    }
    return out;
  }

  function referenceData(reference, lesson, experimentsDoc) {
    let terms = termPairsFromTables(reference, /glossary|key words/i);
    if (!terms.length) terms = termPairsFromTables(lesson, /key science words|glossary|key words/i);
    if (!terms.length) terms = termPairsFromTables(lesson, /./);

    let rules = sectionBlocks(reference, /most important rule|key rules?\b/i)
      .map((block) => tidy(block.text)).filter((text) => text.length > 20)
      .map((text, index) => ({ title: `Key idea ${index + 1}`, text }));
    if (!rules.length) {
      rules = lesson.blocks.map((block) => tidy(block.text))
        .filter((text) => /^remember\b/i.test(text) && text.length > 25).slice(0, 6)
        .map((text, index) => ({ title: `Key idea ${index + 1}`, text: text.replace(/^Remember[:!]?\s*/i, "") }));
    }

    let commonMistakes = [];
    const mistakeCells = termPairsFromTables(reference, /common mistakes/i);
    if (mistakeCells.length) commonMistakes = mistakeCells;
    else {
      const lines = sectionBlocks(reference, /common mistakes/i).map((block) => tidy(block.text)).filter((text) => text.length > 15);
      // Table-less mistakes often read "Mistake ... The truth is ..." — split on that.
      for (const line of lines) {
        const m = line.match(/^(.*?)(?:\bthe truth\b|\bactually\b|\bcorrect\b|\binstead\b|—|:)\s*(.+)$/i);
        if (m && m[1].length > 8 && m[2].length > 8) commonMistakes.push([tidy(m[1]).replace(/[—:]$/, ""), tidy(m[2])]);
        else if (commonMistakes.length && commonMistakes[commonMistakes.length - 1].length === 1) commonMistakes[commonMistakes.length - 1].push(line);
        else commonMistakes.push([line]);
      }
      commonMistakes = commonMistakes.filter((pair) => pair.length === 2);
    }

    // Cross-curricular / cross-unit connections: authored in almost every
    // reference doc but previously unused.
    const connections = sectionBlocks(reference, /connection/i)
      .map((block) => tidy(block.text))
      .filter((text) => text.length > 20 && !/^connections?\b/i.test(text))
      .map((text) => {
        const m = text.match(/^(Unit\s+\d+[^:—-]*|[A-Z][A-Za-z ]{2,30}?)\s*[:—-]\s*(.+)$/);
        return m ? { area: tidy(m[1]), text: sentence(m[2], 240) } : { area: "Links", text: sentence(text, 240) };
      }).slice(0, 6);

    terms = terms.slice(0, 12);

    // Rich vocabulary: pair each term with an example sentence from the
    // source that actually uses the word, plus a short category.
    const corpus = sentencesFrom(lesson, reference, experimentsDoc || EMPTY_DOC);
    const vocabulary = terms.map(([term, meaning]) => {
      const head = tidy(term).replace(/\s*\(.*?\)\s*/g, " ").trim();
      const key = head.split(/[\/,]/)[0].trim();
      const wordRe = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const example = corpus.find((s) => wordRe.test(s) && s.toLowerCase() !== tidy(meaning).toLowerCase() && !/^[a-z ]+:/i.test(s)) || "";
      return { term: head, meaning: tidy(meaning), example: sentence(example, 220), letter: (head[0] || "?").toUpperCase() };
    });
    return { rules: rules.slice(0, 6), terms, vocabulary, commonMistakes: commonMistakes.slice(0, 6), connections };
  }

  function experimentsData(experiments) {
    const starts = experiments.blocks
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => /^(Experiment|Investigation)\s+\d+\s*[—:\-]/i.test(tidy(block.text)));
    return starts.map(({ block, index }, position) => {
      const end = starts[position + 1]?.index ?? experiments.blocks.length;
      const body = experiments.blocks.slice(index, end);
      const grab = (marker) => {
        const at = body.findIndex((item) => marker.test(tidy(item.text)));
        if (at < 0) return [];
        const stopMarkers = /^(aim|make a hypothesis|hypothesis|materials|method|recording sheet|analysis questions?|what to observe|safety|conclusion|going further)\b/i;
        const out = [];
        for (let cursor = at + 1; cursor < body.length; cursor += 1) {
          const text = tidy(body[cursor].text);
          if (stopMarkers.test(text)) break;
          if (text.length > 3) out.push(text);
        }
        return out;
      };
      return {
        title: tidy(block.text).replace(/^(Experiment|Investigation)\s+\d+\s*[—:\-]\s*/i, ""),
        aim: sentence(grab(/^Aim\b/i).join(" "), 260),
        hypothesis: sentence(grab(/^(Make a Hypothesis|Hypothesis)\b/i).join(" "), 260),
        materials: sentence(grab(/^Materials\b/i).join("; "), 300) || "Safe everyday materials from home",
        steps: grab(/^Method\b/i).slice(0, 6),
        analysis: grab(/^Analysis Questions?\b/i).slice(0, 4),
      };
    }).filter((item) => item.title);
  }

  function practiceData(practice, activitiesDoc) {
    // Everything before the first answer-key marker is tasks; everything
    // after is answer keys. This survives every naming variant in the packs.
    const firstKeyIndex = practice.blocks.findIndex((block) =>
      /^Answer Keys?\b/i.test(block.section) || /^Answer Keys?\b/i.test(tidy(block.text)));
    const taskBlocks = firstKeyIndex >= 0 ? practice.blocks.slice(0, firstKeyIndex) : practice.blocks;
    const keyBlocks = firstKeyIndex >= 0 ? practice.blocks.slice(firstKeyIndex) : [];
    const names = [...new Set(taskBlocks.map((block) => block.section))].filter((section) => /^Section\s+[A-E]\b/i.test(section));
    // Answer letters appear as "b)", "(b)", "B -", "1. (b)", "1: b", bare
    // table cells, or several answers combined in one block.
    const LETTER_RE = /^[^a-z0-9(]*(?:\d+\s*[).:\-]?\s*)?\(?([a-d])\)?(?:\b|\s|[).:—\-]|$)/i;
    const normalizeKeys = (rawKeys) => {
      if (rawKeys.length <= 2 && (rawKeys.join(" ").match(/\d+[.):]\s*\(?[a-d]\)?\b/gi) || []).length >= 5) {
        return rawKeys.join(" ").split(/(?=\b\d+[.):]\s*\(?[a-d]\)?\b)/i).map(tidy).filter((text) => /^\d+[.):]/.test(text));
      }
      return rawKeys;
    };
    const keysFor = (letter) => {
      const raw = keyBlocks.filter((block) => new RegExp(`\\bSection\\s+${letter}\\b`, "i").test(block.section) && block.content_kind !== "Heading");
      const tableCells = raw.filter((block) => block.block_type === "Table cell");
      if (tableCells.length > raw.length / 2) {
        // Rebuild answer rows from table cells (Q | answer | explanation),
        // starting a new row whenever the column resets.
        const rows = [];
        let current = null;
        let previousCol = 0;
        for (const cell of tableCells) {
          if (!current || cell.table_col <= previousCol) {
            current = [];
            rows.push(current);
          }
          current.push(tidy(cell.text));
          previousCol = cell.table_col;
        }
        const list = rows
          .map((cells) => cells.join(" "))
          .filter((text) => text.length > 1 && !/^(q|question|answer|why|explanation)\b/i.test(text));
        return normalizeKeys(list);
      }
      return normalizeKeys(raw.map((block) => tidy(block.text)).filter((text) => text.length > 1));
    };
    const levelFor = { A: "Warm-up", B: "Core", C: "Core", D: "Challenge", E: "Extension" };
    const items = [];
    let mcqs = [];
    let contradictions = 0;
    for (const section of names) {
      const letter = section.match(/^Section\s+([A-E])/i)[1].toUpperCase();
      const isInstruction = (text) => text.length < 110 && !/\(?[a-d]\)\s/i.test(text)
        && /^(choose|circle|tick|select|answer(\s+each|\s+in)|write|read\s+each|match|complete|label|draw|for the grown-up|try every|do not)/i.test(text);
      const tasks = taskBlocks
        .filter((block) => block.section === section && block.content_kind !== "Heading")
        .map((block) => tidy(block.text))
        .filter((text) => text.length > 15 && !isInstruction(text));
      let keys = keysFor(letter);
      keys = letter === "A"
        ? keys.filter((key) => LETTER_RE.test(key))
        : keys.filter((key) => !/^(each answer|answers? (are|below)|explanations?$|why$|question$|q$)/i.test(key) && key.length > 8);
      tasks.forEach((prompt, index) => {
        const answer = keys[index] ? sentence(keys[index], 300) : "Work through the task and check with your teacher or the reference card.";
        const optionStart = prompt.search(/[\s:]\(?a\)\s/i);
        if (letter === "A" && optionStart > 5 && /\(?b\)\s/i.test(prompt)) {
          const stem = tidy(prompt.slice(0, optionStart + 1));
          const optionsPart = prompt.slice(optionStart + 1);
          const all = optionsPart.split(/\s*\(?[a-d]\)\s+/i).map(tidy).filter(Boolean).slice(0, 4);
          const keyText = keys[index] || "";
          const letterMatch = keyText.match(LETTER_RE);
          let answerText = "";
          if (letterMatch) answerText = all["abcd".indexOf(letterMatch[1].toLowerCase())] || "";
          const textMatch = all.find((option) => option.length > 3 && keyText.toLowerCase().includes(option.slice(0, 30).toLowerCase()));
          if (answerText && textMatch && textMatch !== answerText
              && !keyText.toLowerCase().includes(answerText.slice(0, 30).toLowerCase())) contradictions += 1;
          if (!answerText) answerText = textMatch || "";
          if (all.length >= 3 && answerText) mcqs.push({ question: stem, options: all, answer: answerText, explanation: sentence(keyText.replace(/^[^a-z0-9(]*(?:\d+\s*[).:\-]?\s*)?\(?[a-d]\)?\s*[).:—\-]*\s*/i, ""), 220) || `${answerText}.` });
        }
        items.push({
          id: `p${String(items.length + 1).padStart(2, "0")}`,
          level: levelFor[letter] || "Core",
          prompt,
          answer,
          hint: letter === "A" || letter === "B" ? "Use the unit's key words and explain your thinking." : "Apply the science ideas to the situation before answering.",
        });
      });
    }
    if (contradictions >= 3) mcqs = []; // Systematic key misalignment: fall back to safe vocabulary quizzes.
    if (!items.length && activitiesDoc.blocks.length) {
      activitiesDoc.blocks.filter((block) => block.content_kind === "Task").slice(0, 12).forEach((block, index) => items.push({
        id: `p${String(index + 1).padStart(2, "0")}`,
        level: ["Warm-up", "Core", "Challenge", "Extension"][Math.floor(index / 3) % 4],
        prompt: tidy(block.text),
        answer: "Talk through your answer with a teacher, parent or study partner.",
        hint: "Observe carefully and use the unit's key words.",
      }));
    }
    return { items, mcqs };
  }

  function assessmentData(mcqs, reference, unitNo) {
    const questions = mcqs.slice(0, 12).map((mcq, index) => ({
      id: `q${String(index + 1).padStart(2, "0")}`,
      type: index < 4 ? "Concept" : index < 8 ? "Application" : "Reasoning",
      outcomeId: `lo${String(index % 8 + 1).padStart(2, "0")}`,
      difficulty: index < 4 ? "Basic" : index < 9 ? "Core" : "Challenge",
      question: mcq.question,
      options: [...new Set(mcq.options)].slice(0, 4),
      answer: mcq.answer,
      hint: `Use the Unit ${unitNo} Science Words reference.`,
      explanation: mcq.explanation,
    }));
    const terms = reference.terms.length >= 4 ? reference.terms : [["Science", "Studying the world by observing and testing"], ["Observe", "Look carefully and notice details"], ["Predict", "Say what you think will happen"], ["Record", "Write or draw what you find"]];
    let index = questions.length;
    while (questions.length < 12) {
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
      questions.push({ id: `q${String(questions.length + 1).padStart(2, "0")}`, type: questions.length < 4 ? "Concept" : questions.length < 8 ? "Application" : "Reasoning", outcomeId: `lo${String(questions.length % 8 + 1).padStart(2, "0")}`, difficulty: questions.length < 4 ? "Basic" : questions.length < 9 ? "Core" : "Challenge", question: reverse ? `Which science word matches this meaning: ${entry[1]}?` : `What does “${entry[0]}” mean?`, options: [...new Set(options)].slice(0, 4), answer, hint: `Use the Unit ${unitNo} Science Words reference.`, explanation: `${entry[0]} means ${entry[1]}.` });
      index += 1;
    }
    return { passPercent: 80, questions };
  }

  function gameData(assessment, terms, unitNo) {
    const names = ["Quick Match", "Concept Quest", "Lab Detective", "Fact Runner", "Vocabulary Vault", "Challenge Cards", "Think Fast", "Explain It", "Real-Life Round", "Spot the Error", "Mastery Mix", "Unit Champion"];
    return names.map((name, index) => ({
      id: `u${unitNo}-game-${index + 1}`,
      icon: ["?", "★", "◫", "→", "Σ", "◇", "⚡", "☁", "⌂", "!", "≡", "T"][index],
      skill: terms[index % Math.max(1, terms.length)]?.[0] || `Unit ${unitNo} skill`,
      title: `${name}: ${terms[index % Math.max(1, terms.length)]?.[0] || "Science"}`,
      description: `Practise ${terms[index % Math.max(1, terms.length)]?.[0]?.toLowerCase() || "the unit ideas"} through four short challenges.`,
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

  function buildUnit(unitMeta, position) {
    const unitNo = unitMeta.unit;
    const term = termOf(position);
    const lesson = docFor(unitNo, "Lesson");
    const practiceDoc = docFor(unitNo, "Practice");
    const experimentsDoc = docFor(unitNo, "Experiments");
    const activitiesDoc = docFor(unitNo, "Activities");
    const referenceDoc = docFor(unitNo, "Reference");
    const title = unitTitle(lesson, unitMeta.title, unitNo);
    const override = grade === 1 ? GRADE1[unitNo] : null;
    const reference = referenceData(referenceDoc, lesson, experimentsDoc);
    if (override && override.vocabulary) {
      // Replace weak checklist-derived vocabulary with authored terms.
      reference.vocabulary = override.vocabulary.map(([term, meaning]) => ({ term, meaning, example: "", letter: (term[0] || "?").toUpperCase() }));
      reference.terms = override.vocabulary;
    }
    const experiments = experimentsData(experimentsDoc.blocks.length ? experimentsDoc : activitiesDoc);
    const { items: practice, mcqs: rawMcqs } = practiceData(practiceDoc, activitiesDoc);
    const mcqs = override && override.quiz ? override.quiz.map((entry) => ({ ...entry })) : rawMcqs;
    let concepts = conceptList(lesson, title);
    if (override && override.conceptTitles) {
      // Keep the source explanations but give each concept a clean, authored
      // title (Grade 1's guide has no concept headings of its own).
      concepts = override.conceptTitles.map((ctitle, index) => ({
        id: `concept-${index + 1}-${slug(ctitle)}`,
        title: ctitle,
        explanation: concepts[index]?.explanation || `Learn about ${ctitle.toLowerCase()} by looking, listening and talking together.`,
        example: concepts[index]?.example || ctitle,
      }));
    }
    let outcomes = (override && override.outcomes) ? override.outcomes.slice() : outcomeList(lesson);
    if (!outcomes.length) outcomes = concepts.map((concept) => `Explore and talk about ${concept.title.toLowerCase()}.`).slice(0, 6);
    const assessment = assessmentData(mcqs, reference, unitNo);
    const overview = lesson.blocks.map((block) => tidy(block.text)).find((text, index) => index > 2 && text.length > 180) || `Explore ${title} through concepts, investigations, methods and real-life practice.`;

    const workedExamples = [];
    const weHeads = lesson.blocks.map((block, index) => ({ block, index })).filter(({ block }) => /^Worked Example/i.test(tidy(block.text)));
    for (const { block, index } of weHeads.slice(0, 12)) {
      const body = lesson.blocks.slice(index + 1, index + 6).map((item) => tidy(item.text)).filter((text) => text.length > 10);
      workedExamples.push({ id: `we${String(workedExamples.length + 1).padStart(2, "0")}`, outcomeId: `lo${String(workedExamples.length % 8 + 1).padStart(2, "0")}`, difficulty: "Intermediate", title: tidy(block.text).replace(/^Worked Examples?\s*[—:\-]?\s*/i, "") || `Worked example`, prompt: sentence(body[0] || title, 260), solution: sentence(body.slice(1).join(" ") || body[0] || title, 520) });
    }
    while (workedExamples.length < 8 && practice.length) {
      const item = practice[workedExamples.length % practice.length];
      workedExamples.push({ id: `we${String(workedExamples.length + 1).padStart(2, "0")}`, outcomeId: `lo${String(workedExamples.length % 8 + 1).padStart(2, "0")}`, difficulty: workedExamples.length < 4 ? "Basic" : "Intermediate", title: `Guided example ${workedExamples.length + 1}`, prompt: item.prompt, solution: item.answer });
    }

    const methods = experiments.slice(0, 6).map((experiment, index) => ({
      id: `method-${index + 1}`,
      outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`,
      difficulty: index < 3 ? "Core" : "Challenge",
      title: experiment.title,
      example: experiment.aim || experiment.title,
      steps: experiment.steps.length >= 3 ? experiment.steps.slice(0, 5) : [...experiment.steps, "Observe carefully and record what you see.", "Compare your result with your hypothesis."].slice(0, 5),
    }));
    while (methods.length < 4 && concepts.length) {
      const concept = concepts[methods.length % concepts.length];
      methods.push({ id: `method-${methods.length + 1}`, outcomeId: "lo01", difficulty: "Core", title: concept.title, example: concept.example, steps: ["Read the idea and put it in your own words.", "Find one example of it around your home.", "Explain it to someone using the key words."] });
    }

    const activities = experiments.slice(0, 6).map((experiment) => ({ title: experiment.title, materials: experiment.materials, steps: experiment.steps.length ? experiment.steps.slice(0, 5) : ["Follow the investigation plan in your experiments book."] }));
    // Every unit shows six investigations. When the source has fewer, add
    // concept-grounded "explore at home" investigations to reach six.
    const investigationIdeas = [
      { verb: "Observe", tail: "Watch it closely for a few minutes and note three things you notice." },
      { verb: "Sort", tail: "Find examples at home and sort them into groups, then explain your rule." },
      { verb: "Test", tail: "Change one thing, keep everything else the same, and record what happens." },
      { verb: "Compare", tail: "Look at two examples side by side and list how they are the same and different." },
      { verb: "Model", tail: "Build or draw a model of it and label the important parts." },
      { verb: "Record", tail: "Make a simple chart or drawing to show what you found and share it." },
    ];
    let ideaCursor = 0;
    while (activities.length < 6) {
      const concept = concepts[activities.length % Math.max(1, concepts.length)] || { title, example: overview };
      const idea = investigationIdeas[ideaCursor % investigationIdeas.length];
      ideaCursor += 1;
      activities.push({
        title: `${idea.verb}: ${concept.title}`,
        materials: "Notebook, pencil and safe things you can find at home",
        steps: [
          `Look for an example of ${concept.title.toLowerCase()} around your home or outside.`,
          idea.tail,
          "Write or draw what you observed, using the unit's science words.",
          "Explain your finding to a family member or your teacher.",
        ],
      });
    }
    // Grade 1: give investigations clean authored names in order.
    if (override && override.experimentTitles) {
      activities.forEach((activity, index) => { if (override.experimentTitles[index]) activity.title = override.experimentTitles[index]; });
    }

    const explorations = experiments.slice(0, 6).map((experiment, index) => ({
      id: `explore-${index + 1}`,
      outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`,
      difficulty: index < 3 ? "Discover" : "Explore",
      title: experiment.title,
      context: experiment.aim || sentence(overview, 260),
      prompt: experiment.hypothesis || experiment.analysis[0] || `What do you predict will happen in ${experiment.title}?`,
      answer: sentence(experiment.analysis.join(" ") || "Run the investigation, record your observations, and compare them with your prediction.", 300),
      modelType: `model-${index + 1}`,
      hint: "Predict first, then observe, then explain.",
      explanation: sentence(experiment.aim || overview, 260),
    }));
    while (explorations.length < 4 && practice.length) {
      const item = practice[(explorations.length * 2) % practice.length];
      explorations.push({ id: `explore-${explorations.length + 1}`, outcomeId: "lo01", difficulty: "Explore", title: concepts[explorations.length % Math.max(1, concepts.length)]?.title || title, context: sentence(overview, 260), prompt: item.prompt, answer: item.answer, modelType: `model-${explorations.length + 1}`, hint: item.hint, explanation: item.answer });
    }

    const visualModels = concepts.map((concept, index) => ({ id: `model-${index + 1}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, title: concept.title, modelType: `concept-model-${index + 1}`, purpose: sentence(concept.explanation, 220), defaultNumber: null }));

    const pool = practice.length ? practice : explorations.map((explore, index) => ({ id: `p${index}`, level: "Core", prompt: explore.prompt, answer: explore.answer, hint: explore.hint }));
    const realProblems = pool.filter((item) => item.level === "Challenge" || item.level === "Extension").slice(0, 6).map((item, index) => ({ id: `rp${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 3 ? "Core" : "Challenge", context: ["Home", "Market", "Travel", "School", "Community", "Nature"][index], prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: item.answer }));
    while (realProblems.length < 4 && pool.length) {
      const item = pool[(realProblems.length + 3) % pool.length];
      realProblems.push({ id: `rp${String(realProblems.length + 1).padStart(2, "0")}`, outcomeId: "lo01", difficulty: "Core", context: "Daily life", prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: item.answer });
    }

    const reasoningPrompts = pool.filter((item) => item.level === "Core").slice(0, 6).map((item, index) => ({ id: `reason${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 3 ? "Core" : "Challenge", responseMode: "text", prompt: item.prompt, keyIdeas: reference.terms.slice(index, index + 3).map((termPair) => termPair[0]), modelAnswer: item.answer }));
    while (reasoningPrompts.length < 4 && concepts.length) {
      const concept = concepts[reasoningPrompts.length % concepts.length];
      reasoningPrompts.push({ id: `reason${String(reasoningPrompts.length + 1).padStart(2, "0")}`, outcomeId: "lo01", difficulty: "Core", responseMode: "text", prompt: `Explain the key idea in ${concept.title}.`, keyIdeas: reference.terms.slice(0, 3).map((termPair) => termPair[0]), modelAnswer: concept.explanation });
    }

    return {
      schemaVersion: "Ehel Science Runtime v1.0",
      generatedAt: new Date().toISOString(),
      stage: { id: stageId, label: stageLabel }, subject: "Science",
      term: { id: `t0${term}`, label: `Term ${term}` },
      unit: { unitId: unitMeta.unit_id, unitNo, unitTitle: title, unitOverview: sentence(overview, 760), learningPath: ["Preview the goals and core ideas", "Explore concepts and investigations", "Learn methods and study worked examples", "Complete guided practice, experiments and games", "Apply, explain and complete the Unit Challenge"], reviewStatus: "Curriculum review required" },
      cambridge,
      provenance: { contentPackage, framework: cambridgeLabel, sourceArchive: source.metadata.source_archive, sourceDocuments: [lesson, experimentsDoc, activitiesDoc, practiceDoc, referenceDoc].filter((doc) => doc !== EMPTY_DOC).map((doc) => doc.source_file), sourceBlockCount: unitMeta.source_block_count, transformation: `Structured from the ${cambridgeLabel} workbook source documents for screen presentation.`, reviewStatus: unitMeta.review_status },
      media: { lectureStatus: "Video pending", lectureVideo: null, poster: null },
      outcomes, concepts, explorations, visualModels, methods, workedExamples,
      practice: practice.slice(0, 12), activities, reference,
      fluency: pool.slice(0, 12).map((item, index) => ({ id: `fl${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 4 ? "Round 1" : index < 8 ? "Round 2" : "Round 3", prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: item.answer })),
      realProblems, reasoningPrompts, assessment,
      games: { masteryScore: 3, games: gameData(assessment, reference.terms, unitNo) },
      selfAssessment: outcomes.slice(0, 8).map((outcome) => `I can ${outcome.charAt(0).toLowerCase()}${outcome.slice(1)}`),
    };
  }

  fs.mkdirSync(unitDir, { recursive: true });
  const warnings = [];
  const builtUnits = [];
  source.units.forEach((unitMeta, position) => {
    const runtime = buildUnit(unitMeta, position);
    builtUnits.push(runtime);
    for (const key of ["outcomes", "concepts", "practice", "workedExamples", "activities"]) {
      if (!runtime[key] || !runtime[key].length) warnings.push(`grade ${grade} unit ${unitMeta.unit}: empty ${key}`);
    }
    fs.writeFileSync(path.join(unitDir, `unit-${unitMeta.unit}.json`), `${JSON.stringify(runtime, null, 2)}\n`, "utf8");
  });

  const manifest = {
    schemaVersion: "Ehel Science Course Manifest v1.0",
    stage: { id: stageId, label: stageLabel },
    subject: "Science",
    defaultUnit: source.units[0]?.unit || 1,
    sourcePackage: contentPackage,
    packageReviewStatus: "Imported - curriculum review required",
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
  };
  fs.writeFileSync(path.join(gradeDir, "data", "course-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const capstoneQuestions = builtUnits.flatMap((unit) => unit.assessment.questions.slice(0, 2).map((question, index) => ({
    ...question,
    id: `cap-u${String(unit.unit.unitNo).padStart(2, "0")}-q${index + 1}`,
    unitNo: unit.unit.unitNo,
    unitTitle: unit.unit.unitTitle,
  })));
  const termUnits = (term) => manifest.units.filter((unit) => unit.termId === `t0${term}`).map((unit) => unit.number);
  const allUnitNumbers = manifest.units.map((unit) => unit.number);
  const gradeCapstone = {
    schemaVersion: "Ehel Science Stage Capstone v1.0",
    stage: { id: stageId, label: stageLabel },
    title: `Run a ${stageLabel} Science Fair`,
    overview: `Bring together everything from ${stageLabel} Science to run a science fair that teaches visitors the most important ideas from this stage through real investigations.`,
    project: {
      drivingQuestion: `How can we use the science from ${stageLabel} to run an accurate, safe and exciting science fair for our school or community?`,
      finalProduct: "Create a science-fair plan with a live investigation, labelled displays, a safety checklist, a visitor survey with a data display, and a short explanation of your scientific decisions.",
      stages: [
        { id: "foundations", title: "1. Foundations display", units: termUnits(1), prompt: `Choose the two most important ideas from Units ${termUnits(1).join(", ")}. Build a display that teaches each idea with a model or diagram, an example and a check question.`, evidence: "Two labelled displays with models, examples and check questions" },
        { id: "investigation", title: "2. Live investigation", units: termUnits(2).length ? termUnits(2) : allUnitNumbers, prompt: `Pick one investigation from Units ${(termUnits(2).length ? termUnits(2) : allUnitNumbers).join(", ")} and run it live: state your hypothesis, follow the method, record results and explain your conclusion.`, evidence: "A completed investigation with hypothesis, method, results and conclusion" },
        { id: "connections", title: "3. Connections wall", units: termUnits(3).length ? termUnits(3) : allUnitNumbers, prompt: `Create a connections wall that links ideas from Units ${(termUnits(3).length ? termUnits(3) : allUnitNumbers).join(", ")} to everyday life, with at least three labelled connections.`, evidence: "A connections wall with three labelled links to daily life" },
        { id: "present", title: "4. Present and explain", units: allUnitNumbers, prompt: "Present your science fair. Explain at least three scientific choices, check that your conclusions match your evidence and identify one improvement you would make.", evidence: "Spoken, written or recorded scientific explanation" },
      ],
      evidenceChecklist: ["Two foundation displays with models", "A completed live investigation", "A safety checklist for every activity", "A connections wall with three links", "A survey with organised data display", "A scientific explanation and reflection"],
      rubric: [
        { criterion: "Scientific accuracy", secure: "Observations, measurements, models and conclusions are accurate and checked." },
        { criterion: "Investigation skills", secure: "Hypotheses, fair testing, recording and conclusions follow the scientific method." },
        { criterion: "Models and representations", secure: "Labels, diagrams, tables or charts make the science visible." },
        { criterion: "Reasoning and communication", secure: "Decisions are explained using appropriate science words and evidence." },
      ],
    },
    quiz: { passPercent: 80, questions: capstoneQuestions },
    reviewStatus: "Curriculum review required",
  };
  fs.writeFileSync(path.join(gradeDir, "data", "grade-capstone.json"), `${JSON.stringify(gradeCapstone, null, 2)}\n`, "utf8");

  const indexHtml = `<!doctype html>
<html lang="en" data-stage="${grade}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening ${stageLabel} Science</title></head>
<body><p>Opening the shared Science course…</p><script type="module" src="../shared/grade-redirect.js"></script></body>
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
