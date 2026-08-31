// The Grades 1-4 Game Park.
//
// The games section shipped one presentation for all eight grades: a three-
// column grid of text cards, and inside each game a serif question over three
// white rectangles. That reads as a form. Seven of the twelve games in every
// unit are `type: "choice"`, so a six-year-old met the SAME white rectangles
// seven times and the section's whole promise — "play, practise, master" —
// arrived as a list. Owner, 2026-08-31: redo it for Grades 1 to 4.
//
// What is redone is the PRESENTATION and the INTERACTION. Not one question,
// answer, distractor or explanation moves: this module reads the same
// `games/unit-N.json` packs the old renderer read, so nothing is re-authored,
// re-billed or re-checked, and `check:english` sees the content it always saw.
//
// Four rules the build is held to, each from a scar already recorded in
// CLAUDE.md:
//
//  - GRADES 5-8 ARE UNTOUCHED. english.js keeps its original renderer and
//    routes to it unchanged above Grade 4; this module is never constructed
//    there. Every class here is `kg-*` and every rule lives in the stylesheet
//    this file injects, so no upper-stage page can match one even by accident.
//  - The section's PROGRESS CONTRACT is unchanged. bestScore / attempts / xp
//    per game, mastery at pack.masteryScore, "I have played them all", and
//    complete("games") when every game is mastered. A child's ticks must not
//    move because the paint did.
//  - No new asset, no new fetch, no paid voice. The pictures come from
//    word-pictures.js (already loaded), the characters are drawn here in SVG,
//    and the sound effects are synthesised with WebAudio — so a slow
//    connection loses none of it and nothing can 404.
//  - Motion is decoration, never information. `prefers-reduced-motion` stills
//    every animation and the game still says the same things; a correct answer
//    is announced in text, not only in confetti.
//
// The mechanics, by type. The old renderer drew four shapes; this draws six,
// and the three tap-only ones became things a hand does:
//
//   choice    a row of big picture cards that pop when chosen  (7 games/unit)
//   spelling  letter blocks DRAGGED into the word's slots
//   sentence  word tiles dragged onto a track, in order
//   sequence  the same track, ordering events rather than words
//   pairs     six cards that physically flip over
//   speaking  the recorder, inside a stage with a live microphone
//
// Drag is pointer-based (one code path for mouse, pen and finger) and every
// drag has a TAP equivalent that does the same thing, because drag is the
// interaction a child with a trackpad, a switch or a keyboard cannot perform.
// Nothing in here is reachable by drag alone.

const STYLE_ID = "kg-game-park-style";

// --------------------------------------------------------------- the worlds
// One world per game id: a badge, two colours and a line the host character
// says on the way in. The ids are the pack's own and have been stable across
// all 41 units of Grades 1-4; the handful of one-off ids in Grade 1 Unit 0 and
// Unit 1 (welcome-mission, pronoun-power, calendar-race …) fall through to the
// per-TYPE default below rather than showing an untitled grey card.
const WORLDS = {
  "meaning-match":    { badge: "🧩", a: "#ffeed2", b: "#c9761a", cheer: "Match the word to what it means!" },
  "picture-match":    { badge: "🖼️", a: "#ffeed2", b: "#c9761a", cheer: "Look at the picture and pick the word!" },
  "spelling-builder": { badge: "🔠", a: "#ffe0da", b: "#c04a33", cheer: "Drag the letters to build the word!" },
  "sentence-puzzle":  { badge: "🚂", a: "#dde9ff", b: "#2d6cdf", cheer: "Put the words in order to make a sentence!" },
  "language-choice":  { badge: "🎯", a: "#eee2ff", b: "#6b3fc4", cheer: "Which one sounds right? Take aim!" },
  "grammar-sort":     { badge: "🎯", a: "#eee2ff", b: "#6b3fc4", cheer: "Which one sounds right? Take aim!" },
  "pronoun-power":    { badge: "🎯", a: "#eee2ff", b: "#6b3fc4", cheer: "Which one sounds right? Take aim!" },
  "reading-detective":{ badge: "🔎", a: "#d7f0ec", b: "#0f766e", cheer: "Be a detective. Find the clue in the story!" },
  "speaking-quest":   { badge: "🎤", a: "#ffdcec", b: "#b02a68", cheer: "Your turn to speak. I am listening!" },
  "speaking-challenge":{ badge: "🎤", a: "#ffdcec", b: "#b02a68", cheer: "Your turn to speak. I am listening!" },
  "word-order-race":  { badge: "🏁", a: "#ffe4d2", b: "#c34c1c", cheer: "Ready, steady — put them in order!" },
  "calendar-race":    { badge: "🏁", a: "#ffe4d2", b: "#c34c1c", cheer: "Ready, steady — put them in order!" },
  "definition-dash":  { badge: "⚡", a: "#fff2c2", b: "#a1740a", cheer: "Quick! Which meaning is the right one?" },
  "colour-number-dash":{ badge: "⚡", a: "#fff2c2", b: "#a1740a", cheer: "Quick! Which one is the right one?" },
  "word-type-power":  { badge: "🦸", a: "#ddf4e1", b: "#1f7a53", cheer: "What kind of word is it? Use your power!" },
  "memory-pairs":     { badge: "🃏", a: "#d6f0fb", b: "#16759b", cheer: "Turn the cards over and find the pairs!" },
  "question-quest":   { badge: "🗺️", a: "#e6e2ff", b: "#4640b8", cheer: "Read the question and choose your path!" },
  "unit-mission":     { badge: "🚀", a: "#dde7f4", b: "#17324d", cheer: "The last mission. You know all of this!" },
  "welcome-mission":  { badge: "🚀", a: "#dde7f4", b: "#17324d", cheer: "The last mission. You know all of this!" },
};
const WORLD_BY_TYPE = {
  choice:   { badge: "🎯", a: "#eee2ff", b: "#6b3fc4", cheer: "Choose the one that is right!" },
  spelling: { badge: "🔠", a: "#ffe0da", b: "#c04a33", cheer: "Drag the letters to build the word!" },
  sentence: { badge: "🚂", a: "#dde9ff", b: "#2d6cdf", cheer: "Put the words in order!" },
  sequence: { badge: "🏁", a: "#ffe4d2", b: "#c34c1c", cheer: "Put them in the right order!" },
  pairs:    { badge: "🃏", a: "#d6f0fb", b: "#16759b", cheer: "Find the pairs!" },
  speaking: { badge: "🎤", a: "#ffdcec", b: "#b02a68", cheer: "Your turn to speak!" },
};
const worldOf = (game) => WORLDS[game.id] || WORLD_BY_TYPE[game.type] || WORLD_BY_TYPE.choice;

// The park behind the host: a sun and two rows of hills, drawn once and tinted
// by whichever world is on screen. Deliberately ONE piece of scenery rather
// than a set of floating shapes — three loose circles clipped by the panel's
// corners read as rendering artefacts rather than as sky, which is what the
// first build looked like.
const SCENE_SKY = `<svg class="kg-scene-sky" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <circle cx="548" cy="30" r="26" fill="#fff" opacity=".62"/>
  <circle cx="548" cy="30" r="40" fill="#fff" opacity=".26"/>
  <path d="M0 150 q80-34 156-8 q76 26 148-6 q78-34 154-4 q68 26 142 4 V200 H0Z" fill="#fff" opacity=".34"/>
  <path d="M0 174 q92-26 176-4 q84 22 160-6 q76-28 164 2 q54 18 100 10 V200 H0Z" fill="#fff" opacity=".55"/>
</svg>`;

// Praise is varied on purpose: the same four words after every right answer
// stop being praise by the third game of twelve.
const PRAISE = ["Yes!", "Brilliant!", "You got it!", "Well done!", "Perfect!", "Star earned!"];
const ENCOURAGE = ["Good try!", "Nearly!", "Have another look.", "Not quite — look again."];

// --------------------------------------------------------------- characters
// Pip, who hosts the park. Drawn here rather than imported: the ebook kit
// (tools/lib/ehel-ebook-kit*.js) is a Node build-time module and its cast
// belongs to the books. One character, four moods, no ids and no <defs> — the
// same discipline english-core-word-scenes.js keeps, for the same reason: two
// copies of this may share a document.
function pip(mood = "idle") {
  return `<svg class="kg-pip is-${mood}" viewBox="0 0 120 120" role="img" aria-hidden="true" focusable="false">
    <g class="kg-pip-body">
      <ellipse cx="60" cy="112" rx="26" ry="5" fill="#000" opacity=".10"/>
      <path class="kg-pip-wing kg-pip-wing-l" d="M28 62 q-16 8 -12 24 q12 4 20-10z" fill="#1f8f86"/>
      <path class="kg-pip-wing kg-pip-wing-r" d="M92 62 q16 8 12 24 q-12 4 -20-10z" fill="#1f8f86"/>
      <ellipse cx="60" cy="66" rx="34" ry="36" fill="#2fa8a0"/>
      <ellipse cx="60" cy="74" rx="22" ry="24" fill="#eaf7f5"/>
      <path d="M52 104 l-6 8 M68 104 l6 8" stroke="#e08a1f" stroke-width="5" stroke-linecap="round"/>
      <g class="kg-pip-head">
        <ellipse cx="60" cy="38" rx="30" ry="28" fill="#2fa8a0"/>
        <path d="M60 10 q10-8 14 2 q-8 2 -14 4z" fill="#f2a63b"/>
        <circle cx="49" cy="36" r="9" fill="#fff"/><circle cx="71" cy="36" r="9" fill="#fff"/>
        <g class="kg-pip-eyes">
          <circle class="kg-pip-eye" cx="50" cy="37" r="4.6" fill="#20303f"/>
          <circle class="kg-pip-eye" cx="72" cy="37" r="4.6" fill="#20303f"/>
        </g>
        <path class="kg-pip-beak" d="M54 46 h12 l-6 9z" fill="#f2a63b"/>
        <path class="kg-pip-brow" d="M42 25 q7-5 14-2 M78 25 q-7-5 -14-2" stroke="#20303f" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  </svg>`;
}

// ------------------------------------------------------------------- sound
// Synthesised, so there is nothing to download, nothing to deploy and nothing
// that can 404 into a silent game. Every call is wrapped: a browser that
// refuses the AudioContext must lose the garnish and keep the lesson.
function makeSound(isOn) {
  let ctx = null;
  const context = () => {
    if (ctx) return ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  };
  const tone = (freq, at, dur, type = "sine", peak = 0.13) => {
    const audio = context();
    if (!audio) return;
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + at;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + dur + 0.04);
  };
  const play = (notes) => {
    if (!isOn()) return;
    try { for (const note of notes) tone(...note); } catch { /* garnish only */ }
  };
  return {
    tap:     () => play([[620, 0, 0.06, "triangle", 0.07]]),
    lift:    () => play([[880, 0, 0.05, "sine", 0.05]]),
    drop:    () => play([[440, 0, 0.08, "sine", 0.08]]),
    correct: () => play([[523.25, 0, 0.18], [659.25, 0.08, 0.18], [783.99, 0.16, 0.30]]),
    wrong:   () => play([[233, 0, 0.14, "triangle", 0.09], [185, 0.12, 0.22, "triangle", 0.09]]),
    flip:    () => play([[520, 0, 0.05, "square", 0.05]]),
    match:   () => play([[659.25, 0, 0.14], [880, 0.09, 0.22]]),
    win:     () => play([[523.25, 0, 0.16], [659.25, 0.1, 0.16], [783.99, 0.2, 0.16], [1046.5, 0.3, 0.42]]),
  };
}

// ------------------------------------------------------------------ helpers
// Deterministic per (game, round) shuffle. Math.random would deal a different
// board every repaint, so a child who nudges the window mid-round would watch
// the cards rearrange themselves under their hand.
function shuffled(list, seed) {
  const out = list.slice();
  let state = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const seedOf = (text) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
};

export function createGameZone(api) {
  const {
    pack, unit, gradeLabel, icon, icons, escapeHtml, toast,
    wordPicture, soundOn, speak, progressFor, saveResult,
    sectionDone, finishSection, speakingPanel,
  } = api;

  const sfx = makeSound(soundOn);
  const still = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const host = () => document.getElementById("app");

  // A picture is shown only where word-pictures.js has an honest one for the
  // whole option. A multi-word option ("I am six years old.") is a sentence,
  // and the picture for its first word would be a picture of the wrong thing —
  // the exact failure word-pictures.js was written to stop.
  const pictureFor = (text) => {
    const word = String(text || "").trim().replace(/[.!?,;:"']/g, "");
    if (!word || /\s/.test(word)) return "";
    return wordPicture(word) || "";
  };

  let activeId = null;
  let roundIndex = 0;
  let score = 0;
  let streak = 0;
  let locked = false;

  // ------------------------------------------------------------------ style
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  // --------------------------------------------------------------- the park
  function render() {
    ensureStyle();
    if (activeId) return renderRound();
    renderPark();
  }

  function renderPark() {
    const games = pack.games;
    const played = games.filter((game) => progressFor(game.id).attempts > 0).length;
    const mastered = games.filter((game) => progressFor(game.id).bestScore >= pack.masteryScore).length;
    const stars = games.reduce((total, game) => total + progressFor(game.id).bestScore, 0);
    const starGoal = games.reduce((total, game) => total + game.rounds.length, 0);
    const xp = games.reduce((total, game) => total + progressFor(game.id).xp, 0);
    const done = sectionDone();
    const canFinish = !done && played === games.length;

    host().innerHTML = `<div class="kg kg-park${still() ? " kg-still" : ""}">
      <section class="kg-welcome">
        <div class="kg-welcome-pip">${pip("idle")}</div>
        <div class="kg-welcome-say">
          <span class="kg-eyebrow">Unit ${unit.no} · ${escapeHtml(unit.title)}</span>
          <h1>Game Park</h1>
          <p>${games.length} games to play. Every game gives you three chances to earn a star.</p>
          <div class="kg-jar">
            <div class="kg-jar-track"><span style="width:${starGoal ? Math.round((stars / starGoal) * 100) : 0}%"></span></div>
            <strong>★ ${stars} <span>of ${starGoal} stars</span></strong>
          </div>
          <div class="kg-counters">
            <span class="kg-counter"><b>${played}</b> played</span>
            <span class="kg-counter"><b>${mastered}</b> mastered</span>
            <span class="kg-counter"><b>${xp}</b> XP</span>
          </div>
          ${done
            ? `<p class="kg-finished">${icon("check")} You have finished this part. Keep playing for more stars.</p>`
            : canFinish
              ? `<button class="kg-finish" id="kg-finish" type="button">${icon("check")} I have played them all</button>`
              : `<p class="kg-note">Play every game once and you can finish this part — you do not have to master them all.</p>`}
        </div>
      </section>
      <ol class="kg-board">${games.map((game, index) => tileHtml(game, index)).join("")}</ol>
    </div>`;

    $$("[data-kg-play]").forEach((button) => button.addEventListener("click", () => {
      sfx.tap();
      start(button.dataset.kgPlay);
    }));
    $("#kg-finish")?.addEventListener("click", () => {
      sfx.win();
      finishSection(`All ${pack.games.length} games played. Well done!`);
      render();
    });
    icons();
  }

  function tileHtml(game, index) {
    const world = worldOf(game);
    const saved = progressFor(game.id);
    const mastered = saved.bestScore >= pack.masteryScore;
    const stars = game.rounds.map((_, star) => `<span class="${star < saved.bestScore ? "is-earned" : ""}">★</span>`).join("");
    return `<li class="kg-tile${mastered ? " is-mastered" : ""}${saved.attempts ? " is-played" : ""}" style="--kg-a:${world.a};--kg-b:${world.b}">
      <button class="kg-tile-face" data-kg-play="${escapeHtml(game.id)}" type="button">
        <span class="kg-tile-no">${index + 1}</span>
        ${mastered ? `<span class="kg-tile-flag" aria-label="Mastered">★</span>` : ""}
        <span class="kg-tile-badge" aria-hidden="true">${world.badge}</span>
        <span class="kg-tile-skill">${escapeHtml(game.skill)}</span>
        <span class="kg-tile-name">${escapeHtml(game.title)}</span>
        <span class="kg-tile-stars" aria-label="Best score ${saved.bestScore} out of ${game.rounds.length} stars">${stars}</span>
        <span class="kg-tile-go">${saved.attempts ? "Play again" : "Play"} <b aria-hidden="true">▶</b></span>
      </button>
    </li>`;
  }

  // ------------------------------------------------------------------- play
  function start(gameId) {
    activeId = gameId;
    roundIndex = 0;
    score = 0;
    streak = 0;
    render();
  }
  const currentGame = () => pack.games.find((game) => game.id === activeId);

  function renderRound() {
    const game = currentGame();
    if (!game) { activeId = null; return renderPark(); }
    if (roundIndex >= game.rounds.length) return renderResult(game);
    const round = game.rounds[roundIndex];
    const world = worldOf(game);
    locked = false;

    const pips = game.rounds.map((_, index) => {
      const state = index < roundIndex ? "is-done" : index === roundIndex ? "is-now" : "";
      return `<span class="kg-pip-dot ${state}"></span>`;
    }).join("");

    host().innerHTML = `<div class="kg kg-stage${still() ? " kg-still" : ""}" style="--kg-a:${world.a};--kg-b:${world.b}">
      <div class="kg-bar">
        <button class="kg-back" id="kg-back" type="button">${icon("arrow-left")} All games</button>
        <div class="kg-bar-mid">
          <span class="kg-bar-name" aria-hidden="true">${world.badge} ${escapeHtml(game.title)}</span>
          <div class="kg-pips" role="img" aria-label="Challenge ${roundIndex + 1} of ${game.rounds.length}">${pips}</div>
        </div>
        <div class="kg-scoreboard" id="kg-scoreboard"><b>★</b> <span id="kg-score">${score}</span></div>
      </div>

      <section class="kg-scene">
        ${SCENE_SKY}
        <div class="kg-host" id="kg-host">${pip("idle")}</div>
        <div class="kg-bubble">
          <p class="kg-ask">${escapeHtml(round.prompt)}</p>
          <div class="kg-scene-tools">
            <button class="kg-chip" id="kg-listen" type="button">${icon("volume-2")} Listen</button>
            <button class="kg-chip" id="kg-hint" type="button">${icon("lightbulb")} Hint</button>
          </div>
        </div>
      </section>

      ${game.passage ? `<div class="kg-evidence"><span>${icon("book-open")} Story clue</span><p>${escapeHtml(game.passage)}</p></div>` : ""}
      <div class="kg-play" id="kg-play">${playHtml(game, round)}</div>
      <div class="kg-feedback" id="kg-feedback" role="status" aria-live="polite" aria-atomic="true"></div>
    </div>`;

    $("#kg-back").addEventListener("click", () => { sfx.tap(); activeId = null; renderPark(); });
    $("#kg-listen").addEventListener("click", (event) => speak(`${round.prompt} ${round.clue || round.target || ""}`, event.currentTarget));
    $("#kg-hint").addEventListener("click", () => { mood("think"); toast(hintFor(game, round)); });

    if (game.type === "choice") bindChoice(game, round);
    else if (game.type === "spelling") bindSpelling(game, round);
    else if (game.type === "sentence" || game.type === "sequence") bindTrack(game, round);
    else if (game.type === "pairs") bindPairs(game, round);
    else if (game.type === "speaking") bindSpeaking(game, round);
    icons();
  }

  function hintFor(game, round) {
    if (round.clue) return round.clue;
    if (game.type === "spelling") return "Say the word slowly. Which sound comes first?";
    if (game.type === "sentence") return "Start with the word that has a capital letter. The full stop goes last.";
    if (game.type === "sequence") return "Which one happened first? Put that one at the front.";
    if (game.type === "pairs") return "Remember where you saw each card. Match one word with its meaning.";
    if (game.type === "speaking") return "Press Listen first, then say it the same way, one bit at a time.";
    if (game.id === "reading-detective") return "Look at the story clue again and find the part that answers it.";
    return "Say each answer out loud with the question. One of them fits.";
  }

  function mood(state) {
    const holder = $("#kg-host");
    if (!holder) return;
    holder.innerHTML = pip(state);
  }

  // ------------------------------------------------------------ type: choice
  function playHtml(game, round) {
    if (game.type === "choice") return choiceHtml(game, round);
    if (game.type === "spelling") return spellingHtml(round);
    if (game.type === "sentence" || game.type === "sequence") return trackHtml(game, round);
    if (game.type === "pairs") return pairsHtml(game, round);
    return speakingHtml(round);
  }

  // Three layouts, chosen by what the options ARE rather than by which game is
  // running. A row of single words wants to be a row of picture cards; four
  // sentences squeezed into four columns wrap to three lines each and read as a
  // wall, so those go two-up; anything genuinely long goes one per line.
  function choiceHtml(game, round) {
    const withPictures = round.choices.some((choice) => pictureFor(choice));
    const longest = Math.max(...round.choices.map((choice) => String(choice).length));
    const phrases = round.choices.some((choice) => /\s/.test(String(choice).trim()));
    const shape = withPictures ? " has-pictures" : longest > 34 ? " is-long" : phrases ? " is-phrases" : "";
    return `<div class="kg-choices${shape}">
      ${round.choices.map((choice, index) => {
        const picture = pictureFor(choice);
        // In a picture set, an option with no honest picture still reserves the
        // space one would take, so three cards stay the same height and the odd
        // one out does not read as broken. It gets NO stand-in glyph: guessing a
        // picture for "I" is precisely the failure word-pictures.js exists to
        // stop, and a placeholder icon is a guess with an apology attached.
        const pic = withPictures ? `<span class="kg-choice-pic" aria-hidden="true">${picture || ""}</span>` : "";
        return `<button class="kg-choice" data-kg-choice="${index}" type="button">
          ${pic}
          <span class="kg-choice-text">${escapeHtml(choice)}</span>
          <span class="kg-choice-mark" aria-hidden="true"></span>
        </button>`;
      }).join("")}
    </div>`;
  }

  function bindChoice(game, round) {
    $$("[data-kg-choice]").forEach((button) => button.addEventListener("click", () => {
      if (locked) return;
      const choice = round.choices[Number(button.dataset.kgChoice)];
      const right = choice === round.answer;
      button.classList.add(right ? "is-right" : "is-wrong");
      if (!right) {
        $$("[data-kg-choice]").find((item) => round.choices[Number(item.dataset.kgChoice)] === round.answer)?.classList.add("is-right", "is-answer");
      }
      $$("[data-kg-choice]").forEach((item) => { item.disabled = true; });
      settle(right, round.explanation, button);
    }));
  }

  // ---------------------------------------------------------- type: spelling
  // The word's own picture sits above the slots where a picture exists: at
  // Grade 1 the clue is a sentence a child may not yet read alone, and the
  // picture is the half of it they can.
  function spellingHtml(round) {
    const answer = String(round.answer);
    const letters = shuffled([...answer].map((letter, index) => ({ letter, index })), seedOf(answer));
    const picture = pictureFor(answer);
    return `<div class="kg-spell">
      ${picture ? `<div class="kg-spell-pic" aria-hidden="true">${picture}</div>` : ""}
      <p class="kg-clue">${escapeHtml(round.clue || "")}</p>
      <div class="kg-slots" id="kg-slots">${[...answer].map((_, index) => `<button class="kg-slot" data-kg-slot="${index}" type="button" aria-label="Letter ${index + 1}, empty"></button>`).join("")}</div>
      <div class="kg-bank" id="kg-bank">${letters.map((item, index) => `<button class="kg-block" data-kg-block="${index}" data-kg-value="${escapeHtml(item.letter)}" type="button">${escapeHtml(item.letter.toUpperCase())}</button>`).join("")}</div>
      <div class="kg-actions">
        <button class="kg-chip" id="kg-clear" type="button">${icon("rotate-ccw")} Start again</button>
        <button class="kg-go" id="kg-check" type="button">Check my word ${icon("check")}</button>
      </div>
    </div>`;
  }

  function bindSpelling(game, round) {
    const answer = String(round.answer);
    const slots = $$("[data-kg-slot]");
    const placed = new Array(answer.length).fill(null);

    const paint = () => {
      slots.forEach((slot, index) => {
        const value = placed[index];
        slot.textContent = value ? value.value.toUpperCase() : "";
        slot.classList.toggle("is-filled", Boolean(value));
        // The slots are BUTTONS, not decorated spans: pressing one takes its
        // letter back out, and that has to be reachable by keyboard too. A child
        // who cannot drag can tap a block to place it and tap a slot to undo —
        // the whole game, with no pointer gesture anywhere in it.
        slot.setAttribute("aria-label", value ? `Letter ${index + 1}, ${value.value.toUpperCase()} — press to take it back` : `Letter ${index + 1}, empty`);
      });
      $("#kg-check").disabled = placed.some((value) => value === null);
    };
    const firstEmpty = () => placed.findIndex((value) => value === null);

    const place = (block, slotIndex) => {
      if (slotIndex < 0 || slotIndex >= placed.length) return false;
      if (placed[slotIndex]) return false;
      placed[slotIndex] = { block, value: block.dataset.kgValue };
      block.classList.add("is-used");
      block.disabled = true;
      paint();
      sfx.drop();
      return true;
    };
    const lift = (slotIndex) => {
      const held = placed[slotIndex];
      if (!held) return;
      placed[slotIndex] = null;
      held.block.classList.remove("is-used");
      held.block.disabled = false;
      paint();
      sfx.lift();
    };

    $$("[data-kg-block]").forEach((block) => {
      block.addEventListener("click", () => { if (!locked) place(block, firstEmpty()); });
      makeDraggable(block, {
        enabled: () => !locked && !block.disabled,
        dropSelector: "[data-kg-slot]",
        onDrop: (target) => place(block, target ? Number(target.dataset.kgSlot) : firstEmpty()),
      });
    });
    slots.forEach((slot) => slot.addEventListener("click", () => { if (!locked) lift(Number(slot.dataset.kgSlot)); }));

    $("#kg-clear").addEventListener("click", () => { if (!locked) placed.forEach((_, index) => lift(index)); });
    $("#kg-check").addEventListener("click", () => {
      if (locked) return;
      const built = placed.map((item) => (item ? item.value : "")).join("");
      const right = built === answer;
      $("#kg-slots").classList.add(right ? "is-right" : "is-wrong");
      settle(right, right ? `You spelled ${answer}.` : `The word is ${answer}.`, $("#kg-slots"));
    });
    paint();
  }

  // ------------------------------------------------- type: sentence/sequence
  function trackHtml(game, round) {
    const tokens = shuffled(round.tokens.map((token, index) => ({ token, index })), seedOf(round.answer));
    const ordering = game.type === "sequence";
    return `<div class="kg-build">
      <div class="kg-track" id="kg-track" data-empty="${ordering ? "Drag the steps here, in order" : "Drag the words here to build the sentence"}"></div>
      <div class="kg-bank kg-bank-words" id="kg-bank">${tokens.map((item, index) => `<button class="kg-word" data-kg-word="${index}" data-kg-value="${escapeHtml(item.token)}" type="button">${escapeHtml(item.token)}</button>`).join("")}</div>
      <div class="kg-actions">
        <button class="kg-chip" id="kg-clear" type="button">${icon("rotate-ccw")} Start again</button>
        <button class="kg-go" id="kg-check" type="button">${ordering ? "Check the order" : "Check my sentence"} ${icon("check")}</button>
      </div>
    </div>`;
  }

  function bindTrack(game, round) {
    const track = $("#kg-track");
    const order = [];

    const paint = () => {
      track.innerHTML = order.map((word, position) => `<button class="kg-word is-placed" data-kg-placed="${position}" type="button">${escapeHtml(word.dataset.kgValue)}</button>`).join("");
      track.classList.toggle("is-empty", order.length === 0);
      $("#kg-check").disabled = order.length === 0;
      $$("[data-kg-placed]", track).forEach((chip) => chip.addEventListener("click", () => {
        if (locked) return;
        const [removed] = order.splice(Number(chip.dataset.kgPlaced), 1);
        removed.classList.remove("is-used");
        removed.disabled = false;
        paint();
        sfx.lift();
      }));
    };
    const add = (word, at = order.length) => {
      if (word.disabled) return;
      order.splice(Math.max(0, Math.min(at, order.length)), 0, word);
      word.classList.add("is-used");
      word.disabled = true;
      paint();
      sfx.drop();
    };

    $$("[data-kg-word]").forEach((word) => {
      word.addEventListener("click", () => { if (!locked) add(word); });
      makeDraggable(word, {
        enabled: () => !locked && !word.disabled,
        dropSelector: "#kg-track",
        onDrop: (target, point) => {
          if (!target) return add(word);
          // Dropped ON the track: work out which gap the pointer is nearest, so
          // a word can be pushed in between two that are already down rather
          // than only appended. Without this a child who places one word out of
          // order has to clear the whole track to fix it.
          const chips = $$("[data-kg-placed]", track);
          let at = chips.length;
          for (let index = 0; index < chips.length; index += 1) {
            const box = chips[index].getBoundingClientRect();
            if (point.x < box.left + box.width / 2) { at = index; break; }
          }
          add(word, at);
        },
      });
    });

    $("#kg-clear").addEventListener("click", () => {
      if (locked) return;
      for (const word of order) { word.classList.remove("is-used"); word.disabled = false; }
      order.length = 0;
      paint();
    });
    $("#kg-check").addEventListener("click", () => {
      if (locked) return;
      const built = order.map((word) => word.dataset.kgValue).join(" ");
      const right = built === round.answer;
      track.classList.add(right ? "is-right" : "is-wrong");
      settle(right, right ? "That is exactly right." : `It goes like this: ${round.answer}`, track);
    });
    paint();
  }

  // ------------------------------------------------------------- type: pairs
  function pairsHtml(game, round) {
    const tiles = round.pairs.flatMap((pair, pairIndex) => pair.map((text, side) => ({ text, pairIndex, side })));
    const board = shuffled(tiles, seedOf(`${game.id}-${roundIndex}-${round.pairs.length}`));
    return `<div class="kg-cards" id="kg-cards">
      ${board.map((tile, index) => {
        const picture = tile.side === 0 ? pictureFor(tile.text) : "";
        return `<button class="kg-card" data-kg-card="${index}" data-kg-pair="${tile.pairIndex}" type="button" aria-label="Card ${index + 1}, face down">
          <span class="kg-card-inner">
            <span class="kg-card-back" aria-hidden="true">?</span>
            <span class="kg-card-front">${picture ? `<b class="kg-card-pic">${picture}</b>` : ""}<span>${escapeHtml(tile.text)}</span></span>
          </span>
        </button>`;
      }).join("")}
    </div>
    <p class="kg-clue">Turn two cards over. Match every word with its meaning. No mistakes earns a star.</p>`;
  }

  function bindPairs(game, round) {
    let open = [];
    let matched = 0;
    let mistakes = 0;
    let busy = false;

    $$("[data-kg-card]").forEach((card) => card.addEventListener("click", () => {
      if (locked || busy || card.classList.contains("is-open") || card.classList.contains("is-matched")) return;
      card.classList.add("is-open");
      card.setAttribute("aria-label", `${card.querySelector(".kg-card-front").textContent}, face up`);
      sfx.flip();
      open.push(card);
      if (open.length < 2) return;
      const [first, second] = open;
      if (first.dataset.kgPair === second.dataset.kgPair) {
        first.classList.add("is-matched");
        second.classList.add("is-matched");
        open = [];
        matched += 1;
        sfx.match();
        if (matched === round.pairs.length) {
          const clean = mistakes === 0;
          settle(clean, clean ? "Perfect memory — every pair on the first try." : "All matched! Play again for a clean round and the star.", $("#kg-cards"));
        }
        return;
      }
      mistakes += 1;
      busy = true;
      first.classList.add("is-miss");
      second.classList.add("is-miss");
      sfx.wrong();
      setTimeout(() => {
        for (const item of [first, second]) {
          item.classList.remove("is-open", "is-miss");
          item.setAttribute("aria-label", "Card, face down");
        }
        open = [];
        busy = false;
        // Long enough to READ two cards. The first build turned them back after
        // 850ms, which is a fair reflex test and a poor memory game for a
        // six-year-old still sounding the words out.
      }, still() ? 600 : 1300);
    }));
  }

  // ---------------------------------------------------------- type: speaking
  // The recorder itself stays in english.js — it owns the MediaRecorder, the
  // saved blobs and the pronunciation endpoint. This draws the stage around it.
  let speakingBinder = null;
  function speakingHtml(round) {
    const panel = speakingPanel({
      recordingId: `game-speaking-${activeId}-${roundIndex}`,
      target: round.target,
      onResult: (ok) => settle(ok, ok ? "Your words came through clearly." : "Listen to the model once more, then try that phrase again."),
    });
    speakingBinder = panel.bind;
    return `<div class="kg-speak">
      <div class="kg-speak-target">
        <span>Say this</span>
        <p>${escapeHtml(round.target)}</p>
        <button class="kg-chip" id="kg-model" type="button">${icon("volume-2")} Hear it first</button>
      </div>
      <div class="kg-speak-panel">${panel.html}</div>
    </div>`;
  }
  function bindSpeaking(game, round) {
    $("#kg-model").addEventListener("click", (event) => speak(round.target, event.currentTarget));
    speakingBinder?.();
    speakingBinder = null;
  }

  // ------------------------------------------------------------ round result
  function settle(right, explanation, sourceEl) {
    if (locked) return;
    locked = true;
    if (right) { score += 1; streak += 1; } else { streak = 0; }
    const game = currentGame();
    const last = roundIndex + 1 === game.rounds.length;

    if (right) {
      sfx.correct();
      mood("cheer");
      celebrate(sourceEl);
      const value = $("#kg-score");
      if (value) {
        value.textContent = String(score);
        // Taken off again when it finishes: a class that stays put animates once
        // and then sits there, so the second and third stars of a game would
        // land in silence on a counter that had already used its one reaction.
        const board = $("#kg-scoreboard");
        board.classList.remove("is-bump");
        void board.offsetWidth;
        board.classList.add("is-bump");
        board.addEventListener("animationend", () => board.classList.remove("is-bump"), { once: true });
      }
    } else {
      sfx.wrong();
      mood("sad");
    }

    const praise = right ? PRAISE[(score + roundIndex) % PRAISE.length] : ENCOURAGE[roundIndex % ENCOURAGE.length];
    $("#kg-feedback").innerHTML = `<div class="kg-verdict ${right ? "is-good" : "is-try"}">
      <span class="kg-verdict-face" aria-hidden="true">${right ? "★" : "💡"}</span>
      <div>
        <strong>${praise}${right && streak >= 2 ? ` <em>${streak} in a row!</em>` : ""}</strong>
        <p>${escapeHtml(explanation || "Look at the clue once more and keep going.")}</p>
      </div>
      <button class="kg-go" id="kg-next" type="button">${last ? "See my stars" : "Next"} ${icon("arrow-right")}</button>
    </div>`;
    $("#kg-next").addEventListener("click", () => { roundIndex += 1; renderRound(); });
    $("#kg-next").focus({ preventScroll: true });
    icons();
  }

  // Twelve paper shapes falling from the top of the stage. Purely decorative:
  // the verdict above says the same thing in words, and reduced motion drops
  // this entirely rather than showing a still pile of confetti.
  function celebrate(sourceEl) {
    if (still()) return;
    const stage = $(".kg-stage");
    if (!stage) return;
    const layer = document.createElement("div");
    layer.className = "kg-confetti";
    layer.setAttribute("aria-hidden", "true");
    const box = stage.getBoundingClientRect();
    const from = sourceEl ? sourceEl.getBoundingClientRect() : box;
    // It bursts FROM the thing the child pressed. Anchored to the stage instead,
    // it rained down the whole page from somewhere above the title — motion with
    // no relationship to the action that caused it, which is noise rather than
    // celebration.
    const originX = ((from.left + from.width / 2) - box.left) / box.width * 100;
    layer.style.top = `${Math.max(0, from.top - box.top)}px`;
    const colours = ["#f2a63b", "#2fa8a0", "#e2504c", "#2d6cdf", "#8e6fc8", "#3f9c5c"];
    for (let index = 0; index < 14; index += 1) {
      const bit = document.createElement("i");
      bit.style.left = `${Math.max(2, Math.min(98, originX + (index - 7) * 5))}%`;
      bit.style.background = colours[index % colours.length];
      bit.style.animationDelay = `${index * 26}ms`;
      bit.style.setProperty("--kg-drift", `${(index % 5) * 12 - 24}px`);
      layer.appendChild(bit);
    }
    stage.appendChild(layer);
    setTimeout(() => layer.remove(), 1500);
  }

  // ------------------------------------------------------------ game result
  function renderResult(game) {
    const passed = score >= pack.masteryScore;
    const previous = progressFor(game.id);
    const bestScore = Math.max(previous.bestScore, score);
    const xp = Math.max(previous.xp, score * 20 + (passed ? 20 : 0));
    saveResult(game.id, { bestScore, attempts: previous.attempts + 1, xp });

    const mastered = pack.games.filter((item) => progressFor(item.id).bestScore >= pack.masteryScore).length;
    if (mastered === pack.games.length) finishSection(`All ${pack.games.length} games mastered. Brilliant work!`);

    const world = worldOf(game);
    if (passed) sfx.win(); else sfx.drop();

    host().innerHTML = `<div class="kg kg-stage${still() ? " kg-still" : ""}" style="--kg-a:${world.a};--kg-b:${world.b}">
      <section class="kg-result">
        <div class="kg-result-pip">${pip(passed ? "cheer" : "think")}</div>
        <span class="kg-eyebrow">${escapeHtml(game.title)}</span>
        <h1>${passed ? "You mastered it!" : "Nearly there!"}</h1>
        <div class="kg-result-stars" aria-label="${score} stars out of ${game.rounds.length}">
          ${game.rounds.map((_, index) => `<span class="${index < score ? "is-earned" : ""}" style="animation-delay:${index * 140}ms">★</span>`).join("")}
        </div>
        <p>${score} of ${game.rounds.length} stars, and ${score * 20 + (passed ? 20 : 0)} XP.${passed ? "" : ` You need ${pack.masteryScore} stars to master it — have another go.`}</p>
        <div class="kg-actions">
          <button class="kg-go" id="kg-again" type="button">${icon("rotate-ccw")} Play again</button>
          <button class="kg-chip kg-chip-big" id="kg-back" type="button">Choose another game ${icon("arrow-right")}</button>
        </div>
      </section>
    </div>`;
    $("#kg-again").addEventListener("click", () => start(game.id));
    $("#kg-back").addEventListener("click", () => { activeId = null; renderPark(); });
    icons();
  }

  // ---------------------------------------------------------------- dragging
  // One pointer path for mouse, pen and finger. It starts only after 5px of
  // travel, so a plain tap is still a click and every drag here has a tap that
  // does the same job — a child on a trackpad, a switch or a keyboard never
  // meets a control they cannot work.
  function makeDraggable(element, { enabled, dropSelector, onDrop }) {
    let ghost = null;
    let active = false;
    let startX = 0;
    let startY = 0;

    const targets = () => $$(dropSelector);
    const clearHover = () => targets().forEach((target) => target.classList.remove("is-hover"));

    element.addEventListener("pointerdown", (event) => {
      if (!enabled() || event.button > 0) return;
      startX = event.clientX;
      startY = event.clientY;
      element.setPointerCapture(event.pointerId);
    });

    element.addEventListener("pointermove", (event) => {
      if (!enabled() || !element.hasPointerCapture?.(event.pointerId)) return;
      if (!active) {
        if (Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY) < 5) return;
        active = true;
        element.classList.add("is-dragging");
        ghost = element.cloneNode(true);
        ghost.className = `${element.className} kg-ghost`;
        ghost.removeAttribute("data-kg-block");
        ghost.removeAttribute("data-kg-word");
        document.body.appendChild(ghost);
        sfx.lift();
      }
      event.preventDefault();
      ghost.style.left = `${event.clientX}px`;
      ghost.style.top = `${event.clientY}px`;
      const under = document.elementFromPoint(event.clientX, event.clientY);
      const target = under?.closest(dropSelector);
      clearHover();
      target?.classList.add("is-hover");
    });

    const finish = (event) => {
      if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (!active) return;
      active = false;
      element.classList.remove("is-dragging");
      ghost?.remove();
      ghost = null;
      const under = document.elementFromPoint(event.clientX, event.clientY);
      const target = under?.closest(dropSelector) || null;
      clearHover();
      // A drop into empty space is not a mistake to punish a five-year-old for:
      // the tile goes to the natural next place instead of snapping back.
      onDrop(target, { x: event.clientX, y: event.clientY });
    };
    element.addEventListener("pointerup", finish);
    element.addEventListener("pointercancel", (event) => {
      if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);
      active = false;
      element.classList.remove("is-dragging");
      ghost?.remove();
      ghost = null;
      clearHover();
    });
  }

  return { render, atPark: () => !activeId, leave: () => { activeId = null; } };
}

// ---------------------------------------------------------------- the styles
// Injected once rather than added to english/shared/course-ui.css. That file is
// @imported by all six subjects and bundled into every release as
// design-system.css, so a rule added there ships to Mathematics, Science,
// Computing, Global Perspectives and Intensive English and makes each of their
// bundles stale for a change none of them can use. Living beside the markup it
// styles, this cannot reach a page that does not draw a kg- node — which is
// every page at Grades 5-8.
const STYLE = `
.kg { --kg-a: #e7eef5; --kg-b: #17324d; --kg-ink: #17324d; --kg-round: 18px; }
.kg *, .kg *::before, .kg *::after { box-sizing: border-box; }
.kg button { font: inherit; color: inherit; cursor: pointer; }
.kg-eyebrow { color: var(--kg-b); font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }

/* ---------------------------------------------------------------- the park */
.kg-welcome { position: relative; margin-bottom: 22px; padding: 24px 26px; display: grid; grid-template-columns: 132px minmax(0, 1fr); align-items: center; gap: 20px; overflow: hidden;
  border-radius: 24px; background: linear-gradient(150deg, #fff6e2 0%, #dff3ef 52%, #e6edff 100%); box-shadow: 0 14px 34px rgba(23, 50, 77, .12); }
.kg-welcome::before { content: ""; position: absolute; inset: auto -80px -150px auto; width: 300px; height: 300px; border-radius: 50%; background: rgba(255, 255, 255, .28); }
.kg-welcome-pip { position: relative; }
.kg-welcome-pip svg { width: 100%; height: auto; }
.kg-welcome-say { position: relative; }
.kg-welcome h1 { margin: 4px 0 6px; font: 700 40px/1.05 var(--font-serif); color: #17324d; }
.kg-welcome p { margin: 0; max-width: 52ch; color: #3d5163; font-size: 16px; line-height: 1.5; }
.kg-jar { margin: 14px 0 10px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.kg-jar-track { flex: 1 1 220px; height: 16px; border-radius: 999px; background: rgba(23, 50, 77, .1); overflow: hidden; }
.kg-jar-track span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #f2a63b, #e2504c); transition: width .5s cubic-bezier(.2,.8,.3,1); }
.kg-jar strong { color: #a86a00; font-size: 20px; font-weight: 700; white-space: nowrap; }
.kg-jar strong span { color: #5d6b80; font-size: 14px; font-weight: 600; }
.kg-counters { display: flex; flex-wrap: wrap; gap: 8px; }
.kg-counter { padding: 6px 12px; border-radius: 999px; background: rgba(255, 255, 255, .8); color: #3d5163; font-size: 14px; font-weight: 600; }
.kg-counter b { color: #17324d; font-size: 16px; }
.kg-note { margin: 12px 0 0 !important; color: #5d6b80 !important; font-size: 14px !important; }
.kg-finished { margin: 12px 0 0 !important; display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; background: #dff3ef; color: #0b5f59 !important; font-weight: 600; font-size: 15px !important; }
.kg-finish { margin-top: 14px; padding: 13px 22px; display: inline-flex; align-items: center; gap: 9px; border: 0; border-radius: 999px; background: #f2a63b; color: #3b2500; font-size: 17px; font-weight: 700; box-shadow: 0 6px 0 #c9821f; }
.kg-finish:hover { transform: translateY(-2px); box-shadow: 0 8px 0 #c9821f; }
.kg-finish:active { transform: translateY(3px); box-shadow: 0 2px 0 #c9821f; }

.kg-board { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; }
.kg-tile { display: flex; }
.kg-tile-face { position: relative; width: 100%; padding: 18px 16px 16px; display: grid; justify-items: center; gap: 4px; overflow: hidden;
  border: 0; border-radius: var(--kg-round); background: linear-gradient(165deg, var(--kg-a), #fff 78%);
  box-shadow: 0 8px 0 rgba(0,0,0,.07), 0 14px 26px rgba(23,50,77,.10); text-align: center;
  transition: transform .16s ease, box-shadow .16s ease; }
.kg-tile-face::before { content: ""; position: absolute; inset: 0 0 auto; height: 6px; background: var(--kg-b); }
.kg-tile-face:hover { transform: translateY(-4px); box-shadow: 0 12px 0 rgba(0,0,0,.07), 0 20px 34px rgba(23,50,77,.16); }
.kg-tile-face:active { transform: translateY(1px); }
.kg-tile-face:focus-visible { outline: 3px solid var(--kg-b); outline-offset: 3px; }
.kg-tile-no { position: absolute; top: 12px; left: 12px; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; background: rgba(255,255,255,.85); color: #5d6b80; font-size: 13px; font-weight: 700; }
.kg-tile-flag { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: #f2a63b; color: #fff; font-size: 16px; }
.kg-tile-badge { font-size: 46px; line-height: 1.1; filter: drop-shadow(0 4px 5px rgba(0,0,0,.16)); }
.kg-tile-skill { color: var(--kg-b); font-size: 11px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
.kg-tile-name { color: #17324d; font: 700 20px/1.2 var(--font-serif); }
.kg-tile-stars { margin: 4px 0 2px; display: flex; gap: 3px; font-size: 19px; color: #cbd5dd; }
.kg-tile-stars .is-earned { color: #f2a63b; }
.kg-tile-go { margin-top: 4px; padding: 9px 18px; display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; background: var(--kg-b); color: #fff; font-size: 15px; font-weight: 700; }
.kg-tile.is-mastered .kg-tile-face { background: linear-gradient(165deg, var(--kg-a), #f4fbf6 78%); }

/* --------------------------------------------------------------- the stage */
.kg-stage { position: relative; max-width: 900px; margin: 0 auto; }
.kg-bar { margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.kg-back { padding: 9px 16px; display: inline-flex; align-items: center; gap: 7px; border: 0; border-radius: 999px; background: #fff; color: #17324d; font-size: 15px; font-weight: 600; box-shadow: 0 3px 10px rgba(23,50,77,.12); }
.kg-back:hover { background: var(--kg-a); }
.kg-bar-mid { display: grid; justify-items: center; gap: 6px; }
.kg-bar-name { color: var(--kg-b); font-size: 15px; font-weight: 700; }
.kg-pips { display: flex; gap: 7px; }
.kg-pip-dot { width: 13px; height: 13px; border-radius: 50%; background: rgba(23,50,77,.16); }
.kg-pip-dot.is-done { background: var(--kg-b); }
.kg-pip-dot.is-now { background: #f2a63b; box-shadow: 0 0 0 4px rgba(242,166,59,.28); }
.kg-scoreboard { padding: 8px 16px; display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; background: #fff7e6; color: #a86a00; font-size: 19px; font-weight: 700; box-shadow: inset 0 0 0 2px #ffe3ab; }
.kg-scoreboard.is-bump { animation: kg-bump .5s cubic-bezier(.2,1.4,.4,1); }
@keyframes kg-bump { 0% { transform: scale(1); } 40% { transform: scale(1.22) rotate(-3deg); } 100% { transform: scale(1); } }

.kg-scene { position: relative; padding: 20px 22px; display: grid; grid-template-columns: 108px minmax(0, 1fr); align-items: center; gap: 16px; overflow: hidden;
  border-radius: 24px 24px 8px 8px; background: linear-gradient(170deg, var(--kg-a), #fff); box-shadow: 0 10px 26px rgba(23,50,77,.10); }
.kg-scene-sky { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.kg-host { position: relative; }
.kg-host svg { width: 100%; height: auto; }
.kg-bubble { position: relative; padding: 16px 20px; border-radius: 18px; background: #fff; box-shadow: 0 6px 18px rgba(23,50,77,.10); }
.kg-bubble::before { content: ""; position: absolute; left: -11px; top: 34px; width: 22px; height: 22px; border-radius: 4px; background: #fff; transform: rotate(45deg); }
.kg-ask { position: relative; margin: 0; color: #17324d; font: 700 24px/1.34 var(--font-serif); }
.kg-scene-tools { position: relative; margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
.kg-chip { padding: 8px 15px; display: inline-flex; align-items: center; gap: 7px; border: 2px solid var(--kg-a); border-radius: 999px; background: #fff; color: #17324d; font-size: 14px; font-weight: 600; }
.kg-chip:hover { border-color: var(--kg-b); background: var(--kg-a); }
.kg-chip-big { padding: 12px 22px; font-size: 16px; }
.kg-chip[disabled] { opacity: .55; cursor: default; }

.kg-evidence { margin-top: 12px; padding: 14px 18px; border-radius: 14px; border-left: 6px solid #f2a63b; background: #fff8e4; }
.kg-evidence span { display: inline-flex; align-items: center; gap: 6px; color: #8a6200; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.kg-evidence p { margin: 6px 0 0; font: 17px/1.6 var(--font-serif); color: #3b2f10; }

.kg-play { margin-top: 18px; }
.kg-clue { max-width: 60ch; margin: 14px auto 0; color: #5d6b80; font-size: 15px; text-align: center; }
.kg-actions { margin-top: 20px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 10px; }
.kg-go { padding: 13px 26px; display: inline-flex; align-items: center; gap: 9px; border: 0; border-radius: 999px; background: var(--kg-b); color: #fff; font-size: 17px; font-weight: 700; box-shadow: 0 5px 0 rgba(0,0,0,.22); }
.kg-go:hover { transform: translateY(-2px); box-shadow: 0 7px 0 rgba(0,0,0,.22); }
.kg-go:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0,0,0,.22); }
.kg-go[disabled] { background: #b9c5cf; box-shadow: 0 5px 0 #97a5b1; cursor: default; transform: none; }

/* ------------------------------------------------------------------ choice */
.kg-choices { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.kg-choices.is-long { grid-template-columns: minmax(0, 1fr); max-width: 720px; margin: 0 auto; }
.kg-choices.is-phrases { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 760px; margin: 0 auto; }
.kg-choice { position: relative; min-height: 78px; padding: 16px 46px 16px 20px; display: flex; align-items: center; gap: 14px;
  border: 3px solid #e3ebf1; border-radius: 18px; background: #fff; text-align: left;
  box-shadow: 0 5px 0 #e0e8ee; transition: transform .14s ease, border-color .14s ease, box-shadow .14s ease; }
.kg-choices.has-pictures .kg-choice { flex-direction: column; justify-content: center; padding: 18px 16px; text-align: center; gap: 6px; }
.kg-choice:hover:not([disabled]) { border-color: var(--kg-b); transform: translateY(-3px); box-shadow: 0 8px 0 var(--kg-a); }
.kg-choice:active:not([disabled]) { transform: translateY(2px); box-shadow: 0 2px 0 var(--kg-a); }
.kg-choice:focus-visible { outline: 3px solid var(--kg-b); outline-offset: 3px; }
.kg-choice-pic { min-height: 52px; font-size: 46px; line-height: 1.1; }
.kg-choice-text { font-size: 20px; font-weight: 600; line-height: 1.34; }
.kg-choices.is-long .kg-choice-text, .kg-choices.is-phrases .kg-choice-text { font-size: 18px; }
.kg-choice-mark { position: absolute; top: 50%; right: 14px; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; transform: translateY(-50%) scale(0); color: #fff; font-size: 17px; font-weight: 700; }
.kg-choice.is-right { border-color: #23845b; background: #eaf9f0; box-shadow: 0 5px 0 #bfe6d1; }
.kg-choice.is-right .kg-choice-mark { background: #23845b; transform: translateY(-50%) scale(1); }
.kg-choice.is-right .kg-choice-mark::after { content: "✓"; }
.kg-choice.is-wrong { border-color: #bd3d36; background: #fdeeec; box-shadow: 0 5px 0 #f2c9c5; animation: kg-shake .4s; }
.kg-choice.is-wrong .kg-choice-mark { background: #bd3d36; transform: translateY(-50%) scale(1); }
.kg-choice.is-wrong .kg-choice-mark::after { content: "✕"; }
.kg-choice.is-answer { animation: kg-glow 1s ease 2; }
.kg-choice[disabled] { cursor: default; }
.kg-choice[disabled]:not(.is-right):not(.is-wrong) { opacity: .5; }
@keyframes kg-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 45% { transform: translateX(6px); } 70% { transform: translateX(-4px); } }
@keyframes kg-glow { 0%,100% { box-shadow: 0 5px 0 #bfe6d1; } 50% { box-shadow: 0 5px 0 #bfe6d1, 0 0 0 8px rgba(35,132,91,.22); } }

/* ---------------------------------------------------------------- spelling */
.kg-spell { display: grid; justify-items: center; }
.kg-spell-pic { font-size: 66px; line-height: 1; }
.kg-slots { margin: 14px 0 4px; display: flex; flex-wrap: wrap; justify-content: center; gap: 9px; padding: 10px; border-radius: 16px; }
.kg-slot { width: 56px; height: 64px; padding: 0; display: grid; place-items: center; border: 3px dashed #bccbd6; border-radius: 12px; background: #fff;
  color: #17324d; font-size: 30px; font-weight: 700; }
.kg-slot:focus-visible { outline: 3px solid var(--kg-b); outline-offset: 3px; }
.kg-slot.is-filled { border-style: solid; border-color: var(--kg-b); background: var(--kg-a); }
.kg-slot.is-hover { border-color: #f2a63b; background: #fff5da; transform: scale(1.06); }
.kg-slots.is-right { animation: kg-pop .5s; }
.kg-slots.is-wrong { animation: kg-shake .4s; }
@keyframes kg-pop { 0% { transform: scale(1); } 45% { transform: scale(1.07); } 100% { transform: scale(1); } }

.kg-bank { margin-top: 18px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.kg-block { width: 58px; height: 62px; border: 0; border-radius: 12px; background: linear-gradient(180deg, #fff, #eef3f7);
  color: #17324d; font-size: 27px; font-weight: 700; box-shadow: 0 5px 0 #c3d0da, 0 8px 14px rgba(23,50,77,.12); touch-action: none; }
.kg-block:hover:not([disabled]) { transform: translateY(-3px); }
.kg-block:active:not([disabled]) { transform: translateY(2px); box-shadow: 0 2px 0 #c3d0da; }
.kg-block.is-used { opacity: .22; box-shadow: none; cursor: default; }
.kg-block.is-dragging { opacity: .3; }

/* --------------------------------------------------------- sentence track */
.kg-build { display: grid; justify-items: center; }
.kg-track { width: 100%; min-height: 96px; padding: 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 9px;
  border: 3px dashed #bccbd6; border-radius: 18px; background: repeating-linear-gradient(90deg, #fff 0 26px, #f7fafc 26px 52px); }
.kg-track.is-empty::before { content: attr(data-empty); width: 100%; color: #8598a8; font-size: 16px; text-align: center; }
.kg-track.is-hover { border-color: #f2a63b; background: #fffaf0; }
.kg-track.is-right { border-style: solid; border-color: #23845b; background: #eaf9f0; animation: kg-pop .5s; }
.kg-track.is-wrong { border-style: solid; border-color: #bd3d36; background: #fdeeec; animation: kg-shake .4s; }
.kg-bank-words { max-width: 100%; }
.kg-word { padding: 12px 17px; border: 0; border-radius: 12px; background: linear-gradient(180deg, #fff, #eef3f7); color: #17324d;
  font-size: 20px; font-weight: 600; box-shadow: 0 5px 0 #c3d0da, 0 8px 14px rgba(23,50,77,.10); touch-action: none; }
.kg-word:hover:not([disabled]) { transform: translateY(-3px); }
.kg-word.is-used { opacity: .22; box-shadow: none; cursor: default; }
.kg-word.is-dragging { opacity: .3; }
.kg-word.is-placed { background: linear-gradient(180deg, #fff, var(--kg-a)); box-shadow: 0 4px 0 rgba(0,0,0,.12); }

.kg-ghost { position: fixed; z-index: 1200; margin: 0; pointer-events: none; transform: translate(-50%, -50%) rotate(-4deg) scale(1.1);
  opacity: .96; box-shadow: 0 14px 26px rgba(23,50,77,.3) !important; }

/* ------------------------------------------------------------------- pairs */
.kg-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; max-width: 720px; margin: 0 auto; }
.kg-card { padding: 0; border: 0; background: none; perspective: 900px; }
.kg-card-inner { position: relative; display: block; width: 100%; min-height: 128px; transition: transform .45s cubic-bezier(.2,.8,.3,1); transform-style: preserve-3d; }
.kg-card.is-open .kg-card-inner, .kg-card.is-matched .kg-card-inner { transform: rotateY(180deg); }
.kg-card-back, .kg-card-front { position: absolute; inset: 0; display: grid; place-content: center; place-items: center; gap: 6px; padding: 12px;
  border-radius: 16px; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.kg-card-back { background: linear-gradient(150deg, var(--kg-b), #17324d); color: rgba(255,255,255,.85); font-size: 40px; font-weight: 700;
  box-shadow: 0 6px 0 rgba(0,0,0,.2); }
.kg-card-front { transform: rotateY(180deg); background: #fff; color: #17324d; font-size: 16px; line-height: 1.35; text-align: center;
  box-shadow: 0 6px 0 var(--kg-a), inset 0 0 0 3px var(--kg-a); }
.kg-card-pic { font-size: 40px; }
.kg-card.is-matched .kg-card-front { background: #eaf9f0; box-shadow: 0 6px 0 #bfe6d1, inset 0 0 0 3px #23845b; }
.kg-card.is-miss .kg-card-front { background: #fdeeec; box-shadow: 0 6px 0 #f2c9c5, inset 0 0 0 3px #bd3d36; }
.kg-card:not(.is-matched):hover .kg-card-inner { transform: translateY(-4px) rotateY(0deg); }
.kg-card.is-open:not(.is-matched):hover .kg-card-inner { transform: rotateY(180deg); }

/* ---------------------------------------------------------------- speaking */
.kg-speak { max-width: 720px; margin: 0 auto; display: grid; gap: 16px; }
.kg-speak-target { padding: 20px; border-radius: 18px; background: linear-gradient(160deg, var(--kg-a), #fff); text-align: center; }
.kg-speak-target span { color: var(--kg-b); font-size: 12px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
.kg-speak-target p { margin: 8px 0 14px; font: 700 26px/1.35 var(--font-serif); }
.kg-speak-panel { padding: 20px; border-radius: 18px; background: #fff; box-shadow: 0 8px 22px rgba(23,50,77,.10); }
.kg-speak-panel .record-button { animation: none; }
.kg-speak-panel audio { width: 100%; margin: 12px 0; }

/* ---------------------------------------------------------------- feedback */
.kg-feedback:empty { display: none; }
.kg-verdict { margin-top: 18px; padding: 18px 20px; display: grid; grid-template-columns: 54px minmax(0, 1fr) auto; align-items: center; gap: 16px;
  border-radius: 18px; animation: kg-rise .3s ease; }
.kg-verdict.is-good { background: #e7f8ee; color: #14603f; }
.kg-verdict.is-try { background: #fff4dd; color: #7a4a12; }
.kg-verdict-face { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 50%; background: #fff; font-size: 27px; }
.kg-verdict strong { display: block; font-size: 20px; }
.kg-verdict strong em { margin-left: 6px; padding: 2px 9px; border-radius: 999px; background: #f2a63b; color: #fff; font-size: 13px; font-style: normal; }
.kg-verdict p { margin: 4px 0 0; color: inherit; font-size: 15px; line-height: 1.5; opacity: .92; }
@keyframes kg-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

.kg-confetti { position: absolute; left: 0; right: 0; top: 0; bottom: 0; overflow: hidden; pointer-events: none; }
.kg-confetti i { position: absolute; top: -14px; width: 11px; height: 15px; border-radius: 2px; animation: kg-fall 1.25s cubic-bezier(.3,.6,.5,1) forwards; }
@keyframes kg-fall { 0% { opacity: 1; transform: translate(0, 0) rotate(0); } 100% { opacity: 0; transform: translate(var(--kg-drift, 0), 340px) rotate(420deg); } }

/* ------------------------------------------------------------------ result */
.kg-result { max-width: 620px; margin: 12px auto 0; padding: 34px 30px 30px; display: grid; justify-items: center; text-align: center;
  border-radius: 26px; background: linear-gradient(170deg, var(--kg-a), #fff 70%); box-shadow: 0 16px 36px rgba(23,50,77,.14); }
.kg-result-pip { width: 132px; }
.kg-result-pip svg { width: 100%; height: auto; }
.kg-result h1 { margin: 4px 0 12px; font: 700 34px/1.15 var(--font-serif); }
.kg-result p { margin: 14px 0 0; max-width: 46ch; color: #3d5163; line-height: 1.55; }
.kg-result-stars { display: flex; gap: 10px; font-size: 52px; color: #d8e0e6; }
/* No fill-mode: the star must be VISIBLE if the animation never runs. A
   backgrounded tab throttles animations, and with animation-fill-mode set to
   backwards the pre-start keyframe (opacity 0) is what a learner returning to
   the tab would find —
   a result screen reporting two stars and showing none. */
.kg-result-stars .is-earned { color: #f2a63b; animation: kg-star-in .55s cubic-bezier(.2,1.5,.4,1); }
@keyframes kg-star-in { from { opacity: 0; transform: scale(.2) rotate(-40deg); } to { opacity: 1; transform: none; } }

/* ------------------------------------------------------------------- Pip */
.kg-pip { overflow: visible; }
.kg-pip .kg-pip-body { transform-origin: 60px 110px; }
.kg-pip .kg-pip-eye { animation: kg-blink 5s infinite; transform-origin: center; }
.kg-pip .kg-pip-head { transform-origin: 60px 60px; animation: kg-nod 4s ease-in-out infinite; }
.kg-pip.is-cheer .kg-pip-body { animation: kg-hop .6s ease 2; }
.kg-pip.is-cheer .kg-pip-wing-l { transform-origin: 32px 66px; animation: kg-flap .3s ease-in-out 4 alternate; }
.kg-pip.is-cheer .kg-pip-wing-r { transform-origin: 88px 66px; animation: kg-flap-r .3s ease-in-out 4 alternate; }
.kg-pip.is-think .kg-pip-head { animation: kg-tilt 2s ease-in-out infinite; }
.kg-pip.is-sad .kg-pip-head { transform: translateY(5px); animation: none; }
.kg-pip.is-sad .kg-pip-brow { transform: translateY(4px) rotate(0); }
@keyframes kg-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(.1); } }
@keyframes kg-nod { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-2px) rotate(-2deg); } }
@keyframes kg-hop { 0%, 100% { transform: translateY(0) scale(1); } 40% { transform: translateY(-14px) scale(1.05); } }
@keyframes kg-flap { from { transform: rotate(0); } to { transform: rotate(-38deg); } }
@keyframes kg-flap-r { from { transform: rotate(0); } to { transform: rotate(38deg); } }
@keyframes kg-tilt { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }

/* -------------------------------------------------------------- responsive */
@media (max-width: 900px) {
  .kg-welcome { grid-template-columns: 96px minmax(0, 1fr); padding: 20px; }
  .kg-welcome h1 { font-size: 32px; }
  .kg-scene { grid-template-columns: 84px minmax(0, 1fr); padding: 16px; }
  .kg-ask { font-size: 21px; }
}
@media (max-width: 620px) {
  .kg-welcome { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .kg-welcome-pip { width: 108px; }
  .kg-jar, .kg-counters { justify-content: center; }
  .kg-board { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .kg-tile-badge { font-size: 38px; }
  .kg-tile-name { font-size: 17px; }
  .kg-scene { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .kg-host { width: 96px; }
  .kg-bubble::before { left: 50%; top: -10px; margin-left: -11px; }
  /* Back and stars on one line, the game's name and its round pips under them.
     Left to wrap on its own the bar became three stacked rows and pushed the
     game itself off a phone screen. */
  .kg-bar { display: grid; grid-template-columns: auto auto; justify-content: space-between; align-items: center; row-gap: 10px; }
  .kg-bar-mid { grid-row: 2; grid-column: 1 / -1; }
  .kg-choices, .kg-choices.is-phrases { grid-template-columns: minmax(0, 1fr); }
  .kg-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kg-verdict { grid-template-columns: 44px minmax(0, 1fr); }
  .kg-verdict .kg-go { grid-column: 1 / -1; justify-content: center; }
  .kg-slot { width: 46px; height: 54px; font-size: 24px; }
  .kg-block { width: 48px; height: 54px; font-size: 22px; }
}

/* Motion is decoration here and never information: every state it dramatises
   is also stated in text, so stilling it costs a learner nothing. Both the
   media query and the .kg-still class, because the class is what a page keeps
   when it was painted under the preference. */
@media (prefers-reduced-motion: reduce) {
  .kg *, .kg *::before, .kg *::after { animation: none !important; transition: none !important; }
  .kg-card-inner { transition: none !important; }
}
.kg-still *, .kg-still *::before, .kg-still *::after { animation: none !important; transition: none !important; }
`;
