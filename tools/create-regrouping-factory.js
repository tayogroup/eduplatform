const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outFile = path.join(root, "dist", "pre_quraan", "units", "openmaic-classroom", "regrouping-factory-standalone.html");
const outputCopy = path.join(root, "outputs", "openmaic", "regrouping-factory-standalone.html");

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Regrouping Factory</title>
  <style>
    :root {
      --ink: #1f2937;
      --muted: #667085;
      --teal: #2f7d73;
      --teal-dark: #1f6f64;
      --gold: #d6a531;
      --orange: #f97316;
      --blue: #3b82f6;
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
        radial-gradient(circle at 8% 12%, rgba(56, 189, 248, .22), transparent 24%),
        radial-gradient(circle at 88% 10%, rgba(214, 165, 49, .30), transparent 25%),
        radial-gradient(circle at 70% 92%, rgba(249, 115, 22, .16), transparent 30%),
        linear-gradient(135deg, #eaf8f4 0%, #fff6df 48%, #eef7ff 100%);
      font-family: "Trebuchet MS", "Segoe UI", Arial, sans-serif;
      letter-spacing: 0;
    }

    button { border: 0; cursor: pointer; font: inherit; }

    .app {
      width: min(1240px, calc(100vw - 20px));
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
      width: 46px;
      height: 46px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 15px;
      color: #fff;
      background: linear-gradient(135deg, var(--teal), var(--teal-dark));
      font-size: 1.05rem;
      font-weight: 1000;
      box-shadow: 0 12px 28px rgba(15, 118, 110, .22);
    }

    .eyebrow {
      margin: 0;
      color: var(--teal);
      font-size: .78rem;
      font-weight: 1000;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: var(--ink);
      font-size: clamp(1.25rem, 2.1vw, 2rem);
      line-height: 1.05;
    }

    .top-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
    }

    .pill {
      min-height: 40px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      color: var(--teal);
      background: rgba(255,255,255,.84);
      border: 1px solid rgba(232, 223, 205, .95);
      box-shadow: 0 10px 24px rgba(31, 41, 55, .08);
      font-weight: 1000;
      white-space: nowrap;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      color: var(--teal);
      background: #fff;
      border: 1px solid var(--line);
      box-shadow: 0 8px 20px rgba(31, 41, 55, .08);
    }

    .icon-btn:hover { background: var(--mint); }

    .game-shell {
      position: relative;
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
      padding: clamp(8px, 1vw, 12px);
      border: 1px solid rgba(214, 165, 49, .34);
      border-radius: 28px;
      background:
        linear-gradient(135deg, rgba(255, 253, 247, .90), rgba(230, 244, 239, .72)),
        radial-gradient(circle at 18% 20%, rgba(56, 189, 248, .14), transparent 32%),
        radial-gradient(circle at 88% 78%, rgba(250, 204, 21, .16), transparent 28%);
      box-shadow: 0 28px 70px rgba(15, 118, 110, .15), 0 18px 42px rgba(31, 41, 55, .08);
    }

    .mission {
      height: 100%;
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(220px, .78fr) minmax(0, 1.55fr) minmax(250px, .82fr);
      gap: clamp(10px, 1.4vw, 16px);
    }

    .panel {
      min-height: 0;
      overflow: hidden;
      border-radius: 24px;
      background: rgba(255, 253, 247, .96);
      border: 1px solid rgba(214, 165, 49, .25);
      box-shadow: 0 18px 38px rgba(31, 41, 55, .09);
    }

    .left-panel,
    .coach-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: clamp(12px, 1.5vw, 18px);
    }

    .factory-floor {
      position: relative;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      gap: 10px;
      padding: clamp(12px, 1.5vw, 18px);
      background:
        linear-gradient(180deg, rgba(255,253,247,.98), rgba(255,247,224,.74)),
        var(--page);
    }

    .mission-title {
      display: grid;
      gap: 4px;
      padding-bottom: 10px;
      border-bottom: 4px solid rgba(214, 165, 49, .85);
    }

    .mission-title h2 {
      margin: 0;
      color: var(--teal);
      font-size: clamp(1.55rem, 2.6vw, 2.6rem);
      line-height: 1;
    }

    .mission-title p,
    .coach-text {
      margin: 0;
      color: var(--ink);
      font-size: clamp(.98rem, 1.2vw, 1.14rem);
      line-height: 1.28;
      font-weight: 900;
    }

    .order-card {
      display: grid;
      gap: 10px;
      padding: 14px;
      border-radius: 20px;
      background: var(--mint);
      border: 1px solid rgba(15, 118, 110, .18);
    }

    .equation {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2px;
      padding: 10px 14px;
      border-radius: 18px;
      color: var(--ink);
      background: #fff;
      font-size: clamp(1.4rem, 2.5vw, 2.4rem);
      font-weight: 1000;
      text-align: right;
      font-variant-numeric: tabular-nums;
      box-shadow: inset 0 0 0 1px rgba(214, 165, 49, .20);
    }

    .equation .line { border-bottom: 4px solid var(--ink); }

    .level-grid,
    .stars {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .level-btn,
    .action-btn {
      min-height: 44px;
      border-radius: 15px;
      color: var(--teal);
      background: #fff;
      border: 2px solid rgba(15, 118, 110, .16);
      box-shadow: 0 9px 18px rgba(31, 41, 55, .07);
      font-weight: 1000;
    }

    .level-btn.active,
    .action-btn.primary {
      color: #fff;
      background: var(--teal);
      border-color: var(--teal);
    }

    .star-card {
      min-height: 56px;
      display: grid;
      place-items: center;
      gap: 2px;
      padding: 8px;
      border-radius: 16px;
      background: #fff7d6;
      color: #92400e;
      border: 1px solid rgba(214, 165, 49, .24);
      font-weight: 1000;
      text-align: center;
      line-height: 1.1;
    }

    .star-card strong { color: var(--gold); font-size: 1.35rem; line-height: 1; }

    .place-grid {
      min-height: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .place-column,
    .shipping-column,
    .machine {
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      border-radius: 20px;
      background: rgba(255,255,255,.82);
      border: 2px solid rgba(214, 165, 49, .20);
      overflow: hidden;
    }

    .place-column h3,
    .shipping-column h3,
    .machine h3 {
      margin: 0;
      color: var(--teal);
      font-size: clamp(.98rem, 1.2vw, 1.14rem);
      font-weight: 1000;
      text-align: center;
    }

    .stock-count,
    .need-count {
      min-height: 28px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      color: var(--ink);
      background: var(--cream);
      font-weight: 1000;
      font-variant-numeric: tabular-nums;
    }

    .block-bin {
      min-height: 0;
      flex: 1 1 auto;
      display: flex;
      align-content: flex-start;
      align-items: flex-start;
      justify-content: center;
      gap: 5px;
      flex-wrap: wrap;
      overflow: auto;
      padding: 4px;
    }

    .base-block {
      touch-action: none;
      user-select: none;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: .78rem;
      font-weight: 1000;
      border: 2px solid rgba(255,255,255,.78);
      box-shadow: 0 8px 18px rgba(31, 41, 55, .16);
      transition: transform .16s ease, opacity .16s ease;
    }

    .base-block:hover { transform: translateY(-2px); }
    .base-block.dragging { opacity: .45; }

    .hundred {
      width: clamp(54px, 5.4vw, 74px);
      height: clamp(54px, 5.4vw, 74px);
      border-radius: 14px;
      background:
        linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px),
        linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px),
        linear-gradient(135deg, #2563eb, #38bdf8);
      background-size: 10% 10%, 10% 10%, auto;
    }

    .ten {
      width: clamp(26px, 2.8vw, 36px);
      height: clamp(86px, 9vw, 118px);
      border-radius: 13px;
      background:
        linear-gradient(rgba(255,255,255,.26) 1px, transparent 1px),
        linear-gradient(135deg, #16a34a, #5eead4);
      background-size: 100% 10%, auto;
    }

    .one {
      width: clamp(30px, 3.1vw, 42px);
      height: clamp(30px, 3.1vw, 42px);
      border-radius: 11px;
      background: linear-gradient(135deg, #f97316, #facc15);
    }

    .machine-row {
      display: grid;
      grid-template-columns: 1fr minmax(170px, .72fr);
      gap: 10px;
      min-height: 132px;
    }

    .machine {
      position: relative;
      align-items: center;
      justify-content: center;
      min-height: 132px;
      background: linear-gradient(135deg, #fef3c7, #fff7ed);
      border-style: dashed;
    }

    .machine.ready {
      animation: pulseMachine .75s ease-in-out infinite alternate;
      border-color: rgba(249, 115, 22, .72);
    }

    .machine.burst::after {
      content: "10!";
      position: absolute;
      inset: auto 18px 14px auto;
      color: #fff;
      background: var(--orange);
      border-radius: 999px;
      padding: 8px 12px;
      font-weight: 1000;
      animation: pop .55s ease;
    }

    @keyframes pulseMachine {
      from { transform: translateY(0); box-shadow: 0 10px 24px rgba(249, 115, 22, .10); }
      to { transform: translateY(-2px); box-shadow: 0 18px 34px rgba(249, 115, 22, .22); }
    }

    @keyframes pop {
      from { opacity: 0; transform: scale(.5) rotate(-10deg); }
      to { opacity: 1; transform: scale(1) rotate(0); }
    }

    .shipping {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      min-height: 132px;
    }

    .shipping-column {
      background: #f7fffb;
      border-color: rgba(15, 118, 110, .18);
    }

    .shipping-column.over,
    .machine.over,
    .place-column.over {
      outline: 4px solid rgba(56, 189, 248, .42);
      outline-offset: -4px;
    }

    .feedback {
      min-height: 58px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 18px;
      color: #195d54;
      background: #ccfbf1;
      border: 1px solid rgba(15, 118, 110, .16);
      font-size: clamp(.98rem, 1.15vw, 1.12rem);
      font-weight: 1000;
      line-height: 1.2;
    }

    .feedback.warn { color: #9a3412; background: #ffedd5; border-color: rgba(249, 115, 22, .24); }
    .feedback.error { color: #991b1b; background: #fee2e2; border-color: rgba(239, 68, 68, .24); }
    .feedback.success { color: #166534; background: #dcfce7; border-color: rgba(22, 163, 74, .24); }

    .coach-card {
      display: grid;
      gap: 10px;
      padding: 14px;
      border-radius: 20px;
      background: #fff;
      border: 1px solid rgba(214, 165, 49, .22);
    }

    .coach-card h3 {
      margin: 0;
      color: var(--teal);
      font-size: 1.08rem;
    }

    .hint-list {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .hint-list li {
      padding: 9px 10px;
      border-radius: 14px;
      background: var(--sky);
      color: #075985;
      font-weight: 900;
      line-height: 1.2;
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: auto;
    }

    .voice-line {
      padding: 10px 12px;
      border-radius: 16px;
      color: #92400e;
      background: #fff0ca;
      font-weight: 1000;
      line-height: 1.22;
    }

    .toast {
      position: absolute;
      left: 50%;
      top: 16px;
      z-index: 10;
      transform: translateX(-50%);
      padding: 10px 16px;
      border-radius: 999px;
      color: #fff;
      background: var(--teal);
      box-shadow: 0 16px 34px rgba(31, 41, 55, .18);
      font-weight: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity .2s ease, transform .2s ease;
    }

    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(6px);
    }

    @media (max-width: 980px) {
      .topbar { align-items: flex-start; flex-direction: column; }
      .mission {
        overflow: auto;
        grid-template-columns: 1fr;
      }
      .game-shell { overflow: auto; }
      .factory-floor { min-height: 720px; }
      .machine-row { grid-template-columns: 1fr; }
      .shipping { min-height: 240px; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">QA</div>
        <div>
          <p class="eyebrow">Synthesis-Style Math Lab</p>
          <h1>Regrouping Factory</h1>
        </div>
      </div>
      <div class="top-actions">
        <button class="icon-btn" id="voiceBtn" type="button" aria-label="Read instructions">
          <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
        </button>
        <span class="pill" id="levelPill">Level 1</span>
        <span class="pill" id="problemPill">Problem 1</span>
      </div>
    </header>

    <section class="game-shell">
      <div class="toast" id="toast">Nice strategy!</div>
      <div class="mission">
        <aside class="panel left-panel">
          <div class="mission-title">
            <p class="eyebrow">Toy Factory Mission</p>
            <h2 id="missionTitle">Build the order</h2>
            <p id="storyText">A customer ordered toys. Ship the order and count what stays in stock.</p>
          </div>

          <div class="order-card">
            <p class="eyebrow">Customer Order</p>
            <div class="equation" aria-live="polite">
              <div id="topNumber">58</div>
              <div class="line" id="bottomNumber">- 24</div>
              <div id="answerLine">= ?</div>
            </div>
          </div>

          <div>
            <p class="eyebrow">Adaptive Levels</p>
            <div class="level-grid" id="levelGrid"></div>
          </div>

          <div>
            <p class="eyebrow">Progress Stars</p>
            <div class="stars">
              <div class="star-card"><strong id="accuracyStars">☆</strong>Accuracy</div>
              <div class="star-card"><strong id="strategyStars">☆</strong>Strategy</div>
              <div class="star-card"><strong id="persistenceStars">☆</strong>Persistence</div>
              <div class="star-card"><strong id="streakStars">☆</strong>Streak</div>
            </div>
          </div>
        </aside>

        <section class="panel factory-floor">
          <div class="feedback" id="feedback">Start with the ones. Drag blocks into the shipping bins.</div>

          <div class="place-grid" id="stockGrid">
            <div class="place-column" data-place="h" id="stock-h"><h3>Hundreds</h3><div class="stock-count" id="count-h">0</div><div class="block-bin" id="bin-h"></div></div>
            <div class="place-column" data-place="t" id="stock-t"><h3>Tens</h3><div class="stock-count" id="count-t">0</div><div class="block-bin" id="bin-t"></div></div>
            <div class="place-column" data-place="o" id="stock-o"><h3>Ones</h3><div class="stock-count" id="count-o">0</div><div class="block-bin" id="bin-o"></div></div>
          </div>

          <div class="machine-row">
            <div class="shipping" id="shipping">
              <div class="shipping-column" data-place="h" id="ship-h"><h3>Ship Hundreds</h3><div class="need-count" id="need-h">Need 0</div><div class="block-bin" id="shipbin-h"></div></div>
              <div class="shipping-column" data-place="t" id="ship-t"><h3>Ship Tens</h3><div class="need-count" id="need-t">Need 0</div><div class="block-bin" id="shipbin-t"></div></div>
              <div class="shipping-column" data-place="o" id="ship-o"><h3>Ship Ones</h3><div class="need-count" id="need-o">Need 0</div><div class="block-bin" id="shipbin-o"></div></div>
            </div>
            <div class="machine" id="machine" aria-label="Regroup machine">
              <h3>Regroup Machine</h3>
              <p class="coach-text">Drop 1 ten here to make 10 ones. Drop 1 hundred here to make 10 tens.</p>
            </div>
          </div>
        </section>

        <aside class="panel coach-panel">
          <div class="coach-card">
            <h3>AI Math Coach</h3>
            <p class="coach-text" id="coachText">I will watch your moves and give hints without telling the answer too soon.</p>
            <ul class="hint-list" id="hintList">
              <li>Start in the ones place.</li>
              <li>If there are not enough ones, regroup one ten.</li>
            </ul>
          </div>

          <div class="coach-card">
            <h3>Tap Helper</h3>
            <p class="coach-text">No mouse? Tap these buttons to move blocks.</p>
            <div class="actions">
              <button class="action-btn" data-action="ship" data-place="o">Ship 1 one</button>
              <button class="action-btn" data-action="regroup" data-place="t">Break 1 ten</button>
              <button class="action-btn" data-action="ship" data-place="t">Ship 1 ten</button>
              <button class="action-btn" data-action="regroup" data-place="h">Break 1 hundred</button>
              <button class="action-btn" data-action="ship" data-place="h">Ship 1 hundred</button>
              <button class="action-btn primary" id="checkBtn">Check stock</button>
            </div>
          </div>

          <div class="coach-card">
            <h3>Voice-Friendly Steps</h3>
            <div class="voice-line" id="voiceLine">First subtract ones. Then tens. Then hundreds.</div>
            <div class="actions">
              <button class="action-btn" id="hintBtn">Hint</button>
              <button class="action-btn" id="resetBtn">Reset</button>
              <button class="action-btn primary" id="nextBtn">Next mission</button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>

  <script>
    const levels = [
      {
        label: "Level 1",
        name: "No regrouping",
        problems: [
          { top: 58, bottom: 24, story: "A toy train shop has 58 toys. A customer orders 24." },
          { top: 76, bottom: 35, story: "The factory has 76 robots. A class orders 35." }
        ]
      },
      {
        label: "Level 2",
        name: "Regroup ones",
        problems: [
          { top: 52, bottom: 27, story: "The factory has 52 plush bears. A customer orders 27." },
          { top: 81, bottom: 46, story: "The factory has 81 cars. A store orders 46." }
        ]
      },
      {
        label: "Level 3",
        name: "Regroup hundreds",
        problems: [
          { top: 314, bottom: 158, story: "The factory has 314 mini toys. A school orders 158." },
          { top: 405, bottom: 236, story: "The factory has 405 blocks. A big class orders 236." }
        ]
      },
      {
        label: "Level 4",
        name: "Word problems",
        problems: [
          { top: 623, bottom: 287, story: "A toy factory made 623 toy animals. It shipped 287 to a shop. How many stayed?" },
          { top: 450, bottom: 168, story: "There were 450 puzzle boxes. Families bought 168. How many are left?" }
        ]
      }
    ];

    const places = ["h", "t", "o"];
    const placeNames = { h: "hundreds", t: "tens", o: "ones" };
    const placeValues = { h: 100, t: 10, o: 1 };
    const state = {
      level: 0,
      problem: 0,
      available: { h: 0, t: 0, o: 0 },
      shipped: { h: 0, t: 0, o: 0 },
      mistakes: 0,
      moves: 0,
      hints: 0,
      regrouped: false,
      persistence: 0,
      streak: 0,
      dragged: null
    };

    const els = {
      levelPill: document.getElementById("levelPill"),
      problemPill: document.getElementById("problemPill"),
      missionTitle: document.getElementById("missionTitle"),
      storyText: document.getElementById("storyText"),
      topNumber: document.getElementById("topNumber"),
      bottomNumber: document.getElementById("bottomNumber"),
      answerLine: document.getElementById("answerLine"),
      feedback: document.getElementById("feedback"),
      coachText: document.getElementById("coachText"),
      hintList: document.getElementById("hintList"),
      voiceLine: document.getElementById("voiceLine"),
      machine: document.getElementById("machine"),
      toast: document.getElementById("toast"),
      levelGrid: document.getElementById("levelGrid"),
      accuracyStars: document.getElementById("accuracyStars"),
      strategyStars: document.getElementById("strategyStars"),
      persistenceStars: document.getElementById("persistenceStars"),
      streakStars: document.getElementById("streakStars")
    };

    function digits(number) {
      return {
        h: Math.floor(number / 100),
        t: Math.floor((number % 100) / 10),
        o: number % 10
      };
    }

    function activeProblem() {
      return levels[state.level].problems[state.problem];
    }

    function required() {
      return digits(activeProblem().bottom);
    }

    function remainingToShip(place) {
      return required()[place] - state.shipped[place];
    }

    function answerValue() {
      return places.reduce((sum, place) => sum + state.available[place] * placeValues[place], 0);
    }

    function expectedAnswer() {
      const p = activeProblem();
      return p.top - p.bottom;
    }

    function setupLevels() {
      els.levelGrid.innerHTML = "";
      levels.forEach((level, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "level-btn" + (index === state.level ? " active" : "");
        btn.textContent = level.label;
        btn.title = level.name;
        btn.addEventListener("click", () => {
          state.level = index;
          state.problem = 0;
          startProblem();
        });
        els.levelGrid.appendChild(btn);
      });
    }

    function startProblem() {
      const p = activeProblem();
      const d = digits(p.top);
      state.available = { ...d };
      state.shipped = { h: 0, t: 0, o: 0 };
      state.mistakes = 0;
      state.moves = 0;
      state.hints = 0;
      state.regrouped = false;
      els.levelPill.textContent = levels[state.level].label + ": " + levels[state.level].name;
      els.problemPill.textContent = "Problem " + (state.problem + 1) + " of " + levels[state.level].problems.length;
      els.missionTitle.textContent = "Ship " + p.bottom + " toys";
      els.storyText.textContent = p.story;
      els.topNumber.textContent = String(p.top);
      els.bottomNumber.textContent = "- " + p.bottom;
      els.answerLine.textContent = "= ?";
      setFeedback("Start with the ones. Ship the order by dragging blocks to the shipping bins.", "good");
      setCoach(["Start in the ones place.", "If there are not enough ones, trade one ten.", "After trading, remember the ten is gone."]);
      setupLevels();
      render();
    }

    function render() {
      const req = required();
      places.forEach((place) => {
        document.getElementById("count-" + place).textContent = state.available[place] + " " + placeNames[place];
        document.getElementById("need-" + place).textContent = "Need " + Math.max(0, req[place] - state.shipped[place]);
        renderBlocks("bin-" + place, place, state.available[place], "stock");
        renderBlocks("shipbin-" + place, place, state.shipped[place], "shipped");
      });
      els.machine.classList.toggle("ready", shouldRegroupTens() || shouldRegroupHundreds());
      updateStars(false);
    }

    function renderBlocks(binId, place, count, source) {
      const bin = document.getElementById(binId);
      bin.innerHTML = "";
      for (let i = 0; i < count; i += 1) {
        const block = document.createElement("button");
        block.type = "button";
        block.className = "base-block " + blockClass(place);
        block.draggable = source === "stock";
        block.textContent = blockLabel(place);
        block.dataset.place = place;
        block.dataset.source = source;
        block.setAttribute("aria-label", blockLabel(place) + " block");
        if (source === "stock") {
          block.addEventListener("dragstart", onDragStart);
          block.addEventListener("dragend", onDragEnd);
          block.addEventListener("click", () => quickShip(place));
        }
        bin.appendChild(block);
      }
    }

    function blockClass(place) {
      return place === "h" ? "hundred" : place === "t" ? "ten" : "one";
    }

    function blockLabel(place) {
      return place === "h" ? "100" : place === "t" ? "10" : "1";
    }

    function onDragStart(event) {
      state.dragged = event.currentTarget.dataset.place;
      event.currentTarget.classList.add("dragging");
      event.dataTransfer.setData("text/plain", state.dragged);
    }

    function onDragEnd(event) {
      event.currentTarget.classList.remove("dragging");
      document.querySelectorAll(".over").forEach((node) => node.classList.remove("over"));
    }

    function installDropZones() {
      document.querySelectorAll(".shipping-column").forEach((zone) => {
        zone.addEventListener("dragover", allowDrop);
        zone.addEventListener("dragenter", () => zone.classList.add("over"));
        zone.addEventListener("dragleave", () => zone.classList.remove("over"));
        zone.addEventListener("drop", (event) => {
          event.preventDefault();
          zone.classList.remove("over");
          shipBlock(event.dataTransfer.getData("text/plain"), zone.dataset.place);
        });
      });
      els.machine.addEventListener("dragover", allowDrop);
      els.machine.addEventListener("dragenter", () => els.machine.classList.add("over"));
      els.machine.addEventListener("dragleave", () => els.machine.classList.remove("over"));
      els.machine.addEventListener("drop", (event) => {
        event.preventDefault();
        els.machine.classList.remove("over");
        regroup(event.dataTransfer.getData("text/plain"));
      });
    }

    function allowDrop(event) {
      event.preventDefault();
    }

    function quickShip(place) {
      shipBlock(place, place);
    }

    function shipBlock(blockPlace, targetPlace) {
      if (!blockPlace) return;
      if (blockPlace !== targetPlace) {
        mistake("That block belongs in the " + placeNames[blockPlace] + " shipping bin. Match place values.");
        setCoach(["Place value matters.", "Hundreds go with hundreds, tens with tens, ones with ones."]);
        return;
      }
      if (state.available[blockPlace] <= 0) {
        if (blockPlace === "o" && shouldRegroupTens()) {
          mistake("There are not enough ones. Trade one ten in the regroup machine first.");
        } else if (blockPlace === "t" && shouldRegroupHundreds()) {
          mistake("There are not enough tens. Trade one hundred in the regroup machine first.");
        } else {
          mistake("No " + placeNames[blockPlace] + " blocks are available.");
        }
        return;
      }
      if (remainingToShip(blockPlace) <= 0) {
        mistake("You already shipped enough " + placeNames[blockPlace] + ". Check the order card.");
        return;
      }
      if (blockPlace === "t" && remainingToShip("o") > 0) {
        warn("Try finishing the ones place first. Column subtraction starts on the right.");
      }
      if (blockPlace === "h" && (remainingToShip("o") > 0 || remainingToShip("t") > 0)) {
        warn("Finish ones and tens before hundreds.");
      }
      state.available[blockPlace] -= 1;
      state.shipped[blockPlace] += 1;
      state.moves += 1;
      success("Shipped 1 " + singular(blockPlace) + ". Keep checking the order.");
      afterAction();
    }

    function regroup(place) {
      if (place === "o") {
        mistake("A one cannot be broken into smaller factory blocks.");
        return;
      }
      if (state.available[place] <= 0) {
        mistake("There is no " + singular(place) + " to regroup.");
        return;
      }
      if (place === "t") {
        if (!shouldRegroupTens()) {
          mistake("Regroup from tens only when the ones place needs more ones.");
          setCoach(["Common mistake: subtracting a larger ones digit from a smaller one.", "Check the ones need before trading."]);
          return;
        }
        state.available.t -= 1;
        state.available.o += 10;
        state.regrouped = true;
        animateMachine();
        success("Factory trade: 1 ten became 10 ones. The tens stock went down by 1.");
      } else if (place === "h") {
        if (!shouldRegroupHundreds()) {
          mistake("Regroup from hundreds only when the tens place needs more tens.");
          setCoach(["Wrong-place regrouping alert.", "If ones need help, trade a ten. If tens need help, trade a hundred."]);
          return;
        }
        state.available.h -= 1;
        state.available.t += 10;
        state.regrouped = true;
        animateMachine();
        success("Factory trade: 1 hundred became 10 tens. The hundreds stock went down by 1.");
      }
      state.moves += 1;
      afterAction();
    }

    function shouldRegroupTens() {
      return remainingToShip("o") > 0 && state.available.o < remainingToShip("o") && state.available.t > 0;
    }

    function shouldRegroupHundreds() {
      return remainingToShip("t") > 0 && state.available.t < remainingToShip("t") && state.available.h > 0 && remainingToShip("o") <= 0;
    }

    function afterAction() {
      state.persistence += 1;
      render();
      if (isOrderComplete()) {
        const answer = answerValue();
        if (answer === expectedAnswer()) {
          state.streak += 1;
          els.answerLine.textContent = "= " + answer;
          updateStars(true);
          showToast("Mission complete!");
          setFeedback("Order shipped. " + expectedAnswer() + " toys stay in stock. Great strategy!", "success");
          setCoach(["You used place value.", "You changed a ten or hundred only when needed.", "Ready for the next factory order?"]);
        } else {
          mistake("Something is off. Your stock says " + answer + ", but the factory needs a different amount. Use a hint.");
        }
      }
    }

    function isOrderComplete() {
      const req = required();
      return places.every((place) => state.shipped[place] === req[place]);
    }

    function checkStock() {
      if (!isOrderComplete()) {
        const next = places.slice().reverse().find((place) => remainingToShip(place) > 0);
        if (next === "o" && shouldRegroupTens()) {
          warn("You still need ones, but there are not enough. Drag one ten into the regroup machine.");
        } else if (next === "t" && shouldRegroupHundreds()) {
          warn("You still need tens, but there are not enough. Drag one hundred into the regroup machine.");
        } else if (next) {
          warn("The order still needs more " + placeNames[next] + ".");
        }
        return;
      }
      afterAction();
    }

    function hint() {
      state.hints += 1;
      if (remainingToShip("o") > 0) {
        if (shouldRegroupTens()) {
          setFeedback("Hint: the ones place needs " + remainingToShip("o") + ", but only has " + state.available.o + ". Trade one ten.", "warn");
          setCoach(["Do not do " + required().o + " minus " + digits(activeProblem().top).o + ".", "Trade 1 ten for 10 ones.", "Then subtract the ones."]);
        } else {
          setFeedback("Hint: ship " + remainingToShip("o") + " more ones.", "good");
        }
      } else if (remainingToShip("t") > 0) {
        if (shouldRegroupHundreds()) {
          setFeedback("Hint: the tens place needs more tens. Trade one hundred.", "warn");
        } else {
          setFeedback("Hint: ship " + remainingToShip("t") + " more tens.", "good");
        }
      } else if (remainingToShip("h") > 0) {
        setFeedback("Hint: ship " + remainingToShip("h") + " more hundreds.", "good");
      } else {
        setFeedback("All shipping bins match the order. Press Check stock.", "success");
      }
      updateStars(false);
    }

    function nextProblem() {
      if (state.problem < levels[state.level].problems.length - 1) {
        state.problem += 1;
      } else if (state.level < levels.length - 1) {
        state.level += 1;
        state.problem = 0;
      } else {
        state.level = 0;
        state.problem = 0;
      }
      startProblem();
    }

    function updateStars(done) {
      const accuracy = state.mistakes === 0 ? 3 : state.mistakes <= 2 ? 2 : 1;
      const strategy = state.regrouped || state.level === 0 ? 3 : 2;
      const persistence = state.persistence >= 8 ? 3 : state.persistence >= 4 ? 2 : 1;
      const streak = Math.min(3, Math.max(1, state.streak + (done ? 1 : 0)));
      els.accuracyStars.textContent = stars(accuracy);
      els.strategyStars.textContent = stars(strategy);
      els.persistenceStars.textContent = stars(persistence);
      els.streakStars.textContent = stars(streak);
    }

    function stars(count) {
      return "★".repeat(count) + "☆".repeat(3 - count);
    }

    function setCoach(items) {
      els.hintList.innerHTML = "";
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        els.hintList.appendChild(li);
      });
      els.coachText.textContent = items[0] || "Try a careful place-value move.";
      els.voiceLine.textContent = items.join(" ");
    }

    function setFeedback(message, type) {
      els.feedback.className = "feedback" + (type === "warn" ? " warn" : type === "error" ? " error" : type === "success" ? " success" : "");
      els.feedback.textContent = message;
    }

    function success(message) {
      setFeedback(message, "success");
    }

    function warn(message) {
      setFeedback(message, "warn");
    }

    function mistake(message) {
      state.mistakes += 1;
      setFeedback(message, "error");
      updateStars(false);
    }

    function singular(place) {
      return place === "h" ? "hundred" : place === "t" ? "ten" : "one";
    }

    function animateMachine() {
      els.machine.classList.add("burst");
      window.setTimeout(() => els.machine.classList.remove("burst"), 650);
    }

    function showToast(message) {
      els.toast.textContent = message;
      els.toast.classList.add("show");
      window.setTimeout(() => els.toast.classList.remove("show"), 1400);
    }

    function speak() {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(els.storyText.textContent + ". " + els.voiceLine.textContent + ". " + els.feedback.textContent);
      utterance.lang = "en-US";
      utterance.rate = .9;
      utterance.pitch = 1.08;
      window.speechSynthesis.speak(utterance);
    }

    document.getElementById("voiceBtn").addEventListener("click", speak);
    document.getElementById("hintBtn").addEventListener("click", hint);
    document.getElementById("resetBtn").addEventListener("click", startProblem);
    document.getElementById("nextBtn").addEventListener("click", nextProblem);
    document.getElementById("checkBtn").addEventListener("click", checkStock);
    document.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.action === "ship") shipBlock(btn.dataset.place, btn.dataset.place);
        if (btn.dataset.action === "regroup") regroup(btn.dataset.place);
      });
    });
    installDropZones();
    startProblem();
  </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.mkdirSync(path.dirname(outputCopy), { recursive: true });
fs.writeFileSync(outFile, html, "utf8");
fs.writeFileSync(outputCopy, html, "utf8");
console.log(outFile);
console.log(Buffer.byteLength(html, "utf8") + " bytes");
