/*
  Pre-Quraan Alphabet runtime fragment: media.js
  Shared playlist/watch media engine helpers.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
  // SECTION 27: Shared playlist/watch engine helpers
  // ============================================================
  const __ADULT_MALE_ALPHA_BASE = String(
  __cfg(
    'media.adultMaleAlphaBase',
    ''
  )
  );

  function __adLettersFromSeparatedLine(value) {
    return String(value || '')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[\u200C\u200D\u2009\u00A0\s]/g, '')
      .split('');
  }

  let __pqPlaylistEngine = null;

  function __pqEnsurePlaylistEngine() {
    if (
      __pqPlaylistEngine ||
      !window.PQSharedPlaylistEngine ||
      typeof window.PQSharedPlaylistEngine.create !== 'function'
    ) {
      return __pqPlaylistEngine;
    }

    __pqPlaylistEngine = window.PQSharedPlaylistEngine.create({
      audioEl: audio,
      playerEl: player,
      videoModalEl: videoModal,
      btnPlayAllEl: btnPlayAll,
      btnPauseEl: btnPause,
      speedSelEl: speedSel,
      repeatSelEl: repeatSel,
      defaults: DEFAULTS,
      getCurrentStep: () => getCurrentStep(),
      getManagedProgress: () => managedProgress,
      getPracticeFreeUI: () => __pqPracticeFreeUI(),
      getLetters: () => LETTERS,
      getVideoByKey: () => VIDEO_BY_KEY,
      getPlaySequenceKeys: () => {
        try {
          const cur = getCurrentStep && getCurrentStep();
          const sid = String((cur && cur.step && cur.step.id) || '');
          return __pqGetPassSequenceKeys(sid, PLAY_SEQUENCE_KEYS);
        } catch (_e) {
          return PLAY_SEQUENCE_KEYS;
        }
      },
      getGridEl: () => grid,
      getAudioBases: () => [AUDIO_BASE],
      getVoiceBases: () => VOICE_BASES,
      getVoiceValue: () => (voiceSel.value || DEFAULTS.voice),
      getCacheBust: () => '',
      getArForKey: (key) => audioStemForKey(key),
      resolveAdultMaleBase: () => __ADULT_MALE_ALPHA_BASE,
      getLettersFromSeparatedLine: (value) => __adLettersFromSeparatedLine(value),

      onSelectKey: (key, idx) => {
        selectedIdx = (typeof idx === 'number') ? idx : -1;
        selectedKey = key || null;
        markActive();

        try {
          __pqSyncWriteUI();
        } catch (_e) {}

        if (key) alScrollToKey(key);
      },

      onLetterPlayed: async (key) => {
        try {
          handleLetterPlayedForCurrentStep(key);
        } catch (_e) {}
      },

      onPlaylistStepCompleted: async (stepId) => {
        await markPlaylistStepCompleted(stepId);
      },

      scrollToKey: (key) => alScrollToKey(key),

      delay: (ms) => new Promise((resolve) => {
        setTimeout(resolve, Math.max(0, Number(ms) || 0));
      })
    });

    return __pqPlaylistEngine;
  }
  
  function __pqResolveAudioUrlForKey(key) {
  try {
    const fileName = AUDIO_MAP && AUDIO_MAP[key];
    if (!fileName) return '';
    return AUDIO_BASE + String(fileName) + '?v=20260415_01';
  } catch (_e) {
    return '';
  }
}

  function tryPlayUrl(url, rate) {
    const api = __pqEnsurePlaylistEngine();
    return api
      ? api.tryPlayUrl(url, rate)
      : Promise.reject(new Error('playlist engine unavailable'));
  }

async function playLetterOnce(key, rate) {
    // PATCH_PLAYING_TILE_IN_PLAY_LETTER_ONCE
    try { __pqSetPlayingTile(key); } catch (_e) {}
  try {
    const url = __pqResolveAudioUrlForKey(key);
    if (!url) {
      const api = __pqEnsurePlaylistEngine();
      if (api) return api.playLetterOnce(key, rate);
      return undefined;
    }

    __pqWebAudioCurrentUrl = url;
    const buffer = await __pqFetchAudioBuffer(url);
    if (!buffer) {
      const api = __pqEnsurePlaylistEngine();
      if (api) return api.playLetterOnce(key, rate);
      return undefined;
    }

    await __pqPlayBuffer(buffer, rate, 0);
    return true;
  } catch (_e) {
    const api = __pqEnsurePlaylistEngine();
    if (api) return api.playLetterOnce(key, rate);
    return undefined;
  }
}



function __pqRepeatGapDelay(ms) {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, Math.max(0, Number(ms || 0) || 0));
  });
}

async function playLetter(key, times, rate) {
  try {
    const count = Math.max(1, Math.floor(Number(times || 1) || 1));

    for (let i = 0; i < count; i += 1) {
      await playLetterOnce(key, rate);

      if (i < count - 1) {
        await __pqRepeatGapDelay(350);
      }
    }

    return true;
  } catch (_e) {
    const api = __pqEnsurePlaylistEngine();
    if (api) return api.playLetter(key, times, rate);
    return undefined;
  }
}

// ============================================================
