/*
  EduPlatform Alphabet runtime fragment: write.js
  Current-step control updates and Write UI/stepper rendering sync.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
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
  'animate',
  'rules'
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

    if (
      stepId === 'speak' ||
      stepId === 'submit' ||
      stepId === 'trace1' ||
      stepId === 'write' ||
      /^(write|trace)\d+$/.test(stepId)
    ) {
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
      if (!__DB_ONLY && managedProgress) {
        localStorage.setItem(LS_PROGRESS_CACHE_KEY, JSON.stringify(managedProgress));
      }
    } catch (_e) {}

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
  try {
    __pqResetGridVisualStateForStepHandoff();
  } catch (_e) {}

  try {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  } catch (_e) {
    try { window.scrollTo(0, 0); } catch (_e2) {}
  }

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

  try {
    __pqSyncSubmitUi();
  } catch (_e) {}

  __pqAfterProgressChange(true);

  try {
    __pqRenderRewardStars(true);
  } catch (_e) {}

  try {
    requestAnimationFrame(() => {
      try {
        __pqResetGridVisualStateForStepHandoff();
        renderGrid();
        updateControlsForCurrentStep();
      } catch (_e) {}
    });
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
    } else if (managedProgress && managedProgress[stepId]) {
      const progress = managedProgress[stepId];
      progress.passesDone = Math.max(
        Number(progress.passesDone || 0) + 1,
        Number(progress.passesRequired || 1)
      );
      progress.completed = true;
      __pqLectureCompleteHandled = true;

      advanceStepIfNeeded();
      await persistManagedProgress();
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

function __pqExposeLectureCompletionBridge() {
  try {
    window.markLectureCompleted = markLectureCompleted;
  } catch (_e) {}

  try {
    const api = window.PQUnitRuntime = window.PQUnitRuntime || {};
    api.markLectureCompleted = markLectureCompleted;
    api.getCurrentStepId = function () {
      try {
        if (typeof getCurrentStep === 'function') {
          const current = getCurrentStep();
          const step = current && current.step ? current.step : null;
          return String((step && step.id) || (managedProgress && managedProgress.currentStepId) || '');
        }
      } catch (_e) {}
      try {
        return String(window.__PQ_CURRENT_STEP_ID__ || '');
      } catch (_e) {
        return '';
      }
    };
  } catch (_e) {}

  try {
    if (window.__PQ_RUNTIME_LECTURE_ENDED_BOUND__) return;
    window.__PQ_RUNTIME_LECTURE_ENDED_BOUND__ = true;
    window.addEventListener('pq:lecture:ended', function (event) {
      try {
        const sid = String(
          (event && event.detail && event.detail.stepId) || 'lecture'
        ).trim();
        if (!sid || sid === 'lecture') {
          const result = markLectureCompleted();
          if (result && typeof result.catch === 'function') result.catch(function () {});
        } else if (typeof markPlaylistStepCompleted === 'function') {
          const result = markPlaylistStepCompleted(sid);
          if (result && typeof result.catch === 'function') result.catch(function () {});
        }
      } catch (_e) {}
    });
  } catch (_e) {}
}

__pqExposeLectureCompletionBridge();

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

    function __pqFindStepById(stepId) {
      try {
        const sid = String(stepId || '');
        return (STEPS || []).find((step) => String((step && step.id) || '') === sid) || null;
      } catch (_e) {
        return null;
      }
    }

    function __pqSetStepperLabel(labelEl, step, text) {
      try {
        labelEl.textContent = '';

        const en = document.createElement('span');
        en.className = 'managed-step-label-en';
        en.textContent = String(text || step.label || step.id || '');
        labelEl.appendChild(en);

        if (step && step.arabicLabel) {
          const ar = document.createElement('span');
          ar.className = 'managed-step-label-ar';
          ar.setAttribute('dir', 'rtl');
          ar.textContent = String(step.arabicLabel || '');
          labelEl.appendChild(ar);
        }
      } catch (_e) {
        labelEl.textContent = String(text || (step && (step.label || step.id)) || '');
      }
    }

    function __pqDecorateRenderedStepperLabels() {
      try {
        const cards = stepperList.querySelectorAll('.managed-step');
        Array.prototype.forEach.call(cards, function (card, idx) {
          const sid = card.getAttribute('data-stepid') || '';
          const step = __pqFindStepById(sid) || ((STEPS || [])[idx] || null);
          if (!step || !step.arabicLabel) return;

          const label = card.querySelector('.managed-step-label');
          if (!label || label.querySelector('.managed-step-label-ar')) return;

          const englishText = String(label.textContent || step.label || step.id || '').trim();
          __pqSetStepperLabel(label, step, englishText);
        });
      } catch (_e) {}
    }

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

      __pqDecorateRenderedStepperLabels();

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
    __pqSetStepperLabel(label, step, String(step.label || step.id || ''));

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

      __pqSetStepperLabel(label, step, label.textContent);

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
