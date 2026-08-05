// English subject module for the unified course-app shell (P1.5).
// English is the outlier: grade param, three localStorage stores (main +
// final-quiz + AI), six data files, and its own audio engine (file-based
// reading/grammar/speaking narration + ElevenLabs TTS/STT pronunciation) — so it
// sets config.disableShellVoice and keeps its bespoke subsystems. The shell owns
// boot/route, the main progress store + ProgressClient, nav, and layout. Section
// renderers and all English subsystems are kept BYTE-FOR-BYTE from
// english/shared/course-ui.js via `let` bindings populated by bind(ctx).
import { escapeHtml as sharedEscapeHtml, icon as sharedIcon, pageHeader as sharedPageHeader } from "../../shared/course-shell.js?v=20260721a";
import { grammarDiagram, phonicsDiagram } from "../../english/shared/grammar-visuals.js?v=english-20260723a";
import { createCourseApp } from "../course-app.js?v=t2";
import { wordPicture } from "./word-pictures.js?v=pictures-1";
import { askWehel, outlineFromManifest, unitFetcher, browserSpeechSupported, speakBrowser, speechRateForGrade, stopBrowserSpeech, speechRecognitionCtor, recognizeSpeech, wehelIcon } from "../wehel.js?v=wehel-1";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const routeParams = new URLSearchParams(location.search);
// Must resolve to the same number as course-app.js's stageNumber, which reads
// `grade` then `stage` from the query and then from data- attributes. English is
// the only subject that derives this twice — the others read ctx.stageNumber —
// and reading one fewer source made the two disagree: with ?stage=1 the shell
// built dataRootUrl content/english/g01/ while this fell through to its default
// of 2 and asked for master-dictionary.grade2.json, a 404 that left the course
// blank. Learners arrive via grade-N/index.html carrying data-grade, so only a
// ?stage= link hit it. Keep this chain in step with that one.
const requestedGrade = Number(routeParams.get("grade") || routeParams.get("stage")
  || document.documentElement.dataset.grade || document.documentElement.dataset.stage || 2);
const gradeNumber = requestedGrade >= 1 && requestedGrade <= 8 ? requestedGrade : 2;
const gradeLabel = `Grade ${gradeNumber}`;
function cambridgeFramework(stage) {
  return Number(stage) <= 6
    ? { level: "Cambridge Primary English", code: "0058" }
    : { level: "Cambridge Lower Secondary English", code: "0861" };
}
function cambridgeLabel(stage) {
  const fw = cambridgeFramework(stage);
  return `${fw.level} ${fw.code} — Stage ${stage}`;
}
const gradeRootUrl = new URL(`./grade-${gradeNumber}/`, location.href);
const AUDIO_IS_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);
function resolveMediaUrl(source) {
  let s = String(source);
  if (!AUDIO_IS_DEV) {
    const m = s.match(/media\/audio\/grade-(\d+)\/([a-z]+)\/(.+)$/i);
    if (m) s = `../../media/english/g${String(m[1]).padStart(2, "0")}/audio/${m[2]}/${m[3]}`;
  }
  return new URL(s, document.baseURI).href;
}
// Bunny serves .vtt as application/octet-stream: it ignores the Content-Type
// the upload sends and derives one from the extension, and its table has no
// entry for .vtt (every other extension we ship resolves correctly). The HTML
// spec requires text/vtt for a text track, so a browser stricter than Chrome
// is entitled to drop the captions. Re-serve the cues from a blob we type
// ourselves, which depends on nothing the CDN reports. Failure is silent by
// design — the track keeps its original src, exactly as before.
async function attachCaptions(video) {
  const track = video.querySelector("track");
  if (!track || !track.src) return;
  try {
    const res = await fetch(track.src);
    if (!res.ok) return;
    const vtt = await res.text();
    if (!/^﻿?WEBVTT/.test(vtt)) return;
    track.src = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
  } catch {
    /* keep the original src; captions are an enhancement, not a gate */
  }
}
const defaultUnit = gradeNumber === 1 ? 0 : 1;
// Unit -1 is the Prerequisite unit, present on every grade before Unit 1: a
// placement exam over the previous grades' essential outcomes. It has no
// units/unit-*.json of its own — load() fetches placement-exam.json instead
// and synthesizes the small course shell the shared chrome needs.
const PREREQ_UNIT = -1;
const requestedUnit = Number(routeParams.get("unit") ?? defaultUnit);
const isPrereqUnit = requestedUnit === PREREQ_UNIT;
const unitNumber = isPrereqUnit ? PREREQ_UNIT : (requestedUnit >= defaultUnit && requestedUnit <= 10 ? requestedUnit : defaultUnit);
const STORAGE_KEY = `ehel-english-g${gradeNumber}-u${unitNumber}-progress-v1`;
const FINAL_QUIZ_STORAGE_KEY = `ehel-english-g${gradeNumber}-course-final-quiz-v1`;
const PLACEMENT_STORAGE_KEY = `ehel-english-g${gradeNumber}-placement-exam-v1`;
const AI_STORAGE_KEY = `ehel-english-g${gradeNumber}-u${unitNumber}-ai-v1`;
const AI_VOICE_ID = "XfNU2rGpBa01ckF309OY";
const AI_NARRATION_RATE = 0.90;
const AI_TTS_ENDPOINT = AUDIO_IS_DEV && location.port === "4287" ? "/api/elevenlabs-tts" : "/local/hubredirect/quiz_tts.php";
const AI_STT_ENDPOINT = "/local/hubredirect/quiz_stt.php";

// Shell-provided bindings (populated by bind(ctx)). English keeps its own
// pageHeader/toast/escapeHtml/icon(s) — only progress + nav come from the shell.
let progress, complete, updateProgress, saveProgress, navigate, renderNav, emitProgress, unitSectionIds, dataRootUrl, PROGRESS_UNIT;
let shellCtx;
function bind(ctx) {
  ({ complete, updateProgress, saveProgress, navigate, renderNav, emitProgress, unitSectionIds, dataRootUrl, PROGRESS_UNIT } = ctx);
  progress = ctx.progress;
  shellCtx = ctx;
}

// ===================== english body (verbatim) =====================
const sections = [
  ["overview", "layout-dashboard", "Overview"],
  ["lecture", "play-square", "Teacher lecture"],
  ["ai", "sparkles", "Wehel Tutor"],
  ["dictionary", "book-a", "Vocabulary"],
  ["reading", "book-open", "Reading & story"],
  ["comprehension", "list-checks", "Comprehension"],
  ["grammar", "braces", "Grammar"],
  ["speaking", "messages-square", "Speaking"],
  ["writing", "pencil-line", "Writing"],
  ["activities", "shapes", "Activities"],
  ["games", "gamepad-2", "Games"],
  ["quiz", "badge-check", "Quiz"],
  ["ebooks", "library-big", "Books"],
  ["live", "video", "Live sessions"],
  ["reflect", "sparkles", "My progress"],
];

const ebookCatalog = [
  {
    id: "smile-please",
    title: "Smile Please!",
    grades: [1],
    units: [0],
    level: "Level 1",
    description: "Follow a young fawn as he races through the forest and discovers a reason to smile.",
    author: "Sanjiv Jaiswal 'Sanjay'",
    illustrator: "Ajit Narayan",
    translator: "Manisha Chaudhry",
    sourcePdf: "./ebooks/smile-please/original.pdf",
    attribution: "Smile Please! (English), translated by Manisha Chaudhry, published by Pratham Books (© Pratham Books, 2007), based on the original Hindi story written by Sanjiv Jaiswal 'Sanjay' and illustrated by Ajit Narayan. Licensed CC BY 4.0 on StoryWeaver. Digitally adapted by Ehel Academy; the illustrations and story wording are preserved.",
    pages: [
      { image: "page-01.webp", text: "Smile Please! Written by Sanjiv Jaiswal 'Sanjay'. Illustrated by Ajit Narayan. Translated by Manisha Chaudhry.", alt: "Cover illustration of a fawn and rabbit racing through a green forest" },
      { image: "page-02.webp", text: "A fawn was racing in the forest.", alt: "A young fawn running quickly through the forest" },
      { image: "page-03.webp", text: "He was ahead of the rabbit.", alt: "The fawn racing ahead of a white rabbit" },
      { image: "page-04.webp", text: "He was ahead of the elephant.", alt: "The fawn racing ahead of a smiling elephant" },
      { image: "page-05.webp", text: "He leapt and cleared the stream.", alt: "The fawn leaping over a stream" },
      { image: "page-06.webp", text: "He ran past the crumbling wall.", alt: "The fawn running past an old wall" },
      { image: "page-07.webp", text: "There was a large boulder on the grassy plain. He stumbled and fell down.", alt: "The fawn stumbling over a boulder on the grass" },
      { image: "page-08.webp", text: "He burst into tears.", alt: "The fawn sitting on the ground and crying" },
      { image: "page-09.webp", text: "The monkey massaged his leg. Tears flowed from the fawn's eyes.", alt: "A monkey gently massaging the crying fawn's leg" },
      { image: "page-10.webp", text: "Brother Bear picked him up. The fawn didn't stop crying.", alt: "A bear comforting and lifting the crying fawn" },
      { image: "page-11.webp", text: "His mother came. She said, “Look, we'll beat up this bad boulder!”", alt: "The mother deer standing beside her young fawn" },
      { image: "page-12.webp", text: "The fawn said, “Oh, don't do that or he will also start crying.” His mother laughed. So did the fawn.", alt: "The mother deer and fawn smiling and laughing together" },
    ],
  },
  {
    id: "too-big-too-small",
    title: "Too Big! Too Small!",
    grades: [1],
    units: [0],
    level: "Level 1",
    description: "Shanu wonders how she can be too big for some things and too small for others.",
    author: "Lavanya Karthik",
    illustrator: "Lavanya Karthik",
    sourcePdf: "./ebooks/too-big-too-small/original.pdf",
    attribution: "Too Big! Too Small! (English), written and illustrated by Lavanya Karthik, supported by Parag: A Sir Ratan Tata Trust Initiative, published by Pratham Books (© Pratham Books, 2017). Licensed CC BY 4.0 on StoryWeaver. Digitally adapted by Ehel Academy; the illustrations and story wording are preserved.",
    pages: [
      { image: "page-01.webp", text: "Too Big! Too Small! Written and illustrated by Lavanya Karthik.", alt: "Cover illustration showing Shanu, two cats and a pair of grown-up feet" },
      { image: "page-02.webp", text: "“I can't lift you up, Shanu!” says Ammi. “You are too big!”", alt: "Shanu asking Ammi to lift her" },
      { image: "page-03.webp", text: "“You can't walk to school alone, Shanu!” says Abbu. “You are too small!”", alt: "Abbu following Shanu as she walks with her school bag" },
      { image: "page-04.webp", text: "“You can't sleep in the baby's cot, Shanu!” says Dadu. “You are too big!”", alt: "Shanu trying to climb into the baby's cot while Dadu watches" },
      { image: "page-05.webp", text: "“You can't carry the baby to the park, Shanu!” says Dadi. “You are too small!”", alt: "Shanu trying to carry the baby while Dadi watches" },
      { image: "page-06.webp", text: "Shanu is puzzled. Too big! Too small! How can she be too big and too small all at once?", alt: "A puzzled Shanu imagining herself as very small" },
      { image: "page-07.webp", text: "Too big to wear her old pink frock. Too small to make dosas at the stove.", alt: "Shanu holding her old pink frock and looking at a dosa cooking on the stove" },
      { image: "page-08.webp", text: "Too big to climb up on Dadu's back? Too small to carry the baby on hers?", alt: "Shanu sitting on Dadu's back and imagining carrying the baby" },
      { image: "page-09.webp", text: "“What am I the right size for?” Shanu wonders.", alt: "Shanu sitting on a large cat and wondering about her size" },
      { image: "page-10.webp", text: "Ammi smiles and says, “Why, you are just big enough to go to big school.”", alt: "Ammi smiling as she shows Shanu her school uniform" },
      { image: "page-11.webp", text: "“And you are just small enough for me to carry you on my shoulders,” says Abbu.", alt: "A happy Shanu riding on Abbu's shoulders" },
      { image: "page-12.webp", text: "“You are just big enough to take me for my morning walks,” says Dadu.", alt: "Shanu and Dadu enjoying a morning walk together" },
      { image: "page-13.webp", text: "“And you are just small enough for me to tell stories to,” says Dadi.", alt: "Dadi telling Shanu a story filled with imaginative characters" },
      { image: "page-14.webp", text: "“And you will always, always be the perfect size for this!” all say, and give her a warm, wonderful hug.", alt: "Shanu receiving a warm family hug" },
    ],
  },
  {
    id: "musas-muddy-stripes",
    title: "Musa's Muddy Stripes",
    grades: [1],
    units: [0],
    level: "Level 1",
    description: "Musa slips into a muddy puddle, and his savanna friends help his stripes shine again.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    sourcePdf: "./ebooks/musas-muddy-stripes/original.pdf",
    attribution: "Musa's Muddy Stripes is an original Grade 1 story created for Ehel Academy in 2026. Story and illustrations by Ehel Academy Learning Studio, drawn in the shared Musa series vector style. No story wording or artwork from Smile Please! was reused.",
    pages: [
      { image: "page-01.svg", sound: "zebra-happy", text: "Musa's Muddy Stripes. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Musa the young zebra standing with a giraffe, elephant, ostrich and vervet monkey on the African savanna" },
      { image: "page-02.svg", text: "Musa the zebra loved to run.", alt: "Musa running through golden savanna grass on a sunny morning" },
      { image: "page-03.svg", sound: "giraffe", text: "He ran past the tall giraffe.", alt: "Musa running ahead of his smiling giraffe friend" },
      { image: "page-04.svg", sound: "elephant-happy", text: "He ran past the little elephant.", alt: "Musa running ahead while a young elephant waves her trunk" },
      { image: "page-05.svg", sound: "ostrich", text: "He ran past the swift ostrich.", alt: "Musa and his ostrich friend running together across the savanna" },
      { image: "page-06.svg", text: "He leapt over a fallen branch.", alt: "Musa making a joyful leap over a small fallen branch" },
      { image: "page-07.svg", sound: "puddle", text: "Then - SPLASH! Musa slipped into a muddy puddle.", alt: "A surprised Musa landing safely in a shallow muddy puddle" },
      { image: "page-08.svg", sound: "zebra-sad", text: "Mud covered his stripes. Musa felt sad.", alt: "Musa standing sadly beside the puddle with wet mud on his stripes" },
      { image: "page-09.svg", sound: "monkey", text: "The vervet monkey brushed him with soft leaves. But the mud stayed.", alt: "A vervet monkey gently brushing mud from Musa with green leaves" },
      { image: "page-10.svg", sound: "elephant-happy", text: "The elephant sprayed Musa with cool water. Splash, splash, splash!", alt: "The young elephant rinsing muddy Musa with a sparkling arc of water" },
      { image: "page-11.svg", sound: "ostrich", text: "The ostrich fanned him. The giraffe found a warm, sunny place.", alt: "The ostrich fanning Musa while the giraffe points toward the warm sun" },
      { image: "page-12.svg", sound: "zebra-happy", text: "Musa's stripes shone again. \"Thank you, friends!\" he said. Then everyone splashed and laughed.", alt: "A clean and happy Musa splashing in the puddle while all his friends laugh together" },
    ],
  },
  {
    id: "musa-helps-a-friend",
    title: "Musa Helps a Friend",
    grades: [1],
    units: [0],
    level: "Level 1",
    description: "The little elephant is stuck in the mud, and Musa knows just what good friends can do.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Musa Helps a Friend is an original Grade 1 story created for Ehel Academy in 2026, the sequel to Musa's Muddy Stripes. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "zebra-happy", text: "Musa Helps a Friend. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Musa the young zebra with the giraffe, little elephant, ostrich and vervet monkey around a big puddle on the savanna" },
      { image: "page-02.svg", sound: "tree", text: "Rain fell all night. The savanna was full of puddles.", alt: "The savanna on a gray morning after rain, dotted with fresh puddles" },
      { image: "page-03.svg", sound: "puddle", text: "Musa the zebra ran out to play. Splish, splash!", alt: "Musa happily splashing through a shallow puddle in the morning light" },
      { image: "page-04.svg", sound: "elephant-sad", text: "Then he heard a sad sound. \"Help! Help!\"", alt: "Musa standing alert with his ears up, listening toward the tall reeds" },
      { image: "page-05.svg", text: "The little elephant was stuck in the deep mud.", alt: "The little elephant stuck belly-deep in a wide muddy puddle, looking sad" },
      { image: "page-06.svg", sound: "zebra-happy", text: "\"Do not be sad,\" said Musa. \"Friends can help!\"", alt: "Musa at the edge of the puddle speaking kindly to the sad little elephant" },
      { image: "page-07.svg", sound: "monkey", text: "Musa called the giraffe, the ostrich, and the monkey.", alt: "The giraffe, ostrich and vervet monkey hurrying across the grass toward Musa" },
      { image: "page-08.svg", text: "The monkey found a long, strong vine. The elephant held it with her trunk.", alt: "The vervet monkey holding one end of a long vine while the little elephant grips the other end with her trunk" },
      { image: "page-09.svg", sound: "ostrich", text: "Musa pulled. The giraffe pulled. The ostrich pulled. \"One, two, three!\"", alt: "Musa, the giraffe and the ostrich pulling the vine together while the monkey cheers" },
      { image: "page-10.svg", sound: "elephant-surprised", text: "POP! Out came the little elephant. Mud flew everywhere!", alt: "The little elephant popping free of the mud as drops of mud fly through the air" },
      { image: "page-11.svg", sound: "monkey", text: "Now everyone was muddy. They laughed and laughed.", alt: "All five friends speckled with mud, laughing together beside the puddle" },
      { image: "page-12.svg", sound: "elephant-happy", text: "\"Thank you, friends!\" said the little elephant. \"Helping a friend is the best game of all.\"", alt: "The friends splashing in clean rainwater under a soft rainbow while the little elephant beams" },
    ],
  },
  {
    id: "musas-big-race",
    title: "Musa's Big Race",
    grades: [1],
    units: [0],
    level: "Level 1",
    description: "It is race day on the savanna, and Musa must choose between winning and a friend.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Musa's Big Race is an original Grade 1 story created for Ehel Academy in 2026, book three of the Musa series after Musa's Muddy Stripes and Musa Helps a Friend. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "zebra-happy", text: "Musa's Big Race. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Musa the young zebra with the giraffe, little elephant, ostrich and vervet monkey under a colorful race-day banner" },
      { image: "page-02.svg", text: "It was race day on the savanna. All the friends came to run.", alt: "The five friends lining up near the bunting banner on a bright morning" },
      { image: "page-03.svg", sound: "monkey", text: "\"Ready, steady, go!\" called the monkey.", alt: "The monkey raising both arms to start the race as Musa, the ostrich and the elephant burst into a run" },
      { image: "page-04.svg", sound: "zebra-happy", text: "Musa ran fast. He was in front!", alt: "Musa running joyfully in front while the giraffe, ostrich and elephant follow behind" },
      { image: "page-05.svg", sound: "tree", text: "He ran past the big acacia tree.", alt: "Musa running past one grand old acacia tree" },
      { image: "page-06.svg", text: "He leapt over the fallen branch.", alt: "Musa making a clean joyful leap over the familiar fallen branch" },
      { image: "page-07.svg", sound: "elephant-sad", text: "Then - BUMP! The little elephant tripped and fell.", alt: "The little elephant sitting fallen in the grass with soft dust puffs around her while the ostrich races ahead" },
      { image: "page-08.svg", sound: "zebra-surprised", text: "Musa stopped. The finish line was so close!", alt: "Musa stopped mid-race, looking back toward his fallen friend with the finish banner close behind him" },
      { image: "page-09.svg", text: "Musa ran back. \"Are you hurt, my friend?\" he asked.", alt: "Musa running back to the sad little elephant with a small heart floating in the air" },
      { image: "page-10.svg", sound: "elephant-happy", text: "He helped her up. They ran the last part together.", alt: "Musa and the smiling little elephant running side by side toward the distant banner" },
      { image: "page-11.svg", sound: "ostrich", text: "The ostrich won the race. Everyone cheered and cheered!", alt: "The ostrich under the finish banner amid falling confetti while all the friends cheer" },
      { image: "page-12.svg", sound: "zebra-happy", text: "\"You stopped for me,\" said the little elephant. \"You are a real winner, Musa.\"", alt: "All five friends together under a soft rainbow with the little elephant beaming beside Musa" },
    ],
  },
  {
    id: "kiki-goes-to-school",
    title: "Kiki Goes to School",
    grades: [1],
    units: [1],
    level: "Level 1",
    description: "It is Kiki's first day at the tree school, and she is a little shy.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Kiki Goes to School is an original Grade 1 story created for Ehel Academy in 2026, book one of the Kiki series, set in the same storyworld as the Musa books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "kiki-happy", text: "Kiki Goes to School. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Kiki the young vervet monkey with her red school bag at the tree school with her teacher and classmates" },
      { image: "page-02.svg", text: "Today was Kiki's first day of school. She had a new red bag.", alt: "Kiki setting off from the baobab home with her red backpack while Mama and Papa wave" },
      { image: "page-03.svg", sound: "zebra-happy", text: "On the path she met Musa. \"Good luck, Kiki!\" he said.", alt: "Musa the zebra greeting Kiki on the path to school" },
      { image: "page-04.svg", sound: "kiki-sad", text: "The school was big. Kiki felt shy.", alt: "Kiki standing small and shy in front of the big tree school with its chalkboard and bell" },
      { image: "page-05.svg", sound: "giraffe", text: "\"Welcome!\" said Miss Twiga, the teacher.", alt: "Miss Twiga the giraffe teacher with her reading glasses bending down to welcome Kiki" },
      { image: "page-06.svg", sound: "elephant-happy", text: "Kiki sat on a bench next to the little elephant.", alt: "Kiki and the little elephant sitting together at a school bench" },
      { image: "page-07.svg", text: "They learned to say hello. \"Hello! Hello!\"", alt: "The class raising their hands by the chalkboard as they learn to say hello" },
      { image: "page-08.svg", text: "They counted one, two, three!", alt: "The class counting three dots drawn on the chalkboard" },
      { image: "page-09.svg", sound: "kiki-happy", text: "At playtime, Kiki shared her sweet mango.", alt: "Kiki sharing her mango with the little elephant at playtime" },
      { image: "page-10.svg", sound: "ostrich", text: "She made a new friend, the little ostrich.", alt: "Kiki playing with her new friend the little ostrich in the grass" },
      { image: "page-11.svg", sound: "bell", text: "Ring, ring! The school bell rang. Home time!", alt: "The school bell ringing as the children wave goodbye to Miss Twiga" },
      { image: "page-12.svg", sound: "crickets", text: "\"I love school!\" Kiki told her family that night.", alt: "Kiki telling her family about school outside the lit baobab home under the stars" },
    ],
  },
  {
    id: "kikis-family-day",
    title: "Kiki's Family Day",
    grades: [1],
    units: [2],
    level: "Level 1",
    description: "A day at home with Mama, Papa and little sister Nia in the big baobab tree.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Kiki's Family Day is an original Grade 1 story created for Ehel Academy in 2026, book two of the Kiki series, set in the same storyworld as the Musa books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "kiki-happy", text: "Kiki's Family Day. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Kiki with Mama, Papa and little sister Nia in front of the big baobab tree" },
      { image: "page-02.svg", sound: "tree", text: "Kiki's home was in the big baobab tree.", alt: "The big baobab tree home with its round door and window" },
      { image: "page-03.svg", sound: "monkey", text: "This is Mama. This is Papa. And this is her little sister, Nia.", alt: "Mama with a flower behind her ear, big Papa, and tiny little sister Nia" },
      { image: "page-04.svg", text: "Mama cooked dinner. Kiki helped stir the pot.", alt: "Mama and Kiki cooking dinner in a big pot over the fire" },
      { image: "page-05.svg", text: "Papa picked mangoes. Kiki helped carry them.", alt: "Papa picking mangoes from the tree while Kiki carries some" },
      { image: "page-06.svg", sound: "kiki-sad", text: "Little Nia dropped her banana. She cried and cried.", alt: "Little Nia crying over her dropped banana while Kiki looks around in surprise" },
      { image: "page-07.svg", sound: "kiki-happy", text: "\"Do not cry,\" said Kiki. \"You can have mine.\"", alt: "Kiki giving her own banana to little Nia with a small heart floating in the air" },
      { image: "page-08.svg", sound: "monkey", text: "The family ate dinner together. Yum, yum!", alt: "The whole monkey family eating dinner together around the pot" },
      { image: "page-09.svg", sound: "zebra-happy", text: "Papa told a story about a brave little zebra.", alt: "Papa telling a bedtime story while a little zebra runs through a thought bubble" },
      { image: "page-10.svg", sound: "lullaby", text: "Mama sang a soft, sweet song.", alt: "Mama singing a lullaby under the stars with music notes floating" },
      { image: "page-11.svg", text: "Kiki hugged her family. \"Good night, good night!\"", alt: "Kiki and Nia hugging Mama and Papa good night by the lit baobab home" },
      { image: "page-12.svg", sound: "crickets", text: "Kiki slept and dreamed of her happy home.", alt: "The quiet baobab home at night under the moon and stars" },
    ],
  },
  {
    id: "kiki-and-the-big-game",
    title: "Kiki and the Big Game",
    grades: [1],
    units: [3],
    level: "Level 1",
    description: "Ball, swing and a runaway kite - play day with Kiki and her friends.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Kiki and the Big Game is an original Grade 1 story created for Ehel Academy in 2026, book three of the Kiki series, set in the same storyworld as the Musa books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "kiki-happy", text: "Kiki and the Big Game. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the school playground with Kiki, the swing, the ball and a red kite" },
      { image: "page-02.svg", sound: "bell", text: "It was play day at school. Hooray!", alt: "Miss Twiga and the excited children at school on play day" },
      { image: "page-03.svg", sound: "ball", text: "Kiki and her friends played with the ball.", alt: "Kiki, the little elephant and the little ostrich playing with a striped ball" },
      { image: "page-04.svg", sound: "ostrich", text: "The little ostrich ran fast. Run, run, run!", alt: "The little ostrich running fast while Kiki cheers" },
      { image: "page-05.svg", sound: "kiki-happy", text: "Kiki went high on the swing. Whee!", alt: "Kiki swinging high on the rope swing under the big acacia" },
      { image: "page-06.svg", sound: "wind", text: "They flew a big red kite. Up, up, up!", alt: "Kiki and the little elephant flying a big red kite" },
      { image: "page-07.svg", sound: "wind", text: "Then the wind took the kite. Oh no!", alt: "The wind carrying the red kite away while Kiki and the elephant watch in surprise" },
      { image: "page-08.svg", sound: "kiki-sad", text: "The kite was stuck in the tall, tall tree.", alt: "The red kite stuck high in the tall acacia while Kiki and the elephant look sad" },
      { image: "page-09.svg", sound: "kiki-surprised", text: "\"I know!\" said Kiki. \"Let us ask a tall friend.\"", alt: "Kiki jumping up with an idea while her friends watch" },
      { image: "page-10.svg", sound: "giraffe", text: "The giraffe reached up, up, up. She got the kite!", alt: "The tall giraffe reaching high into the acacia for the stuck kite" },
      { image: "page-11.svg", sound: "zebra-happy", text: "\"Thank you!\" they cheered. Musa came to play too.", alt: "The friends cheering with the rescued kite as Musa the zebra arrives to play" },
      { image: "page-12.svg", sound: "kiki-happy", text: "Everyone took turns. Games are best with friends!", alt: "All the friends playing together with the ball, the swing and the kite flying high" },
    ],
  },
  {
    id: "duku-makes-a-scarecrow",
    title: "Duku Makes a Scarecrow",
    grades: [1],
    units: [4],
    level: "Level 1",
    description: "The birds are eating Koko's seeds, so Duku and his farm friends make something wonderful.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Duku Makes a Scarecrow is an original Grade 1 story created for Ehel Academy in 2026, book one of the Duku farm series, set in the same storyworld as the Musa and Kiki books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "duku-happy", text: "Duku Makes a Scarecrow. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Duku the little donkey with Koko the hen, Gigi the goat and their scarecrow by the barn" },
      { image: "page-02.svg", sound: "duku-happy", text: "Duku the little donkey lived on a green farm.", alt: "Duku the little gray donkey standing happily on the farm by the barn and fence" },
      { image: "page-03.svg", sound: "hen", text: "Koko the hen planted little seeds.", alt: "Koko the rust-brown hen planting a neat row of little seeds" },
      { image: "page-04.svg", sound: "bird", text: "But the birds came to eat them. Oh no!", alt: "Little blue birds landing on the seed row while Koko flaps in surprise" },
      { image: "page-05.svg", sound: "duku-surprised", text: "\"Let us make a scarecrow!\" said Duku.", alt: "Duku having a bright idea while Koko and Gigi listen" },
      { image: "page-06.svg", sound: "goat", text: "Gigi the goat found a long stick.", alt: "Gigi the cream goat carrying a long wooden stick" },
      { image: "page-07.svg", sound: "hen", text: "Koko brought straw. Duku brought an old hat.", alt: "Koko by the haystack and Duku with an old brown hat" },
      { image: "page-08.svg", text: "They worked and worked. Tap, tap, tap!", alt: "The three friends building the scarecrow together with dust puffing up" },
      { image: "page-09.svg", sound: "duku-happy", text: "The scarecrow was done. It looked funny!", alt: "The finished friendly scarecrow with its hat while the friends laugh" },
      { image: "page-10.svg", sound: "bird", text: "The birds flew away... but they looked hungry.", alt: "The little birds flying away from the scarecrow while Duku watches with a sad face" },
      { image: "page-11.svg", text: "So the friends made a little garden just for the birds.", alt: "The friends planting a small garden while the little birds watch happily" },
      { image: "page-12.svg", sound: "duku-happy", text: "Now everyone had food. What a good thing to make!", alt: "The scarecrow guarding the big garden while the birds eat from their own little garden" },
    ],
  },
  {
    id: "the-little-lost-chick",
    title: "The Little Lost Chick",
    grades: [1],
    units: [5],
    level: "Level 1",
    description: "Little Pip the chick is missing, and the whole farm helps to look.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Little Lost Chick is an original Grade 1 story created for Ehel Academy in 2026, book two of the Duku farm series, set in the same storyworld as the Musa and Kiki books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "hen", text: "The Little Lost Chick. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Koko the hen with her five little yellow chicks by the barn" },
      { image: "page-02.svg", sound: "bird", text: "Good morning, farm! The sun was up.", alt: "The farm on a bright morning with Duku by the barn" },
      { image: "page-03.svg", sound: "chick", text: "Koko the hen had five little chicks.", alt: "Koko proudly watching her five little chicks in a row" },
      { image: "page-04.svg", sound: "chick", text: "One little chick liked to hop. Hop, hop, hop!", alt: "Little Pip the chick hopping happily while Koko watches" },
      { image: "page-05.svg", sound: "hen", text: "At lunch, Koko counted: one, two, three, four... Oh no!", alt: "Koko counting only four chicks and looking surprised" },
      { image: "page-06.svg", sound: "duku-sad", text: "\"Where is little Pip?\" Everyone looked and looked.", alt: "Koko, Duku and Gigi looking worried about the missing chick" },
      { image: "page-07.svg", sound: "duku-surprised", text: "Duku looked in the big barn.", alt: "Duku peering into the big red barn" },
      { image: "page-08.svg", sound: "goat", text: "Gigi looked by the pond.", alt: "Gigi the goat searching beside the blue pond" },
      { image: "page-09.svg", sound: "zebra-happy", text: "Musa looked in the tall, tall grass.", alt: "Musa the zebra searching through the tall savanna grass" },
      { image: "page-10.svg", text: "Then they heard a tiny sound. \"Peep! Peep!\"", alt: "The friends listening to a tiny sound coming from the haystack" },
      { image: "page-11.svg", sound: "chick", text: "Little Pip was asleep in the soft hay.", alt: "Little Pip the chick asleep on top of the soft haystack" },
      { image: "page-12.svg", sound: "hen", text: "\"Safe at home!\" said Koko. The whole farm was happy.", alt: "Koko with all five chicks together again while Duku and Gigi smile" },
    ],
  },
  {
    id: "dukus-five-senses",
    title: "Duku's Five Senses",
    grades: [1],
    units: [6],
    level: "Level 1",
    description: "See, hear, smell, touch and taste - a fresh farm day with Duku and a visit from Kiki.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Duku's Five Senses is an original Grade 1 story created for Ehel Academy in 2026, book three of the Duku farm series, set in the same storyworld as the Musa and Kiki books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "duku-happy", text: "Duku's Five Senses. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Duku the donkey and Kiki the monkey on the farm with a flower and a mango" },
      { image: "page-02.svg", sound: "duku-happy", text: "Duku woke up. What a fresh new day!", alt: "Duku waking up happily by the barn on a fresh morning" },
      { image: "page-03.svg", sound: "sun", text: "He saw the bright yellow sun.", alt: "Duku looking at the big bright glowing sun" },
      { image: "page-04.svg", sound: "bird", text: "He heard the little birds sing.", alt: "Duku listening to little blue birds singing in the acacia tree" },
      { image: "page-05.svg", sound: "tree", text: "He smelled the sweet mango tree.", alt: "Duku smelling the sweet scent drifting from the mango tree" },
      { image: "page-06.svg", text: "He touched the soft, soft hay.", alt: "Duku pressing his nose into the big soft haystack" },
      { image: "page-07.svg", sound: "crunch", text: "He tasted a crunchy carrot. Yum!", alt: "Duku happily tasting a big crunchy carrot" },
      { image: "page-08.svg", sound: "kiki-happy", text: "Then Kiki came to visit the farm!", alt: "Kiki the monkey arriving at the farm to visit Duku" },
      { image: "page-09.svg", sound: "bell", text: "\"Close your eyes,\" said Kiki. \"What do you hear?\" \"A bell!\"", alt: "Kiki ringing the bell while Duku guesses with his ears up" },
      { image: "page-10.svg", text: "\"What do you smell?\" \"A flower!\"", alt: "Duku smelling a big pink flower while Kiki smiles" },
      { image: "page-11.svg", sound: "crunch", text: "\"What do you taste?\" \"Sweet mango!\"", alt: "Duku tasting a sweet mango in the guessing game" },
      { image: "page-12.svg", sound: "duku-happy", text: "Eyes, ears, nose, hooves and mouth. Five senses - hooray!", alt: "Duku and Kiki celebrating with the flower, carrot, mango and a little bird" },
    ],
  },
  {
    id: "lulu-says-lets-go",
    title: "Lulu Says Let's Go!",
    grades: [1],
    units: [7],
    level: "Level 1",
    description: "Lulu the little swallow sets off on her big journey to the great lake.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Lulu Says Let's Go! is an original Grade 1 story created for Ehel Academy in 2026, book one of the Lulu journey series, set in the same storyworld as the Musa, Kiki and Duku books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "lulu-happy", text: "Lulu Says Let's Go! Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Lulu the little swallow flying high over the savanna while Musa and the monkey wave below" },
      { image: "page-02.svg", sound: "bird", text: "Lulu was a little swallow. She lived by the big acacia.", alt: "Lulu the blue swallow perched in the big acacia tree" },
      { image: "page-03.svg", sound: "lulu-happy", text: "It was time to fly to the great lake. \"Let's go!\"", alt: "Lulu taking off into the sky with another bird" },
      { image: "page-04.svg", sound: "zebra-happy", text: "\"Goodbye, Musa!\" called Lulu. \"See you soon!\"", alt: "Musa the zebra by his puddle waving goodbye as Lulu flies over" },
      { image: "page-05.svg", sound: "duku-happy", text: "She flew over Duku's farm. \"Good luck, Lulu!\"", alt: "Lulu flying over the farm while Duku the donkey calls up from below" },
      { image: "page-06.svg", sound: "wind", text: "Up, up, up went Lulu. The world looked small.", alt: "Lulu high in the sky with tiny trees and a tiny barn far below" },
      { image: "page-07.svg", sound: "wind", text: "She flew fast. She flew far.", alt: "Lulu speeding through the sky with wind lines behind her" },
      { image: "page-08.svg", sound: "lulu-sad", text: "Then Lulu felt tired. Her wings were slow.", alt: "A tired Lulu flying slowly under a gray sky" },
      { image: "page-09.svg", sound: "tree", text: "She stopped to rest in a tall tree.", alt: "Lulu resting quietly in a tall acacia tree" },
      { image: "page-10.svg", sound: "bird", text: "A kind old bird shared her seeds.", alt: "A kind bird sharing seeds with Lulu in the tree" },
      { image: "page-11.svg", sound: "lulu-happy", text: "\"Thank you! Now I can go on,\" said Lulu.", alt: "Lulu flying strongly again while the kind bird waves" },
      { image: "page-12.svg", sound: "lulu-happy", text: "\"The great lake is near. Let's go, let's go!\"", alt: "Lulu flying toward the sparkling water shining on the horizon" },
    ],
  },
  {
    id: "lulu-and-the-wonderful-water",
    title: "Lulu and the Wonderful Water",
    grades: [1],
    units: [8],
    level: "Level 1",
    description: "Rivers, rain, a rainbow and the great blue lake - Lulu's watery adventure.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Lulu and the Wonderful Water is an original Grade 1 story created for Ehel Academy in 2026, book two of the Lulu journey series, set in the same storyworld as the Musa, Kiki and Duku books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "lulu-happy", text: "Lulu and the Wonderful Water. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Lulu flying over the sparkling lake with a sailboat and a jumping fish" },
      { image: "page-02.svg", sound: "river", text: "Lulu followed the little river.", alt: "Lulu flying above a winding blue river" },
      { image: "page-03.svg", sound: "river", text: "The river ran down the hills. Splish, splash!", alt: "The river rushing down the hills while Lulu flies alongside" },
      { image: "page-04.svg", sound: "rain", text: "Rain began to fall. Drip, drop, drip!", alt: "Rain falling from a big cloud around a surprised Lulu" },
      { image: "page-05.svg", sound: "rain", text: "Lulu hid under a big leaf.", alt: "Lulu sheltering from the rain under a big green leaf" },
      { image: "page-06.svg", sound: "sun", text: "The rain stopped. A rainbow came out!", alt: "Lulu flying happily under a bright rainbow with fresh puddles below" },
      { image: "page-07.svg", sound: "lulu-surprised", text: "At last - the great lake! It was so big and blue.", alt: "Lulu seeing the huge blue lake spread out below her" },
      { image: "page-08.svg", sound: "puddle", text: "A little fish jumped. Hello, fish!", alt: "A little orange fish jumping from the lake to greet Lulu" },
      { image: "page-09.svg", sound: "elephant-happy", text: "The little elephant was there too, splashing!", alt: "The little elephant splashing happily in the lake while Lulu flies over" },
      { image: "page-10.svg", sound: "wind", text: "A white boat sailed by. \"Hello, Lulu!\"", alt: "A little sailboat gliding across the lake as Lulu waves" },
      { image: "page-11.svg", sound: "river", text: "Lulu drank the cool, clean water.", alt: "Lulu at the edge of the lake drinking the clean water beside a fish" },
      { image: "page-12.svg", sound: "lulu-happy", text: "\"Water is wonderful!\" sang Lulu.", alt: "Lulu flying joyfully over the lake under a rainbow with the fish and the sailboat" },
    ],
  },
  {
    id: "lulu-in-the-city",
    title: "Lulu in the City",
    grades: [1],
    units: [9],
    level: "Level 1",
    description: "Tall buildings, a busy market and city lights - Lulu finds friends in the big city.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Lulu in the City is an original Grade 1 story created for Ehel Academy in 2026, book three of the Lulu journey series, set in the same storyworld as the Musa, Kiki and Duku books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "lulu-happy", text: "Lulu in the City. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Lulu flying toward the colorful buildings of the big city" },
      { image: "page-02.svg", sound: "lulu-surprised", text: "Past the lake was the big city. Wow!", alt: "Lulu seeing the city skyline rise up beyond the lake" },
      { image: "page-03.svg", sound: "market", text: "The streets were busy. The buildings were tall.", alt: "Lulu flying along a busy street between tall colorful buildings and lamp posts" },
      { image: "page-04.svg", sound: "market", text: "Lulu found the market. So many mangoes!", alt: "The market stall piled with mangoes under a striped awning" },
      { image: "page-05.svg", sound: "kiki-happy", text: "Kiki and Mama were there! \"Lulu! Welcome!\"", alt: "Kiki and Mama at the market waving up at Lulu" },
      { image: "page-06.svg", sound: "bird", text: "They showed her the city park.", alt: "The green city park with trees and a lamp post where Kiki plays" },
      { image: "page-07.svg", sound: "lulu-surprised", text: "They showed her the big clock tower.", alt: "The tall clock tower rising above Lulu and Kiki" },
      { image: "page-08.svg", sound: "bell", text: "Ding! Dong! The clock sang to the city.", alt: "Sound waves ringing out from the clock tower as Lulu flies past" },
      { image: "page-09.svg", sound: "sun", text: "At night, the city lights came on. So pretty!", alt: "The city at night with glowing golden windows and street lamps" },
      { image: "page-10.svg", sound: "lulu-happy", text: "Lulu made a nest by the park lamp.", alt: "Lulu settling into her new nest in the park tree beside the glowing lamp" },
      { image: "page-11.svg", sound: "lullaby", text: "The city hummed a soft good-night song.", alt: "Lulu in her nest as soft music notes float over the sleeping city" },
      { image: "page-12.svg", sound: "lulu-happy", text: "\"New places, new friends,\" said Lulu. \"But friends make every place home.\"", alt: "Lulu flying happily over the city park with Kiki, Mama and a little bird friend" },
    ],
  },
  {
    id: "the-big-friends-party",
    title: "The Big Friends Party",
    grades: [1],
    units: [10],
    level: "Level 1",
    description: "Lulu flies home, Musa calls a party, and every friend from the whole year comes.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Big Friends Party is an original Grade 1 story created for Ehel Academy in 2026, the capstone crossover of the Musa, Kiki, Duku and Lulu series. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "lulu-happy", text: "The Big Friends Party. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Musa, Kiki, Duku, Lulu, the little elephant and the monkey gathered under a party banner and rainbow" },
      { image: "page-02.svg", sound: "lulu-happy", text: "One bright day, Lulu flew home from the big city.", alt: "Lulu flying home across the savanna with the city small behind her" },
      { image: "page-03.svg", sound: "zebra-happy", text: "\"Let us have a party!\" said Musa. \"A party for all our friends!\"", alt: "Musa having his big party idea while Lulu circles overhead" },
      { image: "page-04.svg", sound: "kiki-happy", text: "Kiki came from school with Miss Twiga and the games.", alt: "Kiki with her backpack, Miss Twiga the teacher, the ball and the red kite" },
      { image: "page-05.svg", sound: "duku-happy", text: "Duku came from the farm with mangoes and sweet carrots.", alt: "Duku, Koko and Gigi arriving from the farm with mangoes and carrots" },
      { image: "page-06.svg", sound: "elephant-happy", text: "The little elephant filled the puddle with clean water.", alt: "The little elephant spraying clean water into the big puddle while Lulu watches" },
      { image: "page-07.svg", text: "They made a long, long table. Tap, tap, tap!", alt: "Duku, Kiki and Gigi building a long party table together" },
      { image: "page-08.svg", sound: "monkey", text: "\"Hello! Hello!\" Everyone said hello to everyone.", alt: "All the friends greeting each other under the party banner" },
      { image: "page-09.svg", sound: "ball", text: "They played ball. They flew the kite. They took turns.", alt: "The friends playing with the ball, the kite and the swing together" },
      { image: "page-10.svg", sound: "lullaby", text: "They ate. They sang. Mama sang the soft song.", alt: "The friends eating at the long table while Mama sings with music notes floating" },
      { image: "page-11.svg", sound: "crickets", text: "At night, the stars came out. The chicks slept in the hay.", alt: "The party under the stars with the chicks asleep in the hay and Lulu in her nest" },
      { image: "page-12.svg", sound: "lulu-happy", text: "\"Look at our world,\" said Lulu. \"School and farm, water and city - and friends everywhere!\"", alt: "All the friends together under the rainbow with the city small on the horizon" },
    ],
  },
  {
    id: "bheema-the-sleepyhead",
    title: "Bheema, the Sleepyhead",
    grades: [1],
    units: [0],
    level: "Level 1 · developing reader",
    description: "Bheema tries several ways to wake up early before a tiny friend finally helps him.",
    author: "Kiran Kasturia",
    illustrator: "Shweta Mohapatra",
    translator: "Rajesh Khar",
    sourcePdf: "./ebooks/bheema-the-sleepyhead/original.pdf",
    attribution: "Bheema, the Sleepyhead (English), translated by Rajesh Khar, published by Pratham Books (© Pratham Books, 2012), based on the original Hindi story written by Kiran Kasturia and illustrated by Shweta Mohapatra. Licensed CC BY 4.0 on StoryWeaver. Digitally adapted by Ehel Academy; the illustrations and story wording are preserved.",
    pages: [
      { image: "page-01.webp", text: "Bheema, the Sleepyhead. Written by Kiran Kasturia. Illustrated by Shweta Mohapatra. Translated by Rajesh Khar.", alt: "Cover illustration of a sleepy donkey with a fly on his head" },
      { image: "page-02.webp", text: "Bheema loves to sleep and just cannot get up early. Ramu, the washerman, scolds Bheema often.", alt: "Bheema the donkey sleeping peacefully" },
      { image: "page-03.webp", text: "One day, Gauri, the cow, asked him, “Bheema, why are you so sad?” Bheema said, “I cannot get up early and Ramu shouts at me every day. Will you wake me up every morning, please?” “Yes, I will,” said Gauri. Early next morning, Gauri mooed loudly, but Bheema did not wake up.", alt: "Gauri the cow looking at Bheema while he sleeps" },
      { image: "page-04.webp", text: "Coming back from the river in the evening, Bheema met Moti, the dog. “I can never get up in the morning on time. Will you wake me up?” Bheema asked Moti. “Yes, I will,” said Moti, and the next morning he barked and barked, but did Bheema wake up? No, sir!", alt: "Bheema speaking to Moti the dog beside some steps" },
      { image: "page-05.webp", text: "That evening Bheema met Cheenu, the rooster. He said to Cheenu, “You crow in the morning and everybody wakes up. Will you wake me up too?” Cheenu agreed. The next morning, Cheenu crowed long and loud, but Bheema did not wake up.", alt: "Cheenu the rooster crowing beside the sleeping Bheema" },
      { image: "page-06.webp", text: "The next evening, Bheema saw Kalu, the crow, cawing away happily. “Kalu, will you wake me up in the morning, please?” he asked. Kalu said, “Why not? I will caw and wake you up.” The next morning Kalu cawed all he could, but Bheema did not wake up.", alt: "Kalu the crow sitting on Bheema's back" },
      { image: "page-07.webp", text: "Bheema was sad. The next morning, a fly came and sat on his nose. “Aaah… chhoooo… ahchhoo!” Bheema got up with a big sneeze.", alt: "A tiny fly sitting on the sad donkey's nose" },
      { image: "page-08.webp", text: "“Wow! I woke up. How did I wake up?” he asked in wonder. “I woke you up,” said the fly. “Will you wake me up like this early every morning?” “Sure,” said the fly. Bheema was happy. Now he would have no problem getting up early every morning!", alt: "The fly sitting on Bheema's head while Bheema smiles" },
    ],
  },
];

let course;
let dictionary;
let manifest;
let finalAssessment;
let placementExam;
let gamePack;
let route = location.hash.slice(1) || "overview";
let audioEnabled = true;
let mediaRecorder;
let recordedChunks = [];
let activeRecordingId = null;
let activeAudioEnd = null;
let activeAudioButton = null;
let audioRequestId = 0;
let pageNarrationActive = false;
let pageNarrationCancel = null;
let activeWordId;
let activeSentence = 0;
let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;
let finalQuizIndex = 0;
let placementIndex = 0;
let activeGameId = null;
let gameRoundIndex = 0;
let gameScore = 0;
let gameLocked = false;
let gameSelection = [];
let gamePairSelection = [];
let gameMistakes = 0;
let currentPageNarration = "";
let activeEbookId = ebookCatalog[0].id;
let ebookWatchActive = false;
let ebookWatchToken = 0;

const TAP_SOUND_MOOD_TYPES = new Set(["zebra", "elephant", "kiki", "duku", "lulu"]);
const TAP_SOUND_MOODS = new Set(["happy", "sad", "surprised"]);
const TAP_SOUND_ALIASES = { kite: "wind", moon: "lullaby", carrot: "crunch", scarecrow: "tree", lake: "puddle", fish: "puddle", boat: "wind", clock: "bell" };
let tapSoundPlayer = null;

function ensureTapSoundPlayer() {
  if (!tapSoundPlayer) {
    tapSoundPlayer = new Audio();
    tapSoundPlayer.volume = 1;
    tapSoundPlayer.preload = "auto";
  }
  return tapSoundPlayer;
}

function tapSoundUrl(soundKey) {
  return new URL(`./ebooks/tap-sounds/${soundKey}.mp3`, document.baseURI).href;
}

function playTapSound(type, mood) {
  if (!audioEnabled || !type) return;
  const soundKey = TAP_SOUND_MOOD_TYPES.has(type)
    ? `${type}-${TAP_SOUND_MOODS.has(mood) ? mood : "happy"}`
    : TAP_SOUND_ALIASES[type] || type;
  try {
    const player = ensureTapSoundPlayer();
    player.pause();
    player.src = tapSoundUrl(soundKey);
    player.currentTime = 0;
    player.play().catch(() => {});
  } catch {
    // Tap sounds are a garnish; never let them break the reader.
  }
}

// Plays a page's story sound cue and resolves when it finishes (or after a
// short safety timeout), so narration can follow it like a storybook sting.
function playStorySound(soundKey) {
  if (!audioEnabled || !soundKey) return Promise.resolve();
  let player;
  try {
    player = ensureTapSoundPlayer();
  } catch {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      player.removeEventListener("ended", done);
      player.removeEventListener("error", done);
      resolve();
    };
    const timer = setTimeout(done, 2600);
    player.addEventListener("ended", done);
    player.addEventListener("error", done);
    try {
      player.pause();
      player.src = tapSoundUrl(soundKey);
      player.currentTime = 0;
      player.play().catch(done);
    } catch {
      done();
    }
  });
}

function stopEbookWatch({ keepFullscreen = false } = {}) {
  ebookWatchActive = false;
  ebookWatchToken += 1;
  if (tapSoundPlayer) tapSoundPlayer.pause();
  if (!keepFullscreen && document.fullscreenElement?.classList?.contains("course-ebook-reader") && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  const watchButton = $("#watch-ebook");
  if (watchButton) {
    watchButton.classList.remove("watching");
    watchButton.innerHTML = `${icon("play")} Watch the story`;
    watchButton.setAttribute("aria-label", "Watch the story: narrated pages that turn by themselves");
    icons();
  }
  stopAudio();
}
let activeEbookPage = 0;
const aiVoiceCache = new Map();
const aiVoicePending = new Map();
const readingVoiceSources = new Map();
const recordings = new Map();
const speakingReviewState = new Map();



function loadAIState() {
  try {
    return { mode: "teach", messages: [], interactions: 0, practiceWords: [], needs: [], ...JSON.parse(localStorage.getItem(AI_STORAGE_KEY) || "{}") };
  } catch {
    return { mode: "teach", messages: [], interactions: 0, practiceWords: [], needs: [] };
  }
}

function saveAIState() {
  aiState.messages = aiState.messages.slice(-24);
  localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiState));
}


function loadFinalQuizProgress() {
  try {
    return { answers: {}, attempts: [], currentIndex: 0, completed: false, passed: false, submitted: false, ...JSON.parse(localStorage.getItem(FINAL_QUIZ_STORAGE_KEY) || "{}") };
  } catch {
    return { answers: {}, attempts: [], currentIndex: 0, completed: false, passed: false, submitted: false };
  }
}

function saveFinalQuizProgress() {
  localStorage.setItem(FINAL_QUIZ_STORAGE_KEY, JSON.stringify(finalQuizProgress));
  renderNav();
}

function loadPlacementProgress() {
  try {
    return { answers: {}, attempts: [], currentIndex: 0, completed: false, band: null, submitted: false, startedAt: null, ...JSON.parse(localStorage.getItem(PLACEMENT_STORAGE_KEY) || "{}") };
  } catch {
    return { answers: {}, attempts: [], currentIndex: 0, completed: false, band: null, submitted: false, startedAt: null };
  }
}

function savePlacementProgress() {
  localStorage.setItem(PLACEMENT_STORAGE_KEY, JSON.stringify(placementProgress));
  renderNav();
}

function visibleSections() {
  if (isPrereqUnit) {
    return [
      ["overview", "layout-dashboard", "Overview"],
      ["placement", "clipboard-check", placementExam?.kind === "readiness" ? "Readiness check" : "Placement exam"],
    ];
  }
  const available = sections.filter(([id]) => id !== "games" || gamePack);
  return unitNumber === 10 ? [...available, ["final-quiz", "trophy", "Final course quiz"]] : available;
}


function icon(name, label = "") {
  return sharedIcon(name, label);
}

function icons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2.2 } });
}

function escapeHtml(value = "") {
  return sharedEscapeHtml(value);
}

// Narration clips live in one shared tree (english/media/audio/grade-N/{cat}/)
// beside the app, not under the per-grade app folder, so rebasing them against
// gradeRootUrl produced english/grade-N/media/audio/grade-N/… and 404ed on every
// clip in local dev. Deployed builds are unaffected either way: resolveMediaUrl
// discards this prefix when it rewrites to the Bunny media tree. Kept identical to
// the same guard in english/shared/course-ui.js — this module is the copy the
// deployed shell serves, so the two must not drift.
const SHARED_AUDIO = /(^|\/)media\/audio\/grade-\d+\//;

function resolveGradeAssets(value) {
  const assetKeys = new Set(["source", "normal", "slow", "image", "lectureVideo", "lecturePoster", "lectureCaptions"]);
  if (Array.isArray(value)) {
    value.forEach(resolveGradeAssets);
    return value;
  }
  if (!value || typeof value !== "object") return value;
  for (const [key, item] of Object.entries(value)) {
    if (assetKeys.has(key) && typeof item === "string" && SHARED_AUDIO.test(item)) continue;
    else if (assetKeys.has(key) && typeof item === "string" && /^(\.\.?[/\\])/.test(item)) value[key] = new URL(item.replace(/\\/g, "/"), gradeRootUrl).href;
    else resolveGradeAssets(item);
  }
  return value;
}

function pageHeader(kicker, title, description, status = "Approved content") {
  currentPageNarration = `${String(title).replace(/<[^>]*>/g, " ")}. ${String(description).replace(/<[^>]*>/g, " ")}`.replace(/\s+/g, " ").trim();
  return sharedPageHeader({ kicker, title, description, status });
}

function prepareNarrationText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .map((line) => /[.!?;:…][\"'”’)]*$/.test(line) ? line : `${line}.`)
    .join("\n\n");
}

function collectPageNarration() {
  const source = $("#app");
  if (!source) return currentPageNarration;
  const copy = source.cloneNode(true);
  copy.querySelectorAll("button, .audio-source, .status-chip, script, style, [hidden], [aria-hidden='true'], details:not([open]) > *:not(summary)").forEach((element) => element.remove());
  copy.querySelectorAll("input, textarea, select").forEach((element) => {
    const description = element.getAttribute("aria-label") || element.getAttribute("placeholder") || "";
    if (description) element.replaceWith(document.createTextNode(description));
    else element.remove();
  });
  copy.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote, label, summary").forEach((element) => {
    element.append(document.createTextNode("\n"));
  });
  return prepareNarrationText(copy.textContent) || prepareNarrationText(currentPageNarration);
}

function narrationChunks(text, maximum = 620) {
  const clean = prepareNarrationText(text);
  if (!clean) return [];
  const lines = clean.split(/\n{2,}/).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const line of lines) {
    const parts = line.length <= maximum ? [line] : (line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [line]);
    for (const rawPart of parts) {
      const part = rawPart.trim();
      if (!part) continue;
      const separator = current ? (parts.length === 1 ? "\n\n" : " ") : "";
      if (`${current}${separator}${part}`.length <= maximum) current = `${current}${separator}${part}`;
      else {
        if (current) chunks.push(current);
        if (part.length <= maximum) current = part;
        else {
          for (let start = 0; start < part.length; start += maximum) chunks.push(part.slice(start, start + maximum));
          current = "";
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function toast(message) {
  const element = $("#toast");
  element.textContent = "";
  element.classList.add("show");
  requestAnimationFrame(() => { element.textContent = message; });
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2600);
}

function announceScreenReader(message) {
  const announcer = $("#sr-announcer");
  if (!announcer) return;
  announcer.textContent = "";
  requestAnimationFrame(() => { announcer.textContent = message; });
}

function focusDynamicContent(selector, message) {
  const target = $(selector);
  if (!target) return;
  target.tabIndex = -1;
  requestAnimationFrame(() => target.focus({ preventScroll: true }));
  announceScreenReader(message || target.textContent.trim());
}

function prepareScreenReaderView() {
  const sectionLabel = visibleSections().find(([id]) => id === route)?.[2] || (route === "teacher" ? "Teacher resources" : "Overview");
  const heading = $("#app h1");
  $$('[id$="feedback"], #save-status, #video-status, [data-record-status]', $("#app")).forEach((element) => {
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    element.setAttribute("aria-atomic", "true");
  });
  if (heading) {
    heading.tabIndex = -1;
    requestAnimationFrame(() => heading.focus({ preventScroll: true }));
  }
  announceScreenReader(`${gradeLabel}, Unit ${course.unit.unitNo}, ${sectionLabel}. Page ready.`);
}


function courseLocation(nextUnit, nextRoute = "overview") {
  const url = new URL(location.href);
  url.searchParams.set("grade", gradeNumber);
  url.searchParams.set("unit", nextUnit);
  url.hash = nextRoute;
  return url.href;
}

function gradeLocation(nextGrade) {
  const url = new URL(location.href);
  url.searchParams.set("grade", nextGrade);
  url.searchParams.set("unit", Number(nextGrade) === 1 ? 0 : 1);
  url.hash = "overview";
  return url.href;
}


// --- overview narration ------------------------------------------------------
// One clip per panel, not one per page. The banner, the outcomes and the
// recommended path are authored independently, and ElevenLabs bills per
// character: a reworded outcome must re-buy the outcomes clip alone. The panels
// that are counts ("Your unit at a glance"), compliance notes (the Cambridge
// approval banner) or progress-dependent ("Keep going" reads "You have
// completed 3 learning sections") carry no button — the last of those cannot be
// pre-rendered at all, since the text differs per learner.
//
// Descriptors are written by `node tools/generate-ehel-english-audio.js
// overview <grade>`; a panel whose clip has not been generated renders no
// button, so the page degrades quietly rather than offering silence.
function overviewAudioButton(holder, key, label) {
  const descriptor = holder?.overviewAudio?.[key];
  return descriptor?.available
    ? `<button class="button secondary" data-overview-audio="${escapeHtml(key)}" type="button">${icon("volume-2")} ${escapeHtml(label)}</button>`
    : "";
}
function bindOverviewAudio(holder) {
  $$("[data-overview-audio]").forEach((button) => button.addEventListener("click", () => {
    const descriptor = holder?.overviewAudio?.[button.dataset.overviewAudio];
    if (descriptor?.source) playAudio(descriptor.source, { rate: AI_NARRATION_RATE, button });
  }));
}

function renderOverview() {
  const learningPath = course.unit.learningPath.split("\n").filter(Boolean);
  $("#app").innerHTML = `${pageHeader(`${course.grade.label} · ${course.term.label} · Unit ${course.unit.unitNo}`, course.unit.unitTitle, course.unit.unitOverview.split(". ").slice(0, 2).join(". "))}
    <div class="overview-grid">
      <div class="section-stack">
        <section class="unit-banner">
          <img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt)}">
          <div class="banner-copy"><span>Your learning journey</span><h2>Explore ${escapeHtml(course.unit.unitTitle)}</h2><p>${escapeHtml(course.unit.unitOverview.split(". ").slice(0, 2).join(". "))}</p><button class="button gold" data-go="lecture" type="button">${icon("play")} ${unitNumber === 10 ? "Launch my capstone" : "Start with Teacher Musa"}</button>${overviewAudioButton(course, "intro", "Hear the overview")}</div>
        </section>
        <section class="panel"><h2>What you will learn</h2><div class="outcome-list">${course.outcomes.map((outcome) => `<div class="outcome"><span>${outcome.sequence}</span><p>${escapeHtml(outcome.learningOutcome)}</p></div>`).join("")}</div>${overviewAudioButton(course, "outcomes", "Hear what you will learn")}</section>
      </div>
      <div class="section-stack">
        <section class="panel approval-banner"><span class="eyebrow">${escapeHtml(cambridgeFramework(gradeNumber).level)} ${cambridgeFramework(gradeNumber).code}</span><h3>Aligned to ${escapeHtml(cambridgeLabel(gradeNumber))}</h3><p>Unit ${course.unit.unitNo} is structured from the ${escapeHtml(cambridgeLabel(gradeNumber))} content package. AI-assisted content review complete — human curriculum sign-off pending.</p></section>
        <section class="panel"><h3>Your unit at a glance</h3><div class="stat-row"><div class="stat"><strong>${course.dictionaryLinks.length}</strong><small>words</small></div><div class="stat"><strong>${course.readings.length}</strong><small>texts</small></div><div class="stat"><strong>${course.quizzes.length}</strong><small>quiz points</small></div></div></section>
        <section class="panel"><h3>Recommended path</h3><ol class="path-list">${learningPath.map((item) => `<li>${icon("circle-check-big")}<span>${escapeHtml(item)}</span></li>`).join("")}</ol>${overviewAudioButton(course, "path", "Hear the recommended path")}</section>
        <section class="panel"><h3>Keep going</h3><p>${progress.completed.length ? `You have completed ${progress.completed.length} learning sections. Pick up where you left off.` : "Your progress will save on this device as you learn."}</p><button class="button primary" data-go="${progress.completed.includes("lecture") ? "dictionary" : "lecture"}" type="button">Continue ${icon("arrow-right")}</button></section>
        ${unitNumber === defaultUnit && !placementProgress.completed ? `<section class="panel final-quiz-callout"><span class="eyebrow">New to ${gradeLabel}?</span><h3>Prerequisite: placement exam</h3><p>A short exam over your earlier English finds your perfect starting point and suggests review lessons if you need them.</p><a class="button gold" href="${courseLocation(PREREQ_UNIT, "placement")}">Take the placement exam ${icon("arrow-right")}</a></section>` : ""}
        ${unitNumber === 10 ? `<section class="panel final-quiz-callout"><span class="eyebrow">After your capstone</span><h3>Final course quiz</h3><p>Complete 30 questions across words, reading, grammar, speaking and writing. Your answers save as you work.</p><button class="button gold" data-go="final-quiz" type="button">${finalQuizProgress.completed ? "View my results" : "Open final quiz"} ${icon("arrow-right")}</button></section>` : ""}
      </div>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
  bindOverviewAudio(course);
}

function renderLecture() {
  const groups = course.vocabularyGroups.map((group) => group.title.toLowerCase()).join(", ");
  if (course.visual.lectureMode === "capstone-launch") {
    $("#app").innerHTML = `${pageHeader("Capstone launch", "Welcome to My English World", "See the whole project before you begin. Your teacher will guide each stage during six live sessions.")}
      <div class="lecture-layout">
        <section class="unit-banner capstone-launch"><img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt)}"><div class="banner-copy"><span>Your final ${gradeLabel} project</span><h2>Choose. Create. Present. Reflect.</h2><p>Bring together your strongest English work, create a purposeful final product and present it with confidence.</p><button class="button gold" id="capstone-launch-done" type="button">${icon("flag")} Begin my capstone</button></div></section>
        <div class="section-stack"><section class="panel"><span class="eyebrow">Four milestones</span><h2>Your capstone journey</h2><ol class="path-list"><li>${icon("folder-heart")}<span>Choose and explain your strongest portfolio work.</span></li><li>${icon("book-open")}<span>Create, review and improve your final product.</span></li><li>${icon("mic-2")}<span>Present clearly and respond to a question.</span></li><li>${icon("sparkles")}<span>Reflect on your growth and set a next-grade goal.</span></li></ol></section><section class="panel"><h3>Start with your review words</h3><p>The capstone dictionary brings together useful words selected across the course.</p><button class="button primary" id="to-dictionary" type="button">Open review vocabulary ${icon("arrow-right")}</button></section></div>
      </div>`;
    $("#capstone-launch-done").addEventListener("click", () => complete("lecture", "Capstone launched. Your review vocabulary is ready."));
    $("#to-dictionary").addEventListener("click", () => { complete("lecture"); navigate("dictionary"); });
    return;
  }
  if (course.visual.lectureMode === "guided-launch" || !course.visual.lectureVideo) {
    $("#app").innerHTML = `${pageHeader("Lecture media pending", "Teacher lecture", "Preview the unit purpose while the audiovisual teacher lecture is being prepared.", "Video pending")}
      <div class="lecture-layout">
        <section class="unit-banner"><img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt)}"><div class="banner-copy"><span>${gradeLabel} unit preview</span><h2>Explore. Practise. Apply. Improve.</h2><p>${escapeHtml(course.unit.unitOverview.split(". ").slice(0, 2).join(". "))}</p><button class="button gold" id="guided-launch-done" type="button">${icon("eye")} Preview this unit</button></div></section>
        <div class="section-stack"><section class="panel"><span class="eyebrow">How to learn</span><h2>Use language with purpose</h2><ol class="path-list"><li>${icon("eye")}<span>Preview the unit goals and connect them to what you know.</span></li><li>${icon("ear")}<span>Listen, read and notice how English works in context.</span></li><li>${icon("message-circle")}<span>Discuss, explain and support ideas clearly.</span></li><li>${icon("pencil")}<span>Practise, check feedback and improve your response.</span></li></ol></section><section class="panel"><h3>Words in this unit</h3><p>Explore ${escapeHtml(groups)} in the linked ${gradeLabel} dictionary.</p><button class="button primary" id="to-dictionary" type="button">Open vocabulary ${icon("arrow-right")}</button></section></div>
      </div>`;
    $("#guided-launch-done").addEventListener("click", () => toast("Unit preview opened. Teacher lecture completion awaits the video."));
    $("#to-dictionary").addEventListener("click", () => navigate("dictionary"));
    return;
  }
  // Slide-by-slide playback. The lecture is one rendered video of consecutive
  // slides, so the slide times come from the manifest (lecture-media.json ::
  // lectureSlides, written by the lecture renderer and backfilled for the
  // lectures that predate it). Without them the player behaves exactly as it
  // always did — plays straight through — so a lecture whose times are missing
  // degrades to the old lecture rather than to a broken one.
  const lectureSlides = Array.isArray(course.visual.lectureSlides) ? course.visual.lectureSlides : [];
  $("#app").innerHTML = `${pageHeader("Begin here", "Teacher audiovisual lecture", lectureSlides.length > 1
    ? "One slide at a time. Each slide reads itself aloud and then waits — use the arrows to move on when you are ready."
    : "Watch and listen before you begin the independent lesson. Captions are available in the player.")}
    <div class="lecture-layout">
      <section class="panel video-shell"><div class="lecture-stage"><video id="lecture-video" controls preload="metadata" poster="${course.visual.lecturePoster}"><source src="${course.visual.lectureVideo}" type="video/mp4"><track kind="captions" src="${course.visual.lectureCaptions}" srclang="en" label="English" default></video>${lectureSlides.length > 1 ? `<button class="lecture-nav prev" id="slide-prev" type="button" aria-label="Previous slide">${icon("chevron-left")}</button><button class="lecture-nav next" id="slide-next" type="button" aria-label="Next slide">${icon("chevron-right")}</button>` : ""}</div><div class="video-footer"><p id="video-status">Teacher Musa · Unit ${course.unit.unitNo} lecture</p><button class="button gold" id="lecture-done" type="button" ${progress.completed.includes("lecture") ? "" : "disabled"}>${progress.completed.includes("lecture") ? icon("check") + " Lecture complete" : icon("play") + " Watch to complete"}</button></div></section>
      <div class="section-stack"><section class="panel"><span class="eyebrow">Before you learn</span><h2>Listen, look and repeat</h2><p>Teacher Musa introduces ${escapeHtml(groups)}.</p><ul class="checklist"><li>${icon("ear")} Hear the approved ElevenLabs teacher voice</li><li>${icon("captions")} Read along with captions</li><li>${icon("message-circle")} Pause, take notes and repeat key language</li></ul></section><section class="panel"><h3>Ready after the video?</h3><p>Complete the lecture before continuing to the vocabulary dictionary.</p><button class="button primary" id="to-dictionary" type="button" ${progress.completed.includes("lecture") ? "" : "disabled"}>Open vocabulary ${icon("arrow-right")}</button></section></div>
    </div>`;
  $("#to-dictionary").addEventListener("click", () => navigate("dictionary"));
  const lectureVideo = $("#lecture-video");
  const lectureDone = $("#lecture-done");
  lectureVideo.defaultPlaybackRate = AI_NARRATION_RATE;
  lectureVideo.playbackRate = AI_NARRATION_RATE;
  attachCaptions(lectureVideo);
  let slideIndex = 0;
  let lectureLength = "";
  const finishLecture = () => {
    if (progress.completed.includes("lecture")) return;
    lectureDone.disabled = false;
    $("#to-dictionary").disabled = false;
    lectureDone.innerHTML = `${icon("check")} Lecture complete`;
    complete("lecture", "Lecture complete. Your vocabulary lesson is ready.");
    icons();
  };
  lectureVideo.addEventListener("loadedmetadata", () => {
    const minutes = Math.max(1, Math.round(lectureVideo.duration / 60));
    lectureLength = `${minutes}-minute audiovisual lecture`;
    showStatus();
  });
  lectureVideo.addEventListener("error", () => {
    $("#video-status").textContent = "Lecture video could not be loaded.";
    toast("The lecture video is unavailable. Please refresh and try again.");
  });
  // Playing to the very end still completes: a learner who scrubs or lets the
  // last slide run out arrives here rather than at the boundary pause below.
  lectureVideo.addEventListener("ended", finishLecture);
  lectureDone.addEventListener("click", () => navigate("dictionary"));

  // --- one slide at a time -------------------------------------------------
  // The video is not stopped from playing on: it is paused the moment it
  // reaches the end of the slide being watched. So a slide reads itself aloud
  // and then waits, and the arrows are what move the lecture forward.
  function showStatus() {
    if (!lectureSlides.length) {
      $("#video-status").textContent = `Teacher Musa · ${lectureLength || `Unit ${course.unit.unitNo} lecture`}`;
      return;
    }
    const slide = lectureSlides[slideIndex];
    const title = slide.title ? ` · ${slide.title}` : "";
    $("#video-status").textContent = `Slide ${slideIndex + 1} of ${lectureSlides.length}${title}`;
  }
  if (lectureSlides.length > 1) {
    const prev = $("#slide-prev");
    const next = $("#slide-next");
    // The slide being watched is authoritative; it is only re-derived from the
    // clock when the learner moves the clock themselves. Deriving it on every
    // timeupdate looked tidier and was wrong: the moment playback crossed into
    // the next slide the boundary check started testing the NEXT slide's end,
    // so the stop was silently skipped. It survived only while the slides had a
    // gap between them wide enough for a timeupdate to land in.
    const slideAt = (time) => {
      let found = 0;
      lectureSlides.forEach((slide, index) => { if (time >= slide.start - 0.02) found = index; });
      return found;
    };
    const syncNav = () => {
      prev.disabled = slideIndex === 0;
      next.disabled = slideIndex === lectureSlides.length - 1;
      showStatus();
    };
    // Parked a frame short of the change, never on it: at the boundary itself
    // the video already shows the next slide, and the label would follow.
    const PARK_BEFORE_END = 0.05;
    let parking = false;
    const goToSlide = (index) => {
      slideIndex = Math.max(0, Math.min(lectureSlides.length - 1, index));
      parking = true;
      lectureVideo.currentTime = lectureSlides[slideIndex].start;
      syncNav();
      // A click is a user gesture, so this play() is always allowed — which is
      // what makes "arrive at a slide and it reads itself" possible at all.
      lectureVideo.play().catch(() => { /* the learner can press play */ });
    };
    prev.addEventListener("click", () => goToSlide(slideIndex - 1));
    next.addEventListener("click", () => goToSlide(slideIndex + 1));
    // Pressing play while parked at the end of a slide means "carry on", so the
    // next slide becomes the one being watched — otherwise it would stop again
    // immediately on the boundary it is already sitting on.
    lectureVideo.addEventListener("play", () => {
      const slide = lectureSlides[slideIndex];
      if (slideIndex < lectureSlides.length - 1 && lectureVideo.currentTime >= slide.end - 0.15) {
        slideIndex += 1;
        syncNav();
      }
    });
    lectureVideo.addEventListener("timeupdate", () => {
      if (lectureVideo.paused) return;
      const slide = lectureSlides[slideIndex];
      if (lectureVideo.currentTime >= slide.end - PARK_BEFORE_END) {
        lectureVideo.pause();
        parking = true;
        lectureVideo.currentTime = slide.end - PARK_BEFORE_END;
        if (slideIndex === lectureSlides.length - 1) finishLecture();
      }
    });
    lectureVideo.addEventListener("seeked", () => {
      // Our own parking seek must not be read as the learner jumping somewhere.
      if (parking) { parking = false; return; }
      slideIndex = slideAt(lectureVideo.currentTime);
      syncNav();
    });
    syncNav();
  }
  showStatus();
}

function linkedWords() {
  return course.dictionaryLinks.map((link) => ({ ...link, master: dictionary.entries.find((entry) => entry.dictionaryEntryId === link.dictionaryEntryId) }));
}

function renderDictionary() {
  // Grades 1-4 meet one word at a time on the same slide design the Grade 1
  // grammar patterns use. From Grade 5 the searchable two-column lab stays:
  // by then a learner is looking words UP, and a unit can carry 70 of them.
  if (gradeNumber <= 4) return renderWordCarousel();
  const words = linkedWords();
  activeWordId = activeWordId || words[0].vocabularyId;
  $("#app").innerHTML = `${pageHeader("Linked master dictionary", "Vocabulary lab", `Search the ${gradeLabel} sub-dictionary. Every word links to one reusable master entry and approved pronunciation.`, `${dictionary.entryCount} master entries`)}
    <div class="toolbar"><label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search words or meanings" aria-label="Search dictionary"></label><select id="group-filter" aria-label="Filter vocabulary group"><option value="all">All vocabulary groups</option>${course.vocabularyGroups.map((group) => `<option value="${group.id}">${escapeHtml(group.title)}</option>`).join("")}</select><span id="dictionary-count" class="status-chip">${words.length} words</span></div>
    <div class="dictionary-layout"><section class="panel word-list" id="word-list"></section><section class="panel word-card" id="word-card"></section></div>`;
  const drawList = () => {
    const query = $("#word-search").value.trim().toLowerCase();
    const group = $("#group-filter").value;
    const filtered = words.filter((item) => (group === "all" || item.groupId === group) && (!query || `${item.master.displayWord} ${item.childMeaning}`.toLowerCase().includes(query)));
    $("#dictionary-count").textContent = `${filtered.length} words`;
    $("#word-list").innerHTML = filtered.length ? filtered.map((item) => `<button class="word-row ${item.vocabularyId === activeWordId ? "active" : ""}" data-word="${item.vocabularyId}" type="button"><span><strong>${escapeHtml(item.master.displayWord)}</strong><small>${escapeHtml(item.master.partOfSpeech)} · ${escapeHtml(item.groupTitle)}</small></span>${progress.knownWords.includes(item.vocabularyId) ? "<span>LEARNED</span>" : ""}</button>`).join("") : `<div class="empty">No matching words found.</div>`;
    $$('[data-word]').forEach((button) => button.addEventListener("click", () => { activeWordId = button.dataset.word; activeSentence = 0; drawList(); drawWord(); }));
  };
  const drawWord = () => {
    const item = words.find((word) => word.vocabularyId === activeWordId) || words[0];
    const sentence = item.practiceSentences[activeSentence] || item.exampleSentence;
    $("#word-card").innerHTML = `<div class="word-card-head"><div><span class="word-type">${escapeHtml(item.master.partOfSpeech)}</span><h2>${escapeHtml(item.master.displayWord)}</h2><small>${escapeHtml(item.master.partOfSpeechDefinition)}</small></div><div class="audio-actions"><button class="icon-button" id="listen-word" type="button" title="Listen at 0.90x" aria-label="Listen to ${escapeHtml(item.master.displayWord)} at 0.90x">${icon("volume-2")}</button><button class="icon-button" id="slow-word" type="button" title="Replay at 0.90x" aria-label="Replay at 0.90x">${icon("rotate-ccw")}</button></div></div><p class="meaning"><span class="field-label">Meaning:</span> ${escapeHtml(item.childMeaning)}${item.meaningAudio?.available ? ` <button class="icon-button" id="hear-meaning" type="button" title="Listen to the meaning" aria-label="Listen to the meaning of ${escapeHtml(item.master.displayWord)}">${icon("volume-2")}</button>` : ""}</p><div class="sentence-card"><small>In a sentence · ${activeSentence + 1} of ${item.practiceSentences.length}</small><p>${escapeHtml(sentence)}</p><div class="sentence-controls"><button class="icon-button" id="previous-sentence" type="button" aria-label="Previous sentence">${icon("arrow-left")}</button><div class="sentence-dots">${item.practiceSentences.map((_, index) => `<button class="sentence-dot ${index === activeSentence ? "active" : ""}" data-sentence="${index}" type="button" aria-label="Sentence ${index + 1}"></button>`).join("")}</div><button class="button ghost" id="hear-sentence" type="button">${icon("volume-2")} Hear sentence</button><button class="icon-button" id="next-sentence" type="button" aria-label="Next sentence">${icon("arrow-right")}</button></div></div><div><span class="field-label">Spelling:</span> ${escapeHtml(item.spellingPractice)}</div><div class="practice-box"><input id="word-sentence" maxlength="180" placeholder="${escapeHtml(item.sentenceStarter)}…" aria-label="Write your own sentence"><button class="button primary" id="check-word-sentence" type="button">Check sentence</button></div><div id="word-feedback" role="status" aria-live="polite" aria-atomic="true"></div><button class="button secondary" id="know-word" type="button">${progress.knownWords.includes(item.vocabularyId) ? icon("check-circle") + " Learned" : icon("bookmark-plus") + " I know this word"}</button>`;
    const play = (button = null) => playAudio(item.master.audio.normal, {
      rate: AI_NARRATION_RATE,
      start: item.master.audio.cueStart,
      end: item.master.audio.cueEnd,
      button,
    });
    $("#listen-word").addEventListener("click", (event) => play(event.currentTarget));
    $("#slow-word").addEventListener("click", (event) => play(event.currentTarget));
    // The definition read aloud, distinct from the word itself and from the practice
    // sentences. Rendered only once a clip exists: the descriptors ship ahead of the
    // audio (available:false, "Not yet generated") while the scripts are in review,
    // and a control that could only ever say "not available" on every word is worse
    // than no control. It appears on its own as soon as a clip is generated.
    if (item.meaningAudio?.available) {
      $("#hear-meaning").addEventListener("click", (event) => playAudio(item.meaningAudio.source, {
        rate: AI_NARRATION_RATE,
        start: item.meaningAudio.cueStart,
        end: item.meaningAudio.cueEnd,
        button: event.currentTarget,
      }));
    }
    $("#hear-sentence").addEventListener("click", (event) => {
      const descriptor = item.sentenceAudio[activeSentence];
      if (!descriptor || descriptor.available === false) return toast("This sentence recording is not available yet.");
      playAudio(descriptor.source, { rate: AI_NARRATION_RATE, start: descriptor.cueStart, end: descriptor.cueEnd, button: event.currentTarget });
    });
    $("#previous-sentence").addEventListener("click", () => { activeSentence = (activeSentence - 1 + item.practiceSentences.length) % item.practiceSentences.length; drawWord(); icons(); });
    $("#next-sentence").addEventListener("click", () => { activeSentence = (activeSentence + 1) % item.practiceSentences.length; drawWord(); icons(); });
    $$('[data-sentence]').forEach((dot) => dot.addEventListener("click", () => { activeSentence = Number(dot.dataset.sentence); drawWord(); icons(); }));
    $("#check-word-sentence").addEventListener("click", () => {
      const value = $("#word-sentence").value.trim();
      const usesWord = value.toLowerCase().includes(item.master.displayWord.toLowerCase());
      const complete = value.length >= 8 && /[.!?]$/.test(value);
      $("#word-feedback").innerHTML = `<p class="feedback ${usesWord && complete ? "good" : "try"}">${usesWord && complete ? "Strong sentence: you used the word and end punctuation." : `Try a complete sentence using “${escapeHtml(item.master.displayWord)}” and finish with punctuation.`}</p>`;
    });
    $("#know-word").addEventListener("click", () => {
      if (!progress.knownWords.includes(item.vocabularyId)) progress.knownWords.push(item.vocabularyId);
      if (progress.knownWords.length >= Math.ceil(words.length * .8)) complete("dictionary"); else saveProgress();
      drawList(); drawWord(); icons(); toast(`${item.master.displayWord} added to My Word Book.`);
    });
    icons();
  };
  $("#word-search").addEventListener("input", drawList);
  $("#group-filter").addEventListener("change", drawList);
  drawList(); drawWord();
}

// Vocabulary as a slide deck, on the Grade 1 grammar carousel's design (gc-*):
// one word per vivid slide, big Hear buttons, side arrows, dots, swipe.
//
// Everything the two-column lab shows is preserved — the word, part of speech
// and its definition, the child-facing meaning, all five practice sentences with
// their own audio, the spelling practice, the write-your-own-sentence check and
// "I know this word" — only the layout changes. What does NOT carry over from
// grammar is the assumption of six items: a unit holds 13-70 words, so the
// search and group filter come with it and narrow the deck itself. They sit
// under the dots rather than in .gc-top, which the full-bleed CSS hides.
function renderWordCarousel() {
  const allWords = linkedWords();
  const esc = escapeHtml;
  // One sentence position per word: in a deck each word keeps its own place,
  // where the lab had a single cursor because only one word was ever on screen.
  const sentenceAt = new Map();
  let deck = allWords;
  let slide = 0;

  const wordSlide = (item, index) => {
    const sentences = item.practiceSentences?.length ? item.practiceSentences : [item.exampleSentence].filter(Boolean);
    const position = Math.min(sentenceAt.get(item.vocabularyId) || 0, Math.max(0, sentences.length - 1));
    const known = progress.knownWords.includes(item.vocabularyId);
    const sentenceAudio = item.sentenceAudio?.[position];
    // The lemma, not the displayed form: "feet" and "foot" are one entry, and a
    // word with no honest picture shows none rather than a decorative stand-in.
    const picture = wordPicture(item.master.lemma) || wordPicture(item.master.displayWord);
    return `<section class="gc-slide gc-v${index % 5}" data-slide="${esc(item.vocabularyId)}"><div class="gc-inner">
      <span class="gc-eyebrow">Word ${index + 1} of ${deck.length} · ${esc(item.master.partOfSpeech)}${item.groupTitle ? ` · ${esc(item.groupTitle)}` : ""}</span>
      ${picture ? `<div class="wc-picture" aria-hidden="true">${picture}</div>` : ""}
      <div class="gc-pattern" lang="en">${esc(item.master.displayWord)}</div>
      <p class="gc-lead">${esc(item.childMeaning)}</p>
      <div class="gc-actions">
        <button class="gc-btn play" type="button" data-word-audio="${esc(item.vocabularyId)}">${icon("volume-2")} Hear it</button>
        <button class="gc-btn ghost" type="button" data-word-audio="${esc(item.vocabularyId)}">${icon("rotate-ccw")} Again</button>
        ${item.meaningAudio?.available ? `<button class="gc-btn ghost" type="button" data-meaning-audio="${esc(item.vocabularyId)}">${icon("volume-2")} Meaning</button>` : ""}
      </div>
      <small class="gc-source">ElevenLabs · approved Ehel voice · 0.90x</small>
      ${sentences.length ? `<div class="wc-sentence">
        <small>In a sentence · ${position + 1} of ${sentences.length}</small>
        <p>${esc(sentences[position])}</p>
        <div class="wc-sentence-controls">
          <button class="icon-button" type="button" data-sentence-step="-1" data-word="${esc(item.vocabularyId)}" aria-label="Previous sentence" ${sentences.length < 2 ? "disabled" : ""}>${icon("arrow-left")}</button>
          <div class="sentence-dots">${sentences.map((_, i) => `<button class="sentence-dot ${i === position ? "active" : ""}" type="button" data-sentence-dot="${i}" data-word="${esc(item.vocabularyId)}" aria-label="Sentence ${i + 1}"></button>`).join("")}</div>
          <button class="gc-btn ghost small" type="button" data-sentence-audio="${esc(item.vocabularyId)}" ${sentenceAudio?.available ? "" : "disabled"}>${icon("volume-2")} Hear sentence</button>
          <button class="icon-button" type="button" data-sentence-step="1" data-word="${esc(item.vocabularyId)}" aria-label="Next sentence" ${sentences.length < 2 ? "disabled" : ""}>${icon("arrow-right")}</button>
        </div>
      </div>` : ""}
      ${item.spellingPractice ? `<p class="gc-note"><span class="field-label">Spelling:</span> ${esc(item.spellingPractice)}</p>` : ""}
      <details class="gc-practice"><summary>Write your own sentence</summary>
        <div class="practice-box"><input data-write="${esc(item.vocabularyId)}" maxlength="180" placeholder="${esc(item.sentenceStarter || "")}…" aria-label="Write your own sentence using ${esc(item.master.displayWord)}"><button class="button primary" type="button" data-check="${esc(item.vocabularyId)}">Check sentence</button></div>
        <div data-feedback="${esc(item.vocabularyId)}" role="status" aria-live="polite" aria-atomic="true"></div>
      </details>
      <button class="gc-btn ${known ? "done" : "ghost"}" type="button" data-know="${esc(item.vocabularyId)}">${known ? `${icon("check-circle")} Learned` : `${icon("bookmark-plus")} I know this word`}</button>
      ${index === deck.length - 1 ? `<button class="gc-btn done" id="dictionary-done" type="button">${icon("check")} I have learned these words</button>` : ""}
    </div></section>`;
  };

  $("#app").innerHTML = `
    <div class="gc-wrap">
      <div class="gc-top"><h2 class="gc-heading">Say the words</h2><span class="gc-count" id="wc-count"></span></div>
      <div class="gc-carousel">
        <button class="gc-arrow prev" type="button" aria-label="Previous word">${icon("chevron-left")}</button>
        <div class="gc-viewport"><div class="gc-track" id="wc-track"></div></div>
        <button class="gc-arrow next" type="button" aria-label="Next word">${icon("chevron-right")}</button>
      </div>
      <div class="gc-dots" id="wc-dots"></div>
      <div class="wc-tools">
        <label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search words or meanings" aria-label="Search vocabulary"></label>
        <select id="group-filter" aria-label="Filter vocabulary group"><option value="all">All vocabulary groups</option>${course.vocabularyGroups.map((group) => `<option value="${group.id}">${esc(group.title)}</option>`).join("")}</select>
        <span class="status-chip" id="wc-known">${progress.knownWords.length} learned</span>
      </div>
    </div>`;
  document.body.classList.add("gc-full");

  const track = $("#wc-track");
  const dotsRow = $("#wc-dots");
  const prevArrow = $(".gc-arrow.prev");
  const nextArrow = $(".gc-arrow.next");

  const wordFor = (id) => deck.find((item) => item.vocabularyId === id);
  const sentencesFor = (item) => (item.practiceSentences?.length ? item.practiceSentences : [item.exampleSentence].filter(Boolean));

  // Repaint one slide in place. Re-rendering the whole deck would snap the
  // carousel back to the first word every time a sentence or a Learned mark
  // changed, which is exactly what the learner is in the middle of doing.
  const redrawSlide = (id) => {
    const index = deck.findIndex((item) => item.vocabularyId === id);
    const node = track.querySelector(`[data-slide="${CSS.escape(id)}"]`);
    if (index < 0 || !node) return;
    node.outerHTML = wordSlide(deck[index], index);
    icons();
  };

  const goToSlide = (next) => {
    slide = Math.max(0, Math.min(deck.length - 1, next));
    track.style.transform = `translateX(-${slide * 100}%)`;
    dotsRow.querySelectorAll("[data-dot]").forEach((dot, i) => dot.classList.toggle("active", i === slide));
    prevArrow.disabled = slide === 0;
    nextArrow.disabled = slide === deck.length - 1;
    $("#wc-count").textContent = deck.length ? `Word ${slide + 1} of ${deck.length}` : "No words";
    stopAudio();
    activeWordId = deck[slide]?.vocabularyId || activeWordId;
  };

  const drawDeck = () => {
    const query = $("#word-search").value.trim().toLowerCase();
    const group = $("#group-filter").value;
    deck = allWords.filter((item) => (group === "all" || item.groupId === group)
      && (!query || `${item.master.displayWord} ${item.childMeaning}`.toLowerCase().includes(query)));
    if (!deck.length) {
      track.innerHTML = `<section class="gc-slide gc-v0"><div class="gc-inner"><p class="gc-lead">No matching words. Clear the search to see them all.</p></div></section>`;
      dotsRow.innerHTML = "";
      prevArrow.disabled = nextArrow.disabled = true;
      $("#wc-count").textContent = "No words";
      icons();
      return;
    }
    track.innerHTML = deck.map(wordSlide).join("");
    dotsRow.innerHTML = deck.map((item, i) => `<button class="gc-dot" type="button" data-dot="${i}" aria-label="Word ${i + 1} of ${deck.length}"></button>`).join("");
    dotsRow.querySelectorAll("[data-dot]").forEach((dot) => dot.addEventListener("click", () => goToSlide(Number(dot.dataset.dot))));
    goToSlide(0);
    icons();
  };

  // One delegated listener for the whole deck: slides are repainted as the
  // learner works, and rebinding every control on every repaint is how a dead
  // button appears three interactions later.
  $(".gc-wrap").addEventListener("click", (event) => {
    const target = event.target.closest("[data-word-audio], [data-meaning-audio], [data-sentence-audio], [data-sentence-step], [data-sentence-dot], [data-check], [data-know], #dictionary-done");
    if (!target) return;
    const id = target.dataset.word || target.dataset.wordAudio || target.dataset.meaningAudio
      || target.dataset.sentenceAudio || target.dataset.check || target.dataset.know;
    const item = wordFor(id);

    if (target.id === "dictionary-done") return complete("dictionary", "Vocabulary complete. Well done!");
    if (!item) return;
    if (target.dataset.wordAudio) {
      return playAudio(item.master.audio.normal, { rate: AI_NARRATION_RATE, start: item.master.audio.cueStart, end: item.master.audio.cueEnd, button: target });
    }
    if (target.dataset.meaningAudio) {
      return playAudio(item.meaningAudio.source, { rate: AI_NARRATION_RATE, start: item.meaningAudio.cueStart, end: item.meaningAudio.cueEnd, button: target });
    }
    if (target.dataset.sentenceAudio) {
      const descriptor = item.sentenceAudio?.[sentenceAt.get(id) || 0];
      if (!descriptor?.available) return toast("This sentence recording is not available yet.");
      return playAudio(descriptor.source, { rate: AI_NARRATION_RATE, start: descriptor.cueStart, end: descriptor.cueEnd, button: target });
    }
    if (target.dataset.sentenceStep || target.dataset.sentenceDot !== undefined) {
      const total = sentencesFor(item).length;
      const current = sentenceAt.get(id) || 0;
      const next = target.dataset.sentenceDot !== undefined
        ? Number(target.dataset.sentenceDot)
        : (current + Number(target.dataset.sentenceStep) + total) % total;
      sentenceAt.set(id, next);
      return redrawSlide(id);
    }
    if (target.dataset.check) {
      const value = ($(`[data-write="${CSS.escape(id)}"]`)?.value || "").trim();
      const usesWord = value.toLowerCase().includes(item.master.displayWord.toLowerCase());
      const finished = value.length >= 8 && /[.!?]$/.test(value);
      const box = $(`[data-feedback="${CSS.escape(id)}"]`);
      if (box) {
        box.innerHTML = `<p class="feedback ${usesWord && finished ? "good" : "try"}">${usesWord && finished
          ? "Strong sentence: you used the word and end punctuation."
          : `Try a complete sentence using “${escapeHtml(item.master.displayWord)}” and finish with punctuation.`}</p>`;
      }
      return undefined;
    }
    if (target.dataset.know) {
      if (!progress.knownWords.includes(id)) progress.knownWords.push(id);
      // Same rule as the lab: the section completes at 80% of the unit's words,
      // counted over every word in the unit, not just the filtered deck.
      if (progress.knownWords.length >= Math.ceil(allWords.length * 0.8)) complete("dictionary"); else saveProgress();
      $("#wc-known").textContent = `${progress.knownWords.length} learned`;
      redrawSlide(id);
      toast(`${item.master.displayWord} added to My Word Book.`);
    }
    return undefined;
  });

  prevArrow.addEventListener("click", () => goToSlide(slide - 1));
  nextArrow.addEventListener("click", () => goToSlide(slide + 1));
  $("#word-search").addEventListener("input", drawDeck);
  $("#group-filter").addEventListener("change", drawDeck);

  const viewport = $(".gc-viewport");
  let startX = null;
  viewport.addEventListener("touchstart", (event) => { startX = event.touches[0].clientX; }, { passive: true });
  viewport.addEventListener("touchend", (event) => {
    if (startX === null) return;
    const dx = event.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 45) goToSlide(slide + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });

  drawDeck();
}

function setAudioButton(button, playing) {
  if (!button) return;
  button.classList.toggle("is-playing", playing);
  button.setAttribute("aria-busy", String(playing));
}

function stopAudio() {
  audioRequestId += 1;
  const player = $("#word-audio");
  player.pause();
  const readingPlayer = $("#ebook-reading-audio");
  if (readingPlayer) {
    readingPlayer.pause();
    readingPlayer.removeAttribute("src");
    readingPlayer.load();
  }
  if (pageNarrationCancel) pageNarrationCancel();
  pageNarrationCancel = null;
  pageNarrationActive = false;
  activeAudioEnd = null;
  if (activeAudioButton?.dataset?.voiceIdleHtml) {
    activeAudioButton.innerHTML = activeAudioButton.dataset.voiceIdleHtml;
    activeAudioButton.setAttribute("aria-label", activeAudioButton.dataset.voiceIdleLabel || "Listen");
    activeAudioButton.disabled = false;
    activeAudioButton.classList.remove("loading");
    icons();
  } else if (activeAudioButton?.matches?.("[data-page-voice]")) {
    activeAudioButton.innerHTML = `${icon("volume-2")} <span>Listen to this page</span>`;
    activeAudioButton.setAttribute("aria-label", "Listen to this page");
    activeAudioButton.disabled = false;
    activeAudioButton.classList.remove("loading");
    icons();
  }
  setAudioButton(activeAudioButton, false);
  activeAudioButton = null;
}

function playAudio(source, { rate = AI_NARRATION_RATE, start = 0, end = null, button = null } = {}) {
  if (!audioEnabled) return toast("Sound is muted. Use the sound button in the header to turn it on.");
  const player = $("#word-audio");
  stopAudio();
  const requestId = audioRequestId;
  activeAudioEnd = Number.isFinite(end) ? end : null;
  activeAudioButton = button;
  setAudioButton(button, true);
  const absoluteSource = resolveMediaUrl(source);
  const begin = () => {
    if (requestId !== audioRequestId) return;
    player.currentTime = Number.isFinite(start) ? start : 0;
    player.playbackRate = rate;
    player.play().catch(() => {
      if (requestId !== audioRequestId) return;
      setAudioButton(button, false);
      toast("The ElevenLabs recording could not be played. Please try again.");
    });
  };
  if (player.currentSrc !== absoluteSource) {
    player.src = absoluteSource; // rebased media-tier URL; raw `source` 404s on the CDN
    player.addEventListener("loadedmetadata", begin, { once: true });
    player.load();
  } else {
    begin();
  }
}

async function aiVoiceUrl(text) {
  const clean = prepareNarrationText(text).slice(0, 5000);
  if (!clean) throw new Error("There is nothing to read.");
  if (aiVoiceCache.has(clean)) return aiVoiceCache.get(clean);
  if (aiVoicePending.has(clean)) return aiVoicePending.get(clean);
  const pending = fetch(AI_TTS_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "audio/mpeg", "Content-Type": "application/json" },
    body: JSON.stringify({ text: clean, purpose: "ehel_course_page", voiceId: AI_VOICE_ID }),
  }).then(async (response) => {
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `ElevenLabs voice failed (${response.status}).`);
    }
    const blob = await response.blob();
    if (!blob.size || !/^audio\//i.test(blob.type || "audio/mpeg")) throw new Error("The voice service returned invalid audio.");
    const url = URL.createObjectURL(blob);
    aiVoiceCache.set(clean, url);
    if (aiVoiceCache.size > 24) {
      const oldest = aiVoiceCache.keys().next().value;
      URL.revokeObjectURL(aiVoiceCache.get(oldest));
      aiVoiceCache.delete(oldest);
    }
    return url;
  }).finally(() => aiVoicePending.delete(clean));
  aiVoicePending.set(clean, pending);
  return pending;
}

async function playPageNarration(button, narrationOverride = null) {
  if (!audioEnabled) { toast("Sound is muted. Use the sound button in the header to turn it on."); return false; }
  if (activeAudioButton === button) {
    stopAudio();
    return false;
  }
  let narrationOk = true;
  const narration = narrationOverride || collectPageNarration();
  if (!narration) return toast("There is nothing on this page to read yet.");
  stopAudio();
  const requestId = audioRequestId;
  const player = $("#word-audio");
  activeAudioButton = button;
  pageNarrationActive = true;
  button.dataset.voiceIdleHtml ||= button.innerHTML;
  button.dataset.voiceIdleLabel ||= button.getAttribute("aria-label") || "Listen";
  setAudioButton(button, true);
  button.innerHTML = `${icon("loader-circle")} <span>Preparing voice</span>`;
  button.classList.add("loading");
  icons();
  try {
    const chunks = narrationChunks(narration);
    for (let index = 0; index < chunks.length; index += 1) {
      const source = await aiVoiceUrl(chunks[index]);
      if (requestId !== audioRequestId || !button.isConnected) return;
      button.innerHTML = `${icon("square")} <span>Stop listening</span>`;
      button.setAttribute("aria-label", `Stop listening. Part ${index + 1} of ${chunks.length}`);
      button.classList.remove("loading");
      icons();
      await new Promise((resolve, reject) => {
        const finish = () => { cleanup(); resolve(); };
        const fail = () => { cleanup(); reject(new Error("The ElevenLabs recording could not be played.")); };
        const cleanup = () => {
          player.removeEventListener("ended", finish);
          player.removeEventListener("error", fail);
          if (pageNarrationCancel === cancel) pageNarrationCancel = null;
        };
        const cancel = () => { cleanup(); resolve(); };
        pageNarrationCancel = cancel;
        player.addEventListener("ended", finish, { once: true });
        player.addEventListener("error", fail, { once: true });
        player.src = source;
        player.playbackRate = AI_NARRATION_RATE;
        player.play().catch(fail);
      });
    }
  } catch (error) {
    narrationOk = false;
    if (requestId === audioRequestId && button.isConnected) toast("ElevenLabs narration is unavailable. Please try again.");
  } finally {
    if (requestId === audioRequestId) stopAudio();
  }
  return narrationOk;
}

async function prepareReadingNarration(reading, button) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${icon("loader-circle")} Preparing audio`;
  button.classList.add("loading");
  icons();
  try {
    const chunks = narrationChunks(`${reading.title}\n${reading.passageScript}`);
    const sources = [];
    for (const chunk of chunks) sources.push(await aiVoiceUrl(chunk));
    readingVoiceSources.set(reading.readingId, sources);
    if (button.isConnected) {
      button.hidden = true;
      const status = button.closest(".ebook-audio-wrap")?.querySelector("small");
      if (status) status.textContent = "ElevenLabs · ready · 0.90x";
      mountReadingAudioPlayer(reading);
      toast("Reading audio is ready. Press Play in the audio player.");
    }
  } catch {
    if (button.isConnected) {
      button.innerHTML = original;
      toast("ElevenLabs narration is unavailable. Please try again.");
    }
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.classList.remove("loading");
      icons();
    }
  }
}

function mountReadingAudioPlayer(reading) {
  const player = $("#ebook-reading-audio");
  if (!player) return;
  const sources = reading.audio?.available
    ? [resolveMediaUrl(reading.audio.source)]
    : readingVoiceSources.get(reading.readingId) || [];
  if (!sources.length) {
    player.hidden = true;
    return;
  }
  let index = 0;
  player.hidden = false;
  player.src = sources[index];
  player.playbackRate = AI_NARRATION_RATE;
  player.defaultPlaybackRate = AI_NARRATION_RATE;
  player.addEventListener("play", () => {
    player.playbackRate = AI_NARRATION_RATE;
  });
  player.addEventListener("ended", () => {
    index += 1;
    if (index >= sources.length) return;
    player.src = sources[index];
    player.playbackRate = AI_NARRATION_RATE;
    player.play().catch(() => toast("Press Play to continue the reading."));
  });
}

// Chat replies speak with the browser voice, not ElevenLabs: a reply is
// written at request time, so no recorded clip can exist and every play would
// be a paid TTS call. Lesson narration elsewhere keeps the recorded Ehel voice.
let speakingAIIndex = null;
async function playAIMessage(index, button) {
  const message = aiState.messages[index];
  if (!message) return;
  if (!audioEnabled) return toast("Sound is muted. Use the sound button in the header to turn it on.");
  if (!browserSpeechSupported) return toast("This browser has no voice to read with.");
  if (speakingAIIndex === index) { stopBrowserSpeech(); speakingAIIndex = null; return; }
  speakingAIIndex = index;
  const original = button.innerHTML;
  button.classList.add("loading");
  await speakBrowser(message.text, {
    rate: speechRateForGrade(gradeNumber),
    onStart: () => { button.innerHTML = `${icon("square")} Stop`; icons(); },
  });
  if (speakingAIIndex === index) speakingAIIndex = null;
  button.innerHTML = original;
  button.classList.remove("loading");
  icons();
}

$("#word-audio").addEventListener("timeupdate", (event) => {
  if (activeAudioEnd !== null && event.currentTarget.currentTime >= activeAudioEnd) stopAudio();
});
$("#word-audio").addEventListener("ended", () => {
  if (!pageNarrationActive) stopAudio();
});

function readingBodyHtml(value) {
  const lines = String(value || "").replace(/\r\n?/g, "\n").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const blocks = [];
  for (const line of lines) {
    const isHeading = line.length <= 72 && (!/[.!?]$/.test(line) || /:$/.test(line));
    if (isHeading) {
      blocks.push(`<h3 class="ebook-subheading">${escapeHtml(line.replace(/:$/, ""))}</h3>`);
      continue;
    }
    const sentences = line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [line];
    const groups = line.length > 320
      ? Array.from({ length: Math.ceil(sentences.length / 3) }, (_, index) => sentences.slice(index * 3, index * 3 + 3).join(" ").trim())
      : [line];
    groups.filter(Boolean).forEach((paragraph) => blocks.push(`<p>${escapeHtml(paragraph)}</p>`));
  }
  return blocks.join("");
}

function readingWordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function renderReading() {
  let selected = course.readings[0].readingId;
  $("#app").innerHTML = `${pageHeader("Read, listen and imagine", "Reading & story", "Open a text, listen to the narration, and enjoy it like your own digital book.")}<div class="reading-layout ebook-layout"><nav class="reading-list ebook-library" id="reading-list" aria-label="Reading library"></nav><article class="ebook-reader" id="reading-panel"></article></div>`;
  const draw = () => {
    $("#reading-list").innerHTML = `<div class="ebook-library-title"><span>${icon("library-big")}</span><div><strong>My reading shelf</strong><small>${course.readings.length} texts in this unit</small></div></div>${course.readings.map((reading, index) => `<button class="reading-button ebook-spine ${selected === reading.readingId ? "active" : ""}" data-reading="${reading.readingId}" type="button" aria-current="${selected === reading.readingId ? "page" : "false"}"><span>${index + 1}</span><div><strong>${escapeHtml(reading.title)}</strong><small>${escapeHtml(reading.type)}</small></div>${icon("chevron-right")}</button>`).join("")}`;
    const reading = course.readings.find((item) => item.readingId === selected);
    const readingIndex = course.readings.findIndex((item) => item.readingId === selected);
    const wordCount = readingWordCount(reading.passageScript);
    const readingMinutes = Math.max(1, Math.ceil(wordCount / (gradeNumber <= 2 ? 100 : gradeNumber <= 4 ? 135 : 170)));
    const audioReady = reading.audio?.available || readingVoiceSources.has(reading.readingId);
    const audioMode = reading.audio?.available ? "recorded" : audioReady ? "ready" : "on demand";
    const audioControls = `<div class="ebook-audio-wrap"><small>ElevenLabs · ${audioMode} · 0.90x</small>${audioReady ? "" : `<button class="button secondary" id="prepare-reading-audio" type="button" aria-label="Prepare ElevenLabs narration for ${escapeHtml(reading.title)}">${icon("audio-lines")} Prepare audio</button>`}<audio id="ebook-reading-audio" class="ebook-native-audio" controls ${audioReady ? "" : "hidden"} aria-label="Reading narration for ${escapeHtml(reading.title)}"></audio></div>`;
    $("#reading-panel").innerHTML = `<div class="ebook-progress" aria-label="Text ${readingIndex + 1} of ${course.readings.length}"><span style="width:${((readingIndex + 1) / course.readings.length) * 100}%"></span></div><header class="ebook-toolbar"><div><span class="ebook-count">Book ${readingIndex + 1} of ${course.readings.length}</span><span>${wordCount} words · about ${readingMinutes} min</span></div>${audioControls}</header><figure class="ebook-cover"><img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt || course.unit.unitTitle)}"><figcaption><span>${escapeHtml(reading.type)}</span><h2>${escapeHtml(reading.title)}</h2><p>${escapeHtml(course.unit.unitTitle)}</p></figcaption></figure><section class="ebook-page"><div class="ebook-page-heading"><span>${icon("bookmark")}</span><div><small>${reading.genre ? escapeHtml(reading.genre) : "Ehel Academy English"}</small><h2>${escapeHtml(reading.title)}</h2>${reading.setting ? `<p>${icon("map-pin")} ${escapeHtml(reading.setting)}</p>` : ""}</div></div><div class="reading-text ebook-copy">${readingBodyHtml(reading.passageScript)}</div><div class="ebook-page-number">${readingIndex + 1}</div></section><footer class="ebook-footer"><button class="button secondary" data-reading-step="-1" type="button" ${readingIndex === 0 ? "disabled" : ""}>${icon("arrow-left")} Previous text</button><button class="button primary" id="reading-done" type="button">Finished reading ${icon("check")}</button><button class="button secondary" data-reading-step="1" type="button" ${readingIndex === course.readings.length - 1 ? "disabled" : ""}>Next text ${icon("arrow-right")}</button></footer>`;
    $$('[data-reading]').forEach((button) => button.addEventListener("click", () => { selected = button.dataset.reading; stopAudio(); draw(); icons(); focusDynamicContent("#reading-panel .ebook-page-heading h2", "Reading selected. " + $("#reading-panel .ebook-page-heading h2").textContent); }));
    $$('[data-reading-step]').forEach((button) => button.addEventListener("click", () => {
      const next = course.readings[readingIndex + Number(button.dataset.readingStep)];
      if (!next) return;
      selected = next.readingId;
      stopAudio();
      draw();
      $("#reading-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      icons();
      focusDynamicContent("#reading-panel .ebook-page-heading h2", "Reading selected. " + $("#reading-panel .ebook-page-heading h2").textContent);
    }));
    if (audioReady) mountReadingAudioPlayer(reading);
    $("#prepare-reading-audio")?.addEventListener("click", (event) => prepareReadingNarration(reading, event.currentTarget));
    $("#reading-done").addEventListener("click", () => complete("reading", `${reading.title} marked as read.`));
    icons();
  };
  draw();
}

function renderComprehension() {
  const groups = [...new Set(course.comprehension.map((question) => question.section))];
  let active = groups[0];
  const draw = () => {
    const questions = course.comprehension.filter((question) => question.section === active);
    $("#app").innerHTML = `${pageHeader("Think about the text", "Comprehension", "Write your answer first. Then reveal the reviewed guidance and improve your response.")}<div class="subtabs">${groups.map((group) => `<button class="subtab ${group === active ? "active" : ""}" data-group="${escapeHtml(group)}" type="button">${escapeHtml(group)}</button>`).join("")}</div><section class="panel"><div class="question-list">${questions.map((question) => `<div class="question"><label for="answer-${question.questionId}">${question.sequence}. ${escapeHtml(question.question)}</label><textarea id="answer-${question.questionId}" data-answer-input="${question.questionId}" placeholder="Write a complete answer…"></textarea><button class="button secondary" data-check-answer="${question.questionId}" type="button">Check guidance</button><div id="feedback-${question.questionId}" role="status" aria-live="polite" aria-atomic="true"></div></div>`).join("")}</div><button class="button primary" id="comprehension-done" type="button">Finish comprehension ${icon("check")}</button></section>`;
    $$('[data-group]').forEach((button) => button.addEventListener("click", () => { active = button.dataset.group; draw(); }));
    $$('[data-check-answer]').forEach((button) => button.addEventListener("click", () => {
      const question = course.comprehension.find((item) => item.questionId === button.dataset.checkAnswer);
      const value = $(`#answer-${question.questionId}`).value.trim();
      $(`#feedback-${question.questionId}`).innerHTML = value.length < 4 ? `<p class="feedback try">Write your own answer before viewing the guidance.</p>` : `<p class="feedback good"><span class="field-label">Reviewed guidance:</span> ${escapeHtml(question.correctAnswer)}</p>`;
    }));
    $("#comprehension-done").addEventListener("click", () => complete("comprehension", "Comprehension practice complete."));
    icons();
  };
  draw();
}

function renderGrammar() {
  // Grade 1 gets the kid-friendly full-screen carousel (one pattern at a time),
  // modelled on the Arabic Alphabet unit's Learn section. Older grades keep the
  // grid workshop.
  if (gradeNumber === 1) return renderGrammarCarousel();
  $("#app").innerHTML = `${pageHeader("Language focus", "Grammar workshop", "Complete six practices: guided recognition followed by independent language use.")}<div class="grammar-grid">${course.grammar.map((lesson) => `<article class="panel grammar-card"><div class="word-card-head"><span class="lesson-number">${lesson.sequence}</span><span class="word-type">${escapeHtml(lesson.practiceType)}</span></div><h3>${escapeHtml(lesson.title)}</h3>${grammarDiagram(lesson.title, lesson.explanation)}<p>${escapeHtml(lesson.explanation)}</p>${lesson.ruleAndExamples ? `<div class="rule-box">${escapeHtml(lesson.ruleAndExamples)}</div>` : ""}${lesson.commonMistake ? `<p class="mistake">${escapeHtml(lesson.commonMistake)}</p>` : ""}${lesson.memoryTip ? `<p><span class="field-label">Memory tip:</span> ${escapeHtml(lesson.memoryTip)}</p>` : ""}<details><summary>Show practice</summary><p class="rule-box">${escapeHtml(lesson.practice)}</p>${lesson.practiceAudio?.available ? `<button class="button secondary" data-practice-audio="${lesson.grammarId}" type="button">${icon("volume-2")} Hear the practice</button>` : ""}</details>${lesson.audio?.available ? `<div class="audio-actions"><button class="button secondary" data-grammar-audio="${lesson.grammarId}" data-rate="${AI_NARRATION_RATE}" type="button">${icon("volume-2")} Listen</button><button class="button secondary" data-grammar-audio="${lesson.grammarId}" data-rate="${AI_NARRATION_RATE}" type="button">${icon("rotate-ccw")} Replay</button></div><small class="audio-source">ElevenLabs · approved Ehel voice · 0.90x</small>` : `<span class="audio-pending">${icon("clock-3")} ElevenLabs audio pending</span>`}</article>`).join("")}</div><p><button class="button primary" id="grammar-done" type="button">I practised all six lessons ${icon("check")}</button></p>`;
  $$('[data-grammar-audio]').forEach((button) => button.addEventListener("click", () => {
    const lesson = course.grammar.find((item) => item.grammarId === button.dataset.grammarAudio);
    playAudio(lesson.audio.source, { rate: Number(button.dataset.rate), button });
  }));
  // Same practice-audio control as the Grade 1 carousel, for the grid workshop.
  $$('[data-practice-audio]').forEach((button) => button.addEventListener("click", () => {
    const lesson = course.grammar.find((item) => item.grammarId === button.dataset.practiceAudio);
    playAudio(lesson.practiceAudio.source, { rate: AI_NARRATION_RATE, button });
  }));
  $("#grammar-done").addEventListener("click", () => complete("grammar", "Grammar workshop complete."));
}

// Grade 1 grammar as a full-screen slide carousel (Arabic-Alphabet Learn style):
// one language pattern per vibrant slide, big "Hear it" button, side arrows,
// dots, swipe. Reaching the last slide completes the section.
const GC_EMOJI = ["🔤", "👂", "🧩", "🗣️", "👀", "⭐", "🌈", "🎈"];
function renderGrammarCarousel() {
  const lessons = course.grammar;
  const esc = escapeHtml;
  // Every field the grid workshop shows is preserved — only the layout changes:
  // title, the S/V/O diagram, explanation, the rule (ruleAndExamples), the
  // common-mistake teacher note, the memory tip, the practice, audio + source.
  const slides = lessons.map((lesson, i) => {
    const emoji = GC_EMOJI[i % GC_EMOJI.length];
    return `<section class="gc-slide gc-v${i % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Pattern ${lesson.sequence} of ${lessons.length} · ${esc(lesson.practiceType)}</span>
      <h3 class="gc-title">${esc(lesson.title)}</h3>
      ${phonicsDiagram(lesson.ruleAndExamples)}
      <p class="gc-lead"><span class="gc-emoji" aria-hidden="true">${emoji}</span> ${esc(lesson.explanation)}</p>
      ${lesson.ruleAndExamples ? `<div class="gc-pattern" lang="en">${esc(lesson.ruleAndExamples)}</div>` : ""}
      <div class="gc-actions">
        ${lesson.audio?.available
          ? `<button class="gc-btn play" type="button" data-grammar-audio="${esc(lesson.grammarId)}" data-rate="${AI_NARRATION_RATE}">${icon("volume-2")} Hear it</button>
             <button class="gc-btn ghost" type="button" data-grammar-audio="${esc(lesson.grammarId)}" data-rate="${AI_NARRATION_RATE}">${icon("rotate-ccw")} Again</button>`
          : `<span class="audio-pending">${icon("clock-3")} ElevenLabs audio pending</span>`}
      </div>
      ${lesson.audio?.available ? `<small class="gc-source">ElevenLabs · approved Ehel voice · 0.90x</small>` : ""}
      ${lesson.commonMistake ? `<p class="gc-note gc-mistake">${esc(lesson.commonMistake)}</p>` : ""}
      ${lesson.memoryTip ? `<p class="gc-note"><span class="field-label">Memory tip:</span> ${esc(lesson.memoryTip)}</p>` : ""}
      ${lesson.practice ? `<details class="gc-practice"><summary>Show practice</summary><p class="gc-note gc-try">${esc(lesson.practice)}</p>${lesson.practiceAudio?.available ? `<button class="gc-btn" data-practice-audio="${lesson.grammarId}" type="button">${icon("volume-2")} Hear the practice</button>` : ""}</details>` : ""}
      ${i === lessons.length - 1 ? `<button class="gc-btn done" id="grammar-done" type="button">${icon("check")} I practised all six lessons</button>` : ""}
    </div></section>`;
  }).join("");

  const count = lessons.length;
  $("#app").innerHTML = `
    <div class="gc-wrap">
      <div class="gc-top"><h2 class="gc-heading">Say the patterns</h2><span class="gc-count" id="gc-count">Pattern 1 of ${count}</span></div>
      <div class="gc-carousel">
        <button class="gc-arrow prev" type="button" aria-label="Previous pattern">${icon("chevron-left")}</button>
        <div class="gc-viewport"><div class="gc-track">${slides}</div></div>
        <button class="gc-arrow next" type="button" aria-label="Next pattern">${icon("chevron-right")}</button>
      </div>
      <div class="gc-dots">${lessons.map((_, i) => `<button class="gc-dot" type="button" data-dot="${i}" aria-label="Pattern ${i + 1} of ${count}"></button>`).join("")}</div>
    </div>`;

  // Full-bleed: the carousel fills the whole viewport (paired with focus mode,
  // which already hides the topbar/sidebar and requests browser fullscreen on
  // the nav click). Cleared in onBeforeRender when leaving grammar.
  document.body.classList.add("gc-full");

  const track = $(".gc-track");
  const dots = $$("[data-dot]");
  const prevArrow = $(".gc-arrow.prev");
  const nextArrow = $(".gc-arrow.next");
  const countLabel = $("#gc-count");
  let slide = 0;
  const goToSlide = (n) => {
    slide = Math.max(0, Math.min(count - 1, n));
    track.style.transform = `translateX(-${slide * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === slide));
    prevArrow.disabled = slide === 0;
    nextArrow.disabled = slide === count - 1;
    countLabel.textContent = `Pattern ${slide + 1} of ${count}`;
    stopAudio();
    if (slide === count - 1 && !progress.completed.includes("grammar")) complete("grammar", "Grammar patterns complete. Well done!");
  };
  prevArrow.addEventListener("click", () => goToSlide(slide - 1));
  nextArrow.addEventListener("click", () => goToSlide(slide + 1));
  dots.forEach((dot) => dot.addEventListener("click", () => goToSlide(Number(dot.dataset.dot))));
  $$('[data-grammar-audio]').forEach((button) => button.addEventListener("click", () => {
    const lesson = lessons.find((item) => item.grammarId === button.dataset.grammarAudio);
    playAudio(lesson.audio.source, { rate: Number(button.dataset.rate), button });
  }));
  // The practice task read aloud, separate from the explanation above it, so a
  // learner working alone can hear what they are being asked to do.
  $$('[data-practice-audio]').forEach((button) => button.addEventListener("click", () => {
    const lesson = lessons.find((item) => item.grammarId === button.dataset.practiceAudio);
    playAudio(lesson.practiceAudio.source, { rate: AI_NARRATION_RATE, button });
  }));
  $("#grammar-done")?.addEventListener("click", () => complete("grammar", "Grammar patterns complete. Well done!"));
  // Swipe (touch) support.
  const viewport = $(".gc-viewport");
  let startX = null;
  viewport.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 45) goToSlide(slide + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
  goToSlide(0);
}

function renderSpeaking() {
  $("#app").innerHTML = `${pageHeader("Use your voice", "Dialogue & speaking", "Complete six speaking practices. Rehearse, record, and listen back.")}<div class="task-grid">${course.speaking.map((task) => `<article class="panel task-card"><span class="eyebrow">Practice ${task.sequence} · ${escapeHtml(task.activityType)}</span><h3>${escapeHtml(task.title)}</h3><p class="rule-box">${escapeHtml(task.instructionsAndModelLines)}</p>${task.audio?.available ? `<div class="audio-actions"><button class="button secondary" data-model="${task.speakingId}" data-rate="${AI_NARRATION_RATE}" type="button">${icon("volume-2")} Hear model</button><button class="button secondary" data-model="${task.speakingId}" data-rate="${AI_NARRATION_RATE}" type="button">${icon("rotate-ccw")} Replay</button></div><small class="audio-source">ElevenLabs · approved Ehel voice · 0.90x</small>` : `<span class="audio-pending">${icon("clock-3")} ElevenLabs model audio pending</span>`}${task.recordingRequired ? `<div class="recorder"><button class="record-button" data-record="${task.speakingId}" type="button" aria-label="Start recording for ${escapeHtml(task.title)}">${icon("mic")}</button><div><strong data-record-status="${task.speakingId}">Ready to record</strong><small> Your recording stays on this device.</small></div></div><audio data-playback="${task.speakingId}" controls hidden></audio>` : ""}</article>`).join("")}</div><p><button class="button primary" id="speaking-done" type="button">Finish six speaking practices ${icon("check")}</button></p>`;
  $$('[data-model]').forEach((button) => button.addEventListener("click", () => {
    const task = course.speaking.find((item) => item.speakingId === button.dataset.model);
    playAudio(task.audio.source, { rate: Number(button.dataset.rate), button });
  }));
  $$('[data-record]').forEach((button) => button.addEventListener("click", () => toggleRecording(button.dataset.record, button)));
  $("#speaking-done").addEventListener("click", () => complete("speaking", "Speaking practice complete."));
}

async function toggleRecording(taskId, button) {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Audio recording is not supported in this browser.");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    activeRecordingId = taskId;
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener("dataavailable", (event) => { if (event.data.size) recordedChunks.push(event.data); });
    mediaRecorder.addEventListener("stop", () => {
      const audio = $(`[data-playback="${activeRecordingId}"]`);
      const previous = recordings.get(activeRecordingId);
      if (previous?.url) URL.revokeObjectURL(previous.url);
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
      const url = URL.createObjectURL(blob);
      recordings.set(activeRecordingId, { blob, url });
      speakingReviewState.set(activeRecordingId, { listened: false, feedback: null });
      audio.src = url;
      audio.hidden = false;
      $(`[data-record-status="${activeRecordingId}"]`).textContent = "Recording ready. Listen back.";
      const activeButton = $(`[data-record="${activeRecordingId}"]`);
      activeButton.classList.remove("recording");
      activeButton.innerHTML = icon("mic");
      stream.getTracks().forEach((track) => track.stop());
      audio.dispatchEvent(new CustomEvent("recordingready"));
      icons();
    });
    mediaRecorder.start();
    $(`[data-record-status="${taskId}"]`).textContent = "Recording… tap to stop";
    button.classList.add("recording");
    button.innerHTML = icon("square");
    icons();
  } catch {
    toast("Microphone permission is needed to record your introduction.");
  }
}

function renderWriting() {
  let active = course.writing[0].writingId;
  const draw = () => {
    const task = course.writing.find((item) => item.writingId === active);
    const saved = progress.writing[active] || "";
    $("#app").innerHTML = `${pageHeader("Plan, write and improve", "Writing studio", "Choose a task. Your draft saves automatically on this device.")}<div class="subtabs">${course.writing.map((item) => `<button class="subtab ${active === item.writingId ? "active" : ""}" data-writing="${item.writingId}" type="button">Writing ${item.sequence}</button>`).join("")}</div><div class="task-grid"><section class="panel"><h2>${escapeHtml(task.title)}</h2><p class="rule-box">${escapeHtml(task.promptAndInstructions)}</p>${task.audio?.available ? `<button class="button secondary" data-writing-audio="${task.writingId}" type="button">${icon("volume-2")} Hear the task</button>` : ""}<details><summary>View model text</summary><p class="model">${escapeHtml(task.modelText)}</p></details><p><span class="field-label">Expected:</span> ${escapeHtml(task.expectedLength)}</p><textarea id="writing-draft" placeholder="${escapeHtml(task.sentenceStarter)}">${escapeHtml(saved)}</textarea><p id="save-status"><small>${saved ? "Draft restored" : "Start writing when you are ready"}</small></p></section><aside class="panel"><h3>Writer's checklist</h3><ul class="checklist">${task.successCriteria.split(";").map((criterion, index) => `<li><label><input type="checkbox" data-writing-check="${index}"><span>${escapeHtml(criterion.trim())}</span></label></li>`).join("")}</ul><h3>Support</h3><p>${escapeHtml(task.support)}</p><h3>Challenge</h3><p>${escapeHtml(task.extension)}</p><button class="button primary" id="writing-done" type="button">Submit this draft ${icon("send")}</button></aside></div>`;
    $$('[data-writing]').forEach((button) => button.addEventListener("click", () => { active = button.dataset.writing; draw(); }));
    $$('[data-writing-audio]').forEach((button) => button.addEventListener("click", () => {
      const item = course.writing.find((w) => w.writingId === button.dataset.writingAudio);
      playAudio(item.audio.source, { rate: AI_NARRATION_RATE, button });
    }));
    let saveTimer;
    $("#writing-draft").addEventListener("input", (event) => { clearTimeout(saveTimer); $("#save-status").innerHTML = "<small>Saving…</small>"; saveTimer = setTimeout(() => { progress.writing[active] = event.target.value; saveProgress(); emitProgress({ type: "draft.saved", unit: PROGRESS_UNIT, section: `writing:${active}`, text: event.target.value, words: event.target.value.trim().split(/\s+/).filter(Boolean).length }); $("#save-status").innerHTML = "<small>Draft saved</small>"; }, 350); });
    $("#writing-done").addEventListener("click", () => {
      const draft = $("#writing-draft").value.trim();
      if (draft.split(/\s+/).length < 8) return toast("Add a little more to your draft before submitting.");
      progress.writing[active] = draft; complete("writing", "Writing draft saved to your learning portfolio.");
    });
    icons();
  };
  draw();
}

function renderActivities() {
  $("#app").innerHTML = `${pageHeader("Learn by doing", "Activities", `Complete six practical ${escapeHtml(course.unit.unitTitle)} challenges.`)}<div class="task-grid">${course.activities.map((activity) => `<article class="panel task-card"><span class="eyebrow">Activity ${activity.sequence} · ${escapeHtml(activity.activityType)}</span><h3>${escapeHtml(activity.title)}</h3><p class="rule-box">${escapeHtml(activity.instructionsAndItems)}</p>${activity.audio?.available ? `<button class="button secondary" data-activity-audio="${activity.activityId}" type="button">${icon("volume-2")} Hear the instructions</button>` : ""}<textarea class="activity-response" rows="4" placeholder="Record your answer or notes…" aria-label="Response for ${escapeHtml(activity.title)}"></textarea><button class="button secondary" data-activity-done="${activity.activityId}" type="button">${icon("check")} Mark complete</button></article>`).join("")}</div><p><button class="button primary" id="activities-done" type="button">Finish activities ${icon("check")}</button></p>`;
  $$('[data-activity-done]').forEach((button) => button.addEventListener("click", () => { button.disabled = true; button.innerHTML = `${icon("check-circle")} Complete`; icons(); }));
  $$('[data-activity-audio]').forEach((button) => button.addEventListener("click", () => {
    const item = course.activities.find((a) => a.activityId === button.dataset.activityAudio);
    playAudio(item.audio.source, { rate: AI_NARRATION_RATE, button });
  }));
  $("#activities-done").addEventListener("click", () => complete("activities", "Unit activities complete."));
}

async function playGameInstruction(text, button) {
  if (!audioEnabled) return toast("Sound is muted. Use the sound button in the header to turn it on.");
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${icon("loader-circle")} Preparing voice`;
  icons();
  try {
    const source = await aiVoiceUrl(text);
    playAudio(source, { rate: AI_NARRATION_RATE, button });
  } catch {
    toast("The ElevenLabs game voice is unavailable. Please try again.");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
    icons();
  }
}

function gameProgress(gameId) {
  progress.games ||= {};
  return progress.games[gameId] || { bestScore: 0, attempts: 0, xp: 0 };
}

function renderGames() {
  if (!gamePack) {
    $("#app").innerHTML = `${pageHeader("Game zone", "Games coming soon", "This unit's curriculum-linked games are still being prepared.", "Pilot pending")}`;
    return;
  }
  if (activeGameId) return renderActiveGame();
  const mastered = gamePack.games.filter((game) => gameProgress(game.id).bestScore >= gamePack.masteryScore).length;
  const xp = gamePack.games.reduce((total, game) => total + gameProgress(game.id).xp, 0);
  $("#app").innerHTML = `${pageHeader("Play, practise, master", "Game zone", `${gamePack.games.length} short learning games turn ${escapeHtml(course.unit.unitTitle)} vocabulary, reading, grammar, sentences and speaking into active practice.`, `${gradeLabel} games`)}
    <section class="games-hero"><img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt)}"><div><span class="eyebrow">Unit ${course.unit.unitNo} · ${escapeHtml(course.unit.unitTitle)}</span><h2>Choose your next challenge</h2><p>Earn stars by showing what you know. Hints and retries are always available.</p><div class="game-hero-stats"><strong>${mastered}/${gamePack.games.length} mastered</strong><strong>${xp} XP earned</strong></div></div></section>
    <div class="game-grid">${gamePack.games.map((game, index) => {
      const saved = gameProgress(game.id);
      const passed = saved.bestScore >= gamePack.masteryScore;
      return `<article class="game-card ${passed ? "mastered" : ""}"><div class="game-card-top"><span class="game-icon">${icon(game.icon)}</span><span class="game-number">${index + 1}</span></div><span class="eyebrow">${escapeHtml(game.skill)}</span><h2>${escapeHtml(game.title)}</h2><p>${escapeHtml(game.description)}</p><div class="game-stars" aria-label="Best score ${saved.bestScore} out of ${game.rounds.length}">${game.rounds.map((_, star) => `<span class="${star < saved.bestScore ? "earned" : ""}">★</span>`).join("")}</div><button class="button ${passed ? "secondary" : "primary"}" data-start-game="${game.id}" type="button">${passed ? icon("rotate-ccw") + " Play again" : icon("play") + " Start game"}</button></article>`;
    }).join("")}</div>`;
  $$('[data-start-game]').forEach((button) => button.addEventListener("click", () => startGame(button.dataset.startGame)));
  icons();
}

function startGame(gameId) {
  activeGameId = gameId;
  gameRoundIndex = 0;
  gameScore = 0;
  gameLocked = false;
  gameSelection = [];
  gamePairSelection = [];
  gameMistakes = 0;
  renderActiveGame();
}

function currentGame() {
  return gamePack.games.find((game) => game.id === activeGameId);
}

function gameHint(game, round) {
  if (round.clue) return round.clue;
  if (["sentence", "sequence"].includes(game.type)) return "Begin with the word that has a capital letter or belongs first in the sequence. Check the ending carefully.";
  if (game.type === "pairs") return "Remember where each revealed word or meaning appears. Match one word with one meaning.";
  if (game.id === "reading-detective") return "Look again at the story evidence and find the sentence that answers the question.";
  if (game.id === "grammar-sort") return "Read the complete sentence aloud and use the unit grammar rule.";
  if (game.type === "speaking") return "Listen to the model, then practise one short phrase at a time before recording.";
  return "Say each choice with the meaning. One choice should sound like a clear match.";
}

function gameRoundMarkup(game, round) {
  if (game.type === "choice") {
    return `${game.passage ? `<div class="game-passage"><span>Story evidence</span><p>${escapeHtml(game.passage)}</p></div>` : ""}<div class="game-choices">${round.choices.map((choice, index) => `<button data-game-choice="${index}" type="button">${escapeHtml(choice)}</button>`).join("")}</div>`;
  }
  if (game.type === "spelling") {
    const letters = [...round.answer].reverse();
    return `<p class="game-clue">${escapeHtml(round.clue)}</p><div class="game-answer-slots" id="game-answer">${round.answer.split("").map(() => "<span></span>").join("")}</div><div class="game-tiles">${letters.map((letter, index) => `<button data-game-tile="${index}" data-value="${letter}" type="button">${letter.toUpperCase()}</button>`).join("")}</div><div class="game-tools"><button class="button secondary" id="game-reset" type="button">${icon("rotate-ccw")} Reset</button><button class="button primary" id="game-check" type="button">Check word ${icon("check")}</button></div>`;
  }
  if (["sentence", "sequence"].includes(game.type)) {
    return `<div class="game-sentence-answer" id="game-answer"><span>Choose the words below</span></div><div class="game-word-tiles">${round.tokens.map((token, index) => `<button data-game-tile="${index}" data-value="${escapeHtml(token)}" type="button">${escapeHtml(token)}</button>`).join("")}</div><div class="game-tools"><button class="button secondary" id="game-reset" type="button">${icon("rotate-ccw")} Reset</button><button class="button primary" id="game-check" type="button">${game.type === "sequence" ? "Check order" : "Check sentence"} ${icon("check")}</button></div>`;
  }
  if (game.type === "pairs") {
    const tiles = round.pairs.flatMap((pair, pairIndex) => pair.map((text, side) => ({ text, pairIndex, side })));
    const ordered = [0, 3, 4, 1, 2, 5].map((index) => tiles[index]);
    return `<div class="memory-grid">${ordered.map((tile, index) => `<button data-memory-tile="${index}" data-pair="${tile.pairIndex}" data-value="${escapeHtml(tile.text)}" type="button" aria-label="Hidden matching tile ${index + 1}"><span>?</span></button>`).join("")}</div><p class="game-clue">Match each word with its meaning. A perfect round earns a star.</p>`;
  }
  const recordingId = `game-speaking-${gameRoundIndex}`;
  const review = speakingReviewState.get(recordingId);
  return `<div class="speaking-target game-speaking-target"><span>Say this</span><p>${escapeHtml(round.target)}</p><button class="button secondary" id="game-speaking-model" type="button">${icon("volume-2")} Hear ElevenLabs model</button></div><div class="speaking-flow"><span class="flow-step active"><strong>1</strong> Record</span><span class="flow-step ${review ? "active" : ""}"><strong>2</strong> Listen</span><span class="flow-step ${review?.listened ? "active" : ""}"><strong>3</strong> Submit</span><span class="flow-step ${review?.feedback ? "active" : ""}"><strong>4</strong> Feedback</span></div><div class="recorder"><button class="record-button" data-record="${recordingId}" type="button" aria-label="Record speaking game answer">${icon("mic")}</button><div><strong data-record-status="${recordingId}" role="status" aria-live="polite" aria-atomic="true">${recordings.has(recordingId) ? "Recording ready. Listen back." : "Ready to record"}</strong><small> Your recording stays on this device until you submit it.</small></div></div><audio data-playback="${recordingId}" controls ${recordings.has(recordingId) ? "" : "hidden"} aria-label="Your speaking game recording"></audio><button class="button primary game-speaking-submit" id="game-speaking-submit" type="button" ${review?.listened ? "" : "disabled"}>${icon("send")} Submit for pronunciation check</button><div id="game-speaking-feedback" role="status" aria-live="polite" aria-atomic="true">${pronunciationFeedbackHtml(review?.feedback)}</div>`;
}

function renderActiveGame() {
  const game = currentGame();
  if (!game) { activeGameId = null; return renderGames(); }
  if (gameRoundIndex >= game.rounds.length) return renderGameResult(game);
  const round = game.rounds[gameRoundIndex];
  gameLocked = false;
  gameSelection = [];
  gamePairSelection = [];
  gameMistakes = 0;
  $("#app").innerHTML = `<div class="game-play-top"><button class="button ghost" id="games-home" type="button">${icon("arrow-left")} All games</button><div><span>Challenge ${gameRoundIndex + 1} of ${game.rounds.length}</span><strong>${gameScore} stars</strong></div></div><section class="panel game-stage"><div class="game-stage-head"><span class="game-icon">${icon(game.icon)}</span><div><span class="eyebrow">${escapeHtml(game.skill)}</span><h1>${escapeHtml(game.title)}</h1></div><button class="icon-button" id="game-listen" type="button" title="Listen to instructions" aria-label="Listen to game instructions">${icon("volume-2")}</button></div><div class="game-progress"><span style="width:${(gameRoundIndex / game.rounds.length) * 100}%"></span></div><div class="game-prompt"><span>Your challenge</span><h2>${escapeHtml(round.prompt)}</h2><button class="button ghost game-hint" id="game-hint" type="button">${icon("lightbulb")} Hint</button></div>${gameRoundMarkup(game, round)}<div id="game-feedback" role="status" aria-live="polite" aria-atomic="true"></div></section>`;
  $("#games-home").addEventListener("click", () => { activeGameId = null; renderGames(); });
  $("#game-listen").addEventListener("click", (event) => playGameInstruction(`${round.prompt} ${round.clue || round.target || ""}`, event.currentTarget));
  $("#game-hint").addEventListener("click", () => toast(gameHint(game, round)));
  if (game.type === "choice") bindChoiceGame(game, round);
  if (["spelling", "sentence", "sequence"].includes(game.type)) bindBuilderGame(game, round);
  if (game.type === "pairs") bindPairsGame(round);
  if (game.type === "speaking") bindSpeakingGame(game, round);
  icons();
}

function bindChoiceGame(game, round) {
  $$('[data-game-choice]').forEach((button) => button.addEventListener("click", () => {
    if (gameLocked) return;
    const choice = round.choices[Number(button.dataset.gameChoice)];
    const correct = choice === round.answer;
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) $$('[data-game-choice]').find((item) => round.choices[Number(item.dataset.gameChoice)] === round.answer)?.classList.add("correct");
    completeGameRound(correct, round.explanation);
  }));
}

function bindBuilderGame(game, round) {
  const drawSelection = () => {
    const values = gameSelection.map((item) => item.value);
    if (game.type === "spelling") {
      $("#game-answer").innerHTML = round.answer.split("").map((_, index) => `<span>${escapeHtml(values[index] || "")}</span>`).join("");
    } else {
      $("#game-answer").innerHTML = values.length ? values.map((value) => `<strong>${escapeHtml(value)}</strong>`).join("") : "<span>Choose the words below</span>";
    }
  };
  $$('[data-game-tile]').forEach((button) => button.addEventListener("click", () => {
    if (gameLocked || button.disabled) return;
    gameSelection.push({ index: button.dataset.gameTile, value: button.dataset.value });
    button.disabled = true;
    drawSelection();
  }));
  $("#game-reset").addEventListener("click", () => { gameSelection = []; $$('[data-game-tile]').forEach((button) => { button.disabled = false; }); drawSelection(); });
  $("#game-check").addEventListener("click", () => {
    if (!gameSelection.length) return toast("Choose some tiles first.");
    const response = game.type === "spelling" ? gameSelection.map((item) => item.value).join("") : gameSelection.map((item) => item.value).join(" ");
    completeGameRound(response === round.answer, response === round.answer ? "You built it correctly." : `The correct answer is: ${round.answer}`);
  });
}

function bindPairsGame(round) {
  let matchedPairs = 0;
  $$('[data-memory-tile]').forEach((button) => button.addEventListener("click", () => {
    if (gameLocked || button.disabled || gamePairSelection.includes(button)) return;
    button.classList.add("revealed");
    button.querySelector("span").textContent = button.dataset.value;
    gamePairSelection.push(button);
    if (gamePairSelection.length < 2) return;
    const [first, second] = gamePairSelection;
    if (first.dataset.pair === second.dataset.pair) {
      first.classList.add("matched");
      second.classList.add("matched");
      first.disabled = true;
      second.disabled = true;
      gamePairSelection = [];
      matchedPairs += 1;
      if (matchedPairs === round.pairs.length) completeGameRound(gameMistakes === 0, gameMistakes === 0 ? "Perfect memory! Every pair matched." : "All pairs matched. Replay for a perfect star.");
      return;
    }
    gameMistakes += 1;
    first.classList.add("wrong");
    second.classList.add("wrong");
    setTimeout(() => {
      for (const item of [first, second]) {
        item.classList.remove("revealed", "wrong");
        item.querySelector("span").textContent = "?";
      }
      gamePairSelection = [];
    }, 650);
  }));
}

function bindSpeakingGame(game, round) {
  const recordingId = `game-speaking-${gameRoundIndex}`;
  const recordButton = $(`[data-record="${recordingId}"]`);
  const playback = $(`[data-playback="${recordingId}"]`);
  const saved = recordings.get(recordingId);
  if (saved) playback.src = saved.url;
  recordButton.addEventListener("click", () => toggleRecording(recordingId, recordButton));
  playback.addEventListener("recordingready", () => { $("#game-speaking-submit").disabled = true; $("#game-speaking-feedback").innerHTML = ""; });
  playback.addEventListener("ended", () => {
    const review = speakingReviewState.get(recordingId) || { feedback: null };
    review.listened = true;
    speakingReviewState.set(recordingId, review);
    $("#game-speaking-submit").disabled = false;
    toast("You listened to the full recording. It is ready to submit.");
  });
  $("#game-speaking-model").addEventListener("click", (event) => playGameInstruction(round.target, event.currentTarget));
  $("#game-speaking-submit").addEventListener("click", (event) => submitSpeakingRecording(recordingId, round.target, event.currentTarget, {
    feedbackSelector: "#game-speaking-feedback",
    onFeedback: (feedback) => completeGameRound(feedback.score >= 65, feedback.score >= 65 ? "Your key words were recognised clearly." : "Listen to the model and practise the highlighted words again."),
  }));
}

function completeGameRound(correct, explanation) {
  if (gameLocked) return;
  gameLocked = true;
  if (correct) gameScore += 1;
  const feedback = $("#game-feedback");
  feedback.innerHTML = `<div class="game-round-feedback ${correct ? "good" : "try"}"><span>${correct ? icon("star") : icon("lightbulb")}</span><div><span class="status-note">${correct ? "Star earned!" : "Good try!"}</span><p>${escapeHtml(explanation || "Review the clue and keep going.")}</p></div></div><button class="button primary" id="game-next" type="button">${gameRoundIndex + 1 === currentGame().rounds.length ? "See my result" : "Next challenge"} ${icon("arrow-right")}</button>`;
  $("#game-next").addEventListener("click", () => { gameRoundIndex += 1; renderActiveGame(); });
  icons();
}

function renderGameResult(game) {
  const passed = gameScore >= gamePack.masteryScore;
  const previous = gameProgress(game.id);
  const bestScore = Math.max(previous.bestScore, gameScore);
  const xp = Math.max(previous.xp, gameScore * 20 + (passed ? 20 : 0));
  progress.games[game.id] = { bestScore, attempts: previous.attempts + 1, xp };
  saveProgress();
  const mastered = gamePack.games.filter((item) => gameProgress(item.id).bestScore >= gamePack.masteryScore).length;
  if (mastered === gamePack.games.length) complete("games", `All ${gamePack.games.length} games mastered. Brilliant work!`);
  $("#app").innerHTML = `<section class="panel game-result"><div class="score-ring">${gameScore}/${game.rounds.length}</div><span class="eyebrow">${passed ? "Game mastered" : "Keep practising"}</span><h1>${passed ? "Brilliant work!" : "Nearly there!"}</h1><p>You earned ${gameScore} stars and ${gameScore * 20 + (passed ? 20 : 0)} XP in ${escapeHtml(game.title)}.</p><div class="game-stars large">${game.rounds.map((_, index) => `<span class="${index < gameScore ? "earned" : ""}">★</span>`).join("")}</div><div class="game-tools"><button class="button secondary" id="replay-game" type="button">${icon("rotate-ccw")} Play again</button><button class="button primary" id="games-home" type="button">Choose another game ${icon("arrow-right")}</button></div></section>`;
  $("#replay-game").addEventListener("click", () => startGame(game.id));
  $("#games-home").addEventListener("click", () => { activeGameId = null; renderGames(); });
  icons();
}

function renderQuiz() {
  quizIndex = 0; quizScore = 0; quizLocked = false;
  $("#app").innerHTML = `${pageHeader("Unit checkpoint", "Quick quiz", "Answer ten questions. You will see feedback after each answer and can try again.")}<section class="panel quiz-shell" id="quiz-shell"></section>`;
  drawQuizQuestion();
}

function drawQuizQuestion(shouldFocus = false) {
  const shell = $("#quiz-shell");
  if (quizIndex >= course.quizzes.length) {
    const percent = Math.round((quizScore / course.quizzes.length) * 100);
    emitProgress({ type: "checkpoint.result", unit: PROGRESS_UNIT, section: "quiz", score: percent, passed: percent >= 60, attempt: 1 });
    shell.innerHTML = `<div class="quiz-result"><div class="score-ring">${quizScore}/${course.quizzes.length}</div><span class="eyebrow">Checkpoint complete</span><h2>${percent >= 80 ? "Excellent word power!" : "Good effort. Review and try again."}</h2><p>You scored ${percent}% and earned ${quizScore * 10} XP.</p><div class="audio-actions" style="justify-content:center"><button class="button secondary" id="retry-quiz" type="button">${icon("rotate-ccw")} Try again</button><button class="button primary" id="quiz-done" type="button">Continue ${icon("arrow-right")}</button></div></div>`;
    $("#retry-quiz").addEventListener("click", renderQuiz);
    $("#quiz-done").addEventListener("click", () => { if (percent >= 60) complete("quiz"); navigate("reflect"); });
    if (percent >= 60) complete("quiz", "Quiz passed. Well done!");
    icons();
    if (shouldFocus) focusDynamicContent("#quiz-shell h2", `Quiz complete. You scored ${percent} percent.`);
    return;
  }
  const question = course.quizzes[quizIndex];
  const options = question.options.split(" | ");
  shell.innerHTML = `<div class="quiz-top"><span>Question ${quizIndex + 1} of ${course.quizzes.length}</span><strong>${quizScore} correct</strong></div><div class="progress-track"><span style="width:${(quizIndex / course.quizzes.length) * 100}%"></span></div><h2 class="quiz-question">${escapeHtml(question.question)}</h2><div class="quiz-options">${options.map((option) => `<button class="quiz-option" data-option="${escapeHtml(option)}" type="button">${escapeHtml(option)}</button>`).join("")}</div><div id="quiz-feedback" role="status" aria-live="polite" aria-atomic="true"></div><button class="button primary" id="next-quiz" type="button" hidden>Next question ${icon("arrow-right")}</button>`;
  quizLocked = false;
  $$('[data-option]').forEach((button) => button.addEventListener("click", () => {
    if (quizLocked) return;
    quizLocked = true;
    const correct = button.dataset.option === String(question.correctAnswer);
    if (correct) quizScore += 1;
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) $$('[data-option]').find((option) => option.dataset.option === String(question.correctAnswer))?.classList.add("correct");
    $("#quiz-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><span class="status-note">${correct ? "Correct!" : "Not quite."}</span> ${escapeHtml(question.explanation)}</p>`;
    $("#next-quiz").hidden = false;
    $("#next-quiz").addEventListener("click", () => { quizIndex += 1; drawQuizQuestion(true); });
  }));
  icons();
  if (shouldFocus) focusDynamicContent(".quiz-question", `Question ${quizIndex + 1} of ${course.quizzes.length}. ${question.question}`);
}

function calculateFinalQuizResults(answers = finalQuizProgress.answers) {
  const answered = finalAssessment.questions.filter((question) => answers[question.questionId]);
  const correct = answered.filter((question) => answers[question.questionId].selected === question.correctAnswer);
  const summarize = (key, definitions) => definitions.map((definition) => {
    const questions = finalAssessment.questions.filter((question) => question[key] === definition.id);
    const score = questions.filter((question) => answers[question.questionId]?.selected === question.correctAnswer).length;
    return { ...definition, score, total: questions.length, percent: Math.round((score / questions.length) * 100) };
  });
  const sectionScores = summarize("sectionId", finalAssessment.sections.map((section) => ({ id: section.sectionId, label: section.title })));
  const areaNames = [...new Set(finalAssessment.questions.map((question) => question.curriculumArea))];
  const areaScores = summarize("curriculumArea", areaNames.map((area) => ({ id: area, label: area })));
  const unitScores = summarize("sourceUnitNo", manifest.units.map((unit) => ({ id: unit.number, label: `Unit ${unit.number}: ${unit.title}` })));
  const percent = Math.round((correct.length / finalAssessment.totalMarks) * 100);
  return { answered: answered.length, score: correct.length, total: finalAssessment.totalMarks, percent, passed: percent >= finalAssessment.passPercent, sectionScores, areaScores, unitScores };
}

function finalizeFinalQuiz() {
  const results = calculateFinalQuizResults();
  if (!finalQuizProgress.submitted) {
    finalQuizProgress.attempts.push({
      attempt: finalQuizProgress.attempts.length + 1,
      startedAt: finalQuizProgress.startedAt,
      submittedAt: new Date().toISOString(),
      answers: { ...finalQuizProgress.answers },
      score: results.score,
      total: results.total,
      percent: results.percent,
      passed: results.passed,
      sectionScores: results.sectionScores,
      areaScores: results.areaScores,
      unitScores: results.unitScores,
    });
  }
  finalQuizProgress.currentIndex = finalAssessment.questions.length;
  finalQuizProgress.completed = true;
  finalQuizProgress.passed = results.passed;
  finalQuizProgress.submitted = true;
  saveFinalQuizProgress();
  emitProgress({ type: "checkpoint.result", unit: "final", section: "course-quiz", score: results.percent, passed: results.passed, attempt: finalQuizProgress.attempts.length });
  renderFinalQuizResults(results);
}

function renderFinalQuiz() {
  if (unitNumber !== 10) return navigate("overview");
  if (finalQuizProgress.submitted) return renderFinalQuizResults(calculateFinalQuizResults());
  const hasStarted = Object.keys(finalQuizProgress.answers).length > 0 || finalQuizProgress.startedAt;
  if (!hasStarted) {
    $("#app").innerHTML = `${pageHeader("Course-level assessment", finalAssessment.title, finalAssessment.description, "Approved final assessment")}
      <div class="final-quiz-intro">
        <section class="panel final-quiz-hero"><div class="final-quiz-mark">${icon("trophy")}</div><span class="eyebrow">Your ${gradeLabel} finish line</span><h2>Three short sections. One complete picture of your progress.</h2><p>Your answer saves after every question. Reach ${finalAssessment.passPercent}% for mastery, or review the suggested lessons and try again.</p><div class="final-quiz-facts"><span><strong>${finalAssessment.questionCount}</strong> questions</span><span><strong>${finalAssessment.estimatedMinutes}</strong> minutes</span><span><strong>${finalAssessment.passPercent}%</strong> mastery</span></div><button class="button gold" id="start-final-quiz" type="button">Start final quiz ${icon("arrow-right")}</button></section>
        <div class="final-section-grid">${finalAssessment.sections.map((section) => `<article class="panel final-section-card"><span>${String(section.sequence).padStart(2, "0")}</span><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.description)}</p><small>${section.questionCount} questions</small></article>`).join("")}</div>
      </div>`;
    $("#start-final-quiz").addEventListener("click", () => {
      finalQuizProgress.startedAt = new Date().toISOString();
      finalQuizProgress.currentIndex = 0;
      saveFinalQuizProgress();
      finalQuizIndex = 0;
      drawFinalQuizQuestion();
    });
    icons();
    return;
  }
  finalQuizIndex = Math.min(finalQuizProgress.currentIndex || 0, finalAssessment.questions.length - 1);
  drawFinalQuizQuestion();
}

function drawFinalQuizQuestion() {
  const question = finalAssessment.questions[finalQuizIndex];
  if (!question) return finalizeFinalQuiz();
  const section = finalAssessment.sections.find((item) => item.sectionId === question.sectionId);
  const savedAnswer = finalQuizProgress.answers[question.questionId];
  const options = question.options.split(" | ");
  const sectionQuestionNumber = finalAssessment.questions.filter((item) => item.sectionId === question.sectionId && item.sequence <= question.sequence).length;
  const audioControl = question.audio?.available
    ? `<button class="button secondary" id="listen-final-question" type="button">${icon("volume-2")} Listen</button>`
    : `<span class="audio-pending">${icon("headphones")} ElevenLabs read-aloud pending</span>`;
  $("#app").innerHTML = `${pageHeader(`Section ${section.sequence} of ${finalAssessment.sections.length}`, section.title, section.description, `Question ${finalQuizIndex + 1} of ${finalAssessment.questionCount}`)}
    <section class="panel quiz-shell final-quiz-shell">
      <div class="quiz-top"><span>${sectionQuestionNumber} of ${section.questionCount} in this section</span><strong>${Object.keys(finalQuizProgress.answers).length} answers saved</strong></div>
      <div class="progress-track"><span style="width:${(finalQuizIndex / finalAssessment.questionCount) * 100}%"></span></div>
      <div class="final-question-meta"><span>Review source: Unit ${question.sourceUnitNo}</span>${audioControl}</div>
      <h2 class="quiz-question">${escapeHtml(question.question)}</h2>
      <div class="quiz-options">${options.map((option) => {
        const isSelected = savedAnswer?.selected === option;
        const state = savedAnswer ? (option === question.correctAnswer ? "correct" : isSelected ? "wrong" : "") : "";
        return `<button class="quiz-option ${state}" data-final-option="${escapeHtml(option)}" type="button" ${savedAnswer ? "disabled" : ""}>${escapeHtml(option)}</button>`;
      }).join("")}</div>
      <div id="final-quiz-feedback" role="status" aria-live="polite" aria-atomic="true">${savedAnswer ? `<p class="feedback ${savedAnswer.correct ? "good" : "try"}"><span class="status-note">${savedAnswer.correct ? "Correct!" : "Not quite."}</span> ${escapeHtml(question.explanation)}</p>` : ""}</div>
      <div class="final-quiz-actions"><span>${icon("save")} Answers save on this device</span><button class="button primary" id="next-final-question" type="button" ${savedAnswer ? "" : "hidden"}>${finalQuizIndex === finalAssessment.questionCount - 1 ? "Finish quiz" : "Next question"} ${icon("arrow-right")}</button></div>
    </section>`;
  if (question.audio?.available) $("#listen-final-question").addEventListener("click", (event) => playAudio(question.audio.source, { rate: AI_NARRATION_RATE, button: event.currentTarget }));
  $$('[data-final-option]').forEach((button) => button.addEventListener("click", () => {
    if (finalQuizProgress.answers[question.questionId]) return;
    const selected = button.dataset.finalOption;
    finalQuizProgress.answers[question.questionId] = { selected, correct: selected === question.correctAnswer, answeredAt: new Date().toISOString() };
    finalQuizProgress.currentIndex = finalQuizIndex;
    saveFinalQuizProgress();
    drawFinalQuizQuestion();
  }));
  if (savedAnswer) $("#next-final-question").addEventListener("click", () => {
    if (finalQuizIndex >= finalAssessment.questionCount - 1) return finalizeFinalQuiz();
    finalQuizIndex += 1;
    finalQuizProgress.currentIndex = finalQuizIndex;
    saveFinalQuizProgress();
    drawFinalQuizQuestion();
  });
  icons();
}

function renderFinalQuizResults(results) {
  const reviewUnits = results.unitScores.filter((item) => item.percent < finalAssessment.passPercent).sort((a, b) => a.percent - b.percent).slice(0, 3);
  $("#app").innerHTML = `${pageHeader("Course assessment complete", `Your ${gradeLabel} English results`, "Your report brings together all three sections and shows exactly where to review next.", results.passed ? "Mastery achieved" : "Review recommended")}
    <div class="final-results-layout">
      <section class="panel final-result-summary"><div class="score-ring">${results.score}/${results.total}</div><span class="eyebrow">${results.percent}% overall</span><h2>${results.passed ? `You reached ${gradeLabel} mastery!` : "Your next attempt can be stronger."}</h2><p>${results.passed ? `You showed secure understanding across the ${gradeLabel} English course.` : `Review the suggested Units, then try again. The mastery target is ${finalAssessment.passPercent}%.`}</p><div class="audio-actions"><button class="button secondary" id="retry-final-quiz" type="button">${icon("rotate-ccw")} Try again</button><button class="button primary" id="back-to-capstone" type="button">Return to capstone ${icon("arrow-right")}</button></div></section>
      <section class="panel"><h2>Section scores</h2><div class="result-bars">${results.sectionScores.map((item) => `<div class="result-bar"><div><strong>${escapeHtml(item.label)}</strong><span>${item.score}/${item.total}</span></div><div class="progress-track"><span style="width:${item.percent}%"></span></div></div>`).join("")}</div></section>
      <section class="panel"><h2>Skills report</h2><div class="skill-score-grid">${results.areaScores.map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${item.percent}%</strong><small>${item.score} of ${item.total}</small></div>`).join("")}</div></section>
      <section class="panel"><h2>${reviewUnits.length ? "Recommended review" : "Every Unit is secure"}</h2>${reviewUnits.length ? `<div class="review-list">${reviewUnits.map((item) => `<a href="${courseLocation(item.id)}"><span><strong>${escapeHtml(item.label)}</strong><small>${item.score} of ${item.total} correct</small></span>${icon("arrow-up-right")}</a>`).join("")}</div>` : "<p>You met the mastery target in every source Unit represented in the final quiz.</p>"}</section>
    </div>`;
  $("#retry-final-quiz").addEventListener("click", () => {
    finalQuizProgress.answers = {};
    finalQuizProgress.currentIndex = 0;
    finalQuizProgress.completed = false;
    finalQuizProgress.passed = false;
    finalQuizProgress.submitted = false;
    finalQuizProgress.startedAt = null;
    saveFinalQuizProgress();
    finalQuizIndex = 0;
    renderFinalQuiz();
  });
  $("#back-to-capstone").addEventListener("click", () => navigate("reflect"));
  icons();
}

// ===================== prerequisite unit: placement exam =====================
// Unit -1 on every grade. The exam data (questions, banding thresholds,
// remediation links) lives in grade-N/data/placement-exam.json — the UI only
// applies it, so curriculum can retune bands without a code change.

function placementLocation(targetGrade, targetUnit, nextRoute = "overview") {
  const url = new URL(location.href);
  url.searchParams.set("grade", targetGrade);
  url.searchParams.set("unit", targetUnit ?? (Number(targetGrade) === 1 ? 0 : 1));
  url.hash = nextRoute;
  return url.href;
}

function remediationHref(item) {
  if (item.href) return new URL(item.href, location.href).href;
  return placementLocation(item.grade, item.unit);
}

function remediationLabel(item) {
  if (item.href) return item.title || "Foundation course";
  return `${item.grade != null ? `Grade ${item.grade}, ` : ""}Unit ${item.unit}: ${item.title}`;
}

function placementBand(percent, sectionScores) {
  const banding = placementExam.banding || {};
  const ready = banding.ready || {};
  const review = banding.readyWithReview || {};
  const criticalRule = banding.criticalSection;
  const critical = criticalRule && sectionScores.find((item) => item.id === criticalRule.sectionId);
  if (percent < (review.minOverallPercent ?? 50) || (critical && critical.percent <= (criticalRule.maxFailPercent ?? 40))) return "notReady";
  if (percent >= (ready.minOverallPercent ?? 80) && sectionScores.every((item) => item.percent >= (ready.minSectionPercent ?? 60))) return "ready";
  return "readyWithReview";
}

function calculatePlacementResults(answers = placementProgress.answers) {
  const answered = placementExam.questions.filter((question) => answers[question.questionId]);
  const correct = answered.filter((question) => answers[question.questionId].selected === question.correctAnswer);
  const sectionScores = placementExam.sections.map((section) => {
    const questions = placementExam.questions.filter((question) => question.sectionId === section.sectionId);
    const score = questions.filter((question) => answers[question.questionId]?.selected === question.correctAnswer).length;
    return { id: section.sectionId, label: section.title, score, total: questions.length, percent: questions.length ? Math.round((score / questions.length) * 100) : 0, remediation: section.remediation || [] };
  });
  const areaNames = [...new Set(placementExam.questions.map((question) => question.curriculumArea))];
  const areaScores = areaNames.map((area) => {
    const questions = placementExam.questions.filter((question) => question.curriculumArea === area);
    const score = questions.filter((question) => answers[question.questionId]?.selected === question.correctAnswer).length;
    return { id: area, label: area, score, total: questions.length, percent: questions.length ? Math.round((score / questions.length) * 100) : 0 };
  });
  const percent = Math.round((correct.length / placementExam.totalMarks) * 100);
  return { answered: answered.length, score: correct.length, total: placementExam.totalMarks, percent, sectionScores, areaScores, band: placementBand(percent, sectionScores) };
}

function finalizePlacement() {
  const results = calculatePlacementResults();
  if (!placementProgress.submitted) {
    placementProgress.attempts.push({
      attempt: placementProgress.attempts.length + 1,
      startedAt: placementProgress.startedAt,
      submittedAt: new Date().toISOString(),
      answers: { ...placementProgress.answers },
      score: results.score,
      total: results.total,
      percent: results.percent,
      band: results.band,
      sectionScores: results.sectionScores,
      areaScores: results.areaScores,
    });
  }
  placementProgress.currentIndex = placementExam.questions.length;
  placementProgress.completed = true;
  placementProgress.band = results.band;
  placementProgress.submitted = true;
  savePlacementProgress();
  complete("placement");
  emitProgress({ type: "checkpoint.result", unit: "prereq", section: "placement-exam", score: results.percent, passed: results.band !== "notReady", attempt: placementProgress.attempts.length });
  renderPlacementResults(results);
}

function renderPrereqOverview() {
  const isReadiness = placementExam.kind === "readiness";
  const facts = `<div class="final-quiz-facts"><span><strong>${placementExam.questionCount}</strong> questions</span><span><strong>${placementExam.estimatedMinutes}</strong> minutes</span><span><strong>${placementExam.sections.length}</strong> sections</span></div>`;
  const bandInfo = placementProgress.submitted && placementProgress.band ? (placementExam.banding[placementProgress.band] || {}) : null;
  $("#app").innerHTML = `${pageHeader(`${gradeLabel} · Prerequisite unit`, placementExam.title, placementExam.description, isReadiness ? "Readiness check" : "Placement exam")}
    <div class="final-quiz-intro">
      <section class="panel final-quiz-hero"><div class="final-quiz-mark">${icon("compass")}</div><span class="eyebrow">Before Unit 1</span><h2>${isReadiness ? "Let's see what you already know." : `Show what you remember — we'll find your perfect start.`}</h2><p>${escapeHtml(placementExam.attemptsAllowed || "You can try as many times as you like.")} Your answers save on this device after every question.</p>${facts}
      ${bandInfo
        ? `<div class="audio-actions"><button class="button gold" data-go="placement" type="button">${icon("chart-no-axes-column-increasing")} View my placement report</button><a class="button secondary" href="${courseLocation(defaultUnit)}">Go to Unit 1 ${icon("arrow-right")}</a></div>`
        : `<div class="audio-actions"><button class="button gold" data-go="placement" type="button">${isReadiness ? "Start readiness check" : "Start placement exam"} ${icon("arrow-right")}</button><a class="button secondary" href="${courseLocation(defaultUnit)}">Skip for now — open Unit 1</a></div>`}
      ${overviewAudioButton(placementExam, "intro", "Hear the overview")}
      </section>
      <div class="final-section-grid">${placementExam.sections.map((section) => `<article class="panel final-section-card"><span>${String(section.sequence).padStart(2, "0")}</span><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.description)}</p><small>${section.questionCount} questions</small></article>`).join("")}</div>
      ${overviewAudioButton(placementExam, "sections", "Hear what the exam covers")}
      <section class="panel"><h3>How placement works</h3><ol class="path-list">
        <li>${icon("circle-check-big")}<span><strong>Ready:</strong> you move straight on to Unit 1.</span></li>
        <li>${icon("book-open")}<span><strong>Ready with review:</strong> you start Unit 1 and warm up with a few review lessons.</span></li>
        <li>${icon("sprout")}<span><strong>Build strong roots first:</strong> we suggest the best course to grow from — a grown-up or teacher can help you choose.</span></li>
      </ol>${overviewAudioButton(placementExam, "path", "Hear how placement works")}</section>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
  bindOverviewAudio(placementExam);
  icons();
}

function renderPlacementExam() {
  if (!isPrereqUnit) return navigate("overview");
  if (placementProgress.submitted) return renderPlacementResults(calculatePlacementResults());
  const hasStarted = Object.keys(placementProgress.answers).length > 0 || placementProgress.startedAt;
  if (!hasStarted) {
    placementProgress.startedAt = new Date().toISOString();
    placementProgress.currentIndex = 0;
    savePlacementProgress();
    placementIndex = 0;
    drawPlacementQuestion();
    return;
  }
  placementIndex = Math.min(placementProgress.currentIndex || 0, placementExam.questions.length - 1);
  drawPlacementQuestion();
}

function drawPlacementQuestion() {
  const question = placementExam.questions[placementIndex];
  if (!question) return finalizePlacement();
  const section = placementExam.sections.find((item) => item.sectionId === question.sectionId);
  const savedAnswer = placementProgress.answers[question.questionId];
  const options = question.options.split(" | ");
  const sectionQuestionNumber = placementExam.questions.filter((item) => item.sectionId === question.sectionId && item.sequence <= question.sequence).length;
  const sourceNote = question.sourceGrade ? `From Grade ${question.sourceGrade}${question.sourceUnitNo ? ` · Unit ${question.sourceUnitNo}` : ""}` : "Getting-ready skills";
  $("#app").innerHTML = `${pageHeader(`Section ${section.sequence} of ${placementExam.sections.length}`, section.title, section.description, `Question ${placementIndex + 1} of ${placementExam.questionCount}`)}
    <section class="panel quiz-shell final-quiz-shell">
      <div class="quiz-top"><span>${sectionQuestionNumber} of ${section.questionCount} in this section</span><strong>${Object.keys(placementProgress.answers).length} answers saved</strong></div>
      <div class="progress-track"><span style="width:${(placementIndex / placementExam.questionCount) * 100}%"></span></div>
      <div class="final-question-meta"><span>${escapeHtml(sourceNote)}</span></div>
      <h2 class="quiz-question">${escapeHtml(question.question)}</h2>
      <div class="quiz-options">${options.map((option) => {
        const isSelected = savedAnswer?.selected === option;
        const state = savedAnswer ? (option === question.correctAnswer ? "correct" : isSelected ? "wrong" : "") : "";
        return `<button class="quiz-option ${state}" data-placement-option="${escapeHtml(option)}" type="button" ${savedAnswer ? "disabled" : ""}>${escapeHtml(option)}</button>`;
      }).join("")}</div>
      <div id="placement-feedback" role="status" aria-live="polite" aria-atomic="true">${savedAnswer ? `<p class="feedback ${savedAnswer.correct ? "good" : "try"}"><span class="status-note">${savedAnswer.correct ? "Correct!" : "Not quite."}</span> ${escapeHtml(question.explanation)}</p>` : ""}</div>
      <div class="final-quiz-actions"><span>${icon("save")} Answers save on this device</span><button class="button primary" id="next-placement-question" type="button" ${savedAnswer ? "" : "hidden"}>${placementIndex === placementExam.questionCount - 1 ? "Finish and see my report" : "Next question"} ${icon("arrow-right")}</button></div>
    </section>`;
  $$('[data-placement-option]').forEach((button) => button.addEventListener("click", () => {
    if (placementProgress.answers[question.questionId]) return;
    const selected = button.dataset.placementOption;
    placementProgress.answers[question.questionId] = { selected, correct: selected === question.correctAnswer, answeredAt: new Date().toISOString() };
    placementProgress.currentIndex = placementIndex;
    savePlacementProgress();
    drawPlacementQuestion();
  }));
  if (savedAnswer) $("#next-placement-question").addEventListener("click", () => {
    if (placementIndex >= placementExam.questionCount - 1) return finalizePlacement();
    placementIndex += 1;
    placementProgress.currentIndex = placementIndex;
    savePlacementProgress();
    drawPlacementQuestion();
  });
  icons();
}

function renderPlacementResults(results) {
  const banding = placementExam.banding || {};
  const bandInfo = banding[results.band] || {};
  const minSectionPercent = banding.ready?.minSectionPercent ?? 60;
  const weakSections = results.sectionScores.filter((item) => item.percent < minSectionPercent);
  const reviewSections = weakSections.length ? weakSections : results.sectionScores.filter((item) => item.percent < (banding.ready?.minOverallPercent ?? 80));
  const recommendation = banding.notReady?.recommendation;
  const heroActions = results.band === "notReady"
    ? `<div class="audio-actions">${recommendation ? `<a class="button gold" href="${recommendation.href ? new URL(recommendation.href, location.href).href : placementLocation(recommendation.grade)}">${icon("sprout")} Start ${escapeHtml(recommendation.label || "the recommended course")}</a>` : ""}<button class="button secondary" id="retry-placement" type="button">${icon("rotate-ccw")} Try again</button><a class="button secondary" href="${courseLocation(defaultUnit)}">My teacher says continue to ${gradeLabel} ${icon("arrow-right")}</a></div>`
    : `<div class="audio-actions"><a class="button gold" href="${courseLocation(defaultUnit)}">Start ${gradeLabel}, Unit ${defaultUnit} ${icon("arrow-right")}</a><button class="button secondary" id="retry-placement" type="button">${icon("rotate-ccw")} Try again</button></div>`;
  $("#app").innerHTML = `${pageHeader("Your placement report", bandInfo.label || "Placement report", placementExam.title, `${results.percent}% overall`)}
    <div class="final-results-layout">
      <section class="panel final-result-summary"><div class="score-ring">${results.score}/${results.total}</div><span class="eyebrow">${results.percent}% overall</span><h2>${escapeHtml(bandInfo.label || "Your report is ready")}</h2><p>${escapeHtml(bandInfo.message || "Here is how you did in each section.")}</p>${heroActions}</section>
      <section class="panel"><h2>Section scores</h2><div class="result-bars">${results.sectionScores.map((item) => `<div class="result-bar"><div><strong>${escapeHtml(item.label)}</strong><span>${item.score}/${item.total}</span></div><div class="progress-track"><span style="width:${item.percent}%"></span></div></div>`).join("")}</div></section>
      <section class="panel"><h2>Skills report</h2><div class="skill-score-grid">${results.areaScores.map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${item.percent}%</strong><small>${item.score} of ${item.total}</small></div>`).join("")}</div></section>
      <section class="panel"><h2>${reviewSections.length ? "Your review plan" : "Every section is secure"}</h2>${reviewSections.length
        ? `<p>These lessons rebuild exactly what each section tests. Do them in order, then try the exam again.</p><div class="review-list">${reviewSections.flatMap((item) => (item.remediation || []).map((entry) => `<a href="${remediationHref(entry)}"><span><strong>${escapeHtml(remediationLabel(entry))}</strong><small>Rebuilds: ${escapeHtml(item.label)} (${item.percent}%)</small></span>${icon("arrow-up-right")}</a>`)).join("")}</div>`
        : `<p>You met the target in every section. ${gradeLabel} is the right place for you.</p>`}
      </section>
      <section class="panel"><h2>Need help understanding your report?</h2><p>Wehel Tutor can explain any question you found hard, and a grown-up or teacher can help you choose your path.</p><a class="button secondary" href="${courseLocation(defaultUnit, "ai")}">${icon("sparkles")} Ask Wehel Tutor</a></section>
    </div>`;
  $("#retry-placement")?.addEventListener("click", () => {
    placementProgress.answers = {};
    placementProgress.currentIndex = 0;
    placementProgress.completed = false;
    placementProgress.band = null;
    placementProgress.submitted = false;
    placementProgress.startedAt = null;
    savePlacementProgress();
    placementIndex = 0;
    renderPlacementExam();
  });
  icons();
}

function renderPrereqTeacher() {
  const latest = placementProgress.attempts[placementProgress.attempts.length - 1];
  const bandLabel = (band) => (placementExam.banding?.[band]?.label) || band || "—";
  $("#app").innerHTML = `${pageHeader("Teacher view", `${gradeLabel} placement exam`, "Placement evidence for entry to this grade, with per-section remediation guidance.", "Placement diagnostics")}
    <div class="section-stack">
      <section class="panel approval-banner"><h2>Purpose</h2><p>The prerequisite unit measures readiness for ${escapeHtml(cambridgeLabel(gradeNumber))}. Bands are advisory: a teacher or parent can override the recommendation. Thresholds live in placement-exam.json.</p></section>
      ${latest ? `<section class="panel"><h2>Latest attempt</h2><div class="teacher-assessment-summary"><div><strong>${latest.percent}%</strong><span>${latest.score}/${latest.total} marks</span></div><div><strong>${escapeHtml(bandLabel(latest.band))}</strong><span>Attempt ${latest.attempt} of ${placementProgress.attempts.length}</span></div><div><strong>${new Date(latest.submittedAt).toLocaleDateString()}</strong><span>Latest submission</span></div></div>
      <div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Section</th><th>Score</th><th>Percent</th><th>Teaching response</th></tr></thead><tbody>${latest.sectionScores.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${item.score}/${item.total}</td><td>${item.percent}%</td><td>${item.percent >= (placementExam.banding?.ready?.minSectionPercent ?? 60) ? "Secure for entry." : "Re-teach via the section's linked review units before or alongside Unit 1."}</td></tr>`).join("")}</tbody></table></div></section>` : `<section class="panel"><h2>No attempt yet</h2><p>No submitted attempt is stored on this device. The exam holds ${placementExam.questionCount} questions across ${placementExam.sections.length} sections and reports one of three bands: Ready, Ready with review, or a recommendation to start from ${escapeHtml(placementExam.banding?.notReady?.recommendation?.label || "an earlier course")}.</p></section>`}
    </div>`;
}

const aiModes = [
  ["teach", "presentation", "Teach me"],
  ["help", "life-buoy", "Help me"],
  ["practice", "dumbbell", "Practise"],
  ["check", "scan-check", "Check my work"],
  ["speaking", "mic", "Speaking coach"],
  ["progress", "chart-no-axes-column-increasing", "My progress"],
];

function unitVocabulary() {
  return course.dictionaryLinks.map((link) => ({ link, entry: dictionary.entries.find((entry) => entry.dictionaryEntryId === link.dictionaryEntryId) })).filter((item) => item.entry);
}

function findVocabulary(text) {
  const lower = text.toLowerCase();
  return unitVocabulary().find(({ entry }) => lower.includes(entry.displayWord.toLowerCase()));
}

function rememberNeed(need) {
  if (!aiState.needs.includes(need)) aiState.needs.push(need);
  aiState.needs = aiState.needs.slice(-5);
}

function teacherLesson() {
  const words = unitVocabulary().slice(0, 3).map(({ entry }) => entry.displayWord);
  return `Today we are learning ${course.unit.unitTitle}. First, say these words with me: ${words.join(", ")}. Next, we will read “${course.readings[0].title}”. Then we will practise ${course.grammar[0].title}. At the end, tell me one new thing you learned. Which word would you like to start with?`;
}

function writingFeedback(text) {
  const work = text.replace(/^(check|please check|can you check)( my work)?[:\s-]*/i, "").trim();
  if (work.split(/\s+/).length < 3) {
    rememberNeed("writing detail");
    return "Write one complete sentence for me. Try: My name is ____. I like ____. Then I will help you improve it.";
  }
  const notes = [];
  if (!/^[A-Z]/.test(work)) notes.push("Start with a capital letter");
  if (!/[.!?]$/.test(work)) notes.push("finish with a full stop or question mark");
  if (!/\b(is|am|are|like|likes|have|has|can)\b/i.test(work)) notes.push("check that your sentence has an action or linking word");
  if (!notes.length) return `Good checking. “${work}” is a complete sentence. Now add one describing detail or a reason with “because”.`;
  rememberNeed("sentence checking");
  return `You have a useful idea. Improve it in this order: ${notes.join("; ")}. Try the sentence again, and I will check your new version.`;
}

function buildAIReply(message, mode) {
  const text = message.trim();
  const lower = text.toLowerCase();
  if (/\b(give|tell|show)\b.*\b(answer|answers)\b|what is the answer|do my quiz/i.test(lower)) {
    rememberNeed("independent quiz thinking");
    return "I will help you think, but I will not choose a quiz answer for you. Read the question, cross out one answer that does not fit, and tell me which two choices you are considering. I will give you a hint.";
  }
  if (mode === "check") return writingFeedback(text);
  const vocabulary = findVocabulary(text);
  if (vocabulary) {
    const { entry, link } = vocabulary;
    if (!aiState.practiceWords.includes(entry.displayWord)) aiState.practiceWords.push(entry.displayWord);
    return `${entry.displayWord} is a ${entry.partOfSpeech}. It means: ${link.childMeaning || entry.canonicalMeaning}. Example: ${link.exampleSentence}. Now make your own short sentence with ${entry.displayWord}.`;
  }
  if (mode === "teach") return teacherLesson();
  if (mode === "speaking") {
    const task = course.speaking[aiState.interactions % course.speaking.length];
    return `Let us practise speaking. ${task.instructionsAndModelLines.split("\n").slice(0, 3).join(" ")} Speak slowly, use a complete sentence, and listen to your recording. Then tell me one part you want to improve.`;
  }
  if (mode === "practice") {
    const item = unitVocabulary()[aiState.interactions % unitVocabulary().length];
    return `Word challenge: ${item.entry.displayWord}. Say the word, spell it, and explain it in your own words. Then use it in a sentence. I will check your attempt before showing the model.`;
  }
  if (mode === "progress") {
    const completed = progress.completed.filter((item) => !["overview", "live"].includes(item)).length;
    const needs = aiState.needs.length ? aiState.needs.join(", ") : "no repeated difficulty yet";
    return `You have completed ${completed} learning sections and marked ${progress.knownWords.length} words as known. We have practised ${aiState.practiceWords.length} words together. Your current support areas are: ${needs}. A good next step is ${completed < 3 ? "the teacher lesson and vocabulary" : "one reading question and one complete sentence"}.`;
  }
  if (/read|story|poem/.test(lower)) return `Open “${course.readings[0].title}”. Read the first part slowly. Tell me who or what it is about, then find one detail that supports your answer. I will help with any hard word.`;
  if (/grammar|he|she|like|likes|sentence/.test(lower)) return `${course.grammar[0].title}: ${course.grammar[0].explanation.split("\n")[0]} Try one example of your own. I will give a hint before I correct it.`;
  if (/write|writing|check/.test(lower)) return writingFeedback(text);
  return `I am using ${gradeLabel} Unit ${course.unit.unitNo}: ${course.unit.unitTitle}. Ask me about a unit word, the story, grammar, speaking, or your writing. You can also choose a mode above for guided practice.`;
}

function aiQuickPrompts(mode) {
  return ({
    teach: ["Start today’s lesson", "Teach me three words", "What will I learn?"],
    help: ["Explain a hard word", "Help me with the story", "Help me with grammar"],
    practice: ["Give me a word challenge", "Quiz me with hints", "Let’s play I Spy"],
    check: ["Check: My name is Samira.", "Help me improve a sentence", "Check my spelling"],
    speaking: ["Give me a speaking task", "Help me introduce myself", "Practise questions with me"],
    progress: ["Show my progress", "What should I practise next?", "What am I improving?"],
  })[mode];
}

function currentSpeakingTask() {
  const index = Number(aiState.speakingTaskIndex || 0) % course.speaking.length;
  return course.speaking[index];
}

function speakingModelText(task) {
  const script = String(task.instructionsAndModelLines || "");
  const quoted = [...script.matchAll(/[“"]([^”"]{3,})[”"]/g)].map((match) => match[1].trim());
  if (quoted.length) return quoted.slice(0, 3).join(" ");
  return script.split("\n").map((line) => line.trim()).filter((line) => line && !/^(get ready|record|check:|did you)/i.test(line)).slice(0, 2).join(" ");
}

function speechWords(value) {
  return String(value || "").toLowerCase().replace(/[_]+/g, " ").replace(/[^a-z'\s]/g, " ").split(/\s+/).filter((word) => word.length > 1);
}

function evaluatePronunciation(target, transcript) {
  const expected = [...new Set(speechWords(target))];
  const heard = new Set(speechWords(transcript));
  const matched = expected.filter((word) => heard.has(word));
  const missing = expected.filter((word) => !heard.has(word));
  const score = expected.length ? Math.round((matched.length / expected.length) * 100) : 0;
  const rating = score >= 85 ? "Clear and confident" : score >= 65 ? "Good progress" : "Practise once more";
  const guidance = score >= 85
    ? "Your key words were recognised clearly. Repeat once with smooth expression."
    : score >= 65
      ? `Say ${missing.slice(0, 3).join(", ")} more slowly, then record again.`
      : "Listen to the model again. Say one short phrase at a time and keep your voice close to the microphone.";
  return { score, rating, guidance, transcript, matched, missing };
}

function pronunciationFeedbackHtml(feedback) {
  if (!feedback) return "";
  const words = feedback.missing.length
    ? `<div class="phonetic-words"><span>Practise:</span>${feedback.missing.slice(0, 5).map((word) => `<strong>${escapeHtml(word)}</strong>`).join("")}</div>`
    : `<div class="phonetic-words success"><span>Key words:</span><span class="status-note">Recognised clearly</span></div>`;
  return `<section class="pronunciation-result"><div class="pronunciation-score"><strong>${feedback.score}%</strong><span>${escapeHtml(feedback.rating)}</span></div><div><p><span class="field-label">We heard:</span> ${escapeHtml(feedback.transcript || "No clear words detected")}</p><p>${escapeHtml(feedback.guidance)}</p>${words}</div></section>`;
}

function blobAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result).split(",")[1] || ""));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

async function submitSpeakingRecording(recordingId, target, button, { feedbackSelector = "#ai-speaking-feedback", onFeedback = null } = {}) {
  const recording = recordings.get(recordingId);
  const review = speakingReviewState.get(recordingId);
  if (!recording) return toast("Record your voice first.");
  if (!review?.listened) return toast("Listen to your full recording before submitting it.");
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${icon("loader-circle")} Checking pronunciation`;
  button.classList.add("loading");
  icons();
  try {
    const audioBase64 = await blobAsBase64(recording.blob);
    const response = await fetch(AI_STT_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64, mimeType: recording.blob.type || "audio/webm", purpose: "ehel_english" }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.text) throw new Error(result.message || "No clear speech was detected.");
    review.feedback = evaluatePronunciation(target, result.text);
    if (review.feedback.score < 65) rememberNeed("clear pronunciation");
    speakingReviewState.set(recordingId, review);
    const feedbackTarget = $(feedbackSelector);
    if (feedbackTarget) feedbackTarget.innerHTML = pronunciationFeedbackHtml(review.feedback);
    if (onFeedback) onFeedback(review.feedback);
  } catch (error) {
    toast(error.message || "Pronunciation checking is unavailable. Please try again.");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
    button.classList.remove("loading");
    icons();
  }
}

// The shell's floating dock mounts the SHARED Wehel panel, while this course
// keeps its own mode-tabbed page. Both read and write aiState.messages, so the
// drawer and the page are one conversation — a question asked in the drawer is
// still there when the learner opens the full tutor page.
function wehelOptions() {
  return {
    meta: {
      subject: "english", subjectLabel: "English", grade: gradeNumber,
      cambridgeCode: cambridgeLabel(gradeNumber),
      unitNo: course.unit.unitNo, unitTitle: course.unit.unitTitle,
      courseOutline: outlineFromManifest(manifest), unit: course,
    },
    store: aiState,
    key: "messages",
    ui: { escapeHtml, toast },
    tutorLabel: "Wehel Tutor",
    greeting: `Hello! I am Wehel Tutor. Ask me anything about Unit ${course.unit.unitNo}: ${course.unit.unitTitle}.`,
    placeholder: `Ask about ${course.unit.unitTitle}…`,
    quickPrompts: [
      { label: "Explain this", message: "Can you explain what is on this page in a simpler way?" },
      { label: "Teach me words", message: "Teach me three words from this unit." },
      { label: "Quiz me", message: "Quiz me on this unit, one question at a time." },
      { label: "Check my sentence", message: "I will write a sentence. Please help me make it better." },
    ],
    mode: aiState.mode,
    fallbackReply: (message) => buildAIReply(message, aiState.mode),
    onExchange: () => { if (!progress.completed.includes("ai")) complete("ai"); },
    fetchUnit: unitFetcher(manifest, dataRootUrl),
    onSaved: () => { saveAIState(); if (route === "ai") { renderAIEnglish(); icons(); } },
  };
}

function renderAIEnglish() {
  if (!aiState.messages.length) aiState.messages.push({ role: "assistant", text: `Hello! I am Wehel Tutor, your AI English teacher and tutor for Unit ${course.unit.unitNo}. Choose Teach me for a lesson or Help me when you are stuck.` });
  const prompts = aiQuickPrompts(aiState.mode);
  const speakingTask = currentSpeakingTask();
  const speakingTarget = speakingModelText(speakingTask);
  const speakingRecordingId = `ai-speaking-${speakingTask.speakingId}`;
  const speakingReview = speakingReviewState.get(speakingRecordingId);
  const speakingTools = aiState.mode === "speaking" ? `<section class="ai-speaking-coach">
    <div class="ai-speaking-head"><div><span class="eyebrow">Pronunciation practice</span><h3>${escapeHtml(speakingTask.title)}</h3></div><label>Practice<select id="ai-speaking-task">${course.speaking.map((task, index) => `<option value="${index}" ${task.speakingId === speakingTask.speakingId ? "selected" : ""}>${index + 1} of ${course.speaking.length}</option>`).join("")}</select></label></div>
    <div class="speaking-target"><span>Say this</span><p>${escapeHtml(speakingTarget)}</p>${speakingTask.audio?.available ? `<button class="button secondary" id="ai-speaking-model" type="button">${icon("volume-2")} Hear model</button>` : ""}</div>
    <div class="speaking-flow"><span class="flow-step active"><strong>1</strong> Record</span><span class="flow-step ${speakingReview ? "active" : ""}"><strong>2</strong> Listen</span><span class="flow-step ${speakingReview?.listened ? "active" : ""}"><strong>3</strong> Submit</span><span class="flow-step ${speakingReview?.feedback ? "active" : ""}"><strong>4</strong> Feedback</span></div>
    <div class="ai-recorder recorder"><button class="record-button" data-record="${speakingRecordingId}" type="button" aria-label="Start speaking coach recording">${icon("mic")}</button><div><strong data-record-status="${speakingRecordingId}">${recordings.has(speakingRecordingId) ? "Recording ready. Listen back." : "Ready to record"}</strong><small>Uploaded only when you submit.</small></div></div>
    <audio data-playback="${speakingRecordingId}" controls ${recordings.has(speakingRecordingId) ? "" : "hidden"}></audio>
    <button class="button primary ai-speaking-submit" id="ai-speaking-submit" type="button" ${speakingReview?.listened ? "" : "disabled"}>${icon("send")} Submit for pronunciation check</button>
    <div id="ai-speaking-feedback" role="status" aria-live="polite" aria-atomic="true">${pronunciationFeedbackHtml(speakingReview?.feedback)}</div>
  </section>` : "";
  $("#app").innerHTML = `${pageHeader("Your AI subject expert", "Wehel Tutor — English", `Teacher and tutor support for Unit ${course.unit.unitNo}: ${escapeHtml(course.unit.unitTitle)}.`, "Wehel Tutor · Ehel Academy AI")}
    <div class="ai-layout">
      <section class="ai-main panel">
        <div class="ai-modes" role="tablist" aria-label="Choose AI English mode">${aiModes.map(([id, modeIcon, label]) => `<button class="ai-mode ${aiState.mode === id ? "active" : ""}" data-ai-mode="${id}" type="button" role="tab" aria-selected="${aiState.mode === id}">${icon(modeIcon)}<span>${label}</span></button>`).join("")}</div>
        <div class="ai-conversation" id="ai-conversation" aria-live="polite">${aiState.messages.map((item, index) => `<article class="ai-message ${item.role}"><span>${item.role === "assistant" ? (item.offline ? "Wehel Tutor (offline hint)" : "Wehel Tutor") : "You"}</span><p>${escapeHtml(item.text)}</p><div class="ai-message-tools"><button data-ai-listen="${index}" type="button" aria-label="Listen to ${item.role === "assistant" ? "Wehel Tutor's answer" : "your question"} with ElevenLabs">${icon("volume-2")} Listen</button>${item.role === "assistant" ? `<small>${icon("book-check")} ${gradeLabel} Unit ${course.unit.unitNo}</small>` : ""}</div></article>`).join("")}</div>
        <div class="ai-prompts">${prompts.map((prompt) => `<button data-ai-prompt="${escapeHtml(prompt)}" type="button">${escapeHtml(prompt)}</button>`).join("")}</div>
        ${speakingTools}
        <form class="ai-compose" id="ai-form"><label class="sr-only" for="ai-input">Ask Wehel Tutor</label><textarea id="ai-input" rows="2" maxlength="500" placeholder="Type your question or your sentence..."></textarea>${speechRecognitionCtor() ? `<button class="button secondary" id="ai-mic" type="button" aria-label="Ask by voice" title="Ask by voice">${wehelIcon("mic")}</button>` : ""}<button class="button primary" type="submit">${icon("send")} Send</button></form>
      </section>
      <aside class="ai-side section-stack">
        <section class="panel ai-focus"><span class="eyebrow">Today’s focus</span><h2>${escapeHtml(course.outcomes[0]?.learningOutcome || course.unit.unitTitle)}</h2><p><strong>${course.dictionaryLinks.length}</strong> unit words · <strong>${course.readings.length}</strong> texts · <strong>${course.grammar.length}</strong> grammar practices</p></section>
        <section class="panel"><h3>Learning boundaries</h3><ul class="checklist"><li>${icon("lightbulb")} Hints before answers</li><li>${icon("book-check")} Approved unit content first</li><li>${icon("shield-check")} Quiz choices stay yours</li><li>${icon("user-round-check")} Teacher support when needed</li></ul></section>
        <button class="button secondary" id="clear-ai" type="button">${icon("rotate-ccw")} Start a new conversation</button>
      </aside>
    </div>`;
  $$('[data-ai-mode]').forEach((button) => button.addEventListener("click", () => { aiState.mode = button.dataset.aiMode; saveAIState(); renderAIEnglish(); icons(); }));
  $$('[data-ai-prompt]').forEach((button) => button.addEventListener("click", () => submitAIMessage(button.dataset.aiPrompt)));
  $$('[data-ai-listen]').forEach((button) => button.addEventListener("click", () => playAIMessage(Number(button.dataset.aiListen), button)));
  $("#ai-form").addEventListener("submit", (event) => { event.preventDefault(); const input = $("#ai-input"); if (input.value.trim()) submitAIMessage(input.value); });
  const aiMic = $("#ai-mic");
  if (aiMic) aiMic.addEventListener("click", async () => {
    if (aiMic.disabled) return;
    stopBrowserSpeech(); // never transcribe the tutor's own voice
    const input = $("#ai-input");
    aiMic.disabled = true;
    aiMic.classList.add("loading");
    toast("Listening — speak now.");
    try {
      const text = await recognizeSpeech({ onInterim: (interim) => { input.value = interim; } });
      if (text) { input.value = ""; submitAIMessage(text); }
      else toast("I didn't hear anything — try again.");
    } catch (error) {
      toast(error.message === "not-allowed"
        ? "The microphone is blocked for this page."
        : "Voice input is unavailable right now — you can type instead.");
    } finally {
      aiMic.disabled = false;
      aiMic.classList.remove("loading");
    }
  });
  $("#clear-ai").addEventListener("click", () => { aiState.messages = []; aiState.interactions = 0; saveAIState(); renderAIEnglish(); icons(); });
  const recordButton = $(`[data-record="${speakingRecordingId}"]`);
  if (recordButton) {
    const playback = $(`[data-playback="${speakingRecordingId}"]`);
    const savedRecording = recordings.get(speakingRecordingId);
    if (savedRecording) playback.src = savedRecording.url;
    recordButton.addEventListener("click", () => toggleRecording(speakingRecordingId, recordButton));
    playback.addEventListener("recordingready", () => {
      $("#ai-speaking-submit").disabled = true;
      $("#ai-speaking-feedback").innerHTML = "";
    });
    playback.addEventListener("ended", () => {
      const review = speakingReviewState.get(speakingRecordingId) || { feedback: null };
      review.listened = true;
      speakingReviewState.set(speakingRecordingId, review);
      $("#ai-speaking-submit").disabled = false;
      toast("Recording reviewed. It is ready to submit.");
    });
    $("#ai-speaking-submit").addEventListener("click", (event) => submitSpeakingRecording(speakingRecordingId, speakingTarget, event.currentTarget));
    $("#ai-speaking-task").addEventListener("change", (event) => { aiState.speakingTaskIndex = Number(event.target.value); saveAIState(); renderAIEnglish(); icons(); });
    if (speakingTask.audio?.available) $("#ai-speaking-model").addEventListener("click", (event) => playAudio(speakingTask.audio.source, { rate: AI_NARRATION_RATE, button: event.currentTarget }));
  }
  requestAnimationFrame(() => { const conversation = $("#ai-conversation"); conversation.scrollTop = conversation.scrollHeight; });
}

async function submitAIMessage(message) {
  aiState.messages.push({ role: "user", text: message.trim() });
  aiState.interactions += 1;
  // Wehel answers asynchronously; the placeholder bubble keeps the transcript
  // shape stable so a mid-flight re-render or reload never loses the question.
  const pending = { role: "assistant", text: "…thinking" };
  aiState.messages.push(pending);
  saveAIState();
  renderAIEnglish();
  icons();
  try {
    pending.text = await askWehel({
      meta: {
        subject: "english", subjectLabel: "English", grade: gradeNumber,
        cambridgeCode: cambridgeLabel(gradeNumber),
        unitNo: course.unit.unitNo, unitTitle: course.unit.unitTitle,
        courseOutline: outlineFromManifest(manifest), unit: course,
      },
      messages: aiState.messages.filter((item) => item !== pending),
      mode: aiState.mode,
      fetchUnit: unitFetcher(manifest, dataRootUrl),
    });
  } catch (error) {
    // Offline or unconfigured: fall back to the built-in unit guidance — and
    // say so. An unlabelled canned reply reads as a very bad AI answer.
    pending.text = buildAIReply(message, aiState.mode);
    pending.offline = true;
    toast("Wehel is offline right now — showing built-in unit guidance instead.");
  }
  saveAIState();
  if (aiState.interactions >= 3 && !progress.completed.includes("ai")) complete("ai");
  renderAIEnglish();
  icons();
  // Read the reply aloud with the browser voice while sound is on.
  if (audioEnabled && browserSpeechSupported) {
    speakBrowser(pending.text, { rate: speechRateForGrade(gradeNumber) });
  }
}

function ebookAsset(book, filename) {
  const asset = new URL(`./ebooks/${book.id}/${filename}`, document.baseURI);
  if (/\.(?:webp|png|jpe?g)$/i.test(filename)) asset.searchParams.set("v", "illustration-crop-20260715b");
  return asset.href;
}

function openEbookReadAloud(book) {
  const readerWindow = window.open("", "_blank", "popup=yes,width=1100,height=860,resizable=yes,scrollbars=yes");
  if (!readerWindow) {
    toast("Allow pop-ups to open the eBook read-aloud window.");
    return;
  }

  const firstPage = book.pages[0];
  readerWindow.document.open();
  readerWindow.document.write(`<!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${escapeHtml(book.title)} | Ehel Academy Read-Aloud</title>
      <style>
        :root { color-scheme: light; --ink:#17324d; --teal:#0f766e; --gold:#f4c95d; --coral:#e76f51; --line:#dce4ea; --muted:#64748b; }
        * { box-sizing:border-box; }
        body { margin:0; color:var(--ink); background:#eef3f5; font-family:Inter,Aptos,"Segoe UI",sans-serif; letter-spacing:0; }
        button,audio { font:inherit; }
        button:focus-visible,audio:focus-visible { outline:3px solid rgba(45,108,223,.35); outline-offset:2px; }
        header { min-height:82px; display:flex; align-items:center; justify-content:space-between; gap:18px; padding:16px 24px; border-bottom:1px solid var(--line); background:white; }
        header div { min-width:0; }
        header span { color:var(--teal); font-size:12px; font-weight:800; text-transform:uppercase; }
        h1 { margin:4px 0 0; font:700 31px/1.1 Georgia,serif; letter-spacing:0; }
        .status { flex:none; padding:8px 11px; border-radius:99px; color:#0b5f59; background:#dff3ef; font-size:12px; font-weight:800; }
        main { width:min(1050px,100%); margin:0 auto; padding:22px; }
        .reader { overflow:hidden; border:1px solid #cbd7df; border-radius:8px; background:white; box-shadow:0 10px 30px rgba(23,50,77,.09); }
        .progress { height:7px; background:#dbe4e9; }
        .progress span { display:block; height:100%; background:var(--coral); transition:width .25s ease; }
        .toolbar { min-height:64px; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:10px 18px; background:#f7fafb; }
        .toolbar strong { font-size:14px; }
        audio { width:min(460px,60vw); height:42px; }
        figure { margin:0; padding:18px 18px 0; background:#eef3f5; }
        figure img { width:100%; max-height:600px; display:block; object-fit:contain; background:white; box-shadow:0 8px 24px rgba(23,50,77,.12); }
        .copy { margin:0 18px; padding:20px clamp(20px,5vw,48px); border:1px solid var(--line); border-top:0; background:#fffdf7; }
        .copy span { color:var(--teal); font-size:11px; font-weight:850; text-transform:uppercase; }
        .copy p { margin:7px 0 0; font:700 clamp(21px,3vw,29px)/1.5 Georgia,serif; letter-spacing:0; }
        .controls { min-height:72px; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; padding:14px 18px; border-top:1px solid var(--line); }
        .controls button,.start { min-height:42px; padding:9px 15px; border:1px solid var(--line); border-radius:6px; color:var(--ink); background:white; font-weight:750; cursor:pointer; }
        .controls button:first-child { justify-self:start; }
        .controls button:last-child { justify-self:end; }
        .start { color:white; border-color:var(--teal); background:var(--teal); }
        .start[hidden] { display:none; }
        footer { padding:16px 22px; color:#41566a; background:#e5ecef; font-size:12px; line-height:1.5; }
        footer p { margin:5px 0 0; }
        @media (max-width:680px) {
          header { align-items:flex-start; flex-direction:column; padding:14px 16px; }
          main { padding:10px; }
          .toolbar { align-items:flex-start; flex-direction:column; }
          audio { width:100%; }
          figure { padding:10px 10px 0; }
          .copy { margin:0 10px; padding:18px; }
          .controls { grid-template-columns:1fr 1fr; }
          .controls .start { grid-column:1/-1; grid-row:1; }
        }
      </style>
    </head>
    <body>
      <header><div><span>${escapeHtml(book.level)} · Ehel Academy read-aloud</span><h1>${escapeHtml(book.title)}</h1></div><div class="status" id="reader-status" role="status" aria-live="polite">Preparing ElevenLabs voice</div></header>
      <main><article class="reader" aria-label="${escapeHtml(book.title)}">
        <div class="progress" role="progressbar" aria-label="Book progress" aria-valuemin="1" aria-valuemax="${book.pages.length}" aria-valuenow="1"><span></span></div>
        <div class="toolbar"><strong id="page-count">Page 1 of ${book.pages.length}</strong><audio id="reader-audio" controls preload="auto" aria-label="ElevenLabs book narration"></audio></div>
        <figure><img id="page-image" src="${ebookAsset(book, firstPage.image)}" alt="${escapeHtml(firstPage.alt)}"></figure>
        <section class="copy"><span>Read along</span><p id="page-text">${escapeHtml(firstPage.text)}</p></section>
        <div class="controls"><button id="previous-page" type="button" disabled>← Previous page</button><button class="start" id="start-audio" type="button" hidden>▶ Start narration</button><button id="next-page" type="button">Next page →</button></div>
        <footer><strong>Book credit</strong><p>${escapeHtml(book.attribution)}</p></footer>
      </article></main>
    </body>
    </html>`);
  readerWindow.document.close();

  const readerDocument = readerWindow.document;
  const audio = readerDocument.querySelector("#reader-audio");
  const status = readerDocument.querySelector("#reader-status");
  const startButton = readerDocument.querySelector("#start-audio");
  let pageIndex = 0;
  let playbackToken = 0;

  const drawPage = () => {
    const page = book.pages[pageIndex];
    readerDocument.querySelector("#page-image").src = ebookAsset(book, page.image);
    readerDocument.querySelector("#page-image").alt = page.alt;
    readerDocument.querySelector("#page-text").textContent = page.text;
    readerDocument.querySelector("#page-count").textContent = `Page ${pageIndex + 1} of ${book.pages.length}`;
    const progressBar = readerDocument.querySelector(".progress");
    progressBar.setAttribute("aria-valuenow", String(pageIndex + 1));
    progressBar.querySelector("span").style.width = `${((pageIndex + 1) / book.pages.length) * 100}%`;
    readerDocument.querySelector("#previous-page").disabled = pageIndex === 0;
    readerDocument.querySelector("#next-page").disabled = pageIndex === book.pages.length - 1;
    readerWindow.document.title = `${book.title} · Page ${pageIndex + 1}`;
  };

  const waitForPlayback = async (source, token) => {
    audio.src = source;
    audio.playbackRate = AI_NARRATION_RATE;
    audio.defaultPlaybackRate = AI_NARRATION_RATE;
    const finished = new Promise((resolve) => {
      audio.addEventListener("ended", resolve, { once: true });
      audio.addEventListener("error", resolve, { once: true });
    });
    try {
      await audio.play();
    } catch {
      if (token !== playbackToken || readerWindow.closed) return;
      startButton.hidden = false;
      status.textContent = "Press Start narration";
      await new Promise((resolve) => {
        startButton.onclick = async () => {
          startButton.hidden = true;
          status.textContent = "Playing ElevenLabs voice";
          try { await audio.play(); } catch { status.textContent = "Press Play in the audio controls"; }
          resolve();
        };
      });
    }
    await finished;
  };

  const playFromPage = async (startIndex) => {
    const token = ++playbackToken;
    audio.pause();
    pageIndex = Math.max(0, Math.min(startIndex, book.pages.length - 1));
    for (; pageIndex < book.pages.length; pageIndex += 1) {
      if (token !== playbackToken || readerWindow.closed) return;
      drawPage();
      status.textContent = "Preparing ElevenLabs voice";
      try {
        const source = await aiVoiceUrl(book.pages[pageIndex].text);
        if (token !== playbackToken || readerWindow.closed) return;
        status.textContent = "Playing ElevenLabs voice";
        await waitForPlayback(source, token);
      } catch {
        status.textContent = "Narration is unavailable. Try again.";
        return;
      }
    }
    pageIndex = book.pages.length - 1;
    drawPage();
    status.textContent = "Book complete";
  };

  readerDocument.querySelector("#previous-page").addEventListener("click", () => playFromPage(pageIndex - 1));
  readerDocument.querySelector("#next-page").addEventListener("click", () => playFromPage(pageIndex + 1));
  readerWindow.addEventListener("beforeunload", () => { playbackToken += 1; audio.pause(); });
  drawPage();
  playFromPage(0);
}

function renderEbooks() {
  ebookWatchActive = false;
  ebookWatchToken += 1;
  const gradeEbooks = ebookCatalog.filter((item) => item.grades.includes(gradeNumber) && (!item.units || item.units.includes(unitNumber)));
  if (!gradeEbooks.length) {
    $("#app").innerHTML = `${pageHeader("Independent reading library", "Books", `Grade ${gradeNumber} illustrated books for this unit will appear here as they are approved.`, "Library being prepared")}
      <section class="panel empty-library"><span>${icon("library-big")}</span><h2>Your Unit ${unitNumber} shelf</h2><p>There are no approved eBooks for this unit yet. Each unit gets its own story - keep learning!</p></section>`;
    return;
  }
  const book = gradeEbooks.find((item) => item.id === activeEbookId) || gradeEbooks[0];
  activeEbookId = book.id;
  activeEbookPage = Math.max(0, Math.min(activeEbookPage, book.pages.length - 1));

  currentPageNarration = `Books. ${book.title}. ${book.description}`;
  $("#app").innerHTML = `<header class="page-header books-header"><div><span class="eyebrow">Independent reading library</span><h1>Books</h1></div>
      <div class="books-header-side">
      <button class="button secondary" id="listen-whole-ebook" type="button">${icon("audio-lines")} Listen to whole book</button>
      <div class="course-ebook-shelfbar">
        <button class="course-ebook-shelf-title course-ebook-shelf-chip" id="shelf-toggle" type="button" aria-expanded="false" aria-controls="shelf-pop">${icon("library-big")}<div><strong>My shelf</strong><small>${gradeEbooks.length} ${gradeEbooks.length === 1 ? "book" : "books"} · tap to browse</small></div>${icon("chevron-down")}</button>
        <nav class="course-ebook-shelf-pop" id="shelf-pop" hidden aria-label="Book library">
          ${gradeEbooks.map((item) => `<button class="course-ebook-book ${item.id === book.id ? "active" : ""}" data-ebook="${item.id}" type="button" aria-current="${item.id === book.id ? "page" : "false"}"><img src="${ebookAsset(item, item.pages[0].image)}" alt=""><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.level)} · Illustrated story</small></span>${icon("chevron-right")}</button>`).join("")}
        </nav>
      </div>
      </div></header>
    <div class="course-ebook-layout compact">
      <section class="course-ebook-reader" aria-label="${escapeHtml(book.title)} eBook reader">
        <header class="course-ebook-header">
          <div><span class="eyebrow">${escapeHtml(book.level)} · recommended for early readers</span><h2>${escapeHtml(book.title)}</h2><p>${escapeHtml(book.description)}</p></div>
          <div class="course-ebook-header-actions">
            <button class="button primary" id="watch-ebook" type="button" aria-label="Watch the story: narrated pages that turn by themselves">${icon("play")} Watch the story</button>
            <span class="course-ebook-pagecount" id="ebook-page-count" aria-live="polite"></span>
          </div>
        </header>
        <div id="course-ebook-page"></div>
      </section>
    </div>`;

  const drawPage = (shouldFocus = false) => {
    stopAudio();
    const page = book.pages[activeEbookPage];
    const isLastPage = activeEbookPage === book.pages.length - 1;
    $("#course-ebook-page").innerHTML = `<div class="course-ebook-progress" role="progressbar" aria-label="Book progress" aria-valuemin="1" aria-valuemax="${book.pages.length}" aria-valuenow="${activeEbookPage + 1}" aria-valuetext="Page ${activeEbookPage + 1} of ${book.pages.length}"><span style="width:${((activeEbookPage + 1) / book.pages.length) * 100}%"></span></div>
      <button class="sr-only" id="listen-ebook-page" type="button" tabindex="-1" aria-hidden="true">Narration</button>
      <figure class="course-ebook-illustration" id="ebook-stage">
        <button class="course-ebook-nav prev" id="previous-ebook-page" type="button" aria-label="Previous page" ${activeEbookPage === 0 ? "disabled" : ""}>${icon("chevron-left")}</button>
        <img src="${ebookAsset(book, page.image)}" alt="${escapeHtml(page.alt)}">
        <button class="course-ebook-nav next" id="next-ebook-page" type="button" aria-label="Next page" ${isLastPage ? "disabled" : ""}>${icon("chevron-right")}</button>
        <figcaption class="sr-only">Original illustration by ${escapeHtml(book.illustrator)}.</figcaption>
      </figure>
      <div class="course-ebook-transcript" aria-live="polite"><div class="course-ebook-transcript-head"><span>Read along</span><h3 tabindex="-1">Page ${activeEbookPage + 1}</h3></div><p>${escapeHtml(page.text)}</p></div>
      ${isLastPage ? `<div class="course-ebook-controls"><button class="button gold" id="finish-ebook" type="button">${icon("check")} Finish book</button></div>` : ""}`;

    const stage = $("#ebook-stage");
    if (stage && /\.svg$/i.test(page.image)) {
      const pageAtRequest = activeEbookPage;
      fetch(ebookAsset(book, page.image))
        .then((response) => (response.ok ? response.text() : Promise.reject(new Error("illustration fetch failed"))))
        .then((markup) => {
          if (activeEbookPage !== pageAtRequest || !stage.isConnected) return;
          const svg = new DOMParser().parseFromString(markup, "image/svg+xml").documentElement;
          if (!svg || svg.nodeName.toLowerCase() !== "svg") return;
          svg.setAttribute("role", "img");
          svg.setAttribute("aria-label", page.alt);
          svg.classList.add("course-ebook-stage-svg");
          stage.querySelector("img")?.replaceWith(svg);
          svg.addEventListener("pointerdown", (event) => {
            const target = event.target.closest?.("[data-tap]");
            if (!target) return;
            playTapSound(target.dataset.tap, target.dataset.mood);
            target.classList.remove("tap-play");
            void target.getBoundingClientRect();
            target.classList.add("tap-play");
            const clearTap = () => target.classList.remove("tap-play");
            target.addEventListener("animationend", function clear(ended) {
              if (ended.target !== target) return;
              clearTap();
              target.removeEventListener("animationend", clear);
            });
            setTimeout(clearTap, 1400);
          });
        })
        .catch(() => {});
    }
    const pageCount = $("#ebook-page-count");
    if (pageCount) pageCount.innerHTML = `Page <strong>${activeEbookPage + 1}</strong> of ${book.pages.length}`;
    $("#listen-ebook-page").addEventListener("click", async (event) => {
      if (ebookWatchActive) { stopEbookWatch(); return; }
      const listenButton = event.currentTarget;
      if (activeAudioButton === listenButton) { playPageNarration(listenButton, page.text); return; }
      await playStorySound(page.sound);
      if (listenButton.isConnected) playPageNarration(listenButton, page.text);
    });
    $("#previous-ebook-page").addEventListener("click", () => { stopEbookWatch({ keepFullscreen: true }); activeEbookPage -= 1; drawPage(true); });
    $("#next-ebook-page").addEventListener("click", () => { stopEbookWatch({ keepFullscreen: true }); activeEbookPage += 1; drawPage(true); });
    if ($("#finish-ebook")) $("#finish-ebook").addEventListener("click", () => { stopEbookWatch(); complete("ebooks", `${book.title} complete. Well read!`); });
    icons();
    if (shouldFocus) focusDynamicContent(".course-ebook-transcript h3", `Page ${activeEbookPage + 1} of ${book.pages.length}. ${page.text}`);
  };

  const runWatch = async () => {
    if (ebookWatchActive) { stopEbookWatch(); return; }
    if (!audioEnabled) return toast("Sound is muted. Use the sound button in the header to turn it on.");
    ebookWatchActive = true;
    const token = ++ebookWatchToken;
    const watchButton = $("#watch-ebook");
    watchButton.classList.add("watching");
    watchButton.innerHTML = `${icon("square")} Stop watching`;
    watchButton.setAttribute("aria-label", "Stop watching the story");
    icons();
    const readerElement = $(".course-ebook-reader");
    if (readerElement?.requestFullscreen && !document.fullscreenElement) {
      readerElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    }
    $("#ebook-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
    while (ebookWatchActive && ebookWatchToken === token) {
      if (!$("#course-ebook-page")) break;
      drawPage();
      const pageButton = $("#listen-ebook-page");
      if (!pageButton) break;
      await playStorySound(book.pages[activeEbookPage].sound);
      if (!ebookWatchActive || ebookWatchToken !== token) return;
      const narrated = await playPageNarration(pageButton, book.pages[activeEbookPage].text);
      if (!ebookWatchActive || ebookWatchToken !== token) return;
      if (!narrated) break;
      if (activeEbookPage >= book.pages.length - 1) {
        stopEbookWatch();
        drawPage();
        complete("ebooks", `${book.title} complete. Well watched!`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 900));
      if (!ebookWatchActive || ebookWatchToken !== token) return;
      activeEbookPage += 1;
    }
    if (ebookWatchActive && ebookWatchToken === token) stopEbookWatch();
  };
  $("#watch-ebook").addEventListener("click", runWatch);
  const shelfToggle = $("#shelf-toggle");
  const shelfPop = $("#shelf-pop");
  shelfToggle.addEventListener("click", () => {
    const open = shelfPop.hidden;
    shelfPop.hidden = !open;
    shelfToggle.setAttribute("aria-expanded", String(open));
  });
  [$(".books-header"), $(".course-ebook-layout")].forEach((zone) => zone && zone.addEventListener("click", (event) => {
    if (!shelfPop.hidden && !event.target.closest(".course-ebook-shelfbar")) {
      shelfPop.hidden = true;
      shelfToggle.setAttribute("aria-expanded", "false");
    }
  }));
  $("#listen-whole-ebook").addEventListener("click", () => { stopEbookWatch(); openEbookReadAloud(book); });
  $$('[data-ebook]').forEach((button) => button.addEventListener("click", () => {
    stopEbookWatch();
    activeEbookId = button.dataset.ebook;
    activeEbookPage = 0;
    const selectedBook = gradeEbooks.find((item) => item.id === activeEbookId);
    renderEbooks();
    focusDynamicContent(".course-ebook-header h2", `${selectedBook?.title || "Book"} selected.`);
  }));
  drawPage();
}

function renderLive() {
  $("#app").innerHTML = `${pageHeader("Learn with your teacher", "Live sessions", "Bring your self-paced work and one question. Your teacher will help you practise, receive feedback and improve.")}<div class="live-grid">${course.liveSessions.map((session) => `<article class="panel live-card"><time>Session ${session.sessionNo} · ${session.durationMin} minutes</time><h2>${escapeHtml(session.title)}</h2><h3>Before class</h3><p>${escapeHtml(session.beforeSession)}</p><h3>Class plan</h3><ol class="agenda">${session.agenda.split(";").map((item) => `<li>${escapeHtml(item.trim())}</li>`).join("")}</ol><h3>After class</h3><p>${escapeHtml(session.afterSession)}</p><button class="button primary" data-live-ready="${session.liveSessionId}" type="button">${icon("calendar-check")} I'm ready</button></article>`).join("")}</div>`;
  $$('[data-live-ready]').forEach((button) => button.addEventListener("click", () => { button.innerHTML = `${icon("check-circle")} Ready for class`; button.disabled = true; icons(); toast("Your live-session preparation is marked ready."); }));
}

function renderReflect() {
  $("#app").innerHTML = `${pageHeader("Pause and reflect", "My progress", "Choose the statement that best describes what you can do today. Honest reflection helps your teacher support you.")}<section class="panel"><div class="self-list">${course.selfAssessment.map((item) => `<div class="self-row"><strong>${escapeHtml(item.statement)}</strong>${item.scale.split(" | ").map((choice) => `<button class="self-choice ${progress.self[item.selfAssessmentId] === choice ? "selected" : ""}" data-self="${item.selfAssessmentId}" data-choice="${choice}" type="button">${choice}</button>`).join("")}</div>`).join("")}</div><p><button class="button primary" id="reflection-done" type="button">Save reflection ${icon("check")}</button></p></section>`;
  $$('[data-self]').forEach((button) => button.addEventListener("click", () => { progress.self[button.dataset.self] = button.dataset.choice; saveProgress(); renderReflect(); icons(); }));
  $("#reflection-done").addEventListener("click", () => {
    if (Object.keys(progress.self).length < course.selfAssessment.length) return toast("Choose one response for every statement.");
    complete("reflect", "Reflection saved. Your teacher can now see where you need help.");
  });
}

function finalQuizTeacherPanel() {
  if (unitNumber !== 10 || !finalAssessment) return "";
  const latest = finalQuizProgress.attempts[finalQuizProgress.attempts.length - 1];
  if (!latest) return `<section class="panel"><span class="eyebrow">Course-level assessment</span><h2>Final course quiz</h2><p>No submitted attempt is stored on this device yet. The assessment contains ${finalAssessment.questionCount} questions, carries ${finalAssessment.totalMarks} marks and uses an ${finalAssessment.passPercent}% mastery threshold.</p></section>`;
  return `<section class="panel"><span class="eyebrow">Course-level assessment</span><h2>Latest final quiz result</h2><div class="teacher-assessment-summary"><div><strong>${latest.percent}%</strong><span>${latest.score}/${latest.total} marks</span></div><div><strong>${latest.passed ? "Mastery" : "Review"}</strong><span>Attempt ${latest.attempt} of ${finalQuizProgress.attempts.length}</span></div><div><strong>${new Date(latest.submittedAt).toLocaleDateString()}</strong><span>Latest submission</span></div></div><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Curriculum area</th><th>Score</th><th>Percent</th><th>Teaching response</th></tr></thead><tbody>${latest.areaScores.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${item.score}/${item.total}</td><td>${item.percent}%</td><td>${item.percent >= finalAssessment.passPercent ? "Secure: extend through independent application." : "Review the linked source Units and reassess."}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function gamesTeacherPanel() {
  if (!gamePack) return "";
  const rows = gamePack.games.map((game) => {
    const saved = gameProgress(game.id);
    const percent = Math.round((saved.bestScore / game.rounds.length) * 100);
    return `<tr><td>${escapeHtml(game.title)}</td><td>${escapeHtml(game.skill)}</td><td>${saved.bestScore}/${game.rounds.length}</td><td>${saved.attempts}</td><td>${saved.xp}</td><td>${saved.bestScore >= gamePack.masteryScore ? "Mastered" : saved.attempts ? "Review" : "Not started"}</td></tr>`;
  }).join("");
  return `<section class="panel"><span class="eyebrow">Gamified practice</span><h2>Game mastery</h2><p>Best scores and attempts saved for this learner on this device.</p><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Game</th><th>Skill</th><th>Best</th><th>Attempts</th><th>XP</th><th>Teaching response</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function renderTeacher() {
  const assignment = course.assignments[0];
  $("#app").innerHTML = `${pageHeader("Teacher view", `Unit ${course.unit.unitNo} teaching resources`, "Implementation view for lesson delivery, assessment evidence and curriculum alignment.", "AI-assisted review · sign-off pending")}
    <div class="section-stack">
      <section class="panel approval-banner"><h2>Curriculum status</h2><p><strong>${escapeHtml(cambridgeLabel(gradeNumber))}.</strong> Content, progression and assessment guidance follow this framework. AI-assisted content review complete — human curriculum sign-off pending.</p></section>
      <section class="panel teacher-banner"><h2>${escapeHtml(assignment.title)}</h2><p>${escapeHtml(assignment.instructions)}</p><p><strong>${assignment.marks} marks</strong> · ${escapeHtml(assignment.submissionType)} · Rubrics: ${escapeHtml(assignment.rubricIds)}</p></section>
      <section class="panel"><h2>Outcome alignment</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>ID</th><th>Learning outcome</th><th>Evidence</th></tr></thead><tbody>${course.outcomes.map((outcome) => `<tr><td>${escapeHtml(outcome.outcomeId.split("-").pop())}</td><td>${escapeHtml(outcome.learningOutcome)}</td><td>${escapeHtml(outcome.evidenceOfLearning)}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><h2>Teaching notes</h2>${course.teacherNotes.map((note) => `<details><summary>${escapeHtml(note.noteType)}</summary><p class="reading-text" style="font-family:inherit;font-size:14px">${escapeHtml(note.note)}</p></details>`).join("")}</section>
      ${gamesTeacherPanel()}
      ${finalQuizTeacherPanel()}
      <section class="panel"><h2>Answer key and guidance</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Content</th><th>Type</th><th>Reviewed answer or guidance</th></tr></thead><tbody>${course.answerKey.map((answer) => `<tr><td>${escapeHtml(answer.contentId)}</td><td>${escapeHtml(answer.contentType)}</td><td>${escapeHtml(answer.answerOrGuidance)}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><h2>Rubric criteria</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Target</th><th>Criterion</th><th>Beginning</th><th>Secure</th><th>Marks</th></tr></thead><tbody>${course.rubrics.map((rubric) => `<tr><td>${escapeHtml(rubric.target)}</td><td>${escapeHtml(rubric.criterion)}</td><td>${escapeHtml(rubric.level1)}</td><td>${escapeHtml(rubric.level4)}</td><td>${rubric.maximumMarks}</td></tr>`).join("")}</tbody></table></div></section>
    </div>`;
}
// ===================== stores + config + boot =====================
// The two English-only stores load here (their load fns are hoisted above).
const finalQuizProgress = loadFinalQuizProgress();
const placementProgress = loadPlacementProgress();
const aiState = loadAIState();

const config = {
  subjectKey: "english",
  param: "grade",
  mediaSubject: "english",
  ttsPurpose: "ehel_english",
  disableShellVoice: true, // English runs its own audio engine (file-based + TTS/STT)
  defaultUnit: (g) => (Number(g) === 1 ? 0 : 1),
  sections,
  nonCountable: ["overview", "live", "final-quiz"],
  gradeSections: [],
  progressDefaults: { completed: [], knownWords: [], self: {}, writing: {}, games: {} },
  gradeDefaults: { completed: [] },
  keys: (g, u) => ({ progress: `ehel-english-g${g}-u${u}-progress-v1` }),
  courseKey: (g) => `ehel-eng-g${String(g).padStart(2, "0")}`,
  extendSummary: (p, base) => ({ ...base, knownWords: p.knownWords ? [...p.knownWords] : undefined }),
  visibleSections: () => visibleSections().map(([id, ic, lb]) => (id === "lecture" && unitNumber === 10 ? [id, ic, "Capstone launch"] : [id, ic, lb])),
  isSectionDone: (id) => (id === "final-quiz" ? finalQuizProgress.completed : id === "placement" ? placementProgress.completed : progress.completed.includes(id)),
  onNavigate: () => stopAudio(),
  onBeforeRender: () => { route = shellCtx.route; stopAudio(); document.body.classList.remove("gc-full"); $("#app").setAttribute("aria-busy", "true"); },
  onAfterRender: () => { $("#app").setAttribute("aria-busy", "false"); prepareScreenReaderView(); icons(); },
  onNavRendered: () => icons(),
  renderers: {
    overview: () => (isPrereqUnit ? renderPrereqOverview() : renderOverview()),
    placement: () => renderPlacementExam(),
    lecture: () => renderLecture(),
    ai: () => renderAIEnglish(),
    dictionary: () => renderDictionary(),
    reading: () => renderReading(),
    comprehension: () => renderComprehension(),
    grammar: () => renderGrammar(),
    speaking: () => renderSpeaking(),
    writing: () => renderWriting(),
    activities: () => renderActivities(),
    games: () => renderGames(),
    quiz: () => renderQuiz(),
    ebooks: () => renderEbooks(),
    live: () => renderLive(),
    reflect: () => renderReflect(),
    "final-quiz": () => renderFinalQuiz(),
    teacher: () => (isPrereqUnit ? renderPrereqTeacher() : renderTeacher()),
  },
  bind,
  wehelOptions,
  async load(ctx) {
    if (isPrereqUnit) {
      const [manifestResponse, placementResponse] = await Promise.all([
        fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
        fetch(new URL("placement-exam.json", ctx.dataRootUrl)),
      ]);
      const failed = [manifestResponse, placementResponse].find((response) => !response.ok);
      if (failed) throw new Error(`Course data could not be loaded (${failed.status} ${failed.url}).`);
      [manifest, placementExam] = await Promise.all([manifestResponse.json(), placementResponse.json()]);
      // Synthetic course shell: just enough for the shared chrome (labels,
      // screen-reader announcements) — no unit.json exists for unit -1.
      course = {
        grade: manifest.grade,
        subject: manifest.subject,
        term: { label: "Before you begin" },
        unit: { unitNo: "P", unitTitle: placementExam.shortTitle || "Prerequisite" },
        visual: {},
      };
      return { manifest, course };
    }
    const [manifestResponse, courseResponse, dictionaryResponse, finalAssessmentResponse, lectureMediaResponse] = await Promise.all([
      fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
      fetch(new URL(`units/unit-${unitNumber}.json`, ctx.dataRootUrl)),
      fetch(new URL(`master-dictionary.grade${gradeNumber}.json`, ctx.dataRootUrl)),
      fetch(new URL("course-final-quiz.json", ctx.dataRootUrl)),
      fetch(new URL("lecture-media.json", ctx.dataRootUrl)),
    ]);
    const failedResponse = [manifestResponse, courseResponse, dictionaryResponse, finalAssessmentResponse].find((response) => !response.ok);
    if (failedResponse) throw new Error(`Course data could not be loaded (${failedResponse.status} ${failedResponse.url}).`);
    [manifest, course, dictionary, finalAssessment] = await Promise.all([manifestResponse.json(), courseResponse.json(), dictionaryResponse.json(), finalAssessmentResponse.json()]);
    const gameResponse = await fetch(new URL(`games/unit-${unitNumber}.json`, ctx.dataRootUrl));
    if (!gameResponse.ok) throw new Error(`Game data could not be loaded (${gameResponse.status}).`);
    gamePack = await gameResponse.json();
    if (lectureMediaResponse.ok) {
      const lectureMedia = await lectureMediaResponse.json();
      Object.assign(course.visual, lectureMedia.units?.[String(unitNumber)] || {});
    }
    resolveGradeAssets(course);
    resolveGradeAssets(dictionary);
    resolveGradeAssets(finalAssessment);
    return { manifest, course };
  },
  async onReady(ctx) {
    // Lecture-version cache-bust: a re-recorded lecture resets its completion.
    if (course.visual.lectureVersion) {
      const versionKey = `${STORAGE_KEY}-lecture-version`;
      if (localStorage.getItem(versionKey) !== course.visual.lectureVersion) {
        ctx.progress.completed = ctx.progress.completed.filter((section) => section !== "lecture");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx.progress));
        localStorage.setItem(versionKey, course.visual.lectureVersion);
      }
    }
    if (location.hash.slice(1) === "final-quiz" && unitNumber !== 10) location.hash = "overview";
    if (location.hash.slice(1) === "games" && !gamePack) location.hash = "overview";
    if (isPrereqUnit && !["overview", "placement", "teacher"].includes(location.hash.slice(1))) location.hash = "overview";
    if (!isPrereqUnit && location.hash.slice(1) === "placement") location.hash = "overview";
    document.title = isPrereqUnit
      ? `${gradeLabel} English | Prerequisite: ${placementExam.title}`
      : `${gradeLabel} English | Unit ${course.unit.unitNo}: ${course.unit.unitTitle}`;
    $("#course-label").textContent = `${course.grade.label} · ${course.subject} · ${course.term.label}`;
    $("#unit-title").textContent = course.unit.unitTitle;
    $("#grade-select").innerHTML = Array.from({ length: 8 }, (_, index) => index + 1).map((grade) => `<option value="${grade}" ${grade === gradeNumber ? "selected" : ""}>Grade ${grade}</option>`).join("");
    $("#grade-select").addEventListener("change", (event) => { location.href = gradeLocation(event.target.value); });
    const unitOptions = [
      `<option value="${PREREQ_UNIT}" ${isPrereqUnit ? "selected" : ""}>Prerequisite: Placement exam</option>`,
      ...manifest.units.map((unit) => `<option value="${unit.number}" ${unit.number === unitNumber ? "selected" : ""}>Unit ${unit.number}: ${escapeHtml(unit.title)}</option>`),
    ].join("");
    for (const picker of [$("#unit-select"), $("#top-unit-select")]) {
      picker.innerHTML = unitOptions;
      picker.addEventListener("change", (event) => { location.href = courseLocation(event.target.value); });
    }
    // English-only listeners (the shell handles teacher-switch + hashchange).
    $("#sound-toggle").addEventListener("click", () => {
      audioEnabled = !audioEnabled;
      $("#sound-toggle").innerHTML = icon(audioEnabled ? "volume-2" : "volume-x");
      $("#sound-toggle").setAttribute("aria-label", audioEnabled ? "Mute sound" : "Turn on sound");
      if (!audioEnabled) stopAudio();
      icons(); toast(audioEnabled ? "Sound is on." : "Sound is muted.");
    });
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page-voice]");
      if (button) playPageNarration(button);
    });
  },
};

createCourseApp(config);
