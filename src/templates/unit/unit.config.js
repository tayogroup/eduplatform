// Neutral Unit Master Template - Unit Authoring Config
// ------------------------------------------------------------
// This template is the preferred seed for cloned units.
// Keep it neutral: no source-unit content, no unit-specific media maps,
// and no hardcoded lesson assets outside {{UNIT_KEY}} placeholders.
// Use tools/create-unit.js to replace placeholders, then fill content.items.

const __PQ_NORMALIZE_UNIT_CONFIG__ = (
  (typeof window !== 'undefined' && window.PQUnitConfigNormalizer) ||
  (typeof globalThis !== 'undefined' && globalThis.PQUnitConfigNormalizer)
);

if (!__PQ_NORMALIZE_UNIT_CONFIG__ || typeof __PQ_NORMALIZE_UNIT_CONFIG__.normalize !== 'function') {
  throw new Error('PQUnitConfigNormalizer must load before unit.config.js');
}

const UNIT_CFG = __PQ_NORMALIZE_UNIT_CONFIG__.normalize({
  schemaVersion: 1,

  identity: {
    lessonId: '{{LESSON_ID}}',
    unitId: '{{UNIT_ID}}',
    unitKey: '{{UNIT_KEY}}',
    storagePrefix: '{{UNIT_ID}}',
    keyPrefix: '{{KEY_PREFIX}}'
  },

  moodle: {
    wsGetFunction: '{{WS_GET_FUNCTION}}',
    wsSetFunction: '{{WS_SET_FUNCTION}}'
  },

  release: {
    version: '0.1.0',
    assetVersion: '{{UNIT_KEY}}-v0.1.0'
  },

  localization: {
    defaultLanguage: 'en',
    fallbackLanguage: 'en',
    defaultScope: 'both',
    supportedLanguages: ['en', 'ar', 'so', 'sw', 'pa', 'ur'],
    translations: {
      ar: {},
      so: {},
      sw: {},
      pa: {},
      ur: {}
    }
  },

  assets: {
    cdnRoot: '/pre_quraan',
    unitMediaRoot: '/lessons/{{UNIT_KEY}}/media',
    filePrefix: '{{KEY_PREFIX}}',
    mediaPadWidth: 2,
    audioExt: '.mp3',
    soundAudioExt: '.mp3'
  },

  routes: {
    academyHomeUrl: 'https://quraan.academy/'
  },

  messaging: {
    useConfigStepMessages: true,
    disableLegacyCompletionFeedback: true
  },

  messageUi: {
    titleText: 'Message',
    continueText: 'Continue',
    clap: {
      enabled: true,
      visual: true,
      audio: '',
      delayMs: 120
    }
  },

  stepNavigation: {
    previous: {
      enabled: true,
      label: '\u2190 Step',
      title: 'Go back one step',
      confirmTitle: 'Go back one step?',
      confirmText: 'This will move you back to {previousStep}. Your progress for {currentStep} and {previousStep} will be reset so you can try again.',
      confirmContinueText: 'Yes, go back',
      confirmCancelText: 'Stay here'
    }
  },

  steps: [
    { id: 'lecture', type: 'lecture', label: 'Lecture', arabicLabel: 'شرح', passFilters: ['all'] },
    { id: 'listen', type: 'playlist', label: 'Listen', arabicLabel: 'استمع', passFilters: ['all'] },
    { id: 'watch', type: 'video_playlist', label: 'Watch', arabicLabel: 'شاهد', passFilters: ['all'] },
    { id: 'repeat', type: 'playlist', label: 'Repeat', arabicLabel: 'كرر', passFilters: ['all'] },
    { id: 'speak', type: 'speak', label: 'Speak', arabicLabel: 'تحدث', passFilters: ['all'] },
    { id: 'write', type: 'write', label: 'Write', arabicLabel: 'اكتب', passFilters: ['all'] },
    { id: 'submit', type: 'submit', label: 'Submit', arabicLabel: 'أرسل', passFilters: ['all'] }
  ],

  filterSets: {
    all: []
  },

  layout: {
    layoutMode: 'flow-span',
    browserGridCols: 4,
    mobileGridCols: 2,
    sepFontSize: 22,
    cellAspectRatio: '1 / 1'
  },

  focusBadge: {
    label: 'Try to Focus',
    icon: '\u2728'
  },

  rewardBar: {
    progressLabel: 'Progress',
    unitsDoneLabel: 'Units Done',
    totalStarsLabel: 'Total Stars',
    thisUnitLabel: 'This Unit'
  },

  stepperUi: {
    stepPrefix: 'Step',
    progressLabel: 'Progress'
  },

  match: {
    lives: 5,
    maxGames: 3,
    completeWhenMaxGamesUsed: true,
    correctDwellMs: 900,
    wrongDwellMs: 900,
    autoAdvanceMs: 0,
    shuffle: true,
    reshuffleEvery: 3,
    maxWrongPerLetter: 3,
    autoPlayPrompt: true,
    failEndsStep: false,
    soundFeedback: true,
    soundVolume: 0.35,
    showCorrectTargetOnWrong: true,
    showStatusText: true,
    showPopups: true,
    popupDwellMs: 1400,
    minCorrectToPass: 0.6,
    messages: {
      outOfLives: 'You used all your lives. Let us try again.',
      restarting: 'Starting again...',
      completed: 'Great job! Match complete.'
    },
    audioMessages: {
      outOfLives: '',
      completed: ''
    }
  },

  playback: {
    letterAudioMode: 'both',
    letterAudioSequenceGapMs: 120,
    steps: {
      listen: {
        letterAudioMode: 'both',
        beforeStartMs: 500,
        betweenLettersMs: 900,
        afterCompleteMs: 500
      },
      listenplus: {
        letterAudioMode: 'name',
        anchorPlaybackRate: 1.0,
        anchorRepeats: 1,
        beforeStartMs: 500,
        betweenLettersMs: 1200,
        afterCompleteMs: 700,
        animalDelayMs: 0,
        animalHoldMs: 650,
        animalAudioTimeoutMs: 3000
      },
      repeat: {
        letterAudioMode: 'both',
        beforeStartMs: 500,
        betweenLettersMs: 900,
        afterCompleteMs: 500
      },
      speak: {
        letterAudioMode: 'both',
        letterPlaybackRate: 1.0,
        doneConfirm: {
          enabled: true
        },
        recordingUpload: {
          enabled: true,
          required: false,
          wsFunction: 'local_prequran_save_speak_recording',
          maxBytes: 3000000
        },
        comparison: {
          enabled: false
        }
      },
      write: {
        letterAudioMode: 'both'
      },
      sound: {
        letterAudioMode: 'both',
        preModalPlayback: 'video',
        resumeIncomplete: true,
        requireExplainerFirst: true,
        autoVideoAfterExplainer: true,
        autoPlayExplainerOnModalOpen: true,
        videoRepeatCount: 1,
        betweenVideoRepeatsMs: 180
      },
      submit: {
        recordingUpload: {
          enabled: true,
          required: true,
          wsFunction: 'local_prequran_save_submit_recording',
          maxBytes: 6000000
        }
      },
      words: {
        letterAudioMode: 'both',
        letterAudioSourceStep: 'listen',
        modalLetterAudioMode: 'sound',
        modalLetterRepeats: 1,
        modalLetterPlaybackRate: 1.0,
        anchorPlaybackRate: 1.0,
        anchorRepeats: 1,
        wordRepeats: 3,
        beforeStartMs: 500,
        betweenLettersMs: 1200,
        afterCompleteMs: 700,
        wordDelayMs: 0,
        progress: {
          label: 'Progress',
          checkText: '\u2713'
        }
      }
    }
  },

  messages: {
    base: '/pre_quraan/messages/unit_steps/{{UNIT_KEY}}/',
    manifest: './unit.messages.js',
    version: '{{UNIT_KEY}}-messages-v0.1.0',
    entry: {},
    entryPasses: {},
    completion: {}
  },

  media: {
    lectureUrl: '/pre_quraan/messages/lectures/{{UNIT_KEY}}_lecture.mp4',
    voiceBases: {
      child_boy: '/pre_quraan/lessons/{{UNIT_KEY}}/media/audio/male/',
      child_girl: '/pre_quraan/lessons/{{UNIT_KEY}}/media/audio/male/',
      adult_male: '/pre_quraan/lessons/{{UNIT_KEY}}/media/audio/male/',
      adult_female: '/pre_quraan/lessons/{{UNIT_KEY}}/media/audio/male/'
    },
    adultMaleAlphaBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/audio/male/',
    l6Base: '/pre_quraan/lessons/{{UNIT_KEY}}/media/audio/male/',
    audioBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/audio/male/',
    fallbackAudioBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/audio/male/',
    soundLetterAudioBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/audio/sound/',
    soundAudioBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/audio/sound/',
    watchBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/video/',
    fallbackWatchBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/video/',
    animateBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/animate/',
    soundVideoBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/video/',
    soundImageBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/sound/images/',
    soundExplainerBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/sound/explainer/'
  },

  write: {
    chunkSize: 4,
    chunks: [],
    rows: 1,
    cols: 4,
    wideWords: [],
    spanWords: {},
    minPassesRequired: 1,
    adapter: {
      unitKey: '{{UNIT_ID}}',
      buttonId: 'btnTrace',
      displayLabel: 'Write'
    },
    canvas: {
      width: 800,
      height: 320,
      borderColor: '#e7dbc1',
      borderRadius: '10px',
      inkColor: '#0d223a',
      inkWidth: 8,
      guide: {
        top: 110,
        mid: 150,
        base: 205,
        bottom: 260,
        sidePadding: 24,
        topColor: '#e8e2cf',
        midColor: '#e0d6bc',
        baseColor: '#d5c8a2',
        bottomColor: '#e8e2cf',
        midDash: [14, 10]
      },
      ghostText: {
        color: '#10223a',
        alpha: 0.18,
        normalFontPx: 74,
        wideFontPx: 50
      }
    }
  },

  listenPlus: {
    enabled: false,
    imageBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/listen_plus/animals/images/',
    audioBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/listen_plus/animals/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Listen+',
    subtitle: 'Arabic sound + animal sound',
    map: {}
  },

  words: {
    enabled: false,
    imageBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/words/images/',
    audioBase: '/pre_quraan/lessons/{{UNIT_KEY}}/media/words/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Words',
    subtitle: 'Arabic letter + Arabic word',
    map: {}
  },

  content: {
    items: []
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
