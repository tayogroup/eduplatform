/*
  Pre-Quraan Alphabet runtime fragment: progress.js
  Moodle managed-progress web services, DOM references, lecture UI, and settings/filter helpers.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
  // SECTION 19: Moodle managed-progress WS helpers
  // ============================================================
  let __pqQaSkipHandoff = null;
  const __PQ_QA_SKIP_HANDOFF_KEY = 'pq_qa_skip_handoff_v1';

  function __pqNextStepIdAfter(stepId) {
    try {
      const sid = String(stepId || '').trim();
      if (!sid || !Array.isArray(STEPS)) return '';
      const index = STEPS.findIndex((step) => String((step && step.id) || '') === sid);
      if (index < 0) return '';
      const next = STEPS.slice(index + 1).find((step) => step && step.id);
      return next ? String(next.id || '') : sid;
    } catch (_e) {
      return '';
    }
  }

  function __pqStartQaSkipHandoff(skippedStepId) {
    try {
      const skipped = String(skippedStepId || '').trim();
      if (!skipped) return;
      __pqQaSkipHandoff = {
        skipped,
        next: __pqNextStepIdAfter(skipped),
        until: Date.now() + 30000
      };
      try {
        sessionStorage.setItem(__PQ_QA_SKIP_HANDOFF_KEY, JSON.stringify(__pqQaSkipHandoff));
      } catch (_e) {}
    } catch (_e) {}
  }

  function __pqGetQaSkipHandoff() {
    try {
      if (__pqQaSkipHandoff && Date.now() <= Number(__pqQaSkipHandoff.until || 0)) {
        return __pqQaSkipHandoff;
      }

      const raw = sessionStorage.getItem(__PQ_QA_SKIP_HANDOFF_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Date.now() <= Number(parsed.until || 0)) {
        __pqQaSkipHandoff = parsed;
        return __pqQaSkipHandoff;
      }
    } catch (_e) {}

    __pqQaSkipHandoff = null;
    try { sessionStorage.removeItem(__PQ_QA_SKIP_HANDOFF_KEY); } catch (_e) {}
    return null;
  }

  function __pqApplyQaSkipHandoff(progress) {
    try {
      const handoff = __pqGetQaSkipHandoff();
      if (!handoff) {
        return progress;
      }

      const skipped = String(handoff.skipped || '').trim();
      const next = String(handoff.next || '').trim();
      if (!progress || !skipped || !next) return progress;

      const existing = progress[skipped] || {};
      const required = Math.max(
        1,
        Number(existing.passesRequired ?? existing.passes_required ?? 1) || 1
      );
      progress[skipped] = {
        ...existing,
        passesDone: required,
        passes_done: required,
        passesRequired: required,
        passes_required: required,
        completed: true,
        step_status: 'completed',
        status: 'completed'
      };
      progress.currentStepId = next;
      return progress;
    } catch (_e) {
      return progress;
    }
  }

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

    return __pqApplyQaSkipHandoff(normalized.raw);
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

  function __pqGetConfiguredStepPassRequirement(step) {
    try {
      const sid = String((step && step.id) || '').trim();
      if (!sid) return 1;

      const candidates = [
        step.passesRequired,
        step.passes_required,
        step.default_passes_required,
        step.defaultPassesRequired
      ];

      const injected = __cfg('stepInjection.' + sid, null);
      if (injected && typeof injected === 'object') {
        candidates.push(
          injected.passesRequired,
          injected.passes_required,
          injected.default_passes_required,
          injected.defaultPassesRequired
        );
        if (Array.isArray(injected.passFilters)) {
          candidates.push(injected.passFilters.length);
        }
      }

      if (Array.isArray(step.passFilters)) {
        candidates.push(step.passFilters.length);
      }

      const cfgFilters = __cfg('stepPassFilters.' + sid, null);
      if (Array.isArray(cfgFilters)) {
        candidates.push(cfgFilters.length);
      }

      return Math.max(
        1,
        ...candidates
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value >= 1)
      );
    } catch (_e) {
      return 1;
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

      const configuredPassesRequired = __pqGetConfiguredStepPassRequirement(step);
      const prevPassesDone = Number(prev.passesDone ?? prev.passes_done ?? 0);
      const prevPassesRequired = Number(
        prev.passesRequired ??
        prev.passes_required ??
        configuredPassesRequired
      );
      const prevRepeatPerLetter = Number(
        prev.repeatPerLetter ??
        prev.repeats_per_letter ??
        prev.repeat_per_letter ??
        prev.default_repeats_per_letter ??
        prev.defaultRepeatsPerLetter ??
        1
      );

      const passesRequired = Math.max(
        configuredPassesRequired,
        Number.isFinite(prevPassesRequired) && prevPassesRequired >= 1
          ? prevPassesRequired
          : 1
      );
      const passesDone = Number.isFinite(prevPassesDone) && prevPassesDone >= 0
        ? Math.min(prevPassesDone, passesRequired)
        : 0;
      const explicitCompleted = !!(
        prev.step_status === 'completed' ||
        prev.status === 'completed'
      );

      shaped[step.id] = {
        ...(shaped[step.id] || {}),
        passesDone: passesDone,
        passesRequired: passesRequired,
        repeatPerLetter:
          Number.isFinite(prevRepeatPerLetter) && prevRepeatPerLetter >= 1
            ? prevRepeatPerLetter
            : 1,
        completed: !!(explicitCompleted || passesDone >= passesRequired)
      };

      try {
        if (__pqIsPassFilterStep(step.id)) {
          shaped[step.id].passesRequired = Math.max(
            shaped[step.id].passesRequired,
            __pqGetStepPassCount(step.id)
          );
          shaped[step.id].passesDone = Math.min(
            shaped[step.id].passesDone,
            shaped[step.id].passesRequired
          );
          shaped[step.id].completed = !!(
            explicitCompleted ||
            shaped[step.id].passesDone >= shaped[step.id].passesRequired
          );
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
    const rawCurrentId = String((raw && raw.currentStepId) || '').trim();
    const rawCurrentIndex = ordered.findIndex(
      (step) => step && step.id === rawCurrentId
    );
    const rawCurrentIsValid = rawCurrentIndex >= 0;
    const rawCurrentCanResume = rawCurrentIsValid && ordered
      .slice(0, rawCurrentIndex)
      .every((step) => !!(shaped[step.id] && shaped[step.id].completed));

    shaped.currentStepId = rawCurrentCanResume
      ? rawCurrentId
      : (
          firstIncomplete
            ? firstIncomplete.id
            : ((ordered[ordered.length - 1] && ordered[ordered.length - 1].id) || 'lecture')
        );

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
  let pqStepPrevBtn = document.getElementById('pqStepPrevBtn');
  let pqStepSkipBtn = document.getElementById('pqStepSkipBtn');

function __pqSetBilingualControlLabel(el, english, arabic) {
  try {
    if (!el) return;
    const enText = String(english || '').replace(/^[^\w]+/u, '').trim() || String(english || '').trim();
    const arText = String(arabic || '').trim();

    el.textContent = '';
    el.classList.add('pq-bilingual-control');
    el.setAttribute('dir', 'auto');
    el.style.display = 'inline-flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.gap = '2px';
    el.style.whiteSpace = 'normal';

    const en = document.createElement('span');
    en.className = 'pq-bilingual-control__en';
    en.setAttribute('dir', 'ltr');
    en.style.display = 'block';
    en.style.unicodeBidi = 'isolate';
    en.textContent = enText;
    el.appendChild(en);

    if (arText) {
      const ar = document.createElement('span');
      ar.className = 'pq-bilingual-control__ar';
      ar.setAttribute('dir', 'rtl');
      ar.style.display = 'block';
      ar.style.unicodeBidi = 'isolate';
      ar.textContent = arText;
      el.appendChild(ar);
    }

    el.setAttribute('aria-label', arText ? (enText + ' - ' + arText) : enText);
  } catch (_e) {
    try { el.textContent = String(english || ''); } catch (_e2) {}
  }
}

function __pqStepArabicLabel(step, fallback) {
  try {
    return String((step && (step.arabicLabel || step.labelAr || step.ar)) || fallback || '').trim();
  } catch (_e) {
    return String(fallback || '');
  }
}

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

function __pqMountStepActionControls(forceCombined) {
  try {
    const actionSlot = document.getElementById('pqHeaderActionSlot');
    const previousSlot = document.getElementById('pqHeaderPreviousStepSlot');
    const skipSlot = document.getElementById('pqHeaderQaSkipSlot');
    const hasSplitDesktopSlots = !forceCombined && !!(actionSlot && previousSlot && skipSlot);

    if (hasSplitDesktopSlots) {
      try {
        Array.from(pqStepActionBar.children || []).forEach((child) => {
          if (child !== pqStepActionBtn) child.remove();
        });
      } catch (_e) {}

      if (pqStepActionBtn && pqStepActionBtn.parentNode !== pqStepActionBar) {
        pqStepActionBar.appendChild(pqStepActionBtn);
      }

      if (pqStepActionBar.parentNode !== actionSlot) {
        actionSlot.appendChild(pqStepActionBar);
      }

      if (pqStepPrevBtn && pqStepPrevBtn.parentNode !== previousSlot) {
        previousSlot.appendChild(pqStepPrevBtn);
      }

      if (pqStepSkipBtn && pqStepSkipBtn.parentNode !== skipSlot) {
        skipSlot.appendChild(pqStepSkipBtn);
      }

      return;
    }

    __pqMountStepActionControls();
  } catch (_e) {}
}

function __pqEnsureDynamicActionHost() {
  try {
    if (!pqStepActionBar) {
      pqStepActionBar = document.getElementById('pqStepActionBar');
    }

    if (!pqStepActionBtn) {
      pqStepActionBtn = document.getElementById('pqStepActionBtn');
    }

    if (!pqStepPrevBtn) {
      pqStepPrevBtn = document.getElementById('pqStepPrevBtn');
    }

    if (!pqStepSkipBtn) {
      pqStepSkipBtn = document.getElementById('pqStepSkipBtn');
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

    if (!pqStepPrevBtn) {
      pqStepPrevBtn = document.createElement('button');
      pqStepPrevBtn.type = 'button';
      pqStepPrevBtn.id = 'pqStepPrevBtn';
      pqStepPrevBtn.className = 'pq-step-prev-btn';
      pqStepPrevBtn.textContent = 'Step Back \u2190';
    }

    if (!pqStepSkipBtn) {
      pqStepSkipBtn = document.createElement('button');
      pqStepSkipBtn.type = 'button';
      pqStepSkipBtn.id = 'pqStepSkipBtn';
      pqStepSkipBtn.className = 'pq-step-skip-btn';
      pqStepSkipBtn.textContent = 'Skip';
      pqStepSkipBtn.hidden = true;
    }

    if (
      pqStepActionBtn.parentNode !== pqStepActionBar ||
      pqStepPrevBtn.parentNode !== pqStepActionBar ||
      pqStepSkipBtn.parentNode !== pqStepActionBar
    ) {
      try {
        pqStepActionBar.innerHTML = '';
      } catch (_e) {}
      pqStepActionBar.appendChild(pqStepPrevBtn);
      pqStepActionBar.appendChild(pqStepActionBtn);
      pqStepActionBar.appendChild(pqStepSkipBtn);
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
  gap:0;
  width:auto;
  min-width:0;
  margin:0;
  visibility:visible !important;
  opacity:1 !important;
  pointer-events:auto !important;
}

#pqStepActionBtn.pq-step-action-btn,
#pqStepPrevBtn.pq-step-prev-btn,
#pqStepSkipBtn.pq-step-skip-btn{
  appearance:none;
  -webkit-appearance:none;
  display:inline-flex !important;
  align-items:center;
  justify-content:center;
  width:auto;
  min-width:160px;
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

#pqStepPrevBtn.pq-step-prev-btn{
  min-width:170px;
  background:#fff5d8;
  color:#5a4219;
  box-shadow:inset 0 0 0 2px #e2bd67,0 10px 24px rgba(0,0,0,.08);
}

#pqStepSkipBtn.pq-step-skip-btn{
  min-width:180px;
  background:#e8fff0;
  color:#14532d;
  box-shadow:inset 0 0 0 2px #75c98b,0 10px 24px rgba(0,0,0,.08);
}

#pqStepActionBar.pq-step-action-bar[data-prev-visible="0"]{
  justify-content:center;
  min-width:0;
}

#pqStepActionBtn.pq-step-action-btn[disabled],
#pqStepPrevBtn.pq-step-prev-btn[disabled],
#pqStepSkipBtn.pq-step-skip-btn[disabled]{
  opacity:.5 !important;
  cursor:not-allowed;
}

#pqStepActionBtn.pq-step-action-btn[hidden],
#pqStepPrevBtn.pq-step-prev-btn[hidden],
#pqStepSkipBtn.pq-step-skip-btn[hidden]{
  display:none !important;
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
#pqUnifiedBottomBar #pqStepActionBtn,
#pqUnifiedBottomBar #pqStepPrevBtn,
#pqUnifiedBottomBar #pqStepSkipBtn{
  pointer-events:auto !important;
  touch-action:manipulation;
}

@media (max-width: 768px){
  #pqStepActionBar.pq-step-action-bar{
    min-width:0;
    width:100%;
  }

  #pqStepActionBtn.pq-step-action-btn,
  #pqStepPrevBtn.pq-step-prev-btn,
  #pqStepSkipBtn.pq-step-skip-btn{
    min-height:50px;
    padding:12px 16px;
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

    if (pqStepPrevBtn && !pqStepPrevBtn.__pqBound__) {
      pqStepPrevBtn.addEventListener('click', __pqHandlePreviousStepClick);
      pqStepPrevBtn.__pqBound__ = true;
    }

    if (pqStepSkipBtn && !pqStepSkipBtn.__pqBound__) {
      pqStepSkipBtn.addEventListener('click', __pqHandleQaSkipStepClick);
      pqStepSkipBtn.__pqBound__ = true;
    }

    return {
      bar: pqStepActionBar,
      button: pqStepActionBtn,
      previousButton: pqStepPrevBtn,
      skipButton: pqStepSkipBtn
    };
  } catch (_e) {
    return null;
  }
}

function __pqPreviousStepButtonLabel() {
  const raw = String(__cfg('stepNavigation.previous.label', 'Step Back \u2190') || '').trim();
  const normalized = raw.replace(/\s+/g, ' ').toLowerCase();

  if (
    !raw ||
    normalized === 'step' ||
    normalized === '\u2190 step' ||
    normalized === 'step \u2190'
  ) {
    return 'Step Back \u2190';
  }

  return raw;
}

const __PQ_SHARED_STEP_NAV_MESSAGES = Object.freeze({
  previous: Object.freeze({
    confirmTitle: 'Go back one step?',
    confirmText: 'This will move you back to {previousStep}. Your progress for {currentStep} and {previousStep} will be reset so you can try again.',
    confirmContinueText: 'Yes, go back',
    confirmCancelText: 'Stay here'
  }),
  skip: Object.freeze({
    confirmTitle: 'Skip this step?',
    confirmText: 'This will mark {currentStep} complete and move you to the next step.',
    confirmContinueText: 'Yes, skip step',
    confirmCancelText: 'Stay here'
  })
});

function __pqSharedStepNavigationText(section, key) {
  try {
    return String(
      __PQ_SHARED_STEP_NAV_MESSAGES &&
      __PQ_SHARED_STEP_NAV_MESSAGES[section] &&
      __PQ_SHARED_STEP_NAV_MESSAGES[section][key]
    );
  } catch (_e) {
    return '';
  }
}

function __pqQaEnvironment() {
  try {
    const q = new URLSearchParams(location.search || '');
    const raw = String(
      q.get('pq_env') ||
      q.get('env') ||
      q.get('pq_environment') ||
      window.__prequran_environment ||
      sessionStorage.getItem('pq_env') ||
      ''
    ).trim().toLowerCase().replace(/[-\s]+/g, '_');

    if (raw === 'stage') return 'staging';
    if (raw === 'int' || raw === 'qa') return 'integration';
    if (raw === 'integration' || raw === 'staging' || raw === 'production') return raw;

    const host = String(location.hostname || '').toLowerCase();
    const path = String(location.pathname || '').toLowerCase();
    if (
      (host === '127.0.0.1' || host === 'localhost' || host === '::1') &&
      path.includes('/pre_quraan_integration/')
    ) {
      return 'integration';
    }
  } catch (_e) {}

  return 'production';
}

function __pqLocalIntegrationManagedTest() {
  try {
    const q = new URLSearchParams(location.search || '');
    const host = String(location.hostname || '').toLowerCase();
    const managed = String(q.get('managed') || q.get('pq_managed') || '').toLowerCase();
    return (
      (host === '127.0.0.1' || host === 'localhost' || host === '::1') &&
      String(location.pathname || '').toLowerCase().includes('/pre_quraan_integration/') &&
      (managed === '1' || managed === 'true' || managed === 'yes')
    );
  } catch (_e) {
    return false;
  }
}

function __pqQaSkipLaunchAllowed() {
  try {
    const q = new URLSearchParams(location.search || '');
    const explicit = q.has('pq_can_skip_step') || q.has('pqdebug_skip_step');
    const launched = String(
      q.get('pq_can_skip_step') ||
      q.get('pqdebug_skip_step') ||
      window.__prequran_can_skip_step ||
      ''
    ).toLowerCase();
    const allowed = explicit && (
      launched === '1' ||
      launched === 'true' ||
      launched === 'yes'
    );

    if (allowed) {
      try { window.__prequran_can_skip_step = true; } catch (_e) {}
      try { sessionStorage.setItem('pq_can_skip_step', '1'); } catch (_e) {}
    } else {
      try { window.__prequran_can_skip_step = false; } catch (_e) {}
      try { sessionStorage.removeItem('pq_can_skip_step'); } catch (_e) {}
    }

    return allowed;
  } catch (_e) {
    return false;
  }
}

function __pqCanShowQaSkipStep() {
  try {
    if (__pqQaEnvironment() === 'production') return false;
    return __pqQaSkipLaunchAllowed() || __pqLocalIntegrationManagedTest();
  } catch (_e) {
    return false;
  }
}

try {
  window.__pqQaSkipDebug = function () {
    const target = __pqCurrentQaSkipTarget();
    return {
      env: __pqQaEnvironment(),
      launchAllowed: __pqQaSkipLaunchAllowed(),
      canShow: __pqCanShowQaSkipStep(),
      target,
      mounted: !!(pqStepSkipBtn && document.body.contains(pqStepSkipBtn)),
      hidden: pqStepSkipBtn ? pqStepSkipBtn.hidden : null,
      display: pqStepSkipBtn ? pqStepSkipBtn.style.display : null
    };
  };
} catch (_e) {}

function __pqCurrentQaSkipTarget() {
  try {
    const current = getCurrentStep();
    const step = current && current.step ? current.step : null;
    const progress = current && current.progress ? current.progress : null;
    const stepId = step && step.id ? String(step.id) : '';
    if (!stepId) return null;

    return {
      stepId,
      completed: !!(progress && progress.completed),
      progress
    };
  } catch (_e) {
    return null;
  }
}

function __pqQaSkipTargetUserId() {
  try {
    const q = new URLSearchParams(location.search || '');
    const candidates = [
      window.__prequran_studentid,
      q.get('studentid'),
      q.get('monitor_studentid'),
      q.get('commstudentid'),
      q.get('childid'),
      sessionStorage.getItem('pq_studentid'),
      sessionStorage.getItem('pq_childid'),
      pqGetUid()
    ];

    for (const candidate of candidates) {
      const n = parseInt(candidate, 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch (_e) {}

  return pqGetUid();
}

function __pqSyncQaSkipStepButton() {
  try {
    if (!pqStepSkipBtn) return;

    const target = __pqCurrentQaSkipTarget();
    const visible = !!(__pqCanShowQaSkipStep() && target && target.stepId && !target.completed);

    pqStepSkipBtn.hidden = !visible;
    pqStepSkipBtn.style.display = visible ? 'inline-flex' : 'none';
    pqStepSkipBtn.disabled = !visible || pqStepSkipBtn.classList.contains('is-working');
    pqStepSkipBtn.title = visible ? 'Skip this step for QA testing' : '';
    pqStepSkipBtn.setAttribute('aria-label', 'Skip this step for QA testing');

    if (visible) {
      __pqSetBilingualControlLabel(pqStepSkipBtn, 'Skip Step', '');
    }
  } catch (_e) {}
}

async function __pqRefreshAfterQaSkip() {
  try {
    let state = null;
    if (__LessonRuntime && typeof __LessonRuntime.refresh === 'function') {
      state = await __LessonRuntime.refresh();
    }

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
        window.__PQ_RUNTIME_STEPS_SOURCE__ = state.stepsSource || 'db';
      } catch (_e) {}
    }

    if (state && state.progress) {
      managedProgress = __pqApplyQaSkipHandoff(ensureProgressShape(state.progress));
    }
  } catch (_e) {}

  try { __pqRunPostModeUiRefresh(); } catch (_e) {}
  try { __pqAfterProgressChange(true); } catch (_e) {}
  try { __pqForceStepHandoffRefresh(); } catch (_e) {}
  try { __pqSyncQaSkipStepButton(); } catch (_e) {}
}

function __pqForceStepHandoffRefresh() {
  try { __pqStickyReviewStepId = null; } catch (_e) {}
  try { __pqNormalizeCurrentStepId(); } catch (_e) {}
  try { __pqResetPreviousStepVisualState(); } catch (_e) {}
  try { fgSyncStepContext(true); } catch (_e) {}
  try { __pqPlaylistEngine = null; } catch (_e) {}
  try { renderStepper(); } catch (_e) {}
  try { renderGrid(); } catch (_e) {}
  try { markActive(); } catch (_e) {}
  try { refreshPlayedClasses(); } catch (_e) {}
  try { updateControlsForCurrentStep(); } catch (_e) {}
  try { __pqSyncWriteUI(); } catch (_e) {}
  try { __pqForceWriteButtonRefresh(); } catch (_e) {}
  try { __pqEnsureSpeakBoot(); } catch (_e) {}
  try { __pqForceSpeakUiRefresh(); } catch (_e) {}
  try { __pqEnsureSubmitBoot(); } catch (_e) {}
  try { __pqSyncSubmitUi(); } catch (_e) {}
  try { __pqRenderMobileStepPicker(); } catch (_e) {}
  try { __pqSyncDynamicStepAction(); } catch (_e) {}

  try {
    window.requestAnimationFrame(() => {
      try { __pqNormalizeCurrentStepId(); } catch (_e) {}
      try { __pqRunPostModeUiRefresh(); } catch (_e) {}
      try { __pqSyncDynamicStepAction(); } catch (_e) {}
    });
  } catch (_e) {}
}

function __pqApplyQaSkipProgressState(stepId) {
  try {
    const sid = String(stepId || '').trim();
    if (!sid) return false;

    if (!managedProgress) {
      managedProgress = ensureProgressShape({ currentStepId: sid });
    }

    const existing = managedProgress[sid] || {};
    const required = Math.max(
      1,
      Number(existing.passesRequired ?? existing.passes_required ?? 1) || 1
    );

    managedProgress[sid] = {
      ...existing,
      passesDone: required,
      passes_done: required,
      passesRequired: required,
      passes_required: required,
      completed: true,
      step_status: 'completed',
      status: 'completed',
      completedAt: Date.now()
    };

    const next = (STEPS || []).find((step) => {
      const id = String((step && step.id) || '');
      return id && !(managedProgress[id] && managedProgress[id].completed);
    });

    managedProgress.currentStepId = next
      ? next.id
      : ((STEPS && STEPS[STEPS.length - 1] && STEPS[STEPS.length - 1].id) || sid);
    managedProgress.__finished = (STEPS || []).every(
      (step) => !!(managedProgress[step.id] && managedProgress[step.id].completed)
    );

    return true;
  } catch (_e) {
    return false;
  }
}

async function __pqApplyLocalQaSkipStep(stepId) {
  try {
    if (!__pqApplyQaSkipProgressState(stepId)) return false;

    try {
      localStorage.setItem(LS_PROGRESS_CACHE_KEY, JSON.stringify(managedProgress));
    } catch (_e) {}

    try { __pqRunPostModeUiRefresh(); } catch (_e) {}
    try { __pqAfterProgressChange(true); } catch (_e) {}
    try { __pqForceStepHandoffRefresh(); } catch (_e) {}
    try { __pqSyncQaSkipStepButton(); } catch (_e) {}
    return true;
  } catch (_e) {
    return false;
  }
}

function __pqNotifyQaSkipStep(message, tone = 'info') {
  const text = String(message || '').trim();
  if (!text) return;

  try {
    const api = __pqEnsureStepMessaging();
    if (api && typeof api.showToast === 'function') {
      api.showToast({ text, tone, timeout: 3200 });
      return;
    }
  } catch (_e) {}

  try {
    const prior = document.querySelector('.pq-qa-skip-toast');
    if (prior) prior.remove();

    const toast = document.createElement('div');
    toast.className = `pq-qa-skip-toast pq-qa-skip-toast--${tone}`;
    toast.setAttribute('role', 'status');
    toast.textContent = text;
    toast.style.cssText = [
      'position:fixed',
      'top:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2147483647',
      'max-width:min(92vw,560px)',
      'padding:12px 16px',
      'border-radius:16px',
      'background:#0f172a',
      'color:#fff',
      'font:800 14px/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'box-shadow:0 14px 28px rgba(15,23,42,.24)',
      'text-align:center'
    ].join(';');
    if (tone === 'error') {
      toast.style.background = '#991b1b';
    } else if (tone === 'success') {
      toast.style.background = '#166534';
    }
    document.body.appendChild(toast);
    window.setTimeout(() => {
      try { toast.remove(); } catch (_e) {}
    }, 3400);
  } catch (_e) {
    try { console.log(text); } catch (__e) {}
  }
}

async function __pqTryQaSkipStepFallback(stepId) {
  try {
    if (__pqQaEnvironment() === 'production') return false;
    if (!stepId || !__pqCanShowQaSkipStep()) return false;
    return await __pqApplyLocalQaSkipStep(stepId);
  } catch (_e) {
    return false;
  }
}

async function __pqConfirmQaSkipStep(target) {
  try {
    const stepId = String((target && target.stepId) || '');
    const step = (STEPS || []).find((item) => String((item && item.id) || '') === stepId) || null;
    const stepLabel = __pqDynamicStepLabel(step, stepId);
    const message = {
      titleText: __pqSharedStepNavigationText('skip', 'confirmTitle'),
      text: __pqSharedStepNavigationText('skip', 'confirmText')
        .replace(/\{currentStep\}/g, stepLabel),
      continueText: __pqSharedStepNavigationText('skip', 'confirmContinueText'),
      cancelText: __pqSharedStepNavigationText('skip', 'confirmCancelText')
    };

    const api = __pqEnsureStepMessaging();
    if (api && typeof api.showChoice === 'function') {
      return !!(await api.showChoice(message, message));
    }
  } catch (_e) {}

  try {
    return window.confirm('Skip this step?');
  } catch (_e) {
    return false;
  }
}

async function __pqHandleQaSkipStepClick(ev) {
  let target = null;
  try {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    if (!__pqCanShowQaSkipStep()) return;
    target = __pqCurrentQaSkipTarget();
    if (!target || !target.stepId || target.completed) return;

    const ok = await __pqConfirmQaSkipStep(target);
    if (!ok) return;

    if (__pqLocalIntegrationManagedTest()) {
      if (await __pqApplyLocalQaSkipStep(target.stepId)) return;
    }

    const core = pqResolveCore() || PQManagedCore;
    if (!core || typeof core.wsSet !== 'function') return;

    pqStepSkipBtn.classList.add('is-working');
    pqStepSkipBtn.disabled = true;

    try {
      if (typeof core.waitForTokens === 'function') {
        await core.waitForTokens(3000);
      } else if (typeof window.pqWaitForIframeTokens === 'function') {
        await window.pqWaitForIframeTokens(3000);
      }
    } catch (_e) {}

    const targetUserId = __pqQaSkipTargetUserId();
    const token = pqGetToken();
    if (!targetUserId || !token) {
      throw new Error('Missing Moodle user id or web-service token for QA skip.');
    }

    const q = new URLSearchParams(location.search || '');
    const result = await core.wsSet({
      wsfunction: 'local_prequran_skip_step',
      userid: targetUserId,
      studentid: targetUserId,
      wstoken: token,
      lessonid: LESSON_DEF.lessonid,
      unitid: LESSON_DEF.unitid,
      step_id: target.stepId,
      cohortid: Number(q.get('cohortid') || window.__prequran_cohortid || sessionStorage.getItem('pq_cohortid') || 0) || 0,
      pq_env: __pqQaEnvironment()
    });
    if (!result || result.status === false || result.ok === false) {
      throw new Error((result && (result.message || result.reason)) || 'QA skip web-service call did not complete.');
    }

    try {
      __pqStartQaSkipHandoff(target.stepId);
      __pqApplyQaSkipProgressState(target.stepId);
      __pqForceStepHandoffRefresh();
    } catch (_e) {}

    await __pqRefreshAfterQaSkip();
  } catch (err) {
    try {
      console.error('[Pre-Quraan] QA skip step failed', err);
    } catch (_e) {}
    if (await __pqTryQaSkipStepFallback(target && target.stepId)) {
      __pqNotifyQaSkipStep('Skipped this step in integration. Moodle progress will update after services are upgraded.', 'success');
    } else {
      __pqNotifyQaSkipStep('Could not skip this step. Refresh and try again, or ask an admin to upgrade Moodle services.', 'error');
    }
  } finally {
    try {
      if (pqStepSkipBtn) {
        pqStepSkipBtn.classList.remove('is-working');
        __pqSyncQaSkipStepButton();
      }
    } catch (_e) {}
  }
}

function __pqCanRunDynamicStepAction(meta) {
  try {
    const stepId = String((meta && meta.stepId) || '').toLowerCase();
    const mode = String((meta && meta.mode) || '').toLowerCase();
    const target = meta && meta.target ? meta.target : null;

    if (!stepId) return false;
    if (mode === 'speak') return true;
    if (mode === 'submit') return true;
    if (mode === 'playall') return true;
    if (mode === 'complete') return true;

    if (mode === 'target') {
      if (!target) return false;

      if (
        stepId === 'trace1' ||
        stepId === 'write' ||
        /^(write|trace)\d+$/.test(stepId)
      ) {
        return true;
      }

      return !target.disabled;
    }

    return false;
  } catch (_e) {
    return false;
  }
}

function __pqDynamicStepLabel(step, fallback) {
  try {
    if (typeof __pqLocalizedStepLabel === 'function') {
      return __pqLocalizedStepLabel(step, fallback);
    }
    return String(
      (step && (step.label || step.title)) ||
      fallback ||
      (step && step.id) ||
      'Action'
    );
  } catch (_e) {
    return String(fallback || 'Action');
  }
}

function __pqDynamicStepArabicLabel(step, fallback) {
  return __pqStepArabicLabel(step, fallback);
}

function __pqGetDynamicStepActionMeta() {
  try {
    const current = getCurrentStep();
    const step = current && current.step ? current.step : null;
    const rawStepId = String((step && step.id) || '').toLowerCase();
    const stepId = __pqCanonicalStepId(rawStepId);

    // Hide articulation image when NOT in sound step.
    try {
      if (stepId !== 'sound') {
        __pqHideSoundArticulationImage();
      }
    } catch (_e) {}

    if (/^(write|trace)\d+$/.test(stepId)) {
      return {
        stepId,
        label: __pqDynamicStepLabel(step, 'Write'),
        arabicLabel: __pqDynamicStepArabicLabel(step, '\u0627\u0643\u062a\u0628'),
        mode: 'target',
        target: document.getElementById('btnTrace') || null
      };
    }

    if (step && typeof __pqIsContentOnlyStep === 'function' && __pqIsContentOnlyStep(step)) {
      const isRulesStep = String(stepId || '').toLowerCase() === 'rules';
      return {
        stepId,
        label: String((step && step.actionLabel) || (isRulesStep ? 'Rules' : 'Complete')),
        arabicLabel: String((step && step.actionArabicLabel) || (isRulesStep ? '\u0627\u0644\u0642\u0648\u0627\u0639\u062f' : '\u0623\u0643\u0645\u0644')),
        mode: 'complete',
        target: null
      };
    }

    switch (stepId) {
      case 'lecture':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Lecture'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u0634\u0631\u062d'),
          mode: 'target',
          target:
            document.getElementById('pqLectureCtaBtn') ||
            document.getElementById('lecturePlayBtn') ||
            null
        };

      case 'listen':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Listen'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u0627\u0633\u062a\u0645\u0639'),
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'listenplus':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Listen+'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u062a\u0644\u0645\u064a\u062d\u0627\u062a \u0627\u0644\u062d\u0631\u0648\u0641'),
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'watch':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Watch'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u0634\u0627\u0647\u062f'),
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'sound':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Sound'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u0627\u0644\u0646\u0637\u0642'),
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'repeat':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Repeat'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u0643\u0631\u0631'),
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'speak':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Speak'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u062a\u062d\u062f\u062b'),
          mode: 'speak',
          target: null
        };

      case 'submit':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Submit'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u0623\u0631\u0633\u0644'),
          mode: 'submit',
          target: null
        };

      case 'match':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Match'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u0637\u0627\u0628\u0642'),
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'animate':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Animate'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u0634\u0627\u0647\u062f \u0627\u0644\u0643\u062a\u0627\u0628\u0629'),
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'trace1':
      case 'write':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Write'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u0627\u0643\u062a\u0628'),
          mode: 'target',
          target: document.getElementById('btnTrace') || null
        };

      case 'words':
        return {
          stepId,
          label: __pqDynamicStepLabel(step, 'Words'),
          arabicLabel: __pqDynamicStepArabicLabel(step, '\u062a\u0644\u0645\u064a\u062d\u0627\u062a \u0635\u0648\u062a\u064a\u0629'),
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      default:
        if (step && typeof __pqIsWatchStep === 'function' && __pqIsWatchStep(step)) {
          return {
            stepId,
            label: __pqDynamicStepLabel(step, 'Watch'),
            arabicLabel: __pqDynamicStepArabicLabel(step, '\u0634\u0627\u0647\u062f'),
            mode: 'playall',
            target: document.getElementById('btnPlayAll') || null
          };
        }

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

function __pqGetPreviousStepMeta() {
  try {
    if (__cfg('stepNavigation.previous.enabled', true) === false) return null;
    if (!__pqIsManagedUser() && !__pqCanShowQaSkipStep()) return null;

    const current = getCurrentStep();
    const currentStep = current && current.step ? current.step : null;
    const currentId = String((currentStep && currentStep.id) || '').trim();
    if (!currentId) return null;

    const ordered = __pqOrderStepsForNavigation(STEPS || []);
    const idx = ordered.findIndex((step) => step && step.id === currentId);
    if (idx <= 0) {
      const currentCanonicalId = __pqCanonicalStepId(currentId);
      const lectureStep = ordered.find((step) => {
        return __pqCanonicalStepId((step && step.id) || '') === 'lecture';
      });

      if (currentCanonicalId !== 'listen' || !lectureStep || lectureStep.id === currentId) {
        return null;
      }

      return {
        currentStep,
        currentId,
        previousStep: lectureStep,
        previousId: String(lectureStep.id)
      };
    }

    const previousStep = ordered[idx - 1] || null;
    if (!previousStep || !previousStep.id) return null;

    return {
      currentStep,
      currentId,
      previousStep,
      previousId: String(previousStep.id)
    };
  } catch (_e) {
    return null;
  }
}

function __pqOrderStepsForNavigation(steps) {
  try {
    const arr = (Array.isArray(steps) ? steps : []).slice();

    arr.sort((a, b) => {
      const stepIndexA = (a && a.step_index != null && a.step_index !== '')
        ? Number(a.step_index)
        : NaN;
      const stepIndexB = (b && b.step_index != null && b.step_index !== '')
        ? Number(b.step_index)
        : NaN;
      const hasA = Number.isFinite(stepIndexA);
      const hasB = Number.isFinite(stepIndexB);

      if (hasA && hasB && stepIndexA !== stepIndexB) return stepIndexA - stepIndexB;
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;

      const idA = __pqCanonicalStepId((a && a.id) || '');
      const idB = __pqCanonicalStepId((b && b.id) || '');
      const orderA = (__PQ_STEP_ORDER[idA] != null) ? __PQ_STEP_ORDER[idA] : 999;
      const orderB = (__PQ_STEP_ORDER[idB] != null) ? __PQ_STEP_ORDER[idB] : 999;

      if (orderA !== orderB) return orderA - orderB;

      return String((a && (a.label || a.title || a.id)) || '')
        .localeCompare(String((b && (b.label || b.title || b.id)) || ''));
    });

    return arr;
  } catch (_e) {
    return orderStepsForDisplay(steps || []);
  }
}

function __pqResetStepProgressState(stepId) {
  try {
    const sid = String(stepId || '').trim();
    if (!sid || !managedProgress) return;

    const existing = managedProgress[sid] || {};
    const step = (STEPS || []).find((item) => String((item && item.id) || '') === sid) || { id: sid };
    const configuredRequired = __pqGetConfiguredStepPassRequirement(step);
    const required = Math.max(
      1,
      configuredRequired,
      Number(
        existing.passesRequired ??
        existing.passes_required ??
        1
      ) || 1
    );
    const repeats = Math.max(
      1,
      Number(
        existing.repeatPerLetter ??
        existing.repeats_per_letter ??
        existing.repeat_per_letter ??
        1
      ) || 1
    );

    managedProgress[sid] = {
      ...existing,
      passesDone: 0,
      passes_done: 0,
      passesRequired: required,
      passes_required: required,
      repeatPerLetter: repeats,
      repeats_per_letter: repeats,
      completed: false,
      step_status: 'not_started',
      status: 'not_started'
    };

    delete managedProgress[sid].completedAt;
    delete managedProgress[sid].completionTime;
    delete managedProgress[sid].step_completiontime;
    delete managedProgress[sid].lastActivity;
    delete managedProgress[sid].step_lastactivity;
    delete managedProgress[sid].startedAt;
    delete managedProgress[sid].step_starttime;
  } catch (_e) {}
}

function __pqClearStepLocalTracking(stepId) {
  try {
    const sid = String(stepId || '').trim();
    if (!sid) return;
    const canonical = __pqCanonicalStepId(sid);
    const ids = Array.from(new Set([sid, canonical].filter(Boolean)));

    try {
      ids.forEach((id) => {
        if (letterPlays && letterPlays[id]) {
          letterPlays[id] = {};
        }
      });
      flushLetterPlays();
    } catch (_e) {}

    try {
      if (ids.includes('sound')) {
        Object.keys(__pqSoundVideoCompletedByKey || {}).forEach((key) => {
          delete __pqSoundVideoCompletedByKey[key];
        });
        localStorage.removeItem(__pqSoundCompletedStorageKey());
        document.querySelectorAll('.tile.pq-sound-done').forEach((tile) => {
          tile.classList.remove('pq-sound-done');
          tile.removeAttribute('data-sound-done');
          const check = tile.querySelector('.pq-sound-check');
          if (check) check.remove();
        });
        try { __pqUpdateSoundProgressCounter(); } catch (_e) {}
      }
    } catch (_e) {}

    try {
      if (ids.includes('speak')) {
        if (__pqSpeakUiState && __pqSpeakUiState.completedKeys) {
          __pqSpeakUiState.completedKeys = {};
        }
        localStorage.removeItem(__pqSpeakDoneStorageKeyFinal());
      }
    } catch (_e) {}

    try {
      if (ids.includes('submit') && typeof __pqSubmitState === 'object') {
        __pqSubmitState.submitted = false;
        __pqSubmitState.lastResult = null;
      }
    } catch (_e) {}
  } catch (_e) {}
}

function __pqResetPreviousStepVisualState() {
  try { __pqSetPlaylistDimming(false); } catch (_e) {}
  try { __pqCloseActiveMediaWindows(); } catch (_e) {}
  try { __pqResetGridVisualStateForStepHandoff(); } catch (_e) {}
  try { __pqClearPlayingTile(); } catch (_e) {}

  try {
    document.body.classList.remove('pq-playlist-active');
    document.documentElement.style.removeProperty('--pq-playlist-overlay-bg');
    document.documentElement.style.removeProperty('--pq-playlist-overlay-opacity');
  } catch (_e) {}

  try {
    const modal = document.getElementById('videoModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('pq-animate-video-modal');
      modal.removeAttribute('aria-busy');
    }
  } catch (_e) {}

  try {
    document
      .querySelectorAll('#grid .tile')
      .forEach((tile) => {
        tile.classList.remove(
          'active',
          'played',
          'completed',
          'pq-playing',
          'is-playing',
          'pq-speak-done'
        );
        tile.removeAttribute('data-speak-done');
        tile.style.opacity = '';
        if (String(tile.style.filter || '').indexOf('grayscale') !== -1) {
          tile.style.filter = '';
        }
      });
  } catch (_e) {}
}

function __pqApplyPreviousStepReturnState(meta) {
  try {
    if (!managedProgress) return;
    if (!meta || !meta.previousId || !meta.currentId) return;

    __pqResetStepProgressState(meta.previousId);
    __pqResetStepProgressState(meta.currentId);
    managedProgress.currentStepId = meta.previousId;
    managedProgress.__finished = false;
    managedProgress.__allCompleted = false;
  } catch (_e) {}
}

async function __pqConfirmPreviousStep(meta) {
  try {
    const previousLabel = __pqDynamicStepLabel(meta.previousStep, meta.previousId);
    const currentLabel = __pqDynamicStepLabel(meta.currentStep, meta.currentId);
    const titleText = __pqSharedStepNavigationText('previous', 'confirmTitle');
    const textTemplate = __pqSharedStepNavigationText('previous', 'confirmText');
    const message = {
      titleText,
      text: textTemplate
        .replace(/\{previousStep\}/g, previousLabel)
        .replace(/\{currentStep\}/g, currentLabel),
      continueText: __pqSharedStepNavigationText('previous', 'confirmContinueText'),
      cancelText: __pqSharedStepNavigationText('previous', 'confirmCancelText')
    };

    const api = __pqEnsureStepMessaging();
    if (api && typeof api.showChoice === 'function') {
      return !!(await api.showChoice(message, message));
    }
  } catch (_e) {}

  try {
    return window.confirm('Go back one step?');
  } catch (_e) {
    return false;
  }
}

async function __pqReturnToPreviousStep() {
  const meta = __pqGetPreviousStepMeta();
  if (!meta) return false;

  const confirmed = await __pqConfirmPreviousStep(meta);
  if (!confirmed) return false;

  if (!managedProgress) {
    try {
      managedProgress = ensureProgressShape({ currentStepId: meta.currentId });
    } catch (_e) {
      managedProgress = {
        currentStepId: meta.currentId,
        __finished: false,
        __allCompleted: false
      };
    }
  }

  try { stopAllMedia(); } catch (_e) {}
  try { __pqResetPreviousStepVisualState(); } catch (_e) {}

  __pqResetStepProgressState(meta.previousId);
  __pqResetStepProgressState(meta.currentId);
  __pqClearStepLocalTracking(meta.previousId);
  __pqClearStepLocalTracking(meta.currentId);

  try {
    __pqApplyPreviousStepReturnState(meta);
  } catch (_e) {}

  try {
    if (__DB_ONLY) {
      localStorage.removeItem(LS_PROGRESS_CACHE_KEY);
    } else {
      localStorage.setItem(LS_PROGRESS_CACHE_KEY, JSON.stringify(managedProgress));
    }
  } catch (_e) {}

  try {
    await sendManagedToMoodle(managedProgress);
  } catch (_e) {}

  try {
    if (__LessonRuntime && typeof __LessonRuntime.refresh === 'function') {
      const refreshed = await __LessonRuntime.refresh();
      const nextProgress =
        refreshed && (refreshed.progress || (refreshed.state && refreshed.state.progress));
      if (nextProgress) {
        managedProgress = ensureProgressShape(nextProgress);
        __pqApplyPreviousStepReturnState(meta);
      }
    }
  } catch (_e) {}

  try {
    __pqApplyPreviousStepReturnState(meta);
  } catch (_e) {}

  try {
    if (__DB_ONLY) {
      localStorage.removeItem(LS_PROGRESS_CACHE_KEY);
    } else {
      localStorage.setItem(LS_PROGRESS_CACHE_KEY, JSON.stringify(managedProgress));
    }
  } catch (_e) {}

  try {
    await sendManagedToMoodle(managedProgress);
  } catch (_e) {}

  try { __pqResetPreviousStepVisualState(); } catch (_e) {}
  try { fgSyncStepContext(true); } catch (_e) {}
  try { __pqPlaylistEngine = null; } catch (_e) {}
  try { renderStepper(); } catch (_e) {}
  try { renderGrid(); } catch (_e) {}
  try { markActive(); } catch (_e) {}
  try { refreshPlayedClasses(); } catch (_e) {}
  try { updateControlsForCurrentStep(); } catch (_e) {}
  try { __pqSyncWriteUI(); } catch (_e) {}
  try { __pqForceSpeakUiRefresh(); } catch (_e) {}
  try { __pqSyncSubmitUi(); } catch (_e) {}
  try { __pqRenderMobileStepPicker(); } catch (_e) {}
  try { __pqAfterProgressChange(true); } catch (_e) {}
  try { __pqForceStepHandoffRefresh(); } catch (_e) {}
  try {
    __pqApplyPreviousStepReturnState(meta);
    if (__DB_ONLY) {
      localStorage.removeItem(LS_PROGRESS_CACHE_KEY);
    } else {
      localStorage.setItem(LS_PROGRESS_CACHE_KEY, JSON.stringify(managedProgress));
    }
    sendManagedToMoodle(managedProgress).catch(function () {});
  } catch (_e) {}
  try { fgSyncStepContext(true); } catch (_e) {}
  try { __pqPlaylistEngine = null; } catch (_e) {}
  try { renderStepper(); } catch (_e) {}
  try { renderGrid(); } catch (_e) {}
  try { markActive(); } catch (_e) {}
  try { refreshPlayedClasses(); } catch (_e) {}
  try { updateControlsForCurrentStep(); } catch (_e) {}
  try { __pqSyncDynamicStepAction(); } catch (_e) {}
  try {
    window.requestAnimationFrame(() => {
      try { __pqApplyPreviousStepReturnState(meta); } catch (_e) {}
      try { __pqResetPreviousStepVisualState(); } catch (_e) {}
      try { renderGrid(); } catch (_e) {}
      try { markActive(); } catch (_e) {}
      try { refreshPlayedClasses(); } catch (_e) {}
      try { updateControlsForCurrentStep(); } catch (_e) {}
      try { __pqSyncDynamicStepAction(); } catch (_e) {}
      try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch (_e) {}
    });
  } catch (_e) {}
  try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch (_e) {}

  return true;
}

function __pqHandlePreviousStepClick(ev) {
  try {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    __pqReturnToPreviousStep();
  } catch (_e) {}
}

function __pqSyncDynamicStepAction() {
  try {
    const ensured = __pqEnsureDynamicActionHost();
    if (!ensured || !pqStepActionBar || !pqStepActionBtn) return;

    const meta = __pqGetDynamicStepActionMeta();
    const previousMeta = __pqGetPreviousStepMeta();
    const stepId = String(meta.stepId || '').toLowerCase();
    const mode = String(meta.mode || 'none').toLowerCase();

    try { __pqSetSpeakStepActive(mode === 'speak'); } catch (_e) {}

    __pqSetBilingualControlLabel(
      pqStepActionBtn,
      String(meta.label || 'Action'),
      String(meta.arabicLabel || '')
    );

    try {
      const desktopBackBtn = document.getElementById('pqDesktopBackBtn');
      if (desktopBackBtn) {
        __pqSetBilingualControlLabel(desktopBackBtn, 'Back', '\u0631\u062c\u0648\u0639');
        desktopBackBtn.title = 'Back - \u0631\u062c\u0648\u0639';
      }
    } catch (_e) {}

    try {
      if (btnPause) {
        const isPaused = !!(paused || __watchPaused);
        __pqSetBilingualControlLabel(
          btnPause,
          isPaused ? 'Resume' : 'Pause',
          isPaused ? '\u0627\u0633\u062a\u0626\u0646\u0627\u0641' : '\u0625\u064a\u0642\u0627\u0641'
        );
      }
    } catch (_e) {}

    pqStepActionBtn.dataset.stepId = stepId;
    pqStepActionBtn.dataset.mode = mode;

    try {
      const previousEnabled = !!previousMeta;
      pqStepActionBar.dataset.prevVisible = previousEnabled ? '1' : '0';
      if (pqStepPrevBtn) {
        pqStepPrevBtn.hidden = !previousEnabled;
        pqStepPrevBtn.style.display = previousEnabled ? 'inline-flex' : 'none';
        pqStepPrevBtn.disabled = !previousEnabled;
        pqStepPrevBtn.title = previousEnabled
          ? String(__cfg('stepNavigation.previous.title', 'Go back one step'))
          : '';
        pqStepPrevBtn.setAttribute('aria-label', pqStepPrevBtn.title || 'Go back one step');
        pqStepPrevBtn.textContent = __pqPreviousStepButtonLabel();
      }
    } catch (_e) {}

    if (!stepId) {
      pqStepActionBar.hidden = true;
      pqStepActionBar.style.display = 'none';
      pqStepActionBtn.hidden = true;
      pqStepActionBtn.disabled = true;
      if (pqStepPrevBtn) {
        pqStepPrevBtn.hidden = true;
        pqStepPrevBtn.disabled = true;
      }
      try { __pqSyncQaSkipStepButton(); } catch (_e) {}
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
    try { __pqSyncQaSkipStepButton(); } catch (_e) {}

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
      try { __pqSetSpeakStepActive(true); } catch (_e) {}
      try { __pqEnsureSpeakBoot(); } catch (_e) {}
      try { __pqForceSpeakUiRefresh(); } catch (_e) {}
      try { __pqScrollToSpeakActionBlock(); } catch (_e) {}
      return;
    }

    if (mode === 'submit') {
      try { __pqEnsureSubmitBoot(); } catch (_e) {}
      try { __pqSyncSubmitUi(); } catch (_e) {}
      try {
        const mount = document.getElementById('submitMount');
        if (mount && typeof mount.scrollIntoView === 'function') {
          mount.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (_e) {}
      return;
    }

    if (mode === 'playall') {
      try { playAll(); } catch (_e) {}
      return;
    }

    if (mode === 'complete') {
      markPlaylistStepCompleted(stepId).catch(function () {});
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
      const isBrowserUi = !!(
        document.documentElement &&
        document.documentElement.classList &&
        document.documentElement.classList.contains('pq-browser-ui')
      );
      if (isBrowserUi && Number(window.outerWidth || 0) > 768) {
        return false;
      }
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
      'animate',
      'rules',
      'diacritic'
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
		btn.textContent = '\u2190';
		btn.setAttribute('aria-label', 'Back');
		btn.title = 'Back';
		btn.className = 'pq-browser-back-btn';
		if (typeof __pqSetBilingualControlLabel === 'function') {
		  __pqSetBilingualControlLabel(btn, 'Back \u2190', '\u0631\u062c\u0648\u0639');
		  btn.setAttribute('aria-label', 'Back - \u0631\u062c\u0648\u0639');
		  btn.title = 'Back - \u0631\u062c\u0648\u0639';
		}

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
    if (typeof __pqSetBilingualControlLabel === 'function') {
      __pqSetBilingualControlLabel(backBtn, 'Back \u2190', '\u0631\u062c\u0648\u0639');
      backBtn.setAttribute('aria-label', 'Back - \u0631\u062c\u0648\u0639');
      backBtn.title = 'Back - \u0631\u062c\u0648\u0639';
    }
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

      __pqMountStepActionControls(true);

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
  __pqMountStepActionControls(false);

  if (!desktopActionSlot && pqStepActionBar && pqStepActionBar.parentNode !== browserHost) {
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
          const arabicLabel = String((step && step.arabicLabel) || '');

          item.innerHTML = `
            <div class="pq-mobile-step-picker__item-top">
              <span class="pq-mobile-step-picker__step">Step ${idx + 1}</span>
              <span class="pq-mobile-step-picker__state">${stateText}</span>
            </div>
            <div class="pq-mobile-step-picker__label">${String(step.label || sid)}</div>
            ${arabicLabel ? `<div class="pq-mobile-step-picker__label-ar" dir="rtl">${arabicLabel}</div>` : ''}
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
  const sid = __pqCanonicalStepId(stepId);

  return [
    'listen',
    'listenplus',
    'watch',
    'sound',
    'repeat',
    'match',
    'words',
    'animate',
    'diacritic'
  ].includes(sid) || /^(write|trace)\d+$/.test(String(stepId || '').toLowerCase());
}

  function __pqGetStepPassFilters(stepId) {
    try {
      const raw = String(stepId || '').toLowerCase();
      const sid = __pqCanonicalStepId(raw);
      const cfg = __cfg('stepPassFilters', {}) || {};
      const rawFilters = cfg[raw] || cfg[sid] || [];

      if (!Array.isArray(rawFilters) || !rawFilters.length) {
        return ['all'];
      }

      return rawFilters.map((v) => String(v || '').trim()).filter(Boolean);
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
      const canonical = __pqCanonicalStepId(sid);
      const progress = managedProgress && (managedProgress[sid] || managedProgress[canonical]);
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
