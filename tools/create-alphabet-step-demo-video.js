#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const bundledFfmpeg = String.raw`C:\Users\inawa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe`;
const bundledFfprobe = String.raw`C:\Users\inawa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffprobe.exe`;

const SEGMENTS = [
  { id: 'intro', step: 'lecture', label: 'Welcome' },
  { id: 'lecture', step: 'lecture', label: 'Lecture', actions: ['lecture-play'] },
  { id: 'rules', step: 'rules', label: 'Rules', actions: ['rules-audio', 'rules-complete'] },
  { id: 'listen', step: 'listen', label: 'Listen', actions: ['tile', 'play-all'] },
  { id: 'watch', step: 'watch', label: 'Watch', actions: ['tile', 'close-modal'] },
  {
    id: 'phonetics',
    step: 'phonetics',
    label: 'Phonetics',
    actions: [
      'phonetics-click-letter',
      'phonetics-video-playing',
      'phonetics-articulation-playing',
      'phonetics-start-second-video',
      'phonetics-second-video-playing',
      'phonetics-final-controls'
    ]
  },
  { id: 'repeat', step: 'repeat', label: 'Repeat', actions: ['focus-stepper', 'repeat-click-letter', 'repeat-show-record'] },
  { id: 'letterclue', step: 'letterclue', label: 'LetterClue', actions: ['focus-stepper', 'letterclue-demo'] },
  { id: 'speak', step: 'speak', label: 'Speak', actions: ['focus-stepper', 'speak-demo'] },
  { id: 'match', step: 'match', label: 'Match', actions: ['focus-stepper', 'focus-grid', 'match-choice'] },
  { id: 'soundclue', step: 'soundclue', label: 'SoundClue', actions: ['focus-stepper', 'soundclue-demo'] },
  { id: 'animate', step: 'animate', label: 'Animate', actions: ['focus-stepper', 'animate-demo'] },
  { id: 'write', step: 'write', label: 'Write', actions: ['focus-stepper', 'write-draw'] },
  { id: 'submit', step: 'submit', label: 'Submit', actions: ['focus-stepper', 'submit-demo'] },
  { id: 'helpers', step: 'submit', label: 'Helpers', actions: ['back-button', 'stepper'] },
  { id: 'closing', step: 'submit', label: 'Great Job', actions: ['stepper'] },
];

function parseArgs(argv) {
  const args = {
    audio: path.join(root, 'src', 'media', 'messages', 'lectures', 'alphabet_lecture_elevenlabs.mp3'),
    audioDir: path.join(root, 'tmp', 'alphabet-lecture-video-audio-wav'),
    out: path.join(root, 'src', 'media', 'messages', 'lectures', 'alphabet_lecture.mp4'),
    framesDir: path.join(root, 'tmp', 'alphabet-step-demo-frames'),
    clipsDir: path.join(root, 'tmp', 'alphabet-step-demo-clips'),
    port: 4173,
    fps: 3,
    width: 1366,
    height: 768,
    keepFrames: false,
    segments: null,
    stitchOnly: false,
    noStitch: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key === '--audio') args.audio = path.resolve(next), i += 1;
    else if (key === '--audio-dir') args.audioDir = path.resolve(next), i += 1;
    else if (key === '--out') args.out = path.resolve(next), i += 1;
    else if (key === '--frames-dir') args.framesDir = path.resolve(next), i += 1;
    else if (key === '--clips-dir') args.clipsDir = path.resolve(next), i += 1;
    else if (key === '--port') args.port = Number(next), i += 1;
    else if (key === '--fps') args.fps = Number(next), i += 1;
    else if (key === '--width') args.width = Number(next), i += 1;
    else if (key === '--height') args.height = Number(next), i += 1;
    else if (key === '--keep-frames') args.keepFrames = true;
    else if (key === '--segment') args.segments = parseSegmentList(next), i += 1;
    else if (key === '--segments') args.segments = parseSegmentList(next), i += 1;
    else if (key === '--stitch-only') args.stitchOnly = true;
    else if (key === '--no-stitch') args.noStitch = true;
  }

  return args;
}

function parseSegmentList(value) {
  const aliases = new Map();
  SEGMENTS.forEach((segment, index) => {
    aliases.set(segment.id.toLowerCase(), segment.id);
    aliases.set(segment.label.toLowerCase(), segment.id);
    aliases.set(String(index + 1), segment.id);
  });

  return String(value || '')
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .map((part) => {
      const match = aliases.get(part);
      if (!match) throw new Error(`Unknown segment "${part}". Use one of: ${SEGMENTS.map((s) => s.id).join(', ')}`);
      return match;
    });
}

function ffmpegPath() {
  return process.env.FFMPEG_PATH || (fs.existsSync(bundledFfmpeg) ? bundledFfmpeg : 'ffmpeg');
}

function ffprobePath() {
  return process.env.FFPROBE_PATH || (fs.existsSync(bundledFfprobe) ? bundledFfprobe : 'ffprobe');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
  });
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return result.stdout || '';
}

function audioDuration(file) {
  const out = run(ffprobePath(), [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ]);
  const value = Number(String(out).trim());
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Could not read duration for ${file}`);
  return value;
}

async function readSegmentDurations(audioDir) {
  const durations = [];
  for (let i = 0; i < SEGMENTS.length; i += 1) {
    const file = segmentAudioFile(audioDir, i);
    durations.push(audioDuration(file));
  }
  return durations;
}

function segmentAudioFile(audioDir, index) {
  const wav = path.join(audioDir, `slide_${String(index).padStart(2, '0')}.wav`);
  const mp3 = path.join(audioDir, `slide_${String(index).padStart(2, '0')}.mp3`);
  const file = fs.existsSync(wav) ? wav : mp3;
  if (!fs.existsSync(file)) {
    throw new Error(`Missing segment audio timing file: ${wav}`);
  }
  return file;
}

function segmentClipName(segment, index) {
  return `${String(index + 1).padStart(2, '0')}_${segment.id}.mp4`;
}

function segmentClipPath(clipsDir, segment, index) {
  return path.join(clipsDir, segmentClipName(segment, index));
}

function selectedSegmentIndexes(args) {
  if (!args.segments || !args.segments.length) {
    return SEGMENTS.map((_segment, index) => index);
  }
  const wanted = new Set(args.segments);
  return SEGMENTS
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => wanted.has(segment.id))
    .map(({ index }) => index);
}

function concatFileLine(filePath) {
  return `file '${path.resolve(filePath).replace(/\\/g, '/').replace(/'/g, "'\\''")}'`;
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on('error', reject);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerReady(port) {
  try {
    await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${port}/pre_quraan_integration/units/alphabet/index.html`, (res) => {
        res.resume();
        res.statusCode && res.statusCode < 500 ? resolve() : reject(new Error(String(res.statusCode)));
      });
      req.setTimeout(800, () => {
        req.destroy(new Error('timeout'));
      });
      req.on('error', reject);
    });
    return true;
  } catch (_error) {
    return false;
  }
}

async function startServer(port) {
  if (await isServerReady(port)) return null;

  const child = spawn(process.execPath, ['tools/serve-bunny-output.js', String(port)], {
    cwd: root,
    stdio: 'ignore',
    windowsHide: true,
    detached: false,
  });

  for (let i = 0; i < 40; i += 1) {
    if (await isServerReady(port)) return child;
    await wait(250);
  }

  child.kill();
  throw new Error(`Could not start local server on port ${port}`);
}

function chromePath() {
  const candidates = [
    path.join(process.env.ProgramFiles || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ];
  const found = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (!found) throw new Error('Chrome or Edge was not found.');
  return found;
}

async function startChrome(width, height) {
  const debugPort = 9229 + Math.floor(Math.random() * 1000);
  const userDataDir = path.join(os.tmpdir(), `pq-alphabet-demo-${Date.now()}`);
  await fsp.mkdir(userDataDir, { recursive: true });

  const child = spawn(chromePath(), [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--mute-audio',
    '--autoplay-policy=no-user-gesture-required',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--hide-scrollbars',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--no-first-run',
    '--no-default-browser-check',
    `--window-size=${width},${height}`,
    'about:blank',
  ], {
    stdio: 'ignore',
    windowsHide: true,
  });

  for (let i = 0; i < 80; i += 1) {
    try {
      const version = await requestJson(`http://127.0.0.1:${debugPort}/json/version`);
      if (version.webSocketDebuggerUrl) {
        return { child, debugPort, wsUrl: version.webSocketDebuggerUrl, userDataDir };
      }
    } catch (_error) {}
    await wait(250);
  }

  child.kill();
  throw new Error('Could not start Chrome remote debugging.');
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (!msg.id || !this.pending.has(msg.id)) return;
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else resolve(msg.result || {});
    });
  }

  async send(method, params = {}, sessionId = null) {
    await this.ready;
    const id = this.nextId;
    this.nextId += 1;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    this.ws.send(JSON.stringify(message));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    try { this.ws.close(); } catch (_error) {}
  }
}

async function connectPage(browserWsUrl) {
  const browser = new CdpClient(browserWsUrl);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });

  return {
    browser,
    send(method, params = {}) {
      return browser.send(method, params, sessionId);
    },
    close() {
      browser.close();
    },
  };
}

async function evaluate(page, expression, awaitPromise = true) {
  const result = await page.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    const text = result.exceptionDetails.text || 'Evaluation failed';
    throw new Error(text);
  }
  return result.result ? result.result.value : undefined;
}

async function installDemoHelpers(page) {
  await evaluate(page, `(() => {
    const style = document.createElement('style');
    style.id = 'pq-demo-recorder-style';
    style.textContent = \`
      html, body { scroll-behavior: auto !important; }
      *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
      #pqDemoCursor {
        position: fixed; left: 0; top: 0; width: 26px; height: 26px; z-index: 2147483647;
        transform: translate(-100px, -100px); pointer-events: none;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,.28));
      }
      #pqDemoCursor::before {
        content: ""; position: absolute; width: 0; height: 0;
        border-left: 22px solid #13233a; border-top: 8px solid transparent; border-bottom: 8px solid transparent;
        transform: rotate(42deg); transform-origin: 2px 8px;
      }
      #pqDemoCursor::after {
        content: ""; position: absolute; left: 14px; top: 15px; width: 8px; height: 8px;
        background: #ffbf38; border: 2px solid #13233a; border-radius: 999px;
      }
      .pq-demo-click-ring {
        position: fixed; z-index: 2147483646; width: 46px; height: 46px; margin: -23px 0 0 -23px;
        border: 4px solid #ffbf38; border-radius: 999px; pointer-events: none;
        box-shadow: 0 0 0 5px rgba(255,255,255,.72);
      }
      .pq-demo-step-label {
        position: fixed; left: 24px; top: 24px; z-index: 2147483645;
        background: rgba(16,34,58,.92); color: #fff; border: 2px solid rgba(255,255,255,.55);
        border-radius: 12px; padding: 10px 14px; font: 800 18px system-ui, sans-serif;
        box-shadow: 0 8px 24px rgba(0,0,0,.22);
      }
      body.pq-demo-recording #managedStepsList .managed-step {
        opacity: .34 !important; filter: saturate(.55) !important;
      }
      body.pq-demo-recording #managedStepsList .managed-step.pq-demo-current-step {
        opacity: 1 !important; filter: none !important;
        outline: 5px solid #ffbf38 !important; outline-offset: 4px !important;
        box-shadow: 0 16px 34px rgba(17,32,54,.28), 0 0 0 8px rgba(255,191,56,.22) !important;
        transform: scale(1.04) !important;
      }
      body.pq-demo-recording #managedStepsList .managed-step.pq-demo-current-step .managed-step-meta {
        font-size: 0 !important;
      }
      body.pq-demo-recording #managedStepsList .managed-step.pq-demo-current-step .managed-step-meta::after {
        content: "Current step" !important; font-size: .88rem !important;
      }
      body.pq-demo-recording #pqSoundArticulationModal {
        align-items: flex-start !important;
        padding: 8px !important;
      }
      body.pq-demo-recording #pqSoundArticulationModal .pq-sound-modal-card {
        width: min(1060px, 96vw) !important;
        max-height: none !important;
        overflow: visible !important;
        transform: scale(.68) !important;
        transform-origin: top center !important;
        padding: 10px !important;
      }
      body.pq-demo-recording #pqSoundArticulationModal .pq-sound-modal-actions {
        margin-top: 8px !important;
        padding: 10px !important;
        gap: 10px !important;
      }
      body.pq-demo-recording #pqSoundArticulationModal .pq-sound-modal-btn {
        min-width: 170px !important;
        padding: 10px 18px !important;
        border-radius: 18px !important;
      }
      body.pq-demo-recording #pqSoundArticulationModal .pq-sound-modal-guard {
        margin-top: 8px !important;
        padding: 7px 14px !important;
      }
    \`;
    document.head.appendChild(style);
    document.body.classList.add('pq-demo-recording');
    const cursor = document.createElement('div');
    cursor.id = 'pqDemoCursor';
    document.body.appendChild(cursor);
    const label = document.createElement('div');
    label.id = 'pqDemoStepLabel';
    label.className = 'pq-demo-step-label';
    document.body.appendChild(label);
    window.__pqDemo = {
      cursor,
      label,
      setLabel(text) { label.textContent = String(text || ''); },
      stepMeta: {
        lecture: { index: 1, title: 'Lecture' },
        rules: { index: 2, title: 'Rules' },
        listen: { index: 3, title: 'Listen' },
        watch: { index: 4, title: 'Watch' },
        phonetics: { index: 5, title: 'Phonetics' },
        repeat: { index: 6, title: 'Repeat' },
        letterclue: { index: 7, title: 'LetterClue' },
        speak: { index: 8, title: 'Speak' },
        match: { index: 9, title: 'Match' },
        soundclue: { index: 10, title: 'SoundClue' },
        animate: { index: 11, title: 'Animate' },
        write: { index: 12, title: 'Write' },
        submit: { index: 13, title: 'Submit' }
      },
      currentStepId: '',
      focusCurrentStep(stepId) {
        const sid = String(stepId || '').toLowerCase();
        this.currentStepId = sid;
        const current = document.querySelector('#managedStepsList [data-stepid="' + sid + '"]');
        document.querySelectorAll('#managedStepsList .managed-step').forEach((node) => {
          node.classList.toggle('pq-demo-current-step', node === current);
        });
        if (current) {
          try { current.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {}
        }
        const meta = this.stepMeta[sid];
        if (meta) this.setLabel('Step ' + meta.index + ': ' + meta.title);
      },
      center(selector) {
        const el = document.querySelector(selector);
        if (!el) return null;
        try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {}
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return null;
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
      },
      moveTo(x, y) { cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)'; },
      ring(x, y) {
        const ring = document.createElement('div');
        ring.className = 'pq-demo-click-ring';
        ring.style.left = x + 'px';
        ring.style.top = y + 'px';
        document.body.appendChild(ring);
        setTimeout(() => ring.remove(), 650);
      },
      async click(selector) {
        const pos = this.center(selector);
        if (!pos) return false;
        this.moveTo(pos.x, pos.y);
        this.ring(pos.x, pos.y);
        await new Promise((resolve) => setTimeout(resolve, 90));
        const el = document.querySelector(selector);
        if (el && typeof el.click === 'function') el.click();
        return true;
      },
      async clickFirst(selectors) {
        for (const selector of selectors) {
          if (document.querySelector(selector) && await this.click(selector)) return true;
        }
        return false;
      },
      gridTile(key = 'alph_1') {
        try {
          const gridEl = document.getElementById('grid');
          const tiles = Array.from((gridEl || document).querySelectorAll('.tile[data-key]'))
            .filter((tile) => {
              const rect = tile.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            });
          return tiles.find((tile) => String(tile.dataset.key || '') === key) || tiles[0] || null;
        } catch (e) {
          return null;
        }
      },
      async clickGridTile(key = 'alph_1') {
        const tile = this.gridTile(key);
        if (!tile) return false;
        try { tile.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' }); } catch (e) {}
        await this.delay(250);
        return this.clickElement(tile);
      },
      showRepeatRecord(key = 'alph_1') {
        try {
          if (typeof __pqShowRepeatRecordUi === 'function') {
            __pqShowRepeatRecordUi(key, 'Tap Record, then say the letter. Chance 1 of 3');
            return true;
          }
        } catch (e) {}
        return false;
      },
      startLetterClue(key = 'alph_1') {
        try {
          if (typeof window.__pqDemoRunPlaybackAction === 'function' && window.__pqDemoRunPlaybackAction('letterclue', key)) {
            return true;
          }
          const controller = new AbortController();
          window.__pqDemoListenPlusController = controller;
          if (typeof __pqMaybeRunListenPlusAnimal === 'function') {
            __pqMaybeRunListenPlusAnimal('listenplus', key, 1, controller.signal).catch(() => {});
            return true;
          }
        } catch (e) {}
        return false;
      },
      startSoundClue(key = 'alph_1') {
        try {
          if (typeof window.__pqDemoRunPlaybackAction === 'function' && window.__pqDemoRunPlaybackAction('soundclue', key)) {
            return true;
          }
          const controller = new AbortController();
          window.__pqDemoWordsController = controller;
          if (typeof __pqMaybeRunWordsItem === 'function') {
            __pqMaybeRunWordsItem('words', key, 1, controller.signal).catch(() => {});
            return true;
          }
        } catch (e) {}
        return false;
      },
      startWatchFlow(key = 'alph_1', stepId = 'watch') {
        try {
          const action = stepId === 'sound' ? 'phonetics' : stepId;
          if (typeof window.__pqDemoRunPlaybackAction === 'function' && window.__pqDemoRunPlaybackAction(action, key, stepId)) {
            return true;
          }
          const controller = new AbortController();
          window.__pqDemoWatchController = controller;
          if (typeof playWatchVideoForKey === 'function') {
            playWatchVideoForKey(key, 1, stepId, controller.signal).catch(() => {});
            return true;
          }
        } catch (e) {}
        return false;
      },
      showVideoModal(src = '/pre_quraan_integration/lessons/alphabet/media/video/alph_01.mp4') {
        try {
          let modal = document.getElementById('videoModal');
          if (!modal) {
            modal = document.createElement('div');
            modal.id = 'videoModal';
            modal.innerHTML = '<div class="pq-demo-video-card"><video id="player" controls playsinline></video></div>';
            document.body.appendChild(modal);
          }
          const player = document.getElementById('player') || modal.querySelector('video');
          if (player) {
            try { player.pause(); } catch (e) {}
            player.src = src;
            player.controls = true;
            player.muted = true;
            player.currentTime = 0;
            try { player.load(); } catch (e) {}
            try { player.play(); } catch (e) {}
          }
          modal.style.display = 'flex';
          modal.style.position = 'fixed';
          modal.style.inset = '0';
          modal.style.zIndex = '9998';
          modal.style.alignItems = 'center';
          modal.style.justifyContent = 'center';
          modal.style.background = 'rgba(10, 20, 20, .62)';
          const card = modal.querySelector('.pq-demo-video-card') || player;
          if (card) {
            card.style.width = 'min(76vw, 840px)';
            card.style.maxHeight = '82vh';
          }
          if (player) {
            player.style.width = '100%';
            player.style.maxHeight = '82vh';
            player.style.borderRadius = '16px';
            player.style.background = '#fff';
            player.style.boxShadow = '0 22px 60px rgba(0,0,0,.28)';
          }
          return true;
        } catch (e) {
          return false;
        }
      },
      showArticulationModal(finalControls = false) {
        try {
          this.clearTransientUi();
          const old = document.getElementById('pqSoundArticulationModal');
          if (old) old.remove();
          const modal = document.createElement('div');
          modal.id = 'pqSoundArticulationModal';
          modal.className = 'pq-demo-articulation-modal';
          modal.innerHTML = [
            '<div class="pq-demo-articulation-card">',
            '  <img alt="How to say Alif" src="/pre_quraan_integration/lessons/alphabet/media/sound/images/alph_01_articulation.png">',
            '  <div class="pq-demo-articulation-actions">',
            finalControls
              ? '    <button>Explainer</button><button>Play Letter</button><button>Play Video</button><button>Next Letter</button>'
              : '    <button class="is-playing">...Playing explainer</button><button disabled>Play Letter</button><button disabled>Play Video</button>',
            '  </div>',
            '</div>'
          ].join('');
          document.body.appendChild(modal);
          const style = document.createElement('style');
          style.textContent = [
            '.pq-demo-articulation-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(13,38,33,.58);padding:18px;}',
            '.pq-demo-articulation-card{width:min(94vw,1040px);max-height:94vh;background:#fffdf4;border-radius:24px;padding:14px 18px 18px;box-shadow:0 24px 60px rgba(0,0,0,.28);overflow:hidden;}',
            '.pq-demo-articulation-card img{display:block;width:100%;max-height:76vh;object-fit:contain;border-radius:18px;}',
            '.pq-demo-articulation-actions{margin-top:12px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:12px;border:3px solid #e4b966;border-radius:18px;background:#ffe3a8;direction:ltr;}',
            '.pq-demo-articulation-actions button{min-height:52px;border-radius:18px;border:3px solid #fff;background:#fff7d9;color:#4c310b;font:800 22px system-ui,sans-serif;}',
            '.pq-demo-articulation-actions button.is-playing{background:#e6f6d8;color:#4f7e4b;}',
            '.pq-demo-articulation-actions button:disabled{opacity:.55;}'
          ].join('\\n');
          modal.appendChild(style);
          return true;
        } catch (e) {
          return false;
        }
      },
      showRepeatRecord(key = 'alph_1') {
        try {
          this.clearTransientUi();
          const modal = document.createElement('div');
          modal.className = 'pq-demo-simple-modal';
          modal.innerHTML = [
            '<div class="pq-demo-repeat-card">',
            '  <h2>Your turn - repeat the letter</h2>',
            '  <div class="pq-demo-letter-box">ا</div>',
            '  <p>Tap Record, then say the letter. Chance 1 of 3.</p>',
            '  <button>Record</button>',
            '</div>'
          ].join('');
          this.installSimpleModalStyles();
          document.body.appendChild(modal);
          return true;
        } catch (e) {
          return false;
        }
      },
      showSpeakPractice() {
        try {
          this.clearTransientUi();
          const modal = document.createElement('div');
          modal.className = 'pq-demo-simple-modal';
          modal.innerHTML = [
            '<div class="pq-demo-repeat-card pq-demo-speak-card">',
            '  <h2>Your turn - speak the letter</h2>',
            '  <div class="pq-demo-letter-box">ا</div>',
            '  <p>Enable the mic, record your voice, then tap Done.</p>',
            '  <div class="pq-demo-action-row"><button>Mic</button><button>Record</button><button>Done</button></div>',
            '</div>'
          ].join('');
          this.installSimpleModalStyles();
          document.body.appendChild(modal);
          return true;
        } catch (e) {
          return false;
        }
      },
      showSubmitPractice() {
        try {
          this.clearTransientUi();
          const modal = document.createElement('div');
          modal.className = 'pq-demo-simple-modal';
          modal.innerHTML = [
            '<div class="pq-demo-repeat-card pq-demo-submit-card">',
            '  <h2>Submit</h2>',
            '  <p>Practice first. Then record the whole unit in one clear voice.</p>',
            '  <div class="pq-demo-submit-line">ا  ب  ت  ث  ج  ح  خ</div>',
            '  <div class="pq-demo-action-row"><button>Listen</button><button>Start recording</button><button>Submit for teacher</button></div>',
            '</div>'
          ].join('');
          this.installSimpleModalStyles();
          document.body.appendChild(modal);
          return true;
        } catch (e) {
          return false;
        }
      },
      showLetterCluePractice() {
        try {
          this.clearTransientUi();
          const modal = document.createElement('div');
          modal.className = 'pq-demo-simple-modal';
          modal.innerHTML = [
            '<div class="pq-demo-clue-card">',
            '  <h2>+Listen</h2>',
            '  <div class="pq-demo-letter-chip">ا</div>',
            '  <img alt="Letter clue" src="/pre_quraan_integration/lessons/alphabet/media/listen_plus/animals/images/a_alligator.png">',
            '  <div class="pq-demo-clue-label">Alligator  A</div>',
            '  <p>Arabic sound + animal sound</p>',
            '</div>'
          ].join('');
          this.installSimpleModalStyles();
          document.body.appendChild(modal);
          return true;
        } catch (e) {
          return false;
        }
      },
      showSoundCluePractice() {
        try {
          this.clearTransientUi();
          const modal = document.createElement('div');
          modal.className = 'pq-demo-simple-modal';
          modal.innerHTML = [
            '<div class="pq-demo-clue-card">',
            '  <h2>Words</h2>',
            '  <div class="pq-demo-letter-chip">ا</div>',
            '  <img alt="Sound clue" src="/pre_quraan_integration/lessons/alphabet/media/words/images/alif_asad.png">',
            '  <div class="pq-demo-clue-label">ا أسد</div>',
            '  <p>Arabic letter + Arabic word</p>',
            '</div>'
          ].join('');
          this.installSimpleModalStyles();
          document.body.appendChild(modal);
          return true;
        } catch (e) {
          return false;
        }
      },
      showAnimatePractice() {
        try {
          this.clearTransientUi();
          const modal = document.createElement('div');
          modal.className = 'pq-demo-simple-modal';
          modal.innerHTML = [
            '<div class="pq-demo-animate-card">',
            '  <h2>Watch the letter being written</h2>',
            '  <video autoplay muted loop playsinline src="/pre_quraan_integration/lessons/alphabet/media/animate/alph_02.mp4"></video>',
            '  <p>Watch where the line starts, how it moves, and where it ends.</p>',
            '</div>'
          ].join('');
          this.installSimpleModalStyles();
          document.body.appendChild(modal);
          return true;
        } catch (e) {
          return false;
        }
      },
      showClueModal(kind = 'letterclue') {
        try {
          this.clearTransientUi();
          const isSound = kind === 'soundclue';
          const modal = document.createElement('div');
          modal.className = 'pq-demo-simple-modal';
          const image = isSound
            ? '/pre_quraan_integration/lessons/alphabet/media/words/images/alif_asad.png'
            : '/pre_quraan_integration/lessons/alphabet/media/listen_plus/animals/images/a_alligator.png';
          const title = isSound ? 'Words' : '+Listen';
          const label = isSound ? 'ا أسد' : 'Alligator  A';
          const sub = isSound ? 'Arabic letter + Arabic word' : 'Arabic sound + animal sound';
          modal.innerHTML = [
            '<div class="pq-demo-clue-card">',
            '  <h2>' + title + '</h2>',
            '  <div class="pq-demo-letter-chip">ا</div>',
            '  <img alt="' + title + '" src="' + image + '">',
            '  <div class="pq-demo-clue-label">' + label + '</div>',
            '  <p>' + sub + '</p>',
            '</div>'
          ].join('');
          this.installSimpleModalStyles();
          document.body.appendChild(modal);
          return true;
        } catch (e) {
          return false;
        }
      },
      installSimpleModalStyles() {
        if (document.getElementById('pqDemoSimpleModalStyles')) return;
        const style = document.createElement('style');
        style.id = 'pqDemoSimpleModalStyles';
        style.textContent = [
          '.pq-demo-simple-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(13,38,33,.50);backdrop-filter:blur(6px);padding:18px;}',
          '.pq-demo-repeat-card,.pq-demo-clue-card,.pq-demo-animate-card{width:min(84vw,760px);background:#fffdf4;border-radius:28px;padding:30px;box-shadow:0 24px 60px rgba(0,0,0,.26);text-align:center;color:#17233e;font-family:system-ui,sans-serif;direction:ltr;}',
          '.pq-demo-repeat-card h2,.pq-demo-clue-card h2,.pq-demo-animate-card h2{margin:0 0 18px;font-size:34px;line-height:1.1;font-weight:900;}',
          '.pq-demo-letter-box,.pq-demo-letter-chip{display:inline-grid;place-items:center;background:#dff7e8;border:4px solid #fff;border-radius:24px;color:#00964f;font-size:76px;font-weight:900;width:160px;height:120px;margin:8px auto 18px;}',
          '.pq-demo-repeat-card p,.pq-demo-clue-card p{font-size:24px;line-height:1.35;font-weight:800;margin:14px auto;color:#283957;direction:ltr;}',
          '.pq-demo-repeat-card button{border:4px solid #fff;border-radius:22px;background:#ffe5ad;color:#075d36;font-size:30px;font-weight:900;padding:18px 42px;box-shadow:0 12px 28px rgba(0,0,0,.12);}',
          '.pq-demo-action-row{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-top:22px;}',
          '.pq-demo-action-row button{font-size:24px;min-width:145px;}',
          '.pq-demo-submit-line{margin:18px auto;padding:20px;border-radius:20px;background:#effaf3;color:#075d36;font-size:42px;font-weight:900;direction:rtl;}',
          '.pq-demo-clue-card{width:min(76vw,700px);}',
          '.pq-demo-clue-card img{display:block;width:min(420px,72vw);height:320px;object-fit:contain;margin:4px auto 22px;background:#fff2bf;border-radius:22px;border:4px solid #fff;}',
          '.pq-demo-clue-label{font-size:42px;font-weight:950;color:#17233e;}',
          '.pq-demo-animate-card{width:min(78vw,780px);}',
          '.pq-demo-animate-card video{display:block;width:100%;height:430px;object-fit:contain;background:#fff;border-radius:20px;border:4px solid #fff;box-shadow:0 12px 30px rgba(0,0,0,.12);}',
          '.pq-demo-animate-card p{font-size:24px;line-height:1.35;font-weight:800;margin:18px auto 0;color:#283957;direction:ltr;}'
        ].join('\\n');
        document.head.appendChild(style);
      },
      async waitFor(selector, timeout = 5000) {
        const started = Date.now();
        while ((Date.now() - started) < timeout) {
          const el = document.querySelector(selector);
          if (el) return el;
          await new Promise((resolve) => setTimeout(resolve, 120));
        }
        return null;
      },
      isVisible(el) {
        if (!el) return false;
        try {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        } catch (e) {
          return false;
        }
      },
      async clickElement(el) {
        if (!el) return false;
        try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {}
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        const x = Math.round(r.left + r.width / 2);
        const y = Math.round(r.top + r.height / 2);
        this.moveTo(x, y);
        this.ring(x, y);
        await new Promise((resolve) => setTimeout(resolve, 90));
        try { el.click(); } catch (e) {}
        return true;
      },
      async endCurrentVideoQuickly() {
        const video = document.getElementById('player') || document.querySelector('video');
        if (!video) return false;
        try {
          if (Number.isFinite(video.duration) && video.duration > 0) {
            video.currentTime = Math.max(0, video.duration - 0.05);
          }
        } catch (e) {}
        try { video.dispatchEvent(new Event('ended')); } catch (e) {}
        return true;
      },
      async dismissMessages() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueButton = buttons.find((button) => /continue/i.test(String(button.textContent || '')));
        if (continueButton) {
          const r = continueButton.getBoundingClientRect();
          this.moveTo(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
          continueButton.click();
          await new Promise((resolve) => setTimeout(resolve, 180));
          return true;
        }
        return false;
      },
      async openStep(stepId) {
        this.clearTransientUi();
        try {
          if (typeof window.__pqOpenStepForReview === 'function') {
            window.__pqOpenStepForReview(stepId);
          } else {
            document.dispatchEvent(new CustomEvent('pq:open-step-review', { detail: { stepId } }));
          }
        } catch (e) {}
        await new Promise((resolve) => setTimeout(resolve, 350));
        await this.dismissMessages();
        await new Promise((resolve) => setTimeout(resolve, 160));
        this.clearTransientUi();
        this.focusCurrentStep(stepId);
        await new Promise((resolve) => setTimeout(resolve, 180));
        this.focusCurrentStep(stepId);
      },
      pauseAllMedia() {
        try { document.querySelectorAll('audio,video').forEach((m) => { try { m.pause(); } catch (e) {} }); } catch (e) {}
        try { if (window.__pqRulesAudio) window.__pqRulesAudio.pause(); } catch (e) {}
      },
      resetDemoLabels() {
        const pause = document.getElementById('btnPause');
        if (pause) {
          pause.textContent = 'Pause';
          pause.setAttribute('aria-label', 'Pause');
          pause.title = 'Pause';
        }
      },
      focusStepper() {
        const sid = this.currentStepId;
        const stepper = document.querySelector('#managedStepper, #managedStepsList');
        if (stepper) {
          try { stepper.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {}
        }
        if (sid) this.focusCurrentStep(sid);
      },
      clearTransientUi() {
        this.pauseAllMedia();
        try {
          const videoModal = document.getElementById('videoModal');
          if (videoModal) {
            videoModal.style.display = 'none';
            videoModal.classList.remove('pq-animate-video-modal');
          }
          const player = document.getElementById('player');
          if (player) {
            try { player.pause(); } catch (e) {}
            player.removeAttribute('src');
            try { player.load(); } catch (e) {}
          }
        } catch (e) {}
        try {
          const words = document.getElementById('pqWordsOverlay');
          if (words) {
            words.classList.remove('pq-show');
            words.style.display = 'none';
          }
        } catch (e) {}
        try {
          const sound = document.getElementById('pqSoundArticulationModal');
          if (sound) sound.remove();
        } catch (e) {}
        try {
          const speak = document.getElementById('pqSpeakChildModal');
          if (speak) speak.classList.remove('is-open');
        } catch (e) {}
        try {
          document.querySelectorAll('.pq-demo-simple-modal').forEach((el) => el.remove());
        } catch (e) {}
        this.resetDemoLabels();
      },
      async runAction(name) {
        const preservePhoneticsFlow = /^phonetics-(video|articulation|start-second|second-video|final-controls)/.test(name);
        if (!preservePhoneticsFlow) {
          await this.dismissMessages();
          this.clearTransientUi();
        } else {
          await this.dismissMessages();
        }
        if (name === 'lecture-play') {
          await this.clickFirst(['#lecturePlayBtn:not([hidden])', '#lectureVideo', '#pqLectureCtaBtn']);
          this.pauseAllMedia();
        } else if (name === 'rules-audio') {
          await this.clickFirst(['#pqAlphabetRulesAudioBtn']);
          this.pauseAllMedia();
        } else if (name === 'rules-complete') {
          await this.clickFirst(['#pqAlphabetRulesCompleteBtn', '#pqStepActionBtn']);
        } else if (name === 'play-all') {
          await this.clickFirst(['#btnPlayAll', '#pqStepActionBtn']);
          this.pauseAllMedia();
        } else if (name === 'pause') {
          await this.clickFirst(['#btnPause']);
          this.pauseAllMedia();
        } else if (name === 'tile') {
          await this.clickGridTile('alph_1') || await this.clickFirst(['#grid button:not([disabled])', '#grid .cell', '#grid [role="button"]', '.grid button:not([disabled])']);
          this.pauseAllMedia();
        } else if (name === 'phonetics-click-letter') {
          this.focusCurrentStep('phonetics');
          await this.clickGridTile('alph_1');
          await this.delay(300);
          this.showVideoModal('/pre_quraan_integration/lessons/alphabet/media/video/alph_01.mp4');
        } else if (name === 'phonetics-video-playing') {
          this.focusCurrentStep('phonetics');
          this.showVideoModal('/pre_quraan_integration/lessons/alphabet/media/video/alph_01.mp4');
        } else if (name === 'phonetics-articulation-playing') {
          this.focusCurrentStep('phonetics');
          await this.endCurrentVideoQuickly();
          this.showArticulationModal(false);
        } else if (name === 'phonetics-start-second-video') {
          this.focusCurrentStep('phonetics');
          this.showVideoModal('/pre_quraan_integration/lessons/alphabet/media/video/alph_01.mp4');
        } else if (name === 'phonetics-second-video-playing') {
          this.focusCurrentStep('phonetics');
          this.showVideoModal('/pre_quraan_integration/lessons/alphabet/media/video/alph_01.mp4');
        } else if (name === 'phonetics-final-controls') {
          this.focusCurrentStep('phonetics');
          await this.endCurrentVideoQuickly();
          this.showArticulationModal(true);
        } else if (name === 'phonetics-demo') {
          await this.clickGridTile('alph_1');
          this.pauseAllMedia();
        } else if (name === 'repeat-click-letter') {
          this.focusCurrentStep('repeat');
          await this.clickGridTile('alph_1');
          this.pauseAllMedia();
        } else if (name === 'repeat-show-record') {
          this.focusCurrentStep('repeat');
          this.showRepeatRecord('alph_1');
          await this.delay(250);
        } else if (name === 'letterclue-demo') {
          this.focusCurrentStep('letterclue');
          await this.delay(250);
          this.showLetterCluePractice();
        } else if (name === 'focus-grid') {
          const target = document.querySelector('#grid, .grid-wrap');
          if (target) {
            try { target.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {}
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
          this.clearTransientUi();
        } else if (name === 'focus-stepper') {
          this.clearTransientUi();
          this.focusStepper();
          await new Promise((resolve) => setTimeout(resolve, 250));
        } else if (name === 'soundclue-demo') {
          this.focusCurrentStep('soundclue');
          await this.delay(250);
          this.showSoundCluePractice();
        } else if (name === 'animate-demo') {
          this.focusCurrentStep('animate');
          await this.delay(250);
          this.showAnimatePractice();
          await new Promise((resolve) => setTimeout(resolve, 900));
        } else if (name === 'close-modal') {
          await new Promise((resolve) => setTimeout(resolve, 120));
          await this.clickFirst(['#closeBtn', '#videoModal #closeBtn']);
          this.pauseAllMedia();
        } else if (name === 'step-action') {
          await this.clickFirst(['#pqStepActionBtn']);
        } else if (name === 'speak-demo') {
          this.focusCurrentStep('speak');
          this.showSpeakPractice();
        } else if (name === 'submit-demo') {
          this.focusCurrentStep('submit');
          this.showSubmitPractice();
        } else if (name === 'speak-mic') {
          await this.clickFirst(['#pqSpeakBtnMic']);
        } else if (name === 'speak-record') {
          await this.clickFirst(['#pqSpeakBtnRecord']);
        } else if (name === 'speak-done') {
          await this.clickFirst(['#pqSpeakBtnCompare', '#pqSpeakBtnNext']);
        } else if (name === 'match-choice') {
          await this.clickFirst(['.pq-match-option:not([disabled])', '#grid button:not([disabled])', '#grid .cell']);
          this.pauseAllMedia();
        } else if (name === 'submit-listen') {
          await this.clickFirst(['#pqSubmitPlayAudio', '.pq-submit-item']);
          this.pauseAllMedia();
        } else if (name === 'submit-start') {
          await this.clickFirst(['#pqSubmitStart']);
        } else if (name === 'submit-stop') {
          await this.clickFirst(['#pqSubmitStop']);
        } else if (name === 'back-button') {
          await this.clickFirst(['#pqDesktopBackBtn', '#pqMobileBackBtn']);
        } else if (name === 'stepper') {
          await this.clickFirst(['#managedStepsList [data-stepid="lecture"]', '#managedStepsList .managed-step']);
        } else if (name === 'write-draw') {
          const canvas = document.querySelector('canvas[data-ink-canvas], .traceCell canvas, canvas');
          if (canvas) {
            canvas.scrollIntoView({ block: 'center', inline: 'center' });
            const r = canvas.getBoundingClientRect();
            const pts = [
              { x: r.left + r.width * .28, y: r.top + r.height * .38 },
              { x: r.left + r.width * .42, y: r.top + r.height * .55 },
              { x: r.left + r.width * .57, y: r.top + r.height * .48 },
              { x: r.left + r.width * .70, y: r.top + r.height * .62 },
            ];
            this.moveTo(Math.round(pts[0].x), Math.round(pts[0].y));
            const down = new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: pts[0].x, clientY: pts[0].y });
            canvas.dispatchEvent(down);
            for (const p of pts.slice(1)) {
              this.moveTo(Math.round(p.x), Math.round(p.y));
              canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: p.x, clientY: p.y }));
              await new Promise((resolve) => setTimeout(resolve, 80));
            }
            canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: pts[pts.length - 1].x, clientY: pts[pts.length - 1].y }));
          }
        } else if (name === 'write-print') {
          await this.clickFirst(['#btnPrintDraw']);
          await this.delay(300);
        }
      }
    };
  })()`);
}

async function capturePng(page, filePath) {
  const result = await page.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await fsp.writeFile(filePath, Buffer.from(result.data, 'base64'));
}

async function renderSegment(page, segment, duration, fps, frameState) {
  const frameCount = Math.max(3, Math.round(duration * fps));
  await evaluate(page, `(async () => { try { return await window.__pqDemo.openStep(${JSON.stringify(segment.step)}); } catch (e) { return false; } })()`);
  if (segment.id === 'intro' || segment.id === 'helpers' || segment.id === 'closing') {
    await evaluate(page, `(async () => { try { return await window.__pqDemo.setLabel(${JSON.stringify(segment.label)}); } catch (e) { return false; } })()`);
  }
  await wait(250);

  const actions = segment.actions || [];
  const actionFrames = actions.map((action, index) => ({
    action,
    frame: action === 'focus-stepper' ? 1 : Math.max(1, Math.round(((index + 1) / (actions.length + 1)) * frameCount)),
    done: false,
  }));

  for (let i = 0; i < frameCount; i += 1) {
    if (segment.id === 'letterclue' && i === Math.max(2, Math.round(frameCount * 0.42))) {
      await evaluate(page, `(async () => { try { window.__pqDemo.focusCurrentStep('letterclue'); return window.__pqDemo.showLetterCluePractice(); } catch (e) { return false; } })()`);
      await wait(160);
    }
    if (segment.id === 'soundclue' && i === Math.max(2, Math.round(frameCount * 0.42))) {
      await evaluate(page, `(async () => { try { window.__pqDemo.focusCurrentStep('soundclue'); return window.__pqDemo.showSoundCluePractice(); } catch (e) { return false; } })()`);
      await wait(160);
    }
    if (segment.id === 'animate' && i === Math.max(2, Math.round(frameCount * 0.42))) {
      await evaluate(page, `(async () => { try { window.__pqDemo.focusCurrentStep('animate'); return window.__pqDemo.showAnimatePractice(); } catch (e) { return false; } })()`);
      await wait(160);
    }

    for (const item of actionFrames) {
      if (!item.done && i >= item.frame) {
        item.done = true;
        await evaluate(page, `(async () => { try { return await window.__pqDemo.runAction(${JSON.stringify(item.action)}); } catch (e) { return false; } })()`);
        await wait(160);
      }
    }

    frameState.index += 1;
    const name = `frame_${String(frameState.index).padStart(6, '0')}.png`;
    await capturePng(page, path.join(frameState.dir, name));
  }
}

async function renderSegmentClip(page, segment, segmentIndex, duration, args) {
  const segmentFramesDir = path.join(args.framesDir, `${String(segmentIndex + 1).padStart(2, '0')}_${segment.id}`);
  await fsp.rm(segmentFramesDir, { recursive: true, force: true });
  await fsp.mkdir(segmentFramesDir, { recursive: true });

  const frameState = { dir: segmentFramesDir, index: 0 };
  await renderSegment(page, segment, duration, args.fps, frameState);

  await fsp.mkdir(args.clipsDir, { recursive: true });
  const clipPath = segmentClipPath(args.clipsDir, segment, segmentIndex);
  const audioFile = segmentAudioFile(args.audioDir, segmentIndex);

  run(ffmpegPath(), [
    '-y',
    '-framerate', String(args.fps),
    '-i', path.join(segmentFramesDir, 'frame_%06d.png'),
    '-i', audioFile,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-r', '24',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-shortest',
    clipPath,
  ], { stdio: 'inherit' });

  if (!args.keepFrames) {
    await fsp.rm(segmentFramesDir, { recursive: true, force: true }).catch(() => {});
  }

  return { clipPath, frames: frameState.index };
}

async function stitchClips(args) {
  const missing = SEGMENTS
    .map((segment, index) => ({ segment, index, clipPath: segmentClipPath(args.clipsDir, segment, index) }))
    .filter(({ clipPath }) => !fs.existsSync(clipPath));

  if (missing.length) {
    throw new Error(
      `Missing ${missing.length} clip(s): ${missing.map(({ segment }) => segment.id).join(', ')}. ` +
      'Render them first with --segments.'
    );
  }

  await fsp.mkdir(path.dirname(args.out), { recursive: true });
  await fsp.mkdir(args.clipsDir, { recursive: true });
  const concatList = path.join(args.clipsDir, 'alphabet_lecture.concat.txt');
  await fsp.writeFile(
    concatList,
    SEGMENTS.map((segment, index) => concatFileLine(segmentClipPath(args.clipsDir, segment, index))).join('\n') + '\n',
    'utf8'
  );

  run(ffmpegPath(), [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatList,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '128k',
    args.out,
  ], { stdio: 'inherit' });

  const duration = audioDuration(args.out);
  console.log(`Stitched ${SEGMENTS.length} clips into ${path.relative(root, args.out)} (${duration.toFixed(2)}s)`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const durations = await readSegmentDurations(args.audioDir);
  const indexesToRender = args.stitchOnly ? [] : selectedSegmentIndexes(args);

  if (!fs.existsSync(args.audio) && indexesToRender.length === SEGMENTS.length) {
    throw new Error(`Missing lecture audio: ${args.audio}`);
  }

  if (indexesToRender.length) {
    await fsp.mkdir(args.framesDir, { recursive: true });
    await fsp.mkdir(args.clipsDir, { recursive: true });
  }

  const server = indexesToRender.length ? await startServer(args.port) : null;
  const chrome = indexesToRender.length ? await startChrome(args.width, args.height) : null;
  const page = chrome ? await connectPage(chrome.wsUrl) : null;

  try {
    if (page) {
      await page.send('Page.enable');
      await page.send('Runtime.enable');
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: args.width,
        height: args.height,
        deviceScaleFactor: 1,
        mobile: false,
      });

      const url = `http://127.0.0.1:${args.port}/pre_quraan_integration/units/alphabet/index.html?managed=1&v=alphabet-step-demo-recording-20260605a`;
      await page.send('Page.navigate', { url });
      await wait(2500);
      await installDemoHelpers(page);

      for (const i of indexesToRender) {
        const segment = SEGMENTS[i];
        console.log(`Recording clip ${i + 1}/${SEGMENTS.length}: ${segment.label} (${durations[i].toFixed(2)}s)`);
        const result = await renderSegmentClip(page, segment, i, durations[i], args);
        console.log(`Wrote ${path.relative(root, result.clipPath)} (${result.frames} frames)`);
      }
    }

    if (!args.noStitch) {
      await stitchClips(args);
    }
  } finally {
    if (page) page.close();
    if (chrome) {
      try { chrome.child.kill(); } catch (_error) {}
    }
    if (server) {
      try { server.kill(); } catch (_error) {}
    }
    if (!args.keepFrames) {
      await fsp.rm(args.framesDir, { recursive: true, force: true }).catch(() => {});
    }
    if (chrome) {
      await fsp.rm(chrome.userDataDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
