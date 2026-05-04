/*
  Pre-Quraan Alphabet runtime fragment: playback.js
  Playlist playback, Watch/Sound/Listen+/Words/Repeat/Match flows, and playing-tile effects.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
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

function __pqStopMediaStream(stream) {
  try {
    if (!stream || typeof stream.getTracks !== 'function') return;
    stream.getTracks().forEach(function (track) {
      try { track.stop(); } catch (_e) {}
    });
  } catch (_e) {}
}

function __pqReleaseRepeatMicStream() {
  try {
    __pqStopMediaStream(__pqRepeatRecordState.stream);
  } catch (_e) {}

  __pqRepeatRecordState.stream = null;

  try {
    if (__pqRepeatRecordState.currentBlobUrl) {
      URL.revokeObjectURL(__pqRepeatRecordState.currentBlobUrl);
    }
  } catch (_e) {}

  __pqRepeatRecordState.currentBlobUrl = '';
}

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

  __pqReleaseRepeatMicStream();
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
