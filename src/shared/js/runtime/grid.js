/*
  Pre-Quraan Alphabet runtime fragment: grid.js
  Grid/media state, tile rendering, Write adapter setup, and grid interaction helpers.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
  // SECTION 23: Grid/media state
  // ============================================================
  // ============================================================
// SECTION 23: Grid/media state
// ============================================================
let __pqWebAudioCtx = null;
let __pqWebAudioGain = null;
let __pqWebAudioCurrentSource = null;
let __pqWebAudioPaused = false;
let __pqWebAudioStartAt = 0;
let __pqWebAudioPauseOffset = 0;
let __pqWebAudioCurrentBuffer = null;
let __pqWebAudioCurrentUrl = '';

let __pqWebAudioLogicalResolve = null;
let __pqWebAudioLogicalReject = null;
let __pqWebAudioLogicalPromise = null;
let __pqWebAudioPlaybackToken = 0;
let __pqWebAudioPlaybackRate = 1;

function __pqMarkWebAudioActive(durationMs) {
  try {
    const ms = Math.max(2500, Number(durationMs || 0) || 0);
    window.__pqWebAudioActive = true;
    window.__PQ_WEB_AUDIO_ACTIVE__ = true;
    window.__PQ_MEDIA_ACTIVE__ = true;
    window.__PQ_MEDIA_ACTIVE_UNTIL__ = Math.max(
      Number(window.__PQ_MEDIA_ACTIVE_UNTIL__ || 0) || 0,
      Date.now() + ms
    );
    if (typeof window.__PQ_MARK_MEDIA_ACTIVE__ === 'function') {
      window.__PQ_MARK_MEDIA_ACTIVE__(ms);
    }
  } catch (_e) {}
}

function __pqClearWebAudioActiveSoon() {
  try {
    window.__PQ_MEDIA_ACTIVE_UNTIL__ = Math.max(
      Number(window.__PQ_MEDIA_ACTIVE_UNTIL__ || 0) || 0,
      Date.now() + 2500
    );
    if (typeof window.__PQ_CLEAR_MEDIA_ACTIVE_SOON__ === 'function') {
      window.__PQ_CLEAR_MEDIA_ACTIVE_SOON__();
    }
    setTimeout(function () {
      try {
        if (__pqWebAudioCurrentSource) return;
        if (Date.now() < (Number(window.__PQ_MEDIA_ACTIVE_UNTIL__ || 0) || 0)) return;
        window.__pqWebAudioActive = false;
        window.__PQ_WEB_AUDIO_ACTIVE__ = false;
        window.__PQ_MEDIA_ACTIVE__ = false;
      } catch (_e) {}
    }, 2700);
  } catch (_e) {}
}

function __pqEnsureWebAudio() {
  try {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    if (!__pqWebAudioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      __pqWebAudioCtx = new Ctx();
      __pqWebAudioGain = __pqWebAudioCtx.createGain();
      __pqWebAudioGain.connect(__pqWebAudioCtx.destination);
    }
    return __pqWebAudioCtx;
  } catch (_e) {
    return null;
  }
}

async function __pqFetchAudioBuffer(url) {
  const ctx = __pqEnsureWebAudio();
  if (!ctx || !url) return null;

  const res = await fetch(url, { mode: 'cors', cache: 'default' });
  const arr = await res.arrayBuffer();
  return await ctx.decodeAudioData(arr.slice(0));
}

function __pqEnsureLogicalPlaybackPromise() {
  if (!__pqWebAudioLogicalPromise) {
    __pqWebAudioLogicalPromise = new Promise((resolve, reject) => {
      __pqWebAudioLogicalResolve = resolve;
      __pqWebAudioLogicalReject = reject;
    });
  }
  return __pqWebAudioLogicalPromise;
}

function __pqResolveLogicalPlayback(ok) {
  try {
    if (typeof __pqWebAudioLogicalResolve === 'function') {
      __pqWebAudioLogicalResolve(ok !== false);
    }
  } catch (_e) {}

  __pqWebAudioLogicalResolve = null;
  __pqWebAudioLogicalReject = null;
  __pqWebAudioLogicalPromise = null;
}

async function __pqStartWebAudioSource(buffer, rate, offsetSec, token) {
  const ctx = __pqEnsureWebAudio();
  if (!ctx || !buffer) return false;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch (_e) {}

  try {
    if (__pqWebAudioCurrentSource) {
      try { __pqWebAudioCurrentSource.onended = null; } catch (_e) {}
      try { __pqWebAudioCurrentSource.stop(0); } catch (_e) {}
      try { __pqWebAudioCurrentSource.disconnect(); } catch (_e) {}
    }
  } catch (_e) {}

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = Number(rate || 1) || 1;
  source.connect(__pqWebAudioGain);

  __pqWebAudioCurrentSource = source;
  __pqWebAudioCurrentBuffer = buffer;
  __pqWebAudioPlaybackRate = Number(rate || 1) || 1;
  __pqWebAudioStartAt = ctx.currentTime - (Number(offsetSec || 0) || 0);
  __pqWebAudioPauseOffset = Number(offsetSec || 0) || 0;
  __pqWebAudioPaused = false;
  __pqMarkWebAudioActive(((buffer.duration || 0) * 1000 / (Number(rate || 1) || 1)) + 2500);

  source.onended = function () {
    const stillCurrentToken = (__pqWebAudioPlaybackToken === token);
    const stillCurrentSource = (__pqWebAudioCurrentSource === source);

    if (!stillCurrentToken) return;
    if (__pqWebAudioPaused) return;

    if (stillCurrentSource) {
      __pqWebAudioCurrentSource = null;
      __pqWebAudioPauseOffset = 0;
    }
    __pqClearWebAudioActiveSoon();

    __pqResolveLogicalPlayback(true);
  };

  source.start(0, __pqWebAudioPauseOffset);
  __pqMarkWebAudioActive(((buffer.duration || 0) * 1000 / (Number(rate || 1) || 1)) + 2500);
  return true;
}

async function __pqPlayBuffer(buffer, rate, offsetSec) {
  const ctx = __pqEnsureWebAudio();
  if (!ctx || !buffer) return false;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch (_e) {}

  if (__pqWebAudioLogicalPromise) {
    __pqResolveLogicalPlayback(false);
  }
  
  try {	  
    if (__pqWebAudioCurrentSource) {
      try { __pqWebAudioCurrentSource.onended = null; } catch (_e) {}
      try { __pqWebAudioCurrentSource.stop(0); } catch (_e) {}
      try { __pqWebAudioCurrentSource.disconnect(); } catch (_e) {}
    }
  } catch (_e) {}

  __pqWebAudioPlaybackToken += 1;
  const token = __pqWebAudioPlaybackToken;

  __pqWebAudioPaused = false;
  __pqWebAudioPauseOffset = Number(offsetSec || 0) || 0;
  __pqWebAudioCurrentBuffer = buffer;
  __pqWebAudioPlaybackRate = Number(rate || 1) || 1;
  __pqMarkWebAudioActive(((buffer.duration || 0) * 1000 / __pqWebAudioPlaybackRate) + 2500);

  const logicalPromise = __pqEnsureLogicalPlaybackPromise();
  const started = await __pqStartWebAudioSource(
    buffer,
    __pqWebAudioPlaybackRate,
    __pqWebAudioPauseOffset,
    token
  );

  if (!started) {
    __pqResolveLogicalPlayback(false);
    return false;
  }

  return await logicalPromise;
}

function __pqPauseWebAudio() {
  try {
    const ctx = __pqEnsureWebAudio();
    if (!ctx || !__pqWebAudioCurrentSource || !__pqWebAudioCurrentBuffer) return false;

    __pqWebAudioPauseOffset = Math.max(
      0,
      ctx.currentTime - __pqWebAudioStartAt
    );

    __pqWebAudioPaused = true;

    try { __pqWebAudioCurrentSource.onended = null; } catch (_e) {}
    try { __pqWebAudioCurrentSource.stop(0); } catch (_e) {}
    try { __pqWebAudioCurrentSource.disconnect(); } catch (_e) {}

    __pqWebAudioCurrentSource = null;
    __pqClearWebAudioActiveSoon();
    return true;
  } catch (_e) {
    return false;
  }
}

async function __pqResumeWebAudio(rate) {
  try {
    if (!__pqWebAudioCurrentBuffer) return false;
    if (__pqWebAudioCurrentSource) return true;

    const token = __pqWebAudioPlaybackToken;
    const resolvedRate = Number(rate || __pqWebAudioPlaybackRate || 1) || 1;

    await __pqStartWebAudioSource(
      __pqWebAudioCurrentBuffer,
      resolvedRate,
      __pqWebAudioPauseOffset || 0,
      token
    );

    return true;
  } catch (_e) {
    return false;
  }
}

const videoModal = document.getElementById('videoModal');
const player = document.getElementById('player');
const closeBtn = document.getElementById('closeBtn');

    function __pqCloseActiveMediaWindows() {
    try {
      if (player) {
        try { player.pause(); } catch (_e) {}
        try { player.removeAttribute('src'); } catch (_e) {}
        try { player.load(); } catch (_e) {}
      }
    } catch (_e) {}

    try {
      if (videoModal) {
        videoModal.style.display = 'none';
      }
    } catch (_e) {}

    try {
      __watchPaused = false;
      __watchPlaying = false;
    } catch (_e) {}
  }

   function __pqSetPlaylistDimming(enabled) {
    try {
      const value = enabled ? '' : 'transparent';
      const opacity = enabled ? '' : '0';

      if (videoModal && !enabled) {
        videoModal.style.background = 'transparent';
      }

      document.documentElement.style.setProperty('--pq-playlist-overlay-bg', value);
      document.documentElement.style.setProperty('--pq-playlist-overlay-opacity', opacity);

      try {
        document.body.classList.toggle('pq-playlist-active', !!enabled);
      } catch (_e) {}
    } catch (_e) {}
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      try {
        if (player) {
          player.pause();
          player.removeAttribute('src');
          player.load();
        }
      } catch (_e) {}

      __watchPaused = false;
      __watchPlaying = false;
      __pqCancelPlayAll();

      if (videoModal) {
        videoModal.style.display = 'none';
      }
    });
  }

  audio.preload = 'auto';
  if ('preservesPitch' in audio) audio.preservesPitch = true;
  if ('webkitPreservesPitch' in audio) audio.webkitPreservesPitch = true;

  let selectedIdx = -1;
  let selectedKey = null;
  let playingAll = false;
  let paused = false;
  let __playAllController = null;
  let __watchPaused = false;
  let __watchPlaying = false;

  function __pqCancelPlayAll() {
    // PATCH_CLEAR_PLAYING_TILE_CANCEL
    try { __pqClearPlayingTile(); } catch (_e) {}
    try { __pqCancelHarakatAnimation(); } catch (_e) {}
    try {
      if (__playAllController) {
        __playAllController.abort();
      }
    } catch (_e) {}

    __playAllController = null;
    playingAll = false;
  }

  function __pqStartPlayAllController() {
    try {
      __pqCancelPlayAll();
    } catch (_e) {}

    try {
      __playAllController = new AbortController();
      return __playAllController;
    } catch (_e) {
      __playAllController = null;
      return null;
    }
  }

  function __pqAssertNotAborted(signal) {
    if (signal && signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
  }

  function __pqDelayWithAbort(ms, signal) {
    return new Promise((resolve, reject) => {
      try {
        __pqAssertNotAborted(signal);
      } catch (err) {
        reject(err);
        return;
      }

      const timer = setTimeout(() => {
        cleanup();
        resolve();
      }, Math.max(0, Number(ms) || 0));

      function onAbort() {
        cleanup();
        reject(new DOMException('Aborted', 'AbortError'));
      }

      function cleanup() {
        try { clearTimeout(timer); } catch (_e) {}
        try {
          if (signal) signal.removeEventListener('abort', onAbort);
        } catch (_e) {}
      }

      try {
        if (signal) signal.addEventListener('abort', onAbort, { once: true });
      } catch (_e) {}
    });
  }

  // ============================================================
  // SECTION 24: Write adapter state + helpers
  // ============================================================
  let __pqSharedWrite = null;

  function __pqGetWriteChunkSize() {
    const value = Number(WRITE_CFG && WRITE_CFG.chunkSize);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 16;
  }

  function __pqGetWriteWorksheetRows() {
    const value = Number(WRITE_CFG && WRITE_CFG.batchRows);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 2;
  }

  function __pqGetWriteWorksheetCols() {
    const value = Number(WRITE_CFG && WRITE_CFG.batchCols);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 3;
  }

  function __pqGetWriteAdapterCfg(path, fallback) {
    return __cfg(`write.adapter.${path}`, fallback);
  }

  function __pqGetWriteChunkPlan() {
    try {
      const plan = (__cfg('write.chunks', null) || []);
      const arr = Array.isArray(plan)
        ? plan.map((v) => Math.floor(Number(v) || 0)).filter((v) => v > 0)
        : [];

      if (arr.length) return arr;
    } catch (_e) {}

    return [];
  }

  function __pqGetWriteStepId() {
    try {
      const cur = getCurrentStep();
      const step = cur && cur.step;
      const id = String((step && step.id) || '').toLowerCase();
      const type = String((step && step.type) || '').toLowerCase();

      if (
        id === 'write' ||
        id === 'trace1' ||
        id === 'trace' ||
        /^(write|trace)\d+$/.test(id) ||
        type === 'trace' ||
        type === 'write'
      ) {
        return String((step && step.id) || 'write');
      }
    } catch (_e) {}

    try {
      if (managedProgress && managedProgress.write) return 'write';
      if (managedProgress && managedProgress.trace1) return 'trace1';
    } catch (_e) {}

    return 'write';
  }

  function __pqIsWriteStep(step) {
    try {
      const id = String((step && step.id) || '').toLowerCase();
      const type = String((step && step.type) || '').toLowerCase();

      return (
        id === 'write' ||
        id === 'trace1' ||
        id === 'trace' ||
        /^(write|trace)\d+$/.test(id) ||
        type === 'trace' ||
        type === 'write'
      );
    } catch (_e) {
      return false;
    }
  }

  function __pqGetWriteAllKeys() {
    try {
      if (Array.isArray(PLAY_SEQUENCE_KEYS) && PLAY_SEQUENCE_KEYS.length) {
        return PLAY_SEQUENCE_KEYS.slice();
      }
    } catch (_e) {}

    try {
      const gridKeys = [
        ...(grid ? grid.querySelectorAll('.tile[data-key]') : [])
      ]
        .map((el) => String(el.getAttribute('data-key') || el.dataset.key || ''))
        .filter(Boolean);

      if (gridKeys.length) return gridKeys;
    } catch (_e) {}

    try {
      return (LETTERS || []).map((item) => item && item.key).filter(Boolean);
    } catch (_e) {
      return [];
    }
  }

  function __pqGetWriteChunkCount() {
    const keys = __pqGetWriteAllKeys();
    const plan = __pqGetWriteChunkPlan();

    try {
      const cur = getCurrentStep && getCurrentStep();
      const id = String((cur && cur.step && cur.step.id) || '').toLowerCase();
      if (/^(write|trace)\d+$/.test(id)) return 1;
    } catch (_e) {}

    if (plan.length) return Math.max(plan.length, 1);

    const chunkSize = __pqGetWriteChunkSize();
    const bySize = Math.max(1, Math.ceil(keys.length / chunkSize));
    const minPasses = Number(WRITE_CFG && WRITE_CFG.minPassesRequired);
    const configuredMin = (
      Number.isFinite(minPasses) && minPasses > 0
    ) ? Math.floor(minPasses) : 0;

    return Math.max(bySize, configuredMin || 0, 1);
  }

  function __pqNormalizeWriteChunkPasses() {
    try {
      const writeStepId = __pqGetWriteStepId();
      const writeProgress =
        managedProgress &&
        (
          managedProgress[writeStepId] ||
          managedProgress.write ||
          managedProgress.trace1
        );

      if (!writeProgress) return;

      const needed = __pqGetWriteChunkCount();
      const current = Number(
        writeProgress.passesRequired ||
        writeProgress.passes_required ||
        1
      ) || 1;

      if (needed > current) {
        writeProgress.passesRequired = needed;
      }

      if (managedProgress && writeStepId && managedProgress[writeStepId]) {
        managedProgress[writeStepId].passesRequired = writeProgress.passesRequired;
      }

      if (managedProgress && managedProgress.write && managedProgress.write !== writeProgress) {
        managedProgress.write.passesRequired = writeProgress.passesRequired;
      }

      if (managedProgress && managedProgress.trace1 && managedProgress.trace1 !== writeProgress) {
        managedProgress.trace1.passesRequired = writeProgress.passesRequired;
      }
    } catch (_e) {}
  }

  function __pqGetWriteChunkInfo() {
    let keys = __pqGetWriteAllKeys();
    const chunkSize = Math.max(1, Number(WRITE_CFG.chunkSize || 1));
    const plan = __pqGetWriteChunkPlan();
    let totalChunks = plan.length
      ? plan.length
      : Math.max(1, Math.ceil(keys.length / chunkSize));

    try {
      if (
        __pqIsReviewMode() ||
        !__pqIsManagedUser() ||
        (managedProgress && managedProgress.__finished)
      ) {
        return {
          keys,
          totalChunks,
          chunkSize,
          chunkIndex: 0,
          start: 0,
          end: keys.length,
          chunkKeys: keys.slice(),
          chunkPlan: plan
        };
      }
    } catch (_e) {}

    let chunkIndex = 0;

    try {
      const cur = getCurrentStep();
      const rawStepId = String((cur && cur.step && cur.step.id) || '').toLowerCase();
      const numbered = rawStepId.match(/^(?:write|trace)(\d+)$/);
      const stepFilters = typeof __pqGetStepPassFilters === 'function'
        ? __pqGetStepPassFilters(rawStepId)
        : [];
      const filterName = stepFilters && stepFilters.length ? String(stepFilters[0] || '') : '';
      const filteredKeys = (
        numbered &&
        filterName &&
        filterName !== 'all' &&
        typeof __pqGetKeysForPassFilter === 'function'
      ) ? __pqGetKeysForPassFilter(filterName) : [];

      if (filteredKeys && filteredKeys.length) {
        keys = filteredKeys.slice();
        totalChunks = 1;
        return {
          keys,
          totalChunks,
          chunkSize,
          chunkIndex: 0,
          start: 0,
          end: keys.length,
          chunkKeys: keys.slice(),
          chunkPlan: [keys.length]
        };
      }

      if (numbered) {
        chunkIndex = Math.min(totalChunks - 1, Math.max(0, Number(numbered[1]) - 1));
      } else {
        const prog = cur ? cur.progress : null;
        const passesDone = Math.max(0, Number((prog && prog.passesDone) || 0));
        chunkIndex = Math.min(totalChunks - 1, passesDone);
      }
    } catch (_e) {}

    let start = 0;
    let end = 0;

    if (plan.length) {
      for (let i = 0; i < chunkIndex; i += 1) {
        start += Math.max(0, Number(plan[i] || 0));
      }
      end = Math.min(
        start + Math.max(1, Number(plan[chunkIndex] || 0)),
        keys.length
      );
    } else {
      start = chunkIndex * chunkSize;
      end = Math.min(start + chunkSize, keys.length);
    }

    return {
      keys,
      totalChunks,
      chunkSize,
      chunkIndex,
      start,
      end,
      chunkKeys: keys.slice(start, end),
      chunkPlan: plan
    };
  }

  function __pqCreateChunkedWriteAdapter(config) {
    const state = {
      button: null,
      overlay: null,
      gridEl: null,
      closeBtn: null,
      resetBtn: null,
      printBtn: null,
      badge: null,
      rowsSel: null,
      colsSel: null
    };

    const cfg = Object.assign({
      unitKey: String(__pqGetWriteAdapterCfg('unitKey', 'unit')),
      buttonId: String(__pqGetWriteAdapterCfg('buttonId', 'btnTrace')),
      displayLabel: String(__pqGetWriteAdapterCfg('displayLabel', 'Write')),
      getCurrentStep: () => ({ step: null, progress: null }),
      getGrid: () => null,
      getLetters: () => [],
      onUiRefresh: () => {},
      onStepCompleted: async () => {},
      onApplyRuntimeCompletion: null
    }, config || {});

    function makeTile(letterObj, idx) {
      const wrap = document.createElement('div');
      wrap.className = 'traceCell';

      const canvasMetrics = __pqGetWriteCanvasMetrics();
      const canvas = document.createElement('canvas');
      canvas.width = canvasMetrics.width;
      canvas.height = canvasMetrics.height;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      canvas.style.background = '#fff';
      canvas.style.border = `1px solid ${__PQ_WRITE_CANVAS_UI.borderColor}`;
      canvas.style.borderRadius = __PQ_WRITE_CANVAS_UI.borderRadius;
      canvas.style.touchAction = 'none';
      canvas.setAttribute('data-ink-canvas', '1');

      const rawWriteWord = String((letterObj && letterObj.ar) || '')
        .replace('◌', '')
        .replace(/\s+/g, ' ')
        .trim();

      const isWideWord = (
        rawWriteWord === 'كٓهٰيٰعٓصٓ' ||
        rawWriteWord === 'حٰمٓ عٓسٓقٓ' ||
        rawWriteWord === 'حم عسق'
      );

      const ctx = canvas.getContext('2d');

      function drawGuide() {
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        const top = __PQ_WRITE_CANVAS_UI.guideTop;
        const mid = __PQ_WRITE_CANVAS_UI.guideMid;
        const base = __PQ_WRITE_CANVAS_UI.guideBase;
        const bottom = __PQ_WRITE_CANVAS_UI.guideBottom;
        const sidePadding = __PQ_WRITE_CANVAS_UI.guideSidePadding;

        function line(y, dash, width, color) {
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash(dash || []);
          ctx.lineWidth = width;
          ctx.strokeStyle = color;
          ctx.moveTo(sidePadding, y);
          ctx.lineTo(w - sidePadding, y);
          ctx.stroke();
          ctx.restore();
        }

        line(top, [], 2, __PQ_WRITE_CANVAS_UI.guideTopColor);
line(mid, __PQ_WRITE_CANVAS_UI.guideMidDash, 2, __PQ_WRITE_CANVAS_UI.guideMidColor);
line(base, [], 3, __PQ_WRITE_CANVAS_UI.guideBaseColor);
line(bottom, [], 2, __PQ_WRITE_CANVAS_UI.guideBottomColor);

        try {
          const practiceStartY = __PQ_WRITE_CANVAS_UI.practiceStartY;
          const practiceEndPadding = __PQ_WRITE_CANVAS_UI.practiceEndPadding;
          const practiceGap = Math.max(8, __PQ_WRITE_CANVAS_UI.practiceGap || 84);
          const practiceStopY = h - Math.max(0, practiceEndPadding);

          for (let y = practiceStartY; y <= practiceStopY; y += practiceGap) {
            if (y > sidePadding && y < (h - sidePadding)) {
              line(
                y,
                __PQ_WRITE_CANVAS_UI.practiceDash,
                __PQ_WRITE_CANVAS_UI.practiceWidth,
                __PQ_WRITE_CANVAS_UI.practiceColor
              );
            }
          }
        } catch (_e) {}

        ctx.save();
        ctx.globalAlpha = __PQ_WRITE_CANVAS_UI.ghostAlpha;
        ctx.fillStyle = __PQ_WRITE_CANVAS_UI.ghostColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.font = `900 ${isWideWord ? canvasMetrics.ghostWideFontPx : canvasMetrics.ghostNormalFontPx}px "Noto Naskh Arabic", "Amiri", "Scheherazade New", serif`;
        ctx.fillText(rawWriteWord, w / 2, base - 8);
        ctx.restore();
      }

      drawGuide();

      let drawing = false;
      let last = null;

      function pt(evt) {
        const rect = canvas.getBoundingClientRect();
        const x = ((evt.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((evt.clientY - rect.top) / rect.height) * canvas.height;
        return { x, y };
      }

      function addStroke(p0, p1) {
        if (!ctx) return;

		ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = __PQ_WRITE_CANVAS_UI.inkColor;
        ctx.lineWidth = __PQ_WRITE_CANVAS_UI.inkWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        ctx.restore();
      }

      canvas.addEventListener('pointerdown', (e) => {
        drawing = true;
        last = pt(e);
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_e) {}
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!drawing || !last) return;
        const p = pt(e);
        addStroke(last, p);
        last = p;
      });

      function end(e) {
        drawing = false;
        last = null;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (_e) {}
      }

      canvas.addEventListener('pointerup', end);
      canvas.addEventListener('pointercancel', end);

      wrap.__pqResetInk = drawGuide;
      wrap.__pqCanvas = canvas;
      wrap.appendChild(canvas);

      return wrap;
    }

    function buildGrid() {
      let rows = __pqGetWriteWorksheetRows();
      const cols = __pqGetWriteWorksheetCols();
      const info = __pqGetWriteChunkInfo();
      const letters = cfg.getLetters();
      const items = info.chunkKeys
        .map((key) => letters.find((item) => item.key === key))
        .filter(Boolean);

      rows = Math.max(
        rows,
        Math.ceil(Math.max(1, items.length) / Math.max(1, cols))
      );

      try {
        if (
          __pqIsReviewMode() ||
          !__pqIsManagedUser() ||
          (managedProgress && managedProgress.__finished)
        ) {
          const normalCount = items.filter((item) => {
            const raw = String((item && item.ar) || '').replace(/\s+/g, ' ').trim();
            return !(
              raw === 'كٓهٰيٰعٓصٓ' ||
              raw === 'حٰمٓ عٓسٓقٓ' ||
              raw === 'حم عسق'
            );
          }).length;

          const wideCount = items.length - normalCount;
          const neededSlots = normalCount + (wideCount * cols);
          rows = Math.max(rows, Math.ceil(neededSlots / cols));
        }
      } catch (_e) {}

      try {
        if (state.rowsSel) {
          state.rowsSel.value = String(rows);
          state.rowsSel.disabled = true;
        }
        if (state.colsSel) {
          state.colsSel.value = String(cols);
          state.colsSel.disabled = true;
        }
      } catch (_e) {}

      if (state.gridEl) {
        // Trace overlay: always 1 word per row
        state.gridEl.style.gridTemplateColumns = 'repeat(1,1fr)';
        state.gridEl.innerHTML = '';

        for (let i = 0; i < items.length; i += 1) {
          const item = items[i];
          const cell = makeTile(item, i);

          try {
            const raw = String((item && item.ar) || '').replace(/\s+/g, ' ').trim();
            const spanWords = __cfg('write.spanWords', {}) || {};
            const span = Number(spanWords[raw] || 0);

            if (span >= 2) {
              cell.style.gridColumn = '1 / -1';
            }
          } catch (_e) {}

          state.gridEl.appendChild(cell);
        }
      }

      if (state.badge) {
        const inReviewAll = (function () {
          try {
            return (
              __pqIsReviewMode() ||
              !__pqIsManagedUser() ||
              (managedProgress && managedProgress.__finished)
            );
          } catch (_e) {
            return false;
          }
        })();

        const sep = __PQ_TEXT_CACHE.writeBadgeSeparator;
        const ofWord = __PQ_TEXT_CACHE.writeBadgeOfWord;
        const rangeOpen = __PQ_TEXT_CACHE.writeBadgeRangeOpen;
        const rangeDash = __PQ_TEXT_CACHE.writeBadgeRangeDash;
        const rangeClose = __PQ_TEXT_CACHE.writeBadgeRangeClose;

        if (inReviewAll) {
          state.badge.textContent =
  `${cfg.displayLabel}${sep}${__PQ_TEXT_CACHE.writeBadgeAllWords}`;
        } else {
          const from = info.start + 1;
          const to = info.end;

          state.badge.textContent =
            `${cfg.displayLabel}${sep}` +
            `${__PQ_TEXT_CACHE.writeBadgePartPrefix} ${info.chunkIndex + 1} ${ofWord} ${info.totalChunks}` +
            (to ? ` ${rangeOpen}${from}${rangeDash}${to}${rangeClose}` : '');
        }
      }
    }

    function syncUI() {
      try {
        const cur = cfg.getCurrentStep();
        const step = cur ? cur.step : null;
        const inWriteStep = !!__pqIsWriteStep(step);

        if (state.button) {
          state.button.disabled = !inWriteStep;
          state.button.classList.toggle('disabled', !inWriteStep);
          state.button.style.opacity = inWriteStep ? '1' : '.45';
          state.button.style.pointerEvents = inWriteStep ? 'auto' : 'none';
        }
      } catch (_e) {}
    }

    function open() {
      try {
        if (!state.overlay || !state.gridEl) return;
        buildGrid();
        state.overlay.style.display = 'flex';
        syncUI();
      } catch (_e) {}
    }

    function close() {
      try {
        if (state.overlay) state.overlay.style.display = 'none';

        (async () => {
          try {
            const resolvedWriteStepId = __pqGetWriteStepId();
            const runtimeResult = await cfg.onStepCompleted(resolvedWriteStepId);

            if (cfg.onApplyRuntimeCompletion) {
              cfg.onApplyRuntimeCompletion(resolvedWriteStepId, runtimeResult);
            }

            await cfg.onUiRefresh();
            syncUI();
          } catch (_e) {}
        })();
      } catch (_e) {}
    }

    function ensureOverlay() {
      try {
        if (document.getElementById('traceOverlay')) return;

        const styleId = cfg.unitKey + 'WriteStyles';

        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
#traceOverlay{
  position:fixed;
  inset:0;
  display:none;
  align-items:center;
  justify-content:center;
  background:${__PQ_WRITE_OVERLAY_UI.overlayBackground};
  z-index:${__PQ_WRITE_OVERLAY_UI.zIndex};
}
#traceOverlay .panel{
  width:${__PQ_WRITE_OVERLAY_UI.panelWidth};
  height:${__PQ_WRITE_OVERLAY_UI.panelHeight};
  background:${__PQ_WRITE_OVERLAY_UI.panelBackground};
  border-radius:${__PQ_WRITE_OVERLAY_UI.panelBorderRadius};
  box-shadow:${__PQ_WRITE_OVERLAY_UI.panelBoxShadow};
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
#traceOverlay .topbar{
  display:flex;
  align-items:center;
  gap:${__PQ_WRITE_OVERLAY_UI.topbarGap};
  padding:${__PQ_WRITE_OVERLAY_UI.topbarPadding};
  border-bottom:${__PQ_WRITE_OVERLAY_UI.topbarBorderBottom};
}
#traceCloseX{
  border:0;
  background:${__PQ_WRITE_OVERLAY_UI.closeBg};
  border-radius:${__PQ_WRITE_OVERLAY_UI.closeRadius};
  padding:${__PQ_WRITE_OVERLAY_UI.closePadding};
  font-size:${__PQ_WRITE_OVERLAY_UI.closeFontSize};
  cursor:pointer;
}
#btnResetDraw,#btnPrintDraw{
  border:0;
  background:${__PQ_WRITE_OVERLAY_UI.actionBg};
  border-radius:${__PQ_WRITE_OVERLAY_UI.actionRadius};
  padding:${__PQ_WRITE_OVERLAY_UI.actionPadding};
  font-weight:${__PQ_WRITE_OVERLAY_UI.actionWeight};
  cursor:pointer;
}
#letterBadge{
  margin-left:auto;
  font-weight:${__PQ_WRITE_OVERLAY_UI.badgeWeight};
}
#traceGrid{
  flex:1;
  overflow:auto;
  padding:${__PQ_WRITE_OVERLAY_UI.gridPadding};
  display:grid;
  grid-template-columns:repeat(${__PQ_WRITE_OVERLAY_UI.gridPreviewColumns},1fr);
  gap:${__PQ_WRITE_OVERLAY_UI.gridGap};
  background:${__PQ_WRITE_OVERLAY_UI.gridBackground};
}
#traceGrid .traceTile{
  background:${__PQ_WRITE_OVERLAY_UI.tileBackground};
  border:${__PQ_WRITE_OVERLAY_UI.tileBorder};
  border-radius:${__PQ_WRITE_OVERLAY_UI.tileBorderRadius};
  overflow:hidden;
}
#traceGrid svg{
  width:100%;
  height:100%;
  display:block;
  touch-action:none;
}
#traceOverlay .settings{
  display:flex;
  gap:${__PQ_WRITE_OVERLAY_UI.settingsGap};
  align-items:center;
  margin-left:${__PQ_WRITE_OVERLAY_UI.settingsMarginLeft};
}
#traceOverlay select{
  padding:${__PQ_WRITE_OVERLAY_UI.selectPadding};
  border-radius:${__PQ_WRITE_OVERLAY_UI.selectBorderRadius};
  border:${__PQ_WRITE_OVERLAY_UI.selectBorder};
}
@media print{body>*{display:none !important;} #tracePrintRoot{display:block !important;}}
         `;

          document.head.appendChild(style);
        }

        const overlay = document.createElement('div');
        overlay.id = 'traceOverlay';
        overlay.innerHTML = `
          <div class="panel" role="dialog" aria-modal="true">
            <div class="topbar">
             <button id="traceCloseX" title="${__PQ_TEXT_CACHE.writeCloseTitle}">✕</button>
              <button id="btnResetDraw" title="${__PQ_TEXT_CACHE.writeResetTitle}">${__PQ_TEXT_CACHE.writeResetButton}</button>
              <button id="btnPrintDraw" title="${__PQ_TEXT_CACHE.writePrintTitle}">${__PQ_TEXT_CACHE.writePrintButton}</button>
              <div class="settings">
				<label style="font-size:${__PQ_WRITE_OVERLAY_UI.labelFontSize};color:${__PQ_WRITE_OVERLAY_UI.labelColor};">${__PQ_TEXT_CACHE.writeRowsLabel}</label>
				<select id="traceRows"><option>${__pqGetWriteWorksheetRows()}</option></select>
				<label style="font-size:${__PQ_WRITE_OVERLAY_UI.labelFontSize};color:${__PQ_WRITE_OVERLAY_UI.labelColor};">${__PQ_TEXT_CACHE.writeColsLabel}</label>
				<select id="traceCols"><option>${__pqGetWriteWorksheetCols()}</option></select>
			  </div>
              <div id="letterBadge">${cfg.displayLabel}</div>
            </div>
            <div id="traceGrid"></div>
          </div>
        `;

        document.body.appendChild(overlay);
      } catch (_e) {}
    }

    function bind() {
      ensureOverlay();

      state.button = document.getElementById(cfg.buttonId);
      state.overlay = document.getElementById('traceOverlay');
      state.gridEl = document.getElementById('traceGrid');
      state.closeBtn = document.getElementById('traceCloseX');
      state.resetBtn = document.getElementById('btnResetDraw');
      state.printBtn = document.getElementById('btnPrintDraw');
      state.badge = document.getElementById('letterBadge');
      state.rowsSel = document.getElementById('traceRows');
      state.colsSel = document.getElementById('traceCols');

      if (state.button) {
        state.button.addEventListener('click', () => {
          try {
            open();
          } catch (_e) {}
        });
      }

      if (state.closeBtn) state.closeBtn.addEventListener('click', close);

      if (state.overlay) {
        state.overlay.addEventListener('click', (e) => {
          if (e.target === state.overlay) close();
        });
      }

        if (state.resetBtn) {
        state.resetBtn.addEventListener('click', () => {
          try {
            if (state.gridEl) {
              state.gridEl
                .querySelectorAll('.traceCell')
                .forEach((cell) => {
                  try {
                    if (typeof cell.__pqResetInk === 'function') {
                      cell.__pqResetInk();
                    }
                  } catch (_e) {}
                });
            }
          } catch (_e) {}
        });
      }

      if (state.printBtn) {
        state.printBtn.addEventListener('click', () => {
          try {
            const title = (
              state.badge && state.badge.textContent
            ) ? state.badge.textContent : cfg.displayLabel;

            let frame = document.getElementById('adTracePrintFrame');

            if (!frame) {
              frame = document.createElement('iframe');
              frame.id = 'adTracePrintFrame';
              frame.style.position = 'fixed';
              frame.style.right = '0';
              frame.style.bottom = '0';
              frame.style.width = '0';
              frame.style.height = '0';
              frame.style.border = '0';
              frame.style.opacity = '0';
              frame.setAttribute('aria-hidden', 'true');
              document.body.appendChild(frame);
            }

            const doc = frame.contentWindow.document;

            const printCols = __PQ_WRITE_PRINT_UI.columns;
            const printGap = __PQ_WRITE_PRINT_UI.gap;
            const printMargin = __PQ_WRITE_PRINT_UI.pageMargin;

            const css = `<style>
              html,body{direction:rtl;}
              body{font-family:system-ui,Segoe UI,Arial;margin:${printMargin};}
              h2{margin:0 0 12px 0;}
              #traceGrid{
                display:grid !important;
                grid-template-columns:repeat(${printCols}, minmax(0, 1fr)) !important;
                gap:${printGap};
                direction:rtl;
                align-items:start;
              }
              .traceCell{
                width:100%;
                box-sizing:border-box;
              }
              .traceCell canvas{
                width:100%;
                height:auto;
                display:block;
              }
            
/* Alphabet tile filter type badge */
.pq-tile-filter-type {
  margin-top: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 3px 8px;
  display: inline-block;
  line-height: 1.2;
}

.tile.pq-speak-done{opacity:.45!important;filter:grayscale(.25)!important;}
</style>`;

            const printGrid = state.gridEl.cloneNode(true);

            try {
              const srcCanvases = state.gridEl.querySelectorAll('canvas');
              const dstCanvases = printGrid.querySelectorAll('canvas');

              srcCanvases.forEach((srcCanvas, i) => {
                const dstCanvas = dstCanvases[i];
                if (!dstCanvas) return;

                try {
  dstCanvas.width = srcCanvas.width;
  dstCanvas.height = srcCanvas.height;

  const dstCtx = dstCanvas.getContext('2d');
  if (dstCtx) {
    dstCtx.drawImage(srcCanvas, 0, 0);
  }
} catch (_e) {}

              });
            } catch (_e) {}

            try {
                 printGrid.style.gridTemplateColumns =
                `repeat(${__PQ_WRITE_PRINT_UI.columns}, minmax(0, 1fr))`;
            } catch (_e) {}

            try {
              const canvases = printGrid.querySelectorAll('canvas');
              canvases.forEach((c) => {
                try {
                  const img = document.createElement('img');
                  img.src = c.toDataURL('image/png');
                  img.style.width = '100%';
                  img.style.height = 'auto';
                  img.style.display = 'block';
                  c.replaceWith(img);
                } catch (_e) {}
              });
            } catch (_e) {}

            doc.open();
            doc.write(
              `<html dir="rtl"><head><title>${title}</title>${css}</head>` +
              `<body dir="rtl"><h2>${title}</h2>${printGrid.outerHTML}</body></html>`
            );
            doc.close();

            setTimeout(() => {
              try {
                frame.contentWindow.focus();
                frame.contentWindow.print();
              } catch (_e) {}
            }, 150);
          } catch (_e) {}
        });
      }

      try {
        document.body.classList.add('has-trace');
      } catch (_e) {}

      syncUI();
    }

    return {
      state,
      loadSettings,
      syncUI,
      open,
      close,
      buildGrid,
      makeTile,
      ensureOverlay,
      bind
    };
  }

  function __pqEnsureSharedWrite() {
    if (__pqSharedWrite) return __pqSharedWrite;

    __pqSharedWrite = __pqCreateChunkedWriteAdapter({
      unitKey: __PQ_UNIT_ID,
      buttonId: 'btnTrace',
      displayLabel: 'Write',
      getCurrentStep: () => getCurrentStep(),
      getGrid: () => grid,
      getLetters: () => LETTERS,

      onUiRefresh: async () => {
        renderStepper();
        updateControlsForCurrentStep();
        __pqAfterProgressChange(true);
      },

      onStepCompleted: async (stepId) => {
        try {
          if (
            __pqIsReviewMode() ||
            !__pqIsManagedUser() ||
            (managedProgress && managedProgress.__finished)
          ) {
            return null;
          }
        } catch (_e) {}

        if (__LessonRuntime && typeof __LessonRuntime.completeStep === 'function') {
          const runtimeResult = await __LessonRuntime.completeStep(stepId);
          __pqApplyRuntimeCompletion(stepId, runtimeResult);

          try {
            if (stepId === 'write' || stepId === 'trace1' || /^(write|trace)\d+$/.test(String(stepId || '').toLowerCase())) {
              const writeProgress =
                managedProgress &&
                (
                  managedProgress[stepId] ||
                  managedProgress.write ||
                  managedProgress.trace1
                );

              const done = !!(
                writeProgress &&
                (
                  writeProgress.completed ||
                  Number(writeProgress.passesDone || 0) >=
                    Number(writeProgress.passesRequired || 1)
                )
              );

              if (done) {
                try { __pqNormalizeCurrentStepId(); } catch (_e) {}
                try { __pqRefreshAfterStepCompletion(); } catch (_e) {}
                try { __pqSyncWriteUI(); } catch (_e) {}
              }
            }
          } catch (_e) {}

          return runtimeResult;
        }

        return null;
      },

      onApplyRuntimeCompletion: (stepId, runtimeResult) => {
        try {
          __pqApplyRuntimeCompletion(stepId, runtimeResult);
        } catch (_e) {}
      }
    });

    return __pqSharedWrite;
  }

  // Expose media-active hook for FocusGuard idle suppression
  window.__PQ_FOCUS_MEDIA_ACTIVE_FN__ = function () {
    try {
      if (window.__PQ_LECTURE_POPUP_ACTIVE__ || window.__PQ_LECTURE_REQUIRED_ACTIVE__) return true;
      const api = __pqEnsureFocusAdapter();
      if (api && api.mediaActive()) return true;
      const lectureVideo = document.getElementById('lectureVideo');
      if (lectureVideo && !lectureVideo.paused && !lectureVideo.ended) return true;
      const modalVideo = document.getElementById('videoPlayer');
      if (modalVideo && !modalVideo.paused && !modalVideo.ended) return true;
      const videos = document.querySelectorAll('video');
      for (const video of videos) {
        if (video && !video.paused && !video.ended) return true;
      }
      const audios = document.querySelectorAll('audio');
      for (const audio of audios) {
        if (audio && !audio.paused && !audio.ended) return true;
      }
      return false;
    } catch (_e) {
      return false;
    }
  };

  // ============================================================
  // SECTION 25: FocusGuard integration helpers
  // ============================================================

  function fgSyncStepContext(force) {
    const api = __pqEnsureFocusAdapter();
    if (api) return api.syncStepContext(force);
    return undefined;
  }

  // ============================================================
  // SECTION 26: Tile/grid rendering helpers
  // ============================================================
    function __pqIsMobileBoardLayout() {
    return __pqIsMobileViewportMatch();
  }

  function __pqGetEffectiveBoardSpan(rawSpan) {
    try {
      const parsed = Math.max(1, Number(rawSpan || 1) || 1);

      if (__pqIsMobileBoardLayout()) {
        return Math.max(1, Math.min(parsed, __PQ_GRID_UI.mobileCols || 1));
      }

      return parsed;
    } catch (_e) {
      return 1;
    }
  }

  function __pqApplyTileSpan(tile, letterObj) {
    try {
      if (!tile) return;

      try { tile.style.removeProperty('grid-column'); } catch (_e) {}
      try { tile.style.removeProperty('grid-row'); } catch (_e) {}
      try { tile.style.removeProperty('grid-area'); } catch (_e) {}

      const rawSpan = Number(
        (letterObj && (letterObj.__span || letterObj.span)) || 1
      ) || 1;

      const span = __pqGetEffectiveBoardSpan(rawSpan);

      tile.dataset.span = String(rawSpan);
      tile.dataset.effectiveSpan = String(span);

      if (span > 1) {
        tile.style.gridColumn = 'span ' + span;
      }
    } catch (_e) {}
  }

function buildTile(letterObj, idx) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.dataset.key = letterObj.key;
  tile.dataset.idx = String(idx);

  const isMobile =
    window.matchMedia &&
    window.matchMedia('(max-width: 700px)').matches;

  const sepFontSize = isMobile
    ? __cfg('canvas.mobileSepFontSize', __cfg('canvas.sepFontSize', '2.45rem'))
    : __cfg('canvas.sepFontSize', '3.2rem');

  const smallFontSize = isMobile
    ? __cfg('canvas.mobileSmallFontSize', __cfg('canvas.smallFontSize', '1.05rem'))
    : __cfg('canvas.smallFontSize', '1.2rem');

  const debugAudioName = __cfg('debug.showTileAudioNames', false)
    ? String((letterObj && letterObj.audio) || AUDIO_MAP[letterObj.key] || '').trim()
    : '';

  tile.innerHTML = `
    <div class="sep" style="font-size:${sepFontSize} !important;">
      ${letterObj.ar || letterObj.text || ''}
    </div>

    <div class="small" style="font-size:${smallFontSize} !important;">
      ${letterObj.small || letterObj.text || ''}
    </div>

    ${letterObj.en ? `<div class="translit">${letterObj.en}</div>` : ''}
    ${debugAudioName ? `<div class="audio-debug">${debugAudioName}</div>` : ''}
  `;

  try {
    tile.dataset.sepFontSize = String(sepFontSize || '');
    const sep = tile.querySelector('.sep');
    if (sep && sep.style && sep.style.setProperty) {
      sep.style.setProperty('font-size', String(sepFontSize || ''), 'important');
    }
  } catch (_e) {}

  // Keep existing filter name badge under transliteration.
  try {
    __pqAddTileFilterTypeBadge(tile, letterObj);
  } catch (_e) {}

  try { tile.style.removeProperty('grid-row'); } catch (__e) {}
  try { tile.style.removeProperty('grid-column'); } catch (__e) {}
  try { tile.style.removeProperty('grid-area'); } catch (__e) {}

  try {
    __pqApplyTileSpan(tile, letterObj);
  } catch (_e) {}

  return tile;
}

function __pqHandleGridTileClick(tile) {
  try {
    if (!tile) return;

    const key = String(tile.dataset.key || '');
    const idx = Number(tile.dataset.idx || -1);

    if (!key) return;

    const letterObj = (LETTERS || []).find((item) => item && item.key === key);
    if (!letterObj) return;

    if (!__pqPracticeFreeUI() && managedProgress && !managedProgress.__finished) {
      const currentForGate = getCurrentStep();
      const gatedStep = currentForGate && currentForGate.step ? currentForGate.step : null;
      if (gatedStep && gatedStep.id === 'lecture') return;
    }

    selectedIdx = idx;
    selectedKey = key;
    markActive();

    try {
      __pqSyncWriteUI();
    } catch (_e) {}

    alScrollToKey(letterObj.key);

    /* ===== MATCH STEP PATCH START =====
       In Match step, do not use the normal tile-click audio/play path.
       PQSharedMatchEngine owns the grid click and decides correct/wrong.
    */
    try {
      const currentForMatch = getCurrentStep();
      const matchStepId = String(
        (currentForMatch && currentForMatch.step && currentForMatch.step.id) || ''
      ).toLowerCase();

      if (matchStepId === 'match') {
        return;
      }
    } catch (_e) {}
    /* ===== MATCH STEP PATCH END ===== */

    try {
      const bridge = window.__pqSpeakBridge || window.__pqTanweenSpeak || null;
      const speakOpen = !!(
        bridge &&
        typeof bridge.shouldShowPanel === 'function' &&
        bridge.shouldShowPanel()
      );

      if (speakOpen) {
        if (__pqSpeakIsKeyCompleted(letterObj.key)) {
          try {
            __pqSpeakGreyTileFinal(letterObj.key);
            __pqSpeakFinalGreyTile(letterObj.key);
            __pqSpeakRefreshProgressFinal();
            __pqSpeakFinalRefreshProgress();
          } catch (_e) {}
          return;
        }

        const selectedItem = {
          key: letterObj.key,
          label: (letterObj.name || letterObj.ar || letterObj.key || ''),
          text: (letterObj.ar || letterObj.name || letterObj.key || '')
        };

        try {
          __pqSpeakSetSelectedKey(letterObj.key);
          window.__pq_selected_alphabet = selectedItem;
        } catch (_e) {}

        try {
          document.dispatchEvent(new CustomEvent('PQ_SPEAK_SELECT', {
            detail: selectedItem
          }));
        } catch (_e) {}

        try {
          __pqSetSpeakChildModalLetter(selectedItem.text || selectedItem.label || selectedItem.key);
          __pqOpenSpeakChildModal(true);
        
          try { __pqSpeakModalRefreshButtons(); } catch (_ignore) {}
        } catch (_e) {}

        setTimeout(function () {
          try {
            const speakTarget =
              document.getElementById('pqSpeakIconToolbar') ||
              document.getElementById('pqSpeakPanel') ||
              document.getElementById('speakMount');

            if (speakTarget && typeof speakTarget.scrollIntoView === 'function') {
              speakTarget.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });
            }
          } catch (_e) {}
        }, 40);

        return;
      }
    } catch (_e) {}

    try {
      const currentForWrite = getCurrentStep();
      if (currentForWrite && __pqIsWriteStep(currentForWrite.step)) {
        return;
      }
    } catch (_e) {}

    const rate = parseFloat(speedSel.value || DEFAULTS.speed);
    const repeatFallback = parseInt(repeatSel.value || DEFAULTS.repeat, 10);
    let repeatStepId = '';
    try {
      const curRepeatStep = getCurrentStep();
      repeatStepId = String((curRepeatStep && curRepeatStep.step && curRepeatStep.step.id) || '').toLowerCase();
    } catch (_e) {}
    const repeatCount = __pqGetStepRepeatPerLetter(repeatStepId, repeatFallback);

    try {
      const current = getCurrentStep();
      if (current && __pqIsWatchStep(current.step)) {
        try {
          const watchTile = grid
            ? grid.querySelector(`.tile[data-key="${letterObj.key}"]`)
            : null;

          const gidx = watchTile ? Number(watchTile.dataset.gidx || -1) : -1;
          selectedIdx = Number.isFinite(gidx) ? gidx : idx;
          selectedKey = letterObj.key;
          markActive();
        } catch (_e) {}

        playWatchVideoForKey(letterObj.key, rate, current && current.step && current.step.id)
          .then(() => {
            handleLetterPlayedForCurrentStep(letterObj.key);
          })
          .catch(() => {});
        return;
      }
    } catch (_e) {}

    playLetter(letterObj.key, repeatCount, rate, repeatStepId)
      .then(() => {
        handleLetterPlayedForCurrentStep(letterObj.key);
      })
      .catch(() => {});
  } catch (_e) {}
}

  function __pqBindDelegatedGridClick() {
    try {
      if (!grid) return;
      if (grid.__pqDelegatedClickBound__) return;

      grid.addEventListener('click', function (ev) {
        try {
          const tile = ev && ev.target && ev.target.closest
            ? ev.target.closest('.tile')
            : null;

          if (!tile || !grid.contains(tile)) return;
          __pqHandleGridTileClick(tile);
        } catch (_e) {}
      });

      grid.__pqDelegatedClickBound__ = true;
    } catch (_e) {}
  }

    const __pqTileByKey = new Map();
  let __pqGridTilesMounted = false;

  function __pqMountGridTilesOnce() {
    try {
      if (!grid) return;
      if (__pqGridTilesMounted) return;

      const frag = document.createDocumentFragment();

      (LETTERS || []).forEach((letterObj, i) => {
        const tile = buildTile(letterObj, i);
        tile.style.width = '100%';
        tile.style.maxWidth = '100%';
        __pqTileByKey.set(letterObj.key, tile);
        frag.appendChild(tile);
      });

      grid.innerHTML = '';
      grid.appendChild(frag);
      __pqGridTilesMounted = true;
    } catch (_e) {}
  }

function __pqApplyGridLayout() {
  if (!grid) return;

  grid.style.display = 'grid';

  const effectiveCols = __pqIsMobileBoardLayout()
    ? (__PQ_GRID_UI.mobileCols || __PQ_GRID_UI.cols || 1)
    : (__PQ_GRID_UI.cols || 1);

  if (__PQ_GRID_UI.minTileWidth) {
    grid.style.gridTemplateColumns =
      `repeat(${effectiveCols}, minmax(${__PQ_GRID_UI.minTileWidth}, 1fr))`;
  } else {
    grid.style.gridTemplateColumns =
      `repeat(${effectiveCols}, minmax(0, 1fr))`;
  }

  grid.style.width = __PQ_GRID_UI.width;
  grid.style.maxWidth = __PQ_GRID_UI.maxWidth;
  grid.style.justifyContent = 'stretch';
  grid.style.alignItems = 'stretch';
  grid.style.columnGap = __PQ_GRID_UI.columnGap;
  grid.style.rowGap = __PQ_GRID_UI.rowGap;
}

  function __pqGetCurrentLetterPass() {
    try {
      const cur = getCurrentStep && getCurrentStep();
      const stepId = cur && cur.step && cur.step.id
        ? String(cur.step.id)
        : '';

      const writeStepId =
        typeof __pqGetWriteStepId === 'function'
          ? String(__pqGetWriteStepId() || '')
          : 'trace1';

      const isWriteStep =
        stepId === writeStepId ||
        stepId === 'write' ||
        stepId === 'trace1' ||
        /^(write|trace)\d+$/.test(stepId.toLowerCase());

      if (isWriteStep) {
        const numbered = stepId.toLowerCase().match(/^(?:write|trace)(\d+)$/);
        if (numbered) {
          const numberedPass = Number(numbered[1]);
          if (Number.isFinite(numberedPass) && numberedPass > 0) {
            return Math.floor(numberedPass);
          }
        }

        const prog =
          cur && cur.progress
            ? cur.progress
            : (
                managedProgress &&
                (
                  managedProgress[writeStepId] ||
                  managedProgress.write ||
                  managedProgress.trace1
                )
              );

        const done = Math.max(0, Number((prog && prog.passesDone) || 0));
        const pass = done + 1;

        if (Number.isFinite(pass) && pass > 0) {
          return Math.floor(pass);
        }
      }
    } catch (_e) {}

    try {
      const cfgPass = Number(__cfg('write.currentPass', 1));
      if (Number.isFinite(cfgPass) && cfgPass > 0) {
        return Math.floor(cfgPass);
      }
    } catch (_e) {}

    return 1;
  }

function __pqLetterPassVisible(letterObj) {
  try {
    if (!letterObj) return true;

    const cur = getCurrentStep && getCurrentStep();
    const stepId = cur && cur.step && cur.step.id
      ? __pqCanonicalStepId(cur.step.id)
      : '';

    // Listen / Listen+ / Watch / Sound / Repeat / Match / Words / Animate and
    // numbered Write/Trace steps use stepPassFilters.
    // Pass 1 = all, pass 2 = heavy, etc.
    if ([
      'listen',
      'listenplus',
      'watch',
      'sound',
      'repeat',
      'match',
      'words',
      'animate',
      'diacritic'
    ].includes(stepId) || /^(write|trace)\d+$/.test(String((cur && cur.step && cur.step.id) || '').toLowerCase())) {
      const filterName = String(__pqGetCurrentPassFilter(stepId) || 'all')
        .trim()
        .toLowerCase();

      if (!filterName || filterName === 'all') {
        return true;
      }

      const keys = __pqGetKeysForPassFilter(filterName);
      return Array.isArray(keys) ? keys.indexOf(letterObj.key) !== -1 : true;
    }

    // Only Write/Trace uses cell.pass grouping.
    const rawPass =
      letterObj.__pass !== undefined && letterObj.__pass !== null
        ? letterObj.__pass
        : letterObj.pass;

    if (rawPass === undefined || rawPass === null || rawPass === '') {
      return true;
    }

    return Number(rawPass) === __pqGetCurrentLetterPass();
  } catch (_e) {
    return true;
  }
}

function __pqAddTileFilterTypeBadge(tile, letterObj) {
  try {
    if (!tile) return;

    const old = tile.querySelector && tile.querySelector('.pq-tile-filter-type');
    if (old) old.remove();

    if (!letterObj) return;

    let badgeText = '';

    const cur = getCurrentStep && getCurrentStep();
    const stepId = cur && cur.step && cur.step.id
      ? __pqCanonicalStepId(cur.step.id)
      : '';

    if ([
      'listen',
      'listenplus',
      'watch',
      'sound',
      'repeat',
      'match',
      'words',
      'animate',
      'diacritic'
    ].includes(stepId)) {
      const filterName = String(__pqGetCurrentPassFilter(stepId) || '').trim();
      const normalized = filterName.toLowerCase();

      if (!normalized || normalized === 'all') {
        return;
      }

      badgeText = filterName;
    } else {
      badgeText = String(
        letterObj.__filterType ||
        letterObj.filterType ||
        ''
      ).trim();

      const normalized = badgeText.toLowerCase();

      if (!normalized || normalized === 'letter' || normalized === 'all') {
        return;
      }
    }

    const badge = document.createElement('div');
    badge.className = 'pq-tile-filter-type';
    badge.textContent = badgeText;
    tile.appendChild(badge);
	
  } catch (_e) {}
}

  function renderGrid() {
    if (!grid) return;

    __pqApplyGridLayout();
    __pqMountGridTilesOnce();

    const currentRawStepId = (() => {
      try {
        const cur = (typeof getCurrentStep === 'function') ? getCurrentStep() : null;
        return String((cur && cur.step && cur.step.id) || '').toLowerCase();
      } catch (_e) {
        return '';
      }
    })();
    const hideWriteDetailCopy = /^write[1-3]$/.test(currentRawStepId);
    const hideForContentOnlyStep = (() => {
      try {
        const cur = (typeof getCurrentStep === 'function') ? getCurrentStep() : null;
        return !!(cur && cur.step && typeof __pqIsContentOnlyStep === 'function' && __pqIsContentOnlyStep(cur.step));
      } catch (_e) {
        return false;
      }
    })();

    let g = 0;

    (LETTERS || []).forEach((letterObj) => {
      const tile = __pqTileByKey.get(letterObj.key);
      if (!tile) return;

      const visible = !hideForContentOnlyStep && !!(passesFilter(letterObj.key) && __pqLetterPassVisible(letterObj));

      tile.dataset.pqRuntimeVisible = visible ? '1' : '0';
      tile.style.display = visible ? '' : 'none';
      tile.hidden = !visible;
      tile.dataset.gidx = visible ? String(g++) : '-1';
      tile.classList.toggle('pq-hide-detail-copy', hideWriteDetailCopy);

      /* PQ alphabet: refresh badge on every render/pass */
      try {
        __pqAddTileFilterTypeBadge(tile, letterObj);
      } catch (_e) {}

      try {
        __pqApplyTileSpan(tile, letterObj);
      } catch (_e) {}
    });

    markActive();

    try {
      refreshPlayedClasses();
    } catch (_e) {}

    try {
      if (typeof __pqApplySoundCompletedVisuals === 'function') {
        __pqApplySoundCompletedVisuals();
      }
    } catch (_e) {}
  }

  
function __pqGridIsCurrentSpeakStep() {
  try {
    const cur = (typeof getCurrentStep === 'function') ? getCurrentStep() : null;
    return !!(
      cur &&
      cur.step &&
      String(cur.step.id || '').toLowerCase() === 'speak'
    );
  } catch (_e) {
    return false;
  }
}

function __pqGridClearSpeakDoneVisual(tile) {
  try {
    if (!tile) return;
    tile.classList.remove('pq-speak-done');
    tile.removeAttribute('data-speak-done');
    if (tile.style.opacity) tile.style.opacity = '';
    if (String(tile.style.filter || '').indexOf('grayscale') !== -1) tile.style.filter = '';
  } catch (_e) {}
}

function __pqResetGridVisualStateForStepHandoff() {
  try {
    selectedIdx = -1;
    selectedKey = null;
  } catch (_e) {}

  try { __pqClearPlayingTile(); } catch (_e) {}
  try { __pqSpeakClearDoneTileVisualsFinal(); } catch (_e) {}

  try {
    const tiles = grid ? grid.querySelectorAll('.tile') : document.querySelectorAll('#grid .tile');
    tiles.forEach((tile) => {
      tile.classList.remove(
        'active',
        'pq-playing',
        'is-playing',
        'pq-speak-done'
      );
      tile.removeAttribute('data-speak-done');
      tile.style.opacity = '';
      if (String(tile.style.filter || '').indexOf('grayscale') !== -1) {
        tile.style.filter = '';
      }
    });
  } catch (_e) {}
}

function markActive() {
  const tiles = [...(grid ? grid.querySelectorAll('.tile') : [])];
  const showSpeakDoneState = __pqGridIsCurrentSpeakStep();

  tiles.forEach((tile) => {
    const key = String(tile.dataset.key || '');
    const idx = Number(tile.dataset.idx || -1);

    const isDone = !!(
      __pqSpeakUiState &&
      __pqSpeakUiState.completedKeys &&
      __pqSpeakUiState.completedKeys[key]
    );

    const isActiveByKey = !!(selectedKey && key === selectedKey);
    const isActiveByIdx = (!selectedKey && idx === selectedIdx);

    tile.classList.toggle('active', !(showSpeakDoneState && isDone) && (isActiveByKey || isActiveByIdx));

    if (showSpeakDoneState && isDone) {
      tile.classList.add('played', 'completed', 'pq-speak-done');
      tile.setAttribute('data-speak-done', '1');
      tile.style.opacity = '0.45';
      tile.style.filter = 'grayscale(0.25)';
    } else {
      __pqGridClearSpeakDoneVisual(tile);
    }
  });

  if (showSpeakDoneState) {
    try { __pqSpeakApplyDoneTilesFinal(); } catch (_e) {}
  }
  try { __pqSpeakRefreshProgressFinal(); } catch (_e) {}
}


  function arForKey(key) {
    const item = LETTERS.find((x) => x.key === key);
    return item ? (item.ar || '') : '';
  }

  function audioStemForKey(key) {
    try {
      const url = (VIDEO_BY_KEY && VIDEO_BY_KEY[key]) ? String(VIDEO_BY_KEY[key]) : '';
      if (!url) return arForKey(key);

      const clean = url.split('?')[0].split('#')[0];
      const file = clean.substring(clean.lastIndexOf('/') + 1);
      return file.replace(/\.mp3$/i, '');
    } catch (_e) {}

    return arForKey(key);
  }

  function alScrollToKey(letterKey) {
    // Prefer shared autoscroll if available
    try {
      if (
        window.PQAutoScroll &&
        typeof window.PQAutoScroll.scrollToLetter === 'function'
      ) {
        try {
          if (window.PQAutoScroll.scrollToLetter(letterKey)) return true;
        } catch (_e) {}
      }
    } catch (_e) {}

    try {
      const core = window.PQManagedCore || (window.PQ && window.PQ.ManagedCore) || null;
      if (core && typeof core.scrollToLetterTile === 'function') {
        if (core.scrollToLetterTile(letterKey)) return true;
      }
    } catch (_e) {}

    // Final fallback: center tile in viewport
    try {
      const esc = (window.CSS && CSS.escape)
        ? CSS.escape
        : (s) => String(s).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');

      const gridEl = document.getElementById('grid');
      let el = null;

      if (gridEl) {
        el = gridEl.querySelector(`[data-key="${esc(letterKey)}"]`);
      }

      if (!el) {
        el = document.querySelector(`[data-key="${esc(letterKey)}"]`);
      }

      if (!el) return false;

      const tile = el.closest('.tile') || el;
      const rect = tile.getBoundingClientRect();

      const absoluteTop =
        rect.top + (window.pageYOffset || document.documentElement.scrollTop || 0);

      const absoluteLeft =
        rect.left + (window.pageXOffset || document.documentElement.scrollLeft || 0);

      const targetTop = Math.max(
        0,
        absoluteTop - (window.innerHeight / 2) + (rect.height / 2)
      );

      const targetLeft = Math.max(
        0,
        absoluteLeft - (window.innerWidth / 2) + (rect.width / 2)
      );

      try {
        window.scrollTo({
          top: targetTop,
          left: targetLeft,
          behavior: 'smooth'
        });
      } catch (_e) {
        window.scrollTo(targetLeft, targetTop);
      }

      return true;
    } catch (_e) {}

    return false;
  }
  
    function __pqScrollToSpeakActionBlock() {
    try {
      const target =
        document.getElementById('pqSpeakIconToolbar') ||
        document.getElementById('pqSpeakPanel') ||
        document.getElementById('speakMount');

      if (!target || typeof target.scrollIntoView !== 'function') {
        return false;
      }

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      return true;
    } catch (_e) {
      return false;
    }
  }

  // ============================================================
