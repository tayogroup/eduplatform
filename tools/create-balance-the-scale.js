const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outFile = path.join(root, "dist", "pre_quraan", "units", "openmaic-classroom", "balance-the-scale-standalone.html");
const outputCopy = path.join(root, "outputs", "openmaic", "balance-the-scale-standalone.html");

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Balance the Scale</title>
  <style>
    :root {
      --ink: #1f2937;
      --muted: #687386;
      --teal: #2f7d73;
      --teal-dark: #1f6f64;
      --gold: #d6a531;
      --orange: #f97316;
      --blue: #3978d7;
      --purple: #8b5cf6;
      --pink: #ec4899;
      --lime: #84cc16;
      --mint: #dff7ee;
      --sky: #dff3ff;
      --cream: #fff7e0;
      --rose: #ffe4e6;
      --page: #fffdf7;
      --line: #e8dfcd;
      --shadow: 0 22px 52px rgba(31, 41, 55, .14);
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
        radial-gradient(circle at 7% 14%, rgba(56, 189, 248, .34), transparent 25%),
        radial-gradient(circle at 90% 12%, rgba(250, 204, 21, .38), transparent 27%),
        radial-gradient(circle at 84% 82%, rgba(236, 72, 153, .18), transparent 28%),
        radial-gradient(circle at 14% 88%, rgba(132, 204, 22, .18), transparent 28%),
        linear-gradient(135deg, #dcf7ff 0%, #fff1b8 42%, #f4ddff 100%);
      font-family: "Trebuchet MS", "Segoe UI", Arial, sans-serif;
      letter-spacing: 0;
    }

    button { border: 0; cursor: pointer; font: inherit; }

    .app {
      width: min(1260px, calc(100vw - 18px));
      height: 100dvh;
      margin: 0 auto;
      padding: 6px 0;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 4px;
      flex: 0 0 auto;
      flex-wrap: wrap;
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
      border-radius: 14px;
      background: linear-gradient(135deg, var(--teal), #39b59f);
      color: white;
      display: grid;
      place-items: center;
      font-size: 21px;
      font-weight: 900;
      box-shadow: 0 12px 26px rgba(47, 125, 115, .24);
      flex: 0 0 auto;
    }

    .eyebrow {
      color: var(--teal);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: clamp(28px, 2.7vw, 42px);
      line-height: .98;
      letter-spacing: 0;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 900;
      color: #59657a;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .pill {
      border-radius: 999px;
      background: rgba(255, 255, 255, .84);
      border: 1px solid var(--line);
      box-shadow: 0 10px 24px rgba(31, 41, 55, .08);
      padding: 9px 13px;
      white-space: nowrap;
    }

    .voice {
      min-width: 40px;
      height: 40px;
      padding: 0 12px;
      border-radius: 999px;
      background: white;
      border: 1px solid var(--line);
      color: var(--teal);
      display: grid;
      place-items: center;
      font-weight: 900;
      box-shadow: 0 10px 24px rgba(31, 41, 55, .08);
    }

    .voice.listening {
      color: white;
      border-color: #f97316;
      background: linear-gradient(135deg, #f97316, #ec4899);
      animation: voicePulse 1.1s ease-in-out infinite;
    }

    .voice:disabled {
      cursor: wait;
      opacity: .78;
    }

    @keyframes voicePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }

    .voice-dialog {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background: rgba(15, 23, 42, .28);
      backdrop-filter: blur(4px);
    }

    .voice-dialog.open { display: flex; }

    .voice-card {
      width: min(620px, calc(100vw - 28px));
      background: linear-gradient(145deg, #fffefa, #f0fdfa);
      border: 2px solid rgba(214, 165, 49, .34);
      border-radius: 26px;
      padding: 22px;
      box-shadow: 0 24px 70px rgba(15, 23, 42, .22);
    }

    .voice-card h3 {
      margin: 0 0 8px;
      color: var(--teal);
      font-size: clamp(24px, 2.6vw, 36px);
    }

    .voice-card p {
      margin: 0 0 14px;
      color: #48566e;
      font-size: clamp(15px, 1.4vw, 19px);
      font-weight: 800;
      line-height: 1.35;
    }

    .voice-input {
      width: 100%;
      border: 2px solid #cfe4e1;
      border-radius: 18px;
      padding: 14px 16px;
      color: var(--ink);
      font: 900 clamp(16px, 1.6vw, 22px)/1.25 "Nunito", "Arial", sans-serif;
      outline: none;
      background: #fff;
    }

    .voice-input:focus {
      border-color: var(--teal);
      box-shadow: 0 0 0 4px rgba(47, 125, 115, .14);
    }

    .voice-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 14px;
    }

    .voice-actions button {
      border: 2px solid #d9e8e5;
      border-radius: 16px;
      padding: 12px;
      background: #fff;
      color: var(--teal);
      font-weight: 950;
      font-size: clamp(14px, 1.2vw, 18px);
      cursor: pointer;
    }

    .voice-actions .primary {
      background: var(--teal);
      color: #fff;
      border-color: var(--teal);
    }

    .size-control {
      display: flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      background: rgba(255,255,255,.86);
      border: 1px solid var(--line);
      box-shadow: 0 10px 24px rgba(31, 41, 55, .08);
      padding: 4px;
    }

    .size-btn {
      width: 30px;
      height: 30px;
      border-radius: 999px;
      background: linear-gradient(135deg, #e0f2fe, #fff7d6);
      color: var(--teal);
      border: 1px solid #cfe6df;
      display: grid;
      place-items: center;
      font-size: 19px;
      font-weight: 900;
    }

    .size-label {
      min-width: 46px;
      text-align: center;
      font-size: 13px;
      color: var(--muted);
    }

    .progress {
      width: 210px;
      height: 10px;
      border-radius: 999px;
      background: rgba(47, 125, 115, .14);
      overflow: hidden;
    }

    .progress span {
      display: block;
      height: 100%;
      width: 0%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--teal), var(--gold), var(--orange));
      transition: width .35s ease;
    }

    .stage {
      flex: 1 1 auto;
      min-height: 0;
      border-radius: 30px;
      background:
        radial-gradient(circle at 50% 100%, rgba(45,212,191,.18), transparent 35%),
        linear-gradient(135deg, rgba(255,255,255,.80), rgba(255,247,224,.78)),
        radial-gradient(circle at 20% 12%, rgba(59,130,246,.16), transparent 24%),
        repeating-linear-gradient(135deg, rgba(47,125,115,.035) 0 10px, rgba(214,165,49,.035) 10px 20px);
      border: 3px solid rgba(255, 255, 255, .72);
      box-shadow: var(--shadow);
      padding: 10px;
      display: grid;
      overflow: hidden;
    }

    .page {
      border-radius: 24px;
      background:
        radial-gradient(circle at 12% 18%, rgba(132,204,22,.10), transparent 24%),
        radial-gradient(circle at 88% 12%, rgba(236,72,153,.10), transparent 24%),
        radial-gradient(circle at 70% 88%, rgba(59,130,246,.10), transparent 26%),
        linear-gradient(135deg, rgba(255,255,255,.99), rgba(255,250,237,.96));
      border: 1px solid var(--line);
      padding: clamp(14px, 1.45vw, 20px);
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      min-height: 0;
      overflow: hidden;
      position: relative;
    }

    .page::before {
      content: "";
      height: 8px;
      border-radius: 999px;
      background: var(--gold);
      width: calc(100% - 52px);
      position: absolute;
      top: 24px;
      left: 26px;
    }

    .mission-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 18px;
      align-items: start;
      padding-top: 18px;
      margin-bottom: 6px;
    }

    .mission-title {
      font-size: clamp(28px, 3vw, 46px);
      line-height: .95;
      color: var(--teal);
      margin: 0 0 8px;
    }

    .mission-text {
      margin: 0;
      color: var(--muted);
      font-size: clamp(15px, 1.25vw, 20px);
      font-weight: 800;
      max-width: 850px;
    }

    .score-card {
      width: 230px;
      border-radius: 20px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,.82);
      padding: 11px;
      display: grid;
      gap: 8px;
      box-shadow: 0 12px 26px rgba(31,41,55,.08);
    }

    .stars {
      display: grid;
      gap: 4px;
      font-size: 13px;
      font-weight: 900;
      color: #566174;
    }

    .star-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: center;
    }

    .star-icons {
      letter-spacing: 2px;
      color: var(--gold);
      white-space: nowrap;
    }

    .game {
      height: 100%;
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(540px, 1.05fr) minmax(430px, .95fr);
      grid-template-rows: minmax(0, 1fr);
      column-gap: clamp(14px, 2vw, 24px);
      align-items: start;
    }

    .scale-card,
    .coach-card {
      border-radius: 24px;
      background:
        linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,250,237,.78)),
        radial-gradient(circle at top left, rgba(223,243,255,.82), transparent 42%),
        rgba(255,255,255,.74);
      border: 3px solid rgba(255,255,255,.82);
      box-shadow: 0 18px 42px rgba(31,41,55,.10), inset 0 0 0 1px rgba(214,165,49,.18);
      padding: 14px;
      min-height: 0;
      overflow: hidden;
    }

    .scale-card {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 10px;
      height: 100%;
    }

    .equations {
      display: grid;
      grid-template-columns: minmax(170px, .78fr) 48px minmax(340px, 1.22fr);
      gap: 8px;
      align-items: center;
    }

    .equation-box,
    .equals-badge {
      border-radius: 20px;
      background:
        radial-gradient(circle at 18% 16%, rgba(255,255,255,.88), transparent 24%),
        linear-gradient(135deg, #ffffff, #fff0c8);
      border: 2px solid #ead7a8;
      padding: 11px;
      min-height: 86px;
      display: grid;
      align-content: center;
      justify-items: center;
      box-shadow: 0 10px 22px rgba(31,41,55,.07);
      min-width: 0;
      overflow: hidden;
    }

    .equals-badge {
      min-height: 66px;
      width: 48px;
      border-radius: 999px;
      color: var(--teal);
      font-size: 28px;
      font-weight: 900;
      place-self: center;
    }

    .label {
      color: var(--muted);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .expression {
      font-size: clamp(34px, 4.2vw, 64px);
      font-weight: 900;
      line-height: 1;
      color: #172033;
    }

    .expression.vertical-expression {
      display: grid;
      grid-template-columns: auto auto;
      align-items: end;
      justify-content: center;
      column-gap: 10px;
      row-gap: 0;
      min-width: 116px;
      font-size: clamp(42px, 4.9vw, 78px);
      line-height: .9;
    }

    .expression .line {
      display: block;
    }

    .expression .top-line {
      grid-column: 2;
      justify-self: end;
    }

    .expression .plus-mark {
      grid-column: 1;
      grid-row: 2;
      align-self: center;
      justify-self: end;
      font-size: .72em;
      line-height: 1;
      transform: translateY(.08em);
    }

    .expression .plus-line {
      grid-column: 2;
      grid-row: 2;
      justify-self: end;
    }

    .expression .equation-rule {
      grid-column: 1 / 3;
      width: 100%;
      height: 4px;
      margin-top: 5px;
      border-radius: 999px;
      background: #172033;
    }

    .expression.one-digit-expression {
      min-width: 95px;
      column-gap: 8px;
    }

    .total {
      margin-top: 6px;
      color: var(--teal);
      font-weight: 900;
      font-size: 17px;
    }

    .total.hidden-total {
      color: var(--muted);
      font-size: 12px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .build-row {
      display: grid;
      grid-template-columns: minmax(126px, 1fr);
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-width: 0;
    }

    .slot {
      width: 100%;
      min-width: 0;
      max-width: 136px;
      height: clamp(52px, 4.6vw, 70px);
      border-radius: 18px;
      border: 3px dashed #8ed8ca;
      background:
        linear-gradient(135deg, rgba(223,247,238,.72), rgba(223,243,255,.72));
      display: grid;
      place-items: center;
      font-size: clamp(26px, 2.7vw, 42px);
      font-weight: 900;
      color: var(--teal);
      transition: .2s ease;
    }

    .slot.locked {
      border-style: solid;
      border-color: #d6a531;
      background: linear-gradient(135deg, #fff7d6, #ffffff);
      color: #8a560f;
    }

    .slot.over {
      background: #d6fff4;
      border-color: var(--teal);
      transform: translateY(-2px);
    }

    .operator {
      font-size: clamp(26px, 2.5vw, 38px);
      font-weight: 900;
      color: var(--gold);
      text-align: center;
    }

    .scale-wrap {
      display: grid;
      place-items: center;
      min-height: 0;
      position: relative;
    }

    .scale-svg {
      width: min(100%, 760px);
      height: clamp(260px, 38vh, 430px);
      min-height: 250px;
      filter: drop-shadow(0 18px 24px rgba(31, 41, 55, .12));
    }

    .beam {
      transform-origin: 300px 95px;
      transition: transform .35s ease;
    }

    .scale-balanced .beam { transform: rotate(0deg); }
    .scale-left-heavy .beam { transform: rotate(-7deg); }
    .scale-right-heavy .beam { transform: rotate(7deg); }

    .pan {
      transition: transform .35s ease;
    }

    .scale-left-heavy .left-pan { transform: translateY(17px); }
    .scale-left-heavy .right-pan { transform: translateY(-13px); }
    .scale-right-heavy .left-pan { transform: translateY(-13px); }
    .scale-right-heavy .right-pan { transform: translateY(17px); }

    .tray-wrap {
      align-self: stretch;
      margin-top: 0;
      border-radius: 20px;
      padding: 8px;
      min-height: 0;
      background:
        radial-gradient(circle at 12% 20%, rgba(255,255,255,.95), transparent 22%),
        radial-gradient(circle at 88% 80%, rgba(250,204,21,.18), transparent 26%),
        linear-gradient(135deg, rgba(255,255,255,.62), rgba(223,247,238,.72)),
        repeating-linear-gradient(-45deg, rgba(47,125,115,.08) 0 8px, rgba(255,255,255,.04) 8px 16px);
      border: 3px dashed rgba(47,125,115,.32);
      box-shadow: 0 14px 30px rgba(31,41,55,.08), inset 0 0 0 1px rgba(255,255,255,.65);
    }

    .tray-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 6px;
    }

    .drag-note {
      color: var(--teal);
      font-size: 12px;
      font-weight: 900;
      background: rgba(255,255,255,.82);
      border-radius: 999px;
      padding: 6px 10px;
      white-space: nowrap;
    }

    .tile-tray {
      border-radius: 20px;
      border: 2px solid #cceee6;
      background:
        linear-gradient(135deg, rgba(223, 247, 238, .78), rgba(255,247,224,.82));
      padding: 9px;
      display: grid;
      grid-template-columns: repeat(5, minmax(58px, 1fr));
      gap: 10px;
      align-items: stretch;
      max-height: none;
      overflow: visible;
    }

    .number-tile {
      min-height: clamp(54px, 5.1vw, 72px);
      border-radius: 18px;
      background: linear-gradient(135deg, #ffffff, #eaf8ff);
      color: var(--teal);
      border: 3px solid #cce7ef;
      display: grid;
      place-items: center;
      font-size: clamp(30px, 3.2vw, 46px);
      font-weight: 900;
      box-shadow: 0 12px 22px rgba(31,41,55,.10);
      user-select: none;
      touch-action: none;
      cursor: grab;
      -webkit-user-drag: none;
      transition: transform .15s ease, border-color .15s ease, background .15s ease;
    }

    .number-tile:active { cursor: grabbing; }

    .drag-ghost {
      position: fixed;
      z-index: 50;
      width: 84px;
      height: 84px;
      border-radius: 22px;
      display: grid;
      place-items: center;
      pointer-events: none;
      background: linear-gradient(135deg, #dcfff5, #fff7d6);
      border: 3px solid var(--teal);
      color: var(--teal);
      font-size: 46px;
      font-weight: 900;
      box-shadow: 0 18px 34px rgba(31,41,55,.18);
      transform: translate(-50%, -50%) scale(1.04);
    }

    .number-tile:hover,
    .number-tile:focus-visible,
    .number-tile.selected {
      transform: translateY(-2px);
      border-color: var(--teal);
      background: linear-gradient(135deg, #dcfff5, #fff7d6);
      outline: none;
    }

    .number-tile:nth-child(3n + 1) { background: linear-gradient(135deg, #e0f2fe, #ffffff); color: #245ea8; }
    .number-tile:nth-child(3n + 2) { background: linear-gradient(135deg, #dcfce7, #ffffff); color: #217044; }
    .number-tile:nth-child(3n) { background: linear-gradient(135deg, #fef3c7, #ffffff); color: #9a5a12; }

    .coach-card {
      display: grid;
      grid-template-rows: auto auto auto auto minmax(0, 1fr);
      gap: 8px;
      height: 100%;
    }

    .grade-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 6px;
    }

    .level-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 7px;
    }

    .level-btn,
    .grade-btn,
    .action-btn {
      border-radius: 16px;
      padding: 10px 9px;
      background: linear-gradient(135deg, #ffffff, #f7fbff);
      border: 2px solid #dfe9e7;
      color: var(--teal);
      font-weight: 900;
      box-shadow: 0 8px 16px rgba(31,41,55,.06);
    }

    .grade-btn {
      border-radius: 14px;
      padding: 8px 5px;
      font-size: 13px;
    }

    .grade-btn.active,
    .level-btn.active {
      background: linear-gradient(135deg, var(--teal), #3bb8a2);
      color: white;
      border-color: var(--teal);
    }

    .action-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 7px;
    }

    .action-row .action-btn {
      padding-left: 6px;
      padding-right: 6px;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, var(--teal), #38b9a4);
      color: white;
      border-color: var(--teal);
    }

    .feedback {
      border-radius: 22px;
      background: var(--mint);
      border: 1px solid #ccece4;
      padding: 12px;
      font-size: clamp(16px, 1.45vw, 22px);
      font-weight: 900;
      color: #255f58;
      line-height: 1.25;
      min-height: 68px;
      display: flex;
      align-items: center;
    }

    .feedback.good { background: #dcfce7; color: #166534; }
    .feedback.try { background: #fff7d6; color: #8a560f; }
    .feedback.stop { background: #ffe4e6; color: #9f1239; }

    .challenge-list {
      display: none;
    }

    .choice-card {
      border-radius: 17px;
      background: linear-gradient(135deg, #ffffff, #f8fbff);
      border: 2px solid #e1eee9;
      padding: 10px 12px;
      color: #1f2937;
      font-size: 16px;
      font-weight: 900;
      text-align: left;
      box-shadow: 0 8px 16px rgba(31,41,55,.06);
    }

    .choice-card:hover,
    .choice-card.active {
      border-color: var(--teal);
      background: #f1fffb;
    }

    .choice-card.correct { border-color: #22c55e; background: #dcfce7; }
    .choice-card.wrong { border-color: #fb7185; background: #ffe4e6; }

    .coach-tip {
      display: grid;
      grid-template-columns: 36px 1fr;
      gap: 9px;
      align-items: center;
    }

    .tip-icon {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      color: white;
      font-weight: 900;
      background: linear-gradient(135deg, var(--blue), var(--purple));
    }

    .coach-tip:nth-child(3n + 1) .tip-icon { background: linear-gradient(135deg, var(--teal), #22c55e); }
    .coach-tip:nth-child(3n + 2) .tip-icon { background: linear-gradient(135deg, var(--orange), var(--gold)); }
    .coach-tip:nth-child(3n) .tip-icon { background: linear-gradient(135deg, var(--pink), var(--purple)); }

    .sparkle {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .sparkle span {
      position: absolute;
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--gold);
      opacity: 0;
      animation: pop 900ms ease-out forwards;
    }

    @keyframes pop {
      0% { transform: translateY(18px) scale(.4); opacity: 0; }
      25% { opacity: 1; }
      100% { transform: translateY(-90px) scale(1.5); opacity: 0; }
    }

    body[data-size="compact"] .stage { padding: 8px; }
    body[data-size="compact"] .page { padding: 12px; }
    body[data-size="compact"] .mission-title { font-size: clamp(25px, 2.7vw, 38px); }
    body[data-size="compact"] .mission-text { font-size: clamp(14px, 1.1vw, 18px); }
    body[data-size="compact"] .scale-card,
    body[data-size="compact"] .coach-card { padding: 11px; }
    body[data-size="compact"] .scale-svg { height: clamp(230px, 34vh, 370px); min-height: 220px; }
    body[data-size="compact"] .equation-box { min-height: 76px; padding: 9px; }
    body[data-size="compact"] .tray-wrap { padding: 7px; }
    body[data-size="compact"] .tile-tray { grid-template-columns: repeat(5, minmax(52px, 1fr)); gap: 7px; padding: 7px; }
    body[data-size="compact"] .number-tile { min-height: 52px; font-size: clamp(27px, 2.8vw, 38px); }
    body[data-size="roomy"] .app { width: min(1360px, calc(100vw - 18px)); }
    body[data-size="roomy"] .stage { padding: 12px; }
    body[data-size="roomy"] .scale-svg { height: clamp(280px, 40vh, 450px); }
    body[data-size="roomy"] .number-tile { min-height: clamp(58px, 5.8vw, 78px); font-size: clamp(34px, 3.6vw, 52px); }

    @media (max-width: 980px) {
      body { overflow: hidden; }
      .app { height: 100dvh; min-height: 0; }
      .topbar,
      .mission-row,
      .game { grid-template-columns: 1fr; }
      .topbar,
      .mission-row { display: grid; }
      .score-card { width: 100%; }
      .tile-tray { grid-template-columns: repeat(5, 1fr); }
      .stage { min-height: 0; }
      .page { overflow: hidden; }
      .scale-card,
      .coach-card { overflow: hidden; }
    }
  </style>
</head>
<body data-size="fit">
  <main class="app">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">QA</div>
        <div>
          <div class="eyebrow">Interactive Math Lab</div>
          <h1>Balance the Scale</h1>
        </div>
      </div>
      <div class="status">
        <button class="voice" id="voiceBtn" title="Read instructions aloud">Audio</button>
        <button class="voice" id="talkBtn" title="Say the answer, like sixteen">Talk</button>
        <div class="size-control" aria-label="Game size">
          <button class="size-btn" id="sizeDown" title="Make game smaller" type="button">-</button>
          <span class="size-label" id="sizeLabel">Fit</span>
          <button class="size-btn" id="sizeUp" title="Make game larger" type="button">+</button>
        </div>
        <div class="pill" id="levelPill">Level 1</div>
        <div class="pill" id="problemPill">Problem 1 of 15</div>
        <div class="progress" aria-label="Progress"><span id="progressFill"></span></div>
      </div>
    </header>

    <section class="stage">
      <div class="page">
        <section class="mission-row">
          <div>
            <h2 class="mission-title" id="missionTitle">Find the answer</h2>
            <p class="mission-text" id="missionText">Add the numbers on the left. Enter the total on the right.</p>
          </div>
          <aside class="score-card">
            <div class="label">Progress Stars</div>
            <div class="stars">
              <div class="star-row"><span>Accuracy</span><span class="star-icons" id="accuracyStars">---</span></div>
              <div class="star-row"><span>Strategy</span><span class="star-icons" id="strategyStars">---</span></div>
              <div class="star-row"><span>Persistence</span><span class="star-icons" id="persistenceStars">---</span></div>
            </div>
          </aside>
        </section>

        <section class="game">
          <section class="scale-card">
            <div class="equations">
              <div class="equation-box">
                <div class="label">Left Side</div>
                <div class="expression" id="leftExpression">5 + 3</div>
                <div class="total hidden-total" id="leftTotal">Hidden total</div>
              </div>
              <div class="equals-badge">=</div>
              <div class="equation-box" id="buildBox">
                <div class="label">Answer</div>
                <div class="build-row">
                  <div class="slot answer-slot" data-slot="0" aria-label="answer">?</div>
                </div>
                <div class="total" id="rightTotal">Answer: ?</div>
              </div>
            </div>

            <div class="scale-wrap">
              <svg class="scale-svg scale-balanced" id="scaleSvg" viewBox="0 0 600 330" role="img" aria-label="Balance scale">
                <defs>
                  <linearGradient id="panGrad" x1="0" x2="1">
                    <stop offset="0" stop-color="#7dd3fc" />
                    <stop offset=".55" stop-color="#ffffff" />
                    <stop offset="1" stop-color="#fde68a" />
                  </linearGradient>
                  <linearGradient id="beamGrad" x1="0" x2="1">
                    <stop offset="0" stop-color="#2563eb" />
                    <stop offset=".5" stop-color="#14b8a6" />
                    <stop offset="1" stop-color="#f97316" />
                  </linearGradient>
                  <linearGradient id="baseGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stop-color="#34d399" />
                    <stop offset="1" stop-color="#1f6f64" />
                  </linearGradient>
                  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
                    <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#1f2937" flood-opacity=".20" />
                  </filter>
                </defs>
                <g class="beam">
                  <line x1="135" y1="95" x2="465" y2="95" stroke="#0f766e" stroke-width="22" stroke-linecap="round" opacity=".22" />
                  <line x1="145" y1="88" x2="455" y2="88" stroke="url(#beamGrad)" stroke-width="16" stroke-linecap="round" filter="url(#softShadow)" />
                  <circle cx="300" cy="88" r="19" fill="#fff7d6" stroke="#d6a531" stroke-width="7" />
                  <line x1="175" y1="95" x2="116" y2="188" stroke="#2563eb" stroke-width="7" stroke-linecap="round" />
                  <line x1="425" y1="95" x2="484" y2="188" stroke="#f97316" stroke-width="7" stroke-linecap="round" />
                  <g class="pan left-pan">
                    <ellipse cx="112" cy="204" rx="100" ry="27" fill="#1d4ed8" opacity=".16" />
                    <ellipse cx="112" cy="195" rx="98" ry="30" fill="url(#panGrad)" stroke="#2563eb" stroke-width="7" filter="url(#softShadow)" />
                    <text x="112" y="204" text-anchor="middle" fill="#17315f" font-size="34" font-weight="900" id="leftPanText">?</text>
                  </g>
                  <g class="pan right-pan">
                    <ellipse cx="488" cy="204" rx="100" ry="27" fill="#ea580c" opacity=".16" />
                    <ellipse cx="488" cy="195" rx="98" ry="30" fill="url(#panGrad)" stroke="#f97316" stroke-width="7" filter="url(#softShadow)" />
                    <text x="488" y="204" text-anchor="middle" fill="#7c2d12" font-size="34" font-weight="900" id="rightPanText">?</text>
                  </g>
                </g>
                <circle cx="300" cy="88" r="13" fill="#f97316" />
                <rect x="284" y="112" width="32" height="148" rx="13" fill="url(#baseGrad)" filter="url(#softShadow)" />
                <path d="M236 278 H364" stroke="#1f6f64" stroke-width="24" stroke-linecap="round" />
                <path d="M258 258 H342" stroke="#34d399" stroke-width="12" stroke-linecap="round" />
              </svg>
              <div class="sparkle" id="sparkle"></div>
            </div>

          </section>

          <aside class="coach-card">
            <div class="grade-grid" id="gradeGrid"></div>
            <div class="level-grid" id="levelGrid"></div>
            <div class="action-row">
              <button class="action-btn" id="hintBtn">Hint</button>
              <button class="action-btn primary" id="nextBtn">Next</button>
              <button class="action-btn" id="clearBtn">Clear</button>
              <button class="action-btn" id="prevBtn">Previous</button>
              <button class="action-btn" id="resetBtn">Reset</button>
            </div>
            <div class="feedback" id="feedback">Drag or tap digit tiles to enter the answer.</div>
            <div class="challenge-list" id="challengeList"></div>
            <div class="tray-wrap">
              <div class="tray-header">
                <div class="label">Digit Tiles</div>
                <div class="drag-note">Build numbers with digits</div>
              </div>
              <div class="tile-tray" id="tileTray"></div>
            </div>
          </aside>
        </section>
      </div>
    </section>
  </main>

  <script>
    const gradeMaxTiles = [10, 20, 30, 50, 70, 80, 90, 99];
    const digitTiles = range(9);
    const gradeBanks = Array.from({ length: 8 }, (_, index) => makeGradeBank(index + 1));

    function range(max) {
      return Array.from({ length: max + 1 }, (_, index) => index);
    }

    function clampNumber(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function answerFor(total, max, spread = 0) {
      const first = clampNumber(Math.floor(total / 2) + spread, Math.max(0, total - max), Math.min(max, total));
      return [first, total - first];
    }

    function makeProblem(total, max, prompt, story = "", offset = 0) {
      const safeTotal = clampNumber(total, 2, max * 2);
      const leftA = clampNumber(Math.ceil(safeTotal * .56) + offset, Math.max(1, safeTotal - max), Math.min(max, safeTotal - 1));
      const left = [leftA, safeTotal - leftA];
      return {
        left,
        story,
        answers: [answerFor(safeTotal, max), answerFor(safeTotal, max, 1), answerFor(safeTotal, max, -1)],
        prompt
      };
    }

    function makeLockedProblem(total, max, locked, side, prompt) {
      const safeTotal = clampNumber(total, 2, max * 2);
      const safeLocked = clampNumber(locked, Math.max(0, safeTotal - max), Math.min(max, safeTotal));
      const leftA = clampNumber(Math.ceil(safeTotal * .58), Math.max(1, safeTotal - max), Math.min(max, safeTotal - 1));
      const missing = safeTotal - safeLocked;
      return {
        left: [leftA, safeTotal - leftA],
        locked: side === "left" ? [safeLocked, null] : [null, safeLocked],
        answers: side === "left" ? [[safeLocked, missing]] : [[missing, safeLocked]],
        prompt
      };
    }

    function makeProblemSeries(start, step, max, prompt, storyFactory) {
      return Array.from({ length: 15 }, (_, index) => {
        const total = clampNumber(start + index * step, 2, max * 2);
        const story = typeof storyFactory === "function" ? storyFactory(total, index) : "";
        const offsetSize = Math.max(1, Math.floor(max / 20));
        const offset = ((index % 5) - 2) * offsetSize;
        return makeProblem(total, max, prompt, story, offset);
      });
    }

    function makeLockedSeries(start, step, max, prompt) {
      return Array.from({ length: 15 }, (_, index) => {
        const total = clampNumber(start + index * step, 2, max * 2);
        const low = Math.max(0, total - max);
        const high = Math.min(max, total);
        const locked = clampNumber(Math.floor(total * (.38 + (index % 3) * .08)), low, high);
        return makeLockedProblem(total, max, locked, index % 2 === 0 ? "left" : "right", prompt);
      });
    }

    function makeGradeBank(grade) {
      const max = gradeMaxTiles[grade - 1];
      const base = [8, 16, 24, 36, 52, 70, 92, 120][grade - 1];
      const step = [2, 4, 6, 8, 10, 14, 18, 20][grade - 1];
      const storyNames = ["blocks", "stickers", "marbles", "books", "points", "tokens", "tickets", "credits"];
      const item = storyNames[grade - 1];
      const total1 = clampNumber(base, 4, max);
      const total2 = clampNumber(base + step, 5, max * 2);
      const total3 = clampNumber(base + step * 2, 6, max * 2);
      const total4 = clampNumber(base + step * 3, 7, max * 2);
      const total5 = clampNumber(base + step * 4, 8, max * 2);
      return {
        grade,
        max,
        levels: [
          {
            name: "Level 1",
            title: "Find the answer",
            text: "Start with friendly numbers. Add the left side and enter the total.",
            tiles: digitTiles,
            problems: makeProblemSeries(total1, Math.max(1, Math.floor(step / 2)), max, "Enter the total.")
          },
          {
            name: "Level 2",
            title: "Bigger totals",
            text: "Use bigger totals. Add carefully, then enter the answer.",
            tiles: digitTiles,
            problems: makeProblemSeries(total2, Math.max(2, step), max, "Solve the sum.")
          },
          {
            name: "Level 3",
            title: "Hidden total mission",
            text: "The answer is hidden. Use the left-side equation to find it.",
            tiles: digitTiles,
            problems: makeLockedSeries(total3, Math.max(2, step), max, "Add first, then answer.")
          },
          {
            name: "Level 4",
            title: "Story totals",
            text: "Read the story. Use the equation to enter the answer.",
            tiles: digitTiles,
            problems: makeProblemSeries(total4, Math.max(3, step), max, "Balance the story total.", (total, index) => {
              const settings = ["class", "team", "club", "family", "factory"];
              return "The " + settings[index % settings.length] + " has " + total + " " + item + " in two groups. Enter the total.";
            })
          },
          {
            name: "Level 5",
            title: "Answer challenge",
            text: "Use the largest numbers for this grade. Think carefully before you answer.",
            tiles: digitTiles,
            problems: [
              ...makeProblemSeries(total5, Math.max(4, step), max, "Challenge: enter the total.").slice(0, 8),
              ...makeLockedSeries(total5 + step, Math.max(4, step), max, "Challenge: find the hidden total.").slice(0, 7)
            ]
          }
        ]
      };
    }

    const state = {
      grade: 1,
      level: 0,
      problem: 0,
      slots: [[], []],
      selectedTile: null,
      attempts: 0,
      hints: 0,
      correct: 0,
      solved: new Set(),
      mistakeCount: 0,
      sizeIndex: 1
    };

    const els = {
      levelPill: document.getElementById("levelPill"),
      problemPill: document.getElementById("problemPill"),
      progressFill: document.getElementById("progressFill"),
      missionTitle: document.getElementById("missionTitle"),
      missionText: document.getElementById("missionText"),
      leftExpression: document.getElementById("leftExpression"),
      leftTotal: document.getElementById("leftTotal"),
      rightTotal: document.getElementById("rightTotal"),
      leftPanText: document.getElementById("leftPanText"),
      rightPanText: document.getElementById("rightPanText"),
      scaleSvg: document.getElementById("scaleSvg"),
      slots: Array.from(document.querySelectorAll(".slot")),
      tileTray: document.getElementById("tileTray"),
      gradeGrid: document.getElementById("gradeGrid"),
      levelGrid: document.getElementById("levelGrid"),
      feedback: document.getElementById("feedback"),
      challengeList: document.getElementById("challengeList"),
      accuracyStars: document.getElementById("accuracyStars"),
      strategyStars: document.getElementById("strategyStars"),
      persistenceStars: document.getElementById("persistenceStars"),
      sparkle: document.getElementById("sparkle"),
      sizeLabel: document.getElementById("sizeLabel")
    };

    const voiceEls = {
      audioBtn: document.getElementById("voiceBtn"),
      talkBtn: document.getElementById("talkBtn")
    };

    const sizeModes = [
      { key: "compact", label: "Small" },
      { key: "fit", label: "Fit" },
      { key: "roomy", label: "Large" }
    ];

    let activePointerDrag = null;
    let suppressTileClick = false;
    let activeElevenAudio = null;
    let activeElevenAudioUrl = "";
    let voicePlaybackSerial = 0;
    let audioUnlocked = false;
    let interactiveVoiceEnabled = false;
    let suppressCoachSpeech = false;
    let activeRecognition = null;
    let listeningTimer = null;
    let voiceSessionActive = false;
    let voiceResultTimer = null;
    let pendingTranscript = "";
    let lastAppliedTranscript = "";
    let recognitionRestartTimer = null;
    let micStream = null;
    let micAudioContext = null;
    let micAnalyser = null;
    let micMonitorTimer = null;
    let mediaRecorder = null;
    let mediaChunks = [];
    let mediaSpeechInChunk = false;
    let mediaLastSpeechAt = 0;
    let mediaChunkStopTimer = null;
    let autoAdvanceTimer = null;

    function currentLevel() {
      return currentGrade().levels[state.level];
    }

    function currentGrade() {
      return gradeBanks[state.grade - 1];
    }

    function currentProblem() {
      return currentLevel().problems[state.problem];
    }

    function numberToDigits(value) {
      if (value === null || value === undefined) return [];
      return String(value).split("").map((digit) => Number(digit));
    }

    function digitsToNumber(digits) {
      if (!Array.isArray(digits) || digits.length === 0) return null;
      return Number(digits.join(""));
    }

    function slotNumber(index) {
      return digitsToNumber(state.slots[index]);
    }

    function slotText(index) {
      const value = slotNumber(index);
      return value === null ? "?" : String(value);
    }

    function applySizeMode() {
      const mode = sizeModes[state.sizeIndex] || sizeModes[1];
      document.body.dataset.size = mode.key;
      els.sizeLabel.textContent = mode.label;
    }

    function leftTotal() {
      const p = currentProblem();
      return p.left[0] + p.left[1];
    }

    function rightTotal() {
      return slotNumber(0);
    }

    function canUseVoiceNumber(value) {
      return Number.isInteger(value) && value >= 0 && value <= 999;
    }

    function setSlotNumber(index, value) {
      if (index !== 0) return true;
      if (!canUseVoiceNumber(value)) {
        state.mistakeCount += 1;
        setFeedback("Use a number from 0 to 999 for the answer.", "try");
        renderStars();
        return false;
      }
      state.slots[index] = numberToDigits(value);
      return true;
    }

    function renderVerticalExpression(values) {
      return '<span class="line top-line">' + values[0] + '</span><span class="plus-mark">+</span><span class="line plus-line">' + values[1] + '</span><span class="equation-rule"></span>';
    }

    function keyForProblem(levelIndex = state.level, problemIndex = state.problem) {
      return state.grade + "-" + levelIndex + "-" + problemIndex;
    }

    function render() {
      applySizeMode();
      const level = currentLevel();
      const p = currentProblem();
      const left = leftTotal();
      const right = rightTotal();

      els.levelPill.textContent = level.name;
      els.problemPill.textContent = "Grade " + state.grade + " | Problem " + (state.problem + 1) + " of " + level.problems.length;
      els.progressFill.style.width = ((state.solved.size / totalProblems()) * 100) + "%";
      els.missionTitle.textContent = level.title;
      els.missionText.textContent = p.story || level.text;
      els.leftExpression.classList.add("vertical-expression");
      els.leftExpression.classList.toggle("one-digit-expression", p.left[0] < 10 && p.left[1] < 10);
      els.leftExpression.innerHTML = renderVerticalExpression(p.left);
      const showResult = state.solved.has(keyForProblem()) || right === left;
      els.leftTotal.textContent = showResult ? "Total: " + left : "Hidden total";
      els.leftTotal.classList.toggle("hidden-total", !showResult);
      els.leftPanText.textContent = showResult ? left : "?";
      els.rightPanText.textContent = right === null ? "?" : right;
      els.rightTotal.textContent = right === null ? "Answer: ?" : "Answer: " + right;

      els.slots.forEach((slot, index) => {
        slot.textContent = slotText(index);
        slot.dataset.locked = "false";
        slot.classList.remove("locked");
        slot.classList.toggle("empty", slot.textContent === "?");
      });

      renderGrades();
      renderLevels();
      renderTiles();
      renderChoices();
      renderScale();
      renderStars();
    }

    function renderGrades() {
      els.gradeGrid.innerHTML = "";
      gradeBanks.forEach((gradeBank) => {
        const btn = document.createElement("button");
        btn.className = "grade-btn" + (gradeBank.grade === state.grade ? " active" : "");
        btn.textContent = "G" + gradeBank.grade;
        btn.title = "Grade " + gradeBank.grade;
        btn.addEventListener("click", () => setGrade(gradeBank.grade));
        els.gradeGrid.appendChild(btn);
      });
    }

    function renderLevels() {
      els.levelGrid.innerHTML = "";
      currentGrade().levels.forEach((level, index) => {
        const btn = document.createElement("button");
        btn.className = "level-btn" + (index === state.level ? " active" : "");
        btn.textContent = level.name;
        btn.addEventListener("click", () => setLevel(index));
        els.levelGrid.appendChild(btn);
      });
    }

    function renderTiles() {
      const level = currentLevel();
      els.tileTray.innerHTML = "";
      level.tiles.forEach((num) => {
        const tile = document.createElement("button");
        tile.className = "number-tile" + (state.selectedTile === num ? " selected" : "");
        tile.textContent = num;
        tile.draggable = false;
        tile.dataset.value = String(num);
        tile.title = "Drag digit " + num + " to a question box";
        tile.setAttribute("aria-label", "Digit tile " + num + ". Drag it or tap it.");
        tile.addEventListener("click", () => {
          if (suppressTileClick) {
            suppressTileClick = false;
            return;
          }
          selectTile(num);
        });
        tile.addEventListener("pointerdown", (event) => startPointerTileDrag(event, num));
        els.tileTray.appendChild(tile);
      });
    }

    function startPointerTileDrag(event, num) {
      if (event.button !== undefined && event.button !== 0) return;
      markTileSelected(num);
      suppressTileClick = true;
      const tile = event.currentTarget;
      activePointerDrag = {
        num,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        ghost: null,
        tile,
        pointerId: event.pointerId
      };
      window.addEventListener("pointermove", movePointerTileDrag);
      window.addEventListener("pointerup", finishPointerTileDrag);
      window.addEventListener("pointercancel", cancelPointerTileDrag);
    }

    function createDragGhost(num, x, y) {
      const ghost = document.createElement("div");
      ghost.className = "drag-ghost";
      ghost.textContent = num;
      ghost.style.left = x + "px";
      ghost.style.top = y + "px";
      document.body.appendChild(ghost);
      return ghost;
    }

    function movePointerTileDrag(event) {
      if (!activePointerDrag) return;

      const dx = Math.abs(event.clientX - activePointerDrag.startX);
      const dy = Math.abs(event.clientY - activePointerDrag.startY);
      if (!activePointerDrag.moved && dx + dy < 8) return;

      event.preventDefault();
      if (!activePointerDrag.moved) {
        activePointerDrag.moved = true;
        suppressTileClick = true;
        state.selectedTile = activePointerDrag.num;
        activePointerDrag.ghost = createDragGhost(activePointerDrag.num, event.clientX, event.clientY);
      }
      activePointerDrag.ghost.style.left = event.clientX + "px";
      activePointerDrag.ghost.style.top = event.clientY + "px";
      suppressTileClick = true;
      els.slots.forEach((slot) => slot.classList.remove("over"));
      const slot = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".slot");
      if (slot) slot.classList.add("over");
    }

    function finishPointerTileDrag(event) {
      if (!activePointerDrag) return;
      const drag = activePointerDrag;
      cleanupPointerTileDrag();
      els.slots.forEach((slot) => slot.classList.remove("over"));

      if (drag.moved) {
        event.preventDefault();
        const slot = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".slot");
        if (slot) {
          setSlot(Number(slot.dataset.slot), drag.num);
        } else {
          renderTiles();
        }
      } else {
        markTileSelected(drag.num);
      }
    }

    function cancelPointerTileDrag() {
      cleanupPointerTileDrag();
      els.slots.forEach((slot) => slot.classList.remove("over"));
      renderTiles();
    }

    function cleanupPointerTileDrag() {
      if (!activePointerDrag) return;
      const { ghost } = activePointerDrag;
      window.removeEventListener("pointermove", movePointerTileDrag);
      window.removeEventListener("pointerup", finishPointerTileDrag);
      window.removeEventListener("pointercancel", cancelPointerTileDrag);
      ghost?.remove();
      activePointerDrag = null;
    }

    function markTileSelected(num) {
      state.selectedTile = num;
      setFeedback("Digit " + num + " is ready. Tap a box to add it.", "");
      els.tileTray.querySelectorAll(".number-tile").forEach((tile) => {
        tile.classList.toggle("selected", Number(tile.dataset.value) === num);
      });
    }

    function renderChoices() {
      const p = currentProblem();
      const left = leftTotal();
      const right = rightTotal();
      els.challengeList.innerHTML = "";

      const title = document.createElement("div");
      title.className = "label";
      title.textContent = "Strategy Coach";
      els.challengeList.appendChild(title);

      const tips = [
        ["1", "Add the two numbers on the left side."],
        ["?", "Enter the total in the answer box."]
      ];

      tips.forEach(([icon, text]) => {
        const tip = document.createElement("div");
        tip.className = "choice-card coach-tip";
        tip.innerHTML = '<span class="tip-icon">' + icon + '</span><span>' + text + '</span>';
        els.challengeList.appendChild(tip);
      });

      if (p.prompt) {
        const prompt = document.createElement("div");
        prompt.className = "choice-card coach-tip";
        prompt.innerHTML = '<span class="tip-icon">Go</span><span>' + p.prompt + '</span>';
        prompt.style.background = "#fff7d6";
        els.challengeList.appendChild(prompt);
      }
    }

    function renderScale() {
      const right = rightTotal();
      const left = leftTotal();
      els.scaleSvg.classList.remove("scale-balanced", "scale-left-heavy", "scale-right-heavy");
      if (right === left) {
        els.scaleSvg.classList.add("scale-balanced");
      } else if (left > right) {
        els.scaleSvg.classList.add("scale-left-heavy");
      } else {
        els.scaleSvg.classList.add("scale-right-heavy");
      }
    }

    function renderStars() {
      const accuracy = Math.max(0, 3 - state.mistakeCount);
      const strategy = Math.max(0, 3 - state.hints);
      const persistence = Math.min(3, 1 + Math.floor(state.attempts / 2));
      els.accuracyStars.textContent = stars(accuracy);
      els.strategyStars.textContent = stars(strategy);
      els.persistenceStars.textContent = stars(persistence);
    }

    function stars(count) {
      return "●".repeat(count) + "○".repeat(3 - count);
    }

    function totalProblems() {
      return currentGrade().levels.reduce((sum, level) => sum + level.problems.length, 0);
    }

    function setGrade(grade) {
      state.grade = grade;
      state.level = 0;
      state.problem = 0;
      state.solved = new Set();
      resetBuild("Grade " + grade + " loaded. Start with Level 1.");
    }

    function setLevel(index) {
      state.level = index;
      state.problem = 0;
      resetBuild("Level changed. Try this new balance challenge.");
    }

    function nextProblem() {
      const level = currentLevel();
      const gradeLevels = currentGrade().levels;
      if (state.problem < level.problems.length - 1) {
        state.problem += 1;
      } else if (state.level < gradeLevels.length - 1) {
        state.level += 1;
        state.problem = 0;
      } else {
        const doneMessage = "You completed the Balance the Scale lab. Excellent math thinking.";
        setFeedback(doneMessage, "good");
        coachSpeak(doneMessage);
        burst();
        return;
      }
      resetBuild("New challenge. Add the left side and enter the answer.");
    }

    function prevProblem() {
      if (state.problem > 0) {
        state.problem -= 1;
      } else if (state.level > 0) {
        state.level -= 1;
        state.problem = currentGrade().levels[state.level].problems.length - 1;
      }
      resetBuild("Previous challenge loaded.");
    }

    function resetBuild(message = "Cleared. Enter the total answer.") {
      if (autoAdvanceTimer) {
        window.clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
      state.slots = [[], []];
      state.selectedTile = null;
      state.attempts = 0;
      state.hints = 0;
      state.mistakeCount = 0;
      setFeedback(message, "");
      render();
      coachSpeak(message);
    }

    function selectTile(num) {
      state.selectedTile = state.selectedTile === num ? null : num;
      setFeedback("Digit " + num + " is ready. Tap a box to add it.", "");
      renderTiles();
    }

    function setSlot(index, value) {
      if (index !== 0) return;
      const digits = Array.isArray(state.slots[index]) ? [...state.slots[index]] : numberToDigits(state.slots[index]);
      if (digits.length >= 3) {
        state.mistakeCount += 1;
        const message = "That box can hold up to three digits. Use Clear if you want to rebuild it.";
        setFeedback(message, "try");
        coachSpeak(message);
        renderStars();
        return;
      }
      if (digits.length === 1 && digits[0] === 0 && value !== 0) {
        state.slots[index] = [value];
      } else {
        state.slots[index] = [...digits, value];
      }
      state.selectedTile = null;
      render();
      const right = rightTotal();
      if (right === null) {
        const message = "Nice start. Add more digits if your answer needs them.";
        setFeedback(message, "");
        coachSpeak(message);
      } else {
        compareWithoutAnswer();
      }
    }

    function compareWithoutAnswer() {
      const left = leftTotal();
      const right = rightTotal();
      if (right === left) {
        completeCurrentProblem();
      } else if (right < left) {
        const message = "That answer is too small. Try a bigger number.";
        setFeedback(message, "try");
        coachSpeak(message);
      } else {
        const message = "That answer is too big. Try a smaller number.";
        setFeedback(message, "try");
        coachSpeak(message);
      }
    }

    function completeCurrentProblem() {
      const left = leftTotal();
      const key = keyForProblem();
      if (!state.solved.has(key)) {
        state.attempts += 1;
        state.correct += 1;
        state.solved.add(key);
        burst();
      }
      const message = "Correct. The answer is " + left + ". Moving to the next question.";
      setFeedback(message, "good");
      coachSpeak(message);
      render();
      if (autoAdvanceTimer) window.clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = window.setTimeout(() => {
        autoAdvanceTimer = null;
        nextProblem();
      }, 1050);
    }

    function giveHint() {
      state.hints += 1;
      const left = leftTotal();
      const right = rightTotal();
      let message = "";
      if (right === null) {
        message = "Hint: add the two numbers on the left. Put the total in the answer box.";
        setFeedback(message, "try");
      } else if (right < left) {
        message = "Hint: your answer is too small. Add more to reach the total.";
        setFeedback(message, "try");
      } else if (right > left) {
        message = "Hint: your answer is too big. Try a smaller answer.";
        setFeedback(message, "try");
      } else {
        message = "Hint: that is correct. The next question will load.";
        setFeedback(message, "good");
      }
      coachSpeak(message);
      renderStars();
    }

    function setFeedback(text, kind) {
      els.feedback.textContent = text;
      els.feedback.className = "feedback" + (kind ? " " + kind : "");
    }

    function currentFeedbackKind() {
      if (els.feedback.classList.contains("try")) return "try";
      if (els.feedback.classList.contains("good")) return "good";
      return "";
    }

    function burst() {
      els.sparkle.innerHTML = "";
      for (let i = 0; i < 24; i += 1) {
        const dot = document.createElement("span");
        dot.style.left = (20 + Math.random() * 60) + "%";
        dot.style.top = (42 + Math.random() * 34) + "%";
        dot.style.background = ["#d6a531", "#2f7d73", "#f97316", "#3b82f6"][i % 4];
        dot.style.animationDelay = (Math.random() * 180) + "ms";
        els.sparkle.appendChild(dot);
      }
    }

    function updateVoiceLabel(text) {
      if (voiceEls.audioBtn) voiceEls.audioBtn.textContent = text;
    }

    function updateTalkState(isListening) {
      if (!voiceEls.talkBtn) return;
      voiceEls.talkBtn.classList.toggle("listening", isListening);
      voiceEls.talkBtn.disabled = isListening;
      voiceEls.talkBtn.textContent = isListening ? "Listening" : "Talk";
    }

    function moodleOrigin() {
      if (window.__prequran_moodle_origin) {
        return String(window.__prequran_moodle_origin).replace(/\/+$/, "");
      }
      const q = new URLSearchParams(window.location.search || "");
      const fromQuery = q.get("moodle_origin") || q.get("origin") || "";
      if (fromQuery) return String(fromQuery).replace(/\/+$/, "");
      if (isLocalPreviewOrigin(window.location.origin)) return window.location.origin;
      if (document.referrer) {
        try {
          return new URL(document.referrer).origin;
        } catch (_error) {
          return window.location.origin;
        }
      }
      return window.location.origin;
    }

    function voiceToken() {
      if (window.PQIframe && typeof window.PQIframe.getToken === "function") {
        return window.PQIframe.getToken() || "";
      }
      return window.__prequran_ws_token ||
        window.prequran_ws_token ||
        sessionStorage.getItem("pq_wstoken") ||
        "";
    }

    function isLocalPreviewOrigin(origin) {
      return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin || "");
    }

    function stopActiveVoice() {
      voicePlaybackSerial += 1;
      if (activeElevenAudio) {
        try { activeElevenAudio.pause(); } catch (_error) {}
        if (activeElevenAudioUrl) {
          try { URL.revokeObjectURL(activeElevenAudioUrl); } catch (_error) {}
        }
        activeElevenAudio = null;
        activeElevenAudioUrl = "";
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }

    async function unlockAudioPlayback() {
      if (audioUnlocked) return;
      try {
        const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==");
        silentAudio.volume = 0.01;
        await silentAudio.play();
        silentAudio.pause();
        audioUnlocked = true;
      } catch (_error) {
        audioUnlocked = true;
      }
    }

    function speakWithBrowser(text) {
      if (!("speechSynthesis" in window)) {
        setFeedback("Audio is not available in this browser, but you can read the instructions on screen.", "try");
        return;
      }
      window.speechSynthesis.cancel();
      updateVoiceLabel("Browser voice");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = .88;
      utterance.pitch = 1.08;
      window.speechSynthesis.speak(utterance);
    }

    async function speakWithElevenLabsProxy(text) {
      const origin = moodleOrigin();
      const token = voiceToken();
      if (!token && !isLocalPreviewOrigin(origin)) return false;
      let playbackId = voicePlaybackSerial;
      try {
        stopActiveVoice();
        playbackId = voicePlaybackSerial;
        updateVoiceLabel("Loading voice");
        const response = await fetch(origin + "/local/hubredirect/quiz_tts.php", {
          method: "POST",
          credentials: "include",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: String(text || "").slice(0, 650),
            wstoken: token,
            purpose: "balance_scale"
          })
        });
        if (playbackId !== voicePlaybackSerial) return true;
        if (!response.ok) {
          let message = "ElevenLabs voice request failed";
          try {
            const payload = await response.clone().json();
            if (payload && payload.message) message = payload.message;
          } catch (_error) {}
          throw new Error(message);
        }
        const audioBlob = await response.blob();
        if (playbackId !== voicePlaybackSerial) return true;
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        activeElevenAudio = audio;
        activeElevenAudioUrl = audioUrl;
        activeElevenAudio.onended = () => {
          if (activeElevenAudio === audio) {
            activeElevenAudio = null;
            activeElevenAudioUrl = "";
            updateVoiceLabel("Audio");
          }
          try { URL.revokeObjectURL(audioUrl); } catch (_error) {}
        };
        activeElevenAudio.onerror = () => {
          if (activeElevenAudio === audio) {
            activeElevenAudio = null;
            activeElevenAudioUrl = "";
            updateVoiceLabel("Audio");
          }
          try { URL.revokeObjectURL(audioUrl); } catch (_error) {}
        };
        await activeElevenAudio.play();
        updateVoiceLabel("ElevenLabs");
        return true;
      } catch (error) {
        if (playbackId !== voicePlaybackSerial) return true;
        console.warn("ElevenLabs proxy voice unavailable", error);
        updateVoiceLabel("Audio");
        return false;
      }
    }

    async function speakText(text, options = {}) {
      await unlockAudioPlayback();
      const usedElevenLabs = await speakWithElevenLabsProxy(text);
      if (!usedElevenLabs) {
        if (!options.preserveFeedback) {
          setFeedback("ElevenLabs voice is not available here yet, so I am using the browser voice.", "try");
        }
        speakWithBrowser(text);
      }
    }

    function coachSpeak(text) {
      if (!interactiveVoiceEnabled || suppressCoachSpeech || !text) return;
      speakText(text, { preserveFeedback: true });
    }

    function speakInstructions() {
      interactiveVoiceEnabled = true;
      const text = "Voice coach is on. Add the numbers on the left. Enter the answer on the right with digit tiles, or say the answer aloud. I will read hints and feedback as you play.";
      speakText(text);
    }

    const smallNumbers = {
      zero: 0, oh: 0, one: 1, won: 1, two: 2, too: 2, to: 2, three: 3, four: 4, for: 4, five: 5,
      six: 6, seven: 7, eight: 8, ate: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
      fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19
    };

    const tensNumbers = {
      twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90
    };

    function normalizeSpeech(text) {
      return String(text || "")
        .toLowerCase()
        .replace(/\+/g, " plus ")
        .replace(/[-]/g, " ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    const ignoredSpeechTokens = new Set([
      "none", "null", "undefined", "answer", "answers", "equals", "equal", "is", "the"
    ]);

    function speechTokens(text) {
      return normalizeSpeech(text)
        .split(" ")
        .filter((token) => token && !ignoredSpeechTokens.has(token));
    }

    function wordsToNumber(tokens, startIndex) {
      let total = 0;
      let current = 0;
      let used = 0;
      for (let i = startIndex; i < tokens.length; i += 1) {
        const token = tokens[i];
        if (smallNumbers[token] !== undefined) {
          current += smallNumbers[token];
          used += 1;
          continue;
        }
        if (tensNumbers[token] !== undefined) {
          current += tensNumbers[token];
          used += 1;
          continue;
        }
        if (token === "hundred" && used > 0) {
          current = Math.max(1, current) * 100;
          used += 1;
          continue;
        }
        if (token === "and") {
          if (used > 0) {
            used += 1;
            continue;
          }
          break;
        }
        break;
      }
      total += current;
      if (used === 0 || total > 999) return null;
      return { value: total, nextIndex: startIndex + used };
    }

    function extractSpokenNumbers(text) {
      const tokens = speechTokens(text);
      const values = [];
      for (let i = 0; i < tokens.length; i += 1) {
        const numericMatch = tokens[i].match(/^\d{1,3}$/);
        if (numericMatch) {
          values.push(Number(tokens[i]));
          continue;
        }
        const parsed = wordsToNumber(tokens, i);
        if (parsed) {
          values.push(parsed.value);
          i = parsed.nextIndex - 1;
        }
      }
      return values.filter(canUseVoiceNumber);
    }

    function parseVoiceCommand(transcript) {
      const text = normalizeSpeech(transcript);
      if (!text) return { type: "empty" };
      if (/\b(next|forward|another)\b/.test(text)) return { type: "next" };
      if (/\b(previous|back)\b/.test(text)) return { type: "previous" };
      if (/\b(clear|erase|reset|start over)\b/.test(text)) return { type: "clear" };
      if (/\b(hint|help)\b/.test(text)) return { type: "hint" };
      const numbers = extractSpokenNumbers(text);
      if (numbers.length >= 2 && /\b(plus|add|and)\b/.test(text)) {
        return { type: "answer", value: numbers[0] + numbers[1] };
      }
      if (numbers.length >= 1) return { type: "answer", value: numbers[0] };
      return { type: "unknown" };
    }

    function speakPreservingFeedback(text) {
      speakText(text, { preserveFeedback: true });
    }

    function applyVoiceCommand(transcript) {
      const command = parseVoiceCommand(transcript);
      if (command.type === "next") {
        suppressCoachSpeech = true;
        nextProblem();
        suppressCoachSpeech = false;
        speakPreservingFeedback("Moving to the next challenge.");
        return;
      }
      if (command.type === "previous") {
        suppressCoachSpeech = true;
        prevProblem();
        suppressCoachSpeech = false;
        speakPreservingFeedback("Going back one challenge.");
        return;
      }
      if (command.type === "clear") {
        suppressCoachSpeech = true;
        resetBuild("Cleared. Say the answer or use the digit tiles.");
        suppressCoachSpeech = false;
        speakPreservingFeedback("Cleared. Say the answer or use the digit tiles.");
        return;
      }
      if (command.type === "hint") {
        giveHint();
        return;
      }
      if (command.type !== "answer") {
        const message = "I heard " + (transcript || "nothing") + ". Try saying the answer, like sixteen.";
        setFeedback(message, "try");
        speakPreservingFeedback("Try saying the answer, like sixteen.");
        return;
      }
      const firstOk = setSlotNumber(0, command.value);
      state.selectedTile = null;
      render();
      if (!firstOk) {
        speakPreservingFeedback(els.feedback.textContent || "That answer cannot go there yet.");
        return;
      }
      suppressCoachSpeech = true;
      compareWithoutAnswer();
      suppressCoachSpeech = false;
      const response = "I heard " + command.value + ". " + (els.feedback.textContent || "");
      speakPreservingFeedback(response);
    }

    function resetSilenceTimer() {
      if (listeningTimer) {
        window.clearTimeout(listeningTimer);
        listeningTimer = null;
      }
      listeningTimer = window.setTimeout(() => {
        voiceSessionActive = false;
        if (activeRecognition && typeof activeRecognition.stop === "function") {
          try { activeRecognition.stop(); } catch (_error) {}
        }
        activeRecognition = null;
        updateTalkState(false);
        const message = "I stopped listening after one minute of silence. Tap Talk when you want to speak again.";
        setFeedback(message, "try");
      }, 60000);
    }

    function transcriptFromResults(event) {
      const allResults = Array.from(event.results || []);
      const start = Math.max(0, Number(event.resultIndex || 0));
      const results = allResults.slice(start).length ? allResults.slice(start) : allResults;
      return results
        .map((result) => result && result[0] ? result[0].transcript : "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function processPendingTranscript() {
      const transcript = pendingTranscript.trim();
      pendingTranscript = "";
      if (!transcript) return;
      const normalized = normalizeSpeech(transcript);
      if (!normalized || normalized === lastAppliedTranscript) return;
      lastAppliedTranscript = normalized;
      applyVoiceCommand(transcript);
      if (voiceSessionActive) {
        setFeedback((els.feedback.textContent || "") + " I am still listening.", currentFeedbackKind());
      }
    }

    function scheduleVoiceProcessing(transcript, delay = 900) {
      pendingTranscript = transcript;
      if (voiceResultTimer) {
        window.clearTimeout(voiceResultTimer);
        voiceResultTimer = null;
      }
      voiceResultTimer = window.setTimeout(processPendingTranscript, delay);
    }

    function finishListening(keepSession = false) {
      if (!keepSession && listeningTimer) {
        window.clearTimeout(listeningTimer);
        listeningTimer = null;
      }
      if (!keepSession && voiceResultTimer) {
        window.clearTimeout(voiceResultTimer);
        voiceResultTimer = null;
      }
      if (!keepSession && recognitionRestartTimer) {
        window.clearTimeout(recognitionRestartTimer);
        recognitionRestartTimer = null;
      }
      if (!keepSession) {
        voiceSessionActive = false;
        pendingTranscript = "";
        stopMediaListening();
      }
      activeRecognition = null;
      updateTalkState(voiceSessionActive);
    }

    function startListening() {
      if (window.MediaRecorder && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
        startElevenLabsListening();
        return;
      }
      startBrowserSpeechListening();
    }

    function chooseRecorderMimeType() {
      const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4"
      ];
      return types.find((type) => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) || "";
    }

    function stopMediaListening() {
      if (micMonitorTimer) {
        window.clearInterval(micMonitorTimer);
        micMonitorTimer = null;
      }
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        try { mediaRecorder.stop(); } catch (_error) {}
      }
      if (mediaChunkStopTimer) {
        window.clearTimeout(mediaChunkStopTimer);
        mediaChunkStopTimer = null;
      }
      mediaRecorder = null;
      mediaChunks = [];
      mediaSpeechInChunk = false;
      if (micAudioContext) {
        try { micAudioContext.close(); } catch (_error) {}
      }
      micAudioContext = null;
      micAnalyser = null;
      if (micStream) {
        micStream.getTracks().forEach((track) => {
          try { track.stop(); } catch (_error) {}
        });
      }
      micStream = null;
    }

    function blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const value = String(reader.result || "");
          resolve(value.includes(",") ? value.split(",").pop() : value);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    async function transcribeWithElevenLabs(blob) {
      const origin = moodleOrigin();
      const audioBase64 = await blobToBase64(blob);
      const response = await fetch(origin + "/local/hubredirect/quiz_stt.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type || "audio/webm",
          purpose: "balance_scale"
        })
      });
      if (!response.ok) throw new Error("Speech recognition failed.");
      const payload = await response.json();
      return String(payload.text || "").trim();
    }

    function startMediaRecorderChunk() {
      if (!voiceSessionActive || !micStream || (mediaRecorder && mediaRecorder.state !== "inactive")) return;
      try {
        mediaChunks = [];
        mediaSpeechInChunk = true;
        const mimeType = chooseRecorderMimeType();
        mediaRecorder = mimeType ? new MediaRecorder(micStream, { mimeType }) : new MediaRecorder(micStream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) mediaChunks.push(event.data);
        };
        mediaRecorder.onstop = async () => {
          if (mediaChunkStopTimer) {
            window.clearTimeout(mediaChunkStopTimer);
            mediaChunkStopTimer = null;
          }
          const chunks = mediaChunks;
          const shouldSend = mediaSpeechInChunk;
          mediaChunks = [];
          mediaSpeechInChunk = false;
          if (!voiceSessionActive || !shouldSend || !chunks.length) return;
          const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || "audio/webm" });
          if (blob.size < 700) return;
          setFeedback("I am turning your voice into words.", "");
          try {
            const transcript = await transcribeWithElevenLabs(blob);
            if (transcript) {
              setFeedback("I heard: " + transcript + ". Give me a moment.", "");
              applyVoiceCommand(transcript);
              if (voiceSessionActive) {
                setFeedback((els.feedback.textContent || "") + " I am still listening.", currentFeedbackKind());
              }
            } else {
              setFeedback("I heard your voice, but I could not catch the words. Try saying: sixteen.", "try");
            }
          } catch (_error) {
            setFeedback("I heard your voice, but speech recognition did not respond. I am still listening.", "try");
          }
        };
        mediaRecorder.start();
        mediaChunkStopTimer = window.setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === "recording") {
            try { mediaRecorder.stop(); } catch (_error) {}
          }
        }, 4500);
      } catch (_error) {
        setFeedback("Voice recording could not start. Trying browser listening instead.", "try");
        stopMediaListening();
        startBrowserSpeechListening();
      }
    }

    function monitorMicrophoneLevel() {
      if (!micAnalyser || !voiceSessionActive) return;
      const samples = new Uint8Array(micAnalyser.fftSize);
      micAnalyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i += 1) {
        const centered = (samples[i] - 128) / 128;
        sum += centered * centered;
      }
      const volume = Math.sqrt(sum / samples.length);
      const now = Date.now();
      if (volume > 0.035) {
        mediaLastSpeechAt = now;
        resetSilenceTimer();
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
          setFeedback("I hear you. Keep going.", "");
          startMediaRecorderChunk();
        }
      }
      if (mediaRecorder && mediaRecorder.state === "recording" && mediaLastSpeechAt && now - mediaLastSpeechAt > 1200) {
        try { mediaRecorder.stop(); } catch (_error) {}
      }
    }

    async function startElevenLabsListening() {
      interactiveVoiceEnabled = true;
      try {
        if (voiceSessionActive) {
          resetSilenceTimer();
          setFeedback("I am still listening. Say the answer, like sixteen.", "");
          return;
        }
        stopActiveVoice();
        voiceSessionActive = true;
        pendingTranscript = "";
        lastAppliedTranscript = "";
        mediaLastSpeechAt = 0;
        updateTalkState(true);
        resetSilenceTimer();
        setFeedback("Microphone is opening. Say the answer, like sixteen.", "");
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          setFeedback("Audio listening is limited in this browser. Trying browser listening instead.", "try");
          stopMediaListening();
          startBrowserSpeechListening();
          return;
        }
        micAudioContext = new AudioContextClass();
        micAnalyser = micAudioContext.createAnalyser();
        micAnalyser.fftSize = 512;
        const source = micAudioContext.createMediaStreamSource(micStream);
        source.connect(micAnalyser);
        setFeedback("Microphone is open. I will listen until one minute of silence.", "");
        micMonitorTimer = window.setInterval(monitorMicrophoneLevel, 120);
      } catch (_error) {
        finishListening(false);
        const message = "Microphone permission is blocked or unavailable. Please allow the microphone, or use the digit tiles.";
        setFeedback(message, "try");
        speakPreservingFeedback(message);
      }
    }

    function startBrowserSpeechListening() {
      interactiveVoiceEnabled = true;
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        const message = "Voice listening is not available in this browser. You can still use the digit tiles.";
        setFeedback(message, "try");
        speakPreservingFeedback(message);
        return;
      }
      try {
        if (voiceSessionActive) {
          resetSilenceTimer();
          const message = "I am still listening. Say the answer, like seventy eight.";
          setFeedback(message, "");
          return;
        }
        stopActiveVoice();
        if (activeRecognition && typeof activeRecognition.stop === "function") {
          activeRecognition.stop();
        }
        voiceSessionActive = true;
        pendingTranscript = "";
        lastAppliedTranscript = "";
        updateTalkState(true);
        resetSilenceTimer();
        setFeedback("Listening for one minute. Say the answer, like seventy eight.", "");

        const startRecognitionCycle = () => {
          if (!voiceSessionActive) return;
          try {
            const recognition = new Recognition();
            activeRecognition = recognition;
            recognition.lang = "en-US";
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            recognition.onaudiostart = () => {
              if (voiceSessionActive && !pendingTranscript && !els.feedback.classList.contains("good")) {
                setFeedback("Microphone is open. I am listening.", "");
              }
            };
            recognition.onspeechstart = () => {
              resetSilenceTimer();
              setFeedback("I hear you. Keep going.", "");
            };
            recognition.onspeechend = () => {
              resetSilenceTimer();
              if (pendingTranscript) {
                scheduleVoiceProcessing(pendingTranscript, 250);
              } else {
                setFeedback("I heard speech, but not the words yet. Try saying: sixteen.", "");
              }
            };
            recognition.onresult = (event) => {
              resetSilenceTimer();
              const transcript = transcriptFromResults(event);
              if (transcript) {
                setFeedback("I heard: " + transcript + ". Give me a moment.", "");
                scheduleVoiceProcessing(transcript, 450);
              }
            };
            recognition.onerror = (event) => {
              const errorName = event && event.error ? String(event.error) : "";
              activeRecognition = null;
              if (voiceSessionActive && ["no-speech", "aborted", "audio-capture", "network"].includes(errorName)) {
                setFeedback(errorName === "no-speech" ? "Still listening. Say the answer when ready." : "Listening restarted. Try again.", "");
                recognitionRestartTimer = window.setTimeout(startRecognitionCycle, 500);
                return;
              }
              finishListening(false);
              const message = errorName === "not-allowed"
                ? "Microphone permission is blocked. Please allow the microphone, or use the digit tiles."
                : "I could not hear that clearly. Try again, or use the digit tiles.";
              setFeedback(message, "try");
              speakPreservingFeedback(message);
            };
            recognition.onend = () => {
              activeRecognition = null;
              if (!voiceSessionActive) {
                finishListening(false);
                return;
              }
              if (pendingTranscript) {
                scheduleVoiceProcessing(pendingTranscript, 250);
              }
              recognitionRestartTimer = window.setTimeout(startRecognitionCycle, 450);
            };
            recognition.start();
          } catch (_error) {
            finishListening(false);
            const message = "Voice listening paused. Tap Talk to start listening again.";
            setFeedback(message, "try");
          }
        };

        startRecognitionCycle();
      } catch (_error) {
        finishListening(false);
        const message = "Voice listening could not start. Check microphone permission, or use the digit tiles.";
        setFeedback(message, "try");
        speakPreservingFeedback(message);
      }
    }

    els.slots.forEach((slot, index) => {
      slot.addEventListener("click", () => {
        if (state.selectedTile === null) {
          setFeedback("Choose a digit tile first, then tap this box.", "try");
          return;
        }
        setSlot(index, state.selectedTile);
      });
      slot.addEventListener("dragover", (event) => {
        event.preventDefault();
        slot.classList.add("over");
      });
      slot.addEventListener("dragleave", () => slot.classList.remove("over"));
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        slot.classList.remove("over");
        const value = Number(event.dataTransfer.getData("text/plain"));
        if (!Number.isNaN(value)) setSlot(index, value);
      });
    });

    document.getElementById("hintBtn").addEventListener("click", giveHint);
    document.getElementById("clearBtn").addEventListener("click", () => resetBuild());
    document.getElementById("resetBtn").addEventListener("click", () => resetBuild("Restarted this challenge."));
    document.getElementById("nextBtn").addEventListener("click", nextProblem);
    document.getElementById("prevBtn").addEventListener("click", prevProblem);
    document.getElementById("voiceBtn").addEventListener("click", speakInstructions);
    document.getElementById("talkBtn").addEventListener("click", startListening);
    document.getElementById("sizeDown").addEventListener("click", () => {
      state.sizeIndex = Math.max(0, state.sizeIndex - 1);
      applySizeMode();
    });
    document.getElementById("sizeUp").addEventListener("click", () => {
      state.sizeIndex = Math.min(sizeModes.length - 1, state.sizeIndex + 1);
      applySizeMode();
    });

    applySizeMode();
    resetBuild("Drag or tap digit tiles to enter the answer.");
  </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.mkdirSync(path.dirname(outputCopy), { recursive: true });
fs.writeFileSync(outFile, html);
fs.writeFileSync(outputCopy, html);
console.log(outFile);
console.log(Buffer.byteLength(html, "utf8") + " bytes");
