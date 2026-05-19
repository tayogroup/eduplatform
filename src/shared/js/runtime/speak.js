/*
  Pre-Quraan Alphabet runtime fragment: speak.js
  Speak bridge, Speak modal, Speak progress, and recording controls.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
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

    const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1') || 1;

    if (typeof playLetter === 'function') {
      await playLetter(key, 1, rate, 'speak');
      return true;
    }

    const fileName = AUDIO_MAP && AUDIO_MAP[key];
    if (!fileName) {
      throw new Error('No audio mapped for Speak reference: ' + key);
    }

    const url = __pqAppendAssetVersion(AUDIO_BASE + String(fileName));

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

// Backward-compatible alias for older locked adapter versions that still read
// the legacy shared Speak bridge name.
window.__pqTanweenSpeak = window.__pqSpeakBridge;

let __pqSpeakUiState = {
  selectedKey: '',
  completedKeys: {},
  totalKeys: 0,
  isRecording: false,
  lastRecordingAt: 0,
  silenceStopTimer: null,
  silenceWatchTimer: null
};

try {
  window.__pqSpeakUiState = __pqSpeakUiState;
} catch (_e) {}

const __pqSharedSpeakRuntime = (function () {
  try {
    if (
      !window.PQSharedSpeakRuntime ||
      typeof window.PQSharedSpeakRuntime.create !== 'function'
    ) {
      return null;
    }

    return window.PQSharedSpeakRuntime.create({
      state: __pqSpeakUiState,
      getStorageKey: function () {
        return __pqStorageKey('speakDoneKeys', 'pq_speak_done_keys_' + __PQ_UNIT_ID);
      },
      getTotal: function () {
        try { if (Array.isArray(PLAY_SEQUENCE_KEYS) && PLAY_SEQUENCE_KEYS.length) return PLAY_SEQUENCE_KEYS.length; } catch (_e) {}
        try { if (Array.isArray(LETTERS) && LETTERS.length) return LETTERS.length; } catch (_e) {}
        try { return document.querySelectorAll('#grid .tile[data-key]').length || 0; } catch (_e) {}
        return 0;
      },
      onDone: function () {
        try { __pqSpeakSyncManagedProgressFromDoneKeys(true); } catch (_e) {}
      },
      onStopRecording: function () {
        try { __pqSyncSimplifiedSpeakUi(); } catch (_e) {}
      }
    });
  } catch (_e) {
    return null;
  }
})();


function __pqSpeakDoneStorageKeyFinal() {
  try {
    if (__pqSharedSpeakRuntime) return __pqSharedSpeakRuntime.storageKey();
    return __pqStorageKey('speakDoneKeys', 'pq_speak_done_keys_' + __PQ_UNIT_ID);
  } catch (_e) {
    return 'pq_speak_done_keys_' + __PQ_UNIT_ID;
  }
}

function __pqSpeakLoadDoneMapFinal() {
  try {
    if (__pqSharedSpeakRuntime) return __pqSharedSpeakRuntime.loadDoneMap();
    const raw = localStorage.getItem(__pqSpeakDoneStorageKeyFinal());
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_e) {
    return {};
  }
}

function __pqSpeakSaveDoneMapFinal() {
  try {
    if (__pqSharedSpeakRuntime) {
      __pqSharedSpeakRuntime.saveDoneMap();
      return;
    }
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
  try { if (__pqSharedSpeakRuntime) return __pqSharedSpeakRuntime.total(); } catch (_e) {}
  try { if (Array.isArray(PLAY_SEQUENCE_KEYS) && PLAY_SEQUENCE_KEYS.length) return PLAY_SEQUENCE_KEYS.length; } catch (_e) {}
  try { if (Array.isArray(LETTERS) && LETTERS.length) return LETTERS.length; } catch (_e) {}
  try { return document.querySelectorAll('#grid .tile[data-key]').length || 0; } catch (_e) {}
  return 0;
}

function __pqSpeakGreyTileFinal(key) {
  try {
    if (__pqSharedSpeakRuntime) {
      __pqSharedSpeakRuntime.greyTile(key);
      return;
    }
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

function __pqSpeakIsCurrentStepFinal() {
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

function __pqSpeakClearDoneTileVisualsFinal() {
  try {
    const tiles = document.querySelectorAll('#grid .tile.pq-speak-done, #grid .tile[data-speak-done="1"]');
    tiles.forEach(function (tile) {
      tile.classList.remove('pq-speak-done');
      tile.removeAttribute('data-speak-done');
      if (tile.style.opacity === '0.45') tile.style.opacity = '';
      if (String(tile.style.filter || '').indexOf('grayscale') !== -1) tile.style.filter = '';
    });
  } catch (_e) {}
}

function __pqSpeakApplyDoneTilesFinal() {
  try {
    if (!__pqSpeakIsCurrentStepFinal()) {
      __pqSpeakClearDoneTileVisualsFinal();
      return;
    }
    if (__pqSharedSpeakRuntime) {
      __pqSharedSpeakRuntime.applyDoneTiles();
      return;
    }
    const doneMap = __pqSpeakUiState.completedKeys || {};
    Object.keys(doneMap).forEach(function (key) {
      if (doneMap[key]) __pqSpeakGreyTileFinal(key);
    });
  } catch (_e) {}
}

function __pqSpeakRefreshProgressFinal() {
  try {
    if (__pqSharedSpeakRuntime) {
      __pqSharedSpeakRuntime.refreshProgress();
      return;
    }
    const done = __pqSpeakCompletedCount();
    const total = Number(__pqSpeakUiState.totalKeys || 0) || __pqSpeakTotalFinal();
    const text = done + '/' + total;

    const badge = document.getElementById('pqSpeakProgressBadge');
    if (badge) badge.textContent = text;

    const chip = document.getElementById('pqSpeakProgressChip');
    if (chip) chip.textContent = 'Done ' + text;
  } catch (_e) {}
}

function __pqSpeakRefreshCompletionUiFinal(key) {
  try {
    __pqSpeakGreyTileFinal(key);
    __pqSpeakRefreshProgressFinal();
    __pqSpeakApplyDoneTilesFinal();

    try { __pqSpeakFinalGreyTile(key); } catch (_e) {}
    try { __pqSpeakFinalRefreshProgress(); } catch (_e) {}
    try { __pqSpeakFinalRefreshDoneTiles(); } catch (_e) {}

    try { __pqSpeakModalGreyTileFinal(key); } catch (_e) {}
    try { __pqSpeakModalRefreshProgressFinal(); } catch (_e) {}
    try { __pqSpeakModalRefreshDoneTilesFinal(); } catch (_e) {}
  } catch (_e) {}
}

async function __pqSpeakCompleteKey(key, options) {
  const opts = options || {};
  const shouldPersist = opts.persist !== false;
  const shouldCloseModal = !!opts.closeModal;

  try {
    key = String(key || __pqSpeakUiState.selectedKey || '').trim();
    if (!key) return false;

    __pqSpeakEnsureStateShape();

    if (!__pqSpeakUiState.completedKeys || typeof __pqSpeakUiState.completedKeys !== 'object') {
      __pqSpeakUiState.completedKeys = {};
    }

    __pqSpeakUiState.selectedKey = key;
    __pqSpeakUiState.completedKeys[key] = true;

    try {
      if (__pqSpeakModalRecFinalState && __pqSpeakModalRecFinalState.doneKeys) {
        __pqSpeakModalRecFinalState.doneKeys[key] = true;
      }
    } catch (_e) {}

    __pqSpeakSaveDoneMapFinal();
    __pqSpeakRefreshCompletionUiFinal(key);

    await __pqSpeakSyncManagedProgressFromDoneKeys(shouldPersist);

    if (shouldCloseModal) {
      try {
        const m = document.getElementById('pqSpeakChildModal');
        if (m) m.classList.remove('is-open');
      } catch (_e) {}

      try { __pqSpeakModalReleaseMic(); } catch (_e) {}
    }

    try { __pqSyncSimplifiedSpeakUi(); } catch (_e) {}
    try { __pqSpeakModalRefreshButtons(); } catch (_e) {}

    [80, 300, 800].forEach(function (delay) {
      setTimeout(function () {
        try { __pqSpeakRefreshCompletionUiFinal(key); } catch (_e) {}
      }, delay);
    });

    return true;
  } catch (_e) {
    return false;
  }
}

function __pqSpeakFinalizeDoneFinal() {
  return __pqSpeakCompleteKey(__pqSpeakUiState.selectedKey, { persist: true });
}

function __pqSpeakInstallDoneBinderFinal(compareBtn) {
  try {
    if (!compareBtn || compareBtn.__pqSpeakDoneBinderFinal__) return;
    compareBtn.__pqSpeakDoneBinderFinal__ = true;

    compareBtn.addEventListener('click', function (ev) {
      try {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
      } catch (_e) {}

      setTimeout(function () {
        try {
          if (typeof __pqSpeakModalDoneFinal === 'function') {
            Promise.resolve(__pqSpeakModalDoneFinal()).catch(function () {});
          } else {
            Promise.resolve(__pqSpeakFinalizeDoneFinal()).catch(function () {});
          }
        } catch (_e) {}
      }, 40);
    }, true);
  } catch (_e) {}
}


function __pqSpeakEnsureStateShape() {
  try {
    if (__pqSharedSpeakRuntime) {
      __pqSharedSpeakRuntime.ensureStateShape();
      return;
    }
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
    if (__pqSharedSpeakRuntime) return __pqSharedSpeakRuntime.completedCount();
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
    if (__pqSharedSpeakRuntime) return __pqSharedSpeakRuntime.isKeyCompleted(key);
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
    if (__pqSharedSpeakRuntime) {
      __pqSharedSpeakRuntime.setSelectedKey(key);
      return;
    }
  } catch (_e) {}
}

function __pqSpeakGetSelectedKey() {
  try {
    const key = String((__pqSpeakUiState && __pqSpeakUiState.selectedKey) || '').trim();
    if (key) return key;
  } catch (_e) {}

  try {
    const activeTile = document.querySelector('#grid .tile.active[data-key], #grid .tile.pq-playing[data-key], #grid .tile.is-playing[data-key]');
    const activeKey = activeTile ? String(activeTile.getAttribute('data-key') || activeTile.dataset.key || '').trim() : '';
    if (activeKey) return activeKey;
  } catch (_e) {}

  try {
    const selected = window.__pq_selected_alphabet || null;
    const selectedKey = selected ? String(selected.key || selected.id || '').trim() : '';
    if (selectedKey) return selectedKey;
  } catch (_e) {}

  return '';
}

async function __pqPlaySpeakChildModalLetter() {
  try {
    const key = __pqSpeakGetSelectedKey();
    if (!key || typeof playLetter !== 'function') return false;

    const rate = Number(__cfg('playback.steps.speak.letterPlaybackRate', 1) || 1) || 1;
    await playLetter(key, 1, rate, 'speak');
    return true;
  } catch (_e) {
    return false;
  }
}

function __pqSpeakClearRecordingTimers() {
  try {
    if (__pqSharedSpeakRuntime) {
      __pqSharedSpeakRuntime.clearRecordingTimers();
      return;
    }
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
    if (__pqSharedSpeakRuntime) {
      __pqSharedSpeakRuntime.stopRecordingVisualOnly();
      return;
    }
    __pqSpeakUiState.isRecording = false;
    __pqSpeakUiState.lastRecordingAt = Date.now();
    __pqSpeakClearRecordingTimers();
    __pqSyncSimplifiedSpeakUi();
  } catch (_e) {}
}

function __pqSpeakStartSilenceAutoStop() {
  try {
    if (__pqSharedSpeakRuntime) {
      __pqSharedSpeakRuntime.startSilenceAutoStop(function () {
        try {
          const recordBtn = document.getElementById('pqSpeakBtnRecord');
          if (recordBtn) {
            try { recordBtn.click(); } catch (_e) {}
          }
        } catch (_e) {}
      }, 2000);
      return;
    }
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

function __pqSetSpeakStepActive(isActive) {
  try {
    document.body.classList.toggle('pq-speak-step-active', !!isActive);
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
#pqSpeakChildModal{position:fixed;inset:0;z-index:2147482850;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(21,56,45,.46);backdrop-filter:blur(5px)}
#pqSpeakChildModal.is-open{display:flex}
#pqSpeakChildModal .pq-speak-modal-card{position:relative;width:min(720px,94vw);max-height:92vh;overflow:auto;border-radius:34px;background:linear-gradient(180deg,#ffffff 0%,#f5fff8 100%);border:6px solid #d7f5df;box-shadow:0 26px 70px rgba(16,63,45,.28),0 0 0 10px rgba(255,255,255,.70);padding:28px 26px 30px;text-align:center}
#pqSpeakChildModal .pq-speak-modal-card::before{content:"";position:absolute;inset:14px;border:2px dashed #b9e9c7;border-radius:26px;pointer-events:none}
#pqSpeakChildModal .pq-speak-modal-close{position:absolute;top:14px;right:16px;width:44px;height:44px;border:0;border-radius:999px;background:#eef8ef;color:#17382d;font-size:1.45rem;font-weight:1000;cursor:pointer;box-shadow:inset 0 -2px 0 rgba(0,0,0,.08)}
#pqSpeakChildModal .pq-speak-modal-title{position:relative;font-size:1.35rem;font-weight:1000;color:#17382d;margin:8px 52px 10px;letter-spacing:0}
#pqSpeakChildModal .pq-speak-modal-title::before{content:"";display:inline-block;width:14px;height:14px;margin-right:10px;border-radius:999px;background:#95dfaa;box-shadow:22px 0 0 #c7f3d2,-22px 0 0 #e9fbef;vertical-align:middle}
#pqSpeakChildModal .pq-speak-modal-letter{position:relative;font-family:"Noto Naskh Arabic","Noto Sans Arabic","Amiri",serif;font-size:5.7rem;line-height:1;font-weight:1000;color:#0f5137;margin:10px auto 14px;width:min(220px,70vw);padding:18px 10px 12px;border-radius:30px;background:#f7fff9;box-shadow:inset 0 0 0 3px #d8f6e0,0 10px 26px rgba(36,122,78,.12);cursor:pointer;user-select:none;transition:transform .16s ease,box-shadow .16s ease,background .16s ease}
#pqSpeakChildModal .pq-speak-modal-letter:hover{transform:translateY(-2px);background:#effbf3;box-shadow:inset 0 0 0 4px #bdebc9,0 14px 30px rgba(36,122,78,.18)}
#pqSpeakChildModal .pq-speak-modal-letter:active{transform:translateY(0) scale(.98)}
#pqSpeakChildModal .pq-speak-modal-letter:focus-visible{outline:4px solid #e6bc62;outline-offset:5px}
#pqSpeakChildModal .pq-speak-modal-hint{position:relative;font-size:1.02rem;font-weight:900;color:#28413a;margin:0 auto 20px;max-width:560px;line-height:1.45;background:#f1fff5;border:2px solid #d5f4dd;border-radius:22px;padding:12px 18px}
#pqSpeakChildModal .pq-speak-modal-actions{position:relative;display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap}
#pqSpeakChildModal #pqSpeakIconToolbar{display:flex!important;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;width:100%;margin:0}
#pqSpeakChildModal .pq-speak-icon-btn{width:114px!important;min-width:114px!important;height:114px!important;border-radius:32px!important;background:#ffffff!important;border:3px solid #cdeed7!important;box-shadow:0 12px 26px rgba(24,84,58,.12),inset 0 -4px 0 rgba(149,211,169,.22)!important}
#pqSpeakChildModal .pq-speak-icon-btn:hover{transform:translateY(-2px)}
#pqSpeakChildModal .pq-speak-icon-btn:disabled{opacity:.48!important;filter:grayscale(.25)}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="mic"]::after{content:"Mic";position:absolute;left:0;right:0;bottom:12px;text-indent:0;color:#15563a;font-size:.9rem;font-weight:1000}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="record"]::after{content:"Record";position:absolute;left:0;right:0;bottom:12px;text-indent:0;color:#15563a;font-size:.9rem;font-weight:1000}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="record"].pq-can-rerecord::after{content:"Re-record"}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="done"]::after{content:"Done";position:absolute;left:0;right:0;bottom:12px;text-indent:0;color:#15563a;font-size:.9rem;font-weight:1000}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="mic"]::before,#pqSpeakChildModal .pq-speak-icon-btn[data-role="record"]::before,#pqSpeakChildModal .pq-speak-icon-btn[data-role="done"]::before{color:#15563a!important}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="mic"].is-on{background:#eafbf0!important;border-color:#8bd9a2!important}
#pqSpeakChildModal .pq-speak-icon-btn[data-role="record"].is-busy{background:#fff3f3!important;border-color:#f2b8b8!important}
#pqSpeakChildModal .pq-speak-progress-badge{width:auto!important;min-width:94px!important;height:54px!important;border-radius:999px!important;padding:0 20px!important;font-size:1.08rem!important;background:#f7fff9!important;border:3px solid #d3f2dc!important;color:#15563a!important;box-shadow:0 8px 18px rgba(24,84,58,.10)!important}
`;
  document.head.appendChild(style);

  modal = document.createElement('div');
  modal.id = 'pqSpeakChildModal';
  modal.innerHTML =
    '<div class="pq-speak-modal-card" role="dialog" aria-modal="true">' +
      '<button type="button" class="pq-speak-modal-close" aria-label="Close">×</button>' +
      '<div class="pq-speak-modal-title">Your turn — speak the letter</div>' +
      '<div class="pq-speak-modal-letter" role="button" tabindex="0" aria-label="Play letter sound">🎤</div>' +
      '<div class="pq-speak-modal-hint">Use the big buttons below. Enable the mic, record your voice, then tap Done.</div>' +
      '<div class="pq-speak-modal-actions" id="pqSpeakModalActions"></div>' +
    '</div>';

  document.body.appendChild(modal);

  modal.querySelector('.pq-speak-modal-close').addEventListener('click', function () {
    try { __pqSpeakModalReleaseMic(); } catch (_e) {}
    modal.classList.remove('is-open');
  });

  const letterEl = modal.querySelector('.pq-speak-modal-letter');
  if (letterEl) {
    letterEl.addEventListener('click', function (event) {
      try { event.preventDefault(); } catch (_e) {}
      __pqPlaySpeakChildModalLetter();
    });

    letterEl.addEventListener('keydown', function (event) {
      const key = String((event && event.key) || '');
      if (key !== 'Enter' && key !== ' ') return;
      try { event.preventDefault(); } catch (_e) {}
      __pqPlaySpeakChildModalLetter();
    });
  }

  return modal;
}

function __pqSetSpeakChildModalLetter(text) {
  try {
    const modal = document.getElementById('pqSpeakChildModal');
    if (!modal) return;

    const letterEl = modal.querySelector('.pq-speak-modal-letter');
    if (letterEl) {
      letterEl.textContent = text || '🎤';
      letterEl.setAttribute('aria-label', 'Play letter sound' + (text ? ': ' + text : ''));
      try { letterEl.dataset.key = __pqSpeakGetSelectedKey(); } catch (_e) {}
    }

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
    else {
      try { __pqSpeakModalReleaseMic(); } catch (_e) {}
      modal.classList.remove('is-open');
    }
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

function __pqEnsureSpeakModalSourcePanel() {
  try {
    const mount = document.getElementById('speakMount');
    if (!mount) return null;

    let panel = document.getElementById('pqSpeakPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'pqSpeakPanel';
      panel.className = 'pq-speak-panel';
      mount.appendChild(panel);
    }

    function ensureButton(id, text) {
      let btn = document.getElementById(id);
      if (!btn) {
        btn = document.createElement('button');
        btn.id = id;
        btn.type = 'button';
        btn.className = 'pq-speak-btn';
        btn.textContent = text;
        panel.appendChild(btn);
      }
      return btn;
    }

    if (!document.getElementById('pqSpeakRecLen')) {
      const select = document.createElement('select');
      select.id = 'pqSpeakRecLen';
      select.className = 'pq-speak-btn pq-speak-hide-extra';
      [2, 3, 4, 5].forEach(function (seconds) {
        const option = document.createElement('option');
        option.value = String(seconds);
        option.textContent = String(seconds);
        if (seconds === 3) option.selected = true;
        select.appendChild(option);
      });
      panel.appendChild(select);
    }

    ensureButton('pqSpeakBtnMic', 'Enable Mic');
    const recordBtn = ensureButton('pqSpeakBtnRecord', 'Record');
    ensureButton('pqSpeakBtnNext', 'Next');
    ensureButton('pqSpeakBtnAttempt', 'Attempt');
    ensureButton('pqSpeakBtnCompare', 'Done');

    let status = document.getElementById('pqSpeakStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'pqSpeakStatus';
      status.className = 'pq-speak-status pq-speak-hide-extra';
      panel.appendChild(status);
    }

    recordBtn.disabled = false;

    return panel;
  } catch (_e) {
    return null;
  }
}


function __pqSyncSimplifiedSpeakUi() {
  try {
    const mount = document.getElementById('speakMount');
    try { __pqEnsureSpeakModalSourcePanel(); } catch (_e) {}
    let panel = document.getElementById('pqSpeakPanel') || mount;

    let micBtn = document.getElementById('pqSpeakBtnMic');
    let recordBtn = document.getElementById('pqSpeakBtnRecord');
    let nextBtn = document.getElementById('pqSpeakBtnNext');
    let attemptBtn = document.getElementById('pqSpeakBtnAttempt');
    let compareBtn = document.getElementById('pqSpeakBtnCompare');

    if (!mount || !panel) return;

    __pqSpeakEnsureStateShape();

    const isVisible = (
      document.body.classList.contains('pq-speak-step-active') ||
      mount.style.display !== 'none'
    );

    if (isVisible && (!micBtn || !recordBtn || !compareBtn)) {
      try {
        const ensureSpeak = window.__pqSpeakEnsure || window.__pqTanweenSpeakEnsure;
        if (typeof ensureSpeak === 'function') ensureSpeak();
      } catch (_e) {}

      try {
        const engine = window.__PQ_SPEAK_ENGINE__ || window.__PQ_TANWEEN_SPEAK_ENGINE__;
        if (engine && typeof engine.boot === 'function') engine.boot();
      } catch (_e) {}

      panel = document.getElementById('pqSpeakPanel') || mount;
      micBtn = document.getElementById('pqSpeakBtnMic');
      recordBtn = document.getElementById('pqSpeakBtnRecord');
      nextBtn = document.getElementById('pqSpeakBtnNext');
      attemptBtn = document.getElementById('pqSpeakBtnAttempt');
      compareBtn = document.getElementById('pqSpeakBtnCompare');
    }

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
  attempts:Object.create(null), comparisons:Object.create(null), doneKeys:Object.create(null),
  stopTimer:null, playing:false, comparing:false, cancelled:false
};

function __pqSpeakModalReleaseMic(){
  try { if (__pqSpeakModalRecFinalState.stopTimer) clearTimeout(__pqSpeakModalRecFinalState.stopTimer); } catch(_e){}
  __pqSpeakModalRecFinalState.stopTimer = null;

  try {
    const r = __pqSpeakModalRecFinalState.recorder;
    if (r && r.state !== 'inactive') r.stop();
  } catch(_e){}

  try {
    __pqStopMediaStream(__pqSpeakModalRecFinalState.stream);
  } catch(_e){}

  __pqSpeakModalRecFinalState.stream = null;
  __pqSpeakModalRecFinalState.recorder = null;
  __pqSpeakModalRecFinalState.chunks = [];
  __pqSpeakModalRecFinalState.blob = null;
  __pqSpeakModalRecFinalState.cancelled = true;

  try {
    if (__pqSpeakModalRecFinalState.blobUrl) {
      URL.revokeObjectURL(__pqSpeakModalRecFinalState.blobUrl);
    }
  } catch(_e){}
  __pqSpeakModalRecFinalState.blobUrl = '';

  try { __pqSpeakUiState.isRecording = false; } catch(_e){}
}

try {
  window.addEventListener('beforeunload', function () {
    try { __pqSpeakModalReleaseMic(); } catch (_e) {}
    try { __pqReleaseRepeatMicStream(); } catch (_e) {}
  }, { once: true });
} catch (_e) {}

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
    try { await playLetter(key, 1, 1, 'speak'); } catch(_e){}
    await __pqSpeakModalPlayStudent(blob);
    if (!__pqSpeakComparisonRefreshHint(key)) {
      __pqSpeakModalHint('You can record again, or tap Done when you are happy.');
    }
  } finally {
    __pqSpeakModalRecFinalState.playing = false;
    __pqSpeakUiState.isRecording = false;
    try { __pqSyncSimplifiedSpeakUi(); } catch(_e){}
    try { __pqSpeakModalRefreshButtons(); } catch(_e){}
  }
}

function __pqSpeakComparisonCfg(path, fallback) {
  return __cfg('playback.steps.speak.comparison.' + path, fallback);
}

function __pqSpeakDoneConfirmEnabled() {
  return __cfg('playback.steps.speak.doneConfirm.enabled', true) !== false;
}

function __pqSpeakRecordingUploadCfg(path, fallback) {
  return __cfg('playback.steps.speak.recordingUpload.' + path, fallback);
}

function __pqSpeakRecordingUploadEnabled() {
  return __pqSpeakRecordingUploadCfg('enabled', false) === true;
}

function __pqSpeakRecordingUploadRequired() {
  return __pqSpeakRecordingUploadCfg('required', false) === true;
}

function __pqSpeakRecordingUploadFunction() {
  return String(__pqSpeakRecordingUploadCfg('wsFunction', 'local_prequran_save_speak_recording') || '').trim();
}

function __pqSpeakMimeToExtension(mime) {
  const value = String(mime || '').toLowerCase();
  if (value.indexOf('mp4') >= 0 || value.indexOf('m4a') >= 0) return 'm4a';
  if (value.indexOf('mpeg') >= 0 || value.indexOf('mp3') >= 0) return 'mp3';
  if (value.indexOf('ogg') >= 0) return 'ogg';
  if (value.indexOf('wav') >= 0) return 'wav';
  return 'webm';
}

function __pqSpeakSafeFilePart(value, fallback) {
  const text = String(value || fallback || 'recording')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return text || String(fallback || 'recording');
}

function __pqSpeakBlobToBase64(blob) {
  return new Promise(function (resolve, reject) {
    try {
      const reader = new FileReader();
      reader.onload = function () {
        const value = String(reader.result || '');
        resolve(value.indexOf(',') >= 0 ? value.split(',').pop() : value);
      };
      reader.onerror = function () {
        reject(reader.error || new Error('Could not read recording.'));
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      reject(err);
    }
  });
}

function __pqSpeakBuildRecordingFilename(uid, key, letterName, mime) {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const extension = __pqSpeakMimeToExtension(mime);
  return [
    'user_' + __pqSpeakSafeFilePart(uid, 'unknown'),
    __pqSpeakSafeFilePart(key, 'letter'),
    __pqSpeakSafeFilePart(letterName, key || 'letter'),
    stamp
  ].join('_') + '.' + extension;
}

async function __pqSpeakCallMoodleWs(params) {
  const core = (typeof pqResolveCore === 'function') ? pqResolveCore() : null;
  if (core && typeof core.wsGet === 'function') {
    return await core.wsGet(params);
  }

  const endpoint = String(
    window.__prequran_ws_endpoint ||
    (__cfg('moodle.wsEndpoint', '') || '') ||
    '/webservice/rest/server.php'
  );
  const body = new URLSearchParams();
  Object.keys(params || {}).forEach(function (key) {
    const value = params[key];
    if (value === undefined || value === null) return;
    body.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  });
  body.append('moodlewsrestformat', 'json');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString()
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch (_e) {
    throw new Error('Recording upload returned a non-JSON Moodle response.');
  }
  if (!response.ok || (data && data.exception)) {
    throw new Error((data && data.message) || ('Recording upload failed with HTTP ' + response.status));
  }
  return data;
}

async function __pqSpeakUploadRecordingForReview(key) {
  if (!__pqSpeakRecordingUploadEnabled()) {
    return { ok: true, skipped: true, reason: 'disabled' };
  }

  const blob = __pqSpeakModalRecFinalState && __pqSpeakModalRecFinalState.blob;
  if (!blob) {
    return { ok: false, skipped: false, reason: 'missing_recording' };
  }

  const maxBytes = Number(__pqSpeakRecordingUploadCfg('maxBytes', 3000000) || 3000000);
  if (maxBytes > 0 && blob.size > maxBytes) {
    return { ok: false, skipped: false, reason: 'recording_too_large' };
  }

  if (
    typeof pqWaitForIframeTokens === 'function' &&
    (
      !((typeof pqGetUid === 'function') ? pqGetUid() : '') ||
      !((typeof pqGetToken === 'function') ? pqGetToken() : '')
    )
  ) {
    try { await pqWaitForIframeTokens(2500); } catch (_e) {}
  }

  const uid = (typeof pqGetUid === 'function') ? pqGetUid() : '';
  const token = (typeof pqGetToken === 'function') ? pqGetToken() : '';
  const wsFunction = __pqSpeakRecordingUploadFunction();
  if (!uid || !token || !wsFunction) {
    return { ok: true, skipped: true, reason: 'missing_moodle_credentials' };
  }

  const meta = (__PQ_ALL_CELL_META && __PQ_ALL_CELL_META.get) ? (__PQ_ALL_CELL_META.get(key) || {}) : {};
  const letterName = String(meta.en || meta.name || meta.small || meta.ar || key || '').trim();
  const letterText = String(meta.text || meta.ar || '').trim();
  const attempt = __pqSpeakModalRecFinalState.attempts && __pqSpeakModalRecFinalState.attempts[key]
    ? __pqSpeakModalRecFinalState.attempts[key]
    : {};
  const mime = blob.type || 'audio/webm';
  const audioBase64 = await __pqSpeakBlobToBase64(blob);

  return await __pqSpeakCallMoodleWs({
    wsfunction: wsFunction,
    wstoken: token,
    userid: uid,
    lessonid: String(__cfg('lessonid', __pqIdentity('lessonId', 'tajweed'))),
    unitid: String(__cfg('unitid', __PQ_UNIT_ID)),
    step_id: 'speak',
    letter_key: String(key || ''),
    letter_name: letterName,
    letter_text: letterText,
    attempt_no: String((attempt && attempt.count) || 1),
    duration_ms: String((attempt && attempt.durationMs) || __pqSpeakModalMs()),
    mime_type: mime,
    filename: __pqSpeakBuildRecordingFilename(uid, key, letterName, mime),
    audio_base64: audioBase64
  });
}

function __pqSpeakDoneConfirmMessage() {
  const fallback = {
    audio: '',
    titleText: 'Message',
    continueText: 'Continue',
    cancelText: 'Cancel',
    text: 'Listen carefully. If your sound matches with teacher, click Done. Otherwise, re-record and practice.'
  };

  try {
    const messages = (UNIT_CFG && UNIT_CFG.messages) || {};
    const message = messages.speakDoneConfirm || {};
    return Object.assign({}, fallback, message);
  } catch (_e) {
    return fallback;
  }
}

async function __pqSpeakConfirmDone() {
  if (!__pqSpeakDoneConfirmEnabled()) return true;

  const message = __pqSpeakDoneConfirmMessage();
  try {
    const api = (typeof __pqEnsureStepMessaging === 'function') ? __pqEnsureStepMessaging() : null;
    if (api && typeof api.showChoice === 'function') {
      return !!(await api.showChoice(message, message));
    }
  } catch (_e) {}

  return true;
}

function __pqSpeakComparisonEnabled() {
  return !!__pqSpeakComparisonCfg('enabled', false);
}

function __pqSpeakComparisonMaxAttempts() {
  return Math.max(1, Number(__pqSpeakComparisonCfg('maxAttempts', 3) || 3) || 3);
}

function __pqSpeakComparisonForKey(key) {
  key = String(key || '').trim();
  if (!key) return null;
  return __pqSpeakModalRecFinalState.comparisons[key] || null;
}

function __pqSpeakComparisonScoreText(result) {
  try {
    if (!result || result.reason === 'analysis_unavailable') return '';
    const score = Math.max(0, Math.min(100, Math.round(Number(result.score || 0) * 100)));
    return 'Score: ' + score + '%. ';
  } catch (_e) {
    return '';
  }
}

function __pqSpeakComparisonFeedbackText(result) {
  try {
    if (!result) return '';
    if (result.reason === 'analysis_unavailable') return 'I could not check this recording. ';
    if (result.reason === 'not_enough_voice' || result.reason === 'missing_audio') return 'I did not hear enough. ';
    if (result.reason === 'vowel_shape_mismatch') return 'Listen carefully to the vowel sound and try again. ';
    if (result.reason === 'vowel_shape_unavailable') return 'I could not hear the vowel sound clearly. ';
    if (result.passed) return 'Nice sound. ';
    if (result.allowDone) return 'Good effort. ';
    return 'Try to copy the teacher sound more closely. ';
  } catch (_e) {
    return '';
  }
}

function __pqSpeakComparisonAllowsDone(key) {
  if (!__pqSpeakComparisonEnabled()) return true;
  const result = __pqSpeakComparisonForKey(key);
  return !!(result && !result.pending && (result.passed || result.allowDone));
}

function __pqSpeakComparisonRefreshHint(key) {
  try {
    if (!__pqSpeakComparisonEnabled()) return false;
    const result = __pqSpeakComparisonForKey(key);
    if (!result) return false;

    if (result.pending) {
      __pqSpeakModalHint('Checking your voice...');
      return true;
    }

    if (result.passed) {
      __pqSpeakModalHint(__pqSpeakComparisonScoreText(result) + __pqSpeakComparisonFeedbackText(result) + 'Tap Done when you are ready, or record again.');
      return true;
    }

    if (result.allowDone) {
      __pqSpeakModalHint(__pqSpeakComparisonScoreText(result) + __pqSpeakComparisonFeedbackText(result) + 'You tried ' + result.attempts + ' times. Tap Done, or record again if you want.');
      return true;
    }

    const left = Math.max(0, __pqSpeakComparisonMaxAttempts() - Number(result.attempts || 0));
    __pqSpeakModalHint(
      __pqSpeakComparisonScoreText(result) +
      __pqSpeakComparisonFeedbackText(result) +
      (left > 1 ? 'You have ' + left + ' tries left.' : 'One more try.')
    );
    return true;
  } catch (_e) {
    return false;
  }
}

async function __pqSpeakRunDtwComparison(key, blob) {
  key = String(key || '').trim();
  if (!key || !blob || !__pqSpeakComparisonEnabled()) return null;

  const maxAttempts = __pqSpeakComparisonMaxAttempts();
  const previous = __pqSpeakComparisonForKey(key);
  const attempts = Math.max(1, Number((previous && previous.attempts) || 0) + 1);

  __pqSpeakModalRecFinalState.comparing = true;
  __pqSpeakModalRecFinalState.comparisons[key] = {
    pending: true,
    passed: false,
    allowDone: false,
    attempts,
    score: 0,
    reason: 'pending'
  };

  __pqSpeakModalHint('Checking your voice...');
  try { __pqSpeakModalRefreshButtons(); } catch (_e) {}

  try {
    if (!window.PQSpeakDtw || typeof window.PQSpeakDtw.compare !== 'function') {
      throw new Error('DTW engine unavailable');
    }

    const referenceUrl = typeof __pqResolveAudioUrlForKey === 'function' ? __pqResolveAudioUrlForKey(key) : '';
    if (!referenceUrl) throw new Error('reference audio unavailable');

    const result = await window.PQSpeakDtw.compare({
      referenceUrl,
      studentBlob: blob,
      minScore: Number(__pqSpeakComparisonCfg('minScore', 0.58) || 0.58),
      sampleRate: Number(__pqSpeakComparisonCfg('sampleRate', 8000) || 8000),
      frameMs: Number(__pqSpeakComparisonCfg('frameMs', 32) || 32),
      hopMs: Number(__pqSpeakComparisonCfg('hopMs', 16) || 16),
      bandRatio: Number(__pqSpeakComparisonCfg('bandRatio', 0.32) || 0.32),
      distanceScale: Number(__pqSpeakComparisonCfg('distanceScale', 2.7) || 2.7),
      minFrames: Number(__pqSpeakComparisonCfg('minFrames', 5) || 5),
      silenceThreshold: Number(__pqSpeakComparisonCfg('silenceThreshold', 0.012) || 0.012),
      requireVowelShape: __pqSpeakComparisonCfg('requireVowelShape', false) === true,
      requireHarakahShape: __pqSpeakComparisonCfg('requireHarakahShape', false) === true,
      vowelWindowMs: Number(__pqSpeakComparisonCfg('vowelWindowMs', 350) || 350),
      vowelRegion: String(__pqSpeakComparisonCfg('vowelRegion', 'tail') || 'tail'),
      vowelMinScore: Number(__pqSpeakComparisonCfg('vowelMinScore', 0.58) || 0.58),
      vowelDistanceScale: Number(__pqSpeakComparisonCfg('vowelDistanceScale', 0.62) || 0.62)
    });

    const passed = !!(result && result.passed);
    const allowAfterMax = __pqSpeakComparisonCfg('allowDoneAfterMaxAttempts', true) !== false;
    const allowDone = passed || (allowAfterMax && attempts >= maxAttempts);

    __pqSpeakModalRecFinalState.comparisons[key] = {
      pending: false,
      passed,
      allowDone,
      attempts,
      score: Number((result && result.score) || 0) || 0,
      reason: String((result && result.reason) || (passed ? 'dtw_pass' : 'dtw_retry')),
      at: Date.now()
    };
  } catch (_e) {
    const passIfUnavailable = __pqSpeakComparisonCfg('passIfUnavailable', false) === true;
    __pqSpeakModalRecFinalState.comparisons[key] = {
      pending: false,
      passed: passIfUnavailable,
      allowDone: passIfUnavailable || attempts >= maxAttempts,
      attempts,
      score: 0,
      reason: 'analysis_unavailable',
      at: Date.now()
    };
  } finally {
    __pqSpeakModalRecFinalState.comparing = false;
    __pqSpeakComparisonRefreshHint(key);
    try { __pqSpeakModalRefreshButtons(); } catch (_e) {}
  }

  return __pqSpeakComparisonForKey(key);
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
  __pqSpeakModalRecFinalState.cancelled = false;
  if (__pqSpeakComparisonEnabled()) {
    try {
      __pqSpeakModalRecFinalState.comparisons[key] = {
        pending: false,
        passed: false,
        allowDone: false,
        attempts: Number((__pqSpeakComparisonForKey(key) && __pqSpeakComparisonForKey(key).attempts) || 0) || 0,
        score: 0,
        reason: 'new_recording'
      };
    } catch (_e) {}
  }

  const rec = new MediaRecorder(stream);
  __pqSpeakModalRecFinalState.recorder = rec;

  rec.ondataavailable = function(ev){
    try { if (ev.data && ev.data.size) __pqSpeakModalRecFinalState.chunks.push(ev.data); } catch(_e){}
  };

  rec.onstop = function(){
    try {
      if (__pqSpeakModalRecFinalState.cancelled) {
        __pqSpeakUiState.isRecording = false;
        try { __pqSpeakModalRefreshButtons(); } catch(_e){}
        return;
      }

      const chunks = __pqSpeakModalRecFinalState.chunks || [];
      const blob = chunks.length ? new Blob(chunks, {type: rec.mimeType || 'audio/webm'}) : null;
      __pqSpeakModalRecFinalState.blob = blob;
      const previousAttempt = __pqSpeakModalRecFinalState.attempts[key] || {};
      __pqSpeakModalRecFinalState.attempts[key] = {
        at: Date.now(),
        ok: !!blob,
        size: blob ? blob.size : 0,
        count: Math.max(1, Number(previousAttempt.count || 0) + 1),
        durationMs: __pqSpeakModalMs()
      };
      __pqSpeakUiState.isRecording = false;
      __pqSpeakUiState.lastRecordingAt = Date.now();
      try { __pqSyncSimplifiedSpeakUi(); } catch(_e){}
      try { __pqSpeakModalRefreshButtons(); } catch(_e){}

      if (!blob) {
        __pqSpeakModalHint('No recording captured. Try again.');
        return;
      }

      Promise.resolve(__pqSpeakRunDtwComparison(key, blob))
        .then(function () {
          const replayAfterComparison = __pqSpeakComparisonEnabled()
            ? (__pqSpeakComparisonCfg('replayTeacherStudent', false) === true)
            : true;
          if (replayAfterComparison) setTimeout(__pqSpeakModalReplayTeacherStudent, 120);
        })
        .catch(function () {
          try { __pqSpeakComparisonRefreshHint(key); } catch(_ignore){}
          try { __pqSpeakModalRefreshButtons(); } catch(_ignore){}
        });
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



async function __pqSpeakModalDoneFinal(){
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
    if (__pqSpeakComparisonEnabled() && !__pqSpeakComparisonAllowsDone(key)) {
      __pqSpeakComparisonRefreshHint(key);
      return;
    }
  } catch (_e) {}

  const confirmed = await __pqSpeakConfirmDone();
  if (!confirmed) {
    __pqSpeakModalHint('You can re-record and practice again.');
    return;
  }

  try {
    const upload = await __pqSpeakUploadRecordingForReview(key);
    try {
      window.__pq_last_speak_upload_result = upload;
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'PQ_SPEAK_UPLOAD_RESULT',
            result: upload,
            href: window.location.href,
            ts: Date.now()
          }, '*');
        }
      } catch (_postErr) {}
      if (upload && (upload.ok === false || upload.saved === false || upload.skipped)) {
        console.warn('[PQ Speak] Recording upload did not save.', upload);
      }
    } catch (_e) {}
    const uploadFailed = upload && (upload.ok === false || (__pqSpeakRecordingUploadRequired() && upload.saved !== true));
    if (uploadFailed) {
      if (__pqSpeakRecordingUploadRequired()) {
        __pqSpeakModalHint('Recording was not saved. Please try again.');
        return;
      }
      __pqSpeakModalHint('Recording review save is not ready yet. Continuing.');
    }
  } catch (_e) {
    try {
      window.__pq_last_speak_upload_result = { ok: false, error: String((_e && _e.message) || _e || 'Recording upload failed.') };
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'PQ_SPEAK_UPLOAD_RESULT',
            result: window.__pq_last_speak_upload_result,
            href: window.location.href,
            ts: Date.now()
          }, '*');
        }
      } catch (_postErr) {}
      console.error('[PQ Speak] Recording upload failed.', _e);
    } catch (_err) {}
    if (__pqSpeakRecordingUploadRequired()) {
      __pqSpeakModalHint('Recording was not saved. Please try again.');
      return;
    }
  }

  await __pqSpeakCompleteKey(key, { persist: true, closeModal: true });
}


function __pqSpeakModalRefreshButtons(){
  try { __pqSpeakModalRefreshProgressFinal(); } catch(_e){}
  try { __pqSpeakModalRefreshDoneTilesFinal(); } catch(_e){}
  try {
    const mount = document.getElementById('speakMount');
    const speakActive = document.body.classList.contains('pq-speak-step-active');
    const rec = document.getElementById('pqSpeakBtnRecord');
    const done = document.getElementById('pqSpeakBtnCompare');
    const visible = speakActive || (mount && mount.style.display !== 'none');
    const key = __pqSpeakModalKey();
    const hasAttempt = !!(key && __pqSpeakModalRecFinalState.attempts[key]);
    const comparisonReady = __pqSpeakComparisonAllowsDone(key);
    const comparisonPending = !!(
      __pqSpeakComparisonEnabled() &&
      (
        __pqSpeakModalRecFinalState.comparing ||
        (__pqSpeakComparisonForKey(key) && __pqSpeakComparisonForKey(key).pending)
      )
    );
    const alreadyDone = __pqSpeakIsKeyCompleted(key);

    if (rec) {
      rec.disabled = !(visible && key) || alreadyDone || !!__pqSpeakUiState.isRecording || comparisonPending;
      rec.classList.toggle('pq-can-rerecord', hasAttempt && !alreadyDone && !__pqSpeakUiState.isRecording);
      rec.setAttribute('aria-disabled', rec.disabled ? 'true' : 'false');
    }

    if (done) {
      done.disabled = !(visible && key && hasAttempt && comparisonReady) || alreadyDone || !!__pqSpeakUiState.isRecording || comparisonPending;
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
      __pqSpeakModalDoneFinal().catch(function(){});
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
        try { __pqSpeakModalReleaseMic(); } catch (_ignore) {}
        try { __pqReleaseRepeatMicStream(); } catch (_ignore) {}
      }, { once: true });
    } catch (_e) {}
  }
}
/* ===== END SPEAK MODAL RECORDING FINAL v3 ===== */


function __pqInstallSimplifiedSpeakUi() {
  try {
    try { __pqEnsureSpeakModalSourcePanel(); } catch (_e) {}

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
          Promise.resolve(__pqSpeakMarkCurrentDone()).catch(function () {});
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

    try { __pqSetSpeakStepActive(isSpeak); } catch (_e) {}

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
