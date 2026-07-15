const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outFile = path.join(root, "dist", "pre_quraan", "units", "openmaic-classroom", "fractions-with-pizza-standalone.html");
const outputCopy = path.join(root, "outputs", "openmaic", "fractions-with-pizza-standalone.html");

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fractions with Pizza</title>
  <style>
    :root {
      --ink: #1f2937;
      --muted: #667085;
      --teal: #2f7d73;
      --emerald: #16815f;
      --gold: #d6a531;
      --orange: #f97316;
      --sky: #dff3ff;
      --mint: #dff7ee;
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

    button,
    textarea {
      font: inherit;
    }

    button {
      border: 0;
      cursor: pointer;
    }

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

    .book-shell::before {
      content: "";
      display: none;
      position: absolute;
      inset: 18px auto 18px 50%;
      width: 2px;
      border-radius: 999px;
      background: linear-gradient(transparent, rgba(214, 165, 49, .35), transparent);
      pointer-events: none;
      z-index: 2;
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

    .page.builder-page {
      height: min(540px, calc(100dvh - 198px));
      max-height: calc(100dvh - 198px);
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
      grid-template-columns: minmax(0, 1.48fr) minmax(300px, .72fr);
      gap: clamp(14px, 2.4vw, 30px);
      align-items: stretch;
      min-height: 0;
    }

    .wide .spread {
      grid-template-columns: 1fr;
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
      overflow: auto;
      order: 2;
    }

    .page-title {
      margin: 0;
      color: var(--teal);
      font-size: clamp(1.25rem, 2.05vw, 2rem);
      line-height: 1.05;
      padding: 4px 14px 0;
    }

    .story-card {
      width: 100%;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 9px;
      padding: clamp(9px, 1.05vw, 13px);
      border-radius: 24px;
      background: rgba(255, 253, 247, .96);
      box-shadow: 0 18px 38px rgba(31, 41, 55, .11);
      border: 1px solid rgba(214, 165, 49, .24);
      overflow: auto;
    }

    .story-text {
      margin: 0;
      color: var(--ink);
      font-size: clamp(1rem, 1.23vw, 1.18rem);
      line-height: 1.28;
      font-weight: 800;
      overflow-wrap: anywhere;
    }

    .key-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
      margin-top: auto;
    }

    .key-card {
      min-height: 68px;
      padding: 10px;
      border-radius: 16px;
      font-size: clamp(.95rem, 1.14vw, 1.08rem);
      font-weight: 900;
      line-height: 1.18;
      text-align: center;
      border: 1px solid rgba(214, 165, 49, .20);
      overflow-wrap: normal;
      word-break: normal;
      hyphens: none;
    }

    .text-side .key-strip {
      grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
    }

    .key-card .key-main {
      display: block;
      white-space: nowrap;
    }

    .key-card .key-sub {
      display: block;
    }

    .key-card:nth-child(1) { background: #dff3ff; color: #075985; }
    .key-card:nth-child(2) { background: #dff7ee; color: #166534; }
    .key-card:nth-child(3) { background: #fff0ca; color: #92400e; }

    .visual,
    .visual-side {
      position: relative;
      display: grid;
      place-items: center;
      min-height: 0;
      overflow: hidden;
      border-radius: 28px;
      background: linear-gradient(135deg, #e0f2fe 0%, #fff7e0 62%, #f3e8ff 100%);
      border: 1px solid rgba(255, 255, 255, .72);
      box-shadow: 0 22px 46px rgba(16, 24, 40, .14);
    }

    .visual-side {
      padding: 18px 18px 64px;
    }

    .caption {
      position: absolute;
      left: 6%;
      right: 6%;
      bottom: 6%;
      z-index: 3;
      padding: 9px 13px;
      border-radius: 15px;
      color: var(--emerald);
      background: rgba(255, 253, 247, .94);
      text-align: center;
      font-size: clamp(.95rem, 1.1vw, 1.06rem);
      font-weight: 900;
      box-shadow: 0 10px 20px rgba(31, 41, 55, .08);
    }

    .visual-side > .labels {
      height: 100%;
      align-content: center;
      justify-items: center;
      gap: 10px;
    }

    .visual-side > .compare-row {
      width: 100%;
    }

    .visual-side .pizza-wrap {
      width: min(72%, 360px);
    }

    .visual-whole .pizza-wrap,
    .visual-equal .pizza-wrap {
      width: min(54%, 280px);
    }

    .visual-fraction .fraction-big {
      min-height: 104px;
      font-size: clamp(3rem, 5.5vw, 4.9rem);
    }

    .visual-fraction .labels,
    .visual-whole .labels,
    .visual-equal .labels {
      width: min(94%, 460px);
    }

    .pizza-wrap {
      width: min(82%, 430px);
      aspect-ratio: 1;
      position: relative;
      display: grid;
      place-items: center;
    }

    .pizza {
      width: 100%;
      height: 100%;
      border-radius: 999px;
      border: 22px solid #c47b32;
      background: conic-gradient(var(--orange) 0 var(--fill, 90deg), #fde68a var(--fill, 90deg) 360deg);
      box-shadow: inset 0 0 0 4px rgba(120, 53, 15, .30), 0 18px 30px rgba(31, 41, 55, .16);
      position: relative;
    }

    .pizza.lines-4 {
      background:
        linear-gradient(90deg, transparent 49.4%, rgba(120, 53, 15, .72) 49.4% 50.6%, transparent 50.6%),
        linear-gradient(0deg, transparent 49.4%, rgba(120, 53, 15, .72) 49.4% 50.6%, transparent 50.6%),
        conic-gradient(var(--orange) 0 var(--fill, 90deg), #fde68a var(--fill, 90deg) 360deg);
    }

    .pizza.lines-8 {
      background:
        linear-gradient(90deg, transparent 49.4%, rgba(120, 53, 15, .72) 49.4% 50.6%, transparent 50.6%),
        linear-gradient(0deg, transparent 49.4%, rgba(120, 53, 15, .72) 49.4% 50.6%, transparent 50.6%),
        linear-gradient(45deg, transparent 49.4%, rgba(120, 53, 15, .72) 49.4% 50.6%, transparent 50.6%),
        linear-gradient(-45deg, transparent 49.4%, rgba(120, 53, 15, .72) 49.4% 50.6%, transparent 50.6%),
        conic-gradient(var(--orange) 0 var(--fill, 135deg), #fde68a var(--fill, 135deg) 360deg);
    }

    .pepperoni {
      position: absolute;
      width: 9%;
      aspect-ratio: 1;
      border-radius: 999px;
      background: #b94723;
      box-shadow: inset 0 2px 0 rgba(255,255,255,.18);
    }

    .p1 { left: 31%; top: 21%; }
    .p2 { left: 61%; top: 29%; }
    .p3 { left: 25%; top: 58%; }
    .p4 { left: 54%; top: 66%; }

    .slice-line {
      position: absolute;
      left: calc(50% - 2px);
      top: 0;
      width: 4px;
      height: 50%;
      background: rgba(120, 53, 15, .66);
      transform-origin: 50% 100%;
      border-radius: 999px;
      pointer-events: none;
    }

    .fraction-big {
      display: grid;
      place-items: center;
      min-width: 130px;
      min-height: 150px;
      color: var(--ink);
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(4rem, 8vw, 7rem);
      line-height: .9;
      font-weight: 900;
    }

    .fraction-big .bar {
      width: 100%;
      height: 5px;
      border-radius: 999px;
      background: currentColor;
      margin: 8px 0;
    }

    .labels {
      display: grid;
      gap: 12px;
      width: min(88%, 420px);
    }

    .label-row {
      display: grid;
      grid-template-columns: minmax(112px, auto) 1fr;
      align-items: center;
      gap: 12px;
      padding: 11px 13px;
      border-radius: 16px;
      background: rgba(255,255,255,.82);
      border: 1px solid rgba(214, 165, 49, .22);
      font-size: clamp(.95rem, 1.12vw, 1.08rem);
      font-weight: 900;
      overflow-wrap: normal;
      word-break: normal;
      hyphens: none;
    }

    .label-row b {
      color: var(--teal);
      white-space: nowrap;
    }

    .label-row span {
      min-width: 0;
      overflow-wrap: normal;
    }

    .activity-panel {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: minmax(280px, .72fr) minmax(0, 1fr);
      gap: clamp(14px, 2.4vw, 28px);
      padding: clamp(22px, 3vw, 38px);
      border-radius: 28px;
      background: rgba(255, 253, 247, .94);
      border: 1px solid var(--line);
      box-shadow: 0 20px 48px rgba(16, 24, 40, .11);
      overflow: auto;
    }

    .activity-copy {
      display: grid;
      align-content: center;
      gap: 12px;
      padding: 20px;
      border-radius: 22px;
      background: var(--mint);
    }

    .activity-copy h2 {
      margin: 0;
      color: var(--teal);
      font-size: clamp(1.6rem, 2.9vw, 3rem);
      line-height: 1.05;
    }

    .activity-copy p {
      margin: 0;
      font-size: clamp(1rem, 1.28vw, 1.16rem);
      line-height: 1.42;
      font-weight: 800;
    }

    .question-grid,
    .choice-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .quiz-panel {
      grid-column: 1 / -1;
      display: grid;
      grid-template-rows: auto 1fr;
      gap: clamp(9px, 1.2vw, 14px);
      padding: clamp(16px, 2vw, 26px);
      border-radius: 28px;
      background: rgba(255, 253, 247, .96);
      border: 1px solid var(--line);
      box-shadow: 0 20px 48px rgba(16, 24, 40, .11);
      overflow: auto;
    }

    .quiz-copy {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 7px 14px;
      align-items: start;
      padding-bottom: 10px;
      border-bottom: 3px solid rgba(214, 165, 49, .55);
    }

    .quiz-copy h2 {
      grid-column: 1 / -1;
      margin: 0;
      color: var(--teal);
      font-size: clamp(1.55rem, 2.55vw, 2.65rem);
      line-height: 1.04;
      overflow-wrap: anywhere;
    }

    .quiz-copy p {
      margin: 0;
      max-width: 980px;
      color: var(--ink);
      font-size: clamp(1rem, 1.26vw, 1.16rem);
      line-height: 1.24;
      font-weight: 900;
      overflow-wrap: anywhere;
    }

    .quiz-feedback {
      min-width: 190px;
      min-height: 40px;
      padding: 10px 13px;
      border-radius: 14px;
      color: #134e4a;
      background: #ccfbf1;
      font-size: clamp(.9rem, 1vw, 1rem);
      font-weight: 900;
      line-height: 1.28;
    }

    .quiz-copy .tool-btn {
      min-height: 40px;
      padding: 10px 14px;
      border-width: 2px;
      border-color: rgba(15, 118, 110, .16);
      font-size: clamp(.9rem, 1vw, 1rem);
      white-space: nowrap;
    }

    .quiz-options {
      display: grid;
      align-content: start;
      gap: 8px;
      max-width: 1040px;
      margin: 0 auto;
      width: 100%;
    }

    .quiz-option {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 12px;
      min-height: 58px;
      padding: 10px 14px;
      border-radius: 16px;
      color: var(--ink);
      background: #fff;
      border: 2px solid rgba(15, 118, 110, .13);
      box-shadow: 0 12px 28px rgba(31, 41, 55, .07);
      font-size: clamp(1rem, 1.16vw, 1.1rem);
      font-weight: 900;
      text-align: left;
      overflow-wrap: anywhere;
    }

    .quiz-option::before {
      content: attr(data-letter);
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      color: var(--teal);
      background: var(--mint);
      border: 2px solid rgba(15, 118, 110, .22);
      font-size: .82rem;
      font-weight: 1000;
    }

    .quiz-option.multi::before {
      content: "";
      border-radius: 9px;
      background: #fff;
    }

    .quiz-option:hover {
      border-color: rgba(15, 118, 110, .38);
      background: #f7fffb;
    }

    .quiz-option.selected { border-color: var(--teal); background: #f0fdfa; }
    .quiz-option.multi.selected::before {
      content: "\\2713";
      color: #fff;
      background: var(--teal);
      border-color: var(--teal);
    }
    .quiz-option.correct { border-color: var(--emerald); background: #dcfce7; }
    .quiz-option.wrong { border-color: #fb7185; background: var(--rose); }

    .quiz-action-row {
      display: flex;
      justify-content: flex-start;
      gap: 12px;
      padding-top: 4px;
    }

    .choice-btn,
    .tool-btn {
      min-height: 66px;
      padding: 14px 16px;
      border-radius: 18px;
      color: var(--ink);
      background: #fff;
      border: 3px solid transparent;
      box-shadow: 0 12px 28px rgba(31, 41, 55, .08);
      font-size: clamp(1.05rem, 1.3vw, 1.22rem);
      font-weight: 900;
      text-align: left;
    }

    .choice-btn:hover,
    .tool-btn:hover {
      border-color: rgba(15, 118, 110, .35);
      background: #f7fffb;
    }

    .choice-btn.correct { border-color: var(--emerald); background: #dcfce7; }
    .choice-btn.wrong { border-color: #fb7185; background: var(--rose); }
    .choice-btn.selected,
    .tool-btn.selected { border-color: var(--teal); background: var(--mint); }

    .feedback {
      min-height: 56px;
      padding: 14px 16px;
      border-radius: 18px;
      color: #134e4a;
      background: #ccfbf1;
      font-size: clamp(1.05rem, 1.28vw, 1.18rem);
      font-weight: 900;
      line-height: 1.36;
    }

    .writing-box {
      width: 100%;
      min-height: 190px;
      resize: vertical;
      padding: 18px;
      border: 3px solid rgba(15, 118, 110, .18);
      border-radius: 20px;
      color: var(--ink);
      background: #fff;
      box-shadow: inset 0 2px 10px rgba(31, 41, 55, .04);
      font-size: clamp(1.12rem, 1.42vw, 1.3rem);
      font-weight: 800;
      line-height: 1.45;
    }

    .builder {
      display: grid;
      grid-template-columns: minmax(240px, .75fr) minmax(0, 1fr);
      gap: 18px;
      align-items: center;
    }

    .cafe-game {
      grid-column: 1 / -1;
      position: relative;
      display: grid;
      grid-template-columns: .9fr 1.1fr;
      gap: 12px;
      min-height: 0;
      height: 100%;
      padding: clamp(12px, 1.55vw, 18px);
      border-radius: 24px;
      background:
        radial-gradient(circle at 10% 10%, rgba(255, 237, 213, .95), transparent 34%),
        linear-gradient(135deg, #fffaf0, #fff7df);
      border: 1px solid var(--line);
      box-shadow: 0 20px 48px rgba(16, 24, 40, .12);
      overflow: hidden;
    }

    .cafe-intro {
      position: absolute;
      inset: 0;
      z-index: 5;
      display: grid;
      place-items: center;
      padding: 22px;
      background: rgba(31, 41, 55, .70);
      backdrop-filter: blur(3px);
    }

    .cafe-card {
      width: min(720px, 90%);
      display: grid;
      gap: 18px;
      padding: clamp(24px, 4vw, 42px);
      border-radius: 30px;
      color: var(--ink);
      background: #fffdf7;
      border: 4px solid rgba(255,255,255,.96);
      box-shadow: 0 30px 70px rgba(17, 24, 39, .28);
      text-align: center;
    }

    .cafe-card h2 {
      margin: 0;
      color: var(--ink);
      font-size: clamp(2rem, 4.5vw, 4rem);
      line-height: 1;
    }

    .cafe-card ul {
      margin: 0 auto;
      padding-left: 26px;
      max-width: 600px;
      text-align: left;
      font-size: clamp(1rem, 1.7vw, 1.42rem);
      line-height: 1.35;
      font-weight: 900;
    }

    .cafe-start,
    .serve-btn {
      justify-self: center;
      min-height: 50px;
      padding: 12px 28px;
      border-radius: 16px;
      color: #fff;
      background: #55bfb5;
      box-shadow: inset 0 -5px 0 rgba(15, 118, 110, .32), 0 12px 26px rgba(15, 118, 110, .18);
      font-size: clamp(1.05rem, 1.7vw, 1.45rem);
      font-weight: 1000;
    }

    .cafe-left,
    .cafe-right {
      min-height: 0;
      display: grid;
      gap: 8px;
      align-content: start;
    }

    .target-ticket,
    .cafe-feedback {
      padding: 9px 12px;
      border-radius: 16px;
      background: #fff;
      border: 2px solid rgba(214, 165, 49, .28);
      box-shadow: 0 12px 26px rgba(31, 41, 55, .07);
      font-size: clamp(.95rem, 1.08vw, 1.05rem);
      line-height: 1.18;
      font-weight: 1000;
    }

    .target-ticket span {
      display: block;
      color: var(--muted);
      font-size: .78rem;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .target-ticket strong {
      display: block;
      color: var(--teal);
      font-size: clamp(1.9rem, 3.3vw, 3.05rem);
      line-height: 1;
    }

    .round-strip {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 5px;
    }

    .round-chip {
      min-height: 26px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      color: rgba(31, 41, 55, .7);
      background: rgba(255,255,255,.72);
      border: 1px solid rgba(15, 118, 110, .14);
      font-size: .78rem;
      font-weight: 1000;
    }

    .round-chip.active {
      color: #fff;
      background: var(--teal);
      border-color: var(--teal);
    }

    .round-chip.done {
      color: #166534;
      background: #dcfce7;
      border-color: rgba(22, 101, 52, .25);
    }

    .cafe-stage {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      align-items: center;
      padding: 9px;
      border-radius: 18px;
      background: rgba(255, 255, 255, .74);
      border: 1px solid rgba(214, 165, 49, .22);
    }

    .cafe-stage .pizza-wrap {
      width: min(100%, 142px);
      margin: 0 auto;
    }

    .cup-meter {
      width: min(100%, 112px);
      height: 142px;
      margin: 0 auto;
      display: grid;
      align-items: end;
      padding: 10px 14px;
      border-radius: 16px 16px 28px 28px;
      background: linear-gradient(#fff, #f8fafc);
      border: 6px solid #4b5563;
      border-top-width: 4px;
      box-shadow: inset 0 0 0 3px rgba(255,255,255,.7), 0 14px 26px rgba(31,41,55,.12);
    }

    .cup-fill {
      height: var(--level-height, 0%);
      min-height: 0;
      border-radius: 12px 12px 24px 24px;
      background: linear-gradient(#fcd9a6, #fb923c);
      transition: height .22s ease;
    }

    .cafe-controls {
      display: grid;
      gap: 8px;
    }

    .control-group {
      display: grid;
      gap: 6px;
      padding: 8px;
      border-radius: 16px;
      background: rgba(255,255,255,.74);
      border: 1px solid rgba(214, 165, 49, .20);
    }

    .control-group h3 {
      margin: 0;
      color: var(--teal);
      font-size: clamp(.95rem, 1.12vw, 1.05rem);
    }

    .fraction-buttons {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
    }

    .pizza-button-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    .fraction-buttons .small-btn {
      min-height: 34px;
      font-size: .92rem;
    }

    .cafe-game .serve-btn,
    .cafe-game .tool-btn {
      min-height: 40px;
      padding: 9px 18px;
      font-size: clamp(.98rem, 1.15vw, 1.08rem);
    }

    .game-nav-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 48px;
    }

    .game-icon-btn {
      width: 46px;
      height: 46px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      color: var(--teal);
      background: rgba(255, 255, 255, .92);
      border: 2px solid rgba(52, 105, 96, .16);
      box-shadow: 0 10px 24px rgba(31, 41, 55, .10);
      transition: transform .15s ease, background .15s ease, border-color .15s ease;
    }

    .game-icon-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      background: var(--mint);
      border-color: rgba(52, 105, 96, .34);
    }

    .game-icon-btn:disabled {
      opacity: .38;
      cursor: not-allowed;
      box-shadow: none;
    }

    .game-icon-btn svg {
      width: 24px;
      height: 24px;
      stroke-width: 3;
    }

    .bar-compare {
      width: min(100%, 820px);
      display: grid;
      gap: 18px;
      align-self: center;
    }

    .bar-title {
      color: var(--muted);
      text-align: center;
      font-size: clamp(1.25rem, 1.85vw, 1.55rem);
      font-weight: 900;
    }

    .bar-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 22px;
      align-items: center;
    }

    .bar-card {
      display: grid;
      gap: 10px;
      padding: 18px;
      text-align: center;
      font-weight: 900;
    }

    .bar-card.left { background: #dbeafe; color: #1d4ed8; }
    .bar-card.right { background: #ffedd5; color: #c2410c; }

    .bar-fraction {
      color: var(--ink);
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(1.55rem, 2.45vw, 2.25rem);
      line-height: 1;
    }

    .fraction-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
    }

    .strip-part {
      height: clamp(42px, 7vw, 72px);
      background: rgba(255,255,255,.62);
    }

    .bar-card.left .strip-part.filled { background: #3867e8; }
    .bar-card.right .strip-part.filled { background: #f97316; }

    .bar-symbol {
      color: var(--ink);
      font-size: clamp(2rem, 4vw, 3.4rem);
      font-weight: 900;
    }

    .builder-controls {
      display: grid;
      gap: 12px;
    }

    .number-row {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px;
    }

    .small-btn {
      min-height: 42px;
      border-radius: 14px;
      color: var(--teal);
      background: #fff;
      border: 2px solid rgba(15, 118, 110, .16);
      font-weight: 900;
    }

    .small-btn.selected {
      color: #fff;
      background: var(--teal);
      border-color: var(--teal);
    }

    .compare-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 18px;
      align-items: center;
    }

    .symbol {
      color: var(--teal);
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: 900;
    }

    .controls {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding-top: 6px;
    }

    .dots {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-width: 160px;
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
      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }
      .progress { width: 100%; min-width: 0; }
      .progress-track { flex: 1; width: auto; }
      .book-shell::before { display: none; }
      .page {
        height: min(720px, calc(100dvh - 205px));
        max-height: calc(100dvh - 205px);
        aspect-ratio: auto;
      }
      .spread {
        inset: 70px 18px 24px;
        grid-template-columns: 1fr;
        overflow: auto;
      }
      .visual,
      .visual-side { min-height: 290px; }
      .text-side { order: 2; }
      .visual-side { order: 1; }
      .key-strip,
      .activity-panel,
      .cafe-game,
      .cafe-stage,
      .builder,
      .bar-row,
      .compare-row,
      .question-grid,
      .choice-grid,
      .quiz-copy { grid-template-columns: 1fr; }
      .quiz-feedback { min-width: 0; }
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
          <h1>Fractions with Pizza</h1>
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
        kind: "lesson",
        title: "Welcome to Fraction Food",
        text: [
          "Today we will learn fractions with foods we already know: pizza slices and ice cream scoops.",
          "A fraction tells us how many equal parts we have from one whole."
        ],
        visual: "pizza4",
        numerator: 1,
        denominator: 4,
        fill: 90,
        cards: ["Fraction: part of a whole", "Pizza: equal slices", "Goal: read, build, compare"]
      },
      {
        kind: "lesson",
        title: "What Is a Whole?",
        text: [
          "A whole is one complete thing.",
          "One whole pizza, one whole sandwich, or one full cup can be split into equal parts."
        ],
        visual: "whole",
        cards: ["Whole = complete", "Parts come from one whole", "Fair shares need equal pieces"]
      },
      {
        kind: "lesson",
        title: "Equal Parts Matter",
        text: [
          "Fractions only work well when the parts are equal.",
          "If one slice is tiny and another is huge, the shares are not fair."
        ],
        visual: "equal",
        cards: ["Equal: same size", "Unequal: not fair", "Check before naming a fraction"]
      },
      {
        kind: "lesson",
        title: "Meet the Fraction",
        text: [
          "The top number is the numerator. It tells how many parts we have.",
          "The bottom number is the denominator. It tells how many equal parts make the whole."
        ],
        visual: "fraction",
        numerator: 3,
        denominator: 8,
        fill: 135,
        cards: ["Numerator = top", "Denominator = bottom", "3/8 means 3 out of 8"]
      },
      {
        kind: "quiz",
        title: "Quick Check: Fraction Parts: Question 1",
        prompt: "Which picture idea shows one whole object? Think about snacks. What is one complete thing?",
        choices: [
          ["One whole pizza before any slices are cut", true],
          ["One slice from a pizza", false],
          ["Half of an apple", false],
          ["Three pieces from a chocolate bar", false]
        ],
        correctText: "Correct. One whole pizza is one complete object.",
        wrongText: "Try again. A whole means the complete thing before it is split."
      },
      {
        kind: "quiz",
        title: "Quick Check: Fraction Parts: Question 2",
        prompt: "Which snacks are cut into equal parts? Select all that apply. Equal parts are the same size, like fair shares for friends.",
        multi: true,
        choices: [
          ["A sandwich cut into 2 same-size halves", true],
          ["A brownie cut into 4 same-size squares", true],
          ["A cookie broken into one big piece and one tiny piece", false],
          ["A pizza cut into 3 slices where one slice is much larger", false]
        ],
        correctText: "Yes. Same-size halves and same-size squares are equal parts.",
        wrongText: "Check again. Equal parts must be the same size."
      },
      {
        kind: "quiz",
        title: "Quick Check: Fraction Parts: Question 3",
        prompt: "Which statements about numerator and denominator are true? Select all that apply. Think about the fraction 3/4 of a chocolate bar.",
        multi: true,
        choices: [
          ["The numerator tells how many parts we have or use. In 3/4, the numerator 3 means 3 pieces.", true],
          ["The denominator tells how many equal parts make the whole. In 3/4, the denominator 4 means 4 equal pieces in the whole bar.", true],
          ["The numerator tells how many equal parts make the whole.", false],
          ["The denominator tells the flavor of the food.", false]
        ],
        correctText: "Correct. Numerator is parts we have. Denominator is total equal parts.",
        wrongText: "Try again. Top number means parts we have; bottom number means total equal parts."
      },
      {
        kind: "lesson",
        title: "Pizza Fractions",
        text: [
          "If a pizza is cut into 4 equal slices and 2 slices are shaded, the fraction is 2/4.",
          "We say two fourths because 2 parts are shaded out of 4 equal parts."
        ],
        visual: "pizza4",
        numerator: 2,
        denominator: 4,
        fill: 180,
        cards: ["2 shaded slices", "4 equal slices total", "Fraction = 2/4"]
      },
      {
        kind: "lesson",
        title: "Ice Cream Fractions",
        text: [
          "Fractions are not only for pizza.",
          "A cup filled to 3 out of 4 levels can show 3/4."
        ],
        visual: "icecream",
        cards: ["Whole: one cup", "Numerator: filled levels", "Denominator: equal levels"]
      },
      {
        kind: "builder",
        title: "Build-a-Fraction Game",
        prompt: "Hungry customers want exact fraction treats. Match the pizza and the ice cream cup to the target fraction.",
        denominator: 8
      },
      {
        kind: "lesson",
        title: "Same Amount, New Name",
        text: [
          "Sometimes two fractions can name the same amount.",
          "One half of a pizza is the same amount as two fourths."
        ],
        visual: "equivalent",
        cards: ["1/2 = 2/4", "Same amount", "Different fraction names"]
      },
      {
        kind: "lesson",
        title: "Which Is Bigger?",
        text: [
          "When fractions have the same denominator, compare the numerators.",
          "Three fourths is bigger than one fourth because 3 shaded parts is more than 1 shaded part."
        ],
        visual: "bigger",
        cards: ["Numerator: shaded pizza", "Same denominator: compare numerators", "3/4 is bigger than 1/4"]
      },
      {
        kind: "quiz",
        title: "Food Fraction Challenge: Question 1",
        prompt: "A pizza is cut into 4 equal slices. You eat 1 slice. What fraction of the pizza did you eat?",
        choices: [
          ["1/2", false],
          ["1/4", true],
          ["3/4", false],
          ["4/1", false]
        ],
        correctText: "Correct. You ate 1 out of 4 equal slices.",
        wrongText: "Try again. The eaten slice goes on top; the total 4 slices goes on bottom."
      },
      {
        kind: "quiz",
        title: "Food Fraction Challenge: Question 2",
        prompt: "An ice cream bar is cut into 2 equal parts. You eat 1 part. Which fraction is equivalent to 1/2?",
        choices: [
          ["1/4", false],
          ["2/4", true],
          ["3/4", false],
          ["4/2", false]
        ],
        correctText: "Yes. 2/4 shows the same amount as 1/2.",
        wrongText: "Try again. Equivalent fractions show the same amount."
      },
      {
        kind: "quiz",
        title: "Food Fraction Challenge: Question 3",
        prompt: "Two same-size pizzas are cut into 8 equal slices. Mia eats 3/8 of one pizza. Leo eats 5/8 of the other pizza. Who eats the bigger fraction?",
        choices: [
          ["Mia, because 3 is smaller than 5", false],
          ["Leo, because 5/8 is more slices than 3/8", true],
          ["Mia, because 3/8 is bigger than 5/8", false],
          ["They eat the same amount", false]
        ],
        correctText: "Correct. Leo eats more because 5 eighths is greater than 3 eighths.",
        wrongText: "Try again. Both pizzas have eighths, so compare 5 and 3."
      },
      {
        kind: "quiz",
        title: "Food Fraction Challenge: Question 4",
        prompt: "Which fractions are equivalent to 1/2? Select all that apply.",
        multi: true,
        choices: [
          ["2/4", true],
          ["3/6", true],
          ["2/3", false],
          ["4/8", true]
        ],
        correctText: "Correct. 2/4, 3/6, and 4/8 all show one half.",
        wrongText: "Try again. Look for fractions where the shaded amount is half of the whole."
      },
      {
        kind: "quiz",
        title: "Food Fraction Challenge: Question 5",
        prompt: "Explain in words: Which is bigger, 1/2 of a pizza or 1/4 of the same-size pizza? How do you know?",
        choices: [],
        correctText: "Good explanation. One half is bigger because it is two fourths, and two pieces are more than one piece.",
        wrongText: "Write one or two sentences. Mention that 1/2 is the same as 2/4."
      },
      {
        kind: "lesson",
        title: "Fraction Wrap-Up",
        text: [
          "A fraction names part of a whole.",
          "The numerator tells what we have. The denominator tells the total equal parts.",
          "When parts are equal, fractions help us share, build, and compare."
        ],
        visual: "pizza8",
        numerator: 5,
        denominator: 8,
        fill: 225,
        cards: ["Whole first", "Equal parts next", "Read top over bottom"]
      }
    ];

    const page = document.getElementById("page");
    const pageLabel = document.getElementById("pageLabel");
    const progressFill = document.getElementById("progressFill");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const dots = document.getElementById("dots");
    const readBtn = document.getElementById("readBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const stopBtn = document.getElementById("stopBtn");
    const audioStatus = document.getElementById("audioStatus");
    let index = 0;
    let currentUtterance = null;
    let autoRead = false;

    function el(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    }

    function render() {
      const data = pages[index];
      page.className = "page" + (["quiz", "builder", "compare", "sort"].includes(data.kind) ? " wide" : "") + (data.kind === "builder" ? " builder-page" : "");
      page.innerHTML = "";
      page.appendChild(el("div", "page-num", String(index + 1).padStart(2, "0")));
      if (data.kind === "quiz") renderQuiz(data);
      else if (data.kind === "builder") renderBuilder(data);
      else if (data.kind === "compare") renderCompare(data);
      else if (data.kind === "sort") renderSort(data);
      else renderLesson(data);
      pageLabel.textContent = "Page " + (index + 1) + " of " + pages.length;
      progressFill.style.width = (((index + 1) / pages.length) * 100) + "%";
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === pages.length - 1;
      dots.innerHTML = pages.map((_, i) => '<span class="dot' + (i === index ? " active" : "") + '"></span>').join("");
      if (autoRead) readCurrentPage();
    }

    function renderLesson(data) {
      const spread = el("div", "spread");
      const textSide = el("section", "text-side");
      textSide.appendChild(el("h2", "page-title", data.title));
      const card = el("div", "story-card");
      (data.text || []).forEach((line) => card.appendChild(el("p", "story-text", line)));
      if (data.cards) {
        const strip = el("div", "key-strip");
        data.cards.forEach((item) => {
          const key = el("div", "key-card");
          const parts = String(item).split(":");
          if (parts.length > 1) {
            key.innerHTML = '<span class="key-main">' + parts[0].trim() + '</span><span class="key-sub">' + parts.slice(1).join(":").trim() + '</span>';
          } else {
            key.textContent = item;
          }
          strip.appendChild(key);
        });
        card.appendChild(strip);
      }
      textSide.appendChild(card);
      const visual = el("figure", "visual-side");
      if (data.visual) visual.classList.add("visual-" + data.visual);
      visual.appendChild(renderVisual(data));
      visual.appendChild(el("figcaption", "caption", visualCaption(data)));
      spread.appendChild(visual);
      spread.appendChild(textSide);
      page.appendChild(spread);
    }

    function renderVisual(data) {
      const wrap = el("div", "", "");
      if (data.visual === "fraction") {
        wrap.className = "labels";
        const fraction = el("div", "fraction-big");
        fraction.innerHTML = '<span>' + data.numerator + '</span><span class="bar"></span><span>' + data.denominator + '</span>';
        wrap.appendChild(fraction);
        wrap.appendChild(labelRow("Numerator", "top number: parts we have"));
        wrap.appendChild(labelRow("Denominator", "bottom number: total equal parts"));
        return wrap;
      }
      if (data.visual === "whole") return wholeVisual();
      if (data.visual === "equal") return equalVisual();
      if (data.visual === "icecream") return iceCreamVisual();
      if (data.visual === "equivalent") return equivalentVisual();
      if (data.visual === "bigger") return biggerVisual();
      return pizzaVisual(data.denominator || 8, data.fill || 90);
    }

    function labelRow(title, text) {
      const row = el("div", "label-row");
      row.innerHTML = "<b>" + title + "</b><span>" + text + "</span>";
      return row;
    }

    function pizzaVisual(denominator, fill) {
      const wrap = el("div", "pizza-wrap");
      const pizza = el("div", "pizza lines-" + denominator);
      pizza.style.setProperty("--fill", fill + "deg");
      for (let i = 0; i < denominator; i += 1) {
        const line = el("span", "slice-line");
        line.style.transform = "rotate(" + ((360 / denominator) * i) + "deg)";
        pizza.appendChild(line);
      }
      ["p1", "p2", "p3", "p4"].forEach((cls) => pizza.appendChild(el("span", "pepperoni " + cls)));
      wrap.appendChild(pizza);
      return wrap;
    }

    function wholeVisual() {
      const wrap = el("div", "labels");
      wrap.appendChild(pizzaVisual(4, 360));
      wrap.appendChild(labelRow("Whole pizza", "one complete pizza"));
      wrap.appendChild(labelRow("Whole cup", "one full cup"));
      return wrap;
    }

    function equalVisual() {
      const wrap = el("div", "labels");
      wrap.appendChild(labelRow("Equal parts", "same-size pieces are fair"));
      wrap.appendChild(pizzaVisual(4, 180));
      wrap.appendChild(labelRow("Not equal", "different-size pieces cannot name a fair fraction"));
      return wrap;
    }

    function iceCreamVisual() {
      const wrap = el("div", "labels");
      const cup = el("div", "label-row");
      cup.innerHTML = '<svg viewBox="0 0 360 260" width="100%" height="220" aria-hidden="true"><circle cx="115" cy="56" r="48" fill="#a7f3d0"/><circle cx="170" cy="42" r="55" fill="#fecaca"/><circle cx="225" cy="60" r="48" fill="#fde68a"/><path d="M78 86h204l-28 142H106Z" fill="#fff" stroke="#4b5563" stroke-width="9"/><path d="M104 150h152v39H104z" fill="#fcd9a6"/><path d="M104 189h152v39H104z" fill="#fb923c"/><path d="M83 124h194M83 150h194M83 189h194" stroke="#64748b" stroke-width="3"/><text x="180" y="183" text-anchor="middle" font-size="42" font-family="Georgia" fill="#111827">3/4</text></svg>';
      wrap.appendChild(cup);
      wrap.appendChild(labelRow("Cup fractions", "3 of 4 equal levels are filled"));
      return wrap;
    }

    function equivalentVisual() {
      const wrap = el("div", "compare-row");
      wrap.appendChild(pizzaVisual(4, 180));
      wrap.appendChild(el("div", "symbol", "="));
      wrap.appendChild(pizzaVisual(8, 180));
      return wrap;
    }

    function biggerVisual() {
      const wrap = el("div", "bar-compare");
      wrap.appendChild(el("div", "bar-title", "Compare the shaded amount."));
      const row = el("div", "bar-row");
      row.appendChild(fractionBarCard("left", "3/4", 3, "3 pizza slices"));
      row.appendChild(el("div", "bar-symbol", ">"));
      row.appendChild(fractionBarCard("right", "1/4", 1, "1 pizza slice"));
      wrap.appendChild(row);
      return wrap;
    }

    function fractionBarCard(side, fraction, filled, label) {
      const card = el("div", "bar-card " + side);
      card.appendChild(el("div", "bar-fraction", fraction));
      const strip = el("div", "fraction-strip");
      for (let i = 0; i < 4; i += 1) {
        strip.appendChild(el("span", "strip-part" + (i < filled ? " filled" : "")));
      }
      card.appendChild(strip);
      card.appendChild(el("div", "", label));
      return card;
    }

    function visualCaption(data) {
      if (data.visual === "whole") return "A whole is complete before we split it.";
      if (data.visual === "equal") return "Equal parts make fair fractions.";
      if (data.visual === "fraction") return "Top tells parts we have. Bottom tells total equal parts.";
      if (data.visual === "icecream") return "Fractions can show filled levels, not only slices.";
      if (data.visual === "equivalent") return "1/2 and 2/4 show the same amount.";
      if (data.visual === "bigger") return "Three fourths is greater than one fourth.";
      return "Food makes fractions easier to see.";
    }

    function renderQuiz(data) {
      const spread = el("div", "spread");
      const panel = el("section", "quiz-panel");
      const copy = el("div", "quiz-copy");
      copy.appendChild(el("h2", "", data.title));
      copy.appendChild(el("p", "", data.prompt));
      const initialFeedback = data.choices && data.choices.length
        ? (data.multi ? "Select every correct answer, then check." : "Choose an answer.")
        : "Write your explanation, then check it.";
      const feedback = el("div", "quiz-feedback", initialFeedback);
      copy.appendChild(feedback);

      if (!data.choices || !data.choices.length) {
        const writing = el("div", "quiz-options");
        const textarea = el("textarea", "writing-box");
        textarea.placeholder = "I think ... because ...";
        const check = el("button", "tool-btn", "Check my explanation");
        check.type = "button";
        check.addEventListener("click", () => {
          const text = textarea.value.trim().toLowerCase();
          const mentionsHalf = text.includes("1/2") || text.includes("half");
          const mentionsFourth = text.includes("1/4") || text.includes("fourth");
          const mentionsBigger = text.includes("bigger") || text.includes("larger") || text.includes("more");
          feedback.textContent = mentionsHalf && mentionsFourth && mentionsBigger
            ? data.correctText
            : "Add the key idea: 1/2 is bigger than 1/4 because one half is more pizza.";
        });
        writing.appendChild(textarea);
        writing.appendChild(check);
        panel.appendChild(copy);
        panel.appendChild(writing);
        spread.appendChild(panel);
        page.appendChild(spread);
        return;
      }

      const choices = el("div", "quiz-options");
      data.choices.forEach(([label, correct], index) => {
        const btn = el("button", "quiz-option" + (data.multi ? " multi" : ""), label);
        btn.type = "button";
        btn.dataset.letter = String.fromCharCode(65 + index);
        btn.addEventListener("click", () => {
          if (data.multi) {
            btn.classList.toggle("selected");
            feedback.textContent = "Selected " + choices.querySelectorAll(".selected").length + ". Press Check answer when ready.";
          } else {
            choices.querySelectorAll("button").forEach((item) => item.classList.remove("correct", "wrong", "selected"));
            btn.classList.add(correct ? "correct" : "wrong", "selected");
            feedback.textContent = correct ? data.correctText : data.wrongText;
          }
        });
        choices.appendChild(btn);
      });
      if (data.multi) {
        const check = el("button", "tool-btn", "Check answer");
        check.type = "button";
        check.addEventListener("click", () => {
          let allCorrect = true;
          Array.from(choices.children).forEach((btn, i) => {
            const shouldSelect = Boolean(data.choices[i][1]);
            const selected = btn.classList.contains("selected");
            btn.classList.toggle("correct", selected && shouldSelect);
            btn.classList.toggle("wrong", selected && !shouldSelect);
            if (selected !== shouldSelect) allCorrect = false;
          });
          feedback.textContent = allCorrect ? data.correctText : data.wrongText;
        });
        copy.appendChild(check);
      }
      panel.appendChild(copy);
      panel.appendChild(choices);
      spread.appendChild(panel);
      page.appendChild(spread);
    }

    function renderBuilder(data) {
      const spread = el("div", "spread");
      const game = el("section", "cafe-game");
      const intro = el("div", "cafe-intro");
      const introCard = el("div", "cafe-card");
      introCard.innerHTML = '<h2>Pizza Fraction Cafe</h2><p><strong>Play 5 mini games with different fractions.</strong></p><ul><li>Look at each target fraction.</li><li>Tap pizza slices to match the order.</li><li>Fill the ice cream cup to match the same amount.</li><li>Serve when BOTH foods match.</li></ul><p><strong>Ready, chef? Let us build fractions with food!</strong></p>';
      const start = el("button", "cafe-start", "Start Game");
      start.type = "button";
      introCard.appendChild(start);
      intro.appendChild(introCard);

      const left = el("div", "cafe-left");
      const ticket = el("div", "target-ticket");
      ticket.innerHTML = '<span>Customer order</span><strong id="targetFraction">3/4</strong>';
      const roundStrip = el("div", "round-strip");
      const stage = el("div", "cafe-stage");
      const pizzaArea = el("div", "");
      const cup = el("div", "cup-meter");
      const cupFill = el("div", "cup-fill");
      cup.appendChild(cupFill);
      stage.appendChild(pizzaArea);
      stage.appendChild(cup);
      const feedback = el("div", "cafe-feedback", "Tap Start Game, then make the pizza and cup match the order.");
      left.appendChild(ticket);
      left.appendChild(roundStrip);
      left.appendChild(stage);
      left.appendChild(feedback);

      const right = el("div", "cafe-right");
      const controls = el("div", "cafe-controls");
      const pizzaGroup = el("div", "control-group");
      pizzaGroup.appendChild(el("h3", "", "Pizza slices"));
      const pizzaButtons = el("div", "fraction-buttons");
      pizzaButtons.classList.add("pizza-button-grid");
      const cupGroup = el("div", "control-group");
      cupGroup.appendChild(el("h3", "", "Ice cream cup"));
      const cupButtons = el("div", "fraction-buttons");
      const serve = el("button", "serve-btn", "Serve");
      serve.type = "button";
      const gameNav = el("div", "game-nav-row");
      const previousGame = el("button", "game-icon-btn");
      previousGame.type = "button";
      previousGame.title = "Previous game";
      previousGame.setAttribute("aria-label", "Previous game");
      previousGame.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
      const nextGame = el("button", "game-icon-btn");
      nextGame.type = "button";
      nextGame.title = "Next game";
      nextGame.setAttribute("aria-label", "Next game");
      nextGame.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
      gameNav.appendChild(previousGame);
      gameNav.appendChild(nextGame);
      controls.appendChild(pizzaGroup);
      controls.appendChild(cupGroup);
      controls.appendChild(serve);
      controls.appendChild(gameNav);
      right.appendChild(el("div", "target-ticket", "Match both treats, then serve the customer."));
      right.appendChild(controls);

      const targets = [
        { label: "1/4", denominator: 4, numerator: 1, cup: 1, name: "Quarter Pizza" },
        { label: "3/8", denominator: 8, numerator: 3, cup: 1.5, name: "Three Eighths" },
        { label: "2/6", denominator: 6, numerator: 2, cup: 1.33, name: "Two Sixths" },
        { label: "1/2", denominator: 4, numerator: 2, cup: 2, name: "Half Treat" },
        { label: "1", denominator: 4, numerator: 4, cup: 4, name: "Whole Plate" }
      ];
      let targetIndex = 0;
      let pizzaParts = 0;
      let cupLevel = 0;
      let servedRounds = new Set();

      function setSelected(group, value) {
        group.querySelectorAll("button").forEach((btn) => {
          btn.classList.toggle("selected", String(btn.dataset.value) === String(value));
        });
      }

      function roundChips() {
        roundStrip.innerHTML = "";
        targets.forEach((target, i) => {
          const chip = el("span", "round-chip" + (i === targetIndex ? " active" : "") + (servedRounds.has(i) ? " done" : ""), String(i + 1));
          chip.title = target.name;
          roundStrip.appendChild(chip);
        });
      }

      function fractionLabel(numerator, denominator) {
        if (numerator === 0) return "0";
        if (numerator === denominator) return "1";
        return numerator + "/" + denominator;
      }

      function rebuildPizzaButtons() {
        const target = targets[targetIndex];
        pizzaButtons.innerHTML = "";
        for (let i = 0; i <= target.denominator; i += 1) {
          const btn = el("button", "small-btn", fractionLabel(i, target.denominator));
          btn.type = "button";
          btn.dataset.value = String(i);
          btn.addEventListener("click", () => {
            pizzaParts = i;
            feedback.textContent = "Pizza shows " + fractionLabel(i, target.denominator) + ". Now match the cup too.";
            draw();
          });
          pizzaButtons.appendChild(btn);
        }
      }

      function draw() {
        const target = targets[targetIndex];
        ticket.querySelector("strong").textContent = target.label;
        ticket.querySelector("span").textContent = "Game " + (targetIndex + 1) + " of " + targets.length + ": " + target.name;
        pizzaArea.innerHTML = "";
        pizzaArea.appendChild(pizzaVisual(target.denominator, (pizzaParts / target.denominator) * 360));
        cupFill.style.setProperty("--level-height", (cupLevel / 4 * 100) + "%");
        setSelected(pizzaButtons, pizzaParts);
        setSelected(cupButtons, cupLevel);
        previousGame.disabled = targetIndex === 0;
        nextGame.disabled = targetIndex === targets.length - 1;
        roundChips();
      }

      function changeGame(delta) {
        const nextIndex = Math.max(0, Math.min(targets.length - 1, targetIndex + delta));
        if (nextIndex === targetIndex) return;
        targetIndex = nextIndex;
        pizzaParts = 0;
        cupLevel = 0;
        rebuildPizzaButtons();
        feedback.textContent = "Game " + (targetIndex + 1) + " ready. Match the pizza and cup to " + targets[targetIndex].label + ".";
        draw();
      }

      [0, 1, 1.33, 1.5, 2, 3, 4].forEach((value) => {
        const labels = { 0: "0", 1: "1/4", 1.33: "about 1/3", 1.5: "3/8", 2: "1/2", 3: "3/4", 4: "1" };
        const btn = el("button", "small-btn", labels[value]);
        btn.type = "button";
        btn.dataset.value = String(value);
        btn.addEventListener("click", () => {
          cupLevel = value;
          feedback.textContent = "Cup shows " + labels[value] + ". Check the pizza before serving.";
          draw();
        });
        cupButtons.appendChild(btn);
      });
      pizzaGroup.appendChild(pizzaButtons);
      cupGroup.appendChild(cupButtons);
      start.addEventListener("click", () => {
        intro.style.display = "none";
        feedback.textContent = "Game 1 started. Match both treats to " + targets[targetIndex].label + ".";
      });
      serve.addEventListener("click", () => {
        const target = targets[targetIndex];
        if (pizzaParts === target.numerator && cupLevel === target.cup) {
          servedRounds.add(targetIndex);
          feedback.textContent = targetIndex === targets.length - 1
            ? "Perfect serve. You completed all 5 fraction games."
            : "Perfect serve. Game " + (targetIndex + 1) + " is complete. Tap the next game arrow.";
          draw();
        } else if (pizzaParts < target.numerator || cupLevel < target.cup) {
          feedback.textContent = "Too little. Add more until both treats match " + target.label + ".";
        } else {
          feedback.textContent = "Too much. Try a smaller amount for the target " + target.label + ".";
        }
      });
      previousGame.addEventListener("click", () => changeGame(-1));
      nextGame.addEventListener("click", () => changeGame(1));
      rebuildPizzaButtons();
      draw();

      game.appendChild(intro);
      game.appendChild(left);
      game.appendChild(right);
      spread.appendChild(game);
      page.appendChild(spread);
    }

    function renderCompare(data) {
      const spread = el("div", "spread");
      const panel = el("section", "activity-panel");
      const copy = el("div", "activity-copy");
      copy.appendChild(el("h2", "", data.title));
      copy.appendChild(el("p", "", data.prompt));
      const feedback = el("div", "feedback", "Which side has more shaded pizza?");
      copy.appendChild(feedback);
      const choices = el("div", "compare-row");
      const left = el("button", "tool-btn", "");
      left.innerHTML = '<div class="visual"></div><strong>' + data.left.label + '</strong>';
      left.querySelector(".visual").appendChild(pizzaVisual(data.left.d, data.left.fill));
      const right = el("button", "tool-btn", "");
      right.innerHTML = '<div class="visual"></div><strong>' + data.right.label + '</strong>';
      right.querySelector(".visual").appendChild(pizzaVisual(data.right.d, data.right.fill));
      [left, right].forEach((btn, i) => {
        btn.type = "button";
        btn.addEventListener("click", () => {
          choices.querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
          btn.classList.add("selected");
          const picked = i === 0 ? "left" : "right";
          feedback.textContent = picked === data.answer ? "Correct. 3/8 is bigger than 1/4." : "Try again. 1/4 is 2/8, so 3/8 is larger.";
        });
      });
      choices.appendChild(left);
      choices.appendChild(el("div", "symbol", "?"));
      choices.appendChild(right);
      panel.appendChild(copy);
      panel.appendChild(choices);
      spread.appendChild(panel);
      page.appendChild(spread);
    }

    function renderSort(data) {
      const spread = el("div", "spread");
      const panel = el("section", "activity-panel");
      const copy = el("div", "activity-copy");
      copy.appendChild(el("h2", "", data.title));
      copy.appendChild(el("p", "", data.prompt));
      const feedback = el("div", "feedback", "Choose a card, then choose numerator or denominator.");
      copy.appendChild(feedback);
      const grid = el("div", "question-grid");
      data.items.forEach(([label, target]) => {
        const card = el("button", "choice-btn", label);
        card.type = "button";
        card.addEventListener("click", () => {
          grid.querySelectorAll("button").forEach((item) => item.classList.remove("selected", "correct", "wrong"));
          card.classList.add("selected");
          feedback.textContent = "'" + label + "' belongs with the " + target + ".";
          card.classList.add("correct");
        });
        grid.appendChild(card);
      });
      panel.appendChild(copy);
      panel.appendChild(grid);
      spread.appendChild(panel);
      page.appendChild(spread);
    }

    function pageText(data) {
      if (data.kind === "quiz") return data.title + ". " + data.prompt + " " + data.choices.map((choice) => choice[0]).join(". ");
      if (data.kind === "builder") return data.title + ". " + data.prompt + " Choose a number to shade slices.";
      if (data.kind === "compare") return data.title + ". " + data.prompt;
      if (data.kind === "sort") return data.title + ". " + data.prompt;
      return data.title + ". " + (data.text || []).join(" ");
    }

    function readCurrentPage() {
      stopReading(true);
      if (!("speechSynthesis" in window)) {
        audioStatus.textContent = "No voice";
        return;
      }
      currentUtterance = new SpeechSynthesisUtterance(pageText(pages[index]));
      currentUtterance.rate = .92;
      currentUtterance.pitch = 1.02;
      currentUtterance.onend = () => {
        readBtn.classList.remove("active");
        audioStatus.textContent = "Ready";
      };
      window.speechSynthesis.speak(currentUtterance);
      readBtn.classList.add("active");
      audioStatus.textContent = "Reading";
      autoRead = true;
    }

    function pauseReading() {
      if (!("speechSynthesis" in window)) return;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        audioStatus.textContent = "Reading";
      } else {
        window.speechSynthesis.pause();
        audioStatus.textContent = "Paused";
      }
    }

    function stopReading(silent = false) {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      readBtn.classList.remove("active");
      if (!silent) audioStatus.textContent = "Stopped";
    }

    prevBtn.addEventListener("click", () => {
      if (index > 0) {
        stopReading(true);
        index -= 1;
        render();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (index < pages.length - 1) {
        stopReading(true);
        index += 1;
        render();
      }
    });

    readBtn.addEventListener("click", readCurrentPage);
    pauseBtn.addEventListener("click", pauseReading);
    stopBtn.addEventListener("click", () => {
      autoRead = false;
      stopReading(false);
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") prevBtn.click();
      if (event.key === "ArrowRight") nextBtn.click();
    });

    render();
  </script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.mkdirSync(path.dirname(outputCopy), { recursive: true });
fs.writeFileSync(outFile, html, "utf8");
fs.writeFileSync(outputCopy, html, "utf8");
console.log(outFile);
console.log(Buffer.byteLength(html, "utf8") + " bytes");
