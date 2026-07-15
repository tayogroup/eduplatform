/*
  EduPlatform Alphabet runtime fragment: ui-bindings.js
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
        try {
          window.__PQ_RUNTIME_STEPS__ = STEPS.slice();
          window.__PQ_RUNTIME_STEPS_SOURCE__ = state.stepsSource || 'unknown';
        } catch (_e) {}
      }

      const runtimeManagedProgress = state ? state.progress : null;

      const runtimeHasServerProgress = !!(
        runtimeManagedProgress &&
        runtimeManagedProgress.__serverHasProgress
      );
      const hasMoodleIdentity = !!(pqGetUid() && pqGetToken());

      if (!runtimeHasServerProgress && !hasMoodleIdentity) {
        __LessonRuntime = null;
        return {
          managedProgress: null,
          sourceDb: false,
          sourceRuntime: false,
          dbOnly: false
        };
      }

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
        dbOnly: hasMoodleIdentity && __pqIsManagedUser()
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

    const managedUser = __pqIsManagedUser();
    const hasMoodleIdentity = !!(pqGetUid() && pqGetToken());

    if (!progress && (!managedUser || !hasMoodleIdentity)) {
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
      dbOnly: managedUser && hasMoodleIdentity
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
    const __pqTokenPreStartWaitMs = Math.max(
      0,
      Number(__cfg('auth.tokenPreStartWaitMs', 350)) || 350
    );

    function __pqWaitForTokenPreStart() {
      return Promise.race([
        Promise.resolve(__pqTokenReadyPromise),
        new Promise(function (resolve) {
          setTimeout(resolve, __pqTokenPreStartWaitMs);
        })
      ]);
    }

    try {
      if (typeof window.pqWaitForIframeTokens === 'function') {
        __pqTokenReadyPromise = window.pqWaitForIframeTokens(5000).catch(function () {
          return false;
        });
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

    try { await __pqWaitForTokenPreStart(); } catch (_e) {}

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

    try { await __pqWaitForTokenPreStart(); } catch (_e) {}
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
  // SECTION 31: Config-driven unit shell text
  // ============================================================
  function __pqApplyUnitShellText(unitConfig) {
    const cfg = unitConfig && typeof unitConfig === 'object' ? unitConfig : UNIT_CFG;
    const identity = cfg && cfg.identity && typeof cfg.identity === 'object' ? cfg.identity : {};
    const unitId = String(identity.unitId || cfg.unitid || '').trim();
    const lessonId = String(identity.lessonId || cfg.lessonid || unitId || '').trim();
    const fallbackTitle = String(unitId || lessonId || 'EduPlatform Unit');
    const readUi = (typeof __pqLocalizedCfg === 'function') ? __pqLocalizedCfg : __cfg;
    const pageTitle = String(readUi('ui.pageTitle', readUi('ui.lessonTitle', fallbackTitle, 'ui'), 'ui')).trim() || fallbackTitle;
    const headerTitle = String(readUi('ui.headerTitle', pageTitle, 'ui')).trim() || pageTitle;
    const headerArabicTitle = String(readUi('ui.headerArabicTitle', '', 'ui')).trim();
    const aboutLabel = String(readUi('ui.aboutLabel', 'About ' + headerTitle, 'ui')).trim() || ('About ' + headerTitle);

    try {
      document.title = pageTitle;
    } catch (_e) {}

    try {
      if (unitId) document.body.setAttribute('data-unit', unitId);
      if (lessonId) document.body.setAttribute('data-lesson', lessonId);
    } catch (_e) {}

    try {
      const titleEl = document.querySelector('.brand .title');
      if (titleEl) {
        if (typeof __pqSetBilingualControlLabel === 'function') {
          __pqSetBilingualControlLabel(titleEl, headerTitle, headerArabicTitle);
        } else {
          titleEl.textContent = headerTitle;
        }
      }
    } catch (_e) {}

    try {
      const backBtn = document.getElementById('pqDesktopBackBtn');
      if (backBtn && typeof __pqSetBilingualControlLabel === 'function') {
        __pqSetBilingualControlLabel(backBtn, 'Back', '\u0631\u062c\u0648\u0639');
        backBtn.title = 'Back - \u0631\u062c\u0648\u0639';
      }
    } catch (_e) {}

    try {
      const pauseBtn = document.getElementById('btnPause');
      if (pauseBtn && typeof __pqSetBilingualControlLabel === 'function') {
        __pqSetBilingualControlLabel(pauseBtn, 'Pause', '\u0625\u064a\u0642\u0627\u0641');
      }
    } catch (_e) {}

    try {
      const aboutText = document.querySelector('#pqAboutBtn .pq-pill__text');
      if (aboutText) aboutText.textContent = aboutLabel;
    } catch (_e) {}
  }

  // ============================================================
  // SECTION 32: Public startup API
  // ============================================================
  window.PQUnitRuntime = window.PQUnitRuntime || {};
  window.PQUnitRuntime.start = function startPQUnitRuntime(unitConfig) {
    if (unitConfig && typeof unitConfig === 'object') {
      window.UNIT_CFG = unitConfig;
    }

    __pqApplyUnitShellText(window.UNIT_CFG || unitConfig);

    if (window.__PQ_UNIT_RUNTIME_STARTED__) {
      return window.__PQ_UNIT_RUNTIME_START_PROMISE__ || Promise.resolve();
    }

    window.__PQ_UNIT_RUNTIME_STARTED__ = true;

    function run() {
      window.__PQ_UNIT_RUNTIME_START_PROMISE__ = __pqRefactoredStart().catch(function (e) {
        throw e;
      });
      return window.__PQ_UNIT_RUNTIME_START_PROMISE__;
    }

    if (document.readyState === 'loading') {
      window.__PQ_UNIT_RUNTIME_START_PROMISE__ = new Promise(function (resolve, reject) {
        document.addEventListener(
          'DOMContentLoaded',
          function () {
            run().then(resolve, reject);
          },
          { once: true }
        );
      });
      return window.__PQ_UNIT_RUNTIME_START_PROMISE__;
    }

    return run();
  };
})();
