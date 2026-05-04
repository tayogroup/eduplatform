(function (window, document) {
  'use strict';

  if (window.PQSharedSpeakRuntime && window.PQSharedSpeakRuntime.__version) {
    return;
  }

  const VERSION = 'pq_shared_speak_runtime_v1.0.0_locked';

  function noop() {}

  function cssEscape(value) {
    const key = String(value || '');
    try {
      if (window.CSS && typeof window.CSS.escape === 'function') {
        return window.CSS.escape(key);
      }
    } catch (_e) {}
    return key.replace(/["\\]/g, '\\$&');
  }

  function loadMap(storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_e) {
      return {};
    }
  }

  function saveMap(storageKey, map) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(map || {}));
    } catch (_e) {}
  }

  function create(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const state = opts.state && typeof opts.state === 'object'
      ? opts.state
      : {
          selectedKey: '',
          completedKeys: {},
          totalKeys: 0,
          isRecording: false,
          lastRecordingAt: 0,
          silenceStopTimer: null,
          silenceWatchTimer: null
        };

    const getStorageKey = typeof opts.getStorageKey === 'function'
      ? opts.getStorageKey
      : function () { return opts.storageKey || 'pq_speak_done_keys_shared'; };

    const getTotal = typeof opts.getTotal === 'function'
      ? opts.getTotal
      : function () {
          try {
            return document.querySelectorAll(opts.tileSelector || '#grid .tile[data-key]').length || 0;
          } catch (_e) {
            return 0;
          }
        };

    const onDone = typeof opts.onDone === 'function' ? opts.onDone : noop;
    const onStopRecording = typeof opts.onStopRecording === 'function' ? opts.onStopRecording : noop;
    const tileSelectorPrefix = opts.tileSelectorPrefix || '#grid .tile[data-key="';
    const tileSelectorSuffix = opts.tileSelectorSuffix || '"]';
    const doneClass = opts.doneClass || 'pq-speak-done';
    const progressBadgeId = opts.progressBadgeId || 'pqSpeakProgressBadge';
    const progressChipId = opts.progressChipId || 'pqSpeakProgressChip';
    const progressChipPrefix = opts.progressChipPrefix || 'Done ';

    function storageKey() {
      return String(getStorageKey() || 'pq_speak_done_keys_shared');
    }

    function loadDoneMap() {
      return loadMap(storageKey());
    }

    function saveDoneMap() {
      saveMap(storageKey(), state.completedKeys || {});
    }

    function ensureStateShape() {
      try {
        const saved = loadDoneMap();

        if (!state.completedKeys || typeof state.completedKeys !== 'object') {
          state.completedKeys = {};
        }

        Object.keys(saved).forEach(function (key) {
          if (saved[key]) state.completedKeys[key] = true;
        });

        state.totalKeys = total();
      } catch (_e) {}
    }

    function total() {
      try {
        return Math.max(0, Number(getTotal()) || 0);
      } catch (_e) {
        return 0;
      }
    }

    function completedCount() {
      try {
        ensureStateShape();
        return Object.keys(state.completedKeys || {}).filter(function (key) {
          return !!state.completedKeys[key];
        }).length;
      } catch (_e) {
        return 0;
      }
    }

    function isKeyCompleted(key) {
      try {
        key = String(key || '').trim();
        if (!key) return false;
        ensureStateShape();
        return !!(state.completedKeys && state.completedKeys[key]);
      } catch (_e) {
        return false;
      }
    }

    function greyTile(key) {
      try {
        key = String(key || '').trim();
        if (!key) return;

        const tile = document.querySelector(tileSelectorPrefix + cssEscape(key) + tileSelectorSuffix);
        if (!tile) return;

        tile.classList.add('played', 'completed', doneClass);
        tile.classList.remove('pq-playing', 'is-playing');

        if (String(state.selectedKey || '') !== key) {
          tile.classList.remove('active');
        }

        tile.setAttribute('data-speak-done', '1');
        tile.style.opacity = '0.45';
        tile.style.filter = 'grayscale(0.25)';
      } catch (_e) {}
    }

    function applyDoneTiles() {
      try {
        ensureStateShape();
        const doneMap = state.completedKeys || {};
        Object.keys(doneMap).forEach(function (key) {
          if (doneMap[key]) greyTile(key);
        });
      } catch (_e) {}
    }

    function refreshProgress() {
      try {
        const done = completedCount();
        const countTotal = Number(state.totalKeys || 0) || total();
        const text = done + '/' + countTotal;

        const badge = document.getElementById(progressBadgeId);
        if (badge) badge.textContent = text;

        const chip = document.getElementById(progressChipId);
        if (chip) chip.textContent = progressChipPrefix + text;
      } catch (_e) {}
    }

    function setSelectedKey(key) {
      try {
        state.selectedKey = String(key || '').trim();
      } catch (_e) {}
    }

    function markSelectedDone() {
      try {
        const key = String(state.selectedKey || '').trim();
        if (!key) return false;

        if (!state.completedKeys || typeof state.completedKeys !== 'object') {
          state.completedKeys = {};
        }

        state.completedKeys[key] = true;
        saveDoneMap();
        greyTile(key);
        refreshProgress();
        onDone(key);

        [80, 300, 800].forEach(function (delay) {
          setTimeout(function () {
            try {
              greyTile(key);
              refreshProgress();
            } catch (_e) {}
          }, delay);
        });

        return true;
      } catch (_e) {
        return false;
      }
    }

    function clearRecordingTimers() {
      try {
        if (state.silenceStopTimer) clearTimeout(state.silenceStopTimer);
      } catch (_e) {}
      try {
        if (state.silenceWatchTimer) clearInterval(state.silenceWatchTimer);
      } catch (_e) {}

      state.silenceStopTimer = null;
      state.silenceWatchTimer = null;
    }

    function stopRecordingVisualOnly() {
      try {
        state.isRecording = false;
        state.lastRecordingAt = Date.now();
        clearRecordingTimers();
        onStopRecording();
      } catch (_e) {}
    }

    function startSilenceAutoStop(callback, delayMs) {
      try {
        clearRecordingTimers();
        state.silenceStopTimer = setTimeout(function () {
          try {
            if (typeof callback === 'function') callback();
          } catch (_e) {}
          stopRecordingVisualOnly();
        }, Math.max(0, Number(delayMs || 2000) || 2000));
      } catch (_e) {}
    }

    return {
      __version: VERSION,
      state,
      storageKey,
      loadDoneMap,
      saveDoneMap,
      ensureStateShape,
      total,
      completedCount,
      isKeyCompleted,
      greyTile,
      applyDoneTiles,
      refreshProgress,
      setSelectedKey,
      markSelectedDone,
      clearRecordingTimers,
      stopRecordingVisualOnly,
      startSilenceAutoStop
    };
  }

  window.PQSharedSpeakRuntime = {
    __version: VERSION,
    create
  };
})(window, document);
