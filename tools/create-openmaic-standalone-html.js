#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.env.USERPROFILE || '', 'Downloads', 'openmaic combined files');
const outFile = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(root, 'dist', 'pre_quraan', 'units', 'openmaic-classroom', 'fractions-with-pizza-standalone.html');
const slideDir = process.argv[4] ? path.resolve(process.argv[4]) : path.join(sourceDir, 'slides');

const manifestPath = path.join(sourceDir, 'manifest.json');
const audioDir = path.join(sourceDir, 'audio');
const mediaDir = path.join(sourceDir, 'media');
const gamePath = findFirstFile(sourceDir, (file) => file.toLowerCase().endsWith('.html') && !file.toLowerCase().endsWith('index.html'));
const pptxPath = findFirstFile(sourceDir, (file) => file.toLowerCase().endsWith('.pptx'));

if (!fs.existsSync(manifestPath)) throw new Error(`Missing manifest: ${manifestPath}`);
if (!fs.existsSync(audioDir)) throw new Error(`Missing audio folder: ${audioDir}`);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const gameHtml = gamePath && fs.existsSync(gamePath) ? fs.readFileSync(gamePath, 'utf8') : '';
const gameScene = (manifest.scenes || []).find((scene) => scene.content?.type === 'interactive');
if (gameScene && gameHtml) gameScene.content.html = gameHtml;
manifest.scenes = expandQuizScenes(manifest.scenes || []);

const audioData = {};
for (const file of fs.readdirSync(audioDir)) {
  if (!file.toLowerCase().endsWith('.mp3')) continue;
  const fullPath = path.join(audioDir, file);
  const dataUri = `data:audio/mpeg;base64,${fs.readFileSync(fullPath).toString('base64')}`;
  audioData[`audio/${file}`] = dataUri;
  audioData[file] = dataUri;
}

const mediaData = {};
if (fs.existsSync(mediaDir)) {
  for (const file of fs.readdirSync(mediaDir)) {
    const fullPath = path.join(mediaDir, file);
    if (!fs.statSync(fullPath).isFile()) continue;
    const ext = path.extname(file).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg'
      ? 'image/jpeg'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : ext === '.svg'
            ? 'image/svg+xml'
            : 'image/png';
    const dataUri = `data:${mime};base64,${fs.readFileSync(fullPath).toString('base64')}`;
    mediaData[file] = dataUri;
    mediaData[`media/${file}`] = dataUri;
    mediaData[path.basename(file, ext)] = dataUri;
  }
}

const slideImages = {};
if (fs.existsSync(slideDir)) {
  const slideFiles = fs.readdirSync(slideDir)
    .filter((file) => /^slide\d+\.png$/i.test(file))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));
  let slideFileIndex = 0;
  (manifest.scenes || []).forEach((scene, sceneIndex) => {
    if (scene.content?.type !== 'slide') return;
    const file = slideFiles[slideFileIndex++];
    if (!file) return;
    slideImages[String(sceneIndex)] = `data:image/png;base64,${fs.readFileSync(path.join(slideDir, file)).toString('base64')}`;
  });
}

let pptxData = '';
if (pptxPath && fs.existsSync(pptxPath)) {
  pptxData = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${fs.readFileSync(pptxPath).toString('base64')}`;
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(manifest.stage?.name || 'OpenMAIC Lesson')}</title>
  <style>
    :root { color-scheme: light; --bg:#f7f8fb; --panel:#fff; --ink:#20242b; --muted:#8a93a3; --line:#e8ebf1; --accent:#667085; --gold:#d99b23; --bad:#b42318; --good:#157f3b; }
    * { box-sizing: border-box; }
    body { margin:0; min-height:100vh; background:var(--bg); color:var(--ink); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing:0; }
    button, a.file-link { min-height:38px; border:1px solid var(--line); border-radius:999px; background:#fff; color:var(--accent); padding:8px 12px; font:inherit; font-weight:700; cursor:pointer; text-decoration:none; }
    button:hover, a.file-link:hover { border-color:#cfd5df; color:#344054; background:#fbfcfe; }
    button.primary { background:#fff; border-color:var(--line); color:var(--accent); }
    .shell { width:min(1220px, calc(100vw - 24px)); margin:0 auto; padding:18px 0 22px; }
    .top { display:flex; align-items:center; justify-content:flex-end; gap:14px; margin-bottom:10px; min-height:42px; }
    .top-title { display:none; }
    .actions { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }
    .actions .file-link { color:#98a2b3; font-size:.88rem; }
    .layout { display:grid; grid-template-columns:280px 1fr; gap:16px; align-items:start; }
    body.sidebar-hidden .layout { grid-template-columns:1fr; }
    body.sidebar-hidden .side { display:none; }
    .side, .card { background:var(--panel); border:1px solid var(--line); border-radius:12px; box-shadow:0 18px 44px rgba(16,24,40,.08); }
    .side { position:sticky; top:12px; padding:16px; max-height:calc(100vh - 24px); overflow:auto; }
    .eyebrow { margin:0 0 5px; color:#98a2b3; font-size:.74rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
    .scene-list { display:grid; gap:8px; margin-top:12px; }
    .scene-list button { width:100%; text-align:left; border-radius:10px; color:#344054; }
    .scene-list button.active { border-color:#c7d7fe; background:#eef4ff; }
    .counter { color:#98a2b3; font-weight:800; min-width:58px; }
    .canvas { min-height:510px; background:#fff; border-radius:12px; }
    .ppt-slide-stage { display:flex; justify-content:center; padding:28px 28px 18px; overflow:auto; background:#fff; border-radius:12px; }
    .ppt-slide-image { display:block; width:min(1040px, 100%); height:auto; border-radius:12px; box-shadow:0 16px 38px rgba(16,24,40,.10); background:#fff; }
    .slide-stage { display:flex; justify-content:center; padding:28px 28px 18px; overflow:auto; background:#fff; border-radius:12px; }
    .slide-board { position:relative; width:min(1040px, 100%); overflow:hidden; border-radius:12px; box-shadow:0 16px 38px rgba(16,24,40,.10); }
    .slide-el { position:absolute; overflow:hidden; }
    .slide-el svg, .slide-el img { display:block; width:100%; height:100%; }
    .slide-el img { object-fit:cover; }
    .slide-rich-text { display:flex; flex-direction:column; justify-content:center; padding:4px 8px; line-height:1.22; }
    .slide-rich-text p { margin:0 0 .28em; }
    .slide-rich-text p:last-child { margin-bottom:0; }
    .slide-el-latex { align-items:center; justify-content:center; text-align:center; font-size:1.6rem; font-family:Georgia, "Times New Roman", serif; }
    .slide-el-latex .katex-display { margin:0; }
    .slide-el-latex .frac-line { display:inline-block; width:1.1em; border-bottom:.08em solid currentColor; }
    .missing-visual { display:grid; place-items:center; padding:16px; text-align:center; background:linear-gradient(135deg,#fff7db,#e5f7ff); border:2px dashed #d8c8a6; color:#795027; font-weight:900; }
    .ebook-stage { display:flex; justify-content:center; padding:28px 28px 18px; overflow:auto; background:#fff; border-radius:12px; }
    .ebook-board { position:relative; width:min(1040px, 100%); aspect-ratio:16 / 9; overflow:hidden; border-radius:14px; box-shadow:0 16px 38px rgba(16,24,40,.10); background:#f8f5ec; color:#1f2937; font-family:Lexend, Nunito, Inter, system-ui, sans-serif; }
    .ebook-page { position:absolute; inset:6.5% 5.8%; background:#fffdf7; border:1px solid #ece7d9; border-radius:16px; box-shadow:inset 0 0 0 1px rgba(214,165,49,.13), 0 14px 32px rgba(15,118,110,.10); }
    .ebook-ribbon { position:absolute; left:10%; right:10%; top:10.5%; height:8px; background:#d6a531; border-radius:999px; }
    .ebook-gutter { position:absolute; left:50%; top:14%; bottom:12%; width:2px; background:linear-gradient(#f1ead8,#d7cfbc,#f1ead8); opacity:.85; }
    .ebook-title { position:absolute; left:10%; top:16%; width:38%; margin:0; color:#0f766e; font-size:clamp(1.45rem, 3vw, 2.55rem); line-height:1.05; letter-spacing:0; }
    .ebook-text-panel { position:absolute; left:10%; top:31%; width:36%; min-height:42%; padding:4.2% 4.4%; background:#e6f4ef; border-radius:14px; box-shadow:0 8px 20px rgba(15,118,110,.08); }
    .ebook-text { margin:0; color:#1f2937; font-size:clamp(1.02rem, 1.95vw, 1.55rem); line-height:1.48; }
    .ebook-visual { position:absolute; right:10%; top:24%; width:35%; height:43%; border-radius:16px; overflow:hidden; background:linear-gradient(135deg,#e0f2fe,#fff7e0); box-shadow:0 12px 26px rgba(16,24,40,.08); display:grid; place-items:center; }
    .ebook-visual img { width:100%; height:100%; object-fit:cover; display:block; }
    .ebook-visual-placeholder { width:46%; aspect-ratio:1; border-radius:50%; background:rgba(255,255,255,.7); display:grid; place-items:center; color:#d6a531; font-size:clamp(2rem, 5vw, 4rem); box-shadow:0 8px 20px rgba(214,165,49,.14); }
    .ebook-caption { position:absolute; right:12.5%; bottom:17%; width:30%; padding:1.2% 1.8%; border-radius:12px; background:#fff7e0; color:#047857; font-size:clamp(.72rem, 1.15vw, 1rem); font-weight:800; text-align:center; }
    .ebook-page-number { position:absolute; right:8%; top:8.5%; color:rgba(15,118,110,.18); font-weight:900; font-size:clamp(2rem, 5vw, 4.6rem); line-height:1; }
    .ebook-corner { position:absolute; left:6.8%; bottom:9%; width:58px; height:58px; border-left:9px solid #a7f3d0; border-bottom:9px solid #facc15; border-radius:0 0 0 16px; opacity:.95; }
    .quiz { display:flex; justify-content:center; padding:28px 28px 18px; background:#fff; }
    .quiz-board { width:min(1040px, 100%); aspect-ratio:16 / 9; border-radius:12px; background:#fff8ed; box-shadow:0 16px 38px rgba(16,24,40,.10); padding:clamp(28px, 5vw, 58px); display:grid; grid-template-rows:auto 1fr; gap:24px; overflow:auto; }
    .quiz-title { display:flex; align-items:end; justify-content:space-between; gap:18px; border-bottom:4px solid #f59e0b; padding-bottom:18px; }
    .quiz-title h2 { margin:0; color:#2f2f2f; font-size:clamp(1.35rem, 2.7vw, 2.25rem); line-height:1.05; }
    .quiz-title span { color:#c9772e; font-weight:900; font-size:clamp(.75rem, 1.35vw, 1.01rem); white-space:nowrap; }
    .question { display:grid; grid-template-columns:minmax(0, 1fr) minmax(260px, .72fr); gap:28px; align-items:start; }
    .question h3 { margin:0; color:#2f2f2f; font-size:clamp(1.01rem, 1.88vw, 1.58rem); line-height:1.18; }
    .question-main { display:grid; gap:18px; }
    .option-list { display:grid; gap:10px; }
    .option { display:flex; gap:12px; align-items:flex-start; padding:14px 16px; color:#344054; font-size:.75rem; font-weight:700; background:#fff; border:2px solid #e6e0d4; border-radius:10px; box-shadow:0 4px 10px rgba(16,24,40,.04); }
    .option input { margin-top:3px; accent-color:#4472c4; }
    .option strong { color:#1e3a8a; }
    .quiz-actions { display:flex; justify-content:flex-start; }
    .quiz-actions button { border-radius:10px; background:#4472c4; border-color:#4472c4; color:#fff; padding:10px 16px; font-size:.75rem; }
    .analysis { display:none; margin-top:0; padding:18px; border-left:5px solid var(--accent); background:#dbeafe; color:#1f2937; border-radius:8px; font-size:.75rem; font-weight:700; line-height:1.45; }
    .question.checked .analysis { display:block; }
    @media (max-width:760px) { .question { grid-template-columns:1fr; } .quiz-board { aspect-ratio:auto; min-height:560px; } .quiz-title { align-items:start; flex-direction:column; } }
    .interactive-frame { display:block; width:100%; height:min(720px, 76vh); border:0; background:#fff; border-radius:12px; }
    .bottom-bar { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; padding:10px 18px 14px; background:#fff; }
    .player-dock { display:flex; align-items:center; justify-content:center; gap:4px; border:1px solid var(--line); border-radius:999px; background:#f8f9fc; padding:6px 10px; box-shadow:0 8px 18px rgba(16,24,40,.06); }
    .icon-btn { display:inline-grid; place-items:center; width:36px; height:36px; min-height:36px; padding:0; border:0; background:transparent; color:#667085; border-radius:999px; }
    .icon-btn:hover { background:#fff; color:#344054; }
    .icon-btn svg { width:20px; height:20px; stroke:currentColor; stroke-width:2.2; fill:none; stroke-linecap:round; stroke-linejoin:round; }
    .icon-btn.play svg { fill:none; }
    .speed-label { min-width:38px; text-align:center; color:#667085; font-weight:800; }
    .dock-separator { width:1px; height:24px; background:#e4e7ec; margin:0 4px; }
    .bottom-spacer { min-width:58px; }
    .speech { display:none; }
    .speech-line { border-left:4px solid var(--line); padding:8px 10px; color:var(--muted); }
    .speech-line.playing { border-left-color:var(--gold); background:#fff8e5; color:var(--ink); }
    .status { display:none; }
    @media (max-width:860px) { .layout { grid-template-columns:1fr; } .side { position:static; max-height:none; } .canvas { min-height:360px; } }
  </style>
</head>
<body class="sidebar-hidden">
  <main class="shell">
    <header class="top">
      <div class="top-title">
        <h1 id="lessonTitle"></h1>
        <div class="status" id="status" aria-live="polite"></div>
      </div>
      <div class="actions">
        ${pptxData ? `<a class="file-link" download="Fractions with Pizza.pptx" href="${pptxData}">Download PPTX</a>` : ''}
        <button id="toggleSceneList" type="button">Show Scene List</button>
      </div>
    </header>
    <section class="layout">
      <aside class="side">
        <p class="eyebrow">Classroom</p>
        <strong id="sceneTotal"></strong>
        <div class="scene-list" id="sceneList"></div>
      </aside>
      <section>
        <article class="card">
          <div class="canvas" id="canvas"></div>
          <div class="bottom-bar">
            <span class="counter" id="counter"></span>
            <div class="player-dock" aria-label="Lesson controls">
              <button class="icon-btn" id="playAudio" type="button" title="Play narration" aria-label="Play narration">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18.5 5.5a9 9 0 0 1 0 13"></path></svg>
              </button>
              <span class="speed-label">1x</span>
              <span class="dock-separator"></span>
              <button class="icon-btn" id="prevScene" type="button" title="Previous scene" aria-label="Previous scene">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
              </button>
              <button class="icon-btn play" id="playPause" type="button" title="Replay narration" aria-label="Replay narration">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7-11-7Z"></path></svg>
              </button>
              <button class="icon-btn" id="nextScene" type="button" title="Next scene" aria-label="Next scene">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
              </button>
              <span class="dock-separator"></span>
              <button class="icon-btn" id="stopAudio" type="button" title="Stop narration" aria-label="Stop narration">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h8v8H8z"></path></svg>
              </button>
            </div>
            <span class="bottom-spacer"></span>
          </div>
          <div class="speech" id="speech"></div>
        </article>
      </section>
    </section>
  </main>
  <script>
    const manifest = ${safeJson(manifest)};
    const audioData = ${safeJson(audioData)};
    const mediaData = ${safeJson(mediaData)};
    const slideImages = ${safeJson(slideImages)};
    let sceneIndex = 0;
    let currentAudio = null;
    let playToken = 0;
    let autoplayEnabled = true;
    let autoplayBlocked = false;
    const $ = (id) => document.getElementById(id);

    function init() {
      $('lessonTitle').textContent = manifest.stage?.name || 'OpenMAIC Lesson';
      $('sceneTotal').textContent = (manifest.scenes || []).length + ' scene(s)';
      $('status').textContent = 'Slides, quizzes, game, and narration are bundled in this one file.';
      renderSceneButtons();
      bind();
      showScene(0);
      armFirstAudioUnlock();
    }

    function bind() {
      $('prevScene').addEventListener('click', () => showScene(sceneIndex - 1));
      $('nextScene').addEventListener('click', () => showScene(sceneIndex + 1));
      $('playAudio').addEventListener('click', () => playSceneAudio(false));
      $('playPause').addEventListener('click', () => playSceneAudio(false));
      $('stopAudio').addEventListener('click', stopAudio);
      $('toggleSceneList').addEventListener('click', toggleSceneList);
    }

    function toggleSceneList() {
      const hidden = document.body.classList.toggle('sidebar-hidden');
      $('toggleSceneList').textContent = hidden ? 'Show Scene List' : 'Hide Scene List';
    }

    function armFirstAudioUnlock() {
      const unlock = () => {
        if (autoplayBlocked && sceneIndex === 0) {
          autoplayBlocked = false;
          playSceneAudio(false);
        }
      };
      document.addEventListener('pointerdown', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
    }

    function renderSceneButtons() {
      const list = $('sceneList');
      list.innerHTML = '';
      manifest.scenes.forEach((scene, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = (index + 1) + '. ' + (scene.title || 'Scene');
        button.addEventListener('click', () => showScene(index));
        list.appendChild(button);
      });
    }

    function showScene(index) {
      const scenes = manifest.scenes || [];
      sceneIndex = Math.max(0, Math.min(index, scenes.length - 1));
      stopAudio();
      document.querySelectorAll('.scene-list button').forEach((button, i) => button.classList.toggle('active', i === sceneIndex));
      const scene = scenes[sceneIndex];
      $('counter').textContent = (sceneIndex + 1) + ' / ' + scenes.length;
      document.title = (scene.title || 'Scene') + ' - ' + (manifest.stage?.name || 'OpenMAIC Lesson');
      renderScene(scene);
      renderSpeech(scene);
      if (autoplayEnabled) {
        window.setTimeout(() => playSceneAudio(true), 180);
      }
    }

    function renderScene(scene) {
      const canvas = $('canvas');
      canvas.innerHTML = '';
      if (scene.content?.type === 'interactive' && scene.content.html) {
        const frame = document.createElement('iframe');
        frame.className = 'interactive-frame';
        frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-pointer-lock allow-popups allow-modals');
        frame.srcdoc = scene.content.html;
        canvas.appendChild(frame);
        return;
      }
      if (scene.content?.type === 'quiz') {
        canvas.appendChild(renderQuiz(scene.content));
        return;
      }
      if (scene.content?.type === 'slide' && scene.content.canvas) {
        if (slideImages[String(sceneIndex)]) {
          canvas.appendChild(renderPptSlide(scene));
          return;
        }
        canvas.appendChild(renderEbookSlide(scene) || renderSlide(scene.content.canvas));
        return;
      }
      const fallback = document.createElement('pre');
      fallback.textContent = JSON.stringify(scene.content || scene, null, 2);
      canvas.appendChild(fallback);
    }

    function renderPptSlide(scene) {
      const stage = document.createElement('div');
      stage.className = 'ppt-slide-stage';
      const img = document.createElement('img');
      img.className = 'ppt-slide-image';
      img.alt = scene.title || 'Lesson slide';
      img.src = slideImages[String(sceneIndex)];
      stage.appendChild(img);
      return stage;
    }

    function renderSlide(slide) {
      const baseWidth = Number(slide.viewportSize || 1000);
      const baseHeight = Math.max(1, baseWidth * Number(slide.viewportRatio || 0.5625));
      const stage = document.createElement('div');
      stage.className = 'slide-stage';
      const board = document.createElement('div');
      board.className = 'slide-board';
      board.style.aspectRatio = baseWidth + ' / ' + baseHeight;
      board.style.background = slide.background?.color || slide.theme?.backgroundColor || '#fff';
      board.style.color = slide.theme?.fontColor || '#222';
      (slide.elements || []).forEach((element) => {
        const rendered = renderElement(element, baseWidth, baseHeight, slide);
        if (rendered) board.appendChild(rendered);
      });
      stage.appendChild(board);
      return stage;
    }

    function renderEbookSlide(scene) {
      if (!isStoryLikeScene(scene)) return null;
      const stage = document.createElement('div');
      stage.className = 'ebook-stage';
      const board = document.createElement('section');
      board.className = 'ebook-board';
      const title = scene.title || 'Story Page';
      const narration = storyExcerpt(scene);
      const imageSrc = firstSceneImage(scene);
      const pageNumber = String((scene.order || sceneIndex + 1)).padStart(2, '0');
      board.innerHTML =
        '<div class="ebook-page"></div>' +
        '<div class="ebook-ribbon"></div>' +
        '<div class="ebook-gutter"></div>' +
        '<div class="ebook-page-number">' + escapeHtml(pageNumber) + '</div>' +
        '<h2 class="ebook-title">' + escapeHtml(title) + '</h2>' +
        '<div class="ebook-text-panel"><p class="ebook-text">' + escapeHtml(narration) + '</p></div>' +
        '<figure class="ebook-visual">' + (imageSrc
          ? '<img alt="' + escapeHtml(title) + '" src="' + imageSrc + '">'
          : '<div class="ebook-visual-placeholder" aria-hidden="true">✦</div>') + '</figure>' +
        '<div class="ebook-caption">Read & Think: What happens next?</div>' +
        '<div class="ebook-corner"></div>';
      stage.appendChild(board);
      return stage;
    }

    function isStoryLikeScene(scene) {
      const haystack = [
        manifest.stage?.name,
        manifest.stage?.description,
        scene.title,
        scene.description,
        ...(scene.keyPoints || []),
        ...getSpeech(scene).map((action) => action.text || action.content || '')
      ].join(' ').toLowerCase();
      return /\\b(ebook|storybook|story page|read-aloud|junior's big day|junior was|mama|grandmother|said|asked|replied|smiled)\\b/.test(haystack);
    }

    function storyExcerpt(scene) {
      const text = getSpeech(scene)
        .map((action) => action.text || action.content || '')
        .join(' ')
        .replace(/\\s+/g, ' ')
        .trim();
      const fallback = scene.description || scene.title || 'Read this page and listen to the narration.';
      const source = text || fallback;
      const sentences = source.match(/[^.!?]+[.!?]+/g) || [source];
      let out = '';
      for (const sentence of sentences) {
        if ((out + sentence).split(/\\s+/).length > 58) break;
        out += (out ? ' ' : '') + sentence.trim();
        if (out.split(/\\s+/).length >= 28) break;
      }
      return out || source.split(/\\s+/).slice(0, 52).join(' ');
    }

    function firstSceneImage(scene) {
      const elements = scene.content?.canvas?.elements || [];
      const image = elements.find((element) => element.type === 'image' && element.src);
      return image ? resolveMediaSrc(image.src) : '';
    }

    function renderElement(element, baseWidth, baseHeight, slide) {
      const wrap = document.createElement('div');
      wrap.className = 'slide-el slide-el-' + String(element.type || 'item').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
      wrap.style.left = percent(element.left, baseWidth);
      wrap.style.top = percent(element.top, baseHeight);
      wrap.style.width = percent(element.width, baseWidth);
      wrap.style.height = percent(element.height, baseHeight);
      if (element.rotate) wrap.style.transform = 'rotate(' + (Number(element.rotate) || 0) + 'deg)';
      if (element.type === 'image') {
        const src = resolveMediaSrc(element.src);
        if (src) {
          const img = document.createElement('img');
          img.alt = element.alt || 'Lesson visual';
          img.src = src;
          wrap.appendChild(img);
          return wrap;
        }
        wrap.classList.add('missing-visual');
        wrap.textContent = 'Lesson visual';
        return wrap;
      }
      if (element.type === 'shape' && element.path) {
        wrap.appendChild(svgShape(element));
        return wrap;
      }
      if (element.type === 'latex') {
        wrap.classList.add('slide-rich-text');
        wrap.style.color = element.color || slide.theme?.fontColor || '#222';
        wrap.innerHTML = sanitize(element.html || latexFallback(element.latex));
        return wrap;
      }
      if (element.type === 'text' || element.content) {
        wrap.classList.add('slide-rich-text');
        if (element.fill) wrap.style.background = element.fill;
        wrap.style.color = element.defaultColor || slide.theme?.fontColor || '#222';
        wrap.style.fontFamily = element.defaultFontName ? '"' + element.defaultFontName + '", Inter, system-ui, sans-serif' : '';
        wrap.innerHTML = sanitize(element.content || '');
        return wrap;
      }
      return null;
    }

    function resolveMediaSrc(src) {
      const key = String(src || '');
      if (!key) return '';
      return mediaData[key] || mediaData[key.split('/').pop()] || mediaData[key.replace(/^media\\//, '')] || '';
    }

    function svgShape(element) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const box = Array.isArray(element.viewBox) ? element.viewBox : [1, 1];
      svg.setAttribute('viewBox', '0 0 ' + (Number(box[0]) || 1) + ' ' + (Number(box[1]) || 1));
      svg.setAttribute('preserveAspectRatio', element.fixedRatio ? 'xMidYMid meet' : 'none');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', element.path);
      path.setAttribute('fill', element.fill || 'transparent');
      if (element.outline?.color) {
        path.setAttribute('stroke', element.outline.color);
        path.setAttribute('stroke-width', element.outline.width || 1);
      }
      svg.appendChild(path);
      return svg;
    }

    function renderQuiz(content) {
      const quiz = document.createElement('div');
      quiz.className = 'quiz';
      const board = document.createElement('div');
      board.className = 'quiz-board';
      const question = (content.questions || [])[0];
      const questionIndex = content.questionIndex || 1;
      const questionTotal = content.questionTotal || (content.questions || []).length || 1;
      board.innerHTML =
        '<div class="quiz-title"><h2>' + escapeHtml(content.quizTitle || 'Quick Check') + '</h2><span>Question ' +
        escapeHtml(questionIndex) + ' of ' + escapeHtml(questionTotal) + '</span></div>';

      if (!question) {
        quiz.appendChild(board);
        return quiz;
      }

      const card = document.createElement('section');
      card.className = 'question';
      const inputType = question.type === 'multiple' ? 'checkbox' : 'radio';
      const name = 'q_' + sceneIndex;
      const main = document.createElement('div');
      main.className = 'question-main';
      main.innerHTML = '<h3>' + escapeHtml(question.question || 'Question') + '</h3>';

      const optionList = document.createElement('div');
      optionList.className = 'option-list';
      (question.options || []).forEach((option) => {
        const label = document.createElement('label');
        label.className = 'option';
        label.innerHTML = '<input type="' + inputType + '" name="' + name + '" value="' + escapeHtml(option.value) + '"><span><strong>' + escapeHtml(option.value) + '.</strong> ' + escapeHtml(option.label) + '</span>';
        optionList.appendChild(label);
      });
      main.appendChild(optionList);

      const actions = document.createElement('div');
      actions.className = 'quiz-actions';
      const check = document.createElement('button');
      check.type = 'button';
      check.textContent = 'Check answer';
      actions.appendChild(check);
      main.appendChild(actions);

      const analysis = document.createElement('div');
      analysis.className = 'analysis';
      analysis.textContent = question.analysis || '';
      check.addEventListener('click', () => {
        const selected = [...card.querySelectorAll('input:checked')].map((input) => input.value).sort().join(',');
        const answer = [...(question.answer || [])].sort().join(',');
        analysis.style.borderLeftColor = selected === answer ? 'var(--good)' : 'var(--bad)';
        card.classList.add('checked');
      });

      card.appendChild(main);
      card.appendChild(analysis);
      board.appendChild(card);
      quiz.appendChild(board);
      return quiz;
    }

    function renderSpeech(scene) {
      const speech = $('speech');
      const actions = getSpeech(scene);
      speech.innerHTML = '';
      if (!actions.length) {
        speech.innerHTML = '<div class="speech-line">No narration for this scene.</div>';
        return;
      }
      actions.forEach((action, index) => {
        const line = document.createElement('div');
        line.className = 'speech-line';
        line.dataset.index = String(index);
        line.textContent = action.text || action.content || ('Narration ' + (index + 1));
        speech.appendChild(line);
      });
    }

    function getSpeech(scene) {
      return (scene.actions || []).filter((action) => action.type === 'speech');
    }

    async function playSceneAudio(isAutoplay) {
      const scene = manifest.scenes[sceneIndex];
      const actions = getSpeech(scene);
      if (!actions.length) return;
      const token = ++playToken;
      for (let i = 0; i < actions.length; i++) {
        if (token !== playToken) return;
        const url = audioData[actions[i].audioRef] || audioData[String(actions[i].audioRef || '').split('/').pop()];
        if (!url) continue;
        markSpeech(i);
        const played = await playUrl(url, token, isAutoplay);
        if (!played && isAutoplay) {
          autoplayBlocked = true;
          $('status').textContent = 'Browser blocked automatic audio. Click anywhere once, or use Play Scene Audio.';
          return;
        }
      }
      clearSpeech();
    }

    function playUrl(url, token, isAutoplay) {
      return new Promise((resolve) => {
        stopCurrentAudio();
        const audio = new Audio(url);
        currentAudio = audio;
        audio.onended = () => resolve(true);
        audio.onerror = () => resolve(false);
        audio.play().then(() => {
          if (isAutoplay) $('status').textContent = 'Narration starts automatically when each scene loads.';
        }).catch(() => resolve(false));
        const timer = setInterval(() => {
          if (token !== playToken) {
            clearInterval(timer);
            resolve(false);
          }
        }, 120);
      });
    }

    function stopAudio() {
      playToken++;
      stopCurrentAudio();
      clearSpeech();
    }

    function stopCurrentAudio() {
      if (!currentAudio) return;
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    function markSpeech(index) {
      document.querySelectorAll('.speech-line').forEach((line) => line.classList.toggle('playing', line.dataset.index === String(index)));
    }

    function clearSpeech() {
      document.querySelectorAll('.speech-line').forEach((line) => line.classList.remove('playing'));
    }

    function percent(value, base) {
      return ((Number(value || 0) / base) * 100) + '%';
    }

    function sanitize(html) {
      const template = document.createElement('template');
      template.innerHTML = String(html || '');
      template.content.querySelectorAll('script, iframe, object, embed, link, meta').forEach((node) => node.remove());
      template.content.querySelectorAll('*').forEach((node) => {
        [...node.attributes].forEach((attr) => {
          if (/^on/i.test(attr.name)) node.removeAttribute(attr.name);
          if ((attr.name === 'href' || attr.name === 'src') && /^javascript:/i.test(attr.value)) node.removeAttribute(attr.name);
        });
      });
      return template.innerHTML;
    }

    function latexFallback(latex) {
      return escapeHtml(String(latex || '').replace(/\\\\frac\\{([^}]+)\\}\\{([^}]+)\\}/g, '$1 / $2'));
    }

    function escapeHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html, 'utf8');
console.log(outFile);
console.log(`${Buffer.byteLength(html)} bytes`);

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function findFirstFile(dir, predicate) {
  if (!fs.existsSync(dir)) return '';
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && predicate(fullPath)) return fullPath;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = findFirstFile(path.join(dir, entry.name), predicate);
    if (found) return found;
  }
  return '';
}

function expandQuizScenes(scenes) {
  const expanded = [];
  scenes.forEach((scene) => {
    const questions = scene.content?.type === 'quiz' && Array.isArray(scene.content.questions)
      ? scene.content.questions
      : [];
    if (questions.length <= 1) {
      expanded.push(scene);
      return;
    }

    const speechActions = (scene.actions || []).filter((action) => action.type === 'speech');
    questions.forEach((question, index) => {
      const actions = [];
      if (index === 0 && speechActions[0]) actions.push(speechActions[0]);
      if (speechActions[index + 1]) actions.push(speechActions[index + 1]);
      if (index === questions.length - 1 && speechActions[speechActions.length - 1]) {
        const last = speechActions[speechActions.length - 1];
        if (!actions.some((action) => action.id === last.id)) actions.push(last);
      }

      expanded.push({
        ...scene,
        title: `${scene.title}: Question ${index + 1}`,
        content: {
          ...scene.content,
          questions: [question],
          questionIndex: index + 1,
          questionTotal: questions.length,
          quizTitle: scene.title
        },
        actions
      });
    });
  });

  return expanded.map((scene, index) => ({ ...scene, order: index + 1 }));
}
