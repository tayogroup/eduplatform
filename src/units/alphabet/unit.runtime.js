/* ============================================================
   tanween_movement_listen — Browser Main JS
   FLOW LAYOUT BASELINE v6 SPAN
   ------------------------------------------------------------
   Main-board span support added for flow layout.
   - browser: honor configured span
   - mobile: honor span, capped to mobileGridCols
   - keeps managed/review/speak/write behavior unchanged
   ============================================================ */

// ============================================================
// tanween_movement_listen — Flow Main JS
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
    const message = 'Pre-Quraan unit config missing: unit.config.js must load before unit.runtime.js.';

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

  function __uiText(path, fallback) {
    return String(__cfg(`uiText.${path}`, fallback));
  }

  function __pqIdentity(path, fallback) {
    return String(__cfg(`identity.${path}`, fallback));
  }

  function __pqStorageKey(path, fallback) {
    return String(__cfg(`storageKeys.${path}`, fallback));
  }

  function __stepperText(path, fallback) {
    return String(__cfg(`stepperUi.${path}`, fallback));
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

  const __PQ_WRITE_RELOAD_KEY = `${__PQ_UNIT_ID}_write_terminal_reload_once_v1`;
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
    greatText: String(__cfg('focusBadge.great.text', 'Great Focus')),
    goodCls: String(__cfg('focusBadge.good.cls', 'focus-good')),
    goodText: String(__cfg('focusBadge.good.text', 'Good Focus')),
    keepCls: String(__cfg('focusBadge.keep.cls', 'focus-keep')),
    keepText: String(__cfg('focusBadge.keep.text', 'Try to Focus'))
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
      continueText: String(__cfg('messageUi.continueText', 'Continue')),
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
        '';

      const managedHint =
        (q.get('managed_student') === 'true') ||
        (q.get('managed') === '1') ||
        q.has('wstoken') ||
        q.has('userid');

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
  // SECTION 15: Category sets + step list
  // ============================================================
  const VOWELS = new Set(
    (__cfg('filterSets.vowels', ['alif', 'waw', 'ya']) || []).map(String)
  );

  const HEAVY = new Set(
    (__cfg('filterSets.heavy', ['kha', 'sad', 'dad', 'ta2', 'za2', 'ghain', 'qaf']) || []).map(String)
  );

  const ALIF_AA = new Set(
    (__cfg(
      'filterSets.alifaa',
      ['ba', 'ta', 'tha', 'ha2', 'kha', 'ra', 'zay', 'ta2', 'za2', 'fa', 'waw', 'ha', 'ya']
    ) || []).map(String)
  );

  function __deriveFilterFromStepId(stepId) {
    const id = String(stepId || '').toLowerCase();

    if (id === 'heavy') return 'heavy';
    if (id === 'light') return 'light';
    if (id === 'vowels') return 'vowel';
    if (id === 'alifaa') return 'alifaa';

    return 'all';
  }

  function __pqIsWatchStep(step) {
    const id = String((step && step.id) || '').toLowerCase();
    const type = String((step && step.type) || '').toLowerCase();
    return id === 'watch' || id === 'sound' || id === 'animate' || type === 'video_playlist';
  }

function __pqWatchStepDef() {
    const cfgStep = __cfg('stepInjection.watch', null);

    if (cfgStep && typeof cfgStep === 'object') {
    return {
        id: String(cfgStep.id || 'watch'),
        type: String(cfgStep.type || 'video_playlist'),
        label: String(cfgStep.label || 'Watch'),
        filter: String(cfgStep.filter || 'all')
      };
        }

    return {
      id: 'watch',
      type: 'video_playlist',
      label: 'Watch',
      filter: 'all'
    };
  }

  function __pqInjectWatchStep(steps) {
    const arr = Array.isArray(steps) ? steps.slice() : [];
    const hasWatch = arr.some(
      (step) => String((step && step.id) || '').toLowerCase() === 'watch'
    );

    const mapped = arr.map((step) => ({ ...step }));

    if (!hasWatch) {
      const listenIdx = mapped.findIndex(
        (step) => String((step && step.id) || '').toLowerCase() === 'listen'
      );

      const watchStep = __pqWatchStepDef();

      if (listenIdx >= 0) {
        mapped.splice(listenIdx + 1, 0, watchStep);
      } else {
        mapped.push(watchStep);
      }
    }

	// ============================================================
// Inject Speak step AFTER Repeat (if missing)
// ============================================================
const hasSpeak = mapped.some(
  (step) => String((step && step.id) || '').toLowerCase() === 'speak'
);

if (!hasSpeak) {
  const repeatIdx = mapped.findIndex(
    (step) => String((step && step.id) || '').toLowerCase() === 'repeat'
  );

  const speakCfg = __cfg('stepInjection.speak', null);

  const speakStep = (
    speakCfg && typeof speakCfg === 'object'
  ) ? {
    id: String(speakCfg.id || 'speak'),
    type: String(speakCfg.type || 'speak'),
    label: String(speakCfg.label || 'Speak'),
    filter: String(speakCfg.filter || 'all')
  } : {
    id: 'speak',
    type: 'speak',
    label: 'Speak',
    filter: 'all'
  };

  if (repeatIdx >= 0) {
    mapped.splice(repeatIdx + 1, 0, speakStep);
  } else {
    mapped.push(speakStep);
  }
}

    return mapped.map((step, index) => ({
      ...step,
      label: __pqWriteLabel(step.label || step.title || step.id),
      filter: step.filter || __deriveFilterFromStepId(step.id),
      step_index: index + 1
    }));
  }

  const __PQ_STEP_ORDER = (function () {
    const cfgOrder = __cfg('stepOrder', null);

    if (cfgOrder && typeof cfgOrder === 'object') {
      return { ...cfgOrder };
    }

return {
  lecture: 0,
  listen: 1,
  listenplus: 2,
  watch: 3,
  sound: 4,
  repeat: 5,
  speak: 6,
  match: 7,
  animate: 8,
  write: 9,
  trace1: 10,
  words: 11,

  all_letters: 12,
  heavy: 13,
  light: 14,
  alifaa: 15,
  vowels: 16
};

  })();

  function orderStepsForDisplay(steps) {
    const arr = (steps || []).slice();

    arr.sort((a, b) => {
      const stepIndexA = (
        a && a.step_index != null && a.step_index !== ''
      ) ? Number(a.step_index) : NaN;

      const stepIndexB = (
        b && b.step_index != null && b.step_index !== ''
      ) ? Number(b.step_index) : NaN;

      const hasA = Number.isFinite(stepIndexA);
      const hasB = Number.isFinite(stepIndexB);

      if (hasA && hasB && stepIndexA !== stepIndexB) {
        return stepIndexA - stepIndexB;
      }
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;

      const orderA = (__PQ_STEP_ORDER[a.id] != null)
        ? __PQ_STEP_ORDER[a.id]
        : 999;

      const orderB = (__PQ_STEP_ORDER[b.id] != null)
        ? __PQ_STEP_ORDER[b.id]
        : 999;

      if (orderA !== orderB) return orderA - orderB;

      const titleA = String((a && (a.label || a.title || a.id)) || '');
      const titleB = String((b && (b.label || b.title || b.id)) || '');

      return titleA.localeCompare(titleB);
    });

    return arr;
  }

  let STEPS = __pqInjectWatchStep(
    (LESSON_DEF && Array.isArray(LESSON_DEF.defaultSteps))
      ? LESSON_DEF.defaultSteps.slice()
      : []
  );

  let managedProgress = null;

  // ============================================================
  // SECTION 16: Managed/review/free-practice mode helpers
  // ============================================================
  function __pqIsManagedUser() {
    try {
      const q = new URLSearchParams(window.location.search || '');
      const managedValue = (
        q.get('managed_student') ||
        q.get('managed') ||
        q.get('pq_managed') ||
        ''
      ).toLowerCase();

      if (
        managedValue === '1' ||
        managedValue === 'true' ||
        managedValue === 'yes' ||
        managedValue === 'on'
      ) {
        return true;
      }

      if (
        managedValue === '0' ||
        managedValue === 'false' ||
        managedValue === 'no' ||
        managedValue === 'off'
      ) {
        return false;
      }
    } catch (_e) {}

    try {
      return !!(pqGetUid() && pqGetToken());
    } catch (_e) {
      return false;
    }
  }

  function __pqIsReviewMode() {
    try {
      if (
        window.__PQ_REVIEW_MODE__ === true ||
        window.__PQ_UNMANAGED_AFTER_COMPLETE__ === true
      ) {
        return true;
      }

      const core = pqResolveCore() || PQManagedCore;
      if (core && typeof core.isReviewMode === 'function') {
        return !!core.isReviewMode();
      }
    } catch (_e) {}

    return false;
  }

  function __pqPracticeFreeUI() {
    try {
      const finished = !!(managedProgress && managedProgress.__finished);
      return (!__pqIsManagedUser()) || finished || __pqIsReviewMode();
    } catch (_e) {
      return true;
    }
  }

  function __pqShouldHideStepper() {
    try {
      if (!__pqIsManagedUser()) return true;
      if (__pqIsReviewMode()) return false;
      return !!__pqPracticeFreeUI();
    } catch (_e) {
      return true;
    }
  }

function __pqApplyModeUI() {
  try {
    const isManaged = __pqIsManagedUser();
    const freeUI = __pqPracticeFreeUI();
    const reviewMode = __pqIsReviewMode();

    window.__PQ_IS_MANAGED_USER__ = isManaged;
    window.__PQ_PRACTICE_FREE__ = freeUI;
    window.__PQ_UNIT_REVIEW_MODE__ = reviewMode;

    try {
      const root = document.getElementById('managedStepper');
      if (root) {
        root.hidden = __pqShouldHideStepper();
      }
    } catch (_e) {}

    if (freeUI || reviewMode) {
      try {
        const playBtn = document.getElementById('btnPlayAll');
        if (playBtn) playBtn.disabled = false;
      } catch (_e) {}

      try {
        const pauseBtn = document.getElementById('btnPause');
        if (pauseBtn) pauseBtn.disabled = false;
      } catch (_e) {}
    }

    try {
      __pqRenderMobileStepPicker();
    } catch (_e) {}
  } catch (_e) {}
}
    function __pqOpenStepForReview(stepId) {
    try {
      const sid = String(stepId || '').trim();
      if (!sid || !managedProgress) return false;

      __pqStickyReviewStepId = sid;

      const stepsArr = (STEPS || []);
      if (!stepsArr.some((step) => step && step.id === sid)) {
        return false;
      }

      managedProgress.currentStepId = sid;

      managedProgress.__allCompleted = stepsArr.every((step) => !!(
        managedProgress[step.id] &&
        managedProgress[step.id].completed
      ));

      managedProgress.__finished = false;

      try {
        const core = pqResolveCore() || PQManagedCore;
        if (core) {
          core._reviewMode = true;

          try {
            window.__PQ_REVIEW_MODE__ = true;
          } catch (_e) {}

          try {
            window.__PQ_UNMANAGED_AFTER_COMPLETE__ = true;
          } catch (_e) {}
        }
      } catch (_e) {}

function __pqRunPostModeUiRefresh() {
  try { renderStepper(); } catch (_e) {}
  try { renderGrid(); } catch (_e) {}
  try { markActive(); } catch (_e) {}
  try { __pqApplyModeUI(); } catch (_e) {}
  try { updateControlsForCurrentStep(); } catch (_e) {}
  try { __pqSyncWriteUI(); } catch (_e) {}
  try { __pqForceWriteButtonRefresh(); } catch (_e) {}
  try { __pqEnsureSpeakBoot(); } catch (_e) {}
  try { __pqForceSpeakUiRefresh(); } catch (_e) {}
  try { __pqRenderMobileStepPicker(); } catch (_e) {}
}

      try { __pqRunPostModeUiRefresh(); } catch (_e) {}

      return true;

    } catch (_e) {
      return false;
    }
  }

  document.addEventListener('pq:open-step-review', function (ev) {
    try {
      const sid = ev && ev.detail && ev.detail.stepId;
      if (sid) __pqOpenStepForReview(sid);
    } catch (_e) {}
  });

  document.addEventListener('pq:review-mode-enabled', function () {
    try { renderStepper(); } catch (_e) {}
    try { __pqApplyModeUI(); } catch (_e) {}
  });

  // ============================================================
  // SECTION 17: Per-step letter play tracking
  // ============================================================
  let letterPlays = (function loadLetterPlays() {
    try {
      const raw = localStorage.getItem(LS_LETTER_PLAYS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_e) {
      return {};
    }
  })();

    let __letterPlaysSaveTimer = null;

  function flushLetterPlays() {
    try {
      localStorage.setItem(LS_LETTER_PLAYS_KEY, JSON.stringify(letterPlays));
    } catch (_e) {}
  }

  function saveLetterPlays() {
    try {
      if (__letterPlaysSaveTimer) {
        clearTimeout(__letterPlaysSaveTimer);
      }
    } catch (_e) {}

    __letterPlaysSaveTimer = setTimeout(() => {
      __letterPlaysSaveTimer = null;
      flushLetterPlays();
    }, 1000);
  }

  window.addEventListener('beforeunload', flushLetterPlays);

  document.addEventListener('visibilitychange', () => {
    try {
      if (document.hidden) {
        flushLetterPlays();
      }
    } catch (_e) {}
  });

  function getCurrentStepLetterMap() {
    if (!managedProgress) return null;

    const { step } = getCurrentStep();
    if (!step || step.type !== 'playlist') return null;

    const id = step.id;
    if (!letterPlays[id] || typeof letterPlays[id] !== 'object') {
      letterPlays[id] = {};
    }

    return letterPlays[id];
  }

  function handleLetterPlayedForCurrentStep(letterKey) {
    // PATCH_CLEAR_PLAYING_TILE_HANDLE_PLAYED
    try { window.setTimeout(__pqClearPlayingTile, 180); } catch (_e) {}
    const map = getCurrentStepLetterMap();
    if (!map) return;

    map[letterKey] = true;
    saveLetterPlays();

const tile = grid ? grid.querySelector(`.tile[data-key="${letterKey}"]`) : null;
if (tile) {
  tile.classList.add('played');
}

    try {
  if (typeof updateLetterStatsForCurrentStep === 'function') {
    updateLetterStatsForCurrentStep();
  }
} catch (_e) {}
  }

  function refreshPlayedClasses() {
    if (!grid) return;

    const tiles = grid.querySelectorAll('.tile');
    const map = getCurrentStepLetterMap();

    if (!map) {
      tiles.forEach((tile) => tile.classList.remove('played'));
      return;
    }

tiles.forEach((tile) => {
  const key = String(tile.dataset.key || '');
  if (!key) return;

  tile.classList.toggle('played', !!map[key]);
});
  }

  function pqSetSourceIndicator(_txt) {
    try {
      const el = document.getElementById('pqDataSource');
      if (el) {
        el.style.display = 'none';
        el.textContent = '';
      }
    } catch (_e) {}
  }

  // ============================================================
  // SECTION 18: Completion effects helper
  // ============================================================

  // ============================================================
  // PART 1 END
  // ============================================================

  // ============================================================
// tanween_movement_listen — Flow Main JS
// Part 2 of 3
// This part covers:
// 19) Moodle WS helpers
// 20) DOM references
// 21) Lecture/settings helpers
// 22) Grid/media state
// 23) Write-step shared adapter
// 24) Focus helpers + grid rendering + playlist/watch playback
// ============================================================

  // ============================================================
  // SECTION 19: Moodle managed-progress WS helpers
  // ============================================================
  async function __pqFetchTotalStarsFromMoodle() {
    const core = pqResolveCore() || PQManagedCore;
    if (!core || typeof core.wsGet !== 'function') return null;

    const uid = pqGetUid();
    const wstoken = pqGetToken();
    if (!uid || !wstoken) return null;

    try {
      const data = await core.wsGet({
        wsfunction: __PQ_WS_GET,
        userid: uid,
        wstoken: wstoken
      });

      const total = Number(data && data.totalstars);
      const units = Number(data && data.completedunits);

      if (Number.isFinite(total) && total >= 0) {
        __pqTotalStars = total;
        try {
          localStorage.setItem('pq_total_stars_earned_v1', String(total));
        } catch (_e) {}
      }

      if (Number.isFinite(units) && units >= 0) {
        __pqCompletedUnits = units;
        try {
          localStorage.setItem('pq_completed_units_count_v1', String(units));
        } catch (_e) {}
      }

      if (
        (Number.isFinite(total) && total >= 0) ||
        (Number.isFinite(units) && units >= 0)
      ) {
        return total;
      }
    } catch (_e) {}

    return null;
  }

  async function fetchManagedFromMoodle() {
    const core = pqResolveCore() || PQManagedCore;

    if (
      !core ||
      typeof core.wsGet !== 'function' ||
      typeof core.normalizeManagedPayload !== 'function'
    ) {
      return null;
    }

    const uid = pqGetUid();
    const wstoken = pqGetToken();
    if (!uid || !wstoken) return null;

    // Clear cross-user cache contamination
    if (typeof core.clearCachesOnUserChange === 'function') {
      core.clearCachesOnUserChange(uid, 'al_last_uid_v1', [
        LS_SETTINGS_KEY,
        LS_PROGRESS_CACHE_KEY,
        LS_LETTER_PLAYS_KEY
      ]);
    }

    const data = await core.wsGet({
      wsfunction: __PQ_WS_GET,
      userid: uid,
      wstoken: wstoken
    });

    try {
      const total = Number(data && data.totalstars);
      const units = Number(data && data.completedunits);

      if (Number.isFinite(total) && total >= 0) {
        __pqTotalStars = total;
        try {
          localStorage.setItem('pq_total_stars_earned_v1', String(total));
        } catch (_e) {}
      }

      if (Number.isFinite(units) && units >= 0) {
        __pqCompletedUnits = units;
        try {
          localStorage.setItem('pq_completed_units_count_v1', String(units));
        } catch (_e) {}
      }
    } catch (_e) {}

    let normalized;

    if (typeof core.normalizeManagedPayloadFlexible === 'function') {
      normalized = core.normalizeManagedPayloadFlexible(data);

      // Only replace local step list if Moodle returned real steps.
      if (normalized && Array.isArray(normalized.steps) && normalized.steps.length) {
        STEPS = __pqInjectWatchStep(
          (normalized.steps || []).map((step) => ({
            id: step.id,
            type: step.type || (step.id === 'lecture' ? 'lecture' : 'playlist'),
            label: __pqWriteLabel(step.title || step.label || step.id),
            filter:
              (step.type === 'lecture')
                ? 'all'
                : (step.filter || __deriveFilterFromStepId(step.id)),
            step_index: step.step_index
          }))
        );
      } else {
        // Fallback so passes/repeats still hydrate correctly.
        normalized = core.normalizeManagedPayload(data, STEPS);
      }
    } else {
      normalized = core.normalizeManagedPayload(data, STEPS);
    }

    return normalized.raw;
  }

  async function sendManagedToMoodle(progressObj) {
    if (!PQManagedCore || typeof PQManagedCore.wsSet !== 'function') return;

    const uid = pqGetUid();
    const wstoken = pqGetToken();
    if (!uid || !wstoken) return;

    await PQManagedCore.wsSet({
      wsfunction: __PQ_WS_SET,
      userid: uid,
      wstoken: wstoken,
      progressObj: progressObj || {}
    });
  }


  function __pqFindRawStepProgress(raw, stepId) {
    try {
      const sid = String(stepId || '');
      if (!raw || !sid) return null;

      if (raw[sid] && typeof raw[sid] === 'object') return raw[sid];

      if (raw.progress && raw.progress[sid] && typeof raw.progress[sid] === 'object') {
        return raw.progress[sid];
      }

      const lists = [
        raw.steps,
        raw.step_progress,
        raw.progress_steps,
        raw.items
      ];

      for (const list of lists) {
        if (!Array.isArray(list)) continue;

        const found = list.find(function (item) {
          const itemId = String(
            (item && (
              item.id ||
              item.step_id ||
              item.stepId ||
              item.name ||
              item.key
            )) || ''
          );

          return itemId === sid;
        });

        if (found) return found;
      }

      return null;
    } catch (_e) {
      return null;
    }
  }
  function ensureProgressShape(raw) {
    STEPS = __pqInjectWatchStep(STEPS || []);
    const ordered = orderStepsForDisplay(STEPS);

    const shaped = (
      PQManagedCore &&
      typeof PQManagedCore.ensureProgressShape === 'function'
    )
      ? PQManagedCore.ensureProgressShape(raw, STEPS, {
          passesRequired: 1,
          repeatPerLetter: 1,
          currentStepId: 'lecture'
        })
      : {
          currentStepId: null,
          __finished: false
        };

    ordered.forEach((step) => {
      const rawPrev = __pqFindRawStepProgress(raw, step.id);
      const shapedPrev = (shaped && shaped[step.id]) || {};
      const prev = rawPrev || shapedPrev || {};

      const prevPassesDone = Number(prev.passesDone ?? prev.passes_done ?? 0);
      const prevPassesRequired = Number(prev.passesRequired ?? prev.passes_required ?? 1);
      const prevRepeatPerLetter = Number(
        prev.repeatPerLetter ??
        prev.repeats_per_letter ??
        prev.repeat_per_letter ??
        prev.default_repeats_per_letter ??
        prev.defaultRepeatsPerLetter ??
        1
      );

      shaped[step.id] = {
        ...(shaped[step.id] || {}),
        passesDone:
          Number.isFinite(prevPassesDone) && prevPassesDone >= 0
            ? prevPassesDone
            : 0,
        passesRequired:
          Number.isFinite(prevPassesRequired) && prevPassesRequired >= 1
            ? prevPassesRequired
            : 1,
        repeatPerLetter:
          Number.isFinite(prevRepeatPerLetter) && prevRepeatPerLetter >= 1
            ? prevRepeatPerLetter
            : 1,
        completed: !!(prev.completed || prev.step_status === 'completed')
      };

      try {
        if (__pqIsPassFilterStep(step.id)) {
          shaped[step.id].passesRequired = __pqGetStepPassCount(step.id);
        }
      } catch (_e) {}

      try {
        if (String(step.id || '').toLowerCase() === 'speak') {
          const speakTotal = Math.max(1, Number(__pqSpeakTotalFinal()) || 1);
          const speakDone = Math.max(0, Number(__pqSpeakCompletedCount()) || 0);

          shaped[step.id].passesRequired = speakTotal;
          shaped[step.id].passesDone = Math.min(
            speakTotal,
            Math.max(Number(shaped[step.id].passesDone || 0), speakDone)
          );

          if (shaped[step.id].passesDone >= speakTotal) {
            shaped[step.id].completed = true;
          }
        }
      } catch (_e) {}
    });

    const firstIncomplete = ordered.find(
      (step) => !(shaped[step.id] && shaped[step.id].completed)
    );

    shaped.currentStepId = firstIncomplete
      ? firstIncomplete.id
      : ((ordered[ordered.length - 1] && ordered[ordered.length - 1].id) || 'lecture');

    shaped.__finished = ordered.every(
      (step) => !!(shaped[step.id] && shaped[step.id].completed)
    );

    return shaped;
  }

  // ============================================================
  // SECTION 20: DOM references
  // ============================================================
  const grid = document.getElementById('grid');
  const btnPlayAll = document.getElementById('btnPlayAll');
  const btnPause = document.getElementById('btnPause');
  const btnReset = document.getElementById('btnReset');
  const btnGear = document.getElementById('btnGear');
  const sheet = document.getElementById('sheet');
  const closeSheet = document.getElementById('closeSheet');

  const voiceSel = document.getElementById('uiVoice');
  const speedSel = document.getElementById('uiSpeed');
  const repeatSel = document.getElementById('uiRepeat');
  const filterSel = document.getElementById('uiFilter');

  const stepperRoot = document.getElementById('managedStepper');
  const stepperList =
    document.getElementById('managedStepsList') ||
    document.getElementById('managedSteps');

  const lectureCardEl = document.getElementById('lectureCard');
  const lectureVideoEl = document.getElementById('lectureVideo');
  const lecturePlayBtnEl = document.getElementById('lecturePlayBtn');

  let pqStepActionBar = document.getElementById('pqStepActionBar');
  let pqStepActionBtn = document.getElementById('pqStepActionBtn');

function __pqHideLegacyPlayAllButton() {
  try {
    if (!btnPlayAll) return;
    btnPlayAll.hidden = true;
    btnPlayAll.disabled = true;
    btnPlayAll.setAttribute('aria-hidden', 'true');
    btnPlayAll.style.display = 'none';
  } catch (_e) {}
}

function __pqHideLegacyWriteButton() {
  try {
    const btnTrace = document.getElementById('btnTrace');
    if (!btnTrace) return;
    btnTrace.hidden = true;
    btnTrace.setAttribute('aria-hidden', 'true');
    btnTrace.style.display = 'none';
  } catch (_e) {}
}

function __pqHideLegacyLectureButton() {
  try {
    const lectureBtn =
      document.getElementById('pqLectureCtaBtn') ||
      document.getElementById('lecturePlayBtn') ||
      null;

    if (lectureBtn) {
      lectureBtn.hidden = true;
      lectureBtn.setAttribute('aria-hidden', 'true');
      lectureBtn.style.display = 'none';
    }
  } catch (_e) {}
}

function __pqGetDynamicActionBrowserHost() {
  try {
    return (
      document.getElementById('pqHeaderActionSlot') ||
      document.getElementById('pqHeaderActionRow') ||
      document.querySelector('.pq-unified-controls') ||
      document.querySelector('.controls') ||
      document.getElementById('pqLectureCta') ||
      (pqStepActionBar && pqStepActionBar.parentNode) ||
      (pqStepActionBtn && pqStepActionBtn.parentNode) ||
      null
    );
  } catch (_e) {
    return null;
  }
}

function __pqEnsureDynamicActionHost() {
  try {
    if (!pqStepActionBar) {
      pqStepActionBar = document.getElementById('pqStepActionBar');
    }

    if (!pqStepActionBtn) {
      pqStepActionBtn = document.getElementById('pqStepActionBtn');
    }

    if (!pqStepActionBar) {
      pqStepActionBar = document.createElement('div');
      pqStepActionBar.id = 'pqStepActionBar';
      pqStepActionBar.className = 'pq-step-action-bar';
    }

    if (!pqStepActionBtn) {
      pqStepActionBtn = document.createElement('button');
      pqStepActionBtn.type = 'button';
      pqStepActionBtn.id = 'pqStepActionBtn';
      pqStepActionBtn.className = 'pq-step-action-btn';
      pqStepActionBtn.textContent = 'Action';
    }

    if (pqStepActionBtn.parentNode !== pqStepActionBar) {
      try {
        pqStepActionBar.innerHTML = '';
      } catch (_e) {}
      pqStepActionBar.appendChild(pqStepActionBtn);
    }

    let style = document.getElementById('pqStepActionRuntimeStyle');
    if (!style) {
      style = document.createElement('style');
      style.id = 'pqStepActionRuntimeStyle';
      style.textContent = `
#pqStepActionBar.pq-step-action-bar{
  display:flex;
  align-items:center;
  justify-content:center;
  width:auto;
  margin:0;
  min-width:0;
  visibility:visible !important;
  opacity:1 !important;
  pointer-events:auto !important;
}

#pqStepActionBtn.pq-step-action-btn{
  appearance:none;
  -webkit-appearance:none;
  display:inline-flex !important;
  align-items:center;
  justify-content:center;
  width:auto;
  min-width:0;
  min-height:52px;
  padding:14px 24px;
  border:0;
  border-radius:999px;
  background:#e4b158;
  color:#1d2a36;
  font-size:18px;
  font-weight:800;
  line-height:1.1;
  white-space:nowrap;
  cursor:pointer;
  box-shadow:0 10px 24px rgba(0,0,0,.10);
  visibility:visible !important;
  opacity:1 !important;
  pointer-events:auto !important;
}

#pqStepActionBtn.pq-step-action-btn[disabled]{
  opacity:.5 !important;
  cursor:not-allowed;
}

#pqUnifiedBottomBar{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:12px;
  width:100%;
  margin:0;
  padding:0;
  box-sizing:border-box;
}

#pqUnifiedBottomBar .pq-unified-slot{
  display:flex;
  align-items:center;
  justify-content:center;
  min-width:0;
  box-sizing:border-box;
}

#pqUnifiedBottomBar .pq-unified-slot--back{
  flex:0 0 auto;
}

#pqUnifiedBottomBar .pq-unified-slot--pause{
  flex:0 0 auto;
}

#pqUnifiedBottomBar .pq-unified-slot--action{
  flex:0 0 auto;
}

#pqUnifiedBottomBar #pqMobileBackBtn,
#pqUnifiedBottomBar #btnPause{
  appearance:none;
  -webkit-appearance:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:52px;
  padding:14px 20px;
  border:0;
  border-radius:999px;
  font-size:18px;
  font-weight:800;
  line-height:1.1;
  white-space:nowrap;
  cursor:pointer;
  box-shadow:0 10px 24px rgba(0,0,0,.10);
  pointer-events:auto !important;
}

#pqUnifiedBottomBar #pqMobileBackBtn{
  min-width:64px;
}

#pqUnifiedBottomBar #btnPause{
  min-width:140px;
}

#pqUnifiedBottomBar #btnPause[hidden],
#pqUnifiedBottomBar #pqMobileBackBtn[hidden]{
  display:none !important;
}

#pqUnifiedBottomBar #pqMobileBackBtn,
#pqUnifiedBottomBar #btnPause,
#pqUnifiedBottomBar #pqStepActionBtn{
  pointer-events:auto !important;
  touch-action:manipulation;
}

@media (max-width: 768px){
  #pqStepActionBar.pq-step-action-bar{
    justify-content:center;
    width:auto;
  }

  #pqStepActionBtn.pq-step-action-btn{
    min-height:50px;
    padding:12px 18px;
    font-size:17px;
    width:auto;
  }

  #pqUnifiedBottomBar{
    gap:10px;
    justify-content:center;
  }

  #pqUnifiedBottomBar #pqMobileBackBtn,
  #pqUnifiedBottomBar #btnPause{
    min-height:50px;
    padding:12px 16px;
    font-size:17px;
  }

  #pqUnifiedBottomBar #pqMobileBackBtn{
    min-width:56px;
  }

  #pqUnifiedBottomBar #btnPause{
    min-width:124px;
  }
}
`;
      document.head.appendChild(style);
    }

    if (pqStepActionBtn && !pqStepActionBtn.__pqBound__) {
      pqStepActionBtn.addEventListener('click', __pqHandleDynamicStepActionClick);
      pqStepActionBtn.__pqBound__ = true;
    }

    return {
      bar: pqStepActionBar,
      button: pqStepActionBtn
    };
  } catch (_e) {
    return null;
  }
}

function __pqCanRunDynamicStepAction(meta) {
  try {
    const stepId = String((meta && meta.stepId) || '').toLowerCase();
    const mode = String((meta && meta.mode) || '').toLowerCase();
    const target = meta && meta.target ? meta.target : null;

    if (!stepId) return false;
    if (mode === 'speak') return true;
    if (mode === 'playall') return true;

    if (mode === 'target') {
      if (!target) return false;

      if (stepId === 'trace1' || stepId === 'write') {
        return true;
      }

      return !target.disabled;
    }

    return false;
  } catch (_e) {
    return false;
  }
}

function __pqGetDynamicStepActionMeta() {
  try {
    const current = getCurrentStep();
    const step = current && current.step ? current.step : null;
    const stepId = String((step && step.id) || '').toLowerCase();

    // ✅ PATCH: hide articulation image when NOT in sound step
    try {
      if (stepId !== 'sound') {
        __pqHideSoundArticulationImage();
      }
    } catch (_e) {}

    switch (stepId) {
      case 'lecture':
        return {
          stepId,
          label: 'Play Lecture',
          mode: 'target',
          target:
            document.getElementById('pqLectureCtaBtn') ||
            document.getElementById('lecturePlayBtn') ||
            null
        };

      case 'listen':
        return {
          stepId,
          label: 'Listen',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'listenplus':
        return {
          stepId,
          label: 'Listen+',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'watch':
        return {
          stepId,
          label: 'Watch',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'sound':
        return {
          stepId,
          label: 'Sound',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'repeat':
        return {
          stepId,
          label: 'Repeat',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'speak':
        return {
          stepId,
          label: 'Speak',
          mode: 'speak',
          target: null
        };

      case 'match':
        return {
          stepId,
          label: 'Match',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'animate':
        return {
          stepId,
          label: 'Animate',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'trace1':
      case 'write':
        return {
          stepId,
          label: 'Write',
          mode: 'target',
          target: document.getElementById('btnTrace') || null
        };

      case 'words':
        return {
          stepId,
          label: 'Words',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      default:
        return {
          stepId: '',
          label: 'Action',
          mode: 'none',
          target: null
        };
    }
  } catch (_e) {
    return {
      stepId: '',
      label: 'Action',
      mode: 'none',
      target: null
    };
  }
}

function __pqSyncDynamicStepAction() {
  try {
    const ensured = __pqEnsureDynamicActionHost();
    if (!ensured || !pqStepActionBar || !pqStepActionBtn) return;

    const meta = __pqGetDynamicStepActionMeta();
    const stepId = String(meta.stepId || '').toLowerCase();

    pqStepActionBtn.textContent = String(meta.label || 'Action');
    pqStepActionBtn.dataset.stepId = stepId;
    pqStepActionBtn.dataset.mode = String(meta.mode || 'none');

    if (!stepId) {
      pqStepActionBar.hidden = true;
      pqStepActionBar.style.display = 'none';
      pqStepActionBtn.hidden = true;
      pqStepActionBtn.disabled = true;
      return;
    }

    pqStepActionBar.hidden = false;
    pqStepActionBar.style.display = '';
    pqStepActionBar.style.visibility = 'visible';
    pqStepActionBar.style.opacity = '1';

    pqStepActionBtn.hidden = false;
    pqStepActionBtn.style.display = 'inline-flex';
    pqStepActionBtn.style.visibility = 'visible';
    pqStepActionBtn.style.opacity = '1';
    pqStepActionBtn.disabled = !__pqCanRunDynamicStepAction(meta);

    try {
      __pqEnsureBottomDockPlacement();
    } catch (_e) {}
  } catch (_e) {}
}

function __pqHandleDynamicStepActionClick() {
  try {
    const meta = __pqGetDynamicStepActionMeta();
    const stepId = String(meta.stepId || '').toLowerCase();
    const mode = String(meta.mode || '').toLowerCase();
    const target = meta.target || null;

    if (!stepId) return;
    if (!__pqCanRunDynamicStepAction(meta)) return;

    if (mode === 'speak') {
      try { __pqEnsureSpeakBoot(); } catch (_e) {}
      try { __pqForceSpeakUiRefresh(); } catch (_e) {}
      try { __pqScrollToSpeakActionBlock(); } catch (_e) {}
      return;
    }

    if (mode === 'playall') {
      try { playAll(); } catch (_e) {}
      return;
    }

    if (mode === 'target') {
      if (!target || target.disabled) return;
      try { target.click(); } catch (_e) {}
    }
  } catch (_e) {}
}

try {
  __pqEnsureDynamicActionHost();
} catch (_e) {}

  // ============================================================
  // SECTION 21: Lecture UI helpers
  // ============================================================
  
		const pqMobileBottomDock = document.getElementById('pqMobileBottomDock');
	const pqMobileBottomPauseSlot = document.getElementById('pqMobileBottomPauseSlot');
	const pqMobileBottomActionSlot = document.getElementById('pqMobileBottomActionSlot');
	const pqMobileBackBtn = document.getElementById('pqMobileBackBtn');

  const pqMobileChooseStepBtn = document.getElementById('pqMobileChooseStepBtn');
  const pqMobileStepPicker = document.getElementById('pqMobileStepPicker');
  const pqMobileStepPickerList = document.getElementById('pqMobileStepPickerList');
  const pqMobileStepPickerClose = document.getElementById('pqMobileStepPickerClose');

  function __pqIsMobileViewportMatch() {
    try {
      return !!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    } catch (_e) {
      return false;
    }
  }

  function __pqIsMobileDockViewport() {
    return __pqIsMobileViewportMatch();
  }

function __pqShouldShowBottomPause() {
  try {
    const meta = __pqGetDynamicStepActionMeta();
    const stepId = String(meta.stepId || '').toLowerCase();

    return [
      'listen',
      'listenplus',
      'watch',
      'sound',
      'repeat',
      'match',
      'words',
      'animate'
    ].includes(stepId);
  } catch (_e) {
    return false;
  }
}

	function __pqGetOrCreateBackButton() {
	  try {
		let btn = document.getElementById('pqMobileBackBtn');
		if (btn) return btn;

		btn = document.createElement('button');
		btn.type = 'button';
		btn.id = 'pqMobileBackBtn';
		btn.textContent = '←';
		btn.setAttribute('aria-label', 'Back');
		btn.title = 'Back';
		btn.className = 'pq-browser-back-btn';

		return btn;
	  } catch (_e) {
		return null;
	  }
	}

function __pqBindMobileBackButton() {
  try {
    const backBtn = __pqGetOrCreateBackButton();
    if (!backBtn) return;

    backBtn.onclick = function (e) {
      try { e.preventDefault(); e.stopPropagation(); } catch (_e) {}

      // 1) Prefer the iframe/app history first
      try {
        if (window.history && window.history.length > 1) {
          window.history.back();
          return false;
        }
      } catch (_e) {}

      // 2) If no usable iframe history, ask parent to go back
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              type: 'PQ_NAV_BACK',
              referrer: document.referrer || '',
              href: window.location.href || '',
              ts: Date.now()
            },
            '*'
          );
          return false;
        }
      } catch (_e) {}

      // 3) Fallbacks
      try {
        if (document.referrer) {
          window.location.href = document.referrer;
          return false;
        }
      } catch (_e) {}

      try {
        window.location.href = String(__cfg('routes.academyHomeUrl', '/'));
      } catch (_e) {}

      return false;
    };

    backBtn.hidden = false;
    backBtn.disabled = false;
    backBtn.style.display = 'inline-flex';
    backBtn.style.visibility = 'visible';
    backBtn.style.opacity = '1';
    backBtn.style.pointerEvents = 'auto';
    backBtn.style.touchAction = 'manipulation';
    backBtn.__pqBound__ = true;
  } catch (_e) {}
}

function __pqEnsureBottomDockPlacement() {
  try {
    const ensured = __pqEnsureDynamicActionHost();
    if (!ensured || !pqStepActionBar || !pqStepActionBtn) return;

    try { __pqBindMobileBackButton(); } catch (_e) {}

    const backBtn = __pqGetOrCreateBackButton();
    const hasPauseBtn = !!btnPause;

    try { __pqHideLegacyPlayAllButton(); } catch (_e) {}
    try { __pqHideLegacyWriteButton(); } catch (_e) {}
    try { __pqHideLegacyLectureButton(); } catch (_e) {}

    const showPause = hasPauseBtn && __pqShouldShowBottomPause();
    const showBack = !!backBtn;

    let unifiedBar = document.getElementById('pqUnifiedBottomBar');
    let backSlot = document.getElementById('pqUnifiedBottomBarBack');
    let pauseSlot = document.getElementById('pqUnifiedBottomBarPause');
    let actionSlot = document.getElementById('pqUnifiedBottomBarAction');

    function ensureUnifiedBar(host) {
      try {
        if (!host) return null;

        if (!unifiedBar) {
          unifiedBar = document.createElement('div');
          unifiedBar.id = 'pqUnifiedBottomBar';
        }

        if (!backSlot) {
          backSlot = document.createElement('div');
          backSlot.id = 'pqUnifiedBottomBarBack';
          backSlot.className = 'pq-unified-slot pq-unified-slot--back';
        }

        if (!pauseSlot) {
          pauseSlot = document.createElement('div');
          pauseSlot.id = 'pqUnifiedBottomBarPause';
          pauseSlot.className = 'pq-unified-slot pq-unified-slot--pause';
        }

        if (!actionSlot) {
          actionSlot = document.createElement('div');
          actionSlot.id = 'pqUnifiedBottomBarAction';
          actionSlot.className = 'pq-unified-slot pq-unified-slot--action';
        }

        if (backSlot.parentNode !== unifiedBar) {
          unifiedBar.appendChild(backSlot);
        }

        if (pauseSlot.parentNode !== unifiedBar) {
          unifiedBar.appendChild(pauseSlot);
        }

        if (actionSlot.parentNode !== unifiedBar) {
          unifiedBar.appendChild(actionSlot);
        }

        if (unifiedBar.parentNode !== host) {
          if (host.firstChild) {
            host.insertBefore(unifiedBar, host.firstChild);
          } else {
            host.appendChild(unifiedBar);
          }
        }

        return {
          bar: unifiedBar,
          backSlot,
          pauseSlot,
          actionSlot
        };
      } catch (_e) {
        return null;
      }
    }

    function applyButtonVisibility() {
      try {
        if (backBtn) {
          backBtn.hidden = !showBack;
          backBtn.style.display = showBack ? 'inline-flex' : 'none';
          backBtn.style.visibility = showBack ? 'visible' : 'hidden';
          backBtn.style.opacity = showBack ? '1' : '0';
          backBtn.style.pointerEvents = showBack ? 'auto' : 'none';
          backBtn.style.touchAction = 'manipulation';
          backBtn.disabled = false;
        }
      } catch (_e) {}

      try {
        if (btnPause) {
          btnPause.hidden = !showPause;
          btnPause.style.display = showPause ? 'inline-flex' : 'none';
          btnPause.style.visibility = showPause ? 'visible' : 'hidden';
          btnPause.style.opacity = showPause ? '1' : '0';
          btnPause.style.pointerEvents = showPause ? 'auto' : 'none';
          btnPause.style.touchAction = 'manipulation';
          btnPause.disabled = !showPause;
        }
      } catch (_e) {}

      try {
        pqStepActionBar.hidden = false;
        pqStepActionBar.style.display = '';
        pqStepActionBar.style.visibility = 'visible';
        pqStepActionBar.style.opacity = '1';
        pqStepActionBar.style.pointerEvents = 'auto';
      } catch (_e) {}

      try {
        pqStepActionBtn.hidden = false;
        pqStepActionBtn.style.display = 'inline-flex';
        pqStepActionBtn.style.visibility = 'visible';
        pqStepActionBtn.style.opacity = '1';
        pqStepActionBtn.style.pointerEvents = 'auto';
        pqStepActionBtn.style.touchAction = 'manipulation';
      } catch (_e) {}
    }

    if (__pqIsMobileDockViewport()) {
      if (!pqMobileBottomDock) return;

      const mounted = ensureUnifiedBar(pqMobileBottomDock);
      if (!mounted) return;

      if (showBack && backBtn && backBtn.parentNode !== mounted.backSlot) {
        mounted.backSlot.appendChild(backBtn);
      }

      if (showPause && btnPause && btnPause.parentNode !== mounted.pauseSlot) {
        mounted.pauseSlot.appendChild(btnPause);
      }

      if (pqStepActionBar.parentNode !== mounted.actionSlot) {
        mounted.actionSlot.appendChild(pqStepActionBar);
      }

      mounted.backSlot.style.display = showBack ? 'flex' : 'none';
      mounted.pauseSlot.style.display = showPause ? 'flex' : 'none';
      mounted.actionSlot.style.display = 'flex';

      applyButtonVisibility();

      try {
        if (pqMobileBottomPauseSlot) {
          pqMobileBottomPauseSlot.classList.toggle('is-hidden', !showPause);
        }
      } catch (_e) {}

      try {
        if (pqMobileBottomActionSlot) {
          pqMobileBottomActionSlot.classList.toggle('is-full', !showPause);
        }
      } catch (_e) {}

      pqMobileBottomDock.style.display = 'flex';
      pqMobileBottomDock.style.visibility = 'visible';
      pqMobileBottomDock.style.opacity = '1';
      return;
    }

const browserHost = __pqGetDynamicActionBrowserHost();
if (!browserHost) return;

const desktopBackBtn = document.getElementById('pqDesktopBackBtn');
const desktopPauseSlot = document.getElementById('pqHeaderPauseSlot');
const desktopActionSlot = document.getElementById('pqHeaderActionSlot');
const mobileActionRow = document.querySelector('.pq-mobile-action-row');

try {
  if (mobileActionRow) {
    mobileActionRow.style.display = 'none';
    mobileActionRow.style.visibility = 'hidden';
    mobileActionRow.style.opacity = '0';
  }
} catch (_e) {}

try {
  if (desktopPauseSlot && btnPause && btnPause.parentNode !== desktopPauseSlot) {
    desktopPauseSlot.appendChild(btnPause);
  }
} catch (_e) {}

try {
  if (desktopActionSlot && pqStepActionBar && pqStepActionBar.parentNode !== desktopActionSlot) {
    desktopActionSlot.appendChild(pqStepActionBar);
  } else if (pqStepActionBar && pqStepActionBar.parentNode !== browserHost) {
    browserHost.appendChild(pqStepActionBar);
  }
} catch (_e) {}

try {
  if (desktopBackBtn) {
    desktopBackBtn.hidden = false;
    desktopBackBtn.style.display = 'inline-flex';
    desktopBackBtn.style.visibility = 'visible';
    desktopBackBtn.style.opacity = '1';
    desktopBackBtn.disabled = false;
    desktopBackBtn.onclick = function (e) {
      try { e.preventDefault(); e.stopPropagation(); } catch (_e) {}

      try {
        if (window.history && window.history.length > 1) {
          window.history.back();
          return false;
        }
      } catch (_e) {}

      try {
        if (document.referrer) {
          window.location.href = document.referrer;
          return false;
        }
      } catch (_e) {}

      try {
        window.location.href = '../';
      } catch (_e) {}

      return false;
    };
  }
} catch (_e) {}

try {
  if (backBtn) {
    backBtn.hidden = true;
    backBtn.style.display = 'none';
    backBtn.style.visibility = 'hidden';
    backBtn.style.opacity = '0';
  }
} catch (_e) {}

try {
  if (btnPause) {
    btnPause.hidden = !showPause;
    btnPause.style.display = showPause ? 'inline-flex' : 'none';
    btnPause.style.visibility = showPause ? 'visible' : 'hidden';
    btnPause.style.opacity = showPause ? '1' : '0';
    btnPause.style.pointerEvents = showPause ? 'auto' : 'none';
    btnPause.style.touchAction = 'manipulation';
    btnPause.disabled = !showPause;
  }
} catch (_e) {}

try {
  pqStepActionBar.hidden = false;
  pqStepActionBar.style.display = '';
  pqStepActionBar.style.visibility = 'visible';
  pqStepActionBar.style.opacity = '1';
  pqStepActionBar.style.pointerEvents = 'auto';
} catch (_e) {}

try {
  pqStepActionBtn.hidden = false;
  pqStepActionBtn.style.display = 'inline-flex';
  pqStepActionBtn.style.visibility = 'visible';
  pqStepActionBtn.style.opacity = '1';
  pqStepActionBtn.style.pointerEvents = 'auto';
  pqStepActionBtn.style.touchAction = 'manipulation';
} catch (_e) {}

try {
  if (pqMobileBottomPauseSlot) pqMobileBottomPauseSlot.classList.remove('is-hidden');
  if (pqMobileBottomActionSlot) pqMobileBottomActionSlot.classList.remove('is-full');
  if (pqMobileBottomDock) {
    pqMobileBottomDock.style.display = 'none';
    pqMobileBottomDock.style.visibility = 'hidden';
    pqMobileBottomDock.style.opacity = '0';
  }
} catch (_e) {}

  } catch (_e) {}
}
  
    function __pqIsMobileViewport() {
    return __pqIsMobileViewportMatch();
  }

  function __pqShouldShowMobileStepPicker() {
    try {
      if (!__pqIsMobileViewport()) return false;
      if (!managedProgress || !Array.isArray(STEPS) || !STEPS.length) return false;
      return !!(__pqPracticeFreeUI() || __pqIsReviewMode());
    } catch (_e) {
      return false;
    }
  }

  function __pqCloseMobileStepPicker() {
    try {
      if (!pqMobileStepPicker) return;
      pqMobileStepPicker.hidden = true;
      pqMobileStepPicker.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('pq-mobile-step-picker-open');
    } catch (_e) {}
  }

  function __pqOpenMobileStepPicker() {
    try {
      if (!pqMobileStepPicker || !__pqShouldShowMobileStepPicker()) return;
      __pqRenderMobileStepPicker();
      pqMobileStepPicker.hidden = false;
      pqMobileStepPicker.setAttribute('aria-hidden', 'false');
      document.body.classList.add('pq-mobile-step-picker-open');
    } catch (_e) {}
  }

  function __pqRenderMobileStepPicker() {
    try {
      if (!pqMobileChooseStepBtn) return;
      pqMobileChooseStepBtn.hidden = !__pqShouldShowMobileStepPicker();

      if (!pqMobileStepPickerList) return;

      if (!__pqShouldShowMobileStepPicker()) {
        pqMobileStepPickerList.innerHTML = '';
        __pqCloseMobileStepPicker();
        return;
      }

      const currentStepId = String((managedProgress && managedProgress.currentStepId) || '');
      pqMobileStepPickerList.innerHTML = '';

      (STEPS || []).forEach(function (step, idx) {
        try {
          const sid = String((step && step.id) || '');
          if (!sid) return;

          const progress = (managedProgress && managedProgress[sid]) || {};
          const passesDone = Number(progress.passesDone ?? progress.passes_done ?? 0) || 0;
          const passesRequired = Number(progress.passesRequired ?? progress.passes_required ?? 1) || 1;
          const completed = !!(
            progress.completed ||
            passesDone >= passesRequired
          );
          const current = sid === currentStepId;

          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'pq-mobile-step-picker__item';
          if (completed) item.classList.add('is-complete');
          if (current) item.classList.add('is-current');

          const stateText = completed
            ? 'Completed'
            : (current ? 'Current' : 'Open');

          item.innerHTML = `
            <div class="pq-mobile-step-picker__item-top">
              <span class="pq-mobile-step-picker__step">Step ${idx + 1}</span>
              <span class="pq-mobile-step-picker__state">${stateText}</span>
            </div>
            <div class="pq-mobile-step-picker__label">${String(step.label || sid)}</div>
            <div class="pq-mobile-step-picker__meta">Progress ${passesDone}/${passesRequired}</div>
          `;

          item.addEventListener('click', function () {
            try {
              __pqOpenStepForReview(sid);
            } catch (_e) {}

            try {
              __pqCloseMobileStepPicker();
            } catch (_e) {}
          });

          pqMobileStepPickerList.appendChild(item);
        } catch (_e) {}
      });
    } catch (_e) {}
  }

  if (pqMobileChooseStepBtn && !pqMobileChooseStepBtn.__pqBound__) {
    pqMobileChooseStepBtn.addEventListener('click', function () {
      try {
        __pqOpenMobileStepPicker();
      } catch (_e) {}
    });
    pqMobileChooseStepBtn.__pqBound__ = true;
  }

  if (pqMobileStepPickerClose && !pqMobileStepPickerClose.__pqBound__) {
    pqMobileStepPickerClose.addEventListener('click', function () {
      try {
        __pqCloseMobileStepPicker();
      } catch (_e) {}
    });
    pqMobileStepPickerClose.__pqBound__ = true;
  }

  if (pqMobileStepPicker && !pqMobileStepPicker.__pqBound__) {
    pqMobileStepPicker.addEventListener('click', function (ev) {
      try {
        const closeHit = ev && ev.target && ev.target.getAttribute
          ? ev.target.getAttribute('data-close')
          : null;

        if (closeHit === '1') {
          __pqCloseMobileStepPicker();
        }
      } catch (_e) {}
    });
    pqMobileStepPicker.__pqBound__ = true;
  }
  let __pqLectureHelpers = null;

  function __pqEnsureLectureHelpers() {
    if (
      __pqLectureHelpers ||
      !window.PQLectureHelpers ||
      typeof window.PQLectureHelpers.create !== 'function'
    ) {
      return __pqLectureHelpers;
    }

    __pqLectureHelpers = window.PQLectureHelpers.create({
      lectureCardEl,
      lectureVideoEl,
      lecturePlayBtnEl,
      lessonDef: LESSON_DEF,
      markLectureCompleted: async () => {
        await markLectureCompleted();
      },
      getAboutBtn: () => document.getElementById('pqAboutBtn')
    });

    return __pqLectureHelpers;
  }

  function pqBindLectureOnce() {
    const api = __pqEnsureLectureHelpers();
    return api ? api.bindLectureOnce() : undefined;
  }

  function pqBindLectureCtaBridge() {
    const api = __pqEnsureLectureHelpers();
    return api ? api.bindLectureCtaBridge() : undefined;
  }

  // ============================================================
  // SECTION 22: Settings/filter helpers
  // ============================================================
  let __pqSettingsFilter = null;

  function __pqEnsureSettingsFilter() {
    if (
      __pqSettingsFilter ||
      !window.PQSettingsFilter ||
      typeof window.PQSettingsFilter.create !== 'function'
    ) {
      return __pqSettingsFilter;
    }

    __pqSettingsFilter = window.PQSettingsFilter.create({
      defaults: DEFAULTS,
      settingsKey: LS_SETTINGS_KEY,
      voiceSel,
      speedSel,
      repeatSel,
      filterSel,
      practiceFreeUI: () => __pqPracticeFreeUI(),
      getManagedProgress: () => managedProgress,
      getCurrentStep: () => getCurrentStep(),
      letterKeys: LETTER_KEYS,
      heavy: HEAVY,
      vowels: VOWELS,
      alifaa: ALIF_AA
    });

    return __pqSettingsFilter;
  }

  function loadSettings() {
    const api = __pqEnsureSettingsFilter();
    return api ? api.loadSettings() : { ...DEFAULTS };
  }

  function saveSettings() {
    const api = __pqEnsureSettingsFilter();
    return api ? api.saveSettings() : undefined;
  }

  function applySettingsToUI(settings) {
    const api = __pqEnsureSettingsFilter();
    return api ? api.applySettingsToUI(settings) : undefined;
  }

  function getFilterKeys(filterValue) {
    const api = __pqEnsureSettingsFilter();
    return api ? api.getFilterKeys(filterValue) : LETTER_KEYS;
  }

  function passesFilter(key) {
    const api = __pqEnsureSettingsFilter();
    return api ? api.passesFilter(key) : true;
  }

  function getActiveFilter() {
    const api = __pqEnsureSettingsFilter();
    return api ? api.getActiveFilter() : (filterSel.value || DEFAULTS.filter);
  }

  // ============================================================
  // PASS FILTER HELPERS
  // Safe layer only: does not change core step completion logic.
  // Listen / Watch / Repeat use this only to choose playback keys.
  // ============================================================

function __pqIsPassFilterStep(stepId) {
  const sid = String(stepId || '').toLowerCase();

  return [
    'listen',
    'listenplus',
    'watch',
    'sound',
    'repeat',
    'match',
    'words',
    'animate'
  ].includes(sid);
}

  function __pqGetStepPassFilters(stepId) {
    try {
      const sid = String(stepId || '').toLowerCase();
      const cfg = __cfg('stepPassFilters', {}) || {};
      const raw = cfg[sid] || [];

      if (!Array.isArray(raw) || !raw.length) {
        return ['all'];
      }

      return raw.map((v) => String(v || '').trim()).filter(Boolean);
    } catch (_e) {
      return ['all'];
    }
  }

  function __pqGetStepPassCount(stepId) {
    const filters = __pqGetStepPassFilters(stepId);
    return Math.max(1, filters.length || 1);
  }

  function __pqGetCurrentPassIndex(stepId) {
    try {
      const sid = String(stepId || '').toLowerCase();
      const progress = managedProgress && managedProgress[sid];
      const done = Math.max(0, Number((progress && progress.passesDone) || 0));
      const filters = __pqGetStepPassFilters(sid);
      return Math.min(done, Math.max(0, filters.length - 1));
    } catch (_e) {
      return 0;
    }
  }

  function __pqGetCurrentPassFilter(stepId) {
    const filters = __pqGetStepPassFilters(stepId);
    const index = __pqGetCurrentPassIndex(stepId);
    return filters[index] || 'all';
  }

  function __pqGetConfiguredFilterSet(filterName) {
    try {
      const name = String(filterName || '').trim();
      if (!name) return [];

      const direct = __cfg('filterSets.' + name, []);
      if (Array.isArray(direct) && direct.length) {
        return direct.map(String);
      }
    } catch (_e) {}

    return [];
  }

  function __pqGetKeysForPassFilter(filterName) {
    const name = String(filterName || 'all').toLowerCase();

    if (name === 'all') {
      return (PLAY_SEQUENCE_KEYS || []).slice();
    }

    if (name === 'heavy') {
      return (PLAY_SEQUENCE_KEYS || []).filter((key) => HEAVY.has(key));
    }

    if (name === 'light') {
      return (PLAY_SEQUENCE_KEYS || []).filter((key) => !HEAVY.has(key));
    }

    if (
      name === 'alifaa' ||
      name === 'longalif' ||
      name === 'long_alif' ||
      name === 'long-alif'
    ) {
      return (PLAY_SEQUENCE_KEYS || []).filter((key) => ALIF_AA.has(key));
    }

    if (name === 'vowels' || name === 'vowel') {
      return (PLAY_SEQUENCE_KEYS || []).filter((key) => VOWELS.has(key));
    }

    const configured = __pqGetConfiguredFilterSet(filterName);
    if (configured.length) {
      const set = new Set(configured);
      return (PLAY_SEQUENCE_KEYS || []).filter((key) => set.has(key));
    }

    return (PLAY_SEQUENCE_KEYS || []).slice();
  }

  function __pqGetPassSequenceKeys(stepId, fallbackKeys) {
    try {
      const sid = String(stepId || '').toLowerCase();

      if (!__pqIsPassFilterStep(sid)) {
        return Array.isArray(fallbackKeys) ? fallbackKeys : [];
      }

      const filterName = __pqGetCurrentPassFilter(sid);
      const passKeys = __pqGetKeysForPassFilter(filterName);

      if (passKeys.length) {
        return passKeys;
      }

      return Array.isArray(fallbackKeys) ? fallbackKeys : [];
    } catch (_e) {
      return Array.isArray(fallbackKeys) ? fallbackKeys : [];
    }
  }


  // ============================================================
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

  source.onended = function () {
    const stillCurrentToken = (__pqWebAudioPlaybackToken === token);
    const stillCurrentSource = (__pqWebAudioCurrentSource === source);

    if (!stillCurrentToken) return;
    if (__pqWebAudioPaused) return;

    if (stillCurrentSource) {
      __pqWebAudioCurrentSource = null;
      __pqWebAudioPauseOffset = 0;
    }

    __pqResolveLogicalPlayback(true);
  };

  source.start(0, __pqWebAudioPauseOffset);
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
        type === 'trace'
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
        type === 'trace'
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
    const keys = __pqGetWriteAllKeys();
    const chunkSize = Math.max(1, Number(WRITE_CFG.chunkSize || 1));
    const plan = __pqGetWriteChunkPlan();
    const totalChunks = plan.length
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
      const prog = cur ? cur.progress : null;
      const passesDone = Math.max(0, Number((prog && prog.passesDone) || 0));
      chunkIndex = Math.min(totalChunks - 1, passesDone);
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
            if (stepId === 'write' || stepId === 'trace1') {
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
                const reloadKey =
                  __PQ_WRITE_RELOAD_KEY;

                if (sessionStorage.getItem(reloadKey) !== '1') {
                  sessionStorage.setItem(reloadKey, '1');
                  setTimeout(function () {
                    try {
                      window.location.reload();
                    } catch (_e) {}
                  }, 120);
                }
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
      const api = __pqEnsureFocusAdapter();
      return api ? api.mediaActive() : false;
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

  tile.innerHTML = `
    <div class="sep" style="font-size:${sepFontSize} !important;">
      ${letterObj.ar || letterObj.text || ''}
    </div>

    <div class="small" style="font-size:${smallFontSize} !important;">
      ${letterObj.small || letterObj.text || ''}
    </div>

    ${letterObj.en ? `<div class="translit">${letterObj.en}</div>` : ''}
  `;

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

        playWatchVideoForKey(letterObj.key, rate)
          .then(() => {
            handleLetterPlayedForCurrentStep(letterObj.key);
          })
          .catch(() => {});
        return;
      }
    } catch (_e) {}

    playLetter(letterObj.key, repeatCount, rate)
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
        stepId === 'trace1';

      if (isWriteStep) {
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
      ? String(cur.step.id).toLowerCase()
      : '';

    // Listen / Listen+ / Watch / Sound / Repeat / Match / Words / Animate use stepPassFilters.
    // Pass 1 = all, pass 2 = heavy, etc.
    if ([
      'listen',
      'listenplus',
      'watch',
      'sound',
      'repeat',
      'match',
      'words',
      'animate'
    ].includes(stepId)) {
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
      ? String(cur.step.id).toLowerCase()
      : '';

    if ([
      'listen',
      'listenplus',
      'watch',
      'sound',
      'repeat',
      'match',
      'words',
      'animate'
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

    let g = 0;

    (LETTERS || []).forEach((letterObj) => {
      const tile = __pqTileByKey.get(letterObj.key);
      if (!tile) return;

      const visible = !!(passesFilter(letterObj.key) && __pqLetterPassVisible(letterObj));

      tile.style.display = visible ? '' : 'none';
      tile.hidden = !visible;
      tile.dataset.gidx = visible ? String(g++) : '-1';

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
  }

  
function markActive() {
  const tiles = [...(grid ? grid.querySelectorAll('.tile') : [])];

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

    tile.classList.toggle('active', !isDone && (isActiveByKey || isActiveByIdx));

    if (isDone) {
      tile.classList.add('played', 'completed', 'pq-speak-done');
      tile.setAttribute('data-speak-done', '1');
      tile.style.opacity = '0.45';
      tile.style.filter = 'grayscale(0.25)';
    }
  });

  try { __pqSpeakApplyDoneTilesFinal(); } catch (_e) {}
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
  // SECTION 27: Shared playlist/watch engine helpers
  // ============================================================
  const __ADULT_MALE_ALPHA_BASE = String(
  __cfg(
    'media.adultMaleAlphaBase',
    ''
  )
  );

  function __adLettersFromSeparatedLine(value) {
    return String(value || '')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[\u200C\u200D\u2009\u00A0\s]/g, '')
      .split('');
  }

  let __pqPlaylistEngine = null;

  function __pqEnsurePlaylistEngine() {
    if (
      __pqPlaylistEngine ||
      !window.PQSharedPlaylistEngine ||
      typeof window.PQSharedPlaylistEngine.create !== 'function'
    ) {
      return __pqPlaylistEngine;
    }

    __pqPlaylistEngine = window.PQSharedPlaylistEngine.create({
      audioEl: audio,
      playerEl: player,
      videoModalEl: videoModal,
      btnPlayAllEl: btnPlayAll,
      btnPauseEl: btnPause,
      speedSelEl: speedSel,
      repeatSelEl: repeatSel,
      defaults: DEFAULTS,
      getCurrentStep: () => getCurrentStep(),
      getManagedProgress: () => managedProgress,
      getPracticeFreeUI: () => __pqPracticeFreeUI(),
      getLetters: () => LETTERS,
      getVideoByKey: () => VIDEO_BY_KEY,
      getPlaySequenceKeys: () => {
        try {
          const cur = getCurrentStep && getCurrentStep();
          const sid = String((cur && cur.step && cur.step.id) || '');
          return __pqGetPassSequenceKeys(sid, PLAY_SEQUENCE_KEYS);
        } catch (_e) {
          return PLAY_SEQUENCE_KEYS;
        }
      },
      getGridEl: () => grid,
      getAudioBases: () => [AUDIO_BASE],
      getVoiceBases: () => VOICE_BASES,
      getVoiceValue: () => (voiceSel.value || DEFAULTS.voice),
      getCacheBust: () => '',
      getArForKey: (key) => audioStemForKey(key),
      resolveAdultMaleBase: () => __ADULT_MALE_ALPHA_BASE,
      getLettersFromSeparatedLine: (value) => __adLettersFromSeparatedLine(value),

      onSelectKey: (key, idx) => {
        selectedIdx = (typeof idx === 'number') ? idx : -1;
        selectedKey = key || null;
        markActive();

        try {
          __pqSyncWriteUI();
        } catch (_e) {}

        if (key) alScrollToKey(key);
      },

      onLetterPlayed: async (key) => {
        try {
          handleLetterPlayedForCurrentStep(key);
        } catch (_e) {}
      },

      onPlaylistStepCompleted: async (stepId) => {
        await markPlaylistStepCompleted(stepId);
      },

      scrollToKey: (key) => alScrollToKey(key),

      delay: (ms) => new Promise((resolve) => {
        setTimeout(resolve, Math.max(0, Number(ms) || 0));
      })
    });

    return __pqPlaylistEngine;
  }
  
  function __pqResolveAudioUrlForKey(key) {
  try {
    const fileName = AUDIO_MAP && AUDIO_MAP[key];
    if (!fileName) return '';
    return AUDIO_BASE + String(fileName) + '?v=20260415_01';
  } catch (_e) {
    return '';
  }
}

  function tryPlayUrl(url, rate) {
    const api = __pqEnsurePlaylistEngine();
    return api
      ? api.tryPlayUrl(url, rate)
      : Promise.reject(new Error('playlist engine unavailable'));
  }

async function playLetterOnce(key, rate) {
    // PATCH_PLAYING_TILE_IN_PLAY_LETTER_ONCE
    try { __pqSetPlayingTile(key); } catch (_e) {}
  try {
    const url = __pqResolveAudioUrlForKey(key);
    if (!url) {
      const api = __pqEnsurePlaylistEngine();
      if (api) return api.playLetterOnce(key, rate);
      return undefined;
    }

    __pqWebAudioCurrentUrl = url;
    const buffer = await __pqFetchAudioBuffer(url);
    if (!buffer) {
      const api = __pqEnsurePlaylistEngine();
      if (api) return api.playLetterOnce(key, rate);
      return undefined;
    }

    await __pqPlayBuffer(buffer, rate, 0);
    return true;
  } catch (_e) {
    const api = __pqEnsurePlaylistEngine();
    if (api) return api.playLetterOnce(key, rate);
    return undefined;
  }
}



function __pqRepeatGapDelay(ms) {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, Math.max(0, Number(ms || 0) || 0));
  });
}

async function playLetter(key, times, rate) {
  try {
    const count = Math.max(1, Math.floor(Number(times || 1) || 1));

    for (let i = 0; i < count; i += 1) {
      await playLetterOnce(key, rate);

      if (i < count - 1) {
        await __pqRepeatGapDelay(350);
      }
    }

    return true;
  } catch (_e) {
    const api = __pqEnsurePlaylistEngine();
    if (api) return api.playLetter(key, times, rate);
    return undefined;
  }
}

// ============================================================
// SECTION 27B: Shared Speak bridge for Listen
// ============================================================
window.__pqSpeakBridge = {
  getCurrentStepId: function () {
    try {
      const cur = getCurrentStep();
      return (cur && cur.step && cur.step.id) ? String(cur.step.id) : null;
    } catch (_e) {
      return null;
    }
  },

  isPracticeOnlyMode: function () {
    try {
      if (!__pqIsManagedUser() || !managedProgress) return false;

      const stepsArr = Array.isArray(STEPS) ? STEPS : [];
      const required = stepsArr.filter(function (step) {
        return String((step && step.id) || '').toLowerCase() !== 'speak';
      });

      if (!required.length) return false;

      return required.every(function (step) {
        const sid = String((step && step.id) || '');
        const prog = managedProgress && managedProgress[sid];

        return !!(
          prog &&
          (
            prog.completed ||
            Number(prog.passesDone || 0) >= Number(prog.passesRequired || 1)
          )
        );
      });
    } catch (_e) {
      return false;
    }
  },

  shouldShowPanel: function () {
  try {
    const cur = getCurrentStep();
    return !!(
      cur &&
      cur.step &&
      String(cur.step.id || '').toLowerCase() === 'speak'
    );
  } catch (_e) {
    return false;
  }
},

  isSpeakStepCompleted: function () {
    try {
      return !!(
        managedProgress &&
        managedProgress.speak &&
        (
          managedProgress.speak.completed ||
          Number(managedProgress.speak.passesDone || 0) >=
            Number(managedProgress.speak.passesRequired || 1)
        )
      );
    } catch (_e) {
      return false;
    }
  },

  getRequiredItems: function () {
    try {
      return (LETTERS || []).map((item) => ({
        key: item.key,
        label: item.name || item.ar || item.key,
        text: item.ar || item.name || item.key
      }));
    } catch (_e) {
      return [];
    }
  },

  playReferenceForItem: async function (item) {
    if (!item || !item.key) {
      throw new Error('Missing Speak item key.');
    }

    const key = String(item.key || '').trim();
    if (!key) {
      throw new Error('Missing Speak item key.');
    }

    const fileName = AUDIO_MAP && AUDIO_MAP[key];
    if (!fileName) {
      throw new Error('No audio mapped for Speak reference: ' + key);
    }

    const url = __pqAppendAssetVersion(AUDIO_BASE + String(fileName));
    const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1') || 1;

    await new Promise((resolve, reject) => {
      try {
        if (!audio) {
          reject(new Error('Audio element unavailable.'));
          return;
        }

        const cleanup = function () {
          try { audio.removeEventListener('ended', onEnded); } catch (_e) {}
          try { audio.removeEventListener('error', onError); } catch (_e) {}
        };

        const onEnded = function () {
          cleanup();
          resolve(true);
        };

        const onError = function () {
          cleanup();
          reject(new Error('Reference playback failed.'));
        };

        try { audio.pause(); } catch (_e) {}
        try { audio.currentTime = 0; } catch (_e) {}
        try { audio.src = url; } catch (_e) {}
        try { audio.playbackRate = rate; } catch (_e) {}

        audio.addEventListener('ended', onEnded, { once: true });
        audio.addEventListener('error', onError, { once: true });

        const maybe = audio.play();
        if (maybe && typeof maybe.catch === 'function') {
          maybe.catch(function (err) {
            cleanup();
            reject(err);
          });
        }
      } catch (err) {
        reject(err);
      }
    });

    return true;
  },

  completeSpeakStep: async function () {
    if (!__LessonRuntime || typeof __LessonRuntime.completeStep !== 'function') {
      throw new Error('Lesson runtime not available.');
    }

    const runtimeResult = await __LessonRuntime.completeStep('speak');
    __pqApplyRuntimeCompletion('speak', runtimeResult);
    return runtimeResult;
  },

refreshManagedState: async function () {
  try {
    renderStepper();
    renderGrid();
    updateControlsForCurrentStep();
    try { __pqForceWriteButtonRefresh(); } catch (_e) {}
    try { __pqForceSpeakUiRefresh(); } catch (_e) {}
    try { __pqSyncDynamicStepAction(); } catch (_e) {}
    try { __pqAfterProgressChange(true); } catch (_e) {}
  } catch (_e) {}
},

  celebrateStep: function () {
    try { __pqRenderRewardStars(true); } catch (_e) {}
  }
};

// Backward-compatible alias for locked adapter versions that still read the
// original Tanween-specific bridge name.
window.__pqTanweenSpeak = window.__pqSpeakBridge;

  function setPaused(value) {
    try {
      const current = getCurrentStep();

      if (current && __pqIsWatchStep(current.step)) {
        __watchPaused = !!value;
        paused = !!value;

        try {
          if (player) {
            if (__watchPaused) {
              player.pause();
            } else {
              player.play().catch(() => {});
            }
          }
        } catch (_e) {}

        if (btnPause) {
          btnPause.textContent = __watchPaused
  ? __PQ_TEXT_CACHE.resume
  : __PQ_TEXT_CACHE.pause;
        }

        return __watchPaused;
      }
    } catch (_e) {}

paused = !!value;

let result = paused;

try {
  if (paused) {
    if (__pqPauseWebAudio()) {
      result = true;
    } else {
      const api = __pqEnsurePlaylistEngine();
      result = api ? api.setPaused(value) : paused;
    }
  } else {
    const resumeRate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1');

    __pqResumeWebAudio(resumeRate)
      .then((ok) => {
        if (!ok) {
          try {
            const api = __pqEnsurePlaylistEngine();
            if (api) api.setPaused(false);
          } catch (_e) {}
        }
      })
      .catch(() => {
        try {
          const api = __pqEnsurePlaylistEngine();
          if (api) api.setPaused(false);
        } catch (_e) {}
      });

    result = false;
  }
} catch (_e) {
  const api = __pqEnsurePlaylistEngine();
  result = api ? api.setPaused(value) : paused;
}

    try {
      if (btnPause) {
        btnPause.textContent = paused
          ? __PQ_TEXT_CACHE.resume
          : __PQ_TEXT_CACHE.pause;
      }
    } catch (_e) {}

    return result;
  }

  async function pauseGate(signal) {
    try {
      const current = getCurrentStep();

      if (current && __pqIsWatchStep(current.step)) {
        while (__watchPaused) {
          __pqAssertNotAborted(signal);
          await __pqDelayWithAbort(120, signal);
        }
        return;
      }
    } catch (_e) {
      if (_e && _e.name === 'AbortError') throw _e;
    }

    while (paused) {
      __pqAssertNotAborted(signal);
      await __pqDelayWithAbort(120, signal);
    }

    return undefined;
  }

  function __pqGetWatchSequenceKeys() {
    const visible = [
      ...(grid ? grid.querySelectorAll('.tile[data-key]') : [])
    ].map((el) => String(el.dataset.key || ''));

    const visibleSet = new Set(visible.filter(Boolean));
    const fallback = (PLAY_SEQUENCE_KEYS || []).filter((key) => visibleSet.has(key));

    return __pqGetPassSequenceKeys('watch', fallback);
  }

  function __pqPlayVideoUrl(url, rate) {
    return new Promise((resolve, reject) => {
      try {
        if (!player || !videoModal || !url) {
          reject(new Error('video player unavailable'));
          return;
        }

        let settled = false;

        const cleanup = () => {
          try { player.onended = null; } catch (_e) {}
          try { player.onerror = null; } catch (_e) {}
          try { player.onpause = null; } catch (_e) {}
          try { player.onloadedmetadata = null; } catch (_e) {}
          try { player.oncanplay = null; } catch (_e) {}
          try { player.onabort = null; } catch (_e) {}
          try { player.onemptied = null; } catch (_e) {}
        };

        const done = (ok, err) => {
          if (settled) return;
          settled = true;
          cleanup();

          if (ok) {
            resolve(true);
          } else {
            reject(err || new Error('video playback failed'));
          }
        };

        try {
          videoModal.style.display = 'flex';
        } catch (_e) {}

        try { player.pause(); } catch (_e) {}
        try { player.removeAttribute('src'); } catch (_e) {}
        try { player.load(); } catch (_e) {}

        try {
          player.setAttribute('src', String(url));
        } catch (_e) {}

        try {
          player.playbackRate = Number(rate || 1) || 1;
        } catch (_e) {}

        player.onended = function () {
          try { if (videoModal) videoModal.style.display = 'none'; } catch (_e) {}
          done(true);
        };

        player.onerror = function () {
          done(false, new Error('video playback failed'));
        };

		player.onabort = function () {
          try { if (videoModal) videoModal.style.display = 'none'; } catch (_e) {}
          done(true);
        };

        player.onloadedmetadata = function () {
          try {
            player.currentTime = 0;
          } catch (_e) {}
        };

        player.oncanplay = function () {
          try {
            const maybePlay = player.play();
            if (maybePlay && typeof maybePlay.then === 'function') {
              maybePlay.then(function () {
                // playing
              }).catch(function (err) {
                done(false, err || new Error('video play() failed'));
              });
            }
          } catch (err) {
            done(false, err);
          }
        };

        try {
          player.load();
        } catch (err) {
          done(false, err);
        }
      } catch (err) {
        reject(err);
      }
    });
  }



function __pqCloseSoundArticulationModal() {
  try {
    const box = document.getElementById('pqSoundArticulationModal');
    if (box) box.remove();
  } catch (_e) {}
}

function __pqHideSoundArticulationImage() {
  __pqCloseSoundArticulationModal();
}

/*
  Shows articulation image inside the current page.

  Buttons:
  - replay: plays the letter audio without closing the modal
  - primary: closes modal and resolves "primary"
  - secondary: closes modal and resolves "secondary"

  This keeps Re-play Letter linked directly to the existing letter audio function,
  so we do not need a separate audio mapping.
*/

let __pqSoundExplainerPlayer = null;

function __pqGetSoundExplainerUrl(key) {
  try {
    let base = String(__cfg('media.soundAudioBase', '') || '');

    // Safety: if soundAudioBase is not the explainer folder, use fallback.
    if (!/\/explainer\/?$/i.test(base)) {
      base = String(__cfg('media.soundExplainerBase', '') || '');
    }

    if (!base) return '';

    const stem = (typeof __pqSoundFileStemFromKey === 'function')
      ? __pqSoundFileStemFromKey(key)
      : String(key || '').replace(/(\D+)(\d+)$/, function (_m, p1, p2) {
          return p1 + String(Number(p2) || 0).padStart(2, '0');
        });

    return __pqAppendAssetVersion(base.replace(/\/?$/, '/') + stem + '_explainer.mp3');
  } catch (_e) {
    return '';
  }
}

function __pqStopSoundExplainer() {
  try {
    if (__pqSoundExplainerPlayer) {
      __pqSoundExplainerPlayer.pause();
      __pqSoundExplainerPlayer.removeAttribute('src');
      __pqSoundExplainerPlayer.load();
    }
  } catch (_e) {}

  __pqSoundExplainerPlayer = null;
}

async function __pqPlaySoundExplainer(key) {
  try {
    __pqStopSoundExplainer();

    const url = __pqGetSoundExplainerUrl(key);
    if (!url) return false;

    __pqSoundExplainerPlayer = new Audio(url);
    __pqSoundExplainerPlayer.preload = 'auto';

    await __pqSoundExplainerPlayer.play();
    return true;
  } catch (err) {
    console.warn('[PQ Sound] explainer audio failed:', err);
    return false;
  }
}


function __pqSoundModalChoice(key, opts, signal, rate) {
  return new Promise((resolve) => {
    try {
      const url = SOUND_IMAGE_BY_KEY && SOUND_IMAGE_BY_KEY[key];

      if (!url) {
        resolve('primary');
        return;
      }

      __pqCloseSoundArticulationModal();

      const primaryLabel = (opts && opts.primary) || 'Continue';
      const secondaryLabel = opts && opts.secondary ? String(opts.secondary) : '';
      const replayLabel = (opts && opts.replay) || 'Re-play letter';
      const explainerLabel = (opts && opts.explainer) || 'Explainer';

      const overlay = document.createElement('div');
      overlay.id = 'pqSoundArticulationModal';
      overlay.className = 'pq-sound-modal-overlay';

      const card = document.createElement('div');
      card.className = 'pq-sound-modal-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'pq-sound-modal-close';
      closeBtn.setAttribute('data-choice', 'close');
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '×';

      const img = document.createElement('img');
      img.className = 'pq-sound-modal-img';
      img.src = url;
      img.alt = 'Articulation image';

      img.addEventListener('error', function () {
        try {
          console.warn('[PQ Sound] articulation image failed:', url);
        } catch (_e) {}
      });

      const actions = document.createElement('div');
      actions.className = 'pq-sound-modal-actions';

      function makeBtn(className, choice, label) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pq-sound-modal-btn ' + className;
        btn.setAttribute('data-choice', choice);
        btn.textContent = label;
        return btn;
      }

      // Required visual/order:
      // 1) Continue to next letter / Continue to video
      // 2) Return to video, if present
      // 3) Re-play letter
      // 4) Explainer
      const primaryBtn = makeBtn('pq-sound-primary', 'primary', primaryLabel);
      actions.appendChild(primaryBtn);

      let secondaryBtn = null;
      if (secondaryLabel) {
        secondaryBtn = makeBtn('pq-sound-secondary', 'secondary', secondaryLabel);
        actions.appendChild(secondaryBtn);
      }

      const replayBtn = makeBtn('pq-sound-replay', 'replay', replayLabel);
      actions.appendChild(replayBtn);

      const explainerBtn = makeBtn('pq-sound-explainer', 'explainer', explainerLabel);
      actions.appendChild(explainerBtn);

      card.appendChild(closeBtn);
      card.appendChild(img);
      card.appendChild(actions);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      function done(choice) {
        try { __pqStopSoundExplainer(); } catch (_e) {}
        try { overlay.remove(); } catch (_e) {}
        resolve(choice || 'primary');
      }

      explainerBtn.addEventListener('click', async function () {
        try {
          explainerBtn.disabled = true;
          explainerBtn.textContent = 'Playing explainer...';
          await __pqPlaySoundExplainer(key);
        } catch (_e) {
        } finally {
          try {
            explainerBtn.disabled = false;
            explainerBtn.textContent = explainerLabel;
          } catch (_e) {}
        }
      });

      replayBtn.addEventListener('click', async function () {
        try {
          replayBtn.disabled = true;
          replayBtn.textContent = 'Playing sound...';
          await playLetter(key, 1, rate);
        } catch (_e) {
        } finally {
          try {
            replayBtn.disabled = false;
            replayBtn.textContent = replayLabel;
          } catch (_e) {}
        }
      });

      primaryBtn.addEventListener('click', function () {
        done('primary');
      }, { once: true });

      if (secondaryBtn) {
        secondaryBtn.addEventListener('click', function () {
          done('secondary');
        }, { once: true });
      }

      closeBtn.addEventListener('click', function () {
        done('primary');
      }, { once: true });

      if (signal) {
        if (signal.aborted) {
          done('aborted');
          return;
        }

        signal.addEventListener('abort', function () {
          done('aborted');
        }, { once: true });
      }
    } catch (_e) {
      resolve('primary');
    }
  });
}

function __pqCloseSoundVideo() {
  try {
    if (player) {
      player.pause();
      player.removeAttribute('src');
      player.load();
    }
  } catch (_e) {}

  try {
    if (videoModal) {
      videoModal.style.display = 'none';
    }
  } catch (_e) {}
}

async function __pqPlaySoundGuidedFlow(key, url, rate, signal) {
  // Step 1: audio plays first automatically.
  await playLetter(key, 1, rate);

  // Step 2: after audio, show image modal with Replay + Continue to video.
  while (true) {
    const afterAudio = await __pqSoundModalChoice(key, {
      replay: 'Re-play letter',
      primary: 'Continue to video'
    }, signal, rate);

    if (afterAudio === 'aborted' || (signal && signal.aborted)) return false;

    if (afterAudio === 'primary') {
      break;
    }
  }

  // Step 3+: play video, close video, show final image modal.
  while (true) {
    await __pqPlayVideoUrl(url, rate);
    __pqCloseSoundVideo();

    const afterVideo = await __pqSoundModalChoice(key, {
      replay: 'Re-play letter',
      secondary: 'Return to video',
      primary: 'Continue to next letter'
    }, signal, rate);

    if (afterVideo === 'aborted' || (signal && signal.aborted)) return false;

    if (afterVideo === 'secondary') {
      continue; // replay video
    }

    return true; // next letter
  }
}

async function playWatchVideoForKey(key, rate, stepId, signal) {
  try { __pqSetPlayingTile(key); } catch (_e) {}

  const sid = String(stepId || '').toLowerCase();
  const map = (sid === 'animate') ? ANIMATE_VIDEO_BY_KEY : WATCH_VIDEO_BY_KEY;
  const url = map[key];

  if (!url) {
    throw new Error('Missing ' + (sid === 'animate' ? 'animate' : sid === 'sound' ? 'sound' : 'watch') + ' video URL for key: ' + key);
  }

  if (sid === 'sound') {
    return __pqPlaySoundGuidedFlow(key, url, rate, signal);
  }

  await __pqPlayVideoUrl(url, rate);
  return true;
}

  async function playAllWatch(stepIdOverride) {
    const controller = __pqStartPlayAllController();
    const signal = controller ? controller.signal : null;
    const rate = parseFloat(speedSel.value || DEFAULTS.speed);
    const stepId = String(stepIdOverride || 'watch').toLowerCase();
    const keys = stepId === 'animate'
  ? __pqGetPassSequenceKeys('animate', PLAY_SEQUENCE_KEYS)
  : stepId === 'sound'
    ? __pqGetPassSequenceKeys('sound', PLAY_SEQUENCE_KEYS)
    : __pqGetWatchSequenceKeys();

    if (!keys.length) return;

    playingAll = true;
    __watchPlaying = true;
    __watchPaused = false;
    paused = false;
    __pqSetPlaylistDimming(true);

    if (btnPlayAll) {
      btnPlayAll.disabled = true;
      btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
    }

    if (btnPause) {
      btnPause.disabled = false;
      btnPause.textContent = __PQ_TEXT_CACHE.pause;
    }

    try {
      await __pqStepDelay(stepId, 'beforeStartMs', signal);

      for (const key of keys) {
        __pqAssertNotAborted(signal);

        const idx = LETTERS.findIndex((item) => item.key === key);
        selectedIdx = idx;
        selectedKey = key;
        markActive();

        try {
          __pqSyncWriteUI();
        } catch (_e) {}

        alScrollToKey(key);
        await pauseGate(signal);
        __pqAssertNotAborted(signal);
        await playWatchVideoForKey(key, rate, stepId, signal);
        __pqAssertNotAborted(signal);

        try {
          handleLetterPlayedForCurrentStep(key);
        } catch (_e) {}

        await __pqStepDelay(stepId, 'betweenLettersMs', signal);
      }

      await __pqStepDelay(stepId, 'afterCompleteMs', signal);
      __pqCloseActiveMediaWindows();

      const current = getCurrentStep();
      if (current && current.step && (current.step.id === 'watch' || current.step.id === 'sound' || current.step.id === 'animate')) {
        await markPlaylistStepCompleted(current.step.id);
      }
    } catch (_e) {
      if (!_e || _e.name !== 'AbortError') {
        throw _e;
      }
    } finally {
      const stillOwner = !!(
        __playAllController &&
        controller &&
        __playAllController === controller
      );

      if (stillOwner) {
        __playAllController = null;
      }

      __pqSetPlaylistDimming(false);
      playingAll = false;
      __watchPlaying = false;
      __watchPaused = false;
      paused = false;

      try {
        if (player) {
          player.pause();
          player.removeAttribute('src');
          player.load();
        }
      } catch (_e) {}

      if (videoModal) {
        videoModal.style.display = 'none';
      }

      if (btnPlayAll) {
        btnPlayAll.disabled = false;
        btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
      }

      if (btnPause) {
        btnPause.disabled = false;
        btnPause.textContent = __PQ_TEXT_CACHE.pause;
      }
    }
  }

  function __pqGetVisibleSequenceKeys(stepIdOverride) {
    let fallback = [];

    try {
      const visible = new Set(
        [...(grid ? grid.querySelectorAll('.tile[data-key]') : [])]
          .map((el) => String(el.dataset.key || ''))
          .filter(Boolean)
      );

      const ordered = (PLAY_SEQUENCE_KEYS || []).filter((key) => visible.has(key));
      if (ordered.length) {
        fallback = ordered;
      }
    } catch (_e) {}

    if (!fallback.length) {
      try {
        fallback = [...(grid ? grid.querySelectorAll('.tile[data-key]') : [])]
          .map((el) => String(el.dataset.key || ''))
          .filter(Boolean);
      } catch (_e) {
        fallback = [];
      }
    }

    try {
      let sid = String(stepIdOverride || '').toLowerCase();

      if (!sid) {
        const current = getCurrentStep();
        sid = String((current && current.step && current.step.id) || '').toLowerCase();
      }

      return __pqGetPassSequenceKeys(sid, fallback);
    } catch (_e) {
      return fallback;
    }
  }

  
  function __pqGetStepRepeatPerLetter(stepId, fallback) {
    try {
      const sid = String(stepId || '').toLowerCase();
      const base = Math.max(1, Number(fallback || DEFAULTS.repeat || 1) || 1);
      const progress = (managedProgress && sid && managedProgress[sid]) || {};

      const raw =
        progress.repeatPerLetter ??
        progress.repeats_per_letter ??
        progress.repeat_per_letter ??
        progress.default_repeats_per_letter ??
        progress.defaultRepeatsPerLetter ??
        base;

      const n = Number(raw);
      return Number.isFinite(n) && n >= 1 ? Math.floor(n) : base;
    } catch (_e) {
      return Math.max(1, Number(fallback || DEFAULTS.repeat || 1) || 1);
    }
  }


function __pqGetManagedRepeatPerLetter(stepId, fallback) {
  try {
    const sid = String(stepId || '').toLowerCase();
    const base = Math.max(1, Number(fallback || 1) || 1);
    const progress = (managedProgress && sid && managedProgress[sid]) || null;

    if (!progress) return base;

    const raw =
      progress.repeatPerLetter ??
      progress.repeats_per_letter ??
      progress.repeat_per_letter ??
      progress.default_repeats_per_letter ??
      progress.defaultRepeatsPerLetter ??
      progress.repeatsPerLetter ??
      base;

    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : base;
  } catch (_e) {
    return Math.max(1, Number(fallback || 1) || 1);
  }
}


try {
  window.__pqDebugRepeat = function (stepId) {
    const sid = String(stepId || '').toLowerCase();
    const fallback = parseInt((repeatSel && repeatSel.value) || DEFAULTS.repeat || '1', 10) || 1;
    return {
      stepId: sid,
      dropdown: repeatSel ? repeatSel.value : null,
      progress: managedProgress && sid ? managedProgress[sid] : null,
      resolved: __pqGetManagedRepeatPerLetter(sid, fallback)
    };
  };
} catch (_e) {}


function __pqListenPlusCfg(key, fallback) {
  try {
    const lp = __cfg('listenPlus', {}) || {};
    if (!key) return lp;
    return lp[key] == null ? fallback : lp[key];
  } catch (_e) {
    return fallback;
  }
}

function __pqListenPlusUrl(base, name, ext) {
  try {
    name = String(name || '').trim();
    if (!name) return __pqAppendAssetVersion('');
    if (/^https?:\/\//i.test(name)) return __pqAppendAssetVersion(name);
    base = String(base || '').replace(/\/?$/, '/');
    if (/\.[a-z0-9]{2,5}$/i.test(name)) return __pqAppendAssetVersion(base + name);
    return __pqAppendAssetVersion(base + name + String(ext || ''));
  } catch (_e) {
    return __pqAppendAssetVersion('');
  }
}

function __pqEnsureListenPlusOverlay() {
  let el = document.getElementById('pqListenPlusAnimalOverlay');
  if (el) return el;
  const style = document.createElement('style');
  style.textContent = '#pqListenPlusAnimalOverlay{position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;pointer-events:none;background:rgba(8,15,28,.16);backdrop-filter:blur(2px)}#pqListenPlusAnimalOverlay .card{width:min(420px,88vw);border-radius:30px;background:linear-gradient(180deg,#fff,#fff7df);border:4px solid rgba(255,255,255,.92);box-shadow:0 24px 70px rgba(18,29,52,.28);padding:18px;text-align:center;transform:scale(.94);opacity:0;transition:opacity .18s ease,transform .18s ease}#pqListenPlusAnimalOverlay.show .card{opacity:1;transform:scale(1)}#pqListenPlusAnimalOverlay img{width:min(240px,58vw);height:min(220px,48vh);object-fit:contain;display:block;margin:0 auto 10px}.pq-lp-letter{display:inline-flex;align-items:center;justify-content:center;min-width:54px;height:54px;border-radius:18px;background:#e9f5ff;color:#1168a8;font-weight:1000;font-size:1.8rem;margin-right:10px}.pq-lp-animal{font-weight:1000;font-size:1.65rem;color:#17233b}.pq-lp-title{font-weight:900;color:#24324a;margin-bottom:8px}.pq-lp-sub{margin-top:6px;font-weight:800;color:#5b6780;font-size:.95rem}';
  document.head.appendChild(style);
  el = document.createElement('div');
  el.id = 'pqListenPlusAnimalOverlay';
  el.innerHTML = '<div class="card"><div class="pq-lp-title"></div><img alt=""><div><span class="pq-lp-letter"></span><span class="pq-lp-animal"></span></div><div class="pq-lp-sub"></div></div>';
  document.body.appendChild(el);
  return el;
}

function __pqHideListenPlusAnimal() {
  try {
    const el = document.getElementById('pqListenPlusAnimalOverlay');
    if (!el) return;
    el.classList.remove('show');
    setTimeout(function () { if (!el.classList.contains('show')) el.style.display = 'none'; }, 220);
  } catch (_e) {}
}

function __pqPlayListenPlusAudio(url, rate, timeoutMs, signal) {
  return new Promise(function (resolve) {
    try {
      if (!url || (signal && signal.aborted)) return resolve(false);
      const a = new Audio(url);
      let done = false;
      const finish = function (ok) {
        if (done) return;
        done = true;
        try { clearTimeout(timer); } catch (_e) {}
        try { a.pause(); a.removeAttribute('src'); a.load(); } catch (_e) {}
        resolve(!!ok);
      };
      const timer = setTimeout(function () { finish(false); }, Math.max(700, Number(timeoutMs || 3000)));
      if (signal) signal.addEventListener('abort', function () { finish(false); }, { once: true });
      a.playbackRate = Number(rate || 1) || 1;
      a.onended = function () { finish(true); };
      a.onerror = function () { finish(false); };
      const p = a.play();
      if (p && p.catch) p.catch(function () { finish(false); });
    } catch (_e) {
      resolve(false);
    }
  });
}

async function __pqMaybeRunListenPlusAnimal(stepId, key, rate, signal) {
  try {
    if (String(stepId || '').toLowerCase() !== 'listenplus') return false;
    if (__pqListenPlusCfg('enabled', true) === false) return false;
    const map = __pqListenPlusCfg('map', {}) || {};
    const item = map[String(key || '')];
    if (!item) return false;
    const imgUrl = __pqListenPlusUrl(__pqListenPlusCfg('imageBase', ''), item.image || item.img || '', __pqListenPlusCfg('imageExt', '.png'));
    const audioUrl = __pqListenPlusUrl(__pqListenPlusCfg('audioBase', ''), item.audio || '', __pqListenPlusCfg('audioExt', '.mp3'));
    const delayMs = Number(__cfg('playback.steps.listenplus.animalDelayMs', 220) || 0);
    const holdMs = Number(__cfg('playback.steps.listenplus.animalHoldMs', 650) || 0);
    const timeoutMs = Number(__cfg('playback.steps.listenplus.animalAudioTimeoutMs', 3000) || 3000);
    if (delayMs > 0) await __pqDelayWithAbort(delayMs, signal);
    __pqAssertNotAborted(signal);
    const el = __pqEnsureListenPlusOverlay();
    el.querySelector('.pq-lp-title').textContent = __pqListenPlusCfg('title', 'Listen+');
    el.querySelector('.pq-lp-letter').textContent = item.letter || '';
    el.querySelector('.pq-lp-animal').textContent = item.animal || '';
    el.querySelector('.pq-lp-sub').textContent = __pqListenPlusCfg('subtitle', '');
    const img = el.querySelector('img');
    img.alt = item.animal || 'Animal';
    img.src = imgUrl;
    el.style.display = 'flex';
    setTimeout(function () { el.classList.add('show'); }, 20);
    
const __wordsRepeats = Number(__cfg('playback.steps.words.anchorRepeats', 1) || 1);

for (let i = 0; i < __wordsRepeats; i++) {
  await __pqPlayListenPlusAudio(
    audioUrl,
    __cfg('playback.steps.words.anchorPlaybackRate', rate),
    timeoutMs,
    signal
  );
}

    __pqAssertNotAborted(signal);
    if (holdMs > 0) await __pqDelayWithAbort(holdMs, signal);
    __pqHideListenPlusAnimal();
    return true;
  } catch (e) {
    __pqHideListenPlusAnimal();
    if (e && e.name === 'AbortError') throw e;
    return false;
  }
}



function __pqGetWordsCfg(path, fallback) {
  try {
    const root = __cfg('words', {}) || {};
    if (!path) return root;
    const parts = String(path).split('.');
    let cur = root;
    for (const part of parts) {
      if (!cur || typeof cur !== 'object' || !(part in cur)) return fallback;
      cur = cur[part];
    }
    return cur == null ? fallback : cur;
  } catch (_e) {
    return fallback;
  }
}

function __pqWordsAssetUrl(base, value, ext) {
  try {
    const raw = String(value || '').trim();
    if (!raw) return __pqAppendAssetVersion('');
    if (/^https?:\/\//i.test(raw)) return __pqAppendAssetVersion(raw);
    const cleanBase = String(base || '').trim();
    if (!cleanBase) return __pqAppendAssetVersion('');
    const hasExt = /\.[a-z0-9]{2,5}(\?|#|$)/i.test(raw);
    return __pqAppendAssetVersion(cleanBase.replace(/\/?$/, '/') + raw + (hasExt ? '' : String(ext || '')));
  } catch (_e) { return __pqAppendAssetVersion(''); }
}

function __pqEnsureWordsOverlay() {
  try {
    let el = document.getElementById('pqWordsOverlay');
    if (el) return el;

    if (!document.getElementById('pqWordsOverlayCss')) {
      const style = document.createElement('style');
      style.id = 'pqWordsOverlayCss';
      style.textContent =
        '#pqWordsOverlay{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;pointer-events:none;background:rgba(8,15,28,.16);backdrop-filter:blur(2px)}' +
        '#pqWordsOverlay .pq-words-card{width:min(430px,88vw);border-radius:30px;background:linear-gradient(180deg,#fff 0%,#fff7df 100%);border:4px solid rgba(255,255,255,.92);box-shadow:0 24px 70px rgba(18,29,52,.28);padding:18px;text-align:center;transform:translateY(12px) scale(.94);opacity:0;transition:opacity .18s ease,transform .18s ease;direction:rtl}' +
        '#pqWordsOverlay.pq-show .pq-words-card{opacity:1;transform:translateY(0) scale(1)}' +
        '#pqWordsOverlay .pq-words-title{font-weight:900;font-size:1.05rem;color:#24324a;margin-bottom:8px}' +
        '#pqWordsOverlay .pq-words-img{width:min(240px,58vw);height:min(220px,48vh);object-fit:contain;display:block;margin:0 auto 10px}' +
        '#pqWordsOverlay .pq-words-letter{display:inline-flex;align-items:center;justify-content:center;min-width:58px;height:58px;border-radius:18px;background:#fff0d6;color:#9a4f00;font-weight:1000;font-size:2.1rem;margin-left:10px;vertical-align:middle;font-family:"Noto Sans Arabic","Amiri",system-ui,sans-serif}' +
        '#pqWordsOverlay .pq-words-word{font-weight:1000;font-size:2.05rem;color:#17233b;vertical-align:middle;font-family:"Noto Sans Arabic","Amiri",system-ui,sans-serif}' +
        '#pqWordsOverlay .pq-words-sub{margin-top:6px;font-weight:800;color:#5b6780;font-size:.95rem;direction:ltr}';
      document.head.appendChild(style);
    }

    el = document.createElement('div');
    el.id = 'pqWordsOverlay';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="pq-words-card"><div class="pq-words-title"></div><img class="pq-words-img" alt=""><div><span class="pq-words-letter"></span><span class="pq-words-word"></span></div><div class="pq-words-sub"></div></div>';
    document.body.appendChild(el);
    return el;
  } catch (_e) { return null; }
}

function __pqShowWordsItem(meta) {
  try {
    const el = __pqEnsureWordsOverlay();
    if (!el || !meta) return null;
    const title = el.querySelector('.pq-words-title');
    const img = el.querySelector('.pq-words-img');
    const letter = el.querySelector('.pq-words-letter');
    const word = el.querySelector('.pq-words-word');
    const sub = el.querySelector('.pq-words-sub');

    if (title) title.textContent = __pqGetWordsCfg('title', 'Words');
    if (letter) letter.textContent = String(meta.letter || '').trim();
    if (word) word.textContent = String(meta.word || '').trim();
    if (sub) sub.textContent = __pqGetWordsCfg('subtitle', '');
    if (img) {
      img.alt = String(meta.word || 'Word');
      if (meta.imageUrl) { img.style.display = 'block'; img.src = meta.imageUrl; }
      else { img.style.display = 'none'; img.removeAttribute('src'); }
    }

    el.style.display = 'flex';
    window.setTimeout(function () { try { el.classList.add('pq-show'); } catch (_e) {} }, 20);
    return el;
  } catch (_e) { return null; }
}

function __pqHideWordsItem() {
  try {
    const el = document.getElementById('pqWordsOverlay');
    if (!el) return;
    el.classList.remove('pq-show');
    window.setTimeout(function () {
      try { if (!el.classList.contains('pq-show')) el.style.display = 'none'; } catch (_e) {}
    }, 220);
  } catch (_e) {}
}

async function __pqMaybeRunWordsItem(stepId, key, rate, signal) {
  try {
    if (String(stepId || '').toLowerCase() !== 'words') return false;
    if (__pqGetWordsCfg('enabled', true) === false) return false;

    const item = (__pqGetWordsCfg('map', {}) || {})[String(key || '')];
    if (!item) return false;

    const imageUrl = __pqWordsAssetUrl(__pqGetWordsCfg('imageBase', ''), item.image || item.img || '', __pqGetWordsCfg('imageExt', '.png'));
    const audioUrl = __pqWordsAssetUrl(__pqGetWordsCfg('audioBase', ''), item.audio || '', __pqGetWordsCfg('audioExt', '.mp3'));

    const delayMs = Number(__cfg('playback.steps.words.wordDelayMs', 220) || 0);
    const holdMs = Number(__cfg('playback.steps.words.wordHoldMs', 650) || 0);
    const timeoutMs = Number(__cfg('playback.steps.words.wordAudioTimeoutMs', 3000) || 3000);

    if (delayMs > 0) await __pqDelayWithAbort(delayMs, signal);
    __pqAssertNotAborted(signal);

    __pqShowWordsItem({ letter: item.letter || '', word: item.word || '', imageUrl });
    
const __lpRepeats = Number(__cfg('playback.steps.listenplus.anchorRepeats', 1) || 1);

for (let i = 0; i < __lpRepeats; i++) {
  await __pqPlayListenPlusAudio(
    audioUrl,
    __cfg('playback.steps.listenplus.anchorPlaybackRate', rate),
    timeoutMs,
    signal
  );
}


    __pqAssertNotAborted(signal);
    if (holdMs > 0) await __pqDelayWithAbort(holdMs, signal);

    __pqHideWordsItem();
    return true;
  } catch (_e) {
    try { __pqHideWordsItem(); } catch (_ignore) {}
    if (_e && _e.name === 'AbortError') throw _e;
    return false;
  }
}


/* ============================================================
   REPEAT STEP — LIGHT STUDENT RECORDING
   First letter requires Record click; next letters auto-record.
   ============================================================ */

const __pqRepeatRecordState = {
  stream: null,
  autoMode: false,
  attempts: Object.create(null),
  currentBlobUrl: '',
  isRecording: false
};

function __pqRepeatRecordCfg(key, fallback) {
  try {
    const root = __cfg('repeatRecording', {}) || {};
    if (!key) return root;
    return root[key] == null ? fallback : root[key];
  } catch (_e) {
    return fallback;
  }
}

function __pqEnsureRepeatRecordUi() {
  let el = document.getElementById('pqRepeatRecordOverlay');
  if (el) return el;

  if (!document.getElementById('pqRepeatRecordOverlayCss')) {
    const style = document.createElement('style');
    style.id = 'pqRepeatRecordOverlayCss';
    style.textContent = [
      '#pqRepeatRecordOverlay{position:fixed;inset:0;z-index:2147482900;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(12,18,31,.48);backdrop-filter:blur(4px)}',
      '#pqRepeatRecordOverlay .pq-repeat-card{width:min(440px,92vw);border-radius:28px;background:#fffdf7;box-shadow:0 24px 70px rgba(18,29,52,.30);padding:22px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif}',
      '#pqRepeatRecordOverlay .pq-repeat-title{font-weight:1000;font-size:1.25rem;color:#17233b;margin-bottom:8px}',
      '#pqRepeatRecordOverlay .pq-repeat-letter{font-family:"Noto Sans Arabic","Amiri",serif;font-weight:1000;font-size:4rem;line-height:1;color:#173f2b;margin:8px 0}',
      '#pqRepeatRecordOverlay .pq-repeat-msg{font-weight:800;color:#31425d;margin:8px 0 16px}',
      '#pqRepeatRecordOverlay .pq-repeat-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}',
      '#pqRepeatRecordOverlay button{border:0;border-radius:20px;padding:14px 22px;font-weight:1000;font-size:1rem;cursor:pointer}',
      '#pqRepeatRecordOverlay .pq-repeat-record{background:#eaf7ef;color:#0b5132;box-shadow:0 10px 22px rgba(57,100,184,.16)}',
      '#pqRepeatRecordOverlay button:disabled{opacity:.65;cursor:wait}'
    ].join('\n');
    document.head.appendChild(style);
  }

  el = document.createElement('div');
  el.id = 'pqRepeatRecordOverlay';
  el.innerHTML = [
    '<div class="pq-repeat-card" role="dialog" aria-modal="true">',
      '<div class="pq-repeat-title">Your turn — repeat the letter</div>',
      '<div class="pq-repeat-letter"></div>',
      '<div class="pq-repeat-msg">Tap Record, then say the letter.</div>',
      '<div class="pq-repeat-actions">',
        '<button type="button" class="pq-repeat-record">🎤 Record</button>',
      '</div>',
    '</div>'
  ].join('');

  document.body.appendChild(el);
  return el;
}

function __pqShowRepeatRecordUi(key, message) {
  const el = __pqEnsureRepeatRecordUi();
  try {
    const letter = (LETTERS || []).find(function (item) {
      return item && String(item.key) === String(key);
    });

    const txt =
      (letter && (letter.text || letter.ar || letter.letter)) ||
      String(key || '');

    el.querySelector('.pq-repeat-letter').textContent = txt;
    el.querySelector('.pq-repeat-msg').textContent = message || 'Tap Record, then say the letter.';
    el.style.display = 'flex';
  } catch (_e) {}

  return el;
}

function __pqHideRepeatRecordUi() {
  try {
    const el = document.getElementById('pqRepeatRecordOverlay');
    if (el) el.style.display = 'none';
  } catch (_e) {}
}

async function __pqEnsureRepeatMicStream() {
  if (__pqRepeatRecordState.stream) return __pqRepeatRecordState.stream;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Microphone recording is not supported in this browser.');
  }

  __pqRepeatRecordState.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return __pqRepeatRecordState.stream;
}

function __pqRecordRepeatOnce(stream, ms, signal) {
  return new Promise(function (resolve) {
    try {
      if (!stream || (signal && signal.aborted)) {
        resolve(null);
        return;
      }

      const chunks = [];
      const rec = new MediaRecorder(stream);
      let stopped = false;

      function stopSafe() {
        if (stopped) return;
        stopped = true;
        try {
          if (rec.state !== 'inactive') rec.stop();
        } catch (_e) {
          resolve(null);
        }
      }

      rec.ondataavailable = function (ev) {
        try {
          if (ev && ev.data && ev.data.size > 0) chunks.push(ev.data);
        } catch (_e) {}
      };

      rec.onstop = function () {
        try {
          const blob = chunks.length ? new Blob(chunks, { type: rec.mimeType || 'audio/webm' }) : null;
          resolve(blob);
        } catch (_e) {
          resolve(null);
        }
      };

      rec.onerror = function () {
        resolve(null);
      };

      if (signal) {
        signal.addEventListener('abort', stopSafe, { once: true });
      }

      rec.start();
      window.setTimeout(stopSafe, Math.max(600, Number(ms || 1400) || 1400));
    } catch (_e) {
      resolve(null);
    }
  });
}

async function __pqPlayRepeatStudentBlob(blob) {
  try {
    if (!blob) return false;

    if (__pqRepeatRecordState.currentBlobUrl) {
      try { URL.revokeObjectURL(__pqRepeatRecordState.currentBlobUrl); } catch (_e) {}
      __pqRepeatRecordState.currentBlobUrl = '';
    }

    const url = URL.createObjectURL(blob);
    __pqRepeatRecordState.currentBlobUrl = url;

    const a = new Audio(url);

    await new Promise(function (resolve) {
      let done = false;

      function finish() {
        if (done) return;
        done = true;
        try { a.pause(); } catch (_e) {}
        resolve();
      }

      a.onended = finish;
      a.onerror = finish;

      const p = a.play();
      if (p && p.catch) p.catch(finish);
    });

    return true;
  } catch (_e) {
    return false;
  }
}

async function __pqRepeatRecordAttempt(key, rate, signal) {
  try {
    if (signal && signal.aborted) return false;

    if (__pqRepeatRecordCfg('enabled', true) === false) return true;

    const ms = Number(__pqRepeatRecordCfg('recordMs', 1400) || 1400);
    const replayStudent = __pqRepeatRecordCfg('replayStudent', true) !== false;

    const el = __pqShowRepeatRecordUi(
      key,
      __pqRepeatRecordState.autoMode
        ? 'Recording starts now. Say the letter.'
        : 'Tap Record, then say the letter.'
    );

    const recordBtn = el.querySelector('.pq-repeat-record');

    async function runRecording() {
      try {
        __pqRepeatRecordState.isRecording = true;

        if (recordBtn) {
          recordBtn.disabled = true;
          recordBtn.textContent = '🔴 Recording...';
        }

        const stream = await __pqEnsureRepeatMicStream();
        __pqRepeatRecordState.autoMode = true;

        const blob = await __pqRecordRepeatOnce(stream, ms, signal);

        __pqRepeatRecordState.attempts[String(key)] = {
          at: Date.now(),
          ok: !!blob,
          size: blob ? blob.size : 0
        };

        if (recordBtn) {
          recordBtn.textContent = blob ? '✅ Recorded' : '⚠️ Try again';
        }

        if (blob && replayStudent) {
          try { el.querySelector('.pq-repeat-msg').textContent = 'Good! Listen to your voice.'; } catch (_e) {}
          await __pqPlayRepeatStudentBlob(blob);
        }

        return !!blob;
      } catch (_e) {
        try { el.querySelector('.pq-repeat-msg').textContent = 'Microphone was not ready. Tap Record again.'; } catch (_ignore) {}
        if (recordBtn) {
          recordBtn.disabled = false;
          recordBtn.textContent = '🎤 Record';
        }
        return false;
      } finally {
        __pqRepeatRecordState.isRecording = false;
      }
    }

    if (__pqRepeatRecordState.autoMode) {
      await __pqDelayWithAbort(Number(__pqRepeatRecordCfg('autoStartDelayMs', 450) || 450), signal);
      const ok = await runRecording();
      __pqHideRepeatRecordUi();
      return ok;
    }

    return await new Promise(function (resolve) {
      let resolved = false;

      function finish(ok) {
        if (resolved) return;
        resolved = true;
        __pqHideRepeatRecordUi();
        resolve(!!ok);
      }

      if (signal) {
        if (signal.aborted) {
          finish(false);
          return;
        }

        signal.addEventListener('abort', function () {
          finish(false);
        }, { once: true });
      }

      if (!recordBtn) {
        finish(false);
        return;
      }

      recordBtn.disabled = false;
      recordBtn.textContent = '🎤 Record';

      recordBtn.addEventListener('click', async function () {
        const ok = await runRecording();
        finish(ok);
      }, { once: true });
    });
  } catch (_e) {
    try { __pqHideRepeatRecordUi(); } catch (_ignore) {}
    return false;
  }
}

async function __pqPlayAllPlaylistLocal(stepId) {
    const controller = __pqStartPlayAllController();
    const signal = controller ? controller.signal : null;

    const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1');
    const finalStepId = String(stepId || '').toLowerCase();
    const repeatFallback = parseInt((repeatSel && repeatSel.value) || DEFAULTS.repeat || '1', 10) || 1;
    const repeatCount = __pqGetStepRepeatPerLetter(finalStepId, repeatFallback);
    const keys = __pqGetVisibleSequenceKeys(finalStepId);

    if (!keys.length) return;

    playingAll = true;
    paused = false;
    __pqSetPlaylistDimming(false);

    try {
      if (btnPause) {
        btnPause.disabled = false;
        btnPause.textContent = __PQ_TEXT_CACHE.pause;
      }
    } catch (_e) {}

    try {
      if (btnPlayAll) {
        btnPlayAll.disabled = true;
        btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
      }
    } catch (_e) {}

    try {
      await __pqStepDelay(finalStepId, 'beforeStartMs', signal);

      for (const key of keys) {
        __pqAssertNotAborted(signal);

        try {
          const tile = grid
            ? grid.querySelector('.tile[data-key="' + String(key).replace(/"/g, '\\\"') + '"]')
            : null;

          const gidx = tile ? Number(tile.dataset.gidx || -1) : -1;
          selectedIdx = Number.isFinite(gidx) ? gidx : -1;
          selectedKey = key;

          markActive();

          try {
            if (typeof __pqSetPlayingTile === 'function') {
              __pqSetPlayingTile(key);
            }
          } catch (_e) {}

          try {
            __pqSyncWriteUI();
          } catch (_e) {}

          alScrollToKey(key);
        } catch (_e) {}

        await pauseGate(signal);
        __pqAssertNotAborted(signal);

        await playLetter(key, repeatCount, rate);

        if (finalStepId === 'repeat') {
          await __pqRepeatRecordAttempt(key, rate, signal);
        }

        __pqAssertNotAborted(signal);

        await __pqMaybeRunListenPlusAnimal(finalStepId, key, rate, signal);

        __pqAssertNotAborted(signal);

        await __pqMaybeRunWordsItem(finalStepId, key, rate, signal);

        __pqAssertNotAborted(signal);

        try {
          handleLetterPlayedForCurrentStep(key);
        } catch (_e) {}

        await __pqStepDelay(finalStepId, 'betweenLettersMs', signal);
      }

      await __pqStepDelay(finalStepId, 'afterCompleteMs', signal);
      __pqCloseActiveMediaWindows();

      const current = getCurrentStep();
      const resolvedStepId = String(
        (current && current.step && current.step.id) || finalStepId || ''
      );

      if (resolvedStepId) {
        await markPlaylistStepCompleted(resolvedStepId);
      }
    } catch (_e) {
      if (!_e || _e.name !== 'AbortError') {
        throw _e;
      }
    } finally {
      const stillOwner = !!(
        __playAllController &&
        controller &&
        __playAllController === controller
      );

      if (stillOwner) {
        __playAllController = null;
      }

      __pqSetPlaylistDimming(false);
      playingAll = false;
      paused = false;

      try {
        if (typeof __pqClearPlayingTile === 'function') {
          __pqClearPlayingTile();
        }
      } catch (_e) {}

      try {
        if (btnPlayAll) {
          btnPlayAll.disabled = false;
          btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
        }
      } catch (_e) {}

      try {
        if (btnPause) {
          btnPause.disabled = false;
          btnPause.textContent = __PQ_TEXT_CACHE.pause;
        }
      } catch (_e) {}
    }
  }

async function __pqRunMatchStep() {
  if (!window.PQSharedMatchEngine) return;

  const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1') || 1;

  return PQSharedMatchEngine.mount({
    cfg: UNIT_CFG,
    stepId: 'match',
    gridId: 'grid',

    getSequenceKeys: function () {
      return __pqGetPassSequenceKeys('match', PLAY_SEQUENCE_KEYS);
    },

    playAudioForKey: function (key) {
          // PATCH_PLAYING_TILE_IN_MATCH_AUDIO
          try { __pqSetPlayingTile(key); } catch (_e) {}
      return playLetterOnce(key, rate);
    },

    onComplete: function () {
      completeCurrentStep();
    }
  });
}


  /* ===== PQ PLAYING TILE EFFECT HELPERS START ===== */
  
  /* ===== PQ PLAYING TILE EFFECT CSS START ===== */
  function __pqInjectPlayingTileEffectCss() {
    try {
      if (document.getElementById('pqPlayingTileEffectCss')) return;

      const style = document.createElement('style');
      style.id = 'pqPlayingTileEffectCss';

      style.textContent = [
        '.tile.pq-playing{',
        '  animation:pqTilePlayBounce 850ms ease-in-out both !important;',
        '  box-shadow:0 0 0 5px rgba(255,255,255,.95),0 0 0 12px rgba(34,193,232,.58),0 18px 34px rgba(13,35,69,.30) !important;',
        '  transform:translateY(-8px) scale(1.08) !important;',
        '  z-index:30 !important;',
        '}',
        '@keyframes pqTilePlayBounce{',
        '  0%{transform:translateY(0) scale(1);}',
        '  35%{transform:translateY(-12px) scale(1.10);}',
        '  65%{transform:translateY(-7px) scale(1.06);}',
        '  100%{transform:translateY(-8px) scale(1.08);}',
        '}'
      ].join('\n');

      document.head.appendChild(style);
    } catch (_e) {}
  }
  /* ===== PQ PLAYING TILE EFFECT CSS END ===== */

function __pqClearPlayingTile() {
    try {
      document.querySelectorAll('.tile.pq-playing').forEach(function (tile) {
        tile.classList.remove('pq-playing');
      });
    } catch (_e) {}
  }

  function __pqSetPlayingTile(key) {
    __pqInjectPlayingTileEffectCss();
    try {
      __pqClearPlayingTile();

      const safeKey = String(key || '');
      if (!safeKey) return;

      const tile = document.querySelector('.tile[data-key="' + safeKey.replace(/"/g, '\\"') + '"]');
      if (!tile) return;

      tile.classList.add('pq-playing');

      const cfgEffect =
        (typeof UNIT_CFG !== 'undefined' && UNIT_CFG && UNIT_CFG.activeTileEffect) ||
        (typeof cfg !== 'undefined' && cfg && cfg.activeTileEffect) ||
        {};

      const duration = Number(cfgEffect.durationMs || 900);

      window.setTimeout(function () {
        try {
          tile.classList.remove('pq-playing');
        } catch (_e) {}
      }, Math.max(250, duration));
    } catch (_e) {}
  }
  /* ===== PQ PLAYING TILE EFFECT HELPERS END ===== */

async function playAll() {
  try {
    const current = getCurrentStep();
    const stepId = String((current && current.step && current.step.id) || '').toLowerCase();

    if (__pqLastPlayAllStepId !== stepId) {
      __pqLastPlayAllStepId = stepId;
      __pqPlaylistEngine = null;
      paused = false;
      __watchPaused = false;
      __watchPlaying = false;

      try {
        if (btnPause) {
          btnPause.textContent = __PQ_TEXT_CACHE.pause;
        }
      } catch (_e) {}
    }

    __pqCancelPlayAll();

    if (current && __pqIsWatchStep(current.step)) {
      return playAllWatch(stepId);
    }

    if (stepId === 'match') {
      return __pqRunMatchStep();
    }

    if (
  current &&
  current.step &&
  (
    current.step.type === 'playlist' ||
    stepId === 'listenplus' ||
    stepId === 'words'
  )
) {
  return __pqPlayAllPlaylistLocal(stepId);
}
	
  } catch (_e) {}

  return undefined;
}

  // ============================================================
  // PART 2 END
  // ============================================================


// Part 3 of 3
// This part covers:
// 28) Managed progress runtime helpers
// 29) Stepper rendering
// 30) UI bindings
// 31) Shell/runtime orchestration
// 32) Startup
// ============================================================

  // ============================================================
  // SECTION 28: Managed progress runtime helpers
  // ============================================================
function __pqNormalizeCurrentStepId() {
  try {
    if (!managedProgress) return;

    const stepsArr = (STEPS || []);
    if (!stepsArr.length) return;

    const isValid = (id) => !!id && stepsArr.some((step) => step.id === id);
    let currentId = managedProgress.currentStepId;

    // In review mode, preserve the explicitly selected review step.
    // Outside review mode, always point to the first incomplete step.
    if (__pqIsReviewMode()) {
      const stickyId = String(__pqStickyReviewStepId || '').trim();

      if (isValid(stickyId)) {
        managedProgress.currentStepId = stickyId;
        currentId = stickyId;
      } else if (!isValid(currentId)) {
        managedProgress.currentStepId = stepsArr[0].id;
        currentId = managedProgress.currentStepId;
      }
    } else if (
      !isValid(currentId) ||
      (managedProgress[currentId] && managedProgress[currentId].completed)
    ) {
      let nextId = null;
	  

      for (const step of stepsArr) {
        const progress = managedProgress[step.id];
        if (progress && !progress.completed) {
          nextId = step.id;
          break;
        }
      }

      managedProgress.currentStepId =
        nextId || stepsArr[stepsArr.length - 1].id;
    }

    managedProgress.__finished = stepsArr.every(
      (step) => !!(managedProgress[step.id] && managedProgress[step.id].completed)
    );

    try {
      const nextStepId = String(managedProgress.currentStepId || '');

      if (__pqLastStepIdForPlaylistReset !== nextStepId) {
        __pqLastStepIdForPlaylistReset = nextStepId;
        __pqPlaylistEngine = null;
        paused = false;
        __watchPaused = false;
        __watchPlaying = false;

        try {
          if (btnPause) {
            btnPause.textContent = __PQ_TEXT_CACHE.pause;
          }
        } catch (_e) {}
      }
    } catch (_e) {}
  } catch (_e) {}
}

  function getCurrentStep() {
    __pqNormalizeCurrentStepId();

    const id = managedProgress && managedProgress.currentStepId;
    const step =
      (STEPS || []).find((s) => s.id === id) ||
      (STEPS && STEPS[0]) ||
      null;

    return {
      step,
      progress: (managedProgress && step) ? managedProgress[step.id] : null
    };
  }

function __pqForceWriteButtonRefresh() {
  try {
    const sync = () => {
      const api = __pqEnsureSharedWrite();
      try {
        if (api) api.syncUI();
      } catch (_e) {}
    };

    sync();

    requestAnimationFrame(() => {
      sync();
      setTimeout(sync, 0);
    });
  } catch (_e) {}

  try { __pqSyncDynamicStepAction(); } catch (_e) {}
}
function __pqWaitUntil(testFn, timeoutMs, intervalMs) {
  return new Promise(function (resolve) {
    const started = Date.now();
    const gap = Math.max(60, Number(intervalMs) || 120);
    const limit = Math.max(800, Number(timeoutMs) || 8000);

    function check() {
      let ok = false;

      try {
        ok = !!testFn();
      } catch (_e) {
        ok = false;
      }

      if (ok) {
        resolve(true);
        return;
      }

      if ((Date.now() - started) >= limit) {
        resolve(false);
        return;
      }

      setTimeout(check, gap);
    }

    check();
  });
}

let __pqSpeakUiState = {
  selectedKey: '',
  completedKeys: {},
  totalKeys: 0,
  isRecording: false,
  lastRecordingAt: 0,
  silenceStopTimer: null,
  silenceWatchTimer: null
};


function __pqSpeakDoneStorageKeyFinal() {
  try {
    return __pqStorageKey('speakDoneKeys', 'pq_speak_done_keys_' + __PQ_UNIT_ID);
  } catch (_e) {
    return 'pq_speak_done_keys_' + __PQ_UNIT_ID;
  }
}

function __pqSpeakLoadDoneMapFinal() {
  try {
    const raw = localStorage.getItem(__pqSpeakDoneStorageKeyFinal());
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_e) {
    return {};
  }
}

function __pqSpeakSaveDoneMapFinal() {
  try {
    localStorage.setItem(
      __pqSpeakDoneStorageKeyFinal(),
      JSON.stringify(__pqSpeakUiState.completedKeys || {})
    );
  } catch (_e) {}
}

function __pqSpeakCssKeyFinal(key) {
  key = String(key || '');
  try {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(key);
  } catch (_e) {}
  return key.replace(/["\\]/g, '\\$&');
}

function __pqSpeakTotalFinal() {
  try { if (Array.isArray(PLAY_SEQUENCE_KEYS) && PLAY_SEQUENCE_KEYS.length) return PLAY_SEQUENCE_KEYS.length; } catch (_e) {}
  try { if (Array.isArray(LETTERS) && LETTERS.length) return LETTERS.length; } catch (_e) {}
  try { return document.querySelectorAll('#grid .tile[data-key]').length || 0; } catch (_e) {}
  return 0;
}

function __pqSpeakGreyTileFinal(key) {
  try {
    key = String(key || '').trim();
    if (!key) return;

    const tile = document.querySelector('#grid .tile[data-key="' + __pqSpeakCssKeyFinal(key) + '"]');
    if (!tile) return;

    tile.classList.add('played', 'completed', 'pq-speak-done');
    tile.classList.remove('pq-playing', 'is-playing');

    if (String(__pqSpeakUiState.selectedKey || '') !== key) {
      tile.classList.remove('active');
    }

    tile.setAttribute('data-speak-done', '1');
    tile.style.opacity = '0.45';
    tile.style.filter = 'grayscale(0.25)';
  } catch (_e) {}
}

function __pqSpeakApplyDoneTilesFinal() {
  try {
    const doneMap = __pqSpeakUiState.completedKeys || {};
    Object.keys(doneMap).forEach(function (key) {
      if (doneMap[key]) __pqSpeakGreyTileFinal(key);
    });
  } catch (_e) {}
}

function __pqSpeakRefreshProgressFinal() {
  try {
    const done = __pqSpeakCompletedCount();
    const total = Number(__pqSpeakUiState.totalKeys || 0) || __pqSpeakTotalFinal();
    const text = done + '/' + total;

    const badge = document.getElementById('pqSpeakProgressBadge');
    if (badge) badge.textContent = text;

    const chip = document.getElementById('pqSpeakProgressChip');
    if (chip) chip.textContent = 'Done ' + text;
  } catch (_e) {}
}

function __pqSpeakFinalizeDoneFinal() {
  try {
    const key = String(__pqSpeakUiState.selectedKey || '').trim();
    if (!key) return false;

    if (!__pqSpeakUiState.completedKeys || typeof __pqSpeakUiState.completedKeys !== 'object') {
      __pqSpeakUiState.completedKeys = {};
    }

    __pqSpeakUiState.completedKeys[key] = true;
    __pqSpeakSaveDoneMapFinal();
    __pqSpeakGreyTileFinal(key);
    __pqSpeakRefreshProgressFinal();
    try { __pqSpeakSyncManagedProgressFromDoneKeys(true); } catch (_e) {}

    setTimeout(function(){ try { __pqSpeakGreyTileFinal(key); __pqSpeakRefreshProgressFinal(); } catch (_e) {} }, 80);
    setTimeout(function(){ try { __pqSpeakGreyTileFinal(key); __pqSpeakRefreshProgressFinal(); } catch (_e) {} }, 300);
    setTimeout(function(){ try { __pqSpeakGreyTileFinal(key); __pqSpeakRefreshProgressFinal(); } catch (_e) {} }, 800);

    return true;
  } catch (_e) {
    return false;
  }
}

function __pqSpeakInstallDoneBinderFinal(compareBtn) {
  try {
    if (!compareBtn || compareBtn.__pqSpeakDoneBinderFinal__) return;
    compareBtn.__pqSpeakDoneBinderFinal__ = true;

    compareBtn.addEventListener('click', function () {
      setTimeout(function () {
        try { __pqSpeakFinalizeDoneFinal(); } catch (_e) {}
      }, 40);
    }, true);
  } catch (_e) {}
}


function __pqSpeakEnsureStateShape() {
  try {
    const saved = __pqSpeakLoadDoneMapFinal();

    if (!__pqSpeakUiState.completedKeys || typeof __pqSpeakUiState.completedKeys !== 'object') {
      __pqSpeakUiState.completedKeys = {};
    }

    Object.keys(saved).forEach(function (key) {
      if (saved[key]) __pqSpeakUiState.completedKeys[key] = true;
    });

    __pqSpeakUiState.totalKeys = __pqSpeakTotalFinal();
  } catch (_e) {}
}





function __pqSpeakCompletedCount() {
  try {
    __pqSpeakEnsureStateShape();

    return Object.keys(__pqSpeakUiState.completedKeys || {}).filter(function (key) {
      return !!__pqSpeakUiState.completedKeys[key];
    }).length;
  } catch (_e) {
    return 0;
  }
}

function __pqSpeakIsKeyCompleted(key) {
  try {
    key = String(key || '').trim();
    if (!key) return false;

    __pqSpeakEnsureStateShape();
    return !!(
      __pqSpeakUiState &&
      __pqSpeakUiState.completedKeys &&
      __pqSpeakUiState.completedKeys[key]
    );
  } catch (_e) {
    return false;
  }
}

async function __pqSpeakSyncManagedProgressFromDoneKeys(shouldPersist) {
  try {
    __pqSpeakEnsureStateShape();

    if (!managedProgress || !managedProgress.speak) return false;

    const total = Math.max(1, Number(__pqSpeakTotalFinal()) || 1);
    const done = Math.min(total, Math.max(0, Number(__pqSpeakCompletedCount()) || 0));
    const progress = managedProgress.speak;

    progress.passesRequired = total;
    progress.passesDone = done;
    progress.completed = done >= total;

    if (progress.completed) {
      try {
        advanceStepIfNeeded();
      } catch (_e) {}
    }

    try { renderStepper(); } catch (_e) {}
    try { __pqSpeakRefreshProgressFinal(); } catch (_e) {}
    try { __pqSpeakFinalRefreshProgress(); } catch (_e) {}

    if (shouldPersist) {
      try {
        await sendManagedToMoodle(managedProgress);
      } catch (_e) {}

      await persistManagedProgress();
    }

    return true;
  } catch (_e) {
    return false;
  }
}




function __pqSpeakMarkCurrentDone() {
  return __pqSpeakFinalizeDoneFinal();
}


function __pqSpeakSetSelectedKey(key) {
  try {
    __pqSpeakUiState.selectedKey = String(key || '').trim();
  } catch (_e) {}
}

function __pqSpeakClearRecordingTimers() {
  try {
    if (__pqSpeakUiState.silenceStopTimer) {
      clearTimeout(__pqSpeakUiState.silenceStopTimer);
    }
  } catch (_e) {}
  try {
    if (__pqSpeakUiState.silenceWatchTimer) {
      clearInterval(__pqSpeakUiState.silenceWatchTimer);
    }
  } catch (_e) {}

  __pqSpeakUiState.silenceStopTimer = null;
  __pqSpeakUiState.silenceWatchTimer = null;
}

function __pqSpeakStopRecordingVisualOnly() {
  try {
    __pqSpeakUiState.isRecording = false;
    __pqSpeakUiState.lastRecordingAt = Date.now();
    __pqSpeakClearRecordingTimers();
    __pqSyncSimplifiedSpeakUi();
  } catch (_e) {}
}

function __pqSpeakStartSilenceAutoStop() {
  try {
    __pqSpeakClearRecordingTimers();

    __pqSpeakUiState.silenceStopTimer = setTimeout(function () {
      try {
        const recordBtn = document.getElementById('pqSpeakBtnRecord');
        if (recordBtn) {
          try { recordBtn.click(); } catch (_e) {}
        }
      } catch (_e) {}

      __pqSpeakStopRecordingVisualOnly();
    }, 2000);
  } catch (_e) {}
}

function __pqSetSpeakButtonVisualHidden(btn, hidden) {
  try {
    if (!btn) return;

    if (hidden) {
      btn.setAttribute('aria-hidden', 'true');
      btn.tabIndex = -1;
      btn.style.position = 'absolute';
      btn.style.left = '-9999px';
      btn.style.top = '0';
      btn.style.width = '1px';
      btn.style.height = '1px';
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
    } else {
      btn.removeAttribute('aria-hidden');
      btn.tabIndex = 0;
      btn.style.position = '';
      btn.style.left = '';
      btn.style.top = '';
      btn.style.width = '';
      btn.style.height = '';
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
    }
  } catch (_e) {}
}

function __pqEnsureSpeakIconToolbar() {
  try {
    const panel =
      document.getElementById('pqSpeakPanel') ||
      document.getElementById('speakMount');

    if (!panel) return null;

    let style = document.getElementById('pqSpeakIconToolbarStyle');

    if (!style) {
      style = document.createElement('style');
      style.id = 'pqSpeakIconToolbarStyle';
      style.textContent = `
#pqSpeakIconToolbar{
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:10px;
  flex-wrap:nowrap;
  width:100%;
  margin:10px 0 6px 0;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
}

.pq-speak-icon-btn,
.pq-speak-progress-badge{
  width:44px;
  min-width:44px;
  height:44px;
  border-radius:12px;
  display:inline-flex !important;
  align-items:center;
  justify-content:center;
  box-sizing:border-box;
  line-height:1;
  font-weight:800;
}

.pq-speak-icon-btn{
  border:1px solid #d9e2f1;
  background:#ffffff;
  color:transparent !important;
  cursor:pointer;
  box-shadow:0 4px 14px rgba(0,0,0,.06);
  padding:0;
  position:relative;
  overflow:hidden;
  text-indent:-9999px;
  white-space:nowrap;
  font-size:0 !important;
}

.pq-speak-icon-btn *{
  color:transparent !important;
  font-size:0 !important;
  text-indent:-9999px !important;
}

.pq-speak-icon-btn:hover{
  transform:translateY(-1px);
}

.pq-speak-icon-btn:disabled{
  opacity:.45;
  cursor:not-allowed;
  transform:none;
}

.pq-speak-icon-btn.is-active,
.pq-speak-icon-btn[aria-pressed="true"],
.pq-speak-icon-btn[data-enabled="1"]{
  background:#e8f7ee;
  border-color:#8fd3a6;
}

.pq-speak-progress-badge{
  width:auto;
  min-width:64px;
  padding:0 12px;
  border:1px solid #d8e3f0;
  background:#f7fbff;
  color:#183153;
  font-size:14px;
  font-weight:800;
}

.pq-speak-icon-btn[data-role="mic"]::before,
.pq-speak-icon-btn[data-role="record"]::before,
.pq-speak-icon-btn[data-role="done"]::before{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:20px !important;
  line-height:1;
  font-weight:800;
  text-indent:0;
  color:#183153 !important;
  pointer-events:none;
}

.pq-speak-icon-btn[data-role="mic"]::before{ content:"🎤"; }
.pq-speak-icon-btn[data-role="record"]::before{ content:"⏺"; }

.pq-speak-icon-btn[data-role="done"]::before{ content:"🔁"; }

.pq-speak-icon-btn[data-role="mic"].is-on::before{ content:"✅"; }
.pq-speak-icon-btn[data-role="record"].is-busy::before{ content:"🔴"; }

/* hard-hide Next everywhere in simplified speak toolbar */
#pqSpeakBtnNext,
.pq-speak-icon-btn[data-role="next"]{
  display:none !important;
}

.pq-speak-hide-extra{
  display:none !important;
}

@media (max-width: 768px){
  #pqSpeakIconToolbar{
    gap:8px;
  }
  .pq-speak-icon-btn,
  .pq-speak-progress-badge{
    height:42px;
    border-radius:11px;
  }
  .pq-speak-icon-btn{
    width:42px;
    min-width:42px;
  }
  .pq-speak-icon-btn[data-role="mic"]::before,
  .pq-speak-icon-btn[data-role="record"]::before,
  .pq-speak-icon-btn[data-role="done"]::before{
    font-size:19px !important;
  }
}
`;
      document.head.appendChild(style);
    }

    let toolbar = document.getElementById('pqSpeakIconToolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'pqSpeakIconToolbar';
    }

    const anchor =
      document.getElementById('pqSpeakStatus') ||
      panel.firstElementChild ||
      panel;

    if (toolbar.parentNode !== panel) {
      if (anchor && anchor.parentNode === panel) {
        panel.insertBefore(toolbar, anchor);
      } else {
        panel.insertBefore(toolbar, panel.firstChild);
      }
    }

    return toolbar;
  } catch (_e) {
    return null;
  }
}

function __pqIsMicEnabled(btn) {
  try {
    if (!btn) return false;

    const liveText = String(btn.textContent || btn.innerText || '').toLowerCase();
    const cachedText = String(btn.dataset.pqLiveText || btn.dataset.pqOriginalText || '').toLowerCase();

    return !!(
      btn.classList.contains('active') ||
      btn.classList.contains('enabled') ||
      btn.classList.contains('is-active') ||
      btn.getAttribute('aria-pressed') === 'true' ||
      btn.dataset.enabled === '1' ||
      btn.dataset.active === '1' ||
      btn.dataset.state === 'on' ||
      liveText.indexOf('mic enabled') !== -1 ||
      liveText.indexOf('disable mic') !== -1 ||
      cachedText.indexOf('mic enabled') !== -1 ||
      cachedText.indexOf('disable mic') !== -1
    );
  } catch (_e) {
    return false;
  }
}

function __pqEnsureSpeakProgressBadge() {
  try {
    let badge = document.getElementById('pqSpeakProgressBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'pqSpeakProgressBadge';
      badge.className = 'pq-speak-progress-badge';
      badge.setAttribute('aria-label', 'Letters completed');
      badge.setAttribute('title', 'Letters completed');
    }

    __pqSpeakEnsureStateShape();

    const done = __pqSpeakCompletedCount();
    const total = Number(__pqSpeakUiState.totalKeys || 0) || 0;

    badge.textContent = `${done}/${total || 0}`;
    badge.style.display = 'inline-flex';

    return badge;
  } catch (_e) {
    return null;
  }
}

function __pqHideSpeakDoneExtraText(compareBtn) {
  try {
    const panel =
      document.getElementById('pqSpeakPanel') ||
      document.getElementById('speakMount');

    if (!panel) return;

    const toolbar = document.getElementById('pqSpeakIconToolbar') || null;
    const nodes = panel.querySelectorAll('div,span,label,p,small,strong,b');

    nodes.forEach(function (el) {
      try {
        if (!el) return;
        if (toolbar && (el === toolbar || toolbar.contains(el))) return;
        if (compareBtn && (el === compareBtn || (compareBtn.contains && compareBtn.contains(el)))) return;

        const txt = String(el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!txt) return;

        const lower = txt.toLowerCase();

        if (
          lower === 'done' ||
          lower.indexOf('done ') === 0 ||
          lower.indexOf(' done') !== -1 ||
          lower.indexOf('record seconds') !== -1 ||
          /^(\d+)\s*record seconds$/.test(lower) ||
          lower.indexOf('mic enabled') !== -1 ||
          lower.indexOf('enable mic') !== -1 ||
          lower.indexOf('disable mic') !== -1
        ) {
          el.classList.add('pq-speak-hide-extra');
          return;
        }

        if (/[\u0600-\u06FF]/.test(txt)) {
          const nearCompare =
            compareBtn &&
            (
              el.parentElement === compareBtn.parentElement ||
              (compareBtn.parentElement && compareBtn.parentElement.contains(el))
            );

          if (nearCompare) {
            el.classList.add('pq-speak-hide-extra');
          }
        }
      } catch (_e) {}
    });
  } catch (_e) {}
}

function __pqHideSpeakMicExtraText(panel, toolbar, micBtn) {
  try {
    if (!panel) return;

    const nodes = panel.querySelectorAll('div,span,label,p,small,strong,b');

    nodes.forEach(function (el) {
      try {
        if (!el) return;
        if (toolbar && (el === toolbar || toolbar.contains(el))) return;
        if (micBtn && (el === micBtn || (micBtn.contains && micBtn.contains(el)))) return;

        const txt = String(el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!txt) return;

        const isMicLeak =
          txt === 'enable mic' ||
          txt === 'mic enabled' ||
          txt === 'disable mic';

        if (!isMicLeak) return;

        const hasControls = !!(
          el.querySelector &&
          el.querySelector('button,input,select,textarea,[role="button"]')
        );

        if (!hasControls) {
          el.classList.add('pq-speak-hide-extra');
        }
      } catch (_e) {}
    });
  } catch (_e) {}
}

function __pqHideSpeakMicText(panel, toolbar, micBtn) {
  try {
    if (!panel) return;

    const nodes = panel.querySelectorAll('div,span,label,p,small,strong,b');

    nodes.forEach(function (el) {
      try {
        if (!el) return;
        if (toolbar && (el === toolbar || toolbar.contains(el))) return;
        if (micBtn && el === micBtn) return;
        if (micBtn && micBtn.contains && micBtn.contains(el)) return;

        const txt = String(el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!txt) return;

        const isMicText =
          txt === 'enable mic' ||
          txt === 'mic enabled' ||
          txt === 'disable mic' ||
          txt.indexOf('enable mic') !== -1 ||
          txt.indexOf('mic enabled') !== -1 ||
          txt.indexOf('disable mic') !== -1;

        if (!isMicText) return;

        const hasInteractiveChild = !!(
          el.querySelector &&
          el.querySelector('button,input,select,textarea,[role="button"]')
        );

        if (!hasInteractiveChild) {
          el.classList.add('pq-speak-hide-extra');
          el.style.display = 'none';
        }
      } catch (_e) {}
    });
  } catch (_e) {}
}

function __pqDecorateSpeakIconButton(btn, role, title, pressedOn) {
  try {
    if (!btn) return;

    const currentText = String(btn.textContent || btn.innerText || '').trim();
    if (currentText) {
      btn.dataset.pqLiveText = currentText;
      if (!btn.dataset.pqOriginalText) {
        btn.dataset.pqOriginalText = currentText;
      }
    }

    btn.classList.add('pq-speak-icon-btn');
    btn.setAttribute('data-role', role);
    btn.setAttribute('title', title);
    btn.setAttribute('aria-label', title);

    if (role === 'mic') {
      const micOn = __pqIsMicEnabled(btn);
      btn.classList.toggle('is-on', micOn);
      btn.setAttribute('aria-pressed', micOn ? 'true' : 'false');
    }

    if (role === 'record') {
      btn.classList.toggle('is-busy', !!pressedOn);
      btn.setAttribute('aria-pressed', pressedOn ? 'true' : 'false');
    }

    btn.textContent = '';
    btn.innerText = '';
    btn.style.color = 'transparent';
    btn.style.fontSize = '0';
    btn.style.textIndent = '-9999px';
    btn.style.overflow = 'hidden';
    btn.style.whiteSpace = 'nowrap';

    try {
      const kids = btn.querySelectorAll('*');
      kids.forEach(function (node) {
        try {
          node.textContent = '';
          node.style.color = 'transparent';
          node.style.fontSize = '0';
        } catch (_e) {}
      });
    } catch (_e) {}
  } catch (_e) {}
}


function __pqEnsureSpeakChildModal() {
  let modal = document.getElementById('pqSpeakChildModal');
  if (modal) return modal;

  const style = document.createElement('style');
  style.id = 'pqSpeakChildModalStyle';
  style.textContent = `
#pqSpeakChildModal{position:fixed;inset:0;z-index:2147482850;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(12,18,31,.58);backdrop-filter:blur(5px)}
#pqSpeakChildModal.is-open{display:flex}
#pqSpeakChildModal .pq-speak-modal-card{position:relative;width:min(720px,94vw);max-height:92vh;overflow:auto;border-radius:32px;background:#fffdf7;box-shadow:0 24px 70px rgba(18,29,52,.30);padding:24px;text-align:center}
#pqSpeakChildModal .pq-speak-modal-close{position:absolute;top:12px;right:14px;width:42px;height:42px;border:0;border-radius:999px;background:rgba(0,0,0,.07);font-size:1.45rem;font-weight:1000;cursor:pointer}
#pqSpeakChildModal .pq-speak-modal-title{font-size:1.35rem;font-weight:1000;color:#17233b;margin:8px 48px 10px}
#pqSpeakChildModal .pq-speak-modal-letter{font-family:"Noto Naskh Arabic","Noto Sans Arabic","Amiri",serif;font-size:5.5rem;line-height:1;font-weight:1000;color:#073b27;margin:8px 0 12px}
#pqSpeakChildModal .pq-speak-modal-hint{font-size:1rem;font-weight:850;color:#31425d;margin:0 auto 18px;max-width:520px;line-height:1.45}
#pqSpeakChildModal .pq-speak-modal-actions{display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap}
#pqSpeakChildModal #pqSpeakIconToolbar{display:flex!important;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;width:100%;margin:0}
#pqSpeakChildModal .pq-speak-icon-btn{width:112px!important;min-width:112px!important;height:112px!important;border-radius:32px!important}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="mic"]::after{content:"Mic";position:absolute;left:0;right:0;bottom:12px;text-indent:0;color:#17466b;font-size:.9rem;font-weight:1000}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="record"]::after{content:"Record";position:absolute;left:0;right:0;bottom:12px;text-indent:0;color:#17466b;font-size:.9rem;font-weight:1000}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="record"].pq-can-rerecord::after{content:"Re-record"}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="done"]::after{content:"Done";position:absolute;left:0;right:0;bottom:12px;text-indent:0;color:#17466b;font-size:.9rem;font-weight:1000}
#pqSpeakChildModal .pq-speak-progress-badge{width:auto!important;min-width:92px!important;height:52px!important;border-radius:999px!important;padding:0 18px!important;font-size:1.05rem!important}
`;
  document.head.appendChild(style);

  modal = document.createElement('div');
  modal.id = 'pqSpeakChildModal';
  modal.innerHTML =
    '<div class="pq-speak-modal-card" role="dialog" aria-modal="true">' +
      '<button type="button" class="pq-speak-modal-close" aria-label="Close">×</button>' +
      '<div class="pq-speak-modal-title">Your turn — speak the letter</div>' +
      '<div class="pq-speak-modal-letter">🎤</div>' +
      '<div class="pq-speak-modal-hint">Use the big buttons below. Enable the mic, record your voice, then tap Done.</div>' +
      '<div class="pq-speak-modal-actions" id="pqSpeakModalActions"></div>' +
    '</div>';

  document.body.appendChild(modal);

  modal.querySelector('.pq-speak-modal-close').addEventListener('click', function () {
    modal.classList.remove('is-open');
  });

  return modal;
}

function __pqSetSpeakChildModalLetter(text) {
  try {
    const modal = document.getElementById('pqSpeakChildModal');
    if (!modal) return;

    const letterEl = modal.querySelector('.pq-speak-modal-letter');
    if (letterEl) letterEl.textContent = text || '🎤';

    const hintEl = modal.querySelector('.pq-speak-modal-hint');
    if (hintEl) {
      hintEl.textContent = 'Now use the big buttons below. Enable the mic, record your voice, then tap Done.';
    }
  } catch (_e) {}
}

function __pqOpenSpeakChildModal(isVisible) {
  try {
    const modal = __pqEnsureSpeakChildModal();
    if (isVisible) modal.classList.add('is-open');
    else modal.classList.remove('is-open');
  } catch (_e) {}
}

function __pqMoveSpeakToolbarToModal(toolbar, progressBadge) {
  try {
    const modal = __pqEnsureSpeakChildModal();
    const actions = modal.querySelector('#pqSpeakModalActions');
    if (actions && toolbar && toolbar.parentNode !== actions) actions.appendChild(toolbar);
    if (progressBadge && toolbar && progressBadge.parentNode !== toolbar) toolbar.appendChild(progressBadge);
  } catch (_e) {}
}


function __pqSyncSimplifiedSpeakUi() {
  try {
    const mount = document.getElementById('speakMount');
    const panel = document.getElementById('pqSpeakPanel') || mount;

    const micBtn = document.getElementById('pqSpeakBtnMic');
    const recordBtn = document.getElementById('pqSpeakBtnRecord');
    const nextBtn = document.getElementById('pqSpeakBtnNext');
    const attemptBtn = document.getElementById('pqSpeakBtnAttempt');
    const compareBtn = document.getElementById('pqSpeakBtnCompare');

    if (!mount || !panel) return;

    __pqSpeakEnsureStateShape();

    const isVisible = mount.style.display !== 'none';
    const toolbar = __pqEnsureSpeakIconToolbar();
    const progressBadge = __pqEnsureSpeakProgressBadge();

    try { __pqSpeakApplyDoneTilesFinal(); } catch (_pqSpeakDoneTiles) {}
    try { __pqSpeakRefreshProgressFinal(); } catch (_pqSpeakDoneProgress) {}

    try {
      if (!isVisible) __pqOpenSpeakChildModal(false);
    } catch (_e) {}

    if (attemptBtn) {
      attemptBtn.hidden = false;
      __pqSetSpeakButtonVisualHidden(attemptBtn, true);
    }

    if (micBtn) {
      micBtn.hidden = !isVisible;
      micBtn.style.display = isVisible ? '' : 'none';
      __pqDecorateSpeakIconButton(micBtn, 'mic', 'Enable microphone');

      try {
        micBtn.textContent = '';
        micBtn.innerText = '';
      } catch (_e) {}
    }

    if (recordBtn) {
      recordBtn.hidden = !isVisible;
      recordBtn.style.display = isVisible ? '' : 'none';
      __pqDecorateSpeakIconButton(
        recordBtn,
        'record',
        'Record',
        !!__pqSpeakUiState.isRecording
      );
    }

    if (nextBtn) {
      nextBtn.hidden = true;
      nextBtn.style.display = 'none';
      nextBtn.classList.add('pq-speak-hide-extra');
      __pqSetSpeakButtonVisualHidden(nextBtn, true);
    }

    if (compareBtn) {
      try { __pqSpeakInstallDoneBinderFinal(compareBtn); } catch (_e) {}
      compareBtn.hidden = !isVisible;
      compareBtn.style.display = isVisible ? '' : 'none';
      __pqSetSpeakButtonVisualHidden(compareBtn, false);
      __pqDecorateSpeakIconButton(compareBtn, 'done', 'Done');
      __pqHideSpeakDoneExtraText(compareBtn);
    }

    try {
      __pqHideSpeakMicExtraText(panel, toolbar, micBtn);
    } catch (_e) {}

    if (toolbar) {
  toolbar.innerHTML = '';

  if (micBtn && isVisible) toolbar.appendChild(micBtn);
  if (recordBtn && isVisible) toolbar.appendChild(recordBtn);
  if (compareBtn && isVisible) toolbar.appendChild(compareBtn);
  if (progressBadge && isVisible) toolbar.appendChild(progressBadge);

  try { __pqMoveSpeakToolbarToModal(toolbar, progressBadge); } catch (_e) {}

  try { __pqSpeakFinalRefreshProgress(); } catch (_pqFinalProgress) {}
  try { __pqSpeakFinalRefreshDoneTiles(); } catch (_pqFinalTiles) {}
}

    try {
      const statusEl = document.getElementById('pqSpeakStatus');
      if (statusEl) {
        statusEl.classList.add('pq-speak-hide-extra');
      }
    } catch (_e) {}

    try {
      __pqHideSpeakMicText(panel, toolbar, micBtn);
    } catch (_e) {}

    try {
      const panelNodes = panel.querySelectorAll('div,span,label,p,small,strong,b');
      let recordSecondsAnchor = null;

      panelNodes.forEach(function (el) {
        try {
          if (!el) return;
          if (el === toolbar) return;
          if (toolbar && toolbar.contains(el)) return;
          if (el.id === 'pqSpeakStatus') return;
          if (el.id === 'pqSpeakProgressBadge') return;

          const txt = String(el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
          if (!txt) return;

          if (
            txt.indexOf('record seconds') !== -1 ||
            txt === 'record seconds' ||
            /^(\d+)\s*record seconds$/.test(txt)
          ) {
            el.classList.add('pq-speak-hide-extra');
            recordSecondsAnchor = el;
          }
        } catch (_e) {}
      });

      if (recordSecondsAnchor && recordSecondsAnchor.parentElement) {
        const siblings = Array.from(recordSecondsAnchor.parentElement.children || []);
        const anchorIndex = siblings.indexOf(recordSecondsAnchor);

        siblings.forEach(function (sib, sibIndex) {
          try {
            if (!sib) return;
            if (sib === toolbar) return;
            if (toolbar && toolbar.contains(sib)) return;
            if (sib.id === 'pqSpeakStatus') return;
            if (sib.id === 'pqSpeakProgressBadge') return;

            const stxt = String(sib.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
            const nearAnchor = Math.abs(sibIndex - anchorIndex) <= 1;

            if (
              stxt.indexOf('record seconds') !== -1 ||
              (nearAnchor && /^\d+$/.test(stxt))
            ) {
              sib.classList.add('pq-speak-hide-extra');
            }
          } catch (_e) {}
        });
      }
    } catch (_e) {}

  } catch (_e) {}
}


/* ===== SPEAK MODAL RECORDING FINAL v3 ===== */
const __pqSpeakModalRecFinalState = {
  stream:null, recorder:null, chunks:[], blob:null, blobUrl:'',
  attempts:Object.create(null), doneKeys:Object.create(null), stopTimer:null, playing:false
};

function __pqSpeakModalKey(){
  try { return String(__pqSpeakUiState.selectedKey || '').trim(); } catch(_e){ return ''; }
}

function __pqSpeakModalHint(msg){
  try {
    const m = document.getElementById('pqSpeakChildModal');
    const h = m && m.querySelector('.pq-speak-modal-hint');
    if (h) h.textContent = msg;
  } catch(_e){}
}

function __pqSpeakModalMs(){
  try {
    const s = document.getElementById('pqSpeakRecLen');
    return Math.max(700, Math.min(8000, (Number(s && s.value) || 3) * 1000));
  } catch(_e){ return 3000; }
}

async function __pqSpeakModalMic(){
  if (__pqSpeakModalRecFinalState.stream) return __pqSpeakModalRecFinalState.stream;
  __pqSpeakModalRecFinalState.stream = await navigator.mediaDevices.getUserMedia({audio:true});
  return __pqSpeakModalRecFinalState.stream;
}

function __pqSpeakModalStop(){
  try { if (__pqSpeakModalRecFinalState.stopTimer) clearTimeout(__pqSpeakModalRecFinalState.stopTimer); } catch(_e){}
  __pqSpeakModalRecFinalState.stopTimer = null;
  try {
    const r = __pqSpeakModalRecFinalState.recorder;
    if (r && r.state !== 'inactive') r.stop();
  } catch(_e){}
}

function __pqSpeakModalPlayStudent(blob){
  return new Promise(function(resolve){
    try {
      if (!blob) return resolve(false);
      if (__pqSpeakModalRecFinalState.blobUrl) {
        try { URL.revokeObjectURL(__pqSpeakModalRecFinalState.blobUrl); } catch(_e){}
      }
      const url = URL.createObjectURL(blob);
      __pqSpeakModalRecFinalState.blobUrl = url;
      const a = new Audio(url);
      let done = false;
      function finish(ok){ if(done) return; done = true; resolve(!!ok); }
      a.onended = function(){ finish(true); };
      a.onerror = function(){ finish(false); };
      const p = a.play();
      if (p && p.catch) p.catch(function(){ finish(false); });
    } catch(_e){ resolve(false); }
  });
}

async function __pqSpeakModalReplayTeacherStudent(){
  const key = __pqSpeakModalKey();
  const blob = __pqSpeakModalRecFinalState.blob;
  if (!key || !blob || __pqSpeakModalRecFinalState.playing) return;

  __pqSpeakModalRecFinalState.playing = true;
  try {
    __pqSpeakModalHint('Listen to the teacher first, then your voice.');
    try { await playLetter(key, 1, 1); } catch(_e){}
    await __pqSpeakModalPlayStudent(blob);
    __pqSpeakModalHint('You can record again, or tap Done when you are happy.');
  } finally {
    __pqSpeakModalRecFinalState.playing = false;
    __pqSpeakUiState.isRecording = false;
    try { __pqSyncSimplifiedSpeakUi(); } catch(_e){}
    try { __pqSpeakModalRefreshButtons(); } catch(_e){}
  }
}

async function __pqSpeakModalStartRecord(){
  const key = __pqSpeakModalKey();
  if (!key) { __pqSpeakModalHint('Choose a letter first.'); return; }

  if (__pqSpeakIsKeyCompleted(key)) {
    __pqSpeakModalHint('This one is already done. Choose another letter.');
    try { __pqSpeakModalRefreshButtons(); } catch (_e) {}
    return;
  }

  if (__pqSpeakUiState.isRecording) { __pqSpeakModalStop(); return; }

  const stream = await __pqSpeakModalMic();
  __pqSpeakModalRecFinalState.chunks = [];
  __pqSpeakModalRecFinalState.blob = null;

  const rec = new MediaRecorder(stream);
  __pqSpeakModalRecFinalState.recorder = rec;

  rec.ondataavailable = function(ev){
    try { if (ev.data && ev.data.size) __pqSpeakModalRecFinalState.chunks.push(ev.data); } catch(_e){}
  };

  rec.onstop = function(){
    try {
      const chunks = __pqSpeakModalRecFinalState.chunks || [];
      const blob = chunks.length ? new Blob(chunks, {type: rec.mimeType || 'audio/webm'}) : null;
      __pqSpeakModalRecFinalState.blob = blob;
      __pqSpeakModalRecFinalState.attempts[key] = {at:Date.now(), ok:!!blob, size:blob ? blob.size : 0};
      __pqSpeakUiState.isRecording = false;
      __pqSpeakUiState.lastRecordingAt = Date.now();
      try { __pqSyncSimplifiedSpeakUi(); } catch(_e){}
      try { __pqSpeakModalRefreshButtons(); } catch(_e){}
      if (blob) setTimeout(__pqSpeakModalReplayTeacherStudent, 120);
      else __pqSpeakModalHint('No recording captured. Try again.');
    } catch(_e){
      __pqSpeakUiState.isRecording = false;
      try { __pqSpeakModalRefreshButtons(); } catch(_ignore){}
    }
  };

  rec.onerror = function(){
    __pqSpeakUiState.isRecording = false;
    __pqSpeakModalHint('Recording had a problem. Try again.');
    try { __pqSpeakModalRefreshButtons(); } catch(_e){}
  };

  __pqSpeakUiState.isRecording = true;
  __pqSpeakModalHint('Recording... say the letter clearly.');
  try { __pqSyncSimplifiedSpeakUi(); } catch(_e){}
  try { __pqSpeakModalRefreshButtons(); } catch(_e){}

  rec.start();
  __pqSpeakModalRecFinalState.stopTimer = setTimeout(__pqSpeakModalStop, __pqSpeakModalMs());
}


function __pqSpeakModalTotalCountFinal() {
  try {
    if (Array.isArray(PLAY_SEQUENCE_KEYS) && PLAY_SEQUENCE_KEYS.length) return PLAY_SEQUENCE_KEYS.length;
  } catch (_e) {}

  try {
    if (Array.isArray(LETTERS) && LETTERS.length) return LETTERS.length;
  } catch (_e) {}

  return 0;
}

function __pqSpeakModalDoneCountFinal() {
  try {
    __pqSpeakEnsureStateShape();

    const doneKeys = (__pqSpeakUiState && __pqSpeakUiState.completedKeys) || {};
    return Object.keys(doneKeys).filter(function (k) { return !!doneKeys[k]; }).length;
  } catch (_e) {
    return 0;
  }
}

function __pqSpeakModalGreyTileFinal(key) {
  try {
    key = String(key || '').trim();
    if (!key) return;

    const tile =
      document.querySelector('#grid .tile[data-key="' + key.replace(/"/g, '\\"') + '"]') ||
      document.querySelector('#grid [data-key="' + key.replace(/"/g, '\\"') + '"]');

    if (tile) {
      tile.classList.add('played');
      tile.classList.add('completed');
      tile.classList.add('pq-speak-done');
      tile.classList.remove('active');
      tile.classList.remove('pq-playing');
      tile.classList.remove('is-playing');
      tile.setAttribute('data-speak-done', '1');
    }
  } catch (_e) {}
}

function __pqSpeakModalRefreshProgressFinal() {
  try {
    const done = __pqSpeakModalDoneCountFinal();
    const total = __pqSpeakModalTotalCountFinal();
    const text = done + '/' + total;

    const badge = document.getElementById('pqSpeakProgressBadge');
    if (badge) badge.textContent = text;

    const chip = document.getElementById('pqSpeakProgressChip');
    if (chip) chip.textContent = 'Done ' + text;
  } catch (_e) {}
}

function __pqSpeakModalRefreshDoneTilesFinal() {
  try {
    __pqSpeakEnsureStateShape();

    const doneKeys = (__pqSpeakUiState && __pqSpeakUiState.completedKeys) || {};
    Object.keys(doneKeys).forEach(function (key) {
      if (doneKeys[key]) __pqSpeakModalGreyTileFinal(key);
    });
  } catch (_e) {}
}



function __pqSpeakFinalTotal() {
  try { if (Array.isArray(PLAY_SEQUENCE_KEYS) && PLAY_SEQUENCE_KEYS.length) return PLAY_SEQUENCE_KEYS.length; } catch (_e) {}
  try { if (Array.isArray(LETTERS) && LETTERS.length) return LETTERS.length; } catch (_e) {}
  try { return document.querySelectorAll('#grid .tile[data-key]').length || 0; } catch (_e) {}
  return 0;
}

function __pqSpeakFinalDoneCount() {
  try {
    __pqSpeakEnsureStateShape();

    const m = __pqSpeakUiState.completedKeys || {};
    return Object.keys(m).filter(function (k) { return !!m[k]; }).length;
  } catch (_e) {
    return 0;
  }
}

function __pqSpeakFinalGreyTile(key) {
  try {
    key = String(key || '').trim();
    if (!key) return;

    const safe = key.replace(/"/g, '\\"');
    const tile = document.querySelector('#grid .tile[data-key="' + safe + '"]');

    if (tile) {
      tile.classList.add('played', 'completed', 'pq-speak-done');
      tile.classList.remove('active', 'pq-playing', 'is-playing');
      tile.setAttribute('data-speak-done', '1');
      tile.style.opacity = '0.45';
      tile.style.filter = 'grayscale(0.25)';
    }
  } catch (_e) {}
}

function __pqSpeakFinalRefreshProgress() {
  try {
    const done = __pqSpeakFinalDoneCount();
    const total = __pqSpeakFinalTotal();
    const text = done + '/' + total;

    const badge = document.getElementById('pqSpeakProgressBadge');
    if (badge) badge.textContent = text;

    const chip = document.getElementById('pqSpeakProgressChip');
    if (chip) chip.textContent = 'Done ' + text;
  } catch (_e) {}
}

function __pqSpeakFinalRefreshDoneTiles() {
  try {
    __pqSpeakEnsureStateShape();

    const m = __pqSpeakUiState.completedKeys || {};
    Object.keys(m).forEach(function (key) {
      if (m[key]) __pqSpeakFinalGreyTile(key);
    });
  } catch (_e) {}
}



function __pqSpeakModalDoneFinal(){
  const key = __pqSpeakModalKey();

  if (!key) {
    __pqSpeakModalHint('Choose a letter first.');
    return;
  }

  try {
    if (__pqSpeakModalRecFinalState && __pqSpeakModalRecFinalState.attempts && !__pqSpeakModalRecFinalState.attempts[key]) {
      __pqSpeakModalHint('Record first, then tap Done.');
      return;
    }
  } catch (_e) {}

  try {
    __pqSpeakUiState.completedKeys[key] = true;
  } catch (_e) {}

  try {
    __pqSpeakModalRecFinalState.doneKeys[key] = true;
  } catch (_e) {}

  try { __pqSpeakMarkCurrentDone(); } catch (_e) {}
  try { __pqSpeakSyncManagedProgressFromDoneKeys(true); } catch (_e) {}
  try { __pqSpeakFinalGreyTile(key); } catch (_e) {}
  try { __pqSpeakFinalRefreshProgress(); } catch (_e) {}
  try { __pqSpeakFinalRefreshDoneTiles(); } catch (_e) {}

  try {
    const m = document.getElementById('pqSpeakChildModal');
    if (m) m.classList.remove('is-open');
  } catch(_e){}

  try { __pqSyncSimplifiedSpeakUi(); } catch(_e){}
  try { __pqSpeakFinalGreyTile(key); } catch (_e) {}
  try { __pqSpeakFinalRefreshProgress(); } catch (_e) {}
  try { __pqSpeakSyncManagedProgressFromDoneKeys(false); } catch (_e) {}
}


function __pqSpeakModalRefreshButtons(){
  try { __pqSpeakModalRefreshProgressFinal(); } catch(_e){}
  try { __pqSpeakModalRefreshDoneTilesFinal(); } catch(_e){}
  try {
    const mount = document.getElementById('speakMount');
    const rec = document.getElementById('pqSpeakBtnRecord');
    const done = document.getElementById('pqSpeakBtnCompare');
    const visible = mount && mount.style.display !== 'none';
    const key = __pqSpeakModalKey();
    const hasAttempt = !!(key && __pqSpeakModalRecFinalState.attempts[key]);
    const alreadyDone = __pqSpeakIsKeyCompleted(key);

    if (rec) {
      rec.disabled = !(visible && key) || alreadyDone || !!__pqSpeakUiState.isRecording;
      rec.classList.toggle('pq-can-rerecord', hasAttempt && !alreadyDone && !__pqSpeakUiState.isRecording);
      rec.setAttribute('aria-disabled', rec.disabled ? 'true' : 'false');
    }

    if (done) {
      done.disabled = !(visible && key && hasAttempt) || alreadyDone || !!__pqSpeakUiState.isRecording;
      done.setAttribute('aria-disabled', done.disabled ? 'true' : 'false');
    }
  } catch(_e){}
}

let __pqSpeakModalRefreshInterval = null;

function __pqInstallSpeakModalRecordingFinal(recordBtn, micBtn, doneBtn){
  if (!recordBtn || recordBtn.__pqSpeakModalFinalV3__) return;
  recordBtn.__pqSpeakModalFinalV3__ = true;

  recordBtn.addEventListener('click', function(ev){
    try { ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); } catch(_e){}
    __pqSpeakModalStartRecord().catch(function(){
      __pqSpeakUiState.isRecording = false;
      __pqSpeakModalHint('Microphone was not ready. Try again.');
      try { __pqSpeakModalRefreshButtons(); } catch(_e){}
    });
  }, true);

  if (doneBtn && !doneBtn.__pqSpeakModalDoneV3__) {
    doneBtn.__pqSpeakModalDoneV3__ = true;
    doneBtn.addEventListener('click', function(ev){
      try { ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); } catch(_e){}
      __pqSpeakModalDoneFinal();
    }, true);
  }

  if (micBtn && !micBtn.__pqSpeakModalMicV3__) {
    micBtn.__pqSpeakModalMicV3__ = true;
    micBtn.addEventListener('click', function(){
      setTimeout(function(){ __pqSpeakModalMic().catch(function(){}); }, 60);
    }, true);
  }

  if (!__pqSpeakModalRefreshInterval) {
    __pqSpeakModalRefreshInterval = setInterval(__pqSpeakModalRefreshButtons, 500);

    try {
      window.addEventListener('beforeunload', function () {
        try {
          clearInterval(__pqSpeakModalRefreshInterval);
        } catch (_e) {}
        __pqSpeakModalRefreshInterval = null;
      }, { once: true });
    } catch (_e) {}
  }
}
/* ===== END SPEAK MODAL RECORDING FINAL v3 ===== */


function __pqInstallSimplifiedSpeakUi() {
  try {
    const panel =
      document.getElementById('pqSpeakPanel') ||
      document.getElementById('speakMount');

    const micBtn = document.getElementById('pqSpeakBtnMic');
    const recordBtn = document.getElementById('pqSpeakBtnRecord');
    const nextBtn = document.getElementById('pqSpeakBtnNext');
    const attemptBtn = document.getElementById('pqSpeakBtnAttempt');
    const compareBtn = document.getElementById('pqSpeakBtnCompare');

    if (!recordBtn || !nextBtn || !attemptBtn || !compareBtn) return;
    

    try {
      __pqInstallSpeakModalRecordingFinal(recordBtn, micBtn, compareBtn);
    } catch (_e) {}
if (recordBtn.__pqSimpleSpeakBound__) return;

    recordBtn.__pqSimpleSpeakBound__ = true;
    nextBtn.__pqSimpleSpeakBound__ = true;

    async function runAttemptOnly() {
      const attemptReady = await __pqWaitUntil(function () {
        try {
          return !attemptBtn.disabled;
        } catch (_e) {
          return false;
        }
      }, 10000, 180);

      if (!attemptReady) return false;

      try {
        attemptBtn.click();
        return true;
      } catch (_e) {
        return false;
      }
    }

    recordBtn.addEventListener('click', function () {
      try {
        if (__pqSpeakIsKeyCompleted(__pqSpeakModalKey())) {
          try { __pqSpeakModalHint('This one is already done. Choose another letter.'); } catch (_e) {}
          try { __pqSpeakModalRefreshButtons(); } catch (_e) {}
          return;
        }

        const micEnabled = __pqIsMicEnabled(micBtn);
        if (!micEnabled) {
          __pqShowSpeakPopup(String(__PQ_TEXT_CACHE.micEnablePopupText));
          return;
        }

        __pqSpeakClearRecordingTimers();

        if (__pqSpeakUiState.isRecording) {
          __pqSpeakStopRecordingVisualOnly();
          return;
        }

        __pqSpeakUiState.isRecording = true;
        __pqSyncSimplifiedSpeakUi();

        setTimeout(function () {
          runAttemptOnly()
            .then(function (ok) {
              if (ok) {
                __pqSpeakStartSilenceAutoStop();
              } else {
                __pqSpeakStopRecordingVisualOnly();
              }
            })
            .catch(function () {
              __pqSpeakStopRecordingVisualOnly();
            });
        }, 120);
      } catch (_e) {
        __pqSpeakStopRecordingVisualOnly();
      }
    });

    nextBtn.addEventListener('click', function () {
      try {
        const attemptReady = document.getElementById('pqSpeakBtnAttempt');
        const compareReal = document.getElementById('pqSpeakBtnCompare');
        const nextReal = document.querySelector(
          '#pqSpeakPanel [data-action="next"], ' +
          '#pqSpeakPanel .pq-speak-next, ' +
          '#pqSpeakPanel button[data-role="next-real"]'
        );

        if (nextReal && nextReal !== nextBtn) {
          try { nextReal.click(); } catch (_e) {}
        } else if (compareReal && compareReal !== nextBtn && !compareReal.disabled) {
          try { compareReal.click(); } catch (_e) {}
        } else if (attemptReady && attemptReady !== nextBtn && !attemptReady.disabled) {
          try { attemptReady.click(); } catch (_e) {}
        }
      } catch (_e) {}

      setTimeout(function () {
        try {
          __pqSpeakMarkCurrentDone();
        } catch (_e) {}

        try {
          __pqSyncSimplifiedSpeakUi();
        } catch (_e) {}
      }, 60);
    });

if (micBtn && !micBtn.__pqIconMicBound__) {
  micBtn.addEventListener('click', function () {
    [40, 120, 260, 500, 900, 1400].forEach(function (ms) {
      setTimeout(function () {
        try { __pqSyncSimplifiedSpeakUi(); } catch (_e) {}
      }, ms);
    });
  });
  micBtn.__pqIconMicBound__ = true;
}

    if (compareBtn && !compareBtn.__pqIconDoneBound__) {
      compareBtn.addEventListener('click', function () {
        setTimeout(function () {
          try {
            __pqSyncSimplifiedSpeakUi();
          } catch (_e) {}
        }, 60);
      });
      compareBtn.__pqIconDoneBound__ = true;
    }
    __pqEnsureSpeakIconToolbar();
    __pqSyncSimplifiedSpeakUi();
  } catch (_e) {}
}

function __pqForceSpeakUiRefresh() {
  try {
    const mount = document.getElementById('speakMount');
    const bridge = window.__pqSpeakBridge || window.__pqTanweenSpeak || null;
    const isSpeak = !!(
      bridge &&
      typeof bridge.shouldShowPanel === 'function' &&
      bridge.shouldShowPanel()
    );

    if (!mount) {
      try { __pqSyncDynamicStepAction(); } catch (_e) {}
      return;
    }

    mount.style.display = isSpeak ? 'block' : 'none';

    const engine = window.__PQ_SPEAK_ENGINE__ || window.__PQ_TANWEEN_SPEAK_ENGINE__;
    if (!engine) {
      try { __pqSyncDynamicStepAction(); } catch (_e) {}
      return;
    }

    const panel = document.getElementById('pqSpeakPanel');
    const hasButtons = !!(
      panel &&
      document.getElementById('pqSpeakBtnMic') &&
      document.getElementById('pqSpeakBtnRecord') &&
      document.getElementById('pqSpeakBtnAttempt') &&
      document.getElementById('pqSpeakBtnCompare') &&
      document.getElementById('pqSpeakBtnNext')
    );

    if (isSpeak && (!panel || !hasButtons)) {
      try {
        const ensureSpeak = window.__pqSpeakEnsure || window.__pqTanweenSpeakEnsure;
        if (typeof ensureSpeak === 'function') {
          ensureSpeak();
        }
      } catch (_e) {}

      try {
        if (typeof engine.boot === 'function') {
          engine.boot();
        }
      } catch (_e) {}
    }

    try {
      if (typeof engine.refreshDoneClasses === 'function') {
        engine.refreshDoneClasses();
      }
    } catch (_e) {}

    try { __pqInstallSimplifiedSpeakUi(); } catch (_e) {}
    try { __pqEnsureSpeakIconToolbar(); } catch (_e) {}
    try { __pqSpeakSyncManagedProgressFromDoneKeys(false); } catch (_e) {}
    try { __pqSyncSimplifiedSpeakUi(); } catch (_e) {}

    try {
    const micBtn = document.getElementById('pqSpeakBtnMic');
if (micBtn) {
  const micLiveText = String(
    micBtn.dataset.pqLiveText ||
    micBtn.dataset.pqOriginalText ||
    micBtn.textContent ||
    micBtn.innerText ||
    ''
  ).trim();

  if (micLiveText) {
    micBtn.dataset.pqLiveText = micLiveText;
    if (!micBtn.dataset.pqOriginalText) {
      micBtn.dataset.pqOriginalText = micLiveText;
    }
  }

  try {
    micBtn.textContent = '';
    micBtn.innerText = '';
  } catch (_e) {}
}
    } catch (_e) {}

    try {
      __pqSyncSimplifiedSpeakUi();
    } catch (_e) {}

  } catch (_e) {}

  try { __pqSyncDynamicStepAction(); } catch (_e) {}
}

function __pqEnsureSpeakBoot() {
  try {
    const mount = document.getElementById('speakMount');
    if (!mount) return null;

    // Prefer already-installed adapter engine
    const existingEngine = window.__PQ_SPEAK_ENGINE__ || window.__PQ_TANWEEN_SPEAK_ENGINE__;
    if (
      existingEngine &&
      typeof existingEngine.boot === 'function'
    ) {
      try {
        existingEngine.boot();
      } catch (_e) {}

      try {
        const ensureSpeak = window.__pqSpeakEnsure || window.__pqTanweenSpeakEnsure;
        if (typeof ensureSpeak === 'function') {
          ensureSpeak();
        }
      } catch (_e) {}
            try { __pqInstallSimplifiedSpeakUi(); } catch (_e) {}
return existingEngine;

    }

    // If adapter has already exposed an ensure hook, use it
    try {
      const ensureSpeak = window.__pqSpeakEnsure || window.__pqTanweenSpeakEnsure;
      if (typeof ensureSpeak === 'function') {
        ensureSpeak();
      }
    } catch (_e) {}

    // Final fallback: create engine only from the real adapter object
    if (
      (window.PQSharedSpeakAdapter || window.PQTanweenMovementSpeakAdapter) &&
      window.PQSharedSpeakEngine &&
      typeof window.PQSharedSpeakEngine.create === 'function'
    ) {
      try {
        const adapter = window.PQSharedSpeakAdapter || window.PQTanweenMovementSpeakAdapter;
        const engine = window.PQSharedSpeakEngine.create(
          adapter
        );

        window.__PQ_SPEAK_ENGINE__ = engine;
        window.__PQ_TANWEEN_SPEAK_ENGINE__ = engine;

        if (engine && typeof engine.boot === 'function') {
          engine.boot();
        }

        try {
          const ensureSpeak = window.__pqSpeakEnsure || window.__pqTanweenSpeakEnsure;
          if (typeof ensureSpeak === 'function') {
            ensureSpeak();
          }
        } catch (_e) {}

        try { __pqInstallSimplifiedSpeakUi(); } catch (_e) {}
return engine;

      } catch (_e) {}
    }
  } catch (_e) {}

  return window.__PQ_SPEAK_ENGINE__ || window.__PQ_TANWEEN_SPEAK_ENGINE__ || null;
}

  function updateControlsForCurrentStep() {
    if (!btnPause) return;

    try { __pqHideLegacyPlayAllButton(); } catch (_e) {}
    try { __pqHideLegacyWriteButton(); } catch (_e) {}
    try { __pqHideLegacyLectureButton(); } catch (_e) {}

    const current = getCurrentStep();
    const step = current && current.step ? current.step : null;
    const progress = current && current.progress ? current.progress : null;
    const stepId = String((step && step.id) || '').toLowerCase();

    const pauseAllowed = [
  'listen',
  'listenplus',
  'watch',
  'sound',
  'repeat',
  'match',
  'words',
  'animate'
].includes(stepId);
	  

    if (__pqPracticeFreeUI()) {
      btnPause.disabled = !pauseAllowed;
      btnPause.hidden = !pauseAllowed;
      btnPause.style.display = pauseAllowed ? '' : 'none';
      try { __pqSyncDynamicStepAction(); } catch (_e) {}
      return;
    }

    btnPause.hidden = !pauseAllowed;
    btnPause.style.display = pauseAllowed ? '' : 'none';

    if (!managedProgress || managedProgress.__finished) {
      btnPause.disabled = !pauseAllowed;
      try { __pqSyncDynamicStepAction(); } catch (_e) {}
      return;
    }

    if (stepId === 'lecture') {
      if (!progress || !progress.completed) {
        btnPause.disabled = true;
      } else {
        btnPause.disabled = !pauseAllowed;
      }
      try { __pqSyncDynamicStepAction(); } catch (_e) {}
      return;
    }

    if (stepId === 'speak' || stepId === 'trace1' || stepId === 'write') {
      btnPause.disabled = true;
      try { __pqSyncDynamicStepAction(); } catch (_e) {}
      return;
    }

    btnPause.disabled = !pauseAllowed;

    try { __pqSyncDynamicStepAction(); } catch (_e) {}
  }
  
  function advanceStepIfNeeded() {
    if (!managedProgress) return;

    for (let i = 0; i < (STEPS || []).length; i += 1) {
      const step = STEPS[i];
      if (managedProgress[step.id] && !managedProgress[step.id].completed) {
        managedProgress.currentStepId = step.id;
        fgSyncStepContext(true);

        try {
          __pqForceWriteButtonRefresh();
        } catch (_e) {}

        managedProgress.__finished = false;
        return;
      }
    }

    managedProgress.__finished = true;
  }

  async function persistManagedProgress() {
    try {
      // Managed students: runtime owns persistence.
      if (__LessonRuntime && typeof __LessonRuntime.persist === 'function') {
        await __LessonRuntime.persist();
      } else {
        // Fallback only
        await sendManagedToMoodle(managedProgress);
      }
    } catch (_e) {
      // swallow to keep UI usable
    }

    try {
      __pqForceWriteButtonRefresh();
    } catch (_e) {}
  }

  function __pqApplyRuntimeCompletion(stepId, runtimeResult) {
    try {
      const runtimeProgress =
        (runtimeResult && (runtimeResult.progress ||
        (runtimeResult.state && runtimeResult.state.progress))) || null;

      const stickyReviewId = String(__pqStickyReviewStepId || '').trim();
      const keepStickyReview = !!(
        __pqIsReviewMode() &&
        stickyReviewId &&
        stickyReviewId === String(stepId || '').trim()
      );

      if (runtimeProgress) {
        managedProgress = ensureProgressShape(runtimeProgress);

        if (keepStickyReview && managedProgress) {
          managedProgress.currentStepId = stickyReviewId;
          managedProgress.__finished = false;
        }

        __pqNormalizeCurrentStepId();
      } else if (managedProgress && managedProgress[stepId]) {
        const progress = managedProgress[stepId];
        progress.passesDone = Math.max(
          Number(progress.passesDone || 0),
          Number(progress.passesRequired || 1)
        );
        progress.completed = true;

        if (keepStickyReview) {
          managedProgress.currentStepId = stickyReviewId;
          managedProgress.__finished = false;
        } else {
          advanceStepIfNeeded();
        }
      }
    } catch (_e) {
      try {
        if (managedProgress && managedProgress[stepId]) {
          const progress = managedProgress[stepId];
          progress.passesDone = Math.max(
            Number(progress.passesDone || 0),
            Number(progress.passesRequired || 1)
          );
          progress.completed = true;

          const stickyReviewId = String(__pqStickyReviewStepId || '').trim();
          const keepStickyReview = !!(
            __pqIsReviewMode() &&
            stickyReviewId &&
            stickyReviewId === String(stepId || '').trim()
          );

          if (keepStickyReview) {
            managedProgress.currentStepId = stickyReviewId;
            managedProgress.__finished = false;
          } else {
            advanceStepIfNeeded();
          }
        }
      } catch (_e2) {}
    }
  }

function __pqRefreshAfterStepCompletion() {
  __pqApplyModeUI();

  try {
    fgSyncStepContext(true);
  } catch (_e) {}

  renderStepper();
  renderGrid();
  updateControlsForCurrentStep();

  try {
    __pqForceWriteButtonRefresh();
  } catch (_e) {}

  try {
    __pqForceSpeakUiRefresh();
  } catch (_e) {}

  __pqAfterProgressChange(true);

  try {
    __pqRenderRewardStars(true);
  } catch (_e) {}
}
async function markLectureCompleted() {
  const stepId = 'lecture';

  try {
    const progress = managedProgress && managedProgress[stepId];
    const alreadyDone = !!(
      progress &&
      (
        progress.completed ||
        (Number(progress.passesDone || 0) >= Number(progress.passesRequired || 1))
      )
    );

    if (alreadyDone) {
      __pqLectureCompleteHandled = true;
    }

    if (__pqLectureCompleteHandled || __pqLectureCompleteInFlight || alreadyDone) {
      STEPS = __pqInjectWatchStep(STEPS || []);
      __pqRefreshAfterStepCompletion();

      try {
        __pqPlaylistEngine = null;
      } catch (_e) {}

      return;
    }

    __pqLectureCompleteInFlight = true;

    if (__LessonRuntime && typeof __LessonRuntime.completeStep === 'function') {
      const runtimeResult = await __LessonRuntime.completeStep(stepId);
      __pqApplyRuntimeCompletion(stepId, runtimeResult);

      __pqNormalizeCurrentStepId();
      __pqLectureCompleteHandled = true;
    }
  } catch (_e) {
    // Do not throw — keep UI alive
  } finally {
    __pqLectureCompleteInFlight = false;
  }

  STEPS = __pqInjectWatchStep(STEPS || []);
  __pqRefreshAfterStepCompletion();

  try {
    __pqPlaylistEngine = null;
  } catch (_e) {}
}

async function markPlaylistStepCompleted(stepId) {
  try {
    if (__LessonRuntime && typeof __LessonRuntime.completeStep === 'function') {
      const runtimeResult = await __LessonRuntime.completeStep(stepId);
      __pqApplyRuntimeCompletion(stepId, runtimeResult);

      __pqNormalizeCurrentStepId();
    } else {
      const progress = managedProgress[stepId];
      if (progress) {
        progress.passesDone += 1;
        if (progress.passesDone >= progress.passesRequired) {
          progress.completed = true;
        }
      }

      advanceStepIfNeeded();
      await persistManagedProgress();
    }
  } catch (_e) {
    // keep UI alive
  }

  // Reset per-step letter plays when the pass completes
  try {
    if (letterPlays && letterPlays[stepId]) {
      letterPlays[stepId] = {};
      flushLetterPlays();
    }
  } catch (_e) {}

  __pqRefreshAfterStepCompletion();

  if (btnReset) {
    btnReset.style.display = managedProgress && managedProgress.__finished ? '' : 'none';
  }

  try {
    __pqPlaylistEngine = null;
  } catch (_e) {}
}
  function __pqShowSpeakPopup(message) {
    try {
      let overlay = document.getElementById('pqSpeakPopup');

      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pqSpeakPopup';
        overlay.innerHTML = `
          <div class="pq-speak-popup-box">
            <div class="pq-speak-popup-msg"></div>
                 <button class="pq-speak-popup-btn">${__PQ_TEXT_CACHE.speakPopupOk}</button>
          </div>
        `;

        const style = document.createElement('style');
                style.textContent = `
#pqSpeakPopup {
  position: fixed;
  inset: 0;
  background: ${__PQ_SPEAK_POPUP_UI.overlayBackground};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${__PQ_SPEAK_POPUP_UI.zIndex};
}
.pq-speak-popup-box {
  background: ${__PQ_SPEAK_POPUP_UI.boxBackground};
  border-radius: ${__PQ_SPEAK_POPUP_UI.boxBorderRadius};
  padding: ${__PQ_SPEAK_POPUP_UI.boxPadding};
  max-width: ${__PQ_SPEAK_POPUP_UI.boxMaxWidth};
  width: ${__PQ_SPEAK_POPUP_UI.boxWidth};
  text-align: ${__PQ_SPEAK_POPUP_UI.boxTextAlign};
  box-shadow: ${__PQ_SPEAK_POPUP_UI.boxShadow};
  font-weight: ${__PQ_SPEAK_POPUP_UI.boxFontWeight};
}
.pq-speak-popup-msg {
  margin-bottom: ${__PQ_SPEAK_POPUP_UI.messageMarginBottom};
  font-size: ${__PQ_SPEAK_POPUP_UI.messageFontSize};
}
.pq-speak-popup-btn {
  border: 0;
  background: ${__PQ_SPEAK_POPUP_UI.buttonBackground};
  color: ${__PQ_SPEAK_POPUP_UI.buttonColor};
  padding: ${__PQ_SPEAK_POPUP_UI.buttonPadding};
  border-radius: ${__PQ_SPEAK_POPUP_UI.buttonBorderRadius};
  font-weight: ${__PQ_SPEAK_POPUP_UI.buttonFontWeight};
  cursor: pointer;
}
        `;

        document.head.appendChild(style);

        document.body.appendChild(overlay);

        overlay.querySelector('.pq-speak-popup-btn').onclick = function () {
          overlay.style.display = 'none';
        };
      }

      const msgEl = overlay.querySelector('.pq-speak-popup-msg');
      if (msgEl) msgEl.textContent = message || '';

      overlay.style.display = 'flex';
    } catch (_e) {}
  }

  // ============================================================
  // SECTION 29: Write system UI sync + stepper rendering
  // ============================================================
  function __pqSyncWriteUI() {
    const api = __pqEnsureSharedWrite();
    return api ? api.syncUI() : undefined;
  }

  function renderStepper() {
    if (!stepperRoot || !stepperList) return;

    // Unmanaged free-practice hides stepper.
    // Managed review mode keeps it visible.
    if (__pqShouldHideStepper()) {
      stepperRoot.hidden = true;
      return;
    }

    // Use shared renderer when safe.
    // In review mode, prefer local renderer so completed steps stay clickable.
    if (
      !__pqIsReviewMode() &&
      window.PQStepperUI &&
      typeof window.PQStepperUI.render === 'function' &&
      managedProgress
    ) {
      stepperRoot.hidden = false;

      window.PQStepperUI.render({
        containerEl: stepperList,
        steps: STEPS || [],
        progress: managedProgress,
        currentStepId: managedProgress.currentStepId,
        finished: managedProgress.__finished,
        core: PQManagedCore
      });

      return;
    }

    if (!managedProgress) {
  stepperRoot.hidden = false;
  stepperList.innerHTML = '';

  (STEPS || []).forEach((step, idx) => {
    const item = document.createElement('div');
    item.className = 'managed-step';
    if (idx === 0) item.classList.add('active');

    // Match shared stepper visual state as closely as possible.
    try {
      if (idx === 0) {
        item.style.setProperty('background', '#ffe6c7', 'important');
        item.style.setProperty('border', '3px solid #ffb86b', 'important');
        item.style.setProperty('box-shadow', '0 10px 26px rgba(241,154,42,.25)', 'important');
        item.style.setProperty('opacity', '1', 'important');
        item.style.setProperty('filter', 'none', 'important');
      } else {
        item.style.setProperty('background', '#fff7ec', 'important');
        item.style.setProperty('border', '1px solid #ffe2c2', 'important');
        item.style.setProperty('box-shadow', 'none', 'important');
        item.style.setProperty('opacity', '.45', 'important');
        item.style.setProperty('filter', 'grayscale(.15)', 'important');
      }
    } catch (_e) {}

    const badge = document.createElement('div');
    badge.className = 'managed-step-badge';
    badge.textContent = (idx === 0) ? __PQ_TEXT_CACHE.badgeActive : '🔒';

    const idxEl = document.createElement('div');
    idxEl.className = 'managed-step-index';
    idxEl.textContent = `${__PQ_TEXT_CACHE.stepPrefix} ${idx + 1}`;

    const label = document.createElement('div');
    label.className = 'managed-step-label';
    label.textContent = String(step.label || step.id || '');

    const meta = document.createElement('div');
    meta.className = 'managed-step-meta';
    meta.setAttribute('dir', 'ltr');
    meta.style.unicodeBidi = 'isolate';
    meta.textContent = `${__PQ_TEXT_CACHE.progressLabel} .../...`;

    item.appendChild(badge);
    item.appendChild(idxEl);
    item.appendChild(label);
    item.appendChild(meta);

    stepperList.appendChild(item);
  });
  
      try {
      __pqRenderMobileStepPicker();
    } catch (_e) {}

  return;
}

    stepperRoot.hidden = false;
    stepperList.innerHTML = '';

    // Ensure currentStepId is valid
    try {
      const stepsArr = (STEPS || []);
      let curId = managedProgress.currentStepId;
      const isValid = (id) => !!id && stepsArr.some((step) => step.id === id);

      if (__pqIsReviewMode()) {
        if (!isValid(curId) && stepsArr.length) {
          managedProgress.currentStepId = stepsArr[0].id;
        }
      } else {
        if (
          !isValid(curId) ||
          (managedProgress[curId] && managedProgress[curId].completed)
        ) {
          for (const step of stepsArr) {
            const progress = managedProgress[step.id];
            if (progress && !progress.completed) {
              managedProgress.currentStepId = step.id;
              curId = step.id;
              break;
            }
          }
        }

        if (!isValid(managedProgress.currentStepId) && stepsArr.length) {
          managedProgress.currentStepId = stepsArr[0].id;
        }
      }
    } catch (_e) {}

    const curId = managedProgress.currentStepId;
    let curIdx = (STEPS || []).findIndex((step) => step.id === curId);
    if (curIdx < 0) curIdx = 0;

    (STEPS || []).forEach((step, idx) => {
      const progress = managedProgress[step.id];
      if (!progress) return;

      const item = document.createElement('div');
      item.className = 'managed-step';

      if (progress.completed) item.classList.add('completed');

      // Locked = later step, not completed, before current position is reached
      if (!progress.completed && !managedProgress.__finished && idx > curIdx) {
        item.classList.add('locked');
      }

      // Active = current visible step
      if (
        (__pqIsReviewMode() && idx === curIdx) ||
        (!progress.completed && !managedProgress.__finished && idx === curIdx)
      ) {
        item.classList.add('active');
      }

      item.setAttribute('data-stepid', String(step.id || ''));

      const badge = document.createElement('div');
      badge.className = 'managed-step-badge';
      badge.textContent = progress.completed
        ? __PQ_TEXT_CACHE.badgeCompleted
        : (idx === curIdx
            ? __PQ_TEXT_CACHE.badgeActive
            : __PQ_TEXT_CACHE.badgePending);

      const idxEl = document.createElement('div');
      idxEl.className = 'managed-step-index';
      idxEl.textContent = `${__PQ_TEXT_CACHE.stepPrefix} ${idx + 1}`;

      const label = document.createElement('div');
      label.className = 'managed-step-label';

      const passesDone = Number(progress.passesDone ?? progress.passes_done ?? 0) || 0;
      const passesRequired = Number(progress.passesRequired ?? progress.passes_required ?? 1) || 1;
      const repeatPerLetter = Number(
        progress.repeatPerLetter ??
        progress.repeats_per_letter ??
        progress.repeat_per_letter ??
        progress.default_repeats_per_letter ??
        progress.defaultRepeatsPerLetter ??
        1
      ) || 1;

      if (step.type === 'playlist') {
        label.textContent = `${step.label} – ${passesRequired}x${repeatPerLetter}`;
      } else {
        label.textContent = step.label;
      }

      const meta = document.createElement('div');
      meta.className = 'managed-step-meta';

      if (PQManagedCore && typeof PQManagedCore.applyProgressText === 'function') {
        PQManagedCore.applyProgressText(
          meta,
          passesDone,
          passesRequired,
          __PQ_TEXT_CACHE.progressLabel
        );
	  } else {
        meta.setAttribute('dir', 'ltr');
        meta.style.unicodeBidi = 'isolate';

		meta.textContent =
         `${__PQ_TEXT_CACHE.progressLabel} ${passesDone}/${passesRequired}`;
      }

      item.appendChild(badge);
      item.appendChild(idxEl);
      item.appendChild(label);
      item.appendChild(meta);

      if (__pqIsReviewMode()) {
        item.classList.add('review-clickable');
        item.tabIndex = 0;
        item.setAttribute('role', 'button');

		item.setAttribute(
          'aria-label',
            `${__PQ_TEXT_CACHE.reviewAriaPrefix} ${String(step.label || step.id || 'step')}`
        );

        item.style.cursor = 'pointer';
        item.style.pointerEvents = 'auto';

        const openReviewFromKeyboard = function (ev) {
          try {
            if (ev) ev.preventDefault();
          } catch (_e) {}

          try {
            if (ev) ev.stopPropagation();
          } catch (_e) {}

          try {
            if (ev) ev.stopImmediatePropagation();
          } catch (_e) {}

          __pqOpenStepForReview(step.id);
        };

        item.addEventListener('keydown', function (ev) {
          const key = ev && (ev.key || ev.code);
          if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
            openReviewFromKeyboard(ev);
          }
        });
      }

      stepperList.appendChild(item);
    });
  }

  try {
    __pqForceWriteButtonRefresh();
  } catch (_e) {}

  // ============================================================
  // SECTION 30: UI bindings
  // ============================================================
  if (btnPlayAll) {
    btnPlayAll.addEventListener('click', playAll);
  }

  if (stepperList) {
    const __pqDelegatedReviewOpen = function (ev) {
      try {
        if (!__pqIsReviewMode()) return;

        const el = ev && ev.target && ev.target.closest
          ? ev.target.closest('[data-stepid]')
          : null;

        const stepId = el && el.getAttribute && el.getAttribute('data-stepid');
        if (!stepId) return;

        try {
          ev.preventDefault();
        } catch (_e) {}

        try {
          ev.stopPropagation();
        } catch (_e) {}

        __pqOpenStepForReview(stepId);
      } catch (_e) {}
    };

    stepperList.addEventListener('click', __pqDelegatedReviewOpen, true);
    stepperList.addEventListener('pointerup', __pqDelegatedReviewOpen, true);
  }

  if (btnPause) {
    btnPause.addEventListener('click', () => {
      try {
        setPaused(!paused);
      } catch (_e) {}
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
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

      setPaused(false);
audio.pause();
selectedIdx = -1;
selectedKey = null;
markActive();

if (btnPlayAll) {
  btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
  btnPlayAll.disabled = false;
}

repeatSel.value = DEFAULTS.repeat;
speedSel.value = DEFAULTS.speed;
filterSel.value = DEFAULTS.filter;
voiceSel.value = DEFAULTS.voice;

    saveSettings();
    renderGrid();
    });
  }

  if (btnGear) {
    btnGear.addEventListener('click', () => sheet.showModal());
  }

  if (closeSheet) {
    closeSheet.addEventListener('click', () => {
      saveSettings();
      sheet.close();
    });
  }

  if (voiceSel) voiceSel.addEventListener('change', saveSettings);

  if (speedSel) {
    speedSel.addEventListener('change', () => {
      const rate = parseFloat(speedSel.value || DEFAULTS.speed);
      audio.playbackRate = rate;
      saveSettings();
    });
  }

  if (repeatSel) repeatSel.addEventListener('change', saveSettings);

  if (filterSel) {
    filterSel.addEventListener('change', () => {
      saveSettings();
      renderGrid();
    });
  }

  // ============================================================
  // SECTION 31: Shell/runtime orchestration
  // ============================================================
  let __DB_ONLY = false;
  let __SOURCE_DB = false;
  let __SOURCE_RUNTIME = false;

  function __pqSetManagedProgress(value) {
    managedProgress = value;
  }

  async function __pqShellInitRuntime() {
    try {
      const core = pqResolveCore() || PQManagedCore;

      if (!(core && typeof core.createLessonRuntime === 'function')) {
        return {
          managedProgress: null,
          sourceDb: false,
          sourceRuntime: false,
          dbOnly: false
        };
      }

      __LessonRuntime = core.createLessonRuntime(LESSON_DEF);

      const state = await __LessonRuntime.init({
        userKey: 'al_last_uid_v1',
        clearKeys: [
          LS_SETTINGS_KEY,
          LS_PROGRESS_CACHE_KEY,
          LS_LETTER_PLAYS_KEY
        ]
      });

      if (state && Array.isArray(state.steps) && state.steps.length) {
        STEPS = __pqInjectWatchStep(
          orderStepsForDisplay(state.steps).map((step) => ({
            id: step.id,
            type: step.type || (step.id === 'lecture' ? 'lecture' : 'playlist'),
            label: __pqWriteLabel(step.label || step.title || step.id),
            filter:
              (step.type === 'lecture')
                ? 'all'
                : (step.filter || __deriveFilterFromStepId(step.id)),
            step_index: step.step_index
          }))
        );
      }

      const runtimeManagedProgress = state ? state.progress : null;

      try {
        const runtimeTotal = Number(state && state.totalstars);
        const runtimeUnits = Number(state && state.completedunits);

        if (Number.isFinite(runtimeTotal) && runtimeTotal >= 0) {
          __pqTotalStars = runtimeTotal;
          try {
            localStorage.setItem('pq_total_stars_earned_v1', String(runtimeTotal));
          } catch (_e) {}
        }

        if (Number.isFinite(runtimeUnits) && runtimeUnits >= 0) {
          __pqCompletedUnits = runtimeUnits;
          try {
            localStorage.setItem('pq_completed_units_count_v1', String(runtimeUnits));
          } catch (_e) {}
        }

        if (
          (!Number.isFinite(runtimeTotal) || runtimeTotal < 0) &&
          (!Number.isFinite(runtimeUnits) || runtimeUnits < 0)
        ) {
          await __pqFetchTotalStarsFromMoodle();
        }
      } catch (_e) {}

      pqSetSourceIndicator('Source: DB');

      return {
        managedProgress: ensureProgressShape(runtimeManagedProgress),
        sourceDb: true,
        sourceRuntime: true,
        dbOnly: __pqIsManagedUser()
      };
    } catch (_e) {
      return {
        managedProgress: null,
        sourceDb: false,
        sourceRuntime: false,
        dbOnly: false
      };
    }
  }

  async function __pqShellInitLegacyFallback() {
    let progress = null;
    let sourceDb = false;

    try {
      progress = await fetchManagedFromMoodle();

      if (progress) {
        pqSetSourceIndicator('Source: DB');
        sourceDb = true;
      }

      if (!Number.isFinite(Number(__pqTotalStars)) || Number(__pqTotalStars) < 0) {
        await __pqFetchTotalStarsFromMoodle();
      }
    } catch (_e) {}

    if (!progress) {
      try {
        const raw = localStorage.getItem(LS_PROGRESS_CACHE_KEY);
        progress = raw ? JSON.parse(raw) : null;

        if (progress) {
          pqSetSourceIndicator('Source: Local cache');
        }
      } catch (_e) {
        progress = null;
      }
    }

    return {
      managedProgress: ensureProgressShape(progress),
      sourceDb: sourceDb,
      sourceRuntime: false,
      dbOnly: (__pqIsManagedUser() && sourceDb)
    };
  }

  function __pqShellBeforeInit() {
    try {
      const el = document.getElementById('pqDataSource');
      if (el) el.style.display = 'none';
    } catch (_e) {}

    try {
      pqInjectAttentionToggle();
    } catch (_e) {}
  }

  function __pqShellAfterProgressReady(state) {
    __SOURCE_DB = !!(state && state.sourceDb);
    __SOURCE_RUNTIME = !!(state && state.sourceRuntime);
    __DB_ONLY = !!(state && state.dbOnly);

    if (!__pqIsManagedUser()) {
      managedProgress = null;
      __SOURCE_DB = false;
      __SOURCE_RUNTIME = false;
      __DB_ONLY = false;
    }

    try {
      __pqNormalizeWriteChunkPasses();
    } catch (_e) {}

    try {
      __pqLectureCompleteHandled = !!(
        managedProgress &&
        managedProgress.lecture &&
        managedProgress.lecture.completed
      );
    } catch (_e) {}

    try {
      const reloadKey =
        __PQ_WRITE_RELOAD_KEY;

      const writeProgress = managedProgress && managedProgress.write;
      const stillPending = !!(
        writeProgress &&
        !writeProgress.completed &&
        Number(writeProgress.passesDone || 0) <
          Number(writeProgress.passesRequired || 1)
      );

      if (sessionStorage.getItem(reloadKey) === '1' && !stillPending) {
        sessionStorage.removeItem(reloadKey);
      }
    } catch (_e) {}

    __pqApplyModeUI();
  }

  function __pqShellBindFocus() {
    try {
      const __bindNow = function () {
        try {
          const api = __pqEnsureFocusAdapter();
          if (!api) return false;

          __FG_LESSON_ID = pqFocusLessonId();
          __FG_UNIT_ID = pqFocusUnitId();
          __FG_SESSION_ID = pqFocusGetSessionId(
            pqGetUid(),
            __FG_LESSON_ID,
            __FG_UNIT_ID
          );
          __FG_ENABLED = true;

          const ok = api.bind();
          return !!ok;
        } catch (_e) {
          return false;
        }
      };

      if (__bindNow()) return;

      try {
        requestAnimationFrame(function () {
          __bindNow();
        });
      } catch (_e) {}

      try {
        setTimeout(function () {
          __bindNow();
        }, 1200);
      } catch (_e) {}

      try {
        setTimeout(function () {
          __bindNow();
        }, 2500);
      } catch (_e) {}
    } catch (_e) {}
  }

  function __pqShellBindLecture() {
    pqBindLectureOnce();
    pqBindLectureCtaBridge();
  }

function __pqShellBindUi() {
  try {
    __pqBindDelegatedGridClick();
  } catch (_e) {}

  try {
    __pqEnsureDynamicActionHost();
  } catch (_e) {}

  try {
    const writeApi = __pqEnsureSharedWrite();
    if (writeApi) writeApi.bind();
  } catch (_e) {}

  try {
    __pqEnsureSpeakBoot();
  } catch (_e) {}

  try {
    __pqInstallSimplifiedSpeakUi();
  } catch (_e) {}

  try {
    __pqSyncDynamicStepAction();
  } catch (_e) {}
}

function __pqShellRender() {
  try {
    document.body.classList.add('pq-app-ready');
  } catch (_e) {}

  try {
    __pqNormalizeWriteChunkPasses();
  } catch (_e) {}

  try {
    __pqEnsureDynamicActionHost();
  } catch (_e) {}

  try {
    __pqHideLegacyPlayAllButton();
  } catch (_e) {}

  try {
    __pqHideLegacyWriteButton();
  } catch (_e) {}

  try {
    __pqHideLegacyLectureButton();
  } catch (_e) {}

  try {
    __pqEnsureBottomDockPlacement();
  } catch (_e) {}

  __pqApplyModeUI();
  renderStepper();
  renderGrid();
  updateControlsForCurrentStep();

  try {
    __pqEnsureSpeakBoot();
  } catch (_e) {}

  try {
    __pqForceSpeakUiRefresh();
  } catch (_e) {}

  try {
    __pqSyncDynamicStepAction();
  } catch (_e) {}

  if (btnReset && managedProgress) {
    btnReset.style.display = managedProgress.__finished ? '' : 'none';
  }

  setTimeout(() => {
    try {
      __pqAfterProgressChange(
        managedProgress && managedProgress.__finished ? false : true
      );
    } catch (_e) {}
  }, 120);

  try {
    __pqRenderRewardStars(false);
  } catch (_e) {}

  try {
    __pqRenderMobileStepPicker();
  } catch (_e) {}
}

  function __pqShellBindAutoCache() {
    if (PQManagedCore && typeof PQManagedCore.bindAutoCache === 'function') {
      if (__DB_ONLY) {
        try {
          localStorage.removeItem(LS_PROGRESS_CACHE_KEY);
        } catch (_e) {}
      } else {
        PQManagedCore.bindAutoCache({
          getProgress: () => managedProgress,
          getLetterPlays: () => letterPlays,
          progressKey: LS_PROGRESS_CACHE_KEY,
          letterPlaysKey: LS_LETTER_PLAYS_KEY
        });
      }
    }
  }

  async function __pqRefactoredStart() {
    let __pqTokenReadyPromise = Promise.resolve();

    try {
      if (typeof window.pqWaitForIframeTokens === 'function') {
        __pqTokenReadyPromise = window.pqWaitForIframeTokens(5000);
      }
    } catch (_e) {}


    if (window.PQLessonShell && typeof window.PQLessonShell.start === 'function') {
  try {
    __pqShellBeforeInit();

    try {
      const settings = loadSettings();
      applySettingsToUI(settings);
    } catch (_e) {}

    try {
      renderGrid();
    } catch (_e) {}

    try {
      renderStepper();
    } catch (_e) {}

    try {
      updateControlsForCurrentStep();
    } catch (_e) {}

    try {
      __pqRenderRewardStars(false);
    } catch (_e) {}

    try {
      pqBindLectureOnce();
    } catch (_e) {}

    try { await Promise.resolve(__pqTokenReadyPromise); } catch (_e) {}

    await window.PQLessonShell.start({
      beforeInit: function () {},
      loadSettings: () => loadSettings(),
      applySettingsToUI: (settings) => applySettingsToUI(settings),
      initRuntime: __pqShellInitRuntime,
      initLegacyFallback: __pqShellInitLegacyFallback,
      setManagedProgress: __pqSetManagedProgress,
      afterProgressReady: __pqShellAfterProgressReady,


		  bindFocus: function () {
  setTimeout(() => {
    try {
      __pqShellBindFocus();
    } catch (_e) {}
  }, 0);
},

          bindLecture: __pqShellBindLecture,
bindUi: __pqShellBindUi,

render: function () {
  try {
    renderStepper();
    renderGrid();
    updateControlsForCurrentStep();
    __pqRenderRewardStars(false);
  } catch (_e) {}

  setTimeout(() => {
    try {
      __pqShellRender();
    } catch (_e) {}
  }, 0);
},

bindAutoCache: __pqShellBindAutoCache
        });
        return;
      } catch (e) {
        throw e;
      }
    }

    // Safe fallback when lesson shell is unavailable
        // Safe fallback when lesson shell is unavailable
    __pqShellBeforeInit();

    const settings = loadSettings();
    applySettingsToUI(settings);

    // Early shell render so the page does not look blank while runtime hydrates
    try {
      renderGrid();
    } catch (_e) {}

    try {
      renderStepper();
    } catch (_e) {}

    try {
      updateControlsForCurrentStep();
    } catch (_e) {}

	try {
      __pqRenderRewardStars(false);
    } catch (_e) {}

    try {
      pqBindLectureOnce();
    } catch (_e) {}

    try { await Promise.resolve(__pqTokenReadyPromise); } catch (_e) {}
    // Start runtime init in parallel after early paint
    const fallbackStatePromise = __pqShellInitRuntime();
    const fallbackState = await fallbackStatePromise;

    if (!fallbackState.managedProgress) {
      const legacy = await __pqShellInitLegacyFallback();
      __pqSetManagedProgress(legacy.managedProgress);
      __pqShellAfterProgressReady(legacy);
    } else {
      __pqSetManagedProgress(fallbackState.managedProgress);
      __pqShellAfterProgressReady(fallbackState);
    }

    setTimeout(() => {
  try {
    __pqShellBindFocus();
  } catch (_e) {}
}, 0);

    __pqShellBindLecture();
__pqShellBindUi();

// FAST render (steps + grid first)
try {
  renderStepper();
  renderGrid();
  updateControlsForCurrentStep();
} catch (_e) {}

// DEFER heavy UI work
setTimeout(() => {
  try {
    __pqShellRender();
  } catch (_e) {}
}, 0);

__pqShellBindAutoCache();

  }  
  
let __pqResizeTimer = null;

try {
  if (!window.__pqBoardSpanResizeBound__) {
    window.addEventListener('resize', function () {
      try {
        if (__pqResizeTimer) {
          clearTimeout(__pqResizeTimer);
        }
      } catch (_e) {}

              __pqResizeTimer = setTimeout(function () {
        try {
          __pqEnsureBottomDockPlacement();
        } catch (_e) {}

        try {
          __pqRenderMobileStepPicker();
        } catch (_e) {}

        try {
          __pqApplyGridLayout();
          renderGrid();
        } catch (_e) {}
      }, 140);
    });

    window.__pqBoardSpanResizeBound__ = true;
  }
} catch (_e) {}
  
  // ============================================================
  // SECTION 32: Startup
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      function () {
        __pqRefactoredStart().catch(function (e) {
          throw e;
        });
      },
      { once: true }
    );
  } else {
    __pqRefactoredStart().catch(function (e) {
      throw e;
    });
  }
})();
