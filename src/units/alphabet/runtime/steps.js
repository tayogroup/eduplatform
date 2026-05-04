/*
  Pre-Quraan Alphabet runtime fragment: steps.js
  Step definitions, managed/review/free-practice mode helpers, and per-step play tracking.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
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
