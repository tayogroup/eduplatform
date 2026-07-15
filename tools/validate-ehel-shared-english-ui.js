const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const englishRoot = path.join(root, "src", "prototypes", "ehel-academy", "english");
const sharedRoot = path.join(englishRoot, "shared");
const rootIndex = fs.readFileSync(path.join(englishRoot, "index.html"), "utf8");
const sharedUi = fs.readFileSync(path.join(sharedRoot, "course-ui.js"), "utf8");
const sharedCss = fs.readFileSync(path.join(sharedRoot, "course-ui.css"), "utf8");
const redirect = fs.readFileSync(path.join(sharedRoot, "grade-redirect.js"), "utf8");
const templateConfig = JSON.parse(fs.readFileSync(path.join(englishRoot, "template-v1.2", "neutral-template-config.json"), "utf8"));
const viteConfig = fs.readFileSync(path.join(root, "vite.config.js"), "utf8");

if (!rootIndex.includes('id="grade-select"')) throw new Error("Canonical English page is missing grade-aware controls.");
if (!rootIndex.includes("./shared/course-ui.js") || !rootIndex.includes("./shared/course-ui.css")) throw new Error("Canonical English page is not connected to the shared assets.");
for (const marker of ["gradeNumber", "gradeLabel", "master-dictionary.grade${gradeNumber}.json", "renderAIEnglish", "renderGames", "renderEbooks", "ebookCatalog", "Listen to whole book", "readingBodyHtml", "ebook-reader", "data-reading-step", "ElevenLabs · ${audioMode}", "prepareReadingNarration", "mountReadingAudioPlayer", "ebook-reading-audio", "readingVoiceSources.has(reading.readingId)", "submitSpeakingRecording", "AI_TTS_ENDPOINT", "AI_STT_ENDPOINT", "prepareNarrationText", "document.createTextNode(\"\\n\")", "clean.split(/\\n{2,}/)", "maximum = 620", "AI_NARRATION_RATE = 0.90"]) {
  if (!sharedUi.includes(marker)) throw new Error(`Shared English UI is missing ${marker}.`);
}
if (!/\[\"quiz\"[^]*\[\"ebooks\"[^]*\[\"live\"/.test(sharedUi)) throw new Error("eBooks must appear between Quiz and Live sessions.");
for (const bookId of ["smile-please", "too-big-too-small", "musas-muddy-stripes", "bheema-the-sleepyhead"]) {
  if (!sharedUi.includes(`id: "${bookId}"`)) throw new Error(`${bookId} is missing from the eBook catalog.`);
}
if (!viteConfig.includes("prepareVoiceText(payload.text)") || !templateConfig.audioPolicy.linePausePolicy) throw new Error("English narration does not enforce pauses at line boundaries.");
if (templateConfig.audioPolicy.playbackRate !== 0.9 || templateConfig.audioPolicy.playbackRateScope !== "All ElevenLabs voice audio" || templateConfig.audioPolicy.alternativeSlowPlaybackEnabled !== false) throw new Error("All English ElevenLabs audio must use the single 0.90 playback rate.");
if (!sharedUi.includes("lectureVideo.defaultPlaybackRate = AI_NARRATION_RATE") || sharedUi.includes('data-rate="1"') || /(?:0?\.78|slowPlaybackRate|Listen slowly|>\s*Slow\s*<\/)/.test(sharedUi)) throw new Error("A shared English ElevenLabs path is not using the single 0.90 playback rate.");
if (!sharedCss.includes(".ai-speaking-coach") || !sharedCss.includes(".top-grade-picker") || !sharedCss.includes(".ebook-page") || !sharedCss.includes(".ebook-library") || !sharedCss.includes(".course-ebook-reader")) throw new Error("Shared English CSS is missing required shared controls.");
for (const marker of ["announceScreenReader", "prepareScreenReaderView", "focusDynamicContent", "aria-valuetext", "aria-current=", "aria-atomic=\"true\""]) {
  if (!sharedUi.includes(marker)) throw new Error(`Shared English screen-reader support is missing ${marker}.`);
}
if (!rootIndex.includes('id="sr-announcer"') || !rootIndex.includes('aria-busy="true"') || !sharedCss.includes(".sr-only")) throw new Error("Shared English screen-reader infrastructure is incomplete.");
if (!redirect.includes("location.replace") || !redirect.includes("target.searchParams.set(\"grade\"")) throw new Error("Grade compatibility redirect is incomplete.");

let modules = 0;
let vocabularyLinks = 0;
let lectureVideos = 0;
let capstoneLaunches = 0;
let gamePacks = 0;
let educationalGames = 0;
let gameChallenges = 0;
const requiredLectureVoice = "XfNU2rGpBa01ckF309OY";
for (const book of [
  { id: "smile-please", pages: 12 },
  { id: "too-big-too-small", pages: 14 },
  { id: "musas-muddy-stripes", pages: 12 },
  { id: "bheema-the-sleepyhead", pages: 8 },
]) {
  const ebookRoot = path.join(englishRoot, "ebooks", book.id);
  for (let page = 1; page <= book.pages; page += 1) {
    const image = path.join(ebookRoot, `page-${String(page).padStart(2, "0")}.webp`);
    if (!fs.existsSync(image) || fs.statSync(image).size < 15_000) throw new Error(`${book.id} page ${page} illustration is missing.`);
  }
  for (const asset of ["original.pdf", "ATTRIBUTION.txt"]) {
    if (!fs.existsSync(path.join(ebookRoot, asset))) throw new Error(`${book.id} ${asset} is missing.`);
  }
}
for (let grade = 1; grade <= 8; grade += 1) {
  const gradeRoot = path.join(englishRoot, `grade-${grade}`);
  for (const obsolete of ["course-ui.js", "course-ui.css"]) {
    if (fs.existsSync(path.join(gradeRoot, obsolete))) throw new Error(`Grade ${grade} still has an obsolete ${obsolete}.`);
  }
  const index = fs.readFileSync(path.join(gradeRoot, "index.html"), "utf8");
  if (!index.includes(`data-grade="${grade}"`) || !index.includes("../shared/grade-redirect.js")) throw new Error(`Grade ${grade} compatibility page is invalid.`);
  const dataRoot = path.join(gradeRoot, "data");
  const manifest = JSON.parse(fs.readFileSync(path.join(dataRoot, "course-manifest.json"), "utf8"));
  const lectureManifest = JSON.parse(fs.readFileSync(path.join(dataRoot, "lecture-media.json"), "utf8"));
  const dictionary = JSON.parse(fs.readFileSync(path.join(dataRoot, `master-dictionary.grade${grade}.json`), "utf8"));
  const finalQuiz = JSON.parse(fs.readFileSync(path.join(dataRoot, "course-final-quiz.json"), "utf8"));
  const ids = new Set(dictionary.entries.map((entry) => entry.dictionaryEntryId));
  const expectedDefault = grade === 1 ? 0 : 1;
  if (manifest.defaultUnit !== expectedDefault || manifest.units[0].number !== expectedDefault || manifest.units.at(-1).number !== 10) throw new Error(`Grade ${grade} unit routing is invalid.`);
  if (finalQuiz.questions.length !== 30 || finalQuiz.passPercent !== 80) throw new Error(`Grade ${grade} final assessment is invalid.`);
  for (const summary of manifest.units) {
    const unitPath = path.join(dataRoot, "units", `unit-${summary.number}.json`);
    const unit = JSON.parse(fs.readFileSync(unitPath, "utf8"));
    const games = JSON.parse(fs.readFileSync(path.join(dataRoot, "games", `unit-${summary.number}.json`), "utf8"));
    const gameTypes = new Set(games.games.map((game) => game.type));
    const gameIds = new Set(games.games.map((game) => game.id));
    if (games.grade !== grade || games.unit !== summary.number || games.games.length !== 12 || gameIds.size !== 12 || games.games.some((game) => game.rounds.length !== 3)) throw new Error(`Grade ${grade} Unit ${summary.number} game pack is incomplete.`);
    for (const type of ["choice", "spelling", "sentence", "speaking", "sequence", "pairs"]) if (!gameTypes.has(type)) throw new Error(`Grade ${grade} Unit ${summary.number} is missing the ${type} game engine.`);
    for (const game of games.games) {
      for (const round of game.rounds) {
        if (!round.prompt) throw new Error(`Grade ${grade} Unit ${summary.number} ${game.id} has an empty prompt.`);
        if (game.type === "choice" && (!Array.isArray(round.choices) || round.choices.length < 3 || !round.choices.includes(round.answer))) throw new Error(`Grade ${grade} Unit ${summary.number} ${game.id} has an invalid choice round.`);
        if (game.type === "spelling" && !/^[a-z]{3,}$/i.test(round.answer)) throw new Error(`Grade ${grade} Unit ${summary.number} has an invalid spelling round.`);
        if (["sentence", "sequence"].includes(game.type) && (!Array.isArray(round.tokens) || round.tokens.join(" ") === round.answer)) throw new Error(`Grade ${grade} Unit ${summary.number} has an unshuffled ordering round.`);
        if (game.type === "speaking" && !round.target) throw new Error(`Grade ${grade} Unit ${summary.number} has an empty speaking target.`);
        if (game.type === "pairs" && (!Array.isArray(round.pairs) || round.pairs.length !== 3 || round.pairs.some((pair) => pair.length !== 2))) throw new Error(`Grade ${grade} Unit ${summary.number} has an invalid matching round.`);
      }
    }
    gamePacks += 1;
    educationalGames += games.games.length;
    gameChallenges += games.games.reduce((total, game) => total + game.rounds.length, 0);
    if (unit.unit.unitNo !== summary.number || unit.speaking.length !== 6) throw new Error(`Grade ${grade} Unit ${summary.number} is not compatible with the shared UI.`);
    for (const link of unit.dictionaryLinks) {
      if (!ids.has(link.dictionaryEntryId)) throw new Error(`Grade ${grade} Unit ${summary.number} has an unresolved dictionary link.`);
    }
    const isCapstone = summary.reviewStatus.toLowerCase().includes("capstone");
    const lecture = { ...unit.visual, ...(lectureManifest.units[String(summary.number)] || {}) };
    if (isCapstone) {
      if (lecture.lectureMode !== "capstone-launch") throw new Error(`Grade ${grade} Unit ${summary.number} is missing its capstone launch mode.`);
      capstoneLaunches += 1;
    } else {
      if (!lecture.lectureVideo || !lecture.lecturePoster || !lecture.lectureCaptions) throw new Error(`Grade ${grade} Unit ${summary.number} is missing teacher lecture media.`);
      for (const [key, minimumBytes] of [["lectureVideo", 100_000], ["lecturePoster", 10_000], ["lectureCaptions", 20]]) {
        const asset = path.resolve(gradeRoot, lecture[key]);
        if (!fs.existsSync(asset) || fs.statSync(asset).size < minimumBytes) throw new Error(`Grade ${grade} Unit ${summary.number} has an invalid ${key}.`);
      }
      const captions = fs.readFileSync(path.resolve(gradeRoot, lecture.lectureCaptions), "utf8");
      if (!captions.startsWith("WEBVTT")) throw new Error(`Grade ${grade} Unit ${summary.number} captions are not valid WebVTT.`);
      if (lecture.lectureProvider && (lecture.lectureProvider !== "ElevenLabs" || lecture.lectureVoiceId !== requiredLectureVoice)) throw new Error(`Grade ${grade} Unit ${summary.number} does not use the approved ElevenLabs voice.`);
      lectureVideos += 1;
    }
    modules += 1;
    vocabularyLinks += unit.dictionaryLinks.length;
  }
}

console.log(JSON.stringify({ status: "PASS", sharedRuntimeFiles: 3, grades: 8, modules, lectureVideos, capstoneLaunches, gamePacks, educationalGames, gameChallenges, vocabularyLinks }, null, 2));
