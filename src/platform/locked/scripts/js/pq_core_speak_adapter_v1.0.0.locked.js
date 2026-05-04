(function (window, document) {
  'use strict';

  if (
    (window.PQSharedSpeakAdapter && window.PQSharedSpeakAdapter.__version) ||
    (window.PQTanweenMovementSpeakAdapter && window.PQTanweenMovementSpeakAdapter.__version)
  ) {
    return;
  }

  const ADAPTER_VERSION = 'pq_core_speak_adapter_v1.0.0_locked';
  const STORAGE_KEY = 'pq_tanween_movement_speak_progress_v1';

  const state = {
    selectedItem: null,
    requiredItems: [],
    completedMap: Object.create(null),
    mediaStream: null,
    mediaRecorder: null,
    audioChunks: [],
    lastAudioBlob: null,
    lastAudioUrl: '',
    recSeconds: 3,
    micEnabled: false,
    actionStage: 'idle', // idle -> recording -> recorded -> attempted -> completed
    stepCompleted: false,
    isRecording: false
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function getBridge() {
    return window.__pqSpeakBridge || window.__pqTanweenSpeak || null;
  }

  function getCurrentStepId() {
    try {
      const bridge = getBridge();
      if (bridge && typeof bridge.getCurrentStepId === 'function') {
        return String(bridge.getCurrentStepId() || '');
      }
    } catch (_e) {}
    return '';
  }

  function isSpeakStep() {
    return getCurrentStepId().toLowerCase() === 'speak';
  }

  function isPracticeOnlyMode() {
    try {
      const bridge = getBridge();
      return !!(
        bridge &&
        typeof bridge.isPracticeOnlyMode === 'function' &&
        bridge.isPracticeOnlyMode()
      );
    } catch (_e) {
      return false;
    }
  }

  function shouldShowPanel() {
    try {
      const bridge = getBridge();
      if (bridge && typeof bridge.shouldShowPanel === 'function') {
        return !!bridge.shouldShowPanel();
      }
    } catch (_e) {}
    return isSpeakStep();
  }

  function setStatus(message) {
    const el = byId('pqSpeakStatus');
    if (el) el.textContent = String(message || '');
  }

  function syncHostRecordingUi() {
    try {
      if (window.__pqSpeakUiState && typeof window.__pqSpeakUiState === 'object') {
        window.__pqSpeakUiState.isRecording = !!state.isRecording;
        window.__pqSpeakUiState.lastRecordingAt = Date.now();
      }
    } catch (_e) {}

    try {
      if (typeof window.__pqSyncSimplifiedSpeakUi === 'function') {
        window.__pqSyncSimplifiedSpeakUi();
      }
    } catch (_e) {}

    try {
      if (typeof window.__pqForceSpeakUiRefresh === 'function') {
        window.__pqForceSpeakUiRefresh();
      }
    } catch (_e) {}
  }

  function getUserScopedStorageKey() {
    try {
      const uid =
        window.__prequran_uid ||
        window.prequran_uid ||
        'guest';
      return STORAGE_KEY + '::' + String(uid);
    } catch (_e) {
      return STORAGE_KEY + '::guest';
    }
  }

  function saveProgress() {
    try {
      const payload = {
        completedMap: state.completedMap || {},
        stepCompleted: !!state.stepCompleted
      };
      localStorage.setItem(getUserScopedStorageKey(), JSON.stringify(payload));
    } catch (_e) {}
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(getUserScopedStorageKey());
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') {
        state.completedMap = parsed.completedMap && typeof parsed.completedMap === 'object'
          ? parsed.completedMap
          : Object.create(null);
        state.stepCompleted = !!parsed.stepCompleted;
      }
    } catch (_e) {
      state.completedMap = Object.create(null);
      state.stepCompleted = false;
    }
  }

  function clearProgress() {
    try {
      state.completedMap = Object.create(null);
      state.stepCompleted = false;
      localStorage.removeItem(getUserScopedStorageKey());
    } catch (_e) {}
  }

  function ensureRequiredItems() {
    try {
      const bridge = getBridge();
      if (bridge && typeof bridge.getRequiredItems === 'function') {
        const items = bridge.getRequiredItems() || [];
        state.requiredItems = Array.isArray(items) ? items : [];
        return;
      }
    } catch (_e) {}

    state.requiredItems = [];
  }

  function isItemCompleted(key) {
    return !!(key && state.completedMap && state.completedMap[key]);
  }

  function applyDoneClass(itemKey, done) {
    if (!itemKey) return;

    try {
      const tile = document.querySelector('.tile[data-key="' + String(itemKey).replace(/"/g, '\\"') + '"]');
      if (!tile) return;

      tile.classList.toggle('pq-done', !!done);

      const inSpeak = shouldShowPanel();
      const practiceOnly = isPracticeOnlyMode();
      const lockThis = !!done && inSpeak && !practiceOnly && !state.stepCompleted;

      tile.classList.toggle('pq-speak-locked', lockThis);
      tile.style.pointerEvents = lockThis ? 'none' : '';
      tile.style.opacity = lockThis ? '0.55' : '';
      tile.style.filter = lockThis ? 'grayscale(.15)' : '';
      tile.style.cursor = lockThis ? 'default' : '';
    } catch (_e) {}
  }

  function refreshDoneClasses() {
    ensureRequiredItems();

    for (const item of state.requiredItems) {
      if (item && item.key) {
        applyDoneClass(item.key, !!state.completedMap[item.key]);
      }
    }

    const done = Object.keys(state.completedMap).filter((k) => !!state.completedMap[k]).length;
    const total = state.requiredItems.length;

    const progressChip = byId('pqSpeakProgressChip');
    if (progressChip) progressChip.textContent = 'Done ' + done + '/' + total;

    const selectedChip = byId('pqSpeakSelectedChip');
    if (selectedChip) {
      selectedChip.textContent = state.selectedItem
        ? (state.selectedItem.label || state.selectedItem.text || state.selectedItem.key)
        : 'None';
    }
  }

  function revokeLastAudioUrl() {
    try {
      if (state.lastAudioUrl) URL.revokeObjectURL(state.lastAudioUrl);
    } catch (_e) {}
    state.lastAudioUrl = '';
  }

  function resetPerWordFlowKeepSelection() {
    if (state.isRecording) {
      try {
        stopRecordingAttempt();
      } catch (_e) {}
    }

    revokeLastAudioUrl();
    state.lastAudioBlob = null;
    state.actionStage = 'idle';
  }

  function updateButtons() {
    const mount = byId('speakMount');
    const inSpeak = shouldShowPanel();

    if (mount) {
      mount.style.display = inSpeak ? 'block' : 'none';
    }

    const btnMic = byId('pqSpeakBtnMic');
    const btnRecord = byId('pqSpeakBtnRecord');
    const btnAttempt = byId('pqSpeakBtnAttempt');
    const btnCompare = byId('pqSpeakBtnCompare');
    const recLen = byId('pqSpeakRecLen');

    if (btnMic) {
      btnMic.textContent = state.micEnabled ? 'Mic Enabled' : 'Enable Mic';
      btnMic.disabled = !inSpeak || state.isRecording;
    }

    if (recLen) {
      recLen.disabled = !inSpeak || state.isRecording;
      recLen.value = String(state.recSeconds);
    }

    const hasSelection = !!(state.selectedItem && state.selectedItem.key);
    const selectedCompleted = hasSelection ? isItemCompleted(state.selectedItem.key) : false;

    const canRecord = inSpeak && state.micEnabled && hasSelection && !selectedCompleted &&
      (state.actionStage === 'idle' || state.actionStage === 'recording');

    const canAttempt = inSpeak && hasSelection && !selectedCompleted &&
      state.actionStage === 'recorded' && !!state.lastAudioBlob && !state.isRecording;

    const canCompare = inSpeak && hasSelection && !selectedCompleted &&
      state.actionStage === 'attempted' && !!state.lastAudioBlob && !state.isRecording;

    if (btnRecord) {
      btnRecord.disabled = !canRecord;
      btnRecord.textContent = state.isRecording ? 'Stop ■' : 'Record ⬤';
      btnRecord.dataset.recording = state.isRecording ? '1' : '0';
      btnRecord.setAttribute('aria-pressed', state.isRecording ? 'true' : 'false');
    }

    if (btnAttempt) btnAttempt.disabled = !canAttempt;
    if (btnCompare) btnCompare.disabled = !canCompare;

    refreshDoneClasses();
    syncHostRecordingUi();
  }

  async function enableMic() {
    if (state.mediaStream) {
      state.micEnabled = true;
      updateButtons();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaStream = stream;
      state.micEnabled = true;
      updateButtons();
      setStatus('Microphone enabled.');
    } catch (_e) {
      state.micEnabled = false;
      updateButtons();
      setStatus('Microphone permission failed.');
    }
  }

  function buildLastAudioFromChunks(recorder) {
    try {
      if (!state.audioChunks || !state.audioChunks.length) {
        state.lastAudioBlob = null;
        revokeLastAudioUrl();
        state.actionStage = 'idle';
        updateButtons();
        setStatus('No audio captured. Please try again.');
        return;
      }

      state.lastAudioBlob = new Blob(
        state.audioChunks,
        { type: (recorder && recorder.mimeType) || 'audio/webm' }
      );
      state.lastAudioUrl = URL.createObjectURL(state.lastAudioBlob);
      state.actionStage = 'recorded';
      updateButtons();
      setStatus('Recorded.');
    } catch (_e) {
      state.lastAudioBlob = null;
      revokeLastAudioUrl();
      state.actionStage = 'idle';
      updateButtons();
      setStatus('Recording saved, but processing failed.');
    }
  }

  function stopRecordingAttempt() {
    try {
      const recorder = state.mediaRecorder;
      if (!recorder) return;

      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    } catch (_e) {}
  }

  async function recordAttempt() {
    if (!state.mediaStream || !state.selectedItem || !state.selectedItem.key) {
      setStatus('Enable mic and select a word first.');
      return;
    }

    if (isItemCompleted(state.selectedItem.key)) {
      updateButtons();
      return;
    }

    if (state.isRecording) {
      stopRecordingAttempt();
      return;
    }

    try {
      revokeLastAudioUrl();
      state.lastAudioBlob = null;
      state.audioChunks = [];
      state.actionStage = 'recording';

      const recorder = new MediaRecorder(state.mediaStream);
      state.mediaRecorder = recorder;
      state.isRecording = true;
      updateButtons();
      setStatus('Recording... Tap stop when finished.');

      recorder.ondataavailable = function (ev) {
        if (ev && ev.data && ev.data.size > 0) {
          state.audioChunks.push(ev.data);
        }
      };

      recorder.onerror = function () {
        state.isRecording = false;
        state.mediaRecorder = null;
        state.actionStage = 'idle';
        updateButtons();
        setStatus('Recording failed.');
      };

      recorder.onstop = function () {
        state.isRecording = false;
        state.mediaRecorder = null;
        buildLastAudioFromChunks(recorder);
      };

      recorder.start();
    } catch (_e) {
      state.isRecording = false;
      state.mediaRecorder = null;
      state.actionStage = 'idle';
      updateButtons();
      setStatus('Recording failed.');
    }
  }

  function playAudioUrl(url) {
    return new Promise((resolve, reject) => {
      try {
        const a = new Audio(url);
        a.onended = function () { resolve(true); };
        a.onerror = function () { reject(new Error('audio playback failed')); };

        const maybe = a.play();
        if (maybe && typeof maybe.catch === 'function') {
          maybe.catch(reject);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  async function playAttempt() {
    if (!state.lastAudioUrl) {
      setStatus('No recorded attempt yet.');
      return;
    }

    try {
      await playAudioUrl(state.lastAudioUrl);
      state.actionStage = 'attempted';
      updateButtons();
      setStatus('');
    } catch (_e) {
      setStatus('Could not play your attempt.');
    }
  }

  async function completeSelectedWordAfterCompare() {
    if (!state.selectedItem || !state.selectedItem.key) return;

    state.completedMap[state.selectedItem.key] = true;
    state.actionStage = 'completed';
    saveProgress();
    refreshDoneClasses();

    const total = state.requiredItems.length;
    const done = Object.keys(state.completedMap).filter((k) => !!state.completedMap[k]).length;
    const bridge = getBridge();
    const practiceOnly = isPracticeOnlyMode();

    if (total > 0 && done >= total) {
      if (!practiceOnly) {
        try {
          if (bridge && typeof bridge.completeSpeakStep === 'function') {
            await bridge.completeSpeakStep('speak');
          }
        } catch (_e) {}

        try {
          if (bridge && typeof bridge.refreshManagedState === 'function') {
            await bridge.refreshManagedState();
          }
        } catch (_e) {}

        try {
          if (bridge && typeof bridge.celebrateStep === 'function') {
            bridge.celebrateStep('speak');
          }
        } catch (_e) {}

        state.stepCompleted = true;
        clearProgress();

        try {
          document.querySelectorAll('.tile[data-key]').forEach((tile) => {
            tile.classList.remove('pq-speak-locked');
            tile.style.pointerEvents = '';
            tile.style.opacity = '';
            tile.style.filter = '';
            tile.style.cursor = '';
          });
        } catch (_e) {}
      }

      try {
        state.selectedItem = null;
      } catch (_e) {}

      revokeLastAudioUrl();
      state.lastAudioBlob = null;
      state.actionStage = 'idle';
    } else {
      revokeLastAudioUrl();
      state.lastAudioBlob = null;
      state.actionStage = 'idle';
      state.selectedItem = null;
    }

    updateButtons();
  }

  async function playCompare() {
    if (!state.selectedItem) {
      setStatus('Select a word first.');
      return;
    }

    if (!state.lastAudioUrl) {
      setStatus('No recorded attempt yet.');
      return;
    }

    try {
      await playAudioUrl(state.lastAudioUrl);

      const bridge = getBridge();
      if (bridge && typeof bridge.playReferenceForItem === 'function') {
        await bridge.playReferenceForItem(state.selectedItem);
        setStatus('');
        await completeSelectedWordAfterCompare();
        return;
      }
    } catch (_e) {}

    setStatus('Compare playback unavailable.');
  }

  async function playReferenceOnSelect(item) {
    try {
      const bridge = getBridge();
      if (bridge && typeof bridge.playReferenceForItem === 'function') {
        await bridge.playReferenceForItem(item);
      }
    } catch (_e) {}
  }

  function bindPanelEvents() {
    const btnMic = byId('pqSpeakBtnMic');
    const btnRecord = byId('pqSpeakBtnRecord');
    const btnAttempt = byId('pqSpeakBtnAttempt');
    const btnCompare = byId('pqSpeakBtnCompare');
    const recLen = byId('pqSpeakRecLen');

    if (btnMic && !btnMic.__pqBound) {
      btnMic.__pqBound = true;
      btnMic.addEventListener('click', enableMic);
    }

    if (btnRecord && !btnRecord.__pqBound) {
      btnRecord.__pqBound = true;
      btnRecord.addEventListener('click', recordAttempt);
    }

    if (btnAttempt && !btnAttempt.__pqBound) {
      btnAttempt.__pqBound = true;
      btnAttempt.addEventListener('click', playAttempt);
    }

    if (btnCompare && !btnCompare.__pqBound) {
      btnCompare.__pqBound = true;
      btnCompare.addEventListener('click', playCompare);
    }

    if (recLen && !recLen.__pqBound) {
      recLen.__pqBound = true;
      recLen.addEventListener('change', function () {
        state.recSeconds = Number(recLen.value || 3) || 3;
        updateButtons();
      });
    }
  }

  function bindSelectionListener() {
    if (document.__pqSpeakSelectionBound || document.__pqTanweenSpeakSelectionBound) return;
    document.__pqSpeakSelectionBound = true;
    document.__pqTanweenSpeakSelectionBound = true;

    document.addEventListener('PQ_SPEAK_SELECT', async function (ev) {
      const item = ev && ev.detail ? ev.detail : null;
      if (!item || !item.key) return;

      if (isItemCompleted(item.key) && !state.stepCompleted) {
        updateButtons();
        return;
      }

      if (state.isRecording) {
        try {
          stopRecordingAttempt();
        } catch (_e) {}
      }

      state.selectedItem = {
        key: item.key,
        label: item.label || item.text || item.key,
        text: item.text || item.label || item.key
      };

      resetPerWordFlowKeepSelection();
      updateButtons();
      setStatus('');

      await playReferenceOnSelect(state.selectedItem);
    });
  }

  function ensurePanel() {
    loadProgress();
    ensureRequiredItems();
    bindPanelEvents();
    bindSelectionListener();
    updateButtons();
  }

  const engine = {
    __version: ADAPTER_VERSION,
    boot: function () {
      ensurePanel();
      return engine;
    },
    refreshDoneClasses: function () {
      ensurePanel();
      refreshDoneClasses();
      updateButtons();
    },
    stopRecording: function () {
      try {
        stopRecordingAttempt();
      } catch (_e) {}
    },
    isRecording: function () {
      return !!state.isRecording;
    }
  };

  const adapter = {
    __version: ADAPTER_VERSION,
    mountId: 'speakMount'
  };

  window.PQSharedSpeakAdapter = adapter;
  window.__PQ_SPEAK_ENGINE__ = engine;
  window.__pqSpeakEnsure = ensurePanel;

  // Backward-compatible aliases for older unit runtimes.
  window.PQTanweenMovementSpeakAdapter = adapter;
  window.__PQ_TANWEEN_SPEAK_ENGINE__ = engine;
  window.__pqTanweenSpeakEnsure = ensurePanel;

  function boot() {
    ensurePanel();
    setTimeout(ensurePanel, 50);
    setTimeout(ensurePanel, 250);
    setTimeout(ensurePanel, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window, document);
