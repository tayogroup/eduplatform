(function (window, document) {
  'use strict';

  if (window.PQSharedSpeakEngine && window.PQSharedSpeakEngine.__version) {
    return;
  }

  const ENGINE_VERSION = 'pq_unit_shared_speak_engine_v1.0';

  function byId(id) {
    return document.getElementById(id);
  }

  function safeText(v) {
    return String(v == null ? '' : v);
  }

  function defaultStatusWriter(message) {
    try {
      const el = byId('pqSpeakStatus');
      if (el) el.textContent = safeText(message);
    } catch (_e) {}
  }

  function escapeHtml(str) {
    return safeText(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function createStore(storageKey) {
    function load() {
      try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        return (parsed && typeof parsed === 'object') ? parsed : {};
      } catch (_e) {
        return {};
      }
    }

    function save(obj) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(obj || {}));
      } catch (_e) {}
    }

    const state = load();

    function ensureStep(stepId) {
      const sid = stepId || 'unknown';
      if (!state[sid] || typeof state[sid] !== 'object') {
        state[sid] = {};
      }
      return state[sid];
    }

    function ensureItem(stepId, itemKey) {
      const step = ensureStep(stepId);
      if (!step[itemKey] || typeof step[itemKey] !== 'object') {
        step[itemKey] = {
          heard: false,
          recorded: false,
          compared: false
        };
      }
      return step[itemKey];
    }

    function mark(stepId, itemKey, field, value) {
      const item = ensureItem(stepId, itemKey);
      item[field] = !!value;
      save(state);
      return item;
    }

    function get(stepId, itemKey) {
      const step = ensureStep(stepId);
      return step[itemKey] || null;
    }

    function isDone(stepId, itemKey) {
      const item = get(stepId, itemKey);
      return !!(item && item.recorded && item.compared);
    }

    function clearStep(stepId) {
      if (!stepId) return;
      try {
        delete state[stepId];
        save(state);
      } catch (_e) {}
    }

    return {
      state,
      ensureStep,
      ensureItem,
      mark,
      get,
      isDone,
      clearStep,
      save: function () { save(state); }
    };
  }

  function createEngine(adapter) {
    if (!adapter || typeof adapter !== 'object') {
      throw new Error('PQSharedSpeakEngine.create requires an adapter object.');
    }

    const cfg = {
      mountId: adapter.mountId || 'speakMount',
      storageKey: adapter.storageKey || 'pq_shared_speak_actions_v1',
      panelTitle: adapter.panelTitle || 'Speak Practice',
      idleHint: adapter.idleHint || 'Select an item, record, then compare.',
      recordSeconds: Array.isArray(adapter.recordSeconds) && adapter.recordSeconds.length
        ? adapter.recordSeconds.slice()
        : [2, 3, 4, 5],
      speakStepId: adapter.speakStepId || 'speak',
      statusWriter: typeof adapter.setStatus === 'function' ? adapter.setStatus : defaultStatusWriter,
      onPanelBuilt: typeof adapter.onPanelBuilt === 'function' ? adapter.onPanelBuilt : function () {},
      onSelectionChanged: typeof adapter.onSelectionChanged === 'function' ? adapter.onSelectionChanged : function () {},
      onStateChanged: typeof adapter.onStateChanged === 'function' ? adapter.onStateChanged : function () {}
    };

    const store = createStore(cfg.storageKey);

    let micStream = null;
    let mediaRecorder = null;
    let chunks = [];
    let attemptBlob = null;
    let attemptUrl = null;
    let isRecording = false;
    let selected = null;
    let booted = false;
    let observer = null;
    let stepCompleteLock = Object.create(null);

    function logDebug() {
      try {
        if (window.__PQ_DEBUG__ === true) {
          console.log.apply(console, arguments);
        }
      } catch (_e) {}
    }

    function setStatus(message) {
      try {
        cfg.statusWriter(message);
      } catch (_e) {}
    }

    function getMount() {
      return byId(cfg.mountId);
    }

    function getCurrentStepId() {
      try {
        if (typeof adapter.getCurrentStepId === 'function') {
          return adapter.getCurrentStepId() || null;
        }
      } catch (_e) {}
      return null;
    }

    function isSpeakStepActive() {
      try {
        return String(getCurrentStepId() || '').toLowerCase() === String(cfg.speakStepId || '').toLowerCase();
      } catch (_e) {
        return false;
      }
    }

    function getRequiredItems() {
      try {
        if (typeof adapter.getRequiredItems === 'function') {
          const items = adapter.getRequiredItems() || [];
          return Array.isArray(items) ? items : [];
        }
      } catch (_e) {}
      return [];
    }

    function stopAttemptAudio() {
      try {
        if (attemptUrl) {
          URL.revokeObjectURL(attemptUrl);
        }
      } catch (_e) {}
      attemptUrl = null;
      attemptBlob = null;
    }

    function setSelected(item) {
      selected = item || null;
      try {
        cfg.onSelectionChanged(selected);
      } catch (_e) {}
      refreshButtons();
    }

    function refreshButtons() {
      const btnMic = byId('pqSpeakBtnMic');
      const btnRecord = byId('pqSpeakBtnRecord');
      const btnAttempt = byId('pqSpeakBtnAttempt');
      const btnCompare = byId('pqSpeakBtnCompare');
      const mount = getMount();

      const active = isSpeakStepActive();
      const hasSelected = !!(selected && selected.key);
      const hasAttempt = !!attemptUrl;

      if (mount) {
        mount.style.display = active ? '' : 'none';
      }

      if (btnMic) btnMic.disabled = !active;
      if (btnRecord) btnRecord.disabled = !active || !hasSelected || !micStream || isRecording;
      if (btnAttempt) btnAttempt.disabled = !active || !hasSelected || !hasAttempt;
      if (btnCompare) btnCompare.disabled = !active || !hasSelected || !hasAttempt;
    }

    function applyDoneClass(itemKey) {
      try {
        if (typeof adapter.applyDoneClass === 'function') {
          adapter.applyDoneClass(itemKey, isDone(itemKey));
        }
      } catch (_e) {}
    }

    function refreshDoneClasses() {
      const items = getRequiredItems();
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (!item || !item.key) continue;
        applyDoneClass(item.key);
      }
      refreshButtons();
    }

    function isDone(itemKey) {
      const stepId = getCurrentStepId() || cfg.speakStepId;
      return store.isDone(stepId, itemKey);
    }

    function mark(field, value) {
      const stepId = getCurrentStepId() || cfg.speakStepId;
      if (!selected || !selected.key) return null;
      const result = store.mark(stepId, selected.key, field, value);
      refreshDoneClasses();
      try {
        cfg.onStateChanged({
          stepId: stepId,
          itemKey: selected.key,
          field: field,
          value: !!value,
          item: result
        });
      } catch (_e) {}
      return result;
    }

    async function maybeCompleteStep() {
      const stepId = getCurrentStepId();
      if (!stepId || String(stepId).toLowerCase() !== String(cfg.speakStepId).toLowerCase()) return false;
      if (stepCompleteLock[stepId]) return false;

      const requiredItems = getRequiredItems();
      if (!requiredItems.length) return false;

      for (let i = 0; i < requiredItems.length; i += 1) {
        const item = requiredItems[i];
        if (!item || !item.key) continue;
        if (!store.isDone(stepId, item.key)) {
          return false;
        }
      }

      stepCompleteLock[stepId] = true;

      try {
        if (typeof adapter.completeCurrentStep === 'function') {
          await adapter.completeCurrentStep(stepId);
        }
        if (typeof adapter.refreshManagedState === 'function') {
          await adapter.refreshManagedState();
        }
        if (typeof adapter.celebrateStep === 'function') {
          adapter.celebrateStep(stepId);
        }
        store.clearStep(stepId);
        refreshDoneClasses();
        return true;
      } catch (err) {
        stepCompleteLock[stepId] = false;
        logDebug('[PQSharedSpeakEngine] completeCurrentStep failed', err);
        return false;
      }
    }

    function buildRecordSecondsOptions() {
      let html = '';
      for (let i = 0; i < cfg.recordSeconds.length; i += 1) {
        const sec = parseInt(cfg.recordSeconds[i], 10);
        const selectedAttr = sec === 3 ? ' selected' : '';
        html += '<option value="' + sec + '"' + selectedAttr + '>' + sec + 's</option>';
      }
      return html;
    }

    function buildPanel() {
      const mount = getMount();
      if (!mount) return;

      mount.innerHTML = ''
        + '<div class="pq-speak-panel" id="pqSpeakPanel">'
        + '  <div class="pq-speak-panel__title">' + escapeHtml(cfg.panelTitle) + '</div>'
        + '  <div class="pq-speak-row">'
        + '    <button id="pqSpeakBtnMic" class="pq-btn pq-btn-secondary" type="button">Enable Mic</button>'
        + '    <label class="pq-speak-inline">Record'
        + '      <select id="pqSpeakRecLen" class="pq-select" title="Record length">'
        +         buildRecordSecondsOptions()
        + '      </select>'
        + '    </label>'
        + '  </div>'
        + '  <div class="pq-speak-row">'
        + '    <button id="pqSpeakBtnRecord" class="pq-btn pq-btn-primary" type="button" disabled>Record ⬤</button>'
        + '    <button id="pqSpeakBtnAttempt" class="pq-btn" type="button" disabled>Attempt ▶</button>'
        + '    <button id="pqSpeakBtnCompare" class="pq-btn" type="button" disabled>Compare ⇄</button>'
        + '  </div>'
        + '  <div id="pqSpeakStatus" class="pq-speak-status">' + escapeHtml(cfg.idleHint) + '</div>'
        + '</div>';

      const btnMic = byId('pqSpeakBtnMic');
      const btnRecord = byId('pqSpeakBtnRecord');
      const btnAttempt = byId('pqSpeakBtnAttempt');
      const btnCompare = byId('pqSpeakBtnCompare');

      if (btnMic) btnMic.addEventListener('click', enableMic);
      if (btnRecord) btnRecord.addEventListener('click', startRecording);
      if (btnAttempt) btnAttempt.addEventListener('click', playAttempt);
      if (btnCompare) btnCompare.addEventListener('click', compare);

      try {
        cfg.onPanelBuilt({
          mount: mount,
          panel: byId('pqSpeakPanel')
        });
      } catch (_e) {}

      refreshButtons();
      refreshDoneClasses();
    }

    async function enableMic() {
      if (!isSpeakStepActive()) {
        setStatus('Speak step is not active.');
        return false;
      }

      try {
        setStatus('Requesting microphone permission…');
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const btnMic = byId('pqSpeakBtnMic');
        if (btnMic) btnMic.textContent = 'Mic Enabled';

        setStatus('Microphone enabled ✅');
        refreshButtons();
        return true;
      } catch (_e) {
        setStatus('Microphone permission denied or unavailable.');
        refreshButtons();
        return false;
      }
    }

    function getRecordSeconds() {
      const sel = byId('pqSpeakRecLen');
      const sec = parseInt(sel && sel.value ? sel.value : '3', 10);
      return Math.max(1, sec);
    }

    function startRecording() {
      if (!isSpeakStepActive()) {
        setStatus('Speak step is not active.');
        return;
      }

      if (!selected || !selected.key) {
        setStatus('Select an item first.');
        return;
      }

      if (!micStream) {
        enableMic();
        return;
      }

      if (isRecording) return;

      chunks = [];
      stopAttemptAudio();

      try {
        mediaRecorder = new MediaRecorder(micStream);
      } catch (_e) {
        setStatus('Recording is not supported in this browser.');
        return;
      }

      mediaRecorder.ondataavailable = function (ev) {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };

      mediaRecorder.onstop = function () {
        try {
          attemptBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
          attemptUrl = URL.createObjectURL(attemptBlob);
          mark('recorded', true);
          setStatus('Recorded attempt ✅');
        } catch (_e) {
          setStatus('Failed to build recording.');
        }

        isRecording = false;

        const btnRecord = byId('pqSpeakBtnRecord');
        if (btnRecord) btnRecord.textContent = 'Record ⬤';

        refreshButtons();
      };

      isRecording = true;

      const btnRecord = byId('pqSpeakBtnRecord');
      if (btnRecord) btnRecord.textContent = 'Recording…';

      setStatus('Recording…');
      refreshButtons();

      mediaRecorder.start();

      window.setTimeout(function () {
        try {
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        } catch (_e) {}
      }, getRecordSeconds() * 1000);
    }

    function playAttempt() {
      if (!isSpeakStepActive()) {
        setStatus('Speak step is not active.');
        return;
      }

      if (!attemptUrl) {
        setStatus('No attempt recorded yet.');
        return;
      }

      try {
        const a = new Audio(attemptUrl);
        a.play().catch(function () {
          setStatus('Could not play recorded attempt.');
        });
      } catch (_e) {
        setStatus('Could not play recorded attempt.');
      }
    }

    async function compare() {
      if (!isSpeakStepActive()) {
        setStatus('Speak step is not active.');
        return;
      }

      if (!selected || !selected.key) {
        setStatus('Select an item first.');
        return;
      }

      if (!attemptUrl) {
        setStatus('Record an attempt first.');
        return;
      }

      setStatus('Playing reference, then your attempt…');

      try {
        if (typeof adapter.playReferenceForItem === 'function') {
          await adapter.playReferenceForItem(selected);
          mark('heard', true);
        }
      } catch (_e) {
        logDebug('[PQSharedSpeakEngine] reference play failed', _e);
      }

      try {
        const a = new Audio(attemptUrl);
        await new Promise(function (resolve) {
          a.onended = resolve;
          a.onerror = resolve;
          a.play().catch(resolve);
        });
      } catch (_e) {
        setStatus('Could not play your attempt.');
        return;
      }

      mark('compared', true);
      await maybeCompleteStep();
      setStatus('Compare complete ✅');
    }

    async function onTileSelected(item) {
      setSelected(item || null);

      if (!selected || !selected.key) {
        setStatus(cfg.idleHint);
        return;
      }

      stopAttemptAudio();

      const done = isDone(selected.key);
      setStatus(done ? ('Selected: ' + (selected.label || selected.key) + ' ✅') : ('Selected: ' + (selected.label || selected.key)));

      try {
        if (typeof adapter.playReferenceForItem === 'function') {
          await adapter.playReferenceForItem(selected);
          mark('heard', true);
        }
      } catch (_e) {
        setStatus('Selected, but could not play reference audio.');
      }

      refreshButtons();
      refreshDoneClasses();
    }

    function installMountGuard() {
      const mount = getMount();
      if (!mount) return;

      function ensurePanel() {
        if (!byId('pqSpeakPanel')) {
          buildPanel();
        }
      }

      ensurePanel();

      observer = new MutationObserver(function () {
        ensurePanel();
        refreshButtons();
      });

      observer.observe(mount, {
        childList: true,
        subtree: true
      });
    }

    function bindSelectionHook() {
      try {
        if (typeof adapter.bindSelectionListener === 'function') {
          adapter.bindSelectionListener(onTileSelected);
          return;
        }
      } catch (_e) {}

      document.addEventListener('PQ_SPEAK_SELECT', function (ev) {
        const detail = ev && ev.detail ? ev.detail : null;
        if (!detail || !detail.key) return;
        onTileSelected(detail);
      });
    }

    function boot() {
      if (booted) return;
      booted = true;

      buildPanel();
      installMountGuard();
      bindSelectionHook();
      refreshDoneClasses();
      setStatus(cfg.idleHint);

      document.addEventListener('click', function () {
        try {
          refreshButtons();
        } catch (_e) {}
      }, true);

      document.addEventListener('pq:open-step-review', function () {
        try {
          refreshButtons();
          refreshDoneClasses();
        } catch (_e) {}
      });

      document.addEventListener('pq:review-mode-enabled', function () {
        try {
          refreshButtons();
          refreshDoneClasses();
        } catch (_e) {}
      });
    }

    return {
      __version: ENGINE_VERSION,
      boot: boot,
      onTileSelected: onTileSelected,
      refreshDoneClasses: refreshDoneClasses,
      maybeCompleteStep: maybeCompleteStep,
      isSpeakStepActive: isSpeakStepActive,
      getCurrentStepId: getCurrentStepId
    };
  }

  window.PQSharedSpeakEngine = {
    __version: ENGINE_VERSION,
    create: createEngine
  };
})(window, document);