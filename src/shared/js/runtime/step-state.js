/*
  Pre-Quraan Alphabet runtime fragment: step-state.js
  Current step normalization, current-step lookup, and Write button refresh helpers.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
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
function __pqPublishCurrentStepState() {
  try {
    const currentId = String((managedProgress && managedProgress.currentStepId) || '');
    const step = (STEPS || []).find((s) => s.id === currentId) || null;
    window.__PQ_CURRENT_STEP_ID__ = currentId;
    window.__PQ_CURRENT_STEP__ = {
      step,
      progress: (managedProgress && step) ? managedProgress[step.id] : null
    };
  } catch (_e) {}
}

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
    try { __pqPublishCurrentStepState(); } catch (_e) {}

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

    const current = {
      step,
      progress: (managedProgress && step) ? managedProgress[step.id] : null
    };
    try {
      window.__PQ_CURRENT_STEP_ID__ = String((step && step.id) || '');
      window.__PQ_CURRENT_STEP__ = current;
    } catch (_e) {}
    return current;
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
