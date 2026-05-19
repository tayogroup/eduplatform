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
      getAudioByKey: () => AUDIO_MAP,
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
  
  function __pqNormalizeLetterAudioMode(value) {
  const mode = String(value || '').trim().toLowerCase();
  if (mode === 'sound' || mode === 'letter_sound' || mode === 'lettersound') return 'sound';
  if (mode === 'both' || mode === 'name_sound' || mode === 'namesound' || mode === 'linked') return 'both';
  return 'name';
}

  function __pqCurrentStepIdFallback() {
  try {
    const cur = getCurrentStep && getCurrentStep();
    return String((cur && cur.step && cur.step.id) || '').toLowerCase();
  } catch (_e) {
    return '';
  }
}

  function __pqLetterAudioModeForStep(stepId) {
  const raw = String(stepId || __pqCurrentStepIdFallback() || '').toLowerCase();
  const sid = __pqCanonicalStepId(raw);
  const configured = sid
    ? __cfg(
        'playback.steps.' + raw + '.letterAudioMode',
        __cfg(
          'playback.steps.' + raw + '.audioMode',
          __cfg(
            'playback.steps.' + sid + '.letterAudioMode',
            __cfg('playback.steps.' + sid + '.audioMode', '')
          )
        )
      )
    : '';

  return __pqNormalizeLetterAudioMode(
    configured || __cfg('playback.letterAudioMode', __cfg('playback.audioMode', 'name'))
  );
}

  function __pqLetterAudioSequenceGapMs(stepId) {
  const raw = String(stepId || __pqCurrentStepIdFallback() || '').toLowerCase();
  const sid = __pqCanonicalStepId(raw);
  const configured = sid
    ? __cfg(
        'playback.steps.' + raw + '.letterAudioSequenceGapMs',
        __cfg(
          'playback.steps.' + raw + '.audioSequenceGapMs',
          __cfg(
            'playback.steps.' + sid + '.letterAudioSequenceGapMs',
            __cfg('playback.steps.' + sid + '.audioSequenceGapMs', '')
          )
        )
      )
    : '';

  return Math.max(0, Number(configured || __cfg('playback.letterAudioSequenceGapMs', 120) || 0) || 0);
}

  function __pqResolveLetterNameAudioUrlForKey(key) {
  try {
    const fileName = AUDIO_MAP && AUDIO_MAP[key];
    if (!fileName) return '';
    return __pqAppendAssetVersion(AUDIO_BASE + String(fileName));
  } catch (_e) {
    return '';
  }
}

  function __pqResolveLetterSoundAudioUrlForKey(key) {
  try {
    const fileName = (LETTER_SOUND_MAP && LETTER_SOUND_MAP[key]) || (AUDIO_MAP && AUDIO_MAP[key]);
    if (!fileName || !LETTER_SOUND_BASE) return '';
    return __pqAppendAssetVersion(LETTER_SOUND_BASE.replace(/\/?$/, '/') + String(fileName));
  } catch (_e) {
    return '';
  }
}

  function __pqResolveAudioUrlsForKey(key, stepId) {
  const mode = __pqLetterAudioModeForStep(stepId);
  const nameUrl = __pqResolveLetterNameAudioUrlForKey(key);
  const soundUrl = __pqResolveLetterSoundAudioUrlForKey(key);

  if (mode === 'sound') return soundUrl ? [soundUrl] : (nameUrl ? [nameUrl] : []);
  if (mode === 'both') {
    const urls = [];
    if (nameUrl) urls.push(nameUrl);
    if (soundUrl && soundUrl !== nameUrl) urls.push(soundUrl);
    return urls;
  }

  return nameUrl ? [nameUrl] : (soundUrl ? [soundUrl] : []);
}

  function __pqResolveAudioUrlForKey(key) {
  const urls = __pqResolveAudioUrlsForKey(key);
  return urls[0] || '';
}

  function tryPlayUrl(url, rate) {
    const api = __pqEnsurePlaylistEngine();
    return api
      ? api.tryPlayUrl(url, rate)
      : Promise.reject(new Error('playlist engine unavailable'));
  }

  async function __pqPlayConfiguredAudioUrl(url, rate) {
    if (!url) return false;

    __pqWebAudioCurrentUrl = url;

    try {
      const buffer = await __pqFetchAudioBuffer(url);
      if (buffer) {
        await __pqPlayBuffer(buffer, rate, 0);
        return true;
      }
    } catch (_e) {}

    try {
      await tryPlayUrl(url, rate);
      return true;
    } catch (_e) {
      return false;
    }
  }

async function playLetterOnce(key, rate, stepId) {
    // PATCH_PLAYING_TILE_IN_PLAY_LETTER_ONCE
    try { __pqSetPlayingTile(key); } catch (_e) {}
  try {
    const urls = __pqResolveAudioUrlsForKey(key, stepId);
    if (!urls.length) {
      const api = __pqEnsurePlaylistEngine();
      if (api) return api.playLetterOnce(key, rate);
      return undefined;
    }

    for (let i = 0; i < urls.length; i += 1) {
      const url = urls[i];
      const played = await __pqPlayConfiguredAudioUrl(url, rate);
      if (!played) {
        throw new Error('configured audio failed for ' + key + ': ' + url);
      }

      if (i < urls.length - 1) {
        await __pqRepeatGapDelay(__pqLetterAudioSequenceGapMs(stepId));
      }
    }

    return true;
  } catch (_e) {
    try {
      console.warn('[PQ] Configured audio playback failed.', key, _e);
    } catch (_warn) {}
    return undefined;
  }
}



function __pqRepeatGapDelay(ms) {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, Math.max(0, Number(ms || 0) || 0));
  });
}

async function playLetter(key, times, rate, stepId) {
  try {
    const count = Math.max(1, Math.floor(Number(times || 1) || 1));

    for (let i = 0; i < count; i += 1) {
      await playLetterOnce(key, rate, stepId);

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
