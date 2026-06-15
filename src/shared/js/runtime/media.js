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

  function __pqLetterNameAudioBaseForStep(stepId) {
  const raw = String(stepId || __pqCurrentStepIdFallback() || '').toLowerCase();
  const sid = __pqCanonicalStepId(raw);
  const configured = sid
    ? __cfg(
        'playback.steps.' + raw + '.letterAudioBase',
        __cfg(
          'playback.steps.' + raw + '.audioBase',
          __cfg(
            'playback.steps.' + sid + '.letterAudioBase',
            __cfg('playback.steps.' + sid + '.audioBase', '')
          )
        )
      )
    : '';

  return String(configured || AUDIO_BASE || '').replace(/\/?$/, '/');
}

  function __pqResolveLetterNameAudioUrlForKey(key, stepId) {
  try {
    const fileName = AUDIO_MAP && AUDIO_MAP[key];
    if (!fileName) return '';
    return __pqAppendAssetVersion(__pqLetterNameAudioBaseForStep(stepId) + String(fileName));
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

  function __pqResolveAppendAudioUrlsForKey(key, stepId) {
  try {
    const raw = String(stepId || __pqCurrentStepIdFallback() || '').toLowerCase();
    const sid = __pqCanonicalStepId(raw);
    const enabled = !!__cfg(
      'playback.steps.' + raw + '.appendFormDescriptionAudio',
      __cfg(
        'playback.steps.' + sid + '.appendFormDescriptionAudio',
        __cfg('playback.appendFormDescriptionAudio', false)
      )
    );

    if (!enabled) return [];

    const base = String(__cfg('media.formDescriptionBase', '') || '').replace(/\/?$/, '/');
    if (!base) return [];

    const byKey = __cfg('formDescriptionAudioByKey', {}) || {};
    const byForm = __cfg('formDescriptionAudioByForm', {}) || {};
    const formMatch = String(key || '').match(/_([a-z])$/i);
    const formKey = formMatch ? formMatch[1].toLowerCase() : '';
    const fallbackByForm = {
      i: 'independent.mp3',
      b: 'beginning.mp3',
      m: 'middle.mp3',
      f: 'final.mp3'
    };

    const fileName =
      byKey[key] ||
      byForm[formKey] ||
      fallbackByForm[formKey] ||
      '';

    return fileName ? [__pqAppendAssetVersion(base + String(fileName))] : [];
  } catch (_e) {
    return [];
  }
}

  function __pqResolveAudioUrlsForKey(key, stepId) {
  const mode = __pqLetterAudioModeForStep(stepId);
  const nameUrl = __pqResolveLetterNameAudioUrlForKey(key, stepId);
  const soundUrl = __pqResolveLetterSoundAudioUrlForKey(key);
  const appendUrls = __pqResolveAppendAudioUrlsForKey(key, stepId);

  if (mode === 'sound') return (soundUrl ? [soundUrl] : (nameUrl ? [nameUrl] : [])).concat(appendUrls);
  if (mode === 'both') {
    const urls = [];
    if (nameUrl) urls.push(nameUrl);
    if (soundUrl && soundUrl !== nameUrl) urls.push(soundUrl);
    return urls.concat(appendUrls);
  }

  return (nameUrl ? [nameUrl] : (soundUrl ? [soundUrl] : [])).concat(appendUrls);
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

  const __PQ_HARAKAT_FATHA = '\u064E';
  const __PQ_HARAKAT_KASRA = '\u0650';
  const __PQ_HARAKAT_DAMMA = '\u064F';
  let __pqHarakatAnimToken = 0;

  function __pqIsHarakatUnit() {
    try {
      const unitKey = String(__cfg('identity.unitKey', __cfg('unitKey', '')) || '').toLowerCase();
      const unitId = String(__cfg('unitid', __pqIdentity('unitId', '')) || '').toLowerCase();
      return unitKey === 'harakat' || unitId === 'harakat_listen';
    } catch (_e) {
      return false;
    }
  }

  function __pqHarakatLetterForKey(key) {
    try {
      const item = (LETTERS || []).find((letterObj) => letterObj && letterObj.key === key);
      return String((item && (item.ar || item.text)) || audioStemForKey(key) || '');
    } catch (_e) {
      return '';
    }
  }

  function __pqHarakatGlyphForKey(key) {
    try {
      const safeKey = String(key || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const tile = grid && grid.querySelector
        ? grid.querySelector('.tile[data-key="' + safeKey + '"]')
        : document.querySelector('.tile[data-key="' + safeKey + '"]');

      return tile && tile.querySelector ? tile.querySelector('.sep') : null;
    } catch (_e) {
      return null;
    }
  }

  async function __pqHarakatDelay(ms, token, signal) {
    const end = Date.now() + Math.max(0, Number(ms || 0) || 0);

    while (Date.now() < end) {
      if (__pqHarakatAnimToken !== token) return false;

      try {
        __pqAssertNotAborted(signal);
      } catch (err) {
        throw err;
      }

      if (paused) {
        await __pqDelayWithAbort(80, signal || null);
        continue;
      }

      await __pqDelayWithAbort(Math.min(80, end - Date.now()), signal || null);
    }

    return __pqHarakatAnimToken === token;
  }

  async function __pqRunHarakatGlyphCycle(key, rate, token, signal) {
    const glyphEl = __pqHarakatGlyphForKey(key);
    const baseChar = __pqHarakatLetterForKey(key);

    if (!glyphEl || !baseChar) return false;

    const original = glyphEl.textContent || baseChar;
    const speed = Math.max(0.2, Number(rate || 1) || 1);
    const letterMs = Math.max(0, Number(__cfg('playback.harakat.letterMs', 1200)) || 1200) / speed;
    const vowelMs = Math.max(0, Number(__cfg('playback.harakat.vowelMs', 900)) || 900) / speed;
    const pauseMs = Math.max(0, Number(__cfg('playback.harakat.pauseMs', 250)) || 250) / speed;

    const setGlyph = (value) => {
      if (__pqHarakatAnimToken === token) {
        glyphEl.textContent = value;
      }
    };

    try {
      setGlyph(baseChar);
      if (!(await __pqHarakatDelay(letterMs, token, signal))) return false;
      if (!(await __pqHarakatDelay(pauseMs, token, signal))) return false;

      setGlyph(baseChar + __PQ_HARAKAT_FATHA);
      if (!(await __pqHarakatDelay(vowelMs, token, signal))) return false;
      setGlyph(baseChar);
      if (!(await __pqHarakatDelay(pauseMs, token, signal))) return false;

      setGlyph(baseChar + __PQ_HARAKAT_KASRA);
      if (!(await __pqHarakatDelay(vowelMs, token, signal))) return false;
      setGlyph(baseChar);
      if (!(await __pqHarakatDelay(pauseMs, token, signal))) return false;

      setGlyph(baseChar + __PQ_HARAKAT_DAMMA);
      if (!(await __pqHarakatDelay(vowelMs, token, signal))) return false;
      setGlyph(baseChar);

      return true;
    } finally {
      if (__pqHarakatAnimToken === token) {
        glyphEl.textContent = baseChar || original;
      }
    }
  }

  function __pqCancelHarakatAnimation() {
    __pqHarakatAnimToken += 1;
  }

  async function __pqPlayHarakatAnimatedLetterOnce(key, rate, stepId) {
    const urls = __pqResolveAudioUrlsForKey(key, stepId);

    if (!urls.length) {
      return undefined;
    }

    const token = ++__pqHarakatAnimToken;
    const signal = (__playAllController && __playAllController.signal) || null;
    const animation = __pqRunHarakatGlyphCycle(key, rate, token, signal).catch((err) => {
      if (err && err.name === 'AbortError') throw err;
      return false;
    });

    try {
      for (let i = 0; i < urls.length; i += 1) {
        const played = await __pqPlayConfiguredAudioUrl(urls[i], rate);
        if (!played) {
          throw new Error('configured audio failed for ' + key + ': ' + urls[i]);
        }

        if (i < urls.length - 1) {
          await __pqRepeatGapDelay(__pqLetterAudioSequenceGapMs(stepId));
        }
      }

      await animation;
      return true;
    } finally {
      if (__pqHarakatAnimToken === token) {
        __pqCancelHarakatAnimation();
      }
    }
  }

async function playLetterOnce(key, rate, stepId) {
    // PATCH_PLAYING_TILE_IN_PLAY_LETTER_ONCE
    try { __pqSetPlayingTile(key); } catch (_e) {}
  try {
    if (__pqIsHarakatUnit()) {
      const animated = await __pqPlayHarakatAnimatedLetterOnce(key, rate, stepId);
      if (animated) return true;
    }

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
