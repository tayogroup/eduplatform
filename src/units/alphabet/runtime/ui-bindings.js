/*
  Pre-Quraan Alphabet runtime fragment: ui-bindings.js
  Final UI bindings, shell/runtime orchestration, and startup.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
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

