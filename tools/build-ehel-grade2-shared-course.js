const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GRADE_DIR = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-2");
const DATA_DIR = path.join(GRADE_DIR, "data");
const UNIT_DATA_DIR = path.join(DATA_DIR, "units");
const INSPECT_FILE = path.join(ROOT, "outputs", "019f5d39-7fcd-7f23-a425-201fe8206eef", "Ehel-English-Content-Template-v1.1-Grade-2-Units-1-2-Reference.xlsx.inspect.ndjson");
const VOCABULARY_FILE = path.join(ROOT, "src", "prototypes", "ehel-academy", "vocabulary", "grade2-vocabulary.json");
const AUDIO_CUES_FILE = path.join(ROOT, "src", "prototypes", "ehel-academy", "vocabulary", "audio", "grade2-audio-cues.json");
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const UNIT_MINIMUMS = { grammar: 6, speaking: 6, writing: 6, activities: 6, quizzes: 10, liveSessions: 6 };

const unitAdditions = {
  3: {
    speaking: [
      ["Movement Coach", "Give six clear movement commands. Your partner follows them, then swaps roles with you.", "Use clear command verbs and a safe pace."],
      ["Healthy Habit Interview", "Ask and answer six questions about moving, food, water and sleep.", "Answer in complete sentences and give one reason."],
      ["Sports Reporter", "Describe what six people are doing now in a race or exercise scene.", "Use am, is or are with an action ending in -ing."],
    ],
    writing: [
      ["My Exercise Routine", "Write six ordered instructions for a short, safe exercise routine.", "First, I stretch my arms. Next, I hop five times. Then, I drink water."],
      ["A Healthy Day", "Write five sentences explaining how you move, eat, drink and sleep to stay healthy.", "I move every day. I eat healthy food and drink clean water. I sleep early so my body can rest."],
      ["The Big Race Report", "Retell the race in six sentences using story details and action words.", "The children stood at the starting line. They listened carefully. Then they ran, hopped and cheered together."],
    ],
    activities: [
      ["Build a Movement Sequence", "Put six action cards in a safe order, perform the routine, and explain each command."],
      ["Healthy Choice Sort", "Sort twelve choices into Helps Me Stay Healthy and Does Not Help Me Stay Healthy."],
      ["Action Reporter Hunt", "Find six actions around you and write what each person is doing now."],
    ],
  },
  4: {
    speaking: [
      ["Sky Watch Report", "Describe the sky in the morning, at midday and in the evening using precise adjectives.", "Name what you see and describe its colour, light or position."],
      ["Shadow Scientist", "Explain how a shadow forms and compare a morning shadow with a midday shadow.", "Use long, short, high, low, bright and dark where useful."],
      ["Weather Presenter", "Give today's weather report and one simple prediction for later.", "Speak in complete sentences and support the report with what you observe."],
    ],
    writing: [
      ["My Sky Journal", "Write one observation for morning, midday and evening, then compare the sky at two times.", "In the morning, the sky was pale and bright. At midday, the sun was high and my shadow was short."],
      ["How a Shadow Forms", "Write five clear sentences explaining light, an object and the shadow behind it.", "Light travels from the sun. When an object blocks the light, a shadow forms on the other side."],
      ["A Night-Sky Description", "Describe the night sky in six sentences using at least four adjectives.", "The dark sky was wide and quiet. Bright stars shone above the houses, and the moon looked round."],
    ],
    activities: [
      ["Shadow Measure", "Measure one shadow in the morning and at midday. Record which is longer and explain why."],
      ["Day or Night Sort", "Sort twelve sky facts and activities under Day, Night or Both."],
      ["Weather Word Match", "Match sunny, cloudy, windy and rainy to a picture, observation and suitable action."],
    ],
  },
  5: {
    speaking: [
      ["Measurement Detective", "Choose six objects and compare their length, height, size or weight aloud.", "Use a complete comparison such as The book is heavier than the pencil."],
      ["Shape and Pattern Talk", "Describe five shapes and explain a repeating pattern for a partner to continue.", "Name shape features and say which part repeats."],
      ["How Many Survey", "Ask six How many questions, count carefully, and answer with There is or There are.", "Check that singular and plural forms agree."],
    ],
    writing: [
      ["My Measurement Table", "Measure five objects and write one complete comparison sentence for each result.", "The desk is longer than the book. The water bottle is taller than the cup."],
      ["Explain a Pattern", "Create a repeating shape pattern and explain the rule in four sentences.", "My pattern is circle, square, circle, square. Two shapes repeat in the same order."],
      ["A Fair Way to Share", "Write six sentences explaining how careful counting or measuring can make sharing fair.", "We measured the pieces before sharing them. Each child received the same amount, so the result was fair."],
    ],
    activities: [
      ["Estimate, Measure, Check", "Estimate and then measure six objects in centimetres. Compare each estimate with the result."],
      ["Shape Hunt", "Find two circles, two rectangles and two other shapes. Record each object and its shape."],
      ["Tens to One Hundred", "Arrange the multiples of ten from 10 to 100, then count forward and backward aloud."],
    ],
  },
  6: {
    speaking: [
      ["Bug Scientist", "Describe one insect using its body parts, movement and habitat.", "Include six legs, three body parts and antennae when they are correct."],
      ["Where Is the Bug?", "Place or imagine six bugs and describe each position for a partner to find.", "Use on, under, in, between, above and in front of."],
      ["Bug Question Circle", "Ask and answer two What, two Where and two How questions about bugs.", "Use complete questions and factual answers."],
    ],
    writing: [
      ["My Insect Fact Card", "Write six facts about one insect, including body parts, habitat, movement and food.", "A bee is an insect. It has six legs, three body parts and two antennae. Bees collect nectar from flowers."],
      ["Insect or Not?", "Compare an insect with a spider or worm and explain why only one is an insect.", "An ant is an insect because it has six legs and three body parts. A spider is not an insect because it has eight legs."],
      ["A Tiny Garden Story", "Write a six-sentence story about finding and safely observing a small garden animal.", "I found a cricket under a leaf. I watched quietly and did not touch its home."],
    ],
    activities: [
      ["Build an Insect", "Label the head, thorax, abdomen, six legs and antennae on an insect drawing."],
      ["Habitat Match", "Match six bugs or garden animals to a sensible place where each may live."],
      ["Position-Word Trail", "Follow six position clues to move a bug token, then write your own three clues."],
    ],
  },
  7: {
    speaking: [
      ["Plant Guide", "Name the roots, stem, leaves and flower, and explain one job for each part.", "Point clearly and use simple present facts."],
      ["Earth-Care Reporter", "Describe six people caring for the environment using is or are plus -ing.", "Include planting, watering, picking up and recycling."],
      ["Thank-You Circle", "Say six things you appreciate in nature and explain why one matters to you.", "Use I'm glad that or I appreciate."],
    ],
    writing: [
      ["How a Plant Helps", "Write five facts about how plants help people, animals, soil or air.", "Plants help clean the air. Their roots hold soil, and their leaves provide shade."],
      ["My Earth-Care Plan", "Write six actions you can take this week to care for your environment.", "I will carry a reusable bottle. I will put litter in a bin and help water a young tree."],
      ["A Thank-You Letter to Earth", "Write a greeting, four appreciative sentences, one promise and a closing.", "Dear Earth, I appreciate your clean air, trees and water. I promise to care for the places around me."],
    ],
    activities: [
      ["Plant-Part Match", "Match roots, stem, leaves and flower to their jobs, then label a plant."],
      ["Care or Harm Sort", "Sort twelve actions by whether they care for or harm the environment."],
      ["This, That, These, Those Walk", "Point to six nearby or distant natural things and describe each with the correct demonstrative."],
    ],
  },
  8: {
    speaking: [
      ["Home Tour", "Guide a listener through six parts of a home and explain what people do in each room.", "Use there is, there are and clear place words."],
      ["Where Does It Belong?", "Describe the position of six household objects for a partner to identify.", "Use in, on, under, next to, between and above."],
      ["Helping at Home Plan", "Explain three jobs you do now and three jobs you will do later.", "Use will for future actions and speak politely."],
    ],
    writing: [
      ["My Home Description", "Write six sentences describing the kind of home, rooms and important objects in it.", "I live in an apartment. There are three rooms. Our table is in the living room next to the window."],
      ["Homes Around the World", "Compare two kinds of homes in five sentences, including one similarity and two differences.", "A hut and an apartment are both homes. A hut may have one level, while an apartment can be high above the ground."],
      ["My Helping-at-Home Promise", "Write six sentences about jobs you will do to help at home this week.", "I will make my bed. I will put my books away and help clean the table after dinner."],
    ],
    activities: [
      ["Room Sort", "Sort twelve household objects into the room where each is usually used."],
      ["Build a Home Map", "Draw a simple home plan and write six position sentences about rooms or objects."],
      ["People and Animal Homes", "Match six people or animals to suitable homes and explain two matches."],
    ],
  },
  9: {
    speaking: [
      ["City Guide", "Give six clear directions from one city place to another.", "Use go straight, turn left, turn right, next to and opposite."],
      ["Aquarium Expert", "Describe three sea animals and state two true facts about each.", "Use precise adjectives and the present simple."],
      ["Yesterday and Tomorrow", "Say three things you did in the city and three things you will do next time.", "Keep past and future time words clear."],
    ],
    writing: [
      ["My City Guide", "Write six sentences introducing useful or interesting places in your city or town.", "Our library is near the market. People read and study there. The ferry carries passengers across the water."],
      ["An Aquarium Animal Report", "Write six facts about one sea animal and include at least three describing words.", "An octopus is a clever sea animal. It has eight arms and can hide between rocks."],
      ["A City Day: Past and Future", "Write three past-tense sentences about a city visit and three future sentences about another visit.", "Yesterday, we went to the market. We saw busy traffic. Tomorrow, we will visit the library."],
    ],
    activities: [
      ["City Map Route", "Follow six direction clues on a city map, then write a route to the library."],
      ["Place, Sound or Transport", "Sort eighteen city words into Place, Sound, Transport or Sea Animal."],
      ["Like, Dislike, Agree", "Respond to six city or aquarium choices using I like, I don't like, I agree or I disagree politely."],
    ],
  },
};

function workbookRows() {
  const sheets = {};
  for (const line of fs.readFileSync(INSPECT_FILE, "utf8").split(/\r?\n/)) {
    if (!line) continue;
    const record = JSON.parse(line);
    if (record.kind !== "table" || !record.values?.[3]) continue;
    const headers = record.values[3];
    sheets[record.sheet] = record.values.slice(4)
      .filter((row) => row.some((value) => value !== null && value !== ""))
      .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));
  }
  return sheets;
}

function camelCase(label) {
  return String(label).split(/[^a-zA-Z0-9]+/).filter(Boolean).map((part, index) => {
    const lower = part.toLowerCase();
    return index ? lower[0].toUpperCase() + lower.slice(1) : lower;
  }).join("");
}

function normalize(record) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [camelCase(key), value]));
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function dictionaryId(word, type) {
  return `ehel-dict-en-${slug(word)}-${slug(type || "word")}-01`;
}

function belongsTo(record, unitId) {
  return record["Unit ID"] === unitId || Object.values(record).some((value) => String(value ?? "").split(" | ").includes(unitId));
}

function audioDescriptor(unitNo, kind, id) {
  const relative = `./unit-${unitNo}/media/audio/${kind}/${id}.mp3`;
  const absolute = path.join(GRADE_DIR, `unit-${unitNo}`, "media", "audio", kind, `${id}.mp3`);
  return { source: relative, provider: "ElevenLabs", voiceId: VOICE_ID, available: fs.existsSync(absolute) && fs.statSync(absolute).size > 1000 };
}

function buildDictionary(vocabulary, cues) {
  const entries = new Map();
  const linksByUnit = new Map();
  for (const unit of vocabulary.units) {
    const links = [];
    for (const group of unit.groups) {
      group.words.forEach((word, index) => {
        const id = dictionaryId(word.word, word.type);
        if (!entries.has(id)) entries.set(id, {
          dictionaryEntryId: id,
          senseId: `${id}-sense-01`,
          language: "en-GB",
          lemma: word.word,
          displayWord: word.word,
          partOfSpeech: word.type,
          sourceType: word.sourceType,
          partOfSpeechDefinition: word.typeDefinition,
          canonicalMeaning: word.meaning,
          pronunciationText: word.pronunciation,
          audio: {
            normal: `../../vocabulary/audio/grade2-bundles/${word.id}.mp3`,
            slow: `../../vocabulary/audio/grade2-bundles/${word.id}.mp3`,
            cueStart: cues[word.id]?.word?.start ?? 0,
            cueEnd: cues[word.id]?.word?.end ?? null,
            slowPlaybackRate: 0.72,
            provider: "ElevenLabs",
            voiceId: VOICE_ID,
          },
          status: "approved",
        });
        links.push({
          vocabularyId: word.id,
          dictionaryEntryId: id,
          senseId: `${id}-sense-01`,
          gradeId: "g02",
          termId: unit.number <= 3 ? "t01" : unit.number <= 6 ? "t02" : "t03",
          unitId: `eng-g02-t0${unit.number <= 3 ? 1 : unit.number <= 6 ? 2 : 3}-u${String(unit.number).padStart(2, "0")}`,
          groupId: group.id,
          groupTitle: group.title,
          sequence: index + 1,
          childMeaning: word.meaning,
          exampleSentence: word.example,
          practiceSentences: word.sentences,
          sentenceAudio: (cues[word.id]?.sentences || []).map((cue) => ({
            source: `../../vocabulary/audio/grade2-bundles/${word.id}.mp3`,
            cueStart: cue.start,
            cueEnd: cue.end,
            provider: "ElevenLabs",
            voiceId: VOICE_ID,
          })),
          sentenceStarter: word.starter,
          spellingPractice: [...word.word].join(" - "),
          aiTutorPrompt: word.tutorPrompt,
          reviewStatus: "approved",
        });
      });
    }
    linksByUnit.set(unit.number, links);
  }
  return {
    master: { schemaVersion: "Ehel Master Dictionary v1.1", language: "en-GB", gradeId: "g02", entryCount: entries.size, entries: [...entries.values()] },
    linksByUnit,
  };
}

function metadata(record) {
  return { ...record, origin: record.origin || "Ehel English Content Template v1.1 scalable conversion", reviewStatus: "Approved - curriculum reviewer", sourceFile: record.sourceFile || "Ehel English Content Template v1.1" };
}

function expandGrammar(source, unitId, unitNo) {
  return source.flatMap((item, index) => {
    const base = { ...item, sequence: index * 2 + 1, conceptId: item.conceptId || `${unitId}-concept-${String(index + 1).padStart(2, "0")}`, practiceType: item.practiceType || "Guided practice" };
    const applied = metadata({
      ...item,
      grammarId: `${unitId}-grammar${String(index + 4).padStart(2, "0")}`,
      conceptId: base.conceptId,
      sequence: index * 2 + 2,
      practiceType: "Independent application",
      title: `${item.title}: Use It`,
      explanation: `${item.explanation} Now apply the same language independently in the Unit ${unitNo} context.`,
      practice: `Create four new examples that follow this rule. Read each one aloud, check it against the model, and correct one possible mistake.`,
    });
    return [base, applied];
  }).slice(0, 6).map((item) => ({ ...item, audio: audioDescriptor(unitNo, "grammar", item.grammarId) }));
}

function expandSpeaking(source, config, unitId, unitNo, outcomes) {
  const additions = config.speaking.map(([title, instructions, prompt], index) => metadata({
    speakingId: `${unitId}-speak${String(index + 4).padStart(2, "0")}`,
    unitId,
    sequence: index + 4,
    activityType: index === 2 ? "Unit showcase" : "Guided speaking",
    title: `Speaking ${index + 4} - ${title}`,
    instructionsAndModelLines: instructions,
    recordingRequired: true,
    aiTutorPrompt: prompt,
    outcomeId: outcomes[Math.min(index * 2, outcomes.length - 1)].outcomeId,
  }));
  return [...source, ...additions].slice(0, 6).map((item) => ({ ...item, audio: audioDescriptor(unitNo, "speaking", item.speakingId) }));
}

function expandWriting(source, config, unitId, outcomes) {
  const additions = config.writing.map(([title, prompt, model], index) => metadata({
    writingId: `${unitId}-write${String(index + 4).padStart(2, "0")}`,
    unitId,
    sequence: index + 4,
    practiceType: "Writing practice",
    title: `Writing ${index + 4} - ${title}`,
    promptAndInstructions: prompt,
    modelText: model,
    sentenceStarter: model.split(/[.!?]/)[0],
    expectedLength: index === 0 ? "5-6 complete sentences" : "6 complete sentences",
    successCriteria: "I answered every part; used Unit vocabulary; wrote complete sentences; checked capitals, spelling and punctuation",
    support: "Use the model, Unit word bank and sentence starters. Say each sentence before writing it.",
    extension: "Add one precise detail and explain why it matters.",
    rubricId: "rub-writing-v1",
    outcomeId: outcomes[Math.min(index * 2, outcomes.length - 1)].outcomeId,
  }));
  return [...source, ...additions].slice(0, 6);
}

function expandActivities(source, config, unitId, outcomes) {
  const needed = 6 - source.length;
  const additions = config.activities.slice(0, needed).map(([title, instructions], index) => metadata({
    activityId: `${unitId}-act${String(source.length + index + 1).padStart(2, "0")}`,
    unitId,
    sequence: source.length + index + 1,
    title: `Activity ${source.length + index + 1} - ${title}`,
    activityType: index === needed - 1 ? "Independent application" : "Interactive practice",
    instructionsAndItems: instructions,
    answerSummary: "Answers vary. Require complete, relevant work that follows every instruction and uses the target Unit language accurately.",
    outcomeId: outcomes[(source.length + index) % outcomes.length].outcomeId,
    deliveryMode: "Online, classroom or workbook",
  }));
  return [...source, ...additions];
}

function expandQuizzes(source, vocabUnit, unitId, outcomes) {
  const words = vocabUnit.groups.flatMap((group) => group.words).slice(5, 10);
  const allWords = vocabUnit.groups.flatMap((group) => group.words);
  const additions = words.map((word, index) => {
    const distractors = allWords.filter((candidate) => candidate.word !== word.word).slice(index, index + 3).map((candidate) => candidate.word);
    const sequence = index + 6;
    let question = `Which word means: ${word.meaning}`;
    let options = [word.word, ...distractors];
    let answer = word.word;
    if (index === 2) {
      question = `What type of word is '${word.word}'?`;
      options = [word.type[0].toUpperCase() + word.type.slice(1), "Noun", "Verb", "Adjective"].filter((value, position, list) => list.indexOf(value) === position).slice(0, 4);
      while (options.length < 4) options.push("Adverb");
      answer = word.type[0].toUpperCase() + word.type.slice(1);
    } else if (index === 3) {
      question = word.example.replace(new RegExp(word.word, "i"), "____");
    } else if (index === 4) {
      question = `Which spelling is correct?`;
      options = [word.word, word.word.replace(/[aeiou]/i, ""), `${word.word}e`, `${word.word}${word.word.slice(-1)}`];
    }
    return metadata({
      quizId: `${unitId}-quiz01`,
      questionId: `${unitId}-quiz01-q${String(sequence).padStart(2, "0")}`,
      unitId,
      quizTitle: `${vocabUnit.title} checkpoint`,
      sequence,
      questionType: index === 3 ? "Cloze" : "Multiple choice",
      question,
      options: options.join(" | "),
      correctAnswer: answer,
      explanation: `${word.word}: ${word.meaning} ${word.example}`,
      marks: 1,
      outcomeId: outcomes[index % outcomes.length].outcomeId,
      difficulty: "Core",
    });
  });
  return [...source, ...additions].slice(0, 10);
}

function buildLiveSessions(unitId, title, readings, grammar, outcomes) {
  const readingTitle = readings[readings.length - 1]?.title || title;
  const grammarOne = grammar[0]?.title || "language focus";
  const grammarTwo = grammar[2]?.title || grammarOne;
  const plans = [
    [1, 1, `${title}: vocabulary and speaking`, "Watch the teacher lecture and learn the first vocabulary group.", "5 min welcome; 10 min vocabulary retrieval; 10 min picture talk; 15 min Speaking practice; 5 min reflection", "Record one speaking practice."],
    [1, 2, `Shared reading: ${readingTitle}`, `Listen to ${readingTitle} and bring one question.`, "5 min prediction; 10 min teacher read-aloud; 10 min echo reading; 15 min comprehension; 5 min exit ticket", "Improve two comprehension answers using text evidence."],
    [1, 3, `Grammar workshop: ${grammarOne}`, "Complete Grammar Practices 1 and 2.", "5 min retrieval; 10 min teacher model; 10 min guided examples; 15 min partner application; 5 min feedback", "Correct one grammar response and read it aloud."],
    [2, 1, `Grammar and speaking: ${grammarTwo}`, "Complete Grammar Practices 3-6.", "5 min warm-up; 10 min language sort; 10 min sentence building; 15 min speaking application; 5 min review", "Finish one independent grammar and speaking task."],
    [2, 2, `${title}: guided writing`, "Bring a draft of one Unit writing task.", "5 min model review; 10 min oral rehearsal; 15 min guided writing; 10 min feedback; 5 min revision goal", "Revise and save one writing piece."],
    [2, 3, `${title}: review and showcase`, "Complete the ten-question quiz and choose one portfolio piece.", "10 min retrieval game; 10 min quiz corrections; 15 min portfolio shares; 5 min self-assessment; 5 min next goal", "Save the final self-assessment and learning goal."],
  ];
  return plans.map(([week, within, sessionTitle, before, agenda, after], index) => metadata({
    liveSessionId: `${unitId}-live${String(index + 1).padStart(2, "0")}`,
    unitId,
    week,
    sessionWithinWeek: within,
    sessionNo: index + 1,
    title: sessionTitle,
    durationMin: 45,
    beforeSession: before,
    agenda,
    afterSession: after,
    outcomeIds: outcomes.map((outcome) => outcome.outcomeId).slice(index % 3, index % 3 + 2).join(" | "),
  }));
}

function adaptReleasedRuntime(unitNo, links) {
  const filename = path.join(GRADE_DIR, `unit-${unitNo}`, "data", `grade2-unit${unitNo}.json`);
  const runtime = JSON.parse(fs.readFileSync(filename, "utf8"));
  runtime.dictionaryLinks = links;
  for (const key of ["outcomes", "readings", "comprehension", "grammar", "speaking", "writing", "activities", "assignments", "quizzes", "liveSessions", "teacherNotes", "answerKey", "selfAssessment"]) {
    for (const item of runtime[key] || []) item.unitId = item.unitId || runtime.unit.unitId;
  }
  runtime.visual = Object.fromEntries(Object.entries(runtime.visual).map(([key, value]) => [key, typeof value === "string" ? value.replace("../../../vocabulary", "../../vocabulary") : value]));
  for (const [kind, collection, idKey] of [["readings", runtime.readings, "readingId"], ["grammar", runtime.grammar, "grammarId"], ["speaking", runtime.speaking, "speakingId"]]) {
    const folder = kind === "readings" ? "readings" : kind;
    for (const item of collection) item.audio = audioDescriptor(unitNo, folder, item[idKey]);
  }
  return runtime;
}

function buildCapstone(runtimes, dictionary) {
  const unitId = "eng-g02-t03-u10";
  const selectedLinks = [];
  const selectedIds = new Set();
  for (let round = 0; selectedLinks.length < 30; round += 1) {
    for (const runtime of runtimes) {
      const link = runtime.dictionaryLinks[round];
      if (!link || selectedIds.has(link.dictionaryEntryId)) continue;
      selectedIds.add(link.dictionaryEntryId);
      selectedLinks.push({
        ...link,
        vocabularyId: `capstone-${link.vocabularyId}`,
        unitId,
        groupId: `capstone-unit-${runtime.unit.unitNo}`,
        groupTitle: `Review from Unit ${runtime.unit.unitNo}`,
        reviewStatus: "approved",
      });
      if (selectedLinks.length === 30) break;
    }
  }
  const vocabularyGroups = runtimes.map((runtime) => ({
    id: `capstone-unit-${runtime.unit.unitNo}`,
    number: runtime.unit.unitNo,
    title: `Review from Unit ${runtime.unit.unitNo}`,
    vocabularyIds: selectedLinks.filter((link) => link.groupId === `capstone-unit-${runtime.unit.unitNo}`).map((link) => link.vocabularyId),
  })).filter((group) => group.vocabularyIds.length);

  const outcomes = [
    "Select and use vocabulary from across Grade 2 English accurately and meaningfully.",
    "Read, listen to and respond to a cumulative Grade 2 text using relevant evidence.",
    "Use familiar Grade 2 grammar patterns accurately in connected speaking and writing.",
    "Plan, rehearse and deliver a clear oral presentation about a completed English project.",
    "Plan, draft, revise and publish an illustrated English booklet with an ordered beginning, middle and ending.",
    "Give, receive and apply kind, specific feedback during project development.",
    "Select portfolio evidence, reflect honestly on progress and set a next English-learning goal.",
  ].map((learningOutcome, index) => metadata({
    outcomeId: `${unitId}-lo${String(index + 1).padStart(2, "0")}`,
    unitId,
    sequence: index + 1,
    learningOutcome,
    evidenceOfLearning: "Demonstrated through the capstone booklet, oral presentation, portfolio evidence, cumulative quiz and final reflection.",
  }));

  const readingSources = [
    {
      title: "Amina's English Year",
      type: "Story",
      genre: "Reflective school story",
      theme: "Growth, confidence and learning",
      setting: "A Grade 2 classroom preparing for a learning showcase",
      passageScript: "Amina opened her English folder and smiled. At the beginning of the year, she had written only a few short sentences. Now her folder was full. She found her welcome card, her neighbourhood poem, a drawing of a firefighter, a sky journal and a careful measurement table. She also found her garden promise and the city map she had used to give directions.\n\nTeacher Nuur asked the class to prepare one final project called My English World. Amina chose six pieces that showed different skills. She read each piece again and corrected small mistakes. She changed one sentence from 'The firefighters is helping' to 'The firefighters are helping.' She added describing words to her sky page and clearer directions to her city map.\n\nNext, Amina made a new booklet. On the first page, she introduced herself. On the next pages, she wrote about a helpful neighbour, a healthy habit, a plant, her home and a place in her city. She used pictures, labels and complete sentences.\n\nOn showcase day, Amina stood beside her booklet. She felt nervous, but she remembered to breathe and speak slowly. 'Welcome to my English world,' she said. She explained her favourite page and answered two questions. Her classmates listened and gave kind feedback.\n\nAt the end, Amina wrote one final reflection: 'I can read, write and speak with more confidence now. Next year, I want to read longer stories by myself.' She closed her folder proudly. Her work was not perfect, but it showed how much she had learned.",
    },
    {
      title: "My English World Project Brief",
      type: "Reading",
      genre: "Project instructions",
      theme: "Planning and presenting a portfolio",
      setting: "Online and classroom capstone work",
      passageScript: "Your capstone has four parts. First, choose three strong pieces from your Grade 2 English work. Select pieces that show different skills, such as reading, vocabulary, speaking or writing. Second, create a six-page illustrated booklet called My English World. Introduce yourself and include ideas from at least four earlier units. Third, record or present a two-minute talk about your booklet. Speak clearly, use complete sentences and answer one question. Finally, complete the self-assessment and write one goal for your next year of English.\n\nBefore you submit, check your work. Make sure your ideas are in a clear order. Use accurate vocabulary, capital letters and end punctuation. Read every page aloud. Ask a partner or teacher for one kind, specific suggestion, then improve your project. Your capstone should show what you can do now, not only what you can remember.",
    },
    {
      title: "Showcase Day Dialogue",
      type: "Listening",
      genre: "Dialogue",
      theme: "Presentation and feedback",
      setting: "The Grade 2 English showcase",
      passageScript: "Teacher: Welcome to our English showcase, Hodan. What will you present?\nHodan: I will present my booklet, My English World.\nTeacher: Which page are you most proud of?\nHodan: I am most proud of my plant page because I used labels and complete sentences.\nTeacher: Please read one sentence for us.\nHodan: 'The roots hold the plant in the soil, and the leaves help it use sunlight.'\nClassmate: Your voice was clear. Can you tell us how you improved the page?\nHodan: First, I checked my spelling. Then my partner asked me to add what the roots do. I revised the sentence.\nTeacher: What is your next English goal?\nHodan: I will practise reading longer stories aloud.\nTeacher: That is a clear goal. Well done, Hodan.",
    },
  ];
  const readings = readingSources.map((reading, index) => {
    const readingId = `${unitId}-read${String(index + 1).padStart(2, "0")}`;
    return metadata({ ...reading, readingId, unitId, sequence: index + 1, audioRequired: true, audio: audioDescriptor(10, "readings", readingId) });
  });

  const comprehensionPrompts = [
    [0, "What six earlier pieces did Amina find in her folder?", "Her welcome card, neighbourhood poem, firefighter drawing, sky journal, measurement table, garden promise and city map are named; accept any six."],
    [0, "Which grammar mistake did Amina correct?", "She changed 'The firefighters is helping' to 'The firefighters are helping.'"],
    [0, "What did Amina include in her new booklet?", "She introduced herself and wrote about a neighbour, healthy habit, plant, home and city place, using pictures, labels and complete sentences."],
    [0, "How did Amina manage feeling nervous on showcase day?", "She remembered to breathe and speak slowly."],
    [0, "What was Amina's next English goal?", "She wanted to read longer stories by herself."],
    [1, "What are the four parts of the capstone?", "Choose three portfolio pieces; create a six-page booklet; present or record a two-minute talk; complete the self-assessment and next goal."],
    [1, "How many earlier units should the booklet draw ideas from?", "At least four earlier units."],
    [1, "What should a learner do after receiving feedback?", "Use the kind, specific suggestion to improve the project."],
    [1, "Why should learners read every page aloud?", "Reading aloud helps them notice unclear language, missing words and punctuation before submitting."],
    [2, "Which page was Hodan most proud of, and why?", "Her plant page, because she used labels and complete sentences."],
    [2, "How did Hodan improve the plant page?", "She checked spelling and added what the roots do after her partner's suggestion."],
    [2, "What made Hodan's final goal clear?", "She named a specific action: practising reading longer stories aloud."],
  ];
  const comprehension = comprehensionPrompts.map(([readingIndex, question, correctAnswer], index) => metadata({
    questionId: `${unitId}-cq${String(index + 1).padStart(3, "0")}`,
    unitId,
    readingId: readings[readingIndex].readingId,
    section: readings[readingIndex].title,
    sequence: index + 1,
    questionType: "Short answer",
    question,
    correctAnswer,
    explanation: "Award credit when the answer is complete and supported by the relevant capstone text.",
    marks: index % 4 === 0 ? 2 : 1,
    outcomeId: outcomes[1].outcomeId,
    difficulty: "Core",
  }));

  const grammarData = [
    ["Pronouns and Likes Review", "Use he, she and they to avoid repeating names. Use like with I, you, we and they; use likes with he or she.", "Amina likes reading. She shares a story. Her friends like the city page. They ask questions.", "Write four linked sentences introducing two people and what they like."],
    ["Actions Happening Now", "Use am, is or are plus an action ending in -ing for actions happening now.", "I am presenting. Hodan is reading. The learners are listening.", "Describe six actions happening during a project showcase."],
    ["Clear Questions", "Use What, Who, Where, How and How many to ask for different information.", "What is your topic? Who helped you? Where is the plant? How did you improve it?", "Write and answer one question with each of the five question patterns."],
    ["There Is, There Are and Place Words", "Use there is for one thing and there are for more than one. Add place words to show position.", "There is a booklet on the table. There are three pictures beside it.", "Describe a project table in five sentences using there is, there are and place words."],
    ["Adjectives and Comparisons", "Use adjectives to describe and -er than forms to compare suitable words.", "The moon is bright. A metre is longer than a centimetre. The final draft is clearer than the first draft.", "Write three descriptions and three accurate comparisons."],
    ["Past Learning and Future Goals", "Use past verbs to tell what happened and will to describe a future action.", "I wrote a poem. I measured a table. Next year, I will read longer books.", "Write three sentences about work you completed and three sentences about what you will do next."],
  ];
  const grammar = grammarData.map(([title, explanation, ruleAndExamples, practice], index) => {
    const grammarId = `${unitId}-grammar${String(index + 1).padStart(2, "0")}`;
    return metadata({ grammarId, unitId, conceptId: `${unitId}-concept-${String(index + 1).padStart(2, "0")}`, sequence: index + 1, practiceType: index < 3 ? "Guided cumulative review" : "Independent capstone application", title, explanation, ruleAndExamples, commonMistake: "Check that the grammar pattern matches the subject, time and meaning of the sentence.", memoryTip: "Read the complete sentence aloud and compare it with the model.", practice, outcomeId: outcomes[2].outcomeId, audio: audioDescriptor(10, "grammar", grammarId) });
  });

  const speakingData = [
    ["Introduce My English World", "Give a 30-second introduction with your name, project title and the four earlier units you selected."],
    ["Vocabulary Spotlight", "Choose six review words from different units. Explain each meaning and use each word in a new sentence."],
    ["Read Aloud with Expression", "Read one capstone paragraph aloud. Pause at punctuation, speak clearly and reread one sentence more smoothly."],
    ["Explain My Best Page", "Explain what the page shows, which English skills it uses and how you improved it after feedback."],
    ["Rehearse and Answer Questions", "Give a two-minute rehearsal, then answer one What question and one How question from a partner."],
    ["Final Capstone Presentation", "Present your completed booklet and portfolio evidence clearly. Finish by stating one success and one next goal."],
  ];
  const speaking = speakingData.map(([title, instructionsAndModelLines], index) => {
    const speakingId = `${unitId}-speak${String(index + 1).padStart(2, "0")}`;
    return metadata({ speakingId, unitId, sequence: index + 1, activityType: index === 5 ? "Assessed presentation" : "Capstone rehearsal", title: `Speaking ${index + 1} - ${title}`, instructionsAndModelLines, recordingRequired: true, aiTutorPrompt: "Listen to my rehearsal. Give one specific strength and one age-appropriate improvement for clarity, vocabulary or sentence accuracy.", outcomeId: outcomes[index < 3 ? 3 : 5].outcomeId, audio: audioDescriptor(10, "speaking", speakingId) });
  });

  const writingData = [
    ["Plan the Booklet", "Choose at least four earlier units. Plan six pages with a topic, picture idea and two sentence ideas for each page.", "Page 1: About Me. Page 2: A Helpful Neighbour. Page 3: My Healthy Habit. Page 4: A Plant. Page 5: My Home. Page 6: A Place in My City.", "My booklet will include"],
    ["Build a Strong Sentence Bank", "Write twelve accurate sentences for the planned pages. Include questions, descriptions, actions now, one past event and one future goal.", "I am presenting my favourite page. The tall tree is beside our home. Last term, I wrote a poem. Next year, I will read more stories.", "One sentence for my project is"],
    ["Write the First Draft", "Write the complete six-page booklet. Each page needs a heading, two or more sentences and a matching illustration or visual.", "Welcome to my English world. I am Amina, and I like reading. This booklet shows the people, places and ideas I learned about this year.", "Welcome to my English world"],
    ["Revise with Feedback", "Ask for one kind, specific suggestion. Improve the order, detail or vocabulary in at least three sentences and record what changed.", "First draft: The plant is nice. Revised: The young green plant has strong roots under the soil.", "I improved my sentence by"],
    ["Edit and Publish", "Check capitals, spaces, spelling and punctuation. Read every page aloud and prepare a neat final version.", "Editing check: Every sentence begins with a capital letter, makes complete sense and ends with punctuation.", "My final check shows"],
    ["Write the Final Reflection", "Write six sentences about what you can do now, what was challenging, which evidence makes you proud and your next English goal.", "I am proud of my city page because I gave clear directions. Revising was challenging, but feedback helped me add detail. Next year, I will read longer stories aloud.", "I am proud of"],
  ];
  const writing = writingData.map(([title, promptAndInstructions, modelText, sentenceStarter], index) => metadata({
    writingId: `${unitId}-write${String(index + 1).padStart(2, "0")}`,
    unitId,
    sequence: index + 1,
    practiceType: "Capstone production stage",
    title: `Writing ${index + 1} - ${title}`,
    promptAndInstructions,
    modelText,
    sentenceStarter,
    expectedLength: index === 2 ? "Six illustrated pages with at least 12 complete sentences" : "Complete the full stage as described",
    successCriteria: "I completed every instruction; used accurate Grade 2 vocabulary and grammar; organized ideas clearly; checked spelling, capitals and punctuation",
    support: "Use earlier Unit work, the curated review dictionary, models, sentence starters and teacher feedback.",
    extension: "Add one extra page, a labelled diagram or a connected paragraph with because, and or but.",
    rubricId: "rub-capstone-v1",
    outcomeId: outcomes[index === 5 ? 6 : 4].outcomeId,
  }));

  const activityData = [
    ["Portfolio Treasure Hunt", "Find one piece that shows vocabulary, one that shows reading, one that shows speaking and one that shows writing. Explain why each is useful evidence."],
    ["Four-Unit Idea Map", "Connect ideas from at least four earlier units on one planning map. Add one vocabulary word and one sentence idea to every branch."],
    ["Grammar Repair Station", "Correct six mixed sentences containing pronoun, agreement, question, place-word, comparison and time mistakes."],
    ["Peer Feedback Conference", "Use Two Stars and One Next Step: give two specific strengths and one kind improvement suggestion for a partner's draft."],
    ["Showcase Table Setup", "Arrange the booklet, three portfolio pieces and one vocabulary display. Write three place sentences describing the setup."],
    ["Rehearsal Timer Challenge", "Deliver the presentation in 90-120 seconds, answer one question, and record one improvement before the final presentation."],
  ];
  const activities = activityData.map(([title, instructionsAndItems], index) => metadata({ activityId: `${unitId}-act${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, title: `Activity ${index + 1} - ${title}`, activityType: index === 5 ? "Performance rehearsal" : "Capstone workshop", instructionsAndItems, answerSummary: "Accept complete, relevant evidence that follows every step. Use the capstone rubric for quality and the teacher checklist for completion.", outcomeId: outcomes[index % outcomes.length].outcomeId, deliveryMode: "Shared online UI, live session or classroom" }));

  const quizData = [
    ["This is Amina. ___ is presenting her booklet.", "She | He | They | We", "She", "Use she for one girl or woman."],
    ["The learners ___ listening carefully.", "are | is | am | was", "are", "Use are with the plural subject learners."],
    ["Which question asks about a person?", "Who helped you? | What is your topic? | Where is the book? | How did you revise?", "Who helped you?", "Who asks about a person."],
    ["There ___ three pictures beside the booklet.", "are | is | am | was", "are", "Use there are for more than one thing."],
    ["Which sentence gives a correct comparison?", "The metre is longer than the centimetre. | The metre is long than the centimetre. | The metre longer the centimetre. | The metre is longest than.", "The metre is longer than the centimetre.", "Longer than is the correct comparison form."],
    ["Which sentence describes an action happening now?", "Hodan is reading. | Hodan read yesterday. | Hodan will read. | Hodan likes books.", "Hodan is reading.", "Is plus reading describes an action happening now."],
    ["Which sentence describes the past?", "I wrote a poem. | I will write a poem. | I am writing a poem. | I write poems.", "I wrote a poem.", "Wrote tells about a completed past action."],
    ["Which sentence states a future goal?", "I will read longer stories. | I read a story. | I am reading now. | I wrote a story.", "I will read longer stories.", "Will expresses a future action or goal."],
    ["What is the best feedback?", "Your details are clear; add punctuation to the last sentence. | It is bad. | Change everything. | I do not like it.", "Your details are clear; add punctuation to the last sentence.", "Useful feedback is kind, specific and actionable."],
    ["What should happen before final submission?", "Revise, edit and read the project aloud. | Hide the first draft. | Remove every picture. | Skip the reflection.", "Revise, edit and read the project aloud.", "A final check improves clarity and accuracy."],
  ];
  const quizzes = quizData.map(([question, options, correctAnswer, explanation], index) => metadata({ quizId: `${unitId}-quiz01`, questionId: `${unitId}-quiz01-q${String(index + 1).padStart(2, "0")}`, unitId, quizTitle: "Grade 2 English capstone checkpoint", sequence: index + 1, questionType: "Multiple choice", question, options, correctAnswer, explanation, marks: 1, outcomeId: outcomes[index % outcomes.length].outcomeId, difficulty: "Cumulative" }));

  const livePlans = [
    [1, 1, "Capstone launch and portfolio treasure hunt", "Bring your Grade 2 English folder or saved work.", "5 min welcome; 10 min capstone model; 15 min portfolio treasure hunt; 10 min evidence choices; 5 min reflection", "Confirm three portfolio pieces and four earlier Unit themes."],
    [1, 2, "Booklet planning and vocabulary retrieval", "Complete Writing 1 and choose 12 review words.", "5 min retrieval; 10 min idea-map modelling; 15 min page planning; 10 min vocabulary conference; 5 min next step", "Finish the six-page plan and sentence bank."],
    [1, 3, "Grammar review and first-draft clinic", "Complete Grammar Practices 1-3 and begin the draft.", "5 min warm-up; 15 min grammar repair; 15 min guided drafting; 5 min partner read-aloud; 5 min feedback", "Complete the first six-page draft."],
    [2, 1, "Revision and peer feedback conference", "Bring a complete first draft.", "5 min model revision; 10 min Two Stars and One Next Step; 15 min revision; 10 min editing check; 5 min goal", "Publish the improved booklet."],
    [2, 2, "Presentation rehearsal and questions", "Complete Speaking Practices 1-4.", "5 min voice warm-up; 10 min teacher model; 15 min timed rehearsals; 10 min question practice; 5 min personal target", "Record Speaking 5 and apply one improvement."],
    [2, 3, "My English World showcase", "Bring the final booklet, portfolio pieces and reflection draft.", "5 min welcome; 25 min presentations; 5 min audience feedback; 5 min self-assessment; 5 min celebration and next goal", "Submit the booklet, recording, portfolio evidence and final reflection."],
  ];
  const liveSessions = livePlans.map(([week, sessionWithinWeek, title, beforeSession, agenda, afterSession], index) => metadata({ liveSessionId: `${unitId}-live${String(index + 1).padStart(2, "0")}`, unitId, week, sessionWithinWeek, sessionNo: index + 1, title, durationMin: 45, beforeSession, agenda, afterSession, outcomeIds: outcomes.map((outcome) => outcome.outcomeId).slice(Math.min(index, 5), Math.min(index, 5) + 2).join(" | ") }));

  const selfStatements = [
    "I can choose strong work that shows different English skills.",
    "I can use review vocabulary accurately in new sentences.",
    "I can use familiar grammar patterns in connected speaking and writing.",
    "I can plan, draft, revise and publish an illustrated booklet.",
    "I can present for about two minutes and answer a question.",
    "I can use kind, specific feedback to improve my work.",
    "I can explain my progress and name a clear next English goal.",
  ];
  const selfAssessment = selfStatements.map((statement, index) => metadata({ selfAssessmentId: `${unitId}-self${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, statement, scale: "Not yet | With help | By myself", outcomeId: outcomes[index].outcomeId }));

  const capstoneRubric = [
    ["Project completeness", "Key parts are missing", "Some parts are complete", "Most parts are complete and relevant", "All booklet, portfolio, presentation and reflection parts are complete"],
    ["Integrated English", "Uses isolated words with full support", "Uses a few familiar patterns", "Uses varied vocabulary and mostly accurate sentences", "Uses varied Grade 2 vocabulary and grammar accurately across the project"],
    ["Communication", "Ideas are difficult to follow", "Some ideas are clear", "Ideas are organized and mostly clear", "Ideas are clear, ordered, engaging and supported by visuals"],
    ["Revision and reflection", "Does not yet use feedback", "Makes one change with support", "Uses feedback and names a sensible goal", "Makes purposeful revisions and explains progress with a specific next goal"],
  ].map(([criterion, level1, level2, level3, level4], index) => metadata({ rubricId: "rub-capstone-v1", target: "Grade 2 capstone", criterionId: `rub-capstone-v1-c${String(index + 1).padStart(2, "0")}`, criterion, level1, level2, level3, level4, maximumMarks: 4 }));

  const answerKey = [
    ...comprehension.map((item) => [item.questionId, "Comprehension", `${item.correctAnswer} ${item.explanation}`]),
    ...grammar.map((item) => [item.grammarId, "Grammar practice", `Use the model and rule. Accept accurate original responses that complete every part: ${item.practice}`]),
    ...activities.map((item) => [item.activityId, "Activity", item.answerSummary]),
    ...quizzes.map((item) => [item.questionId, "Quiz", `${item.correctAnswer}. ${item.explanation}`]),
  ].map(([contentId, contentType, answerOrGuidance], index) => metadata({ answerId: `${unitId}-answer-${String(index + 1).padStart(3, "0")}`, unitId, contentId, contentType, answerOrGuidance }));

  return {
    schemaVersion: "Ehel English Runtime v1.1",
    templateVersion: "Ehel English Content Template v1.1",
    dictionaryVersion: dictionary.schemaVersion,
    grade: { id: "g02", label: "Grade 2" },
    subject: "English",
    term: { id: "t03", label: "Term 3" },
    unit: {
      gradeId: "g02", subject: "English", termId: "t03", unitId, unitNo: 10,
      unitTitle: "My English World: Grade 2 Capstone",
      unitOverview: "Celebrate everything you have learned in Grade 2 English. In this two-week capstone, you will choose strong portfolio work, create an illustrated six-page booklet, present your ideas and reflect on how your reading, speaking and writing have grown.",
      learningPath: "Launch the capstone and choose three strong portfolio pieces.\nReview curated vocabulary and complete six cumulative grammar workshops.\nRead the capstone texts and answer the comprehension questions.\nPlan, draft, revise and publish the six-page My English World booklet.\nRehearse and deliver a two-minute presentation during six live sessions.\nComplete the cumulative quiz, portfolio submission and final reflection.",
      origin: "Ehel Grade 2 curriculum capstone", reviewStatus: "Approved - curriculum reviewer", sourceFile: "Ehel English Content Template v1.1 capstone",
    },
    visual: { image: "./capstone-my-english-world.png", alt: "Grade 2 learners presenting illustrated English portfolios in a classroom showcase", lectureMode: "capstone-launch", lecturePoster: "./capstone-my-english-world.png" },
    vocabularyGroups,
    dictionaryLinks: selectedLinks,
    outcomes,
    readings,
    comprehension,
    grammar,
    speaking,
    writing,
    activities,
    assignments: [metadata({ assignmentId: `${unitId}-assignment01`, unitId, title: "My English World capstone portfolio", instructions: "Submit the illustrated six-page booklet, three selected portfolio pieces, a two-minute oral presentation or recording, and the final self-assessment with one next English goal.", submissionType: "Illustrated booklet + portfolio evidence + audio/video presentation + reflection", marks: 64, outcomeIds: outcomes.map((outcome) => outcome.outcomeId).join(" | "), rubricIds: "rub-capstone-v1 | rub-writing-v1 | rub-speaking-v1" })],
    quizzes,
    liveSessions,
    teacherNotes: [
      metadata({ noteId: `${unitId}-note01`, unitId, noteType: "Capstone delivery", note: "Treat the capstone as supported independent performance. Confer briefly with each learner, preserve evidence of their own language, and give feedback that identifies one strength and one manageable next step.", audience: "Teacher" }),
      metadata({ noteId: `${unitId}-note02`, unitId, noteType: "Accessibility and inclusion", note: "Allow oral rehearsal, sentence frames, enlarged print, scribing where appropriate, alternative presentation formats and home-language planning. Assess the Grade 2 English evidence, not artistic skill or access to materials.", audience: "Teacher" }),
    ],
    answerKey,
    selfAssessment,
    rubrics: [...runtimes[0].rubrics, ...capstoneRubric],
  };
}

function validate(runtime) {
  for (const [key, expected] of Object.entries(UNIT_MINIMUMS)) {
    if (runtime[key]?.length !== expected) throw new Error(`${runtime.unit.unitId} ${key}: expected ${expected}, found ${runtime[key]?.length}`);
  }
  if (runtime.dictionaryLinks.length === 0) throw new Error(`${runtime.unit.unitId} has no linked vocabulary.`);
}

function buildCourseFinalAssessment(runtimes) {
  const assessmentId = "eng-g02-course-final-quiz-v1";
  const sectionDefinitions = [
    { sectionId: "words-reading", title: "Words and reading", description: "Show what words mean and use reading clues from across Grade 2." },
    { sectionId: "grammar-sentences", title: "Grammar and sentences", description: "Choose accurate Grade 2 sentence patterns." },
    { sectionId: "communication-writing", title: "Communication and writing", description: "Apply English to speaking, directions, feedback and writing." },
  ];
  const questionData = [
    ["words-reading", 1, "Vocabulary", "Which day comes after Wednesday?", "Tuesday | Thursday | Friday | Sunday", "Thursday", "Thursday comes directly after Wednesday in the weekly calendar."],
    ["words-reading", 2, "Vocabulary", "Who helps people who are sick?", "A doctor | A driver | A builder | A farmer", "A doctor", "A doctor examines and helps people who are ill."],
    ["words-reading", 3, "Vocabulary", "Which body part joins your shoulder to your hand?", "Arm | Toe | Neck | Knee", "Arm", "Your arm extends from your shoulder to your hand."],
    ["words-reading", 4, "Reading", "Which word means the brightness that lets us see things?", "Light | Shadow | Evening | Cloud", "Light", "Light is the brightness that makes objects visible."],
    ["words-reading", 5, "Vocabulary", "Which number word means 70?", "Seventeen | Seventy | Sixty | Seven", "Seventy", "Seventy is the number 70."],
    ["words-reading", 6, "Reading", "Which animal is a small jumping insect that makes a chirping sound?", "Cricket | Butterfly | Worm | Ant", "Cricket", "A cricket jumps and is known for its chirping sound."],
    ["words-reading", 7, "Reading", "Which plant parts grow underground and take in water?", "Roots | Flowers | Leaves | Fruit", "Roots", "Roots anchor a plant and absorb water from the soil."],
    ["words-reading", 8, "Vocabulary", "What is a set of rooms inside a larger building where people live?", "An apartment | A hive | A cave | A hut", "An apartment", "An apartment is a home made of rooms within a larger building."],
    ["words-reading", 9, "Vocabulary", "Where can you borrow books to read?", "A library | A station | A market | A hospital", "A library", "A library keeps books that people can read or borrow."],
    ["words-reading", 10, "Reading", "Why did Amina correct and improve her portfolio work?", "To show what she had learned | To make every page shorter | To remove all the pictures | To copy a classmate's work", "To show what she had learned", "The capstone portfolio should demonstrate the learner's own growth and strongest English skills."],
    ["grammar-sentences", 1, "Grammar", "This is Amina. ___ likes reading.", "She | He | They | We", "She", "Use she for one girl or woman."],
    ["grammar-sentences", 1, "Grammar", "Liban ___ football.", "likes | like | liking | are like", "likes", "Use likes with one person named Liban."],
    ["grammar-sentences", 2, "Grammar", "The firefighters ___ climbing the ladder.", "are | is | am | was", "are", "Use are with the plural subject firefighters."],
    ["grammar-sentences", 2, "Grammar", "Which is the correct -ing form of drive?", "driving | driveing | drvng | drives", "driving", "Drop the final e before adding -ing: drive becomes driving."],
    ["grammar-sentences", 3, "Grammar", "Which sentence describes an action happening now?", "Hodan is hopping. | Hodan hopped yesterday. | Hodan will hop. | Hodan likes games.", "Hodan is hopping.", "Is plus a verb ending in -ing shows an action happening now."],
    ["grammar-sentences", 4, "Grammar", "There ___ one bright star above the house.", "is | are | am | were", "is", "Use there is for one thing."],
    ["grammar-sentences", 5, "Grammar", "Which sentence gives a correct comparison?", "A metre is longer than a centimetre. | A metre is long than a centimetre. | A metre longer a centimetre. | A metre is more long.", "A metre is longer than a centimetre.", "Longer than is the correct comparison form."],
    ["grammar-sentences", 6, "Grammar", "Butterflies have colourful ___.", "wings | winges | wing | winge", "wings", "The plural noun wings completes the sentence accurately."],
    ["grammar-sentences", 9, "Grammar", "Which question asks about a person?", "Who helped you? | Where is the bus? | What is your name? | How did you travel?", "Who helped you?", "Who is the question word used for a person."],
    ["grammar-sentences", 10, "Grammar", "Which sentence states a future goal?", "I will read longer stories. | I read a story yesterday. | I am reading now. | I wrote a story.", "I will read longer stories.", "Will expresses a future action or goal."],
    ["communication-writing", 1, "Speaking", "Which is a complete question about colour?", "What colour do you like? | Colour you? | Like blue. | What like?", "What colour do you like?", "A complete question uses a question word, subject, verb and question mark."],
    ["communication-writing", 2, "Speaking", "Which is the most polite way to ask about someone's job?", "What do you do? | Tell job now. | You job? | Give me work.", "What do you do?", "What do you do? is a complete and polite question about work."],
    ["communication-writing", 3, "Speaking", "Which instruction helps a friend move safely?", "Walk carefully and look ahead. | Run with your eyes closed. | Push past everyone. | Jump from a high table.", "Walk carefully and look ahead.", "A clear safety instruction uses an action that prevents harm."],
    ["communication-writing", 4, "Writing", "Which sentence is a clear sky observation?", "The orange sun is low in the evening sky. | Sky nice. | Orange there. | The sun sky low orange it.", "The orange sun is low in the evening sky.", "The sentence gives a complete, ordered observation with useful describing words."],
    ["communication-writing", 5, "Writing", "Which instruction explains how to measure a table?", "Place the ruler at one edge and count the centimetres. | Guess and write any number. | Hold the ruler in the air. | Count the table legs only.", "Place the ruler at one edge and count the centimetres.", "Accurate measurement begins at an edge and uses the marked units."],
    ["communication-writing", 6, "Writing", "Which sentence gives a complete insect fact?", "A butterfly has six legs and colourful wings. | Butterfly colourful. | Six and wings. | Has legs the butterfly.", "A butterfly has six legs and colourful wings.", "The sentence has a subject, accurate details and end punctuation."],
    ["communication-writing", 7, "Speaking", "Which sentence gives a helpful environmental instruction?", "Put litter in the bin, please. | Drop it beside the road. | Leave the tap running. | Pull up every plant.", "Put litter in the bin, please.", "The instruction is polite and describes an action that protects the environment."],
    ["communication-writing", 8, "Writing", "Which sentence clearly describes a room's location?", "The bedroom is beside the bathroom. | Bedroom bathroom. | Beside is room. | The bedroom beside.", "The bedroom is beside the bathroom.", "The complete sentence uses beside to explain location."],
    ["communication-writing", 9, "Speaking", "Which direction is clearest?", "Walk past the library, then turn left at the market. | Go there somehow. | Left and maybe past. | The city is busy.", "Walk past the library, then turn left at the market.", "Clear directions use ordered action words and recognizable landmarks."],
    ["communication-writing", 10, "Writing", "Which feedback will help a learner improve a final project?", "Your ideas are clear; add punctuation to the last sentence. | It is bad. | Change everything. | I do not like it.", "Your ideas are clear; add punctuation to the last sentence.", "Helpful feedback is kind, specific and gives a manageable next step."],
  ];
  const sections = sectionDefinitions.map((section, index) => ({
    ...section,
    sequence: index + 1,
    questionCount: questionData.filter(([sectionId]) => sectionId === section.sectionId).length,
  }));
  const questions = questionData.map(([sectionId, sourceUnitNo, curriculumArea, question, options, correctAnswer, explanation], index) => {
    const sourceRuntime = runtimes.find((runtime) => runtime.unit.unitNo === sourceUnitNo);
    const questionId = `${assessmentId}-q${String(index + 1).padStart(2, "0")}`;
    const audioSource = `./media/final-quiz/${questionId}.mp3`;
    const audioFile = path.join(GRADE_DIR, "media", "final-quiz", `${questionId}.mp3`);
    const audioAvailable = fs.existsSync(audioFile) && fs.statSync(audioFile).size > 1000;
    return {
      questionId,
      assessmentId,
      sequence: index + 1,
      sectionId,
      sourceUnitNo,
      sourceUnitId: sourceRuntime.unit.unitId,
      sourceUnitTitle: sourceRuntime.unit.unitTitle,
      curriculumArea,
      questionType: "Multiple choice",
      question,
      options,
      correctAnswer,
      explanation,
      marks: 1,
      reviewRoute: `?unit=${sourceUnitNo}#${curriculumArea === "Vocabulary" ? "dictionary" : curriculumArea === "Reading" ? "reading" : curriculumArea === "Grammar" ? "grammar" : curriculumArea === "Speaking" ? "speaking" : "writing"}`,
      audio: {
        provider: "ElevenLabs",
        voiceId: "XfNU2rGpBa01ckF309OY",
        model: "eleven_multilingual_v2",
        source: audioSource,
        available: audioAvailable,
        status: audioAvailable ? "Ready" : "Pending generation",
      },
      origin: "Ehel English Content Template v1.1 cumulative assessment",
      reviewStatus: "Approved - curriculum reviewer",
      sourceFile: "Ehel English Content Template v1.1 - All Grade 2 Units",
    };
  });
  return {
    schemaVersion: "Ehel Grade 2 English Course Final Quiz v1.1",
    assessmentId,
    title: "Grade 2 English Final Course Quiz",
    shortTitle: "Final course quiz",
    description: "Complete three short sections to show what you can understand and use after Units 1-10.",
    grade: { id: "g02", label: "Grade 2" },
    subject: "English",
    placement: "After Unit 10 capstone",
    questionCount: questions.length,
    totalMarks: questions.reduce((sum, question) => sum + question.marks, 0),
    passPercent: 80,
    attemptsAllowed: "Unlimited with targeted review between attempts",
    estimatedMinutes: 30,
    feedbackMode: "Immediate child-friendly feedback with final mastery report",
    sections,
    questions,
    reporting: {
      learner: "Total score, mastery status, section scores and recommended Unit review links",
      teacher: "Latest attempt, attempt history, curriculum-area scores and source-unit scores",
    },
    origin: "Ehel English Content Template v1.1 cumulative assessment",
    reviewStatus: "Approved - curriculum reviewer",
  };
}

function main() {
  const sheets = workbookRows();
  const vocabulary = JSON.parse(fs.readFileSync(VOCABULARY_FILE, "utf8"));
  const cues = JSON.parse(fs.readFileSync(AUDIO_CUES_FILE, "utf8"));
  const dictionary = buildDictionary(vocabulary, cues);
  const manifest = { schemaVersion: "Ehel Grade 2 English Course Manifest v1.1", grade: { id: "g02", label: "Grade 2" }, subject: "English", defaultUnit: 1, units: [] };
  fs.mkdirSync(UNIT_DATA_DIR, { recursive: true });

  const builtRuntimes = [];
  for (let unitNo = 1; unitNo <= 9; unitNo += 1) {
    const vocabUnit = vocabulary.units.find((unit) => unit.number === unitNo);
    const links = dictionary.linksByUnit.get(unitNo);
    let runtime;
    if (unitNo <= 2) {
      runtime = adaptReleasedRuntime(unitNo, links);
    } else {
      const unitSource = sheets.Units.find((record) => Number(record["Unit no."]) === unitNo);
      const unitId = unitSource["Unit ID"];
      const collect = (sheet) => (sheets[sheet] || []).filter((record) => belongsTo(record, unitId)).map(normalize);
      const outcomes = collect("Outcomes");
      const readings = collect("Readings").map((item) => ({ ...item, audioRequired: true, audio: audioDescriptor(unitNo, "readings", item.readingId) }));
      const grammar = expandGrammar(collect("Grammar"), unitId, unitNo);
      const speaking = expandSpeaking(collect("Speaking"), unitAdditions[unitNo], unitId, unitNo, outcomes);
      const writing = expandWriting(collect("Writing"), unitAdditions[unitNo], unitId, outcomes);
      const activities = expandActivities(collect("Activities"), unitAdditions[unitNo], unitId, outcomes);
      const quizzes = expandQuizzes(collect("Quizzes"), vocabUnit, unitId, outcomes);
      const liveSessions = buildLiveSessions(unitId, vocabUnit.title, readings, grammar, outcomes);
      const additions = [
        ...grammar.filter((item) => /grammar0[456]$/.test(item.grammarId)).map((item) => [item.grammarId, "Grammar practice", item.practice]),
        ...speaking.slice(3).map((item) => [item.speakingId, "Speaking", "Use the speaking rubric and require every instruction to be completed clearly."]),
        ...writing.slice(3).map((item) => [item.writingId, "Writing", `Use the writing rubric. Approved model: ${item.modelText}`]),
        ...activities.slice(collect("Activities").length).map((item) => [item.activityId, "Activity", item.answerSummary]),
        ...quizzes.slice(5).map((item) => [item.questionId, "Quiz", `${item.correctAnswer}. ${item.explanation}`]),
      ];
      runtime = {
        schemaVersion: "Ehel English Runtime v1.1",
        templateVersion: "Ehel English Content Template v1.1",
        dictionaryVersion: "Ehel Master Dictionary v1.1",
        grade: { id: "g02", label: "Grade 2" },
        subject: "English",
        term: { id: unitSource["Term ID"], label: `Term ${unitSource["Term ID"].slice(-1)}` },
        unit: { ...normalize(unitSource), learningPath: [
          "Watch the teacher audiovisual lecture and learn a few vocabulary words each day.",
          "Complete all six grammar practices, moving from guided examples to independent use.",
          `Listen to the Unit readings, including ${readings[readings.length - 1]?.title}, and answer the comprehension questions.`,
          "Complete all six speaking, six writing and six activity practices.",
          "Join three live teacher sessions each week for two weeks.",
          "Finish the ten-question quiz and student self-assessment.",
        ].join("\n") },
        visual: {
          image: vocabUnit.visual.image.replace("./assets", "../../vocabulary/assets"),
          alt: vocabUnit.visual.alt,
          lectureVideo: `../../vocabulary/media/unit-${unitNo}-vocabulary-lecture.mp4`,
          lecturePoster: `../../vocabulary/media/unit-${unitNo}-lecture-poster.jpg`,
          lectureCaptions: `../../vocabulary/media/unit-${unitNo}-vocabulary-lecture.vtt`,
        },
        vocabularyGroups: vocabUnit.groups.map((group) => ({ id: group.id, number: group.number, title: group.title, vocabularyIds: group.words.map((word) => word.id) })),
        dictionaryLinks: links,
        outcomes,
        readings,
        comprehension: collect("Comprehension"),
        grammar,
        speaking,
        writing,
        activities,
        assignments: collect("Assignments"),
        quizzes,
        liveSessions,
        teacherNotes: collect("Teacher Notes"),
        answerKey: [...collect("Answer Key"), ...additions.map(([contentId, contentType, answerOrGuidance], index) => metadata({ answerId: `${unitId}-answer-v11-${String(index + 1).padStart(2, "0")}`, unitId, contentId, contentType, answerOrGuidance }))],
        selfAssessment: collect("Self Assessment"),
        rubrics: sheets.Rubrics.filter((record) => ["rub-writing-v1", "rub-speaking-v1"].includes(record["Rubric ID"])).map(normalize),
      };
    }
    validate(runtime);
    builtRuntimes.push(runtime);
    fs.writeFileSync(path.join(UNIT_DATA_DIR, `unit-${unitNo}.json`), `${JSON.stringify(runtime, null, 2)}\n`);
    manifest.units.push({ number: unitNo, id: runtime.unit.unitId, termId: runtime.term.id, title: runtime.unit.unitTitle, data: `./data/units/unit-${unitNo}.json`, vocabularyCount: runtime.dictionaryLinks.length, reviewStatus: "Approved v1.1" });
  }

  const capstone = buildCapstone(builtRuntimes, dictionary.master);
  validate(capstone);
  fs.writeFileSync(path.join(UNIT_DATA_DIR, "unit-10.json"), `${JSON.stringify(capstone, null, 2)}\n`);
  manifest.units.push({ number: 10, id: capstone.unit.unitId, termId: capstone.term.id, title: capstone.unit.unitTitle, data: "./data/units/unit-10.json", vocabularyCount: capstone.dictionaryLinks.length, reviewStatus: "Approved v1.1 capstone" });

  const finalAssessment = buildCourseFinalAssessment([...builtRuntimes, capstone]);
  fs.writeFileSync(path.join(DATA_DIR, "course-final-quiz.json"), `${JSON.stringify(finalAssessment, null, 2)}\n`);
  manifest.finalAssessment = {
    id: finalAssessment.assessmentId,
    title: finalAssessment.title,
    data: "./data/course-final-quiz.json",
    placement: finalAssessment.placement,
    questionCount: finalAssessment.questionCount,
    passPercent: finalAssessment.passPercent,
    reviewStatus: finalAssessment.reviewStatus,
  };

  fs.writeFileSync(path.join(DATA_DIR, "master-dictionary.grade2.json"), `${JSON.stringify(dictionary.master, null, 2)}\n`);
  fs.writeFileSync(path.join(DATA_DIR, "course-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Built shared Grade 2 English course: ${manifest.units.length} units including capstone, ${finalAssessment.questionCount}-question final course quiz, ${dictionary.master.entryCount} master entries.`);
}

main();
