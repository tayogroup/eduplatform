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

    const fileName = AUDIO_MAP && AUDIO_MAP[key];
    if (!fileName) {
      throw new Error('No audio mapped for Speak reference: ' + key);
    }

    const url = __pqAppendAssetVersion(AUDIO_BASE + String(fileName));
    const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1') || 1;

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

// Backward-compatible alias for locked adapter versions that still read the
// original Tanween-specific bridge name.
window.__pqTanweenSpeak = window.__pqSpeakBridge;

  function setPaused(value) {
    try {
      const current = getCurrentStep();

      if (current && __pqIsWatchStep(current.step)) {
        __watchPaused = !!value;
        paused = !!value;

        try {
          if (player) {
            if (__watchPaused) {
              player.pause();
            } else {
              player.play().catch(() => {});
            }
          }
        } catch (_e) {}

        if (btnPause) {
          btnPause.textContent = __watchPaused
  ? __PQ_TEXT_CACHE.resume
  : __PQ_TEXT_CACHE.pause;
        }

        return __watchPaused;
      }
    } catch (_e) {}

paused = !!value;

let result = paused;

try {
  if (paused) {
    if (__pqPauseWebAudio()) {
      result = true;
    } else {
      const api = __pqEnsurePlaylistEngine();
      result = api ? api.setPaused(value) : paused;
    }
  } else {
    const resumeRate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1');

    __pqResumeWebAudio(resumeRate)
      .then((ok) => {
        if (!ok) {
          try {
            const api = __pqEnsurePlaylistEngine();
            if (api) api.setPaused(false);
          } catch (_e) {}
        }
      })
      .catch(() => {
        try {
          const api = __pqEnsurePlaylistEngine();
          if (api) api.setPaused(false);
        } catch (_e) {}
      });

    result = false;
  }
} catch (_e) {
  const api = __pqEnsurePlaylistEngine();
  result = api ? api.setPaused(value) : paused;
}

    try {
      if (btnPause) {
        btnPause.textContent = paused
          ? __PQ_TEXT_CACHE.resume
          : __PQ_TEXT_CACHE.pause;
      }
    } catch (_e) {}

    return result;
  }

  async function pauseGate(signal) {
    try {
      const current = getCurrentStep();

      if (current && __pqIsWatchStep(current.step)) {
        while (__watchPaused) {
          __pqAssertNotAborted(signal);
          await __pqDelayWithAbort(120, signal);
        }
        return;
      }
    } catch (_e) {
      if (_e && _e.name === 'AbortError') throw _e;
    }

    while (paused) {
      __pqAssertNotAborted(signal);
      await __pqDelayWithAbort(120, signal);
    }

    return undefined;
  }

  function __pqGetWatchSequenceKeys() {
    const visible = [
      ...(grid ? grid.querySelectorAll('.tile[data-key]') : [])
    ].map((el) => String(el.dataset.key || ''));

    const visibleSet = new Set(visible.filter(Boolean));
    const fallback = (PLAY_SEQUENCE_KEYS || []).filter((key) => visibleSet.has(key));

    return __pqGetPassSequenceKeys('watch', fallback);
  }

  function __pqPlayVideoUrl(url, rate) {
    return new Promise((resolve, reject) => {
      try {
        if (!player || !videoModal || !url) {
          reject(new Error('video player unavailable'));
          return;
        }

        let settled = false;

        const cleanup = () => {
          try { player.onended = null; } catch (_e) {}
          try { player.onerror = null; } catch (_e) {}
          try { player.onpause = null; } catch (_e) {}
          try { player.onloadedmetadata = null; } catch (_e) {}
          try { player.oncanplay = null; } catch (_e) {}
          try { player.onabort = null; } catch (_e) {}
          try { player.onemptied = null; } catch (_e) {}
        };

        const done = (ok, err) => {
          if (settled) return;
          settled = true;
          cleanup();

          if (ok) {
            resolve(true);
          } else {
            reject(err || new Error('video playback failed'));
          }
        };

        try {
          videoModal.style.display = 'flex';
        } catch (_e) {}

        try { player.pause(); } catch (_e) {}
        try { player.removeAttribute('src'); } catch (_e) {}
        try { player.load(); } catch (_e) {}

        try {
          player.setAttribute('src', String(url));
        } catch (_e) {}

        try {
          player.playbackRate = Number(rate || 1) || 1;
        } catch (_e) {}

        player.onended = function () {
          try { if (videoModal) videoModal.style.display = 'none'; } catch (_e) {}
          done(true);
        };

        player.onerror = function () {
          done(false, new Error('video playback failed'));
        };

		player.onabort = function () {
          try { if (videoModal) videoModal.style.display = 'none'; } catch (_e) {}
          done(true);
        };

        player.onloadedmetadata = function () {
          try {
            player.currentTime = 0;
          } catch (_e) {}
        };

        player.oncanplay = function () {
          try {
            const maybePlay = player.play();
            if (maybePlay && typeof maybePlay.then === 'function') {
              maybePlay.then(function () {
                // playing
              }).catch(function (err) {
                done(false, err || new Error('video play() failed'));
              });
            }
          } catch (err) {
            done(false, err);
          }
        };

        try {
          player.load();
        } catch (err) {
          done(false, err);
        }
      } catch (err) {
        reject(err);
      }
    });
  }



function __pqCloseSoundArticulationModal() {
  try {
    const box = document.getElementById('pqSoundArticulationModal');
    if (box) box.remove();
  } catch (_e) {}
}

function __pqHideSoundArticulationImage() {
  __pqCloseSoundArticulationModal();
}

/*
  Shows articulation image inside the current page.

  Buttons:
  - replay: plays the letter audio without closing the modal
  - primary: closes modal and resolves "primary"
  - secondary: closes modal and resolves "secondary"

  This keeps Re-play Letter linked directly to the existing letter audio function,
  so we do not need a separate audio mapping.
*/

let __pqSoundExplainerPlayer = null;

function __pqGetSoundExplainerUrl(key) {
  try {
    let base = String(__cfg('media.soundAudioBase', '') || '');

    // Safety: if soundAudioBase is not the explainer folder, use fallback.
    if (!/\/explainer\/?$/i.test(base)) {
      base = String(__cfg('media.soundExplainerBase', '') || '');
    }

    if (!base) return '';

    const stem = (typeof __pqSoundFileStemFromKey === 'function')
      ? __pqSoundFileStemFromKey(key)
      : String(key || '').replace(/(\D+)(\d+)$/, function (_m, p1, p2) {
          return p1 + String(Number(p2) || 0).padStart(2, '0');
        });

    return __pqAppendAssetVersion(base.replace(/\/?$/, '/') + stem + '_explainer.mp3');
  } catch (_e) {
    return '';
  }
}

function __pqStopSoundExplainer() {
  try {
    if (__pqSoundExplainerPlayer) {
      __pqSoundExplainerPlayer.pause();
      __pqSoundExplainerPlayer.removeAttribute('src');
      __pqSoundExplainerPlayer.load();
    }
  } catch (_e) {}

  __pqSoundExplainerPlayer = null;
}

async function __pqPlaySoundExplainer(key) {
  try {
    __pqStopSoundExplainer();

    const url = __pqGetSoundExplainerUrl(key);
    if (!url) return false;

    __pqSoundExplainerPlayer = new Audio(url);
    __pqSoundExplainerPlayer.preload = 'auto';

    await __pqSoundExplainerPlayer.play();
    return true;
  } catch (err) {
    console.warn('[PQ Sound] explainer audio failed:', err);
    return false;
  }
}


function __pqSoundModalChoice(key, opts, signal, rate) {
  return new Promise((resolve) => {
    try {
      const url = SOUND_IMAGE_BY_KEY && SOUND_IMAGE_BY_KEY[key];

      if (!url) {
        resolve('primary');
        return;
      }

      __pqCloseSoundArticulationModal();

      const primaryLabel = (opts && opts.primary) || 'Continue';
      const secondaryLabel = opts && opts.secondary ? String(opts.secondary) : '';
      const replayLabel = (opts && opts.replay) || 'Re-play letter';
      const explainerLabel = (opts && opts.explainer) || 'Explainer';

      const overlay = document.createElement('div');
      overlay.id = 'pqSoundArticulationModal';
      overlay.className = 'pq-sound-modal-overlay';

      const card = document.createElement('div');
      card.className = 'pq-sound-modal-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'pq-sound-modal-close';
      closeBtn.setAttribute('data-choice', 'close');
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '×';

      const img = document.createElement('img');
      img.className = 'pq-sound-modal-img';
      img.src = url;
      img.alt = 'Articulation image';

      img.addEventListener('error', function () {
        try {
          console.warn('[PQ Sound] articulation image failed:', url);
        } catch (_e) {}
      });

      const actions = document.createElement('div');
      actions.className = 'pq-sound-modal-actions';

      function makeBtn(className, choice, label) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pq-sound-modal-btn ' + className;
        btn.setAttribute('data-choice', choice);
        btn.textContent = label;
        return btn;
      }

      // Required visual/order:
      // 1) Continue to next letter / Continue to video
      // 2) Return to video, if present
      // 3) Re-play letter
      // 4) Explainer
      const primaryBtn = makeBtn('pq-sound-primary', 'primary', primaryLabel);
      actions.appendChild(primaryBtn);

      let secondaryBtn = null;
      if (secondaryLabel) {
        secondaryBtn = makeBtn('pq-sound-secondary', 'secondary', secondaryLabel);
        actions.appendChild(secondaryBtn);
      }

      const replayBtn = makeBtn('pq-sound-replay', 'replay', replayLabel);
      actions.appendChild(replayBtn);

      const explainerBtn = makeBtn('pq-sound-explainer', 'explainer', explainerLabel);
      actions.appendChild(explainerBtn);

      card.appendChild(closeBtn);
      card.appendChild(img);
      card.appendChild(actions);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      function done(choice) {
        try { __pqStopSoundExplainer(); } catch (_e) {}
        try { overlay.remove(); } catch (_e) {}
        resolve(choice || 'primary');
      }

      explainerBtn.addEventListener('click', async function () {
        try {
          explainerBtn.disabled = true;
          explainerBtn.textContent = 'Playing explainer...';
          await __pqPlaySoundExplainer(key);
        } catch (_e) {
        } finally {
          try {
            explainerBtn.disabled = false;
            explainerBtn.textContent = explainerLabel;
          } catch (_e) {}
        }
      });

      replayBtn.addEventListener('click', async function () {
        try {
          replayBtn.disabled = true;
          replayBtn.textContent = 'Playing sound...';
          await playLetter(key, 1, rate);
        } catch (_e) {
        } finally {
          try {
            replayBtn.disabled = false;
            replayBtn.textContent = replayLabel;
          } catch (_e) {}
        }
      });

      primaryBtn.addEventListener('click', function () {
        done('primary');
      }, { once: true });

      if (secondaryBtn) {
        secondaryBtn.addEventListener('click', function () {
          done('secondary');
        }, { once: true });
      }

      closeBtn.addEventListener('click', function () {
        done('primary');
      }, { once: true });

      if (signal) {
        if (signal.aborted) {
          done('aborted');
          return;
        }

        signal.addEventListener('abort', function () {
          done('aborted');
        }, { once: true });
      }
    } catch (_e) {
      resolve('primary');
    }
  });
}

function __pqCloseSoundVideo() {
  try {
    if (player) {
      player.pause();
      player.removeAttribute('src');
      player.load();
    }
  } catch (_e) {}

  try {
    if (videoModal) {
      videoModal.style.display = 'none';
    }
  } catch (_e) {}
}

async function __pqPlaySoundGuidedFlow(key, url, rate, signal) {
  // Step 1: audio plays first automatically.
  await playLetter(key, 1, rate);

  // Step 2: after audio, show image modal with Replay + Continue to video.
  while (true) {
    const afterAudio = await __pqSoundModalChoice(key, {
      replay: 'Re-play letter',
      primary: 'Continue to video'
    }, signal, rate);

    if (afterAudio === 'aborted' || (signal && signal.aborted)) return false;

    if (afterAudio === 'primary') {
      break;
    }
  }

  // Step 3+: play video, close video, show final image modal.
  while (true) {
    await __pqPlayVideoUrl(url, rate);
    __pqCloseSoundVideo();

    const afterVideo = await __pqSoundModalChoice(key, {
      replay: 'Re-play letter',
      secondary: 'Return to video',
      primary: 'Continue to next letter'
    }, signal, rate);

    if (afterVideo === 'aborted' || (signal && signal.aborted)) return false;

    if (afterVideo === 'secondary') {
      continue; // replay video
    }

    return true; // next letter
  }
}

async function playWatchVideoForKey(key, rate, stepId, signal) {
  try { __pqSetPlayingTile(key); } catch (_e) {}

  const sid = String(stepId || '').toLowerCase();
  const map = (sid === 'animate') ? ANIMATE_VIDEO_BY_KEY : WATCH_VIDEO_BY_KEY;
  const url = map[key];

  if (!url) {
    throw new Error('Missing ' + (sid === 'animate' ? 'animate' : sid === 'sound' ? 'sound' : 'watch') + ' video URL for key: ' + key);
  }

  if (sid === 'sound') {
    return __pqPlaySoundGuidedFlow(key, url, rate, signal);
  }

  await __pqPlayVideoUrl(url, rate);
  return true;
}

  async function playAllWatch(stepIdOverride) {
    const controller = __pqStartPlayAllController();
    const signal = controller ? controller.signal : null;
    const rate = parseFloat(speedSel.value || DEFAULTS.speed);
    const stepId = String(stepIdOverride || 'watch').toLowerCase();
    const keys = stepId === 'animate'
  ? __pqGetPassSequenceKeys('animate', PLAY_SEQUENCE_KEYS)
  : stepId === 'sound'
    ? __pqGetPassSequenceKeys('sound', PLAY_SEQUENCE_KEYS)
    : __pqGetWatchSequenceKeys();

    if (!keys.length) return;

    playingAll = true;
    __watchPlaying = true;
    __watchPaused = false;
    paused = false;
    __pqSetPlaylistDimming(true);

    if (btnPlayAll) {
      btnPlayAll.disabled = true;
      btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
    }

    if (btnPause) {
      btnPause.disabled = false;
      btnPause.textContent = __PQ_TEXT_CACHE.pause;
    }

    try {
      await __pqStepDelay(stepId, 'beforeStartMs', signal);

      for (const key of keys) {
        __pqAssertNotAborted(signal);

        const idx = LETTERS.findIndex((item) => item.key === key);
        selectedIdx = idx;
        selectedKey = key;
        markActive();

        try {
          __pqSyncWriteUI();
        } catch (_e) {}

        alScrollToKey(key);
        await pauseGate(signal);
        __pqAssertNotAborted(signal);
        await playWatchVideoForKey(key, rate, stepId, signal);
        __pqAssertNotAborted(signal);

        try {
          handleLetterPlayedForCurrentStep(key);
        } catch (_e) {}

        await __pqStepDelay(stepId, 'betweenLettersMs', signal);
      }

      await __pqStepDelay(stepId, 'afterCompleteMs', signal);
      __pqCloseActiveMediaWindows();

      const current = getCurrentStep();
      if (current && current.step && (current.step.id === 'watch' || current.step.id === 'sound' || current.step.id === 'animate')) {
        await markPlaylistStepCompleted(current.step.id);
      }
    } catch (_e) {
      if (!_e || _e.name !== 'AbortError') {
        throw _e;
      }
    } finally {
      const stillOwner = !!(
        __playAllController &&
        controller &&
        __playAllController === controller
      );

      if (stillOwner) {
        __playAllController = null;
      }

      __pqSetPlaylistDimming(false);
      playingAll = false;
      __watchPlaying = false;
      __watchPaused = false;
      paused = false;

      try {
        if (player) {
          player.pause();
          player.removeAttribute('src');
          player.load();
        }
      } catch (_e) {}

      if (videoModal) {
        videoModal.style.display = 'none';
      }

      if (btnPlayAll) {
        btnPlayAll.disabled = false;
        btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
      }

      if (btnPause) {
        btnPause.disabled = false;
        btnPause.textContent = __PQ_TEXT_CACHE.pause;
      }
    }
  }

  function __pqGetVisibleSequenceKeys(stepIdOverride) {
    let fallback = [];

    try {
      const visible = new Set(
        [...(grid ? grid.querySelectorAll('.tile[data-key]') : [])]
          .map((el) => String(el.dataset.key || ''))
          .filter(Boolean)
      );

      const ordered = (PLAY_SEQUENCE_KEYS || []).filter((key) => visible.has(key));
      if (ordered.length) {
        fallback = ordered;
      }
    } catch (_e) {}

    if (!fallback.length) {
      try {
        fallback = [...(grid ? grid.querySelectorAll('.tile[data-key]') : [])]
          .map((el) => String(el.dataset.key || ''))
          .filter(Boolean);
      } catch (_e) {
        fallback = [];
      }
    }

    try {
      let sid = String(stepIdOverride || '').toLowerCase();

      if (!sid) {
        const current = getCurrentStep();
        sid = String((current && current.step && current.step.id) || '').toLowerCase();
      }

      return __pqGetPassSequenceKeys(sid, fallback);
    } catch (_e) {
      return fallback;
    }
  }

  
  function __pqGetStepRepeatPerLetter(stepId, fallback) {
    try {
      const sid = String(stepId || '').toLowerCase();
      const base = Math.max(1, Number(fallback || DEFAULTS.repeat || 1) || 1);
      const progress = (managedProgress && sid && managedProgress[sid]) || {};

      const raw =
        progress.repeatPerLetter ??
        progress.repeats_per_letter ??
        progress.repeat_per_letter ??
        progress.default_repeats_per_letter ??
        progress.defaultRepeatsPerLetter ??
        base;

      const n = Number(raw);
      return Number.isFinite(n) && n >= 1 ? Math.floor(n) : base;
    } catch (_e) {
      return Math.max(1, Number(fallback || DEFAULTS.repeat || 1) || 1);
    }
  }


function __pqGetManagedRepeatPerLetter(stepId, fallback) {
  try {
    const sid = String(stepId || '').toLowerCase();
    const base = Math.max(1, Number(fallback || 1) || 1);
    const progress = (managedProgress && sid && managedProgress[sid]) || null;

    if (!progress) return base;

    const raw =
      progress.repeatPerLetter ??
      progress.repeats_per_letter ??
      progress.repeat_per_letter ??
      progress.default_repeats_per_letter ??
      progress.defaultRepeatsPerLetter ??
      progress.repeatsPerLetter ??
      base;

    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : base;
  } catch (_e) {
    return Math.max(1, Number(fallback || 1) || 1);
  }
}


try {
  window.__pqDebugRepeat = function (stepId) {
    const sid = String(stepId || '').toLowerCase();
    const fallback = parseInt((repeatSel && repeatSel.value) || DEFAULTS.repeat || '1', 10) || 1;
    return {
      stepId: sid,
      dropdown: repeatSel ? repeatSel.value : null,
      progress: managedProgress && sid ? managedProgress[sid] : null,
      resolved: __pqGetManagedRepeatPerLetter(sid, fallback)
    };
  };
} catch (_e) {}


function __pqListenPlusCfg(key, fallback) {
  try {
    const lp = __cfg('listenPlus', {}) || {};
    if (!key) return lp;
    return lp[key] == null ? fallback : lp[key];
  } catch (_e) {
    return fallback;
  }
}

function __pqListenPlusUrl(base, name, ext) {
  try {
    name = String(name || '').trim();
    if (!name) return __pqAppendAssetVersion('');
    if (/^https?:\/\//i.test(name)) return __pqAppendAssetVersion(name);
    base = String(base || '').replace(/\/?$/, '/');
    if (/\.[a-z0-9]{2,5}$/i.test(name)) return __pqAppendAssetVersion(base + name);
    return __pqAppendAssetVersion(base + name + String(ext || ''));
  } catch (_e) {
    return __pqAppendAssetVersion('');
  }
}

function __pqEnsureListenPlusOverlay() {
  let el = document.getElementById('pqListenPlusAnimalOverlay');
  if (el) return el;
  const style = document.createElement('style');
  style.textContent = '#pqListenPlusAnimalOverlay{position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;pointer-events:none;background:rgba(8,15,28,.16);backdrop-filter:blur(2px)}#pqListenPlusAnimalOverlay .card{width:min(420px,88vw);border-radius:30px;background:linear-gradient(180deg,#fff,#fff7df);border:4px solid rgba(255,255,255,.92);box-shadow:0 24px 70px rgba(18,29,52,.28);padding:18px;text-align:center;transform:scale(.94);opacity:0;transition:opacity .18s ease,transform .18s ease}#pqListenPlusAnimalOverlay.show .card{opacity:1;transform:scale(1)}#pqListenPlusAnimalOverlay img{width:min(240px,58vw);height:min(220px,48vh);object-fit:contain;display:block;margin:0 auto 10px}.pq-lp-letter{display:inline-flex;align-items:center;justify-content:center;min-width:54px;height:54px;border-radius:18px;background:#e9f5ff;color:#1168a8;font-weight:1000;font-size:1.8rem;margin-right:10px}.pq-lp-animal{font-weight:1000;font-size:1.65rem;color:#17233b}.pq-lp-title{font-weight:900;color:#24324a;margin-bottom:8px}.pq-lp-sub{margin-top:6px;font-weight:800;color:#5b6780;font-size:.95rem}';
  document.head.appendChild(style);
  el = document.createElement('div');
  el.id = 'pqListenPlusAnimalOverlay';
  el.innerHTML = '<div class="card"><div class="pq-lp-title"></div><img alt=""><div><span class="pq-lp-letter"></span><span class="pq-lp-animal"></span></div><div class="pq-lp-sub"></div></div>';
  document.body.appendChild(el);
  return el;
}

function __pqHideListenPlusAnimal() {
  try {
    const el = document.getElementById('pqListenPlusAnimalOverlay');
    if (!el) return;
    el.classList.remove('show');
    setTimeout(function () { if (!el.classList.contains('show')) el.style.display = 'none'; }, 220);
  } catch (_e) {}
}

function __pqPlayListenPlusAudio(url, rate, timeoutMs, signal) {
  return new Promise(function (resolve) {
    try {
      if (!url || (signal && signal.aborted)) return resolve(false);
      const a = new Audio(url);
      let done = false;
      const finish = function (ok) {
        if (done) return;
        done = true;
        try { clearTimeout(timer); } catch (_e) {}
        try { a.pause(); a.removeAttribute('src'); a.load(); } catch (_e) {}
        resolve(!!ok);
      };
      const timer = setTimeout(function () { finish(false); }, Math.max(700, Number(timeoutMs || 3000)));
      if (signal) signal.addEventListener('abort', function () { finish(false); }, { once: true });
      a.playbackRate = Number(rate || 1) || 1;
      a.onended = function () { finish(true); };
      a.onerror = function () { finish(false); };
      const p = a.play();
      if (p && p.catch) p.catch(function () { finish(false); });
    } catch (_e) {
      resolve(false);
    }
  });
}

async function __pqMaybeRunListenPlusAnimal(stepId, key, rate, signal) {
  try {
    if (String(stepId || '').toLowerCase() !== 'listenplus') return false;
    if (__pqListenPlusCfg('enabled', true) === false) return false;
    const map = __pqListenPlusCfg('map', {}) || {};
    const item = map[String(key || '')];
    if (!item) return false;
    const imgUrl = __pqListenPlusUrl(__pqListenPlusCfg('imageBase', ''), item.image || item.img || '', __pqListenPlusCfg('imageExt', '.png'));
    const audioUrl = __pqListenPlusUrl(__pqListenPlusCfg('audioBase', ''), item.audio || '', __pqListenPlusCfg('audioExt', '.mp3'));
    const delayMs = Number(__cfg('playback.steps.listenplus.animalDelayMs', 220) || 0);
    const holdMs = Number(__cfg('playback.steps.listenplus.animalHoldMs', 650) || 0);
    const timeoutMs = Number(__cfg('playback.steps.listenplus.animalAudioTimeoutMs', 3000) || 3000);
    if (delayMs > 0) await __pqDelayWithAbort(delayMs, signal);
    __pqAssertNotAborted(signal);
    const el = __pqEnsureListenPlusOverlay();
    el.querySelector('.pq-lp-title').textContent = __pqListenPlusCfg('title', 'Listen+');
    el.querySelector('.pq-lp-letter').textContent = item.letter || '';
    el.querySelector('.pq-lp-animal').textContent = item.animal || '';
    el.querySelector('.pq-lp-sub').textContent = __pqListenPlusCfg('subtitle', '');
    const img = el.querySelector('img');
    img.alt = item.animal || 'Animal';
    img.src = imgUrl;
    el.style.display = 'flex';
    setTimeout(function () { el.classList.add('show'); }, 20);
    
const __wordsRepeats = Number(__cfg('playback.steps.words.anchorRepeats', 1) || 1);

for (let i = 0; i < __wordsRepeats; i++) {
  await __pqPlayListenPlusAudio(
    audioUrl,
    __cfg('playback.steps.words.anchorPlaybackRate', rate),
    timeoutMs,
    signal
  );
}

    __pqAssertNotAborted(signal);
    if (holdMs > 0) await __pqDelayWithAbort(holdMs, signal);
    __pqHideListenPlusAnimal();
    return true;
  } catch (e) {
    __pqHideListenPlusAnimal();
    if (e && e.name === 'AbortError') throw e;
    return false;
  }
}



function __pqGetWordsCfg(path, fallback) {
  try {
    const root = __cfg('words', {}) || {};
    if (!path) return root;
    const parts = String(path).split('.');
    let cur = root;
    for (const part of parts) {
      if (!cur || typeof cur !== 'object' || !(part in cur)) return fallback;
      cur = cur[part];
    }
    return cur == null ? fallback : cur;
  } catch (_e) {
    return fallback;
  }
}

function __pqWordsAssetUrl(base, value, ext) {
  try {
    const raw = String(value || '').trim();
    if (!raw) return __pqAppendAssetVersion('');
    if (/^https?:\/\//i.test(raw)) return __pqAppendAssetVersion(raw);
    const cleanBase = String(base || '').trim();
    if (!cleanBase) return __pqAppendAssetVersion('');
    const hasExt = /\.[a-z0-9]{2,5}(\?|#|$)/i.test(raw);
    return __pqAppendAssetVersion(cleanBase.replace(/\/?$/, '/') + raw + (hasExt ? '' : String(ext || '')));
  } catch (_e) { return __pqAppendAssetVersion(''); }
}

function __pqEnsureWordsOverlay() {
  try {
    let el = document.getElementById('pqWordsOverlay');
    if (el) return el;

    if (!document.getElementById('pqWordsOverlayCss')) {
      const style = document.createElement('style');
      style.id = 'pqWordsOverlayCss';
      style.textContent =
        '#pqWordsOverlay{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;pointer-events:none;background:rgba(8,15,28,.16);backdrop-filter:blur(2px)}' +
        '#pqWordsOverlay .pq-words-card{width:min(430px,88vw);border-radius:30px;background:linear-gradient(180deg,#fff 0%,#fff7df 100%);border:4px solid rgba(255,255,255,.92);box-shadow:0 24px 70px rgba(18,29,52,.28);padding:18px;text-align:center;transform:translateY(12px) scale(.94);opacity:0;transition:opacity .18s ease,transform .18s ease;direction:rtl}' +
        '#pqWordsOverlay.pq-show .pq-words-card{opacity:1;transform:translateY(0) scale(1)}' +
        '#pqWordsOverlay .pq-words-title{font-weight:900;font-size:1.05rem;color:#24324a;margin-bottom:8px}' +
        '#pqWordsOverlay .pq-words-img{width:min(240px,58vw);height:min(220px,48vh);object-fit:contain;display:block;margin:0 auto 10px}' +
        '#pqWordsOverlay .pq-words-letter{display:inline-flex;align-items:center;justify-content:center;min-width:58px;height:58px;border-radius:18px;background:#fff0d6;color:#9a4f00;font-weight:1000;font-size:2.1rem;margin-left:10px;vertical-align:middle;font-family:"Noto Sans Arabic","Amiri",system-ui,sans-serif}' +
        '#pqWordsOverlay .pq-words-word{font-weight:1000;font-size:2.05rem;color:#17233b;vertical-align:middle;font-family:"Noto Sans Arabic","Amiri",system-ui,sans-serif}' +
        '#pqWordsOverlay .pq-words-sub{margin-top:6px;font-weight:800;color:#5b6780;font-size:.95rem;direction:ltr}';
      document.head.appendChild(style);
    }

    el = document.createElement('div');
    el.id = 'pqWordsOverlay';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="pq-words-card"><div class="pq-words-title"></div><img class="pq-words-img" alt=""><div><span class="pq-words-letter"></span><span class="pq-words-word"></span></div><div class="pq-words-sub"></div></div>';
    document.body.appendChild(el);
    return el;
  } catch (_e) { return null; }
}

function __pqShowWordsItem(meta) {
  try {
    const el = __pqEnsureWordsOverlay();
    if (!el || !meta) return null;
    const title = el.querySelector('.pq-words-title');
    const img = el.querySelector('.pq-words-img');
    const letter = el.querySelector('.pq-words-letter');
    const word = el.querySelector('.pq-words-word');
    const sub = el.querySelector('.pq-words-sub');

    if (title) title.textContent = __pqGetWordsCfg('title', 'Words');
    if (letter) letter.textContent = String(meta.letter || '').trim();
    if (word) word.textContent = String(meta.word || '').trim();
    if (sub) sub.textContent = __pqGetWordsCfg('subtitle', '');
    if (img) {
      img.alt = String(meta.word || 'Word');
      if (meta.imageUrl) { img.style.display = 'block'; img.src = meta.imageUrl; }
      else { img.style.display = 'none'; img.removeAttribute('src'); }
    }

    el.style.display = 'flex';
    window.setTimeout(function () { try { el.classList.add('pq-show'); } catch (_e) {} }, 20);
    return el;
  } catch (_e) { return null; }
}

function __pqHideWordsItem() {
  try {
    const el = document.getElementById('pqWordsOverlay');
    if (!el) return;
    el.classList.remove('pq-show');
    window.setTimeout(function () {
      try { if (!el.classList.contains('pq-show')) el.style.display = 'none'; } catch (_e) {}
    }, 220);
  } catch (_e) {}
}

async function __pqMaybeRunWordsItem(stepId, key, rate, signal) {
  try {
    if (String(stepId || '').toLowerCase() !== 'words') return false;
    if (__pqGetWordsCfg('enabled', true) === false) return false;

    const item = (__pqGetWordsCfg('map', {}) || {})[String(key || '')];
    if (!item) return false;

    const imageUrl = __pqWordsAssetUrl(__pqGetWordsCfg('imageBase', ''), item.image || item.img || '', __pqGetWordsCfg('imageExt', '.png'));
    const audioUrl = __pqWordsAssetUrl(__pqGetWordsCfg('audioBase', ''), item.audio || '', __pqGetWordsCfg('audioExt', '.mp3'));

    const delayMs = Number(__cfg('playback.steps.words.wordDelayMs', 220) || 0);
    const holdMs = Number(__cfg('playback.steps.words.wordHoldMs', 650) || 0);
    const timeoutMs = Number(__cfg('playback.steps.words.wordAudioTimeoutMs', 3000) || 3000);

    if (delayMs > 0) await __pqDelayWithAbort(delayMs, signal);
    __pqAssertNotAborted(signal);

    __pqShowWordsItem({ letter: item.letter || '', word: item.word || '', imageUrl });
    
const __lpRepeats = Number(__cfg('playback.steps.listenplus.anchorRepeats', 1) || 1);

for (let i = 0; i < __lpRepeats; i++) {
  await __pqPlayListenPlusAudio(
    audioUrl,
    __cfg('playback.steps.listenplus.anchorPlaybackRate', rate),
    timeoutMs,
    signal
  );
}


    __pqAssertNotAborted(signal);
    if (holdMs > 0) await __pqDelayWithAbort(holdMs, signal);

    __pqHideWordsItem();
    return true;
  } catch (_e) {
    try { __pqHideWordsItem(); } catch (_ignore) {}
    if (_e && _e.name === 'AbortError') throw _e;
    return false;
  }
}


/* ============================================================
   REPEAT STEP — LIGHT STUDENT RECORDING
   First letter requires Record click; next letters auto-record.
   ============================================================ */

const __pqRepeatRecordState = {
  stream: null,
  autoMode: false,
  attempts: Object.create(null),
  currentBlobUrl: '',
  isRecording: false
};

function __pqRepeatRecordCfg(key, fallback) {
  try {
    const root = __cfg('repeatRecording', {}) || {};
    if (!key) return root;
    return root[key] == null ? fallback : root[key];
  } catch (_e) {
    return fallback;
  }
}

function __pqEnsureRepeatRecordUi() {
  let el = document.getElementById('pqRepeatRecordOverlay');
  if (el) return el;

  if (!document.getElementById('pqRepeatRecordOverlayCss')) {
    const style = document.createElement('style');
    style.id = 'pqRepeatRecordOverlayCss';
    style.textContent = [
      '#pqRepeatRecordOverlay{position:fixed;inset:0;z-index:2147482900;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(12,18,31,.48);backdrop-filter:blur(4px)}',
      '#pqRepeatRecordOverlay .pq-repeat-card{width:min(440px,92vw);border-radius:28px;background:#fffdf7;box-shadow:0 24px 70px rgba(18,29,52,.30);padding:22px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif}',
      '#pqRepeatRecordOverlay .pq-repeat-title{font-weight:1000;font-size:1.25rem;color:#17233b;margin-bottom:8px}',
      '#pqRepeatRecordOverlay .pq-repeat-letter{font-family:"Noto Sans Arabic","Amiri",serif;font-weight:1000;font-size:4rem;line-height:1;color:#173f2b;margin:8px 0}',
      '#pqRepeatRecordOverlay .pq-repeat-msg{font-weight:800;color:#31425d;margin:8px 0 16px}',
      '#pqRepeatRecordOverlay .pq-repeat-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}',
      '#pqRepeatRecordOverlay button{border:0;border-radius:20px;padding:14px 22px;font-weight:1000;font-size:1rem;cursor:pointer}',
      '#pqRepeatRecordOverlay .pq-repeat-record{background:#eaf7ef;color:#0b5132;box-shadow:0 10px 22px rgba(57,100,184,.16)}',
      '#pqRepeatRecordOverlay button:disabled{opacity:.65;cursor:wait}'
    ].join('\n');
    document.head.appendChild(style);
  }

  el = document.createElement('div');
  el.id = 'pqRepeatRecordOverlay';
  el.innerHTML = [
    '<div class="pq-repeat-card" role="dialog" aria-modal="true">',
      '<div class="pq-repeat-title">Your turn — repeat the letter</div>',
      '<div class="pq-repeat-letter"></div>',
      '<div class="pq-repeat-msg">Tap Record, then say the letter.</div>',
      '<div class="pq-repeat-actions">',
        '<button type="button" class="pq-repeat-record">🎤 Record</button>',
      '</div>',
    '</div>'
  ].join('');

  document.body.appendChild(el);
  return el;
}

function __pqShowRepeatRecordUi(key, message) {
  const el = __pqEnsureRepeatRecordUi();
  try {
    const letter = (LETTERS || []).find(function (item) {
      return item && String(item.key) === String(key);
    });

    const txt =
      (letter && (letter.text || letter.ar || letter.letter)) ||
      String(key || '');

    el.querySelector('.pq-repeat-letter').textContent = txt;
    el.querySelector('.pq-repeat-msg').textContent = message || 'Tap Record, then say the letter.';
    el.style.display = 'flex';
  } catch (_e) {}

  return el;
}

function __pqHideRepeatRecordUi() {
  try {
    const el = document.getElementById('pqRepeatRecordOverlay');
    if (el) el.style.display = 'none';
  } catch (_e) {}
}

async function __pqEnsureRepeatMicStream() {
  if (__pqRepeatRecordState.stream) return __pqRepeatRecordState.stream;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Microphone recording is not supported in this browser.');
  }

  __pqRepeatRecordState.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return __pqRepeatRecordState.stream;
}

function __pqRecordRepeatOnce(stream, ms, signal) {
  return new Promise(function (resolve) {
    try {
      if (!stream || (signal && signal.aborted)) {
        resolve(null);
        return;
      }

      const chunks = [];
      const rec = new MediaRecorder(stream);
      let stopped = false;

      function stopSafe() {
        if (stopped) return;
        stopped = true;
        try {
          if (rec.state !== 'inactive') rec.stop();
        } catch (_e) {
          resolve(null);
        }
      }

      rec.ondataavailable = function (ev) {
        try {
          if (ev && ev.data && ev.data.size > 0) chunks.push(ev.data);
        } catch (_e) {}
      };

      rec.onstop = function () {
        try {
          const blob = chunks.length ? new Blob(chunks, { type: rec.mimeType || 'audio/webm' }) : null;
          resolve(blob);
        } catch (_e) {
          resolve(null);
        }
      };

      rec.onerror = function () {
        resolve(null);
      };

      if (signal) {
        signal.addEventListener('abort', stopSafe, { once: true });
      }

      rec.start();
      window.setTimeout(stopSafe, Math.max(600, Number(ms || 1400) || 1400));
    } catch (_e) {
      resolve(null);
    }
  });
}

async function __pqPlayRepeatStudentBlob(blob) {
  try {
    if (!blob) return false;

    if (__pqRepeatRecordState.currentBlobUrl) {
      try { URL.revokeObjectURL(__pqRepeatRecordState.currentBlobUrl); } catch (_e) {}
      __pqRepeatRecordState.currentBlobUrl = '';
    }

    const url = URL.createObjectURL(blob);
    __pqRepeatRecordState.currentBlobUrl = url;

    const a = new Audio(url);

    await new Promise(function (resolve) {
      let done = false;

      function finish() {
        if (done) return;
        done = true;
        try { a.pause(); } catch (_e) {}
        resolve();
      }

      a.onended = finish;
      a.onerror = finish;

      const p = a.play();
      if (p && p.catch) p.catch(finish);
    });

    return true;
  } catch (_e) {
    return false;
  }
}

async function __pqRepeatRecordAttempt(key, rate, signal) {
  try {
    if (signal && signal.aborted) return false;

    if (__pqRepeatRecordCfg('enabled', true) === false) return true;

    const ms = Number(__pqRepeatRecordCfg('recordMs', 1400) || 1400);
    const replayStudent = __pqRepeatRecordCfg('replayStudent', true) !== false;

    const el = __pqShowRepeatRecordUi(
      key,
      __pqRepeatRecordState.autoMode
        ? 'Recording starts now. Say the letter.'
        : 'Tap Record, then say the letter.'
    );

    const recordBtn = el.querySelector('.pq-repeat-record');

    async function runRecording() {
      try {
        __pqRepeatRecordState.isRecording = true;

        if (recordBtn) {
          recordBtn.disabled = true;
          recordBtn.textContent = '🔴 Recording...';
        }

        const stream = await __pqEnsureRepeatMicStream();
        __pqRepeatRecordState.autoMode = true;

        const blob = await __pqRecordRepeatOnce(stream, ms, signal);

        __pqRepeatRecordState.attempts[String(key)] = {
          at: Date.now(),
          ok: !!blob,
          size: blob ? blob.size : 0
        };

        if (recordBtn) {
          recordBtn.textContent = blob ? '✅ Recorded' : '⚠️ Try again';
        }

        if (blob && replayStudent) {
          try { el.querySelector('.pq-repeat-msg').textContent = 'Good! Listen to your voice.'; } catch (_e) {}
          await __pqPlayRepeatStudentBlob(blob);
        }

        return !!blob;
      } catch (_e) {
        try { el.querySelector('.pq-repeat-msg').textContent = 'Microphone was not ready. Tap Record again.'; } catch (_ignore) {}
        if (recordBtn) {
          recordBtn.disabled = false;
          recordBtn.textContent = '🎤 Record';
        }
        return false;
      } finally {
        __pqRepeatRecordState.isRecording = false;
      }
    }

    if (__pqRepeatRecordState.autoMode) {
      await __pqDelayWithAbort(Number(__pqRepeatRecordCfg('autoStartDelayMs', 450) || 450), signal);
      const ok = await runRecording();
      __pqHideRepeatRecordUi();
      return ok;
    }

    return await new Promise(function (resolve) {
      let resolved = false;

      function finish(ok) {
        if (resolved) return;
        resolved = true;
        __pqHideRepeatRecordUi();
        resolve(!!ok);
      }

      if (signal) {
        if (signal.aborted) {
          finish(false);
          return;
        }

        signal.addEventListener('abort', function () {
          finish(false);
        }, { once: true });
      }

      if (!recordBtn) {
        finish(false);
        return;
      }

      recordBtn.disabled = false;
      recordBtn.textContent = '🎤 Record';

      recordBtn.addEventListener('click', async function () {
        const ok = await runRecording();
        finish(ok);
      }, { once: true });
    });
  } catch (_e) {
    try { __pqHideRepeatRecordUi(); } catch (_ignore) {}
    return false;
  }
}

async function __pqPlayAllPlaylistLocal(stepId) {
    const controller = __pqStartPlayAllController();
    const signal = controller ? controller.signal : null;

    const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1');
    const finalStepId = String(stepId || '').toLowerCase();
    const repeatFallback = parseInt((repeatSel && repeatSel.value) || DEFAULTS.repeat || '1', 10) || 1;
    const repeatCount = __pqGetStepRepeatPerLetter(finalStepId, repeatFallback);
    const keys = __pqGetVisibleSequenceKeys(finalStepId);

    if (!keys.length) return;

    playingAll = true;
    paused = false;
    __pqSetPlaylistDimming(false);

    try {
      if (btnPause) {
        btnPause.disabled = false;
        btnPause.textContent = __PQ_TEXT_CACHE.pause;
      }
    } catch (_e) {}

    try {
      if (btnPlayAll) {
        btnPlayAll.disabled = true;
        btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
      }
    } catch (_e) {}

    try {
      await __pqStepDelay(finalStepId, 'beforeStartMs', signal);

      for (const key of keys) {
        __pqAssertNotAborted(signal);

        try {
          const tile = grid
            ? grid.querySelector('.tile[data-key="' + String(key).replace(/"/g, '\\\"') + '"]')
            : null;

          const gidx = tile ? Number(tile.dataset.gidx || -1) : -1;
          selectedIdx = Number.isFinite(gidx) ? gidx : -1;
          selectedKey = key;

          markActive();

          try {
            if (typeof __pqSetPlayingTile === 'function') {
              __pqSetPlayingTile(key);
            }
          } catch (_e) {}

          try {
            __pqSyncWriteUI();
          } catch (_e) {}

          alScrollToKey(key);
        } catch (_e) {}

        await pauseGate(signal);
        __pqAssertNotAborted(signal);

        await playLetter(key, repeatCount, rate);

        if (finalStepId === 'repeat') {
          await __pqRepeatRecordAttempt(key, rate, signal);
        }

        __pqAssertNotAborted(signal);

        await __pqMaybeRunListenPlusAnimal(finalStepId, key, rate, signal);

        __pqAssertNotAborted(signal);

        await __pqMaybeRunWordsItem(finalStepId, key, rate, signal);

        __pqAssertNotAborted(signal);

        try {
          handleLetterPlayedForCurrentStep(key);
        } catch (_e) {}

        await __pqStepDelay(finalStepId, 'betweenLettersMs', signal);
      }

      await __pqStepDelay(finalStepId, 'afterCompleteMs', signal);
      __pqCloseActiveMediaWindows();

      const current = getCurrentStep();
      const resolvedStepId = String(
        (current && current.step && current.step.id) || finalStepId || ''
      );

      if (resolvedStepId) {
        await markPlaylistStepCompleted(resolvedStepId);
      }
    } catch (_e) {
      if (!_e || _e.name !== 'AbortError') {
        throw _e;
      }
    } finally {
      const stillOwner = !!(
        __playAllController &&
        controller &&
        __playAllController === controller
      );

      if (stillOwner) {
        __playAllController = null;
      }

      __pqSetPlaylistDimming(false);
      playingAll = false;
      paused = false;

      try {
        if (typeof __pqClearPlayingTile === 'function') {
          __pqClearPlayingTile();
        }
      } catch (_e) {}

      try {
        if (btnPlayAll) {
          btnPlayAll.disabled = false;
          btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
        }
      } catch (_e) {}

      try {
        if (btnPause) {
          btnPause.disabled = false;
          btnPause.textContent = __PQ_TEXT_CACHE.pause;
        }
      } catch (_e) {}
    }
  }

async function __pqRunMatchStep() {
  if (!window.PQSharedMatchEngine) return;

  const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1') || 1;

  return PQSharedMatchEngine.mount({
    cfg: UNIT_CFG,
    stepId: 'match',
    gridId: 'grid',

    getSequenceKeys: function () {
      return __pqGetPassSequenceKeys('match', PLAY_SEQUENCE_KEYS);
    },

    playAudioForKey: function (key) {
          // PATCH_PLAYING_TILE_IN_MATCH_AUDIO
          try { __pqSetPlayingTile(key); } catch (_e) {}
      return playLetterOnce(key, rate);
    },

    onComplete: function () {
      completeCurrentStep();
    }
  });
}


  /* ===== PQ PLAYING TILE EFFECT HELPERS START ===== */
  
  /* ===== PQ PLAYING TILE EFFECT CSS START ===== */
  function __pqInjectPlayingTileEffectCss() {
    try {
      if (document.getElementById('pqPlayingTileEffectCss')) return;

      const style = document.createElement('style');
      style.id = 'pqPlayingTileEffectCss';

      style.textContent = [
        '.tile.pq-playing{',
        '  animation:pqTilePlayBounce 850ms ease-in-out both !important;',
        '  box-shadow:0 0 0 5px rgba(255,255,255,.95),0 0 0 12px rgba(34,193,232,.58),0 18px 34px rgba(13,35,69,.30) !important;',
        '  transform:translateY(-8px) scale(1.08) !important;',
        '  z-index:30 !important;',
        '}',
        '@keyframes pqTilePlayBounce{',
        '  0%{transform:translateY(0) scale(1);}',
        '  35%{transform:translateY(-12px) scale(1.10);}',
        '  65%{transform:translateY(-7px) scale(1.06);}',
        '  100%{transform:translateY(-8px) scale(1.08);}',
        '}'
      ].join('\n');

      document.head.appendChild(style);
    } catch (_e) {}
  }
  /* ===== PQ PLAYING TILE EFFECT CSS END ===== */

function __pqClearPlayingTile() {
    try {
      document.querySelectorAll('.tile.pq-playing').forEach(function (tile) {
        tile.classList.remove('pq-playing');
      });
    } catch (_e) {}
  }

  function __pqSetPlayingTile(key) {
    __pqInjectPlayingTileEffectCss();
    try {
      __pqClearPlayingTile();

      const safeKey = String(key || '');
      if (!safeKey) return;

      const tile = document.querySelector('.tile[data-key="' + safeKey.replace(/"/g, '\\"') + '"]');
      if (!tile) return;

      tile.classList.add('pq-playing');

      const cfgEffect =
        (typeof UNIT_CFG !== 'undefined' && UNIT_CFG && UNIT_CFG.activeTileEffect) ||
        (typeof cfg !== 'undefined' && cfg && cfg.activeTileEffect) ||
        {};

      const duration = Number(cfgEffect.durationMs || 900);

      window.setTimeout(function () {
        try {
          tile.classList.remove('pq-playing');
        } catch (_e) {}
      }, Math.max(250, duration));
    } catch (_e) {}
  }
  /* ===== PQ PLAYING TILE EFFECT HELPERS END ===== */

async function playAll() {
  try {
    const current = getCurrentStep();
    const stepId = String((current && current.step && current.step.id) || '').toLowerCase();

    if (__pqLastPlayAllStepId !== stepId) {
      __pqLastPlayAllStepId = stepId;
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

    __pqCancelPlayAll();

    if (current && __pqIsWatchStep(current.step)) {
      return playAllWatch(stepId);
    }

    if (stepId === 'match') {
      return __pqRunMatchStep();
    }

    if (
  current &&
  current.step &&
  (
    current.step.type === 'playlist' ||
    stepId === 'listenplus' ||
    stepId === 'words'
  )
) {
  return __pqPlayAllPlaylistLocal(stepId);
}
	
  } catch (_e) {}

  return undefined;
}

  // ============================================================
  // PART 2 END
  // ============================================================


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

    return {
      step,
      progress: (managedProgress && step) ? managedProgress[step.id] : null
    };
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

function __pqSpeakApplyDoneTilesFinal() {
  try {
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

function __pqSpeakFinalizeDoneFinal() {
  try {
    if (__pqSharedSpeakRuntime) {
      return __pqSharedSpeakRuntime.markSelectedDone();
    }
    const key = String(__pqSpeakUiState.selectedKey || '').trim();
    if (!key) return false;

    if (!__pqSpeakUiState.completedKeys || typeof __pqSpeakUiState.completedKeys !== 'object') {
      __pqSpeakUiState.completedKeys = {};
    }

    __pqSpeakUiState.completedKeys[key] = true;
    __pqSpeakSaveDoneMapFinal();
    __pqSpeakGreyTileFinal(key);
    __pqSpeakRefreshProgressFinal();
    try { __pqSpeakSyncManagedProgressFromDoneKeys(true); } catch (_e) {}

    setTimeout(function(){ try { __pqSpeakGreyTileFinal(key); __pqSpeakRefreshProgressFinal(); } catch (_e) {} }, 80);
    setTimeout(function(){ try { __pqSpeakGreyTileFinal(key); __pqSpeakRefreshProgressFinal(); } catch (_e) {} }, 300);
    setTimeout(function(){ try { __pqSpeakGreyTileFinal(key); __pqSpeakRefreshProgressFinal(); } catch (_e) {} }, 800);

    return true;
  } catch (_e) {
    return false;
  }
}

function __pqSpeakInstallDoneBinderFinal(compareBtn) {
  try {
    if (!compareBtn || compareBtn.__pqSpeakDoneBinderFinal__) return;
    compareBtn.__pqSpeakDoneBinderFinal__ = true;

    compareBtn.addEventListener('click', function () {
      setTimeout(function () {
        try { __pqSpeakFinalizeDoneFinal(); } catch (_e) {}
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
    if (__pqSharedSpeakRuntime) {
      __pqSharedSpeakRuntime.setSelectedKey(key);
      return;
    }
    __pqSpeakUiState.selectedKey = String(key || '').trim();
  } catch (_e) {}
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
#pqSpeakChildModal .pq-speak-modal-letter{position:relative;font-family:"Noto Naskh Arabic","Noto Sans Arabic","Amiri",serif;font-size:5.7rem;line-height:1;font-weight:1000;color:#0f5137;margin:10px auto 14px;width:min(220px,70vw);padding:18px 10px 12px;border-radius:30px;background:#f7fff9;box-shadow:inset 0 0 0 3px #d8f6e0,0 10px 26px rgba(36,122,78,.12)}
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
      '<div class="pq-speak-modal-letter">🎤</div>' +
      '<div class="pq-speak-modal-hint">Use the big buttons below. Enable the mic, record your voice, then tap Done.</div>' +
      '<div class="pq-speak-modal-actions" id="pqSpeakModalActions"></div>' +
    '</div>';

  document.body.appendChild(modal);

  modal.querySelector('.pq-speak-modal-close').addEventListener('click', function () {
    modal.classList.remove('is-open');
  });

  return modal;
}

function __pqSetSpeakChildModalLetter(text) {
  try {
    const modal = document.getElementById('pqSpeakChildModal');
    if (!modal) return;

    const letterEl = modal.querySelector('.pq-speak-modal-letter');
    if (letterEl) letterEl.textContent = text || '🎤';

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
    else modal.classList.remove('is-open');
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
  attempts:Object.create(null), doneKeys:Object.create(null), stopTimer:null, playing:false
};

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
    try { await playLetter(key, 1, 1); } catch(_e){}
    await __pqSpeakModalPlayStudent(blob);
    __pqSpeakModalHint('You can record again, or tap Done when you are happy.');
  } finally {
    __pqSpeakModalRecFinalState.playing = false;
    __pqSpeakUiState.isRecording = false;
    try { __pqSyncSimplifiedSpeakUi(); } catch(_e){}
    try { __pqSpeakModalRefreshButtons(); } catch(_e){}
  }
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

  const rec = new MediaRecorder(stream);
  __pqSpeakModalRecFinalState.recorder = rec;

  rec.ondataavailable = function(ev){
    try { if (ev.data && ev.data.size) __pqSpeakModalRecFinalState.chunks.push(ev.data); } catch(_e){}
  };

  rec.onstop = function(){
    try {
      const chunks = __pqSpeakModalRecFinalState.chunks || [];
      const blob = chunks.length ? new Blob(chunks, {type: rec.mimeType || 'audio/webm'}) : null;
      __pqSpeakModalRecFinalState.blob = blob;
      __pqSpeakModalRecFinalState.attempts[key] = {at:Date.now(), ok:!!blob, size:blob ? blob.size : 0};
      __pqSpeakUiState.isRecording = false;
      __pqSpeakUiState.lastRecordingAt = Date.now();
      try { __pqSyncSimplifiedSpeakUi(); } catch(_e){}
      try { __pqSpeakModalRefreshButtons(); } catch(_e){}
      if (blob) setTimeout(__pqSpeakModalReplayTeacherStudent, 120);
      else __pqSpeakModalHint('No recording captured. Try again.');
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



function __pqSpeakModalDoneFinal(){
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
    __pqSpeakUiState.completedKeys[key] = true;
  } catch (_e) {}

  try {
    __pqSpeakModalRecFinalState.doneKeys[key] = true;
  } catch (_e) {}

  try { __pqSpeakMarkCurrentDone(); } catch (_e) {}
  try { __pqSpeakSyncManagedProgressFromDoneKeys(true); } catch (_e) {}
  try { __pqSpeakFinalGreyTile(key); } catch (_e) {}
  try { __pqSpeakFinalRefreshProgress(); } catch (_e) {}
  try { __pqSpeakFinalRefreshDoneTiles(); } catch (_e) {}

  try {
    const m = document.getElementById('pqSpeakChildModal');
    if (m) m.classList.remove('is-open');
  } catch(_e){}

  try { __pqSyncSimplifiedSpeakUi(); } catch(_e){}
  try { __pqSpeakFinalGreyTile(key); } catch (_e) {}
  try { __pqSpeakFinalRefreshProgress(); } catch (_e) {}
  try { __pqSpeakSyncManagedProgressFromDoneKeys(false); } catch (_e) {}
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
    const alreadyDone = __pqSpeakIsKeyCompleted(key);

    if (rec) {
      rec.disabled = !(visible && key) || alreadyDone || !!__pqSpeakUiState.isRecording;
      rec.classList.toggle('pq-can-rerecord', hasAttempt && !alreadyDone && !__pqSpeakUiState.isRecording);
      rec.setAttribute('aria-disabled', rec.disabled ? 'true' : 'false');
    }

    if (done) {
      done.disabled = !(visible && key && hasAttempt) || alreadyDone || !!__pqSpeakUiState.isRecording;
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
      __pqSpeakModalDoneFinal();
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
          __pqSpeakMarkCurrentDone();
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

