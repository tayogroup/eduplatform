// MaddoLeen Unit - Unit Authoring Config
// ------------------------------------------------------------
// This template is the preferred seed for cloned units.
// Keep it neutral: no source-unit content, no unit-specific media maps,
// and no hardcoded lesson assets outside maddoleen placeholders.
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
    lessonId: 'tajweed',
    unitId: 'maddoleen_listen',
    unitKey: 'maddoleen',
    storagePrefix: 'maddoleen_listen',
    keyPrefix: 'mdl_'
  },

  moodle: {
    wsGetFunction: 'local_prequran_get_maddoleen_listen_state',
    wsSetFunction: 'local_prequran_set_maddoleen_listen_state'
  },

  release: {
    version: '1.0.0',
    assetVersion: 'maddoleen-rules-20260601a'
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
       "cdnRoot": "/pre_quraan",
       "unitMediaRoot": "/lessons/maddoleen/media",
       "filePrefix": "mdl_",
       "mediaPadWidth": 2,
       "audioExt": ".mp3",
       "soundAudioExt": ".mp3",
       "videoFilePrefix": "mdl_"
     },

  routes: {
    academyHomeUrl: 'https://quraan.academy/'
  },

  messaging: {
       "useConfigStepMessages": true,
       "disableLegacyCompletionFeedback": true
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

  stepInjection: {
    beforeListen: [
      {
        id: 'rules',
        type: 'content',
        label: 'Rules',
        arabicLabel: 'القواعد',
        actionLabel: 'Complete Rules',
        actionArabicLabel: 'أكمل القواعد',
        filter: 'all',
        passFilters: ['all']
      }
    ],
    rules: {
      id: 'rules',
      type: 'content',
      label: 'Rules',
      arabicLabel: 'القواعد',
      actionLabel: 'Complete Rules',
      actionArabicLabel: 'أكمل القواعد',
      filter: 'all',
      passFilters: ['all']
    },
    watch: false,
    speak: false,
    submit: false
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
    { id: 'lecture',    step_index: 1,  type: 'lecture',        label: 'Lecture',    arabicLabel: '\u0634\u0631\u062d', passFilters: ['all'] },
    { id: 'rules',      step_index: 2,  type: 'content',        label: 'Rules',      arabicLabel: '\u0627\u0644\u0642\u0648\u0627\u0639\u062f', actionLabel: 'Complete Rules', actionArabicLabel: '\u0623\u0643\u0645\u0644 \u0627\u0644\u0642\u0648\u0627\u0639\u062f', passFilters: ['all'] },
    { id: 'listen',     step_index: 3,  type: 'playlist',       label: 'Listen',     arabicLabel: '\u0627\u0633\u062a\u0645\u0639', passFilters: ['all'] },
    { id: 'watch',      step_index: 4,  type: 'video_playlist', label: 'Watch',      arabicLabel: '\u0634\u0627\u0647\u062f', passFilters: ['all'] },
    { id: 'phonetics',  step_index: 5,  type: 'phonetics',      label: 'Phonetics',  arabicLabel: '\u0627\u0644\u0646\u0637\u0642', passFilters: ['all'] },
    { id: 'repeat',     step_index: 6,  type: 'playlist',       label: 'Repeat',     arabicLabel: '\u0643\u0631\u0631', passFilters: ['all'] },
    { id: 'letterclue', step_index: 7,  type: 'letterclue',     label: 'LetterClue', arabicLabel: '\u062a\u0644\u0645\u064a\u062d\u0627\u062a \u0627\u0644\u062d\u0631\u0648\u0641', passFilters: ['all'] },
    { id: 'speak',      step_index: 8,  type: 'speak',          label: 'Speak',      arabicLabel: '\u062a\u062d\u062f\u062b', passFilters: ['all'] },
    { id: 'match',      step_index: 9,  type: 'match',          label: 'Match',      arabicLabel: '\u0637\u0627\u0628\u0642', passFilters: ['all'] },
    { id: 'soundclue',  step_index: 10, type: 'soundclue',      label: 'SoundClue',  arabicLabel: '\u062a\u0644\u0645\u064a\u062d\u0627\u062a \u0635\u0648\u062a\u064a\u0629', passFilters: ['all'] },
    { id: 'animate',    step_index: 11, type: 'animate',        label: 'Animate',    arabicLabel: '\u0634\u0627\u0647\u062f \u0627\u0644\u0643\u062a\u0627\u0628\u0629', passFilters: ['all'] },
    { id: 'write',      step_index: 12, type: 'write',          label: 'Write',      arabicLabel: '\u0627\u0643\u062a\u0628', passFilters: ['all'] },
    { id: 'submit',     step_index: 13, type: 'submit',         label: 'Submit',     arabicLabel: '\u0623\u0631\u0633\u0644', passFilters: ['all'] }
  ],

  filterSets: {
       "all": [
         "mdl_1",
         "mdl_2",
         "mdl_3",
         "mdl_4",
         "mdl_5",
         "mdl_6",
         "mdl_7",
         "mdl_8",
         "mdl_9",
         "mdl_10",
         "mdl_11",
         "mdl_12",
         "mdl_13",
         "mdl_14",
         "mdl_15",
         "mdl_16",
         "mdl_17",
         "mdl_18",
         "mdl_19",
         "mdl_20",
         "mdl_21",
         "mdl_22",
         "mdl_23",
         "mdl_24",
         "mdl_25",
         "mdl_26",
         "mdl_27",
         "mdl_28"
       ]
     },

  layout: {
       "layoutMode": "flow-span",
       "browserGridCols": 2,
       "mobileGridCols": 1,
       "sepFontSize": "3.6rem",
       "smallFontSize": "1.15rem",
       "mobileTileMinHeight": "150px",
       "mobileSepFontSize": "3rem",
       "mobileSmallFontSize": "1.05rem",
       "rtlColFromLtr": false,
       "width": "100%",
       "maxWidth": "100%",
       "columnGap": "16px",
       "rowGap": "16px",
       "minTileWidth": "0px"
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
       "stepPrefix": "Step",
       "progressLabel": "Progress",
       "reviewAriaPrefix": "Review",
       "badgeCompleted": "✓",
       "badgeActive": "▶",
       "badgePending": "•"
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
        "entry": {
          "lecture": {
            "text": "Welcome to the MaddoLeen unit. Click Play Lecture and listen carefully before you begin."
          },
          "listen1": {
            "text": "You have completed the lecture. You have now entered Listen 1. Listen carefully to each MaddoLeen group."
          },
          "listen2": {
            "text": "Good work. You have now entered Listen 2. Listen again and focus on the Madd letters."
          },
          "listen3": {
            "text": "Good work. You have now entered Listen 3. Listen one more time and complete the practice."
          }
        },
        "entryPasses": {},
        "completion": {
          "listen3": {
            "text": "Congratulations. You have completed the MaddoLeen unit."
          }
        }
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
    base: '/pre_quraan/messages/unit_steps/maddoleen/',
    manifest: './unit.messages.js',
    version: 'maddoleen-messages-v0.1.0',
    entry: {},
    entryPasses: {},
    completion: {}
  },

  media: {
       "audioBase": "/pre_quraan/lessons/maddoleen/media/audio/male/",
       "l6Base": "/pre_quraan/lessons/maddoleen/media/audio/male/",
       "fallbackAudioBase": "/pre_quraan/lessons/maddoleen/media/audio/male/",
       "watchBase": "maddoleen-video-not-provided/",
       "fallbackWatchBase": "maddoleen-video-not-provided/",
       "lectureUrl": "/pre_quraan/messages/lectures/maddoleen_lecture.mp4",
       "voiceBases": {
         "child_boy": "/pre_quraan/lessons/maddoleen/media/audio/male/",
         "child_girl": "",
         "adult_male": "/pre_quraan/lessons/maddoleen/media/audio/male/",
         "adult_female": ""
       }
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
      unitKey: 'maddoleen_listen',
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
    imageBase: '/pre_quraan/lessons/maddoleen/media/listen_plus/animals/images/',
    audioBase: '/pre_quraan/lessons/maddoleen/media/listen_plus/animals/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Listen+',
    subtitle: 'Arabic sound + animal sound',
    map: {}
  },

  words: {
    enabled: false,
    imageBase: '/pre_quraan/lessons/maddoleen/media/words/images/',
    audioBase: '/pre_quraan/lessons/maddoleen/media/words/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Words',
    subtitle: 'Arabic letter + Arabic word',
    map: {}
  },

  ui: {
      "pageTitle": "PQ Unit - MaddoLeen Unit",
      "headerTitle": "MaddoLeen Unit",
      "aboutLabel": "About MaddoLeen",
      "showDbSavedToast": false
    },

  defaults: {
      "voice": "child_boy",
      "speed": "1.0",
      "repeat": "1",
      "filter": "all"
    },

  wordLimit: 28,

  content: {
    items: [
      {"key":"mdl_1","text":"بَا   بُوْا   بِيْ","row":1,"displayCol":2,"audio":"mdl_01.mp3","video":"mdl_01.mp4"},
      {"key":"mdl_2","text":"تَا   تُوْا   تِيْ","row":1,"displayCol":1,"audio":"mdl_02.mp3","video":"mdl_02.mp4"},
      {"key":"mdl_3","text":"ثَا   ثُوْا   ثِيْ","row":2,"displayCol":2,"audio":"mdl_03.mp3","video":"mdl_03.mp4"},
      {"key":"mdl_4","text":"حَا   حُوْا   حِيْ","row":2,"displayCol":1,"audio":"mdl_04.mp3","video":"mdl_04.mp4"},
      {"key":"mdl_5","text":"خَا   خُوْا   خِيْ","row":3,"displayCol":2,"audio":"mdl_05.mp3","video":"mdl_05.mp4"},
      {"key":"mdl_6","text":"رَا   رُوْا   رِيْ","row":3,"displayCol":1,"audio":"mdl_06.mp3","video":"mdl_06.mp4"},
      {"key":"mdl_7","text":"رَا   رُوْا   رِيْ","row":4,"displayCol":2,"audio":"mdl_07.mp3","video":"mdl_07.mp4"},
      {"key":"mdl_8","text":"زَا   زُوْا   زِيْ","row":4,"displayCol":1,"audio":"mdl_08.mp3","video":"mdl_08.mp4"},
      {"key":"mdl_9","text":"طَا   طُوْا   ظِيْ","row":5,"displayCol":2,"audio":"mdl_09.mp3","video":"mdl_09.mp4"},
      {"key":"mdl_10","text":"فَا   فُوْا   فِيْ","row":5,"displayCol":1,"audio":"mdl_10.mp3","video":"mdl_10.mp4"},
      {"key":"mdl_11","text":"هَا   هُوْا   هِيْ","row":6,"displayCol":2,"audio":"mdl_11.mp3","video":"mdl_11.mp4"},
      {"key":"mdl_12","text":"يَا   يُوْا   يِيْ","row":6,"displayCol":1,"audio":"mdl_12.mp3","video":"mdl_12.mp4"},
      {"key":"mdl_13","text":"ءَا   ءُوْا   ءِيْ","row":7,"displayCol":2,"audio":"mdl_13.mp3","video":"mdl_13.mp4"},
      {"key":"mdl_14","text":"جَا   جُوْا   جِيْ","row":7,"displayCol":1,"audio":"mdl_14.mp3","video":"mdl_14.mp4"},
      {"key":"mdl_15","text":"دَا   دُوْا   دِيْ","row":8,"displayCol":2,"audio":"mdl_15.mp3","video":"mdl_15.mp4"},
      {"key":"mdl_16","text":"ذَا   ذُوْا   ذِيْ","row":8,"displayCol":1,"audio":"mdl_16.mp3","video":"mdl_16.mp4"},
      {"key":"mdl_17","text":"سَا   سُوْا   سِيْ","row":9,"displayCol":2,"audio":"mdl_17.mp3","video":"mdl_17.mp4"},
      {"key":"mdl_18","text":"شَا   شُوْا   شِيْ","row":9,"displayCol":1,"audio":"mdl_18.mp3","video":"mdl_18.mp4"},
      {"key":"mdl_19","text":"صَا   صُوْا   صِيْ","row":10,"displayCol":2,"audio":"mdl_19.mp3","video":"mdl_19.mp4"},
      {"key":"mdl_20","text":"ضَا   ضُوْا   ضِيْ","row":10,"displayCol":1,"audio":"mdl_20.mp3","video":"mdl_20.mp4"},
      {"key":"mdl_21","text":"عَا   عُوْا   عِيْ","row":11,"displayCol":2,"audio":"mdl_21.mp3","video":"mdl_21.mp4"},
      {"key":"mdl_22","text":"غَا   غُوْا   غِيْ","row":11,"displayCol":1,"audio":"mdl_22.mp3","video":"mdl_22.mp4"},
      {"key":"mdl_23","text":"قَا   قُوْا   قِيْ","row":12,"displayCol":2,"audio":"mdl_23.mp3","video":"mdl_23.mp4"},
      {"key":"mdl_24","text":"كَا   كُوْا   كِيْ","row":12,"displayCol":1,"audio":"mdl_24.mp3","video":"mdl_24.mp4"},
      {"key":"mdl_25","text":"لَا   لُوْا   لِيْ","row":13,"displayCol":2,"audio":"mdl_25.mp3","video":"mdl_25.mp4"},
      {"key":"mdl_26","text":"مَا   مُوْا   مِيْ","row":13,"displayCol":1,"audio":"mdl_26.mp3","video":"mdl_26.mp4"},
      {"key":"mdl_27","text":"نَا   نُوْا   نِىْ","row":14,"displayCol":2,"audio":"mdl_27.mp3","video":"mdl_27.mp4"},
      {"key":"mdl_28","text":"وَا   وُوْا   وِيْ","row":14,"displayCol":1,"audio":"mdl_28.mp3","video":"mdl_28.mp4"}
    ]
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
