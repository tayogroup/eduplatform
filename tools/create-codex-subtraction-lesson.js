const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outFile = path.join(root, "dist", "pre_quraan", "units", "openmaic-classroom", "subtraction-playtime-standalone.html");
const outputCopy = path.join(root, "outputs", "openmaic", "subtraction-playtime-standalone.html");

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Subtraction Playtime</title>
  <style>
    :root {
      --ink: #1f2937;
      --muted: #667085;
      --teal: #2f7d73;
      --gold: #d6a531;
      --orange: #f97316;
      --mint: #dff7ee;
      --sky: #dff3ff;
      --cream: #fff7e0;
      --rose: #ffe4e6;
      --page: #fffdf7;
      --line: #e8dfcd;
      --shadow: 0 24px 60px rgba(31, 41, 55, .12);
    }

    * { box-sizing: border-box; }

    html,
    body {
      height: 100%;
      margin: 0;
      overflow: hidden;
    }

    body {
      color: var(--ink);
      background:
        radial-gradient(circle at 10% 12%, rgba(56, 189, 248, .24), transparent 25%),
        radial-gradient(circle at 86% 12%, rgba(214, 165, 49, .30), transparent 25%),
        radial-gradient(circle at 74% 88%, rgba(249, 115, 22, .16), transparent 28%),
        linear-gradient(135deg, #eaf8f4 0%, #fff6df 48%, #eef7ff 100%);
      font-family: "Trebuchet MS", "Segoe UI", Arial, sans-serif;
      letter-spacing: 0;
    }

    button { border: 0; cursor: pointer; font: inherit; }

    .app {
      width: min(1220px, calc(100vw - 24px));
      height: 100dvh;
      margin: 0 auto;
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 6px;
      flex: 0 0 auto;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .brand-mark {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 14px;
      color: #fff;
      background: linear-gradient(135deg, var(--teal), #1f6f64);
      font-size: 1.02rem;
      font-weight: 900;
      box-shadow: 0 12px 28px rgba(15, 118, 110, .22);
    }

    .eyebrow {
      margin: 0;
      color: var(--teal);
      font-size: .78rem;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: var(--ink);
      font-size: clamp(1.15rem, 1.9vw, 1.85rem);
      line-height: 1.05;
    }

    .top-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      flex-wrap: wrap;
    }

    .audio-tools {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      border: 1px solid rgba(232, 223, 205, .95);
      border-radius: 999px;
      background: rgba(255, 255, 255, .82);
      box-shadow: 0 10px 24px rgba(31, 41, 55, .08);
    }

    .audio-btn,
    .nav-btn {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      color: var(--teal);
      background: #fff;
      border: 1px solid var(--line);
      box-shadow: 0 8px 20px rgba(31, 41, 55, .08);
    }

    .audio-btn:hover,
    .nav-btn:hover { background: var(--mint); }
    .audio-btn.active { color: #fff; background: var(--teal); border-color: var(--teal); }
    .audio-btn:disabled,
    .nav-btn:disabled { opacity: .35; cursor: not-allowed; }

    .audio-status {
      min-width: 76px;
      padding-right: 8px;
      color: var(--muted);
      font-size: .82rem;
      font-weight: 900;
    }

    .progress {
      display: flex;
      align-items: center;
      gap: 12px;
      white-space: nowrap;
      color: var(--muted);
      font-size: .95rem;
      font-weight: 900;
    }

    .progress-track {
      height: 9px;
      width: min(210px, 24vw);
      overflow: hidden;
      border-radius: 999px;
      background: rgba(15, 118, 110, .12);
    }

    .progress-fill {
      width: 0;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--teal), var(--gold), var(--orange));
      transition: width .25s ease;
    }

    .book-shell {
      position: relative;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: clamp(6px, .9vw, 10px);
      border: 1px solid rgba(214, 165, 49, .34);
      border-radius: 26px;
      background:
        linear-gradient(135deg, rgba(255, 253, 247, .86), rgba(230, 244, 239, .70)),
        radial-gradient(circle at 18% 20%, rgba(56, 189, 248, .14), transparent 32%),
        radial-gradient(circle at 88% 78%, rgba(250, 204, 21, .16), transparent 28%);
      box-shadow: 0 28px 70px rgba(15, 118, 110, .15), 0 18px 42px rgba(31, 41, 55, .08);
    }

    .page {
      position: relative;
      width: min(100%, 1130px);
      max-width: 100%;
      height: min(560px, calc(100dvh - 178px));
      min-height: 0;
      max-height: calc(100dvh - 178px);
      aspect-ratio: 16 / 9;
      margin: 0 auto;
      flex: 1 1 auto;
      overflow: hidden;
      border-radius: 20px;
      border: 1px solid rgba(214, 165, 49, .24);
      background:
        linear-gradient(135deg, rgba(255, 253, 247, .98), rgba(255, 247, 224, .62)),
        var(--page);
      box-shadow: inset 0 0 0 1px rgba(214, 165, 49, .10), 0 16px 34px rgba(15, 118, 110, .08);
    }

    .page::before {
      content: "";
      position: absolute;
      left: 4.2%;
      right: 4.2%;
      top: 7.4%;
      height: 8px;
      border-radius: 999px;
      background: var(--gold);
      opacity: .94;
    }

    .page-num {
      position: absolute;
      right: 4.7%;
      top: 3.2%;
      color: rgba(15, 118, 110, .14);
      font-size: clamp(2.5rem, 6vw, 5.2rem);
      font-weight: 900;
      line-height: 1;
      pointer-events: none;
    }

    .spread {
      position: absolute;
      inset: 8.2% 4.2% 6.4%;
      display: grid;
      grid-template-columns: minmax(0, 1.42fr) minmax(300px, .78fr);
      gap: clamp(14px, 2.4vw, 30px);
      align-items: stretch;
      min-height: 0;
    }

    .wide .spread { grid-template-columns: 1fr; }

    .visual-side {
      position: relative;
      min-width: 0;
      min-height: 0;
      display: grid;
      place-items: center;
      padding: clamp(14px, 2vw, 22px);
      border-radius: 24px;
      overflow: hidden;
      background: linear-gradient(135deg, #e0f2fe 0%, #fff7e0 62%, #f3e8ff 100%);
      box-shadow: 0 18px 38px rgba(31, 41, 55, .11);
      border: 1px solid rgba(214, 165, 49, .20);
    }

    .text-side {
      display: flex;
      flex-direction: column;
      justify-content: stretch;
      min-width: 0;
      min-height: 0;
      height: 100%;
      max-height: 100%;
      gap: 10px;
      overflow: hidden;
      order: 2;
    }

    .page-title {
      margin: 0;
      color: var(--teal);
      font-size: clamp(1.35rem, 2.3vw, 2.25rem);
      line-height: 1.05;
      padding: 4px 14px 0;
    }

    .story-card {
      width: 100%;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: clamp(11px, 1.15vw, 15px);
      border-radius: 24px;
      background: rgba(255, 253, 247, .96);
      box-shadow: 0 18px 38px rgba(31, 41, 55, .11);
      border: 1px solid rgba(214, 165, 49, .24);
      overflow: hidden;
    }

    .story-text {
      margin: 0;
      color: var(--ink);
      font-size: clamp(1.05rem, 1.35vw, 1.28rem);
      line-height: 1.28;
      font-weight: 900;
    }

    .say-box,
    .feedback {
      padding: 10px 14px;
      border-radius: 18px;
      background: #ccfbf1;
      color: #195d54;
      font-size: clamp(.95rem, 1.12vw, 1.08rem);
      font-weight: 900;
      line-height: 1.25;
    }

    .key-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-top: auto;
    }

    .key-card {
      min-height: 60px;
      display: grid;
      place-items: center;
      padding: 10px;
      border-radius: 16px;
      font-size: clamp(.9rem, 1.12vw, 1.06rem);
      font-weight: 900;
      line-height: 1.16;
      text-align: center;
      border: 1px solid rgba(214, 165, 49, .20);
    }

    .key-card:nth-child(1) { background: #dff3ff; color: #075985; }
    .key-card:nth-child(2) { background: #dff7ee; color: #166534; }
    .key-card:nth-child(3) { background: #fff0ca; color: #92400e; }

    .scene {
      width: min(100%, 640px);
      height: min(100%, 420px);
      display: grid;
      grid-template-rows: 1fr auto;
      gap: 14px;
      align-items: end;
    }

    .object-stage {
      display: flex;
      align-items: end;
      justify-content: center;
      gap: clamp(12px, 2.3vw, 26px);
      min-height: 250px;
      padding: 20px;
      border-radius: 26px;
      background: rgba(255,255,255,.54);
      border: 1px solid rgba(214, 165, 49, .18);
    }

    .thing {
      position: relative;
      width: clamp(70px, 8vw, 104px);
      height: clamp(70px, 8vw, 104px);
      display: grid;
      place-items: center;
      border-radius: 28px;
      color: #fff;
      font-size: clamp(2.2rem, 4vw, 4rem);
      font-weight: 1000;
      background: linear-gradient(135deg, #fb923c, #f97316);
      box-shadow: 0 14px 28px rgba(31, 41, 55, .18);
      transition: transform .18s ease, opacity .18s ease, filter .18s ease;
    }

    .thing.round { border-radius: 999px; background: linear-gradient(135deg, #ef4444, #fb923c); }
    .thing.block { border-radius: 18px; background: linear-gradient(135deg, #38bdf8, #2563eb); }
    .thing.star { border-radius: 32px; background: linear-gradient(135deg, #facc15, #f59e0b); }
    .thing.taken {
      transform: translateY(-18px) rotate(-8deg) scale(.82);
      opacity: .26;
      filter: grayscale(.4);
    }

    .count-line {
      min-height: 54px;
      display: grid;
      place-items: center;
      padding: 10px 16px;
      border-radius: 18px;
      background: rgba(255, 253, 247, .94);
      color: var(--teal);
      font-size: clamp(1.2rem, 2.2vw, 1.8rem);
      font-weight: 1000;
      text-align: center;
      box-shadow: 0 12px 24px rgba(31, 41, 55, .08);
    }

    .choice-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      min-height: 0;
      margin-top: auto;
    }

    .choice-btn {
      min-height: 78px;
      border-radius: 20px;
      color: var(--ink);
      background: #fff;
      border: 3px solid rgba(15, 118, 110, .14);
      box-shadow: 0 12px 24px rgba(31, 41, 55, .08);
      font-size: clamp(1.5rem, 2.8vw, 2.4rem);
      font-weight: 1000;
    }

    .choice-btn:hover { background: #f7fffb; border-color: rgba(15, 118, 110, .32); }
    .choice-btn.correct { background: #dcfce7; border-color: #16a34a; }
    .choice-btn.wrong { background: var(--rose); border-color: #fb7185; }

    .activity-panel {
      grid-column: 1 / -1;
      height: 100%;
      min-height: 0;
      display: grid;
      grid-template-columns: .9fr 1.1fr;
      gap: 18px;
      align-items: stretch;
      padding: clamp(16px, 2.4vw, 28px);
      border-radius: 28px;
      background: rgba(255, 253, 247, .92);
      border: 1px solid rgba(214, 165, 49, .24);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .activity-copy {
      display: flex;
      flex-direction: column;
      min-height: 0;
      gap: 12px;
      padding: clamp(14px, 2vw, 24px);
      border-radius: 24px;
      background: var(--mint);
    }

    .activity-copy h2 {
      margin: 0;
      color: var(--teal);
      font-size: clamp(2rem, 4vw, 3.2rem);
      line-height: 1;
    }

    .activity-copy p {
      margin: 0;
      font-size: clamp(1rem, 1.6vw, 1.35rem);
      line-height: 1.28;
      font-weight: 900;
    }

    .takeaway-game {
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 12px;
      min-height: 0;
    }

    .game-board {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      align-content: center;
      min-height: 0;
    }

    .game-object {
      min-height: 118px;
      display: grid;
      place-items: center;
      border-radius: 22px;
      color: #fff;
      background: linear-gradient(135deg, #38bdf8, #2f7d73);
      border: 3px solid rgba(255,255,255,.8);
      box-shadow: 0 12px 24px rgba(31, 41, 55, .10);
      font-size: clamp(2.2rem, 4vw, 3.6rem);
      font-weight: 1000;
      transition: transform .18s ease, opacity .18s ease;
    }

    .game-object.round { border-radius: 999px; background: linear-gradient(135deg, #ef4444, #fb923c); }
    .game-object.star { border-radius: 32px; background: linear-gradient(135deg, #facc15, #f59e0b); }
    .game-object.duck { border-radius: 28px; background: linear-gradient(135deg, #fde68a, #f59e0b); }
    .game-object.apple { border-radius: 999px 999px 32px 32px; background: linear-gradient(135deg, #fb7185, #dc2626); }

    .game-object.removed {
      opacity: .20;
      transform: scale(.82) translateY(10px);
    }

    .tool-row {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .tool-btn {
      min-height: 46px;
      padding: 10px 18px;
      border-radius: 16px;
      color: #fff;
      background: var(--teal);
      box-shadow: inset 0 -4px 0 rgba(15, 118, 110, .24), 0 12px 24px rgba(15, 118, 110, .14);
      font-weight: 1000;
    }

    .tool-btn.light {
      color: var(--teal);
      background: #fff;
      border: 2px solid rgba(15, 118, 110, .18);
      box-shadow: 0 10px 22px rgba(31, 41, 55, .08);
    }

    .controls {
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex: 0 0 auto;
      padding-top: 6px;
    }

    .dots {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      min-width: 0;
      max-width: min(460px, 52vw);
      flex-wrap: wrap;
    }

    .dot {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      background: rgba(15, 118, 110, .18);
      transition: .2s ease;
    }

    .dot.active {
      width: 28px;
      background: var(--teal);
    }

    @media (max-width: 820px) {
      .topbar { align-items: flex-start; flex-direction: column; }
      .progress { width: 100%; min-width: 0; }
      .progress-track { flex: 1; width: auto; }
      .page { height: min(720px, calc(100dvh - 205px)); max-height: calc(100dvh - 205px); aspect-ratio: auto; }
      .spread { inset: 70px 18px 24px; grid-template-columns: 1fr; overflow: auto; }
      .visual-side { min-height: 290px; }
      .key-strip,
      .activity-panel,
      .game-board { grid-template-columns: 1fr; }
      .choice-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .page::before { left: 22px; right: 22px; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">QA</div>
        <div>
          <p class="eyebrow">Interactive Storybook</p>
          <h1>Subtraction Playtime</h1>
        </div>
      </div>
      <div class="top-actions">
        <div class="audio-tools" aria-label="Read aloud controls">
          <button class="audio-btn" id="readBtn" type="button" aria-label="Read this page">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
          </button>
          <button class="audio-btn" id="pauseBtn" type="button" aria-label="Pause reading">
            <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M8 6v12M16 6v12" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>
          </button>
          <button class="audio-btn" id="stopBtn" type="button" aria-label="Stop reading">
            <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M8 8h8v8H8z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg>
          </button>
          <span class="audio-status" id="audioStatus">Ready</span>
        </div>
        <div class="progress" aria-live="polite">
          <span id="pageLabel">Page 1</span>
          <div class="progress-track" aria-hidden="true"><div class="progress-fill" id="progressFill"></div></div>
        </div>
      </div>
    </header>

    <section class="book-shell">
      <article class="page" id="page"></article>
      <nav class="controls" aria-label="Lesson navigation">
        <button class="nav-btn" id="prevBtn" type="button" aria-label="Previous page">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 18 9 12l6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="dots" id="dots" aria-hidden="true"></div>
        <button class="nav-btn" id="nextBtn" type="button" aria-label="Next page">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </nav>
    </section>
  </main>

  <script>
    const pages = [
      {
        kind: "story",
        title: "Welcome to Take-Away Time",
        text: ["Today we will learn subtraction.", "Subtraction means some things go away, and we count what is left."],
        count: 5,
        taken: 0,
        type: "star",
        line: "First count. Then take away.",
        cards: ["Count first", "Take away", "Count left"]
      },
      {
        kind: "tap",
        title: "What Means Take Away?",
        text: ["Some toys are here.", "Tap a toy. It goes away. Now there are fewer toys."],
        count: 4,
        taken: 0,
        type: "block",
        line: "Take away means one goes away.",
        cards: ["Here", "Gone", "Less"]
      },
      {
        kind: "story",
        title: "Mina Has Three Toys",
        text: ["Mina puts three bright toys on the mat.", "She counts them slowly: one, two, three."],
        count: 3,
        taken: 0,
        type: "block",
        line: "3 toys are here.",
        cards: ["Count", "Touch", "Say 3"]
      },
      {
        kind: "tap",
        title: "One Toy Goes Away",
        text: ["Mina gives one toy to her little sister.", "When one goes away, we have less."],
        count: 3,
        taken: 1,
        type: "block",
        line: "3 take away 1 leaves 2.",
        cards: ["Take away", "Less", "2 left"]
      },
      {
        kind: "choice",
        title: "How Many Are Left?",
        text: ["Look at the toys.", "One toy is gone. How many toys are still on the mat?"],
        count: 3,
        taken: 1,
        type: "block",
        answer: 2,
        choices: [1, 2, 3],
        prompt: "Tap the number left."
      },
      {
        kind: "story",
        title: "Cookies on a Plate",
        text: ["There are four cookies on a plate.", "Mina eats one cookie after lunch."],
        count: 4,
        taken: 1,
        type: "round",
        line: "4 take away 1 leaves 3.",
        cards: ["4 cookies", "1 goes away", "3 left"]
      },
      {
        kind: "choice",
        title: "Cookie Check",
        text: ["Four cookies were on the plate.", "One cookie is gone. How many cookies are left?"],
        count: 4,
        taken: 1,
        type: "round",
        answer: 3,
        choices: [2, 3, 4],
        prompt: "Tap the number left."
      },
      {
        kind: "story",
        title: "Stars at Bedtime",
        text: ["Mina sees five sleepy stars.", "Two stars hide behind a cloud."],
        count: 5,
        taken: 2,
        type: "star",
        line: "5 take away 2 leaves 3.",
        cards: ["Start with 5", "Take away 2", "3 left"]
      },
      {
        kind: "choice",
        title: "Star Check",
        text: ["Five stars were shining.", "Two stars went away. How many stars can Mina still see?"],
        count: 5,
        taken: 2,
        type: "star",
        answer: 3,
        choices: [2, 3, 5],
        prompt: "Tap the number left."
      },
      {
        kind: "activity",
        title: "Take-Away Game",
        text: "Tap toys to make them go away. Then count what is left.",
        start: 5,
        targetTake: 2,
        type: "block",
        label: "toy"
      },
      {
        kind: "choice",
        title: "Tiny Number Sentence",
        text: ["Mina says: Five take away two leaves three.", "Which number sentence matches?"],
        count: 5,
        taken: 2,
        type: "block",
        answer: "5 - 2 = 3",
        choices: ["5 - 2 = 3", "5 - 2 = 5", "5 - 2 = 1"],
        prompt: "Tap the matching sentence."
      },
      {
        kind: "activity",
        title: "Snack Bowl Game",
        text: "Start with four snacks. Tap one or two away and count the snacks left.",
        start: 4,
        targetTake: 1,
        type: "round",
        label: "cookie"
      },
      {
        kind: "activity",
        title: "Balloon Pop",
        text: "Five balloons are floating. Tap three balloons away. How many are still floating?",
        start: 5,
        targetTake: 3,
        type: "star",
        label: "balloon"
      },
      {
        kind: "activity",
        title: "Apple Basket",
        text: "Four apples are in the basket. Take away two apples and count what is left.",
        start: 4,
        targetTake: 2,
        type: "apple",
        label: "apple"
      },
      {
        kind: "activity",
        title: "Duck Pond",
        text: "Three ducks are in the pond. One duck swims away. Count the ducks left.",
        start: 3,
        targetTake: 1,
        type: "duck",
        label: "duck"
      },
      {
        kind: "choice",
        title: "Last Check",
        text: ["Subtraction means some go away.", "If three blocks are here and one goes away, how many are left?"],
        count: 3,
        taken: 1,
        type: "block",
        answer: 2,
        choices: [1, 2, 3],
        prompt: "Tap the number left."
      },
      {
        kind: "story",
        title: "You Did It",
        text: ["Subtraction means take away.", "We count what is left. Great counting!"],
        count: 5,
        taken: 0,
        type: "star",
        line: "Take away. Count left.",
        cards: ["I can count", "I can take away", "I can find what is left"]
      }
    ];

    const page = document.getElementById("page");
    const pageLabel = document.getElementById("pageLabel");
    const progressFill = document.getElementById("progressFill");
    const dots = document.getElementById("dots");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const readBtn = document.getElementById("readBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const stopBtn = document.getElementById("stopBtn");
    const audioStatus = document.getElementById("audioStatus");
    const narrator = new Audio();
    narrator.preload = "auto";
    let index = 0;
    let speaking = false;
    let paused = false;
    let usingBrowserVoice = false;

    function el(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function thingClass(type) {
      return "thing " + (type || "block");
    }

    function renderObjects(data, interactive) {
      const scene = el("div", "scene");
      const stage = el("div", "object-stage");
      for (let i = 0; i < data.count; i += 1) {
        const item = el("button", thingClass(data.type), String(i + 1));
        item.type = "button";
        item.setAttribute("aria-label", "Object " + (i + 1));
        item.textContent = data.type === "star" ? "★" : (data.type === "round" ? "●" : String(i + 1));
        if (i >= data.count - data.taken) item.classList.add("taken");
        if (interactive) {
          item.addEventListener("click", () => item.classList.toggle("taken"));
        }
        stage.appendChild(item);
      }
      scene.appendChild(stage);
      scene.appendChild(el("div", "count-line", data.line || "Count what is left."));
      return scene;
    }

    function renderStory(data) {
      const spread = el("div", "spread");
      const visual = el("section", "visual-side");
      visual.appendChild(renderObjects(data, data.kind === "tap"));
      const textSide = el("section", "text-side");
      textSide.appendChild(el("h2", "page-title", data.title));
      const card = el("div", "story-card");
      data.text.forEach((line) => card.appendChild(el("p", "story-text", line)));
      if (data.kind === "tap") card.appendChild(el("div", "say-box", "Tap a toy to see it go away."));
      const keys = el("div", "key-strip");
      (data.cards || []).forEach((cardText) => keys.appendChild(el("div", "key-card", cardText)));
      card.appendChild(keys);
      textSide.appendChild(card);
      spread.appendChild(visual);
      spread.appendChild(textSide);
      page.appendChild(spread);
    }

    function renderChoice(data) {
      const spread = el("div", "spread");
      const visual = el("section", "visual-side");
      visual.appendChild(renderObjects(data, false));
      const textSide = el("section", "text-side");
      textSide.appendChild(el("h2", "page-title", data.title));
      const card = el("div", "story-card");
      data.text.forEach((line) => card.appendChild(el("p", "story-text", line)));
      const feedback = el("div", "feedback", data.prompt);
      const grid = el("div", "choice-grid");
      data.choices.forEach((choice) => {
        const btn = el("button", "choice-btn", String(choice));
        btn.type = "button";
        btn.addEventListener("click", () => {
          grid.querySelectorAll("button").forEach((b) => b.classList.remove("correct", "wrong"));
          if (String(choice) === String(data.answer)) {
            btn.classList.add("correct");
            feedback.textContent = "Yes. That is right!";
          } else {
            btn.classList.add("wrong");
            feedback.textContent = "Try again. Count what is still here.";
          }
        });
        grid.appendChild(btn);
      });
      card.appendChild(grid);
      card.appendChild(feedback);
      textSide.appendChild(card);
      spread.appendChild(visual);
      spread.appendChild(textSide);
      page.appendChild(spread);
    }

    function renderActivity(data) {
      page.classList.add("wide");
      const spread = el("div", "spread");
      const panel = el("section", "activity-panel");
      const copy = el("div", "activity-copy");
      copy.appendChild(el("h2", "", data.title));
      copy.appendChild(el("p", "", data.text));
      const targetLeft = data.start - data.targetTake;
      const feedback = el("div", "feedback", "Take away " + data.targetTake + ". Try to leave " + targetLeft + ".");
      copy.appendChild(feedback);
      const game = el("div", "takeaway-game");
      const equation = el("div", "count-line", data.start + " take away 0 leaves " + data.start + ".");
      const board = el("div", "game-board");
      let taken = 0;
      for (let i = 0; i < data.start; i += 1) {
        const item = el("button", "game-object " + (data.type || "block"), itemGlyph(data.type, i));
        item.type = "button";
        item.setAttribute("aria-label", (data.label || "object") + " " + (i + 1));
        item.addEventListener("click", () => {
          item.classList.toggle("removed");
          taken = board.querySelectorAll(".removed").length;
          equation.textContent = data.start + " take away " + taken + " leaves " + (data.start - taken) + ".";
          feedback.textContent = taken === data.targetTake
            ? "Good taking away. Now count what is left."
            : "You took away " + taken + ". Count what is left.";
        });
        board.appendChild(item);
      }
      const tools = el("div", "tool-row");
      const check = el("button", "tool-btn", "Check");
      check.type = "button";
      check.addEventListener("click", () => {
        taken = board.querySelectorAll(".removed").length;
        const left = data.start - taken;
        if (taken === data.targetTake) {
          feedback.textContent = "Yes. " + data.start + " take away " + taken + " leaves " + left + ".";
        } else if (taken < data.targetTake) {
          feedback.textContent = "Take away " + (data.targetTake - taken) + " more.";
        } else {
          feedback.textContent = "Too many went away. Tap Start again.";
        }
      });
      const reset = el("button", "tool-btn light", "Start again");
      reset.type = "button";
      reset.addEventListener("click", () => {
        board.querySelectorAll(".removed").forEach((item) => item.classList.remove("removed"));
        taken = 0;
        equation.textContent = data.start + " take away 0 leaves " + data.start + ".";
        feedback.textContent = "Take away " + data.targetTake + ". Try to leave " + targetLeft + ".";
      });
      tools.appendChild(check);
      tools.appendChild(reset);
      game.appendChild(equation);
      game.appendChild(board);
      game.appendChild(tools);
      panel.appendChild(copy);
      panel.appendChild(game);
      spread.appendChild(panel);
      page.appendChild(spread);
    }

    function itemGlyph(type, index) {
      if (type === "star") return "★";
      if (type === "duck") return "●";
      if (type === "apple") return "●";
      if (type === "round") return "●";
      return String(index + 1);
    }

    function render() {
      stopReading(true);
      page.className = "page";
      page.innerHTML = "";
      const data = pages[index];
      page.appendChild(el("div", "page-num", String(index + 1).padStart(2, "0")));
      if (data.kind === "choice") renderChoice(data);
      else if (data.kind === "activity") renderActivity(data);
      else renderStory(data);
      pageLabel.textContent = "Page " + (index + 1) + " of " + pages.length;
      progressFill.style.width = ((index + 1) / pages.length * 100) + "%";
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === pages.length - 1;
      dots.innerHTML = "";
      pages.forEach((_, i) => {
        const dot = el("span", "dot" + (i === index ? " active" : ""));
        dots.appendChild(dot);
      });
    }

    function pageSpeechText() {
      const data = pages[index];
      const lines = [data.title];
      if (Array.isArray(data.text)) lines.push(...data.text);
      else if (data.text) lines.push(data.text);
      if (data.line) lines.push(data.line);
      return lines.join(". ");
    }

    function pageAudioSrc(pageIndex) {
      return "assets/subtraction-playtime/audio/page-" + String(pageIndex + 1).padStart(2, "0") + ".mp3";
    }

    function readPage() {
      stopReading(true);
      usingBrowserVoice = false;
      narrator.src = pageAudioSrc(index);
      narrator.currentTime = 0;
      narrator.load();
      audioStatus.textContent = "Loading voice";
      const playRequest = narrator.play();
      if (playRequest && typeof playRequest.then === "function") {
        playRequest.then(() => {
          speaking = true;
          paused = false;
          readBtn.classList.add("active");
          pauseBtn.classList.remove("active");
          audioStatus.textContent = "ElevenLabs voice";
        }).catch(() => {
          readBrowserVoice("Tap to start");
        });
      }
    }

    function readBrowserVoice(blockedText) {
      if (!("speechSynthesis" in window)) {
        audioStatus.textContent = "No audio";
        return;
      }
      usingBrowserVoice = true;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(pageSpeechText());
      utterance.lang = "en-US";
      utterance.rate = 0.82;
      utterance.pitch = 1.18;
      utterance.onstart = () => {
        speaking = true;
        paused = false;
        readBtn.classList.add("active");
        audioStatus.textContent = blockedText || "Browser voice";
      };
      utterance.onend = () => {
        speaking = false;
        paused = false;
        readBtn.classList.remove("active");
        pauseBtn.classList.remove("active");
        audioStatus.textContent = "Ready";
      };
      window.speechSynthesis.speak(utterance);
    }

    function stopReading(silent) {
      narrator.pause();
      narrator.currentTime = 0;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      speaking = false;
      paused = false;
      usingBrowserVoice = false;
      readBtn.classList.remove("active");
      pauseBtn.classList.remove("active");
      if (!silent) audioStatus.textContent = "Ready";
    }

    prevBtn.addEventListener("click", () => {
      if (index > 0) {
        index -= 1;
        render();
      }
    });
    nextBtn.addEventListener("click", () => {
      if (index < pages.length - 1) {
        index += 1;
        render();
      }
    });
    readBtn.addEventListener("click", readPage);
    pauseBtn.addEventListener("click", () => {
      if (speaking && !paused && !usingBrowserVoice) {
        narrator.pause();
        paused = true;
        pauseBtn.classList.add("active");
        audioStatus.textContent = "Paused";
        return;
      }
      if (paused && !usingBrowserVoice) {
        const playRequest = narrator.play();
        if (playRequest && typeof playRequest.then === "function") {
          playRequest.then(() => {
            paused = false;
            speaking = true;
            pauseBtn.classList.remove("active");
            audioStatus.textContent = "ElevenLabs voice";
          }).catch(() => {
            audioStatus.textContent = "Tap to resume";
          });
        }
        return;
      }
      if (!("speechSynthesis" in window)) return;
      if (speaking && !paused) {
        window.speechSynthesis.pause();
        paused = true;
        pauseBtn.classList.add("active");
        audioStatus.textContent = "Paused";
      } else if (paused) {
        window.speechSynthesis.resume();
        paused = false;
        pauseBtn.classList.remove("active");
        audioStatus.textContent = "Browser voice";
      }
    });
    stopBtn.addEventListener("click", stopReading);
    narrator.addEventListener("ended", () => {
      speaking = false;
      paused = false;
      readBtn.classList.remove("active");
      pauseBtn.classList.remove("active");
      audioStatus.textContent = "Ready";
    });
    narrator.addEventListener("error", () => {
      readBrowserVoice("Browser voice");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") prevBtn.click();
      if (event.key === "ArrowRight") nextBtn.click();
    });

    render();
  </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.mkdirSync(path.dirname(outputCopy), { recursive: true });
fs.writeFileSync(outFile, html, "utf8");
fs.writeFileSync(outputCopy, html, "utf8");
console.log(outFile);
console.log(Buffer.byteLength(html, "utf8") + " bytes");
