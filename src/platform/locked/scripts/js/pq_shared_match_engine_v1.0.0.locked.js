/* ============================================================
   PQ Shared Match Engine v1.0.0
   ------------------------------------------------------------
   Standardized shared engine for Match step.
   - Config-driven
   - No hardcoded letters
   - Uses current grid tiles
   - Uses getSequenceKeys() from main JS
   - Uses playAudioForKey() from main JS
   - Calls onComplete() when done
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
    cfg: null,
    stepId: 'match',
    gridId: 'grid',
    sequence: [],
    index: 0,
    currentKey: '',
    correct: 0,
    wrong: 0,
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

  function clearTileStates() {
    getTiles().forEach((tile) => {
      tile.classList.remove(
        'pq-match-current',
        'pq-match-correct',
        'pq-match-wrong',
        'pq-match-target'
      );
      tile.removeAttribute('data-pq-match-state');
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
          0 0 0 8px rgba(239,68,68,.45),
          0 14px 26px rgba(13,35,69,.20) !important;
        filter:saturate(.85);
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
      ' — listen and tap the matching letter'
    );

    try {
      if (typeof state.playAudioForKey === 'function') {
        state.playAudioForKey(state.currentKey);
      }
    } catch (_e) {}
  }

  function advanceAfter(ms) {
    window.setTimeout(() => {
      if (!state.running || state.paused) return;
      state.index += 1;

      if (state.index >= state.sequence.length) {
        complete();
      } else {
        playCurrent();
      }
    }, Math.max(0, Number(ms) || 0));
  }

  function handleTileClick(event) {
    if (!state.running || state.paused || !state.currentKey) return;

    const tile = event.target && event.target.closest
      ? event.target.closest('.tile')
      : null;

    if (!tile) return;

    const clickedKey = getTileKey(tile);
    if (!clickedKey) return;

    const cfg = getMatchCfg(state.cfg);
    const correctDwellMs = Number(cfg.correctDwellMs || 900);
    const wrongDwellMs = Number(cfg.wrongDwellMs || 1200);

    if (clickedKey === state.currentKey) {
      state.correct += 1;
      tile.classList.add('pq-match-correct');
      tile.setAttribute('data-pq-match-state', 'correct');
      setStatus('✅ Correct — ' + state.correct + '/' + state.sequence.length);
      advanceAfter(correctDwellMs);
      return;
    }

    state.wrong += 1;
    state.lives -= 1;
    tile.classList.add('pq-match-wrong');
    tile.setAttribute('data-pq-match-state', 'wrong');

    getTiles().forEach((t) => {
      if (getTileKey(t) === state.currentKey) {
        t.classList.add('pq-match-target');
      }
    });

    setStatus('Try again — lives ' + Math.max(0, state.lives));

    if (state.lives <= 0 && cfg.failEndsStep === true) {
      complete();
      return;
    }

    advanceAfter(wrongDwellMs);
  }

  function complete() {
    state.running = false;
    state.paused = false;
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

    if (!state.sequence.length) {
      complete();
      return;
    }

    if (cfg.autoPlayPrompt === false) {
      setStatus('Tap Listen, then choose the matching letter');
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