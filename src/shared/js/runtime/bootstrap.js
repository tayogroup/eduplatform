/*
  Pre-Quraan Alphabet runtime fragment: bootstrap.js
  Runtime bootstrap, config, shared state, and lesson data setup.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
/* ============================================================
   Alphabet unit - Browser Main JS
   FLOW LAYOUT BASELINE v6 SPAN
   ------------------------------------------------------------
   Main-board span support added for flow layout.
   - browser: honor configured span
   - mobile: honor span, capped to mobileGridCols
   - keeps managed/review/speak/write behavior unchanged
   ============================================================ */

// ============================================================
// Alphabet unit - Flow Main JS
// Part 1 of 3
// Based on the current working file, cleaned and commented.
// This part covers:
// 1) Unit config/bootstrap
// 2) Reward/message helpers
// 3) Cache guard/bootstrap
// 4) Core/runtime/focus/config helpers
// 5) Lesson data mapping + step definitions
// 6) Managed/review mode helpers
// ============================================================

(function () {
  'use strict';

  

  

  function __pqStepDelay(stepOrMs, key, signal) {
    let ms = 0;

    try {
      if (typeof key === 'string' && key) {
        const stepId = String(stepOrMs || '').toLowerCase();
        ms = Number(__cfg('playback.steps.' + stepId + '.' + key, 0) || 0);
      } else {
        ms = Number(stepOrMs || 0);
      }
    } catch (_e) {
      ms = 0;
    }

    ms = Math.max(0, Number(ms) || 0);

    return new Promise(function (resolve, reject) {
      let timer = null;

      function done() {
        try {
          if (signal) signal.removeEventListener('abort', onAbort);
        } catch (_e) {}
        resolve();
      }

      function onAbort() {
        try {
          if (timer) clearTimeout(timer);
        } catch (_e) {}

        const err = new Error('Aborted');
        err.name = 'AbortError';
        reject(err);
      }

      try {
        if (signal && signal.aborted) {
          onAbort();
          return;
        }

        if (signal) {
          signal.addEventListener('abort', onAbort, { once: true });
        }

        timer = setTimeout(done, ms);
      } catch (_e) {
        resolve();
      }
    });
  }

// ============================================================
  // SECTION 1: Safe unit configuration
  // ------------------------------------------------------------
  // Read configuration from window.UNIT_CFG.
  // The runtime must not guess unit identity or Moodle web-service names.
  // ============================================================

  if (
    typeof window === 'undefined' ||
    !window.UNIT_CFG ||
    typeof window.UNIT_CFG !== 'object'
  ) {
    const message = 'Pre-Quraan unit config missing: unit.config.js must load before the shared runtime bundle.';

    try {
      document.documentElement.innerHTML = [
        '<div style="font-family:system-ui,sans-serif;text-align:center;margin:48px auto;max-width:720px;padding:24px;">',
        '<h1>Unit Configuration Error</h1>',
        '<p>',
        message,
        '</p>',
        '</div>'
      ].join('');
    } catch (_e) {}

    throw new Error(message);
  }

  const UNIT_CFG = window.UNIT_CFG;

  function __pqFailConfig(message) {
    try {
      document.documentElement.innerHTML = [
        '<div style="font-family:system-ui,sans-serif;text-align:center;margin:48px auto;max-width:720px;padding:24px;">',
        '<h1>Unit Configuration Error</h1>',
        '<p>',
        message,
        '</p>',
        '</div>'
      ].join('');
    } catch (_e) {}

    throw new Error(message);
  }

  ['unitid', 'wsGetFunction', 'wsSetFunction'].forEach(function (key) {
    if (!UNIT_CFG[key]) {
      __pqFailConfig('Pre-Quraan unit config missing required field: ' + key);
    }
  });

  if (!Array.isArray(UNIT_CFG.steps) || !UNIT_CFG.steps.length) {
    __pqFailConfig('Pre-Quraan unit config missing required field: steps');
  }

  /**
   * Safe config reader.
   * Example: __cfg('write.chunkSize', 8)
   */
  
/* ============================================================
   ASSET VERSIONING / CACHE-BUSTING
   ------------------------------------------------------------
   Appends ?v=... to CDN media URLs so updated audio/video/images
   are fetched immediately after deployment.
   ============================================================ */

const ASSET_VERSION = String(
  (window.UNIT_CFG && (window.UNIT_CFG.ASSET_VERSION || window.UNIT_CFG.assetVersion)) ||
  (window.UNIT_CFG && window.UNIT_CFG.media && (window.UNIT_CFG.media.ASSET_VERSION || window.UNIT_CFG.media.assetVersion)) ||
  '20260502_01'
);

function __pqAppendAssetVersion(url) {
  try {
    url = String(url || '');
    if (!url) return url;

    // Do not double-append.
    if (/[?&]v=/.test(url)) return url;

    return url + (url.indexOf('?') === -1 ? '?v=' : '&v=') + encodeURIComponent(ASSET_VERSION);
  } catch (_e) {
    return url;
  }
}

function __cfg(path, fallback) {
    try {
      const parts = String(path || '').split('.');
      let cur = UNIT_CFG;

      for (const part of parts) {
        if (!part) continue;
        cur = cur && cur[part];
      }

      return (cur === undefined || cur === null) ? fallback : cur;
    } catch (_e) {
      return fallback;
    }
  }

  function __pqLocalizedCfg(path, fallback, area) {
    try {
      if (window.PQL10n && typeof window.PQL10n.path === 'function') {
        return window.PQL10n.path(UNIT_CFG, path, fallback, area || 'ui');
      }
    } catch (_e) {}
    return __cfg(path, fallback);
  }

  function __uiText(path, fallback) {
    return String(__pqLocalizedCfg(`uiText.${path}`, fallback, 'ui'));
  }

  function __pqIdentity(path, fallback) {
    return String(__cfg(`identity.${path}`, fallback));
  }

  function __pqStorageKey(path, fallback) {
    return String(__cfg(`storageKeys.${path}`, fallback));
  }

  function __pqCanonicalStepId(stepId) {
    const raw = String(stepId || '').trim().toLowerCase();
    if (raw === 'phonetics') return 'sound';
    if (raw === 'letterclue') return 'listenplus';
    if (raw === 'soundclue') return 'words';
    if (raw === 'write') return 'trace1';
    return raw;
  }

  function __stepperText(path, fallback) {
    return String(__pqLocalizedCfg(`stepperUi.${path}`, fallback, 'ui'));
  }

  function __pqLocalizedStepLabel(step, fallback) {
    try {
      const s = step || {};
      const sid = String(s.id || '').trim();
      const base = String((s.label || s.title || fallback || sid || 'Action'));
      const raw = sid ? __pqLocalizedCfg('stepLabels.' + sid, base, 'ui') : base;
      if (raw && typeof raw === 'object') {
        if (window.PQL10n && typeof window.PQL10n.value === 'function') {
          return String(window.PQL10n.value(raw, 'ui', base));
        }
      }
      return String(raw || base);
    } catch (_e) {
      return String(fallback || (step && step.label) || 'Action');
    }
  }

  function __pqGetWordLimit() {
    try {
      const max = Number(__cfg('wordLimit', 0));
      return Number.isFinite(max) && max > 0 ? Math.floor(max) : 0;
    } catch (_e) {
      return 0;
    }
  }

  const __PQ_UNIT_ID = String(
    __cfg('unitid', __pqIdentity('unitId', ''))
  );

  const __PQ_MESSAGE_UNIT_KEY = String(
    __cfg('messageUnitKey', 'alphabet')
  );

  const __PQ_WS_GET = String(
    __cfg('wsGetFunction', '')
  );

  const __PQ_WS_SET = String(
    __cfg('wsSetFunction', '')
  );

  const __PQ_MANAGED_PROGRESS_CACHE_KEY = `${__PQ_UNIT_ID}_managed_progress_cache_v1`;

    const __PQ_TEXT_CACHE = Object.freeze({
    playAll: __uiText('playAll', '▶ Play All'),
    pause: __uiText('pause', '⏸ Pause'),
    resume: __uiText('resume', '▶ Resume'),

    speakPopupOk: __uiText('speakPopup.okButton', 'OK'),

    writeCloseTitle: __uiText('writeOverlay.closeTitle', 'Close'),
    writeResetTitle: __uiText('writeOverlay.resetTitle', 'Reset'),
    writeResetButton: __uiText('writeOverlay.resetButton', 'Reset ↺'),
    writePrintTitle: __uiText('writeOverlay.printTitle', 'Print'),
    writePrintButton: __uiText('writeOverlay.printButton', 'Print 🖨'),
    writeRowsLabel: __uiText('writeOverlay.rowsLabel', 'Rows'),
    writeColsLabel: __uiText('writeOverlay.colsLabel', 'Cols'),
    writeBadgeAllWords: __uiText('writeOverlay.badgeAllWords', 'All Words'),
    writeBadgePartPrefix: __uiText('writeOverlay.badgePartPrefix', 'Part'),
    writeBadgeSeparator: __uiText('writeOverlay.badgeSeparator', ' — '),
    writeBadgeOfWord: __uiText('writeOverlay.badgeOfWord', 'of'),
    writeBadgeRangeOpen: __uiText('writeOverlay.badgeRangeOpen', '('),
    writeBadgeRangeDash: __uiText('writeOverlay.badgeRangeDash', '–'),
    writeBadgeRangeClose: __uiText('writeOverlay.badgeRangeClose', ')'),

    stepPrefix: __stepperText('stepPrefix', 'Step'),
    progressLabel: __stepperText('progressLabel', 'Progress'),
    reviewAriaPrefix: __stepperText('reviewAriaPrefix', 'Review'),
    badgeCompleted: __stepperText('badgeCompleted', '✓'),
    badgeActive: __stepperText('badgeActive', '▶'),
    badgePending: __stepperText('badgePending', '•'),

    micEnablePopupText: String(
  __cfg('speakUi.micEnablePopupText', 'Please enable microphone first.')
)
  });

  const __PQ_FOCUS_BADGE_CFG = Object.freeze({
    greatMin: Number(__cfg('focusBadge.great.minScore', 120)) || 120,
    goodMin: Number(__cfg('focusBadge.good.minScore', 30)) || 30,
    greatCls: String(__cfg('focusBadge.great.cls', 'focus-great')),
    greatText: String(__pqLocalizedCfg('focusBadge.great.text', 'Great Focus', 'ui')),
    goodCls: String(__cfg('focusBadge.good.cls', 'focus-good')),
    goodText: String(__pqLocalizedCfg('focusBadge.good.text', 'Good Focus', 'ui')),
    keepCls: String(__cfg('focusBadge.keep.cls', 'focus-keep')),
    keepText: String(__pqLocalizedCfg('focusBadge.keep.text', 'Try to Focus', 'ui'))
  });

  const __PQ_GRID_UI = Object.freeze({
    cols: Math.max(1, Number(__cfg('canvas.gridCols', 2)) || 2),
    mobileCols: Math.max(1, Number(__cfg('canvas.mobileGridCols', 2)) || 2),
    width: String(__cfg('canvas.width', '90%')),
    maxWidth: String(__cfg('canvas.maxWidth', '90%')),
    columnGap: String(__cfg('canvas.columnGap', '16px')),
    rowGap: String(__cfg('canvas.rowGap', '16px')),
    minTileWidth: String(__cfg('canvas.minTileWidth', '') || '').trim()
  });

  const __PQ_WRITE_OVERLAY_UI = Object.freeze({
    overlayBackground: String(__cfg('write.overlayUi.overlayBackground', 'rgba(0,0,0,.55)')),
    zIndex: String(__cfg('write.overlayUi.zIndex', 9999)),
    panelWidth: String(__cfg('write.overlayUi.panel.width', 'min(1100px,92vw)')),
    panelHeight: String(__cfg('write.overlayUi.panel.height', 'min(760px,88vh)')),
    panelBackground: String(__cfg('write.overlayUi.panel.background', '#fff')),
    panelBorderRadius: String(__cfg('write.overlayUi.panel.borderRadius', '18px')),
    panelBoxShadow: String(__cfg('write.overlayUi.panel.boxShadow', '0 18px 70px rgba(0,0,0,.35)')),
    topbarGap: String(__cfg('write.overlayUi.topbar.gap', '10px')),
    topbarPadding: String(__cfg('write.overlayUi.topbar.padding', '12px 14px')),
    topbarBorderBottom: String(__cfg('write.overlayUi.topbar.borderBottom', '1px solid #eee')),
    closeBg: String(__cfg('write.overlayUi.closeButton.background', '#f3f4f6')),
    closeRadius: String(__cfg('write.overlayUi.closeButton.borderRadius', '12px')),
    closePadding: String(__cfg('write.overlayUi.closeButton.padding', '10px 14px')),
    closeFontSize: String(__cfg('write.overlayUi.closeButton.fontSize', '18px')),
    actionBg: String(__cfg('write.overlayUi.actionButton.background', '#f3f4f6')),
    actionRadius: String(__cfg('write.overlayUi.actionButton.borderRadius', '12px')),
    actionPadding: String(__cfg('write.overlayUi.actionButton.padding', '10px 14px')),
    actionWeight: String(__cfg('write.overlayUi.actionButton.fontWeight', '700')),
    badgeWeight: String(__cfg('write.overlayUi.badge.fontWeight', '800')),
    gridPadding: String(__cfg('write.overlayUi.grid.padding', '16px')),
    gridGap: String(__cfg('write.overlayUi.grid.gap', '14px')),
    gridBackground: String(__cfg('write.overlayUi.grid.background', '#fafafa')),
    gridPreviewColumns: Math.max(1, Number(__cfg('write.overlayUi.grid.previewColumns', 3)) || 3),
    tileBackground: String(__cfg('write.overlayUi.tile.background', '#fff')),
    tileBorder: String(__cfg('write.overlayUi.tile.border', '1px solid #eee')),
    tileBorderRadius: String(__cfg('write.overlayUi.tile.borderRadius', '14px')),
    settingsGap: String(__cfg('write.overlayUi.settings.gap', '8px')),
    settingsMarginLeft: String(__cfg('write.overlayUi.settings.marginLeft', '10px')),
    selectPadding: String(__cfg('write.overlayUi.select.padding', '6px 8px')),
    selectBorderRadius: String(__cfg('write.overlayUi.select.borderRadius', '10px')),
    selectBorder: String(__cfg('write.overlayUi.select.border', '1px solid #ddd')),
    labelFontSize: String(__cfg('write.overlayUi.label.fontSize', '12px')),
    labelColor: String(__cfg('write.overlayUi.label.color', '#666'))
  });

  const __PQ_WRITE_CANVAS_UI = Object.freeze({
    width: Number(__cfg('write.canvas.width', 800)) || 800,
    height: Number(__cfg('write.canvas.height', 320)) || 320,
    borderColor: String(__cfg('write.canvas.borderColor', '#e7dbc1')),
    borderRadius: String(__cfg('write.canvas.borderRadius', '10px')),
    guideTop: Number(__cfg('write.canvas.guide.top', 110)) || 110,
    guideMid: Number(__cfg('write.canvas.guide.mid', 150)) || 150,
    guideBase: Number(__cfg('write.canvas.guide.base', 205)) || 205,
    guideBottom: Number(__cfg('write.canvas.guide.bottom', 260)) || 260,
    guideSidePadding: Number(__cfg('write.canvas.guide.sidePadding', 24)) || 24,
    guideTopColor: String(__cfg('write.canvas.guide.topColor', '#e8e2cf')),
    guideMidDash: __cfg('write.canvas.guide.midDash', [14, 10]) || [14, 10],
    guideMidColor: String(__cfg('write.canvas.guide.midColor', '#e0d6bc')),
    guideBaseColor: String(__cfg('write.canvas.guide.baseColor', '#d5c8a2')),
    guideBottomColor: String(__cfg('write.canvas.guide.bottomColor', '#e8e2cf')),
    practiceStartY: Number(__cfg('write.canvas.practice.startY', 330)) || 330,
    practiceEndPadding: Number(__cfg('write.canvas.practice.endPadding', 36)) || 36,
    practiceGap: Number(__cfg('write.canvas.practice.gap', 84)) || 84,
    practiceColor: String(__cfg('write.canvas.practice.color', '#e0d6bc')),
    practiceDash: __cfg('write.canvas.practice.dash', [14, 10]) || [14, 10],
    practiceWidth: Number(__cfg('write.canvas.practice.width', 2)) || 2,
    ghostAlpha: Number(__cfg('write.canvas.ghostText.alpha', 0.18)) || 0.18,
    ghostColor: String(__cfg('write.canvas.ghostText.color', '#10223a')),
    ghostWideFontPx: Number(__cfg('write.canvas.ghostText.wideFontPx', 50)) || 50,
    ghostNormalFontPx: Number(__cfg('write.canvas.ghostText.normalFontPx', 74)) || 74,
    inkColor: String(__cfg('write.canvas.inkColor', '#0d223a')),
    inkWidth: Number(__cfg('write.canvas.inkWidth', 7)) || 7
  });

  const __PQ_WRITE_PRINT_UI = Object.freeze({
    columns: Math.max(1, Number(__cfg('write.print.columns', 2)) || 2),
    gap: String(__cfg('write.print.gap', '12px')),
    pageMargin: String(__cfg('write.print.pageMargin', '16px'))
  });

  function __pqGetWriteCanvasMode(modeOverride) {
    try {
      if (modeOverride) return String(modeOverride).toLowerCase();
      return window.innerWidth <= 768 ? 'mobile' : 'desktop';
    } catch (_e) {
      return 'desktop';
    }
  }

  function __pqGetWriteCanvasMetrics(modeOverride) {
    const mode = __pqGetWriteCanvasMode(modeOverride);
    const modeCfg = __cfg('write.canvas.byMode.' + mode, {}) || {};

    return {
      mode: mode,
      width: Number(modeCfg.width != null ? modeCfg.width : __PQ_WRITE_CANVAS_UI.width) || __PQ_WRITE_CANVAS_UI.width,
      height: Number(modeCfg.height != null ? modeCfg.height : __PQ_WRITE_CANVAS_UI.height) || __PQ_WRITE_CANVAS_UI.height,
      ghostNormalFontPx: Number(
        modeCfg.ghostNormalFontPx != null ? modeCfg.ghostNormalFontPx : __PQ_WRITE_CANVAS_UI.ghostNormalFontPx
      ) || __PQ_WRITE_CANVAS_UI.ghostNormalFontPx,
      ghostWideFontPx: Number(
        modeCfg.ghostWideFontPx != null ? modeCfg.ghostWideFontPx : __PQ_WRITE_CANVAS_UI.ghostWideFontPx
      ) || __PQ_WRITE_CANVAS_UI.ghostWideFontPx
    };
  }

  const __PQ_SPEAK_POPUP_UI = Object.freeze({
    overlayBackground: String(__cfg('speakPopupUi.overlayBackground', 'rgba(0,0,0,0.55)')),
    zIndex: String(__cfg('speakPopupUi.zIndex', 99999)),
    boxBackground: String(__cfg('speakPopupUi.box.background', '#fff')),
    boxBorderRadius: String(__cfg('speakPopupUi.box.borderRadius', '16px')),
    boxPadding: String(__cfg('speakPopupUi.box.padding', '24px')),
    boxMaxWidth: String(__cfg('speakPopupUi.box.maxWidth', '320px')),
    boxWidth: String(__cfg('speakPopupUi.box.width', '90%')),
    boxTextAlign: String(__cfg('speakPopupUi.box.textAlign', 'center')),
    boxShadow: String(__cfg('speakPopupUi.box.boxShadow', '0 20px 60px rgba(0,0,0,.35)')),
    boxFontWeight: String(__cfg('speakPopupUi.box.fontWeight', '600')),
    messageMarginBottom: String(__cfg('speakPopupUi.message.marginBottom', '18px')),
    messageFontSize: String(__cfg('speakPopupUi.message.fontSize', '16px')),
    buttonBackground: String(__cfg('speakPopupUi.button.background', '#4CAF50')),
    buttonColor: String(__cfg('speakPopupUi.button.color', '#fff')),
    buttonPadding: String(__cfg('speakPopupUi.button.padding', '10px 18px')),
    buttonBorderRadius: String(__cfg('speakPopupUi.button.borderRadius', '10px')),
    buttonFontWeight: String(__cfg('speakPopupUi.button.fontWeight', '700'))
  });

const __PQ_PLAYBACK_CFG = Object.freeze({
  listen: Object.freeze(__cfg('playback.steps.listen', {}) || {}),
  listenplus: Object.freeze(__cfg('playback.steps.listenplus', {}) || {}),
  watch: Object.freeze(__cfg('playback.steps.watch', {}) || {}),
  sound: Object.freeze(__cfg('playback.steps.sound', {}) || {}),
  repeat: Object.freeze(__cfg('playback.steps.repeat', {}) || {}),
  match: Object.freeze(__cfg('playback.steps.match', {}) || {}),
  words: Object.freeze(__cfg('playback.steps.words', {}) || {}),
  animate: Object.freeze(__cfg('playback.steps.animate', {}) || {})
});

  /**
   * Convert a joined Arabic word into a spaced display line.
   * Used for the small helper line under each tile.
   */
  function __separateWord(value) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return Array.from(text.replace(/\s+/g, '')).join(' ');
  }

  // ============================================================
  // SECTION 2: Unit identity
  // ============================================================
  const js_version_in_use = String(
    __cfg('jsVersion', 'pq_unit_runtime_config_required')
  );

  window.js_version_in_use = js_version_in_use;
  window.PQ_UNIT_NAME = __PQ_MESSAGE_UNIT_KEY;

window.PQ_UNIT_STEPS = (
  __cfg('messageStepKeys', [
    'lecture',
    'listen',
    'listenplus',
    'watch',
    'sound',
    'repeat',
    'speak',
    'match',
    'animate',
    'trace1',
    'words'
  ]) || []
).slice();


  // ============================================================
  // SECTION 3: Portable lesson definition
  // ------------------------------------------------------------
  // This remains the main lesson identity used by the runtime.
  // ============================================================

const LESSON_DEF = {
  lessonid: String(__cfg('lessonid', __pqIdentity('lessonId', 'tajweed'))),
  unitid: __PQ_UNIT_ID,

  wsGetFunction: __PQ_WS_GET,
  wsSetFunction: __PQ_WS_SET,

  lectureUrl: String(
    __cfg(
      'media.lectureUrl',
      ''
    )
  ),
      defaultSteps: (function () {
      const cfgSteps = __cfg('steps', null);

      if (Array.isArray(cfgSteps) && cfgSteps.length) {
        return cfgSteps.map((step) => ({
          id: String(step.id || ''),
          type: String(step.type || ''),
          label: String(step.label || step.id || ''),
          arabicLabel: String(step.arabicLabel || step.labelAr || step.ar || ''),
          filter: String(step.filter || 'all')
        }));
      }

      __pqFailConfig('Pre-Quraan unit config missing required field: steps');
    })()
  };

  // ============================================================
  // SECTION 4: Write step configuration
  // ------------------------------------------------------------
  // This controls chunking and worksheet layout for the write step.
  // ============================================================
  const WRITE_CFG = {
    chunkSize: Number(__cfg('write.chunkSize', 7)),
    batchRows: Number(__cfg('write.rows', 4)),
    batchCols: Number(__cfg('write.cols', 2)),
    minPassesRequired: null
  };

  /**
   * Normalize trace labels to write labels for UI consistency.
   */
   function __pqWriteLabel(value) {
    let out = String(value || '');

    const cfgMap = __cfg('writeLabelMap', null);

    if (Array.isArray(cfgMap) && cfgMap.length) {
      cfgMap.forEach((rule) => {
        try {
          const from = String(rule && rule.from || '');
          const to = String(rule && rule.to || '');
          if (!from) return;

          const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          out = out.replace(new RegExp(escaped, 'gi'), to);
        } catch (_e) {}
      });

      return out;
    }

    return out
      .replace(/Trace1/gi, 'Write')
      .replace(/Trace 1/gi, 'Write')
      .replace(/Trace2/gi, 'Write2')
      .replace(/Trace 2/gi, 'Write2')
      .replace(/\bTrace\b/gi, 'Write');
  }

  // ============================================================
  // SECTION 5: Shared runtime state
  // ============================================================
    let __LessonRuntime = null;
  let __pqTotalStars = 0;
  let __pqCompletedUnits = 0;
  let __pqLectureCompleteInFlight = false;
  let __pqLectureCompleteHandled = false;
  let __pqLastStepIdForPlaylistReset = null;
  let __pqLastPlayAllStepId = null;
  let __pqRewardBar = null;
  let __pqStickyReviewStepId = null;

  // ============================================================
  // SECTION 6: Reward/focus helpers
  // ============================================================
  function __pqGetFocusBadgeState() {
    try {
      const fg = window.FocusGuard || null;
      const summary =
        (fg && typeof fg.getSummary === 'function' && fg.getSummary()) ||
        window.__PQ_FOCUS_SUMMARY__ ||
        null;

      const activeSeconds = Number(
        (summary && (
          summary.activeSeconds ??
          summary.active_seconds ??
          summary.focusSeconds ??
          summary.focus_seconds
        )) || 0
      );

      const idleSeconds = Number(
        (summary && (
          summary.idleSeconds ??
          summary.idle_seconds
        )) || 0
      );

      const pauseCount = Number(
        (summary && (
          summary.pauseCount ??
          summary.pause_count ??
          summary.pauses
        )) || 0
      );

      const scoreBase = Math.max(
        0,
        activeSeconds - (idleSeconds * 0.5) - (pauseCount * 8)
      );

      const greatMin = __PQ_FOCUS_BADGE_CFG.greatMin;
      const goodMin = __PQ_FOCUS_BADGE_CFG.goodMin;

      const greatCls = __PQ_FOCUS_BADGE_CFG.greatCls;
      const greatText = __PQ_FOCUS_BADGE_CFG.greatText;

      const goodCls = __PQ_FOCUS_BADGE_CFG.goodCls;
      const goodText = __PQ_FOCUS_BADGE_CFG.goodText;

      const keepCls = __PQ_FOCUS_BADGE_CFG.keepCls;
      const keepText = __PQ_FOCUS_BADGE_CFG.keepText;

      if (scoreBase >= greatMin) {
        return { cls: greatCls, text: greatText };
      }
      if (scoreBase >= goodMin) {
        return { cls: goodCls, text: goodText };
      }

      return { cls: keepCls, text: keepText };
    } catch (_e) {
      return {
        cls: __PQ_FOCUS_BADGE_CFG.keepCls,
        text: __PQ_FOCUS_BADGE_CFG.keepText
      };
    }
  }

  function __pqCountCompletedSteps() {
    try {
      if (!managedProgress || !Array.isArray(STEPS)) return 0;

      let completed = 0;
      for (const step of STEPS) {
        if (managedProgress[step.id] && managedProgress[step.id].completed) {
          completed += 1;
        }
      }
      return completed;
    } catch (_e) {
      return 0;
    }
  }

  function __pqGetTotalStarsEarned() {
    try {
      if (
        Number.isFinite(Number(__pqTotalStars)) &&
        Number(__pqTotalStars) >= 0
      ) {
        return Number(__pqTotalStars);
      }

      const key = 'pq_total_stars_earned_v1';
      const stored = Number(localStorage.getItem(key) || '0');

      return Number.isFinite(stored) && stored >= 0 ? stored : 0;
    } catch (_e) {
      return 0;
    }
  }

  function __pqGetCompletedUnitsCount() {
    try {
      if (
        Number.isFinite(Number(__pqCompletedUnits)) &&
        Number(__pqCompletedUnits) >= 0
      ) {
        return Number(__pqCompletedUnits);
      }

      const key = 'pq_completed_units_count_v1';
      const stored = Number(localStorage.getItem(key) || '0');

      return Number.isFinite(stored) && stored >= 0 ? stored : 0;
    } catch (_e) {
      return 0;
    }
  }

  function __pqEnsureRewardBar() {
    if (
      __pqRewardBar ||
      !window.PQSharedRewardBar ||
      typeof window.PQSharedRewardBar.create !== 'function'
    ) {
      return __pqRewardBar;
    }

    __pqRewardBar = window.PQSharedRewardBar.create({
      hostId: 'pqLectureCta',
      getCompletedSteps: () => __pqCountCompletedSteps(),
      getTotalStars: () => __pqGetTotalStarsEarned(),
      getCompletedUnits: () => __pqGetCompletedUnitsCount(),
      getFocusState: () => __pqGetFocusBadgeState()
    });

    return __pqRewardBar;
  }

  function __pqRenderRewardStars(forceCelebrate) {
    const api = __pqEnsureRewardBar();
    return api ? api.render(forceCelebrate) : undefined;
  }

  // ============================================================
  // SECTION 7: Unified step messaging (V2)
  // ------------------------------------------------------------
  // Single message pipeline:
  // - step entry messages
  // - pass-level messages
  // - final unit completion message
  // - optional stars/effects
  //
  // Legacy completion systems are no longer used here.
  // ============================================================

  let __pqStepMessaging = null;

  // ===== CHILD POPUP + CLAP =====
  let __pqMessagePopupEnhancerInstalled = false;
  let __pqMessagePopupObserver = null;
  let __pqLastClapMessageKey = '';

  function __pqInstallChildFriendlyMessagePopupEnhancer() {
    if (__pqMessagePopupEnhancerInstalled) return;
    __pqMessagePopupEnhancerInstalled = true;

    const tag = () => {
      document.querySelectorAll('[role="dialog"], .pq-message-box, .panel').forEach(card => {
        const text = (card.textContent || '').trim();
        if (!/Message/i.test(text) || !/Continue/i.test(text)) return;

        card.classList.add('pq-child-message-card');

        card.querySelectorAll('button').forEach(btn => {
          if (/Continue/i.test(btn.textContent)) {
            btn.classList.add('pq-child-message-continue');
          }
        });
      });
    };

    tag();

    try {
      if (__pqMessagePopupObserver) {
        __pqMessagePopupObserver.disconnect();
      }
    } catch (_e) {}

    try {
      __pqMessagePopupObserver = new MutationObserver(tag);
      __pqMessagePopupObserver.observe(document.body, { childList: true, subtree: true });

      window.addEventListener('beforeunload', function () {
        try {
          if (__pqMessagePopupObserver) {
            __pqMessagePopupObserver.disconnect();
            __pqMessagePopupObserver = null;
          }
        } catch (_e) {}
      }, { once: true });
    } catch (_e) {}
  }

  function __pqForceClapNow() {
    try {
      const old = document.getElementById('pqChildClapEffect');
      if (old && old.parentNode) old.parentNode.removeChild(old);

      const el = document.createElement('div');
      el.id = 'pqChildClapEffect';
      el.className = 'pq-child-clap-effect';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<span>👏</span><span>👏</span><span>👏</span>';

      /* fallback inline style in case CSS is not loaded yet */
      el.style.position = 'fixed';
      el.style.top = '22%';
      el.style.left = '50%';
      el.style.transform = 'translateX(-50%)';
      el.style.fontSize = '54px';
      el.style.zIndex = '999999';
      el.style.pointerEvents = 'none';

      document.body.appendChild(el);

      setTimeout(function () {
        try {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        } catch (_e) {}
      }, 1400);
    } catch (_e) {}
  }

  function __pqMaybePlayMessageClap() {
    try {
      const cfg = window.UNIT_CFG || UNIT_CFG;
      const cur = getCurrentStep && getCurrentStep();
      const stepId = cur && cur.step && cur.step.id ? String(cur.step.id) : '';

      if (!stepId || !cfg || !cfg.messages || !cfg.messages.entry) return;

      const msg = cfg.messages.entry[stepId];

      /* CONFIG-DRIVEN ONLY: any message with clap:true triggers clap */
      if (!msg || msg.clap !== true) return;

      const progress =
        (cur && cur.progress) ||
        (managedProgress && managedProgress[stepId]) ||
        {};

      const key = [
        stepId,
        Number(progress.passesDone || 0),
        String(msg.text || '').slice(0, 80)
      ].join('|');

      if (key === __pqLastClapMessageKey) return;
      __pqLastClapMessageKey = key;

      __pqForceClapNow();
    } catch (_e) {}
  }

  function __pqEnsureStepMessaging() {
    __pqInstallChildFriendlyMessagePopupEnhancer();
    if (
      __pqStepMessaging ||
      !window.PQSharedStepMessagingV2 ||
      typeof window.PQSharedStepMessagingV2.create !== 'function'
    ) {
      return __pqStepMessaging;
    }

    __pqStepMessaging = window.PQSharedStepMessagingV2.create({
      unitCfg: window.UNIT_CFG || UNIT_CFG,
      titleText: String(__cfg('messageUi.titleText', '😊 Message')),
      continueText: String(__pqLocalizedCfg('messageUi.continueText', 'Continue', 'content')),
      getProgress: () => managedProgress,
      getSteps: () => STEPS
    });

    return __pqStepMessaging;
  }

  function __pqApplyPassEntryMessageOverride() {
    try {
      const cfg = window.UNIT_CFG || UNIT_CFG;
      if (!cfg || !cfg.messages) return;

      cfg.messages.entry = cfg.messages.entry || {};

      if (!cfg.messages.__pqOriginalEntry) {
        cfg.messages.__pqOriginalEntry = Object.assign({}, cfg.messages.entry || {});
      }

      const cur = getCurrentStep && getCurrentStep();
      const stepId = cur && cur.step && cur.step.id
        ? String(cur.step.id)
        : '';

      if (!stepId) return;

      const originalEntry = cfg.messages.__pqOriginalEntry || {};
      if (originalEntry[stepId]) {
        cfg.messages.entry[stepId] = originalEntry[stepId];
      }

      const progress =
        (cur && cur.progress) ||
        (managedProgress && managedProgress[stepId]) ||
        null;

      const passesDone = Math.max(0, Number((progress && progress.passesDone) || 0));
      if (!passesDone) return;

      const passMessages =
        cfg.messages.entryPasses &&
        Array.isArray(cfg.messages.entryPasses[stepId])
          ? cfg.messages.entryPasses[stepId]
          : null;

      if (!passMessages) return;

      // passesDone 1 means entering pass 2, so use entryPasses[0].
      const passMessage = passMessages[passesDone - 1];
      if (!passMessage) return;

      cfg.messages.entry[stepId] = passMessage;
    } catch (_e) {}
  }

  function __pqAfterProgressChange(forceStepMessage) {
    try {
      __pqApplyPassEntryMessageOverride();
    } catch (_e) {}

    const api = __pqEnsureStepMessaging();
    if (!api || typeof api.afterProgressChange !== 'function') {
      return undefined;
    }

    const result = api.afterProgressChange(!!forceStepMessage);
   __pqMaybePlayMessageClap();
   return result;
  }

  // ============================================================
  // SECTION 8: Early bootstrap + cache guard
  // ------------------------------------------------------------
  // Clear local per-unit cache when managed hints exist so the UI
  // does not show ghost-completed progress before DB hydration.
  // ============================================================
  (function pqBootstrapClear() {
    try {
      const q = new URLSearchParams(window.location.search || '');
      const uidHint =
        q.get('userid') ||
        q.get('uid') ||
        q.get('studentid') ||
        q.get('user') ||
        sessionStorage.getItem('pq_uid') ||
        '';

      const tokenHint =
        q.get('wstoken') ||
        q.get('ws') ||
        sessionStorage.getItem('pq_ws_token') ||
        '';

      const managedHint = !!(uidHint && tokenHint);

      if (managedHint) {
        try {
          if (
            window.PQProgressCacheGuard &&
            typeof window.PQProgressCacheGuard.clearOnManagedHint === 'function'
          ) {
            window.PQProgressCacheGuard.clearOnManagedHint({
              unitid: __PQ_UNIT_ID,
              uidHint: uidHint,
              managedHint: managedHint,
              keys: [
                __PQ_MANAGED_PROGRESS_CACHE_KEY,
                __pqStorageKey('managedProgressCache', `${__PQ_UNIT_ID}_managed_progress_cache`),
                'pq_managed_progress_cache_v1',
                'pq_last_uid_v1',
                'pq_last_uid'
              ]
            });
          }
        } catch (_e) {}

        const keys = [
          __PQ_MANAGED_PROGRESS_CACHE_KEY,
          __pqStorageKey('managedProgressCache', `${__PQ_UNIT_ID}_managed_progress_cache`),
          'pq_managed_progress_cache_v1',
          'pq_last_uid_v1',
          'pq_last_uid'
        ];

        for (const key of keys) {
          try {
            localStorage.removeItem(key);
          } catch (_e) {}
        }

        if (uidHint) {
          try {
            localStorage.setItem('pq_boot_uid_hint', String(uidHint));
          } catch (_e) {}
        }
      }

      // Exposed for console verification
      window.__PQ_BOOTSTRAP_CLEARED__ = managedHint ? Date.now() : 0;
    } catch (_e) {
      // ignore
    }
  })();

  // ============================================================
  // SECTION 9: Core references
  // ============================================================
  const __PQ = window.PQ || {};
  const PQManagedCore = window.PQManagedCore || __PQ.ManagedCore || null;

  // ============================================================
  // SECTION 10: Runtime access helpers
  // ============================================================
  
  const audio = new Audio();
  
  function pqResolveCore() {
    return (
      window.PQIframe &&
      typeof window.PQIframe.resolveCore === 'function'
    )
      ? window.PQIframe.resolveCore()
      : (window.PQManagedCore || (window.PQ && window.PQ.ManagedCore) || null);
  }

  function pqGetUid() {
    return (
      window.PQIframe &&
      typeof window.PQIframe.getUid === 'function'
    )
      ? window.PQIframe.getUid()
      : (window.__prequran_uid || window.prequran_uid || null);
  }

  let __pqWarnedAboutGlobalWsToken = false;

  function pqGetToken() {
    try {
      if (
        window.PQIframe &&
        typeof window.PQIframe.getToken === 'function'
      ) {
        return window.PQIframe.getToken();
      }

      const allowGlobalToken = !!__cfg('security.allowBrowserGlobalWsToken', false);
      if (allowGlobalToken) {
        return window.__prequran_ws_token || window.prequran_ws_token || null;
      }

      if (
        !__pqWarnedAboutGlobalWsToken &&
        (window.__prequran_ws_token || window.prequran_ws_token)
      ) {
        __pqWarnedAboutGlobalWsToken = true;
        try {
          console.warn(
            '[PQ Security] Browser-global Moodle web-service token ignored. Use PQIframe.getToken() or a server-side proxy.'
          );
        } catch (_e) {}
      }
    } catch (_e) {}

    return null;
  }

  // ============================================================
  // SECTION 11: Focus adapter helpers
  // ============================================================
  let __pqFocusAdapter = null;
  let __FG_LESSON_ID = null;
  let __FG_UNIT_ID = null;
  let __FG_SESSION_ID = null;
  let __FG_ENABLED = false;

  function __pqEnsureFocusAdapter() {
    if (
      __pqFocusAdapter ||
      !window.PQFocusGuardAdapter ||
      typeof window.PQFocusGuardAdapter.create !== 'function'
    ) {
      return __pqFocusAdapter;
    }

    try {
      __pqFocusAdapter = window.PQFocusGuardAdapter.create({

		lessonId: String(__cfg('lessonid', __pqIdentity('lessonId', 'tajweed'))),
        unitId: __PQ_UNIT_ID,

		audioEl: audio,
        lectureVideoEl: document.getElementById('lectureVideo'),
        isPlayingAll: () => playingAll,
        setPaused: (value) => setPaused(value),
        getManagedProgress: () => managedProgress,
        getSteps: () => STEPS,
        getUid: () => pqGetUid(),
        getToken: () => pqGetToken()
      });
    } catch (_e) {
      // ignore adapter creation failure
    }

    return __pqFocusAdapter;
  }

  function pqFocusLessonId() {
  const api = __pqEnsureFocusAdapter();
  return api
    ? api.focusLessonId()
    : __pqIdentity('lessonId', 'tajweed');
}

  function pqFocusUnitId() {
  const api = __pqEnsureFocusAdapter();
  return api
    ? api.focusUnitId()
    : __pqIdentity('unitId', '');
}

  function pqFocusGetSessionId(uid, lessonid, unitid) {
    const api = __pqEnsureFocusAdapter();
    return api
      ? api.focusGetSessionId(uid, lessonid, unitid)
      : (Date.now() + '-nosave');
  }

  // ============================================================
  // SECTION 12: Local settings/storage keys
  // ============================================================
  const DEFAULTS = (function () {
    const cfgDefaults = __cfg('defaults', null) || {};

    return {
      voice: String(cfgDefaults.voice || 'child_boy'),
      speed: String(cfgDefaults.speed || '1.0'),
      repeat: String(cfgDefaults.repeat || '1'),
      filter: String(cfgDefaults.filter || 'all')
    };
  })();

  const __PQ_STORAGE_PREFIX = String(
  __cfg(
    'storagePrefix',
    __pqIdentity('storagePrefix', __PQ_UNIT_ID)
  )
);

const LS_SETTINGS_KEY =
  `${__PQ_STORAGE_PREFIX}_settings_v1`;

const LS_PROGRESS_CACHE_KEY =
  `${__PQ_STORAGE_PREFIX}_managed_progress_cache_v1`;

const LS_LETTER_PLAYS_KEY =
  `${__PQ_STORAGE_PREFIX}_tile_plays_v1`;

  // ============================================================
  // SECTION 13: Voice/audio base paths
  // ============================================================
  const VOICE_BASES = (function () {
  try {
    const shared =
      (typeof window !== 'undefined' && window.__VOICE_BASES_SHARED) || null;

    if (shared && typeof shared === 'object') return shared;

    const cfgBases = __cfg('media.voiceBases', null);
    if (cfgBases && typeof cfgBases === 'object') return cfgBases;
  } catch (_e) {}

  return {
    child_boy: '',
    child_girl: '',
    adult_male: '',
    adult_female: ''
  };
})();

  // ============================================================
  // SECTION 14: Lesson data mapping
  // ------------------------------------------------------------
  // Cells, audio map, play sequence, and watch video map are taken
  // from UNIT_CFG so the main JS stays generic.
  // ============================================================
  const __PQ_ALL_CELL_META = new Map(
    (__cfg('allCells', []) || []).map((cell) => [
      cell && cell.key,
      cell || {}
    ])
  );

  const CELLS = (__cfg('canvas.cells', []) || []).map((cell, idx) => {
    const key = cell.key || `${__pqIdentity('keyPrefix', 'unit_')}${idx + 1}`;
    const meta = __PQ_ALL_CELL_META.get(key) || {};

    return {
      text: cell.text,
      en: cell.en || meta.en || '',
      ar: cell.ar || meta.ar || cell.text || '',
      small: cell.small || meta.small || '',
      span: Number(cell.span || meta.span || 1),
      key,
      pass: cell.pass !== undefined ? cell.pass : meta.pass,
      filterType: cell.filterType || meta.filterType || ''
    };
  });

  const AUDIO_MAP = (__cfg('audioMap', {}) || {});

  const AUDIO_BASE = String(
  __cfg(
    'media.l6Base',
    __cfg(
      'media.audioBase',
      __cfg(
        'media.fallbackAudioBase',
        ''
      )
    )
  )
);

  const LETTER_SOUND_MAP = (__cfg('letterSoundMap', {}) || {});

  const LETTER_SOUND_BASE = String(
  __cfg(
    'media.letterSoundBase',
    __cfg(
      'media.soundLetterAudioBase',
      ''
    )
  )
);

  const __LOCAL_LETTERS_FALLBACK = (function () {
    const limit = __pqGetWordLimit();
    const cells = (CELLS || []).slice(0, limit > 0 ? limit : undefined);

    return cells.map((cell, index) => {
      const key = cell.key || `${__pqIdentity('keyPrefix', 'unit_')}${index + 1}`;

      const fileName = (typeof AUDIO_MAP[key] === 'string')
        ? AUDIO_MAP[key]
        : '';

      const url = fileName ? __pqAppendAssetVersion(AUDIO_BASE + fileName) : '';
      const text = String(cell.text || '');
      const small = __separateWord(text.replace(/\s+/g, ' ').trim());

      return {
        key,
        ar: cell.ar || text,
        name: '',
        small: cell.small || small,
        en: cell.en || '',
        video: url,
        audioIndex: null,
        __span: cell.span || 1,
        __pass: cell.pass,
        __filterType: cell.filterType || ''
      };
    });
  })();

  const LETTERS = (
    typeof window !== 'undefined' &&
    Array.isArray(window.__LETTERS_SHARED) &&
    window.__LETTERS_SHARED.length
  ) ? window.__LETTERS_SHARED : __LOCAL_LETTERS_FALLBACK;

  const LETTER_KEYS = LETTERS.map((letter) => letter.key);

  // Flow visual order:
  // 1) configured canvas.playSequence
  // 2) LETTERS array order
  const PLAY_SEQUENCE_KEYS = (function () {
    const configured = (__cfg('canvas.playSequence', []) || []).slice();
    const limit = __pqGetWordLimit();

    if (configured.length) {
      return limit > 0 ? configured.slice(0, limit) : configured;
    }

    const derived = (LETTERS || []).map((item) => item.key);
    return limit > 0 ? derived.slice(0, limit) : derived;
  })();
  
  const SOUND_IMAGE_BASE = String(__cfg('media.soundImageBase', '') || '');

function __pqSoundFileStemFromKey(key) {
  try {
    const m = String(key || '').match(/^(.*?)(\d+)$/);
    if (!m) return String(key || '');
    return m[1] + String(Number(m[2]) || 0).padStart(2, '0');
  } catch (_e) {
    return String(key || '');
  }
}

const SOUND_IMAGE_BY_KEY = Object.fromEntries(
  (PLAY_SEQUENCE_KEYS || []).map((key) => [
    key,
    __pqAppendAssetVersion(
      SOUND_IMAGE_BASE.replace(/\/?$/, '/') +
      __pqSoundFileStemFromKey(key) +
      '_articulation.png'
    )
  ])
);

  const WATCH_VIDEO_BASE = String(
  __cfg(
    'media.watchBase',
    __cfg(
      'media.fallbackWatchBase',
      ''
    )
  )
);  const ANIMATE_VIDEO_BASE = String(
    __cfg('media.animateBase', WATCH_VIDEO_BASE)
  );

  const ANIMATE_VIDEO_BY_KEY = (
    __cfg('animateVideoByKey', {}) &&
    Object.keys(__cfg('animateVideoByKey', {})).length
  )
    ? Object.fromEntries(
        Object.entries(__cfg('animateVideoByKey', {})).map(([key, value]) => {
          const resolved = /^https?:/i.test(String(value || ''))
            ? String(value)
            : (ANIMATE_VIDEO_BASE + String(value || ''));
          return [key, resolved];
        })
      )
    : Object.fromEntries(
        (PLAY_SEQUENCE_KEYS || []).map((key) => [
          key,
          __pqAppendAssetVersion(ANIMATE_VIDEO_BASE + key + '.mp4')
        ])
      );



  const WATCH_VIDEO_BY_KEY = (
    __cfg('watchVideoByKey', {}) &&
    Object.keys(__cfg('watchVideoByKey', {})).length
  )
    ? Object.fromEntries(
        Object.entries(__cfg('watchVideoByKey', {})).map(([key, value]) => {
          const resolved = /^https?:/i.test(String(value || ''))
            ? String(value)
            : (WATCH_VIDEO_BASE + String(value || ''));
          return [key, resolved];
        })
      )
    : Object.fromEntries(
        (PLAY_SEQUENCE_KEYS || []).map((key, index) => [
          key,
          __pqAppendAssetVersion(WATCH_VIDEO_BASE + `col${index + 1}.mp4`)
        ])
      );

  // Playlist engine uses `video` field from letters.
  // Watch uses WATCH_VIDEO_BY_KEY separately.
  const VIDEO_BY_KEY = Object.fromEntries(
    (LETTERS || [])
      .map((letter) => [letter.key, letter.video])
      .filter(([, value]) => !!value)
  );

  // ============================================================
