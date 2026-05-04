/* ============================================================
   PQ Shared Match Engine v1.0.0
   ------------------------------------------------------------
   Standardized shared engine for Match step.
   - Config-driven
   - No hardcoded letters
   - Uses current grid tiles
   - Uses getSequenceKeys() from main JS
   - Uses playAudioForKey() from main JS
   - Handles correct/wrong feedback internally
   - Correct: green check + star animation + sound
   - Wrong: red X + shake animation + sound
   ============================================================ */

(function (window, document) {
  'use strict';

  if (window.PQSharedMatchEngine && window.PQSharedMatchEngine.__version) {
    return;
  }

  const VERSION = 'pq_shared_match_engine_v1.0.0.locked';

  const state = {
    mounted: false,
    running: false,
    paused: false,
    locked: false,

    cfg: null,
    stepId: 'match',
    gridId: 'grid',

    sequence: [],
    index: 0,
    currentKey: '',

    correct: 0,
    wrong: 0,
    wrongForCurrent: 0,
    playsSinceShuffle: 0,
    lives: 5,

    options: {},
    getSequenceKeys: null,
    playAudioForKey: null,
    onComplete: null,
    clickHandler: null
  };

  function safeArray(v) {
    return Array.isArray(v) ? v : [];
  }

  function getMatchCfg(cfg) {
    return (cfg && cfg.match) || {};
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function getGrid() {
    return byId(state.gridId || 'grid');
  }

  function getTiles() {
    const grid = getGrid();
    if (!grid) return [];
    return Array.from(grid.querySelectorAll('.tile'));
  }

  function getTileKey(tile) {
    if (!tile) return '';
    return String(
      tile.dataset.key ||
      tile.dataset.cellKey ||
      tile.dataset.itemKey ||
      tile.dataset.id ||
      tile.getAttribute('data-key') ||
      tile.getAttribute('data-cell-key') ||
      tile.getAttribute('data-item-key') ||
      ''
    );
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function removeMatchFeedback(tile) {
    try {
      if (!tile) return;
      Array.from(tile.querySelectorAll('.pq-match-mark,.pq-match-stars')).forEach(function (el) {
        el.remove();
      });
    } catch (_e) {}
  }

  function addMatchMark(tile, kind) {
    try {
      if (!tile) return;

      removeMatchFeedback(tile);

      const mark = document.createElement('span');
      mark.className = 'pq-match-mark pq-match-mark--' + String(kind || '');
      mark.textContent = kind === 'correct' ? '✓' : '✕';
      mark.setAttribute('aria-hidden', 'true');
      tile.appendChild(mark);

      if (kind === 'correct') {
        const stars = document.createElement('span');
        stars.className = 'pq-match-stars';
        stars.textContent = '✨';
        stars.setAttribute('aria-hidden', 'true');
        tile.appendChild(stars);
      }
    } catch (_e) {}
  }

  function clearTileStates() {
    getTiles().forEach((tile) => {
      tile.classList.remove(
        'pq-match-current',
        'pq-match-correct',
        'pq-match-wrong',
        'pq-match-target',
        'pq-match-starburst',
        'pq-match-shake'
      );
      tile.removeAttribute('data-pq-match-state');
      removeMatchFeedback(tile);
    });
  }

  function setStatus(message) {
    let el = byId('pqMatchStatus');

    if (!el) {
      const grid = getGrid();
      if (!grid || !grid.parentNode) return;

      el = document.createElement('div');
      el.id = 'pqMatchStatus';
      el.className = 'pq-match-status';
      grid.parentNode.insertBefore(el, grid);
    }

    el.textContent = message || '';
  }

  function playTone(kind) {
    try {
      const cfg = getMatchCfg(state.cfg);
      if (cfg.soundFeedback === false) return;

      const volume = Math.max(0.01, Math.min(1, Number(cfg.soundVolume || 0.35)));

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const now = ctx.currentTime;

      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, now);

      if (kind === 'correct') {
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.3, (cfg.soundVolume || 0.35)), now + 0.32);

        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();

        o1.type = 'sine';
        o2.type = 'sine';

        o1.frequency.setValueAtTime(660, now);
        o2.frequency.setValueAtTime(920, now + 0.09);

        o1.connect(gain);
        o2.connect(gain);

        o1.start(now);
        o1.stop(now + 0.14);

        o2.start(now + 0.10);
        o2.stop(now + 0.32);
      } else {
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.3, (cfg.soundVolume || 0.35)), now + 0.28);

        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(240, now);
        o.frequency.exponentialRampToValueAtTime(110, now + 0.25);

        o.connect(gain);
        o.start(now);
        o.stop(now + 0.28);
      }

      window.setTimeout(function () {
        try {
          ctx.close();
        } catch (_e) {}
      }, 500);
    } catch (_e) {}
  }

  function injectCssOnce() {
    if (document.getElementById('pqSharedMatchEngineCss')) return;

    const style = document.createElement('style');
    style.id = 'pqSharedMatchEngineCss';

    style.textContent = `
      .pq-match-status{
        margin:10px auto 12px;
        padding:10px 14px;
        border-radius:18px;
        background:linear-gradient(180deg,#ffffff 0%,#f5fbff 100%);
        border:1px solid rgba(80,120,160,.16);
        box-shadow:0 4px 12px rgba(0,0,0,.05);
        color:#243548;
        font-weight:900;
        text-align:center;
        direction:ltr;
      }

      .tile.pq-match-current{
        box-shadow:
          0 0 0 4px rgba(255,255,255,.95),
          0 0 0 8px rgba(242,184,63,.45),
          0 14px 26px rgba(13,35,69,.20) !important;
      }

      .tile.pq-match-target{
        box-shadow:
          0 0 0 4px rgba(255,255,255,.95),
          0 0 0 8px rgba(59,130,246,.38),
          0 14px 26px rgba(13,35,69,.20) !important;
      }

      .tile.pq-match-correct{
        box-shadow:
          0 0 0 4px rgba(255,255,255,.95),
          0 0 0 8px rgba(34,197,94,.45),
          0 14px 26px rgba(13,35,69,.20) !important;
        transform:translateY(-3px) scale(1.03) !important;
      }

      .tile.pq-match-wrong{
        box-shadow:
          0 0 0 4px rgba(255,255,255,.95),
          0 0 0 8px rgba(239,68,68,.48),
          0 14px 26px rgba(13,35,69,.20) !important;
        filter:saturate(.85);
      }

      .tile.pq-match-shake{
        animation:pqMatchShake .42s ease-in-out both !important;
      }

      @keyframes pqMatchShake{
        0%,100%{ transform:translateX(0); }
        18%{ transform:translateX(-8px); }
        36%{ transform:translateX(8px); }
        54%{ transform:translateX(-6px); }
        72%{ transform:translateX(6px); }
      }

      .tile .pq-match-mark{
        position:absolute !important;
        top:10px !important;
        right:12px !important;
        width:44px !important;
        height:44px !important;
        border-radius:999px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        font-size:1.55rem !important;
        font-weight:1000 !important;
        z-index:999 !important;
        border:4px solid #fff !important;
        box-shadow:0 10px 22px rgba(0,0,0,.22) !important;
        pointer-events:none !important;
        direction:ltr !important;
      }

      .tile .pq-match-mark--correct{
        color:#fff !important;
        background:linear-gradient(180deg,#35d044 0%,#16a326 100%) !important;
      }

      .tile .pq-match-mark--wrong{
        color:#fff !important;
        background:linear-gradient(180deg,#ff6b6b 0%,#dc2626 100%) !important;
      }

      .tile .pq-match-stars{
        position:absolute !important;
        top:-18px !important;
        left:50% !important;
        transform:translateX(-50%) !important;
        font-size:2rem !important;
        z-index:1000 !important;
        pointer-events:none !important;
        animation:pqMatchStarPop .75s ease-out both !important;
      }

      @keyframes pqMatchStarPop{
        0%{ transform:translateX(-50%) scale(.35); opacity:0; }
        45%{ transform:translateX(-50%) scale(1.3); opacity:1; }
        100%{ transform:translateX(-50%) scale(1); opacity:0; }
      }
    `;

    document.head.appendChild(style);
  }

  function buildSequence() {
    let keys = [];

    try {
      if (typeof state.getSequenceKeys === 'function') {
        keys = safeArray(state.getSequenceKeys()).map(String).filter(Boolean);
      }
    } catch (_e) {
      keys = [];
    }

    if (!keys.length) {
      keys = getTiles().map(getTileKey).filter(Boolean);
    }

    const cfg = getMatchCfg(state.cfg);
    if (cfg.shuffle !== false) {
      keys = shuffle(keys);
    }

    return keys;
  }

  function reshuffleRemainingIfNeeded() {
    const cfg = getMatchCfg(state.cfg);
    const reshuffleEvery = Number(cfg.reshuffleEvery || 0);

    if (
      reshuffleEvery > 0 &&
      state.index > 0 &&
      state.index < state.sequence.length &&
      state.index % reshuffleEvery === 0
    ) {
      const done = state.sequence.slice(0, state.index);
      const remaining = shuffle(state.sequence.slice(state.index));
      state.sequence = done.concat(remaining);
    }
  }

  function playCurrent() {
    if (!state.running || state.paused) return;

    clearTileStates();

    state.currentKey = state.sequence[state.index] || '';

    if (!state.currentKey) {
      complete();
      return;
    }

    setStatus(
      'Match ' +
      (state.index + 1) +
      ' of ' +
      state.sequence.length +
      ' '
    );

    try {
      if (typeof state.playAudioForKey === 'function') {
        state.playAudioForKey(state.currentKey);
      }
    } catch (_e) {}
  }

  function handleTileClick(event) {
    if (!state.running || state.paused || state.locked || !state.currentKey) return;

    const tile = event.target && event.target.closest
      ? event.target.closest('.tile')
      : null;

    if (!tile) return;

    const clickedKey = getTileKey(tile);
    if (!clickedKey) return;

    const cfg = getMatchCfg(state.cfg);
    const correctDwellMs = Number(cfg.correctDwellMs || 900);
    const wrongDwellMs = Number(cfg.wrongDwellMs || 900);
    const maxWrongPerLetter = Number(cfg.maxWrongPerLetter || 3);

    const expectedKey = String(state.currentKey || '').trim();
    const chosenKey = String(clickedKey || '').trim();

    state.locked = true;

    if (chosenKey === expectedKey) {
      state.correct += 1;
      state.wrongForCurrent = 0;
      state.playsSinceShuffle += 1;

      tile.classList.add('pq-match-correct');
      tile.setAttribute('data-pq-match-state', 'correct');
      addMatchMark(tile, 'correct');
      playTone('correct');

      setStatus('✅ Correct — ' + state.correct + '/' + state.sequence.length);

      window.setTimeout(function () {
        state.locked = false;
        state.index += 1;
        reshuffleRemainingIfNeeded();

        if (state.index >= state.sequence.length) {
          complete();
        } else {
          playCurrent();
        }
      }, Math.max(0, correctDwellMs));

      return;
    }

    state.wrong += 1;
    state.wrongForCurrent += 1;
    state.playsSinceShuffle += 1;
    state.lives -= 1;

    tile.classList.add('pq-match-wrong', 'pq-match-shake');
    tile.setAttribute('data-pq-match-state', 'wrong');
    addMatchMark(tile, 'wrong');
    playTone('wrong');

    getTiles().forEach(function (t) {
      if (getTileKey(t) === expectedKey) {
        t.classList.add('pq-match-target');
      }
    });

    setStatus('❌ Try again — lives ' + Math.max(0, state.lives));

    window.setTimeout(function () {
      tile.classList.remove('pq-match-wrong', 'pq-match-shake');
      tile.removeAttribute('data-pq-match-state');
      removeMatchFeedback(tile);

      getTiles().forEach(function (t) {
        t.classList.remove('pq-match-target');
      });

      state.locked = false;

      if (state.lives <= 0) {
        setStatus('Lives finished — starting over');
        window.setTimeout(function () {
          start();
        }, 700);
        return;
      }

      if (maxWrongPerLetter > 0 && state.wrongForCurrent >= maxWrongPerLetter) {
        state.wrongForCurrent = 0;
        state.index += 1;
        reshuffleRemainingIfNeeded();

        if (state.index >= state.sequence.length) {
          complete();
        } else {
          playCurrent();
        }

        return;
      }

      reshuffleRemainingIfNeeded();
      replayPrompt();
    }, Math.max(0, wrongDwellMs));
  }

  function complete() {
    state.running = false;
    state.paused = false;
    state.locked = false;
    clearTileStates();

    setStatus('✅ Match complete — ' + state.correct + '/' + state.sequence.length);

    try {
      if (typeof state.onComplete === 'function') {
        state.onComplete({
          stepId: state.stepId,
          total: state.sequence.length,
          correct: state.correct,
          wrong: state.wrong
        });
      }
    } catch (_e) {}
  }

  function mount(options) {
    options = options || {};

    state.cfg = options.cfg || window.UNIT_CFG || null;
    state.stepId = options.stepId || 'match';
    state.gridId = options.gridId || 'grid';
    state.getSequenceKeys = options.getSequenceKeys || null;
    state.playAudioForKey = options.playAudioForKey || null;
    state.onComplete = options.onComplete || null;
    state.options = options;

    injectCssOnce();

    const grid = getGrid();
    if (!grid) return false;

    if (!state.clickHandler) {
      state.clickHandler = handleTileClick;
      grid.addEventListener('click', state.clickHandler, true);
    }

    state.mounted = true;
    start();

    return true;
  }

  function start() {
    const cfg = getMatchCfg(state.cfg);

    state.sequence = buildSequence();
    state.index = 0;
    state.currentKey = '';
    state.correct = 0;
    state.wrong = 0;
    state.lives = Number(cfg.lives || 5);
    state.running = true;
    state.paused = false;
    state.locked = false;

    if (!state.sequence.length) {
      complete();
      return;
    }

    if (cfg.autoPlayPrompt === false) {
      setStatus('Tap Match, then choose the matching letter');
    } else {
      playCurrent();
    }
  }

  function pause() {
    state.paused = true;
    setStatus('Paused');
  }

  function resume() {
    if (!state.running) return;
    state.paused = false;
    playCurrent();
  }

  function stop() {
    state.running = false;
    state.paused = false;
    state.locked = false;
    state.currentKey = '';
    clearTileStates();
    setStatus('');
  }

  function replayPrompt() {
    if (!state.currentKey) return;

    try {
      if (typeof state.playAudioForKey === 'function') {
        state.playAudioForKey(state.currentKey);
      }
    } catch (_e) {}
  }

  window.PQSharedMatchEngine = {
    __version: VERSION,
    mount,
    start,
    pause,
    resume,
    stop,
    replayPrompt,
    getState: function () {
      return {
        running: state.running,
        paused: state.paused,
        locked: state.locked,
        stepId: state.stepId,
        index: state.index,
        total: state.sequence.length,
        currentKey: state.currentKey,
        correct: state.correct,
        wrong: state.wrong,
        lives: state.lives
      };
    }
  };

})(window, document);