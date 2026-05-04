/*
  Pre-Quraan Alphabet runtime fragment: progress.js
  Moodle managed-progress web services, DOM references, lecture UI, and settings/filter helpers.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
  // SECTION 19: Moodle managed-progress WS helpers
  // ============================================================
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

    return normalized.raw;
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

      const prevPassesDone = Number(prev.passesDone ?? prev.passes_done ?? 0);
      const prevPassesRequired = Number(prev.passesRequired ?? prev.passes_required ?? 1);
      const prevRepeatPerLetter = Number(
        prev.repeatPerLetter ??
        prev.repeats_per_letter ??
        prev.repeat_per_letter ??
        prev.default_repeats_per_letter ??
        prev.defaultRepeatsPerLetter ??
        1
      );

      shaped[step.id] = {
        ...(shaped[step.id] || {}),
        passesDone:
          Number.isFinite(prevPassesDone) && prevPassesDone >= 0
            ? prevPassesDone
            : 0,
        passesRequired:
          Number.isFinite(prevPassesRequired) && prevPassesRequired >= 1
            ? prevPassesRequired
            : 1,
        repeatPerLetter:
          Number.isFinite(prevRepeatPerLetter) && prevRepeatPerLetter >= 1
            ? prevRepeatPerLetter
            : 1,
        completed: !!(prev.completed || prev.step_status === 'completed')
      };

      try {
        if (__pqIsPassFilterStep(step.id)) {
          shaped[step.id].passesRequired = __pqGetStepPassCount(step.id);
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

    shaped.currentStepId = firstIncomplete
      ? firstIncomplete.id
      : ((ordered[ordered.length - 1] && ordered[ordered.length - 1].id) || 'lecture');

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

function __pqEnsureDynamicActionHost() {
  try {
    if (!pqStepActionBar) {
      pqStepActionBar = document.getElementById('pqStepActionBar');
    }

    if (!pqStepActionBtn) {
      pqStepActionBtn = document.getElementById('pqStepActionBtn');
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

    if (pqStepActionBtn.parentNode !== pqStepActionBar) {
      try {
        pqStepActionBar.innerHTML = '';
      } catch (_e) {}
      pqStepActionBar.appendChild(pqStepActionBtn);
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
  width:auto;
  margin:0;
  min-width:0;
  visibility:visible !important;
  opacity:1 !important;
  pointer-events:auto !important;
}

#pqStepActionBtn.pq-step-action-btn{
  appearance:none;
  -webkit-appearance:none;
  display:inline-flex !important;
  align-items:center;
  justify-content:center;
  width:auto;
  min-width:0;
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

#pqStepActionBtn.pq-step-action-btn[disabled]{
  opacity:.5 !important;
  cursor:not-allowed;
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
#pqUnifiedBottomBar #pqStepActionBtn{
  pointer-events:auto !important;
  touch-action:manipulation;
}

@media (max-width: 768px){
  #pqStepActionBar.pq-step-action-bar{
    justify-content:center;
    width:auto;
  }

  #pqStepActionBtn.pq-step-action-btn{
    min-height:50px;
    padding:12px 18px;
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

    return {
      bar: pqStepActionBar,
      button: pqStepActionBtn
    };
  } catch (_e) {
    return null;
  }
}

function __pqCanRunDynamicStepAction(meta) {
  try {
    const stepId = String((meta && meta.stepId) || '').toLowerCase();
    const mode = String((meta && meta.mode) || '').toLowerCase();
    const target = meta && meta.target ? meta.target : null;

    if (!stepId) return false;
    if (mode === 'speak') return true;
    if (mode === 'playall') return true;

    if (mode === 'target') {
      if (!target) return false;

      if (stepId === 'trace1' || stepId === 'write') {
        return true;
      }

      return !target.disabled;
    }

    return false;
  } catch (_e) {
    return false;
  }
}

function __pqGetDynamicStepActionMeta() {
  try {
    const current = getCurrentStep();
    const step = current && current.step ? current.step : null;
    const stepId = String((step && step.id) || '').toLowerCase();

    // ✅ PATCH: hide articulation image when NOT in sound step
    try {
      if (stepId !== 'sound') {
        __pqHideSoundArticulationImage();
      }
    } catch (_e) {}

    switch (stepId) {
      case 'lecture':
        return {
          stepId,
          label: 'Play Lecture',
          mode: 'target',
          target:
            document.getElementById('pqLectureCtaBtn') ||
            document.getElementById('lecturePlayBtn') ||
            null
        };

      case 'listen':
        return {
          stepId,
          label: 'Listen',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'listenplus':
        return {
          stepId,
          label: 'Listen+',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'watch':
        return {
          stepId,
          label: 'Watch',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'sound':
        return {
          stepId,
          label: 'Sound',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'repeat':
        return {
          stepId,
          label: 'Repeat',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'speak':
        return {
          stepId,
          label: 'Speak',
          mode: 'speak',
          target: null
        };

      case 'match':
        return {
          stepId,
          label: 'Match',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'animate':
        return {
          stepId,
          label: 'Animate',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      case 'trace1':
      case 'write':
        return {
          stepId,
          label: 'Write',
          mode: 'target',
          target: document.getElementById('btnTrace') || null
        };

      case 'words':
        return {
          stepId,
          label: 'Words',
          mode: 'playall',
          target: document.getElementById('btnPlayAll') || null
        };

      default:
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

function __pqSyncDynamicStepAction() {
  try {
    const ensured = __pqEnsureDynamicActionHost();
    if (!ensured || !pqStepActionBar || !pqStepActionBtn) return;

    const meta = __pqGetDynamicStepActionMeta();
    const stepId = String(meta.stepId || '').toLowerCase();
    const mode = String(meta.mode || 'none').toLowerCase();

    try { __pqSetSpeakStepActive(mode === 'speak'); } catch (_e) {}

    pqStepActionBtn.textContent = String(meta.label || 'Action');
    pqStepActionBtn.dataset.stepId = stepId;
    pqStepActionBtn.dataset.mode = mode;

    if (!stepId) {
      pqStepActionBar.hidden = true;
      pqStepActionBar.style.display = 'none';
      pqStepActionBtn.hidden = true;
      pqStepActionBtn.disabled = true;
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

    if (mode === 'playall') {
      try { playAll(); } catch (_e) {}
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
      'animate'
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
		btn.textContent = '←';
		btn.setAttribute('aria-label', 'Back');
		btn.title = 'Back';
		btn.className = 'pq-browser-back-btn';

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
  if (desktopActionSlot && pqStepActionBar && pqStepActionBar.parentNode !== desktopActionSlot) {
    desktopActionSlot.appendChild(pqStepActionBar);
  } else if (pqStepActionBar && pqStepActionBar.parentNode !== browserHost) {
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

          item.innerHTML = `
            <div class="pq-mobile-step-picker__item-top">
              <span class="pq-mobile-step-picker__step">Step ${idx + 1}</span>
              <span class="pq-mobile-step-picker__state">${stateText}</span>
            </div>
            <div class="pq-mobile-step-picker__label">${String(step.label || sid)}</div>
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
  const sid = String(stepId || '').toLowerCase();

  return [
    'listen',
    'listenplus',
    'watch',
    'sound',
    'repeat',
    'match',
    'words',
    'animate'
  ].includes(sid);
}

  function __pqGetStepPassFilters(stepId) {
    try {
      const sid = String(stepId || '').toLowerCase();
      const cfg = __cfg('stepPassFilters', {}) || {};
      const raw = cfg[sid] || [];

      if (!Array.isArray(raw) || !raw.length) {
        return ['all'];
      }

      return raw.map((v) => String(v || '').trim()).filter(Boolean);
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
      const progress = managedProgress && managedProgress[sid];
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
