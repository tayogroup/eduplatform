// Sukun Jazm Unit - Unit Authoring Config
// ------------------------------------------------------------
// This template is the preferred seed for cloned units.
// Keep it neutral: no source-unit content, no unit-specific media maps,
// and no hardcoded lesson assets outside sukoon-jazm placeholders.
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
    unitId: 'sakoon_jazm_listen',
    unitKey: 'sukoon-jazm',
    storagePrefix: 'sakoon_jazm_listen',
    keyPrefix: 'sj_'
  },

  moodle: {
    wsGetFunction: 'local_prequran_get_sakoon_jazm_listen_state',
    wsSetFunction: 'local_prequran_set_sakoon_jazm_listen_state'
  },

  release: {
    version: '1.0.0',
    assetVersion: 'sukoon-jazm-rules-20260601a'
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
       "unitMediaRoot": "/lessons/sukoon-jazm/media",
       "filePrefix": "sj_",
       "mediaPadWidth": 2,
       "audioExt": ".mp3",
       "soundAudioExt": ".mp3",
       "videoFilePrefix": "sj_"
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
         "sj_1",
         "sj_2",
         "sj_3",
         "sj_4",
         "sj_5",
         "sj_6",
         "sj_7",
         "sj_8",
         "sj_9",
         "sj_10",
         "sj_11",
         "sj_12",
         "sj_13",
         "sj_14",
         "sj_15",
         "sj_16"
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
            "text": "Welcome to the Sukun Jazm unit. Click Play Lecture and listen carefully before you begin."
          },
          "listen1": {
            "text": "You have completed the lecture. You have now entered Listen 1. Listen carefully to each Sukun Jazm group."
          },
          "listen2": {
            "text": "Good work. You have now entered Listen 2. Listen again and focus on the sukun sound."
          },
          "listen3": {
            "text": "Good work. You have now entered Listen 3. Listen one more time and complete the practice."
          }
        },
        "entryPasses": {},
        "completion": {
          "listen3": {
            "text": "Congratulations. You have completed the Sukun Jazm unit."
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
    base: '/pre_quraan/messages/unit_steps/sukoon-jazm/',
    manifest: './unit.messages.js',
    version: 'sukoon-jazm-messages-v0.1.0',
    entry: {},
    entryPasses: {},
    completion: {}
  },

  media: {
       "audioBase": "/pre_quraan/lessons/sukoon-jazm/media/audio/male/",
       "l6Base": "/pre_quraan/lessons/sukoon-jazm/media/audio/male/",
       "fallbackAudioBase": "/pre_quraan/lessons/sukoon-jazm/media/audio/male/",
       "watchBase": "sukoon-jazm-video-not-provided/",
       "fallbackWatchBase": "sukoon-jazm-video-not-provided/",
       "lectureUrl": "/pre_quraan/messages/lectures/sukoon-jazm_lecture.mp4",
       "voiceBases": {
         "child_boy": "/pre_quraan/lessons/sukoon-jazm/media/audio/male/",
         "child_girl": "",
         "adult_male": "/pre_quraan/lessons/sukoon-jazm/media/audio/male/",
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
      unitKey: 'sakoon_jazm_listen',
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
    imageBase: '/pre_quraan/lessons/sukoon-jazm/media/listen_plus/animals/images/',
    audioBase: '/pre_quraan/lessons/sukoon-jazm/media/listen_plus/animals/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Listen+',
    subtitle: 'Arabic sound + animal sound',
    map: {}
  },

  words: {
    enabled: false,
    imageBase: '/pre_quraan/lessons/sukoon-jazm/media/words/images/',
    audioBase: '/pre_quraan/lessons/sukoon-jazm/media/words/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Words',
    subtitle: 'Arabic letter + Arabic word',
    map: {}
  },

  ui: {
      "pageTitle": "PQ Unit - Sukun Jazm Unit",
      "headerTitle": "Sukun Jazm Unit",
      "aboutLabel": "About Sukun Jazm",
      "showDbSavedToast": false
    },

  stepInjection: {
      "beforeListen": [
        {
          "id": "rules",
          "type": "content",
          "label": "Rules",
          "arabicLabel": "القواعد",
          "actionLabel": "Complete Rules",
          "actionArabicLabel": "أكمل القواعد",
          "filter": "all",
          "passFilters": ["all"]
        }
      ],
      "rules": {
        "id": "rules",
        "type": "content",
        "label": "Rules",
        "arabicLabel": "القواعد",
        "actionLabel": "Complete Rules",
        "actionArabicLabel": "أكمل القواعد",
        "filter": "all",
        "passFilters": ["all"]
      },
      "watch": false,
      "speak": false,
      "submit": false
    },

  defaults: {
      "voice": "child_boy",
      "speed": "1.0",
      "repeat": "1",
      "filter": "all"
    },

  wordLimit: 16,

  content: {
    items: [
      {"key":"sj_1","text":"أَبْ   إِبْ   أُبْ","row":1,"displayCol":2,"audio":"sj_01.mp3","video":"sj_01.mp4"},
      {"key":"sj_2","text":"أَتْ   إِتْ   أُتْ","row":1,"displayCol":1,"audio":"sj_02.mp3","video":"sj_02.mp4"},
      {"key":"sj_3","text":"أَثْ   إِثْ   أُثْ","row":2,"displayCol":2,"audio":"sj_03.mp3","video":"sj_03.mp4"},
      {"key":"sj_4","text":"أَجْ   إِجْ   أُجْ","row":2,"displayCol":1,"audio":"sj_04.mp3","video":"sj_04.mp4"},
      {"key":"sj_5","text":"أَحْ   إِحْ   أُحْ","row":3,"displayCol":2,"audio":"sj_05.mp3","video":"sj_05.mp4"},
      {"key":"sj_6","text":"أَخْ   إِخْ   أُخْ","row":3,"displayCol":1,"audio":"sj_06.mp3","video":"sj_06.mp4"},
      {"key":"sj_7","text":"أَدْ   إِدْ   أُدْ","row":4,"displayCol":2,"audio":"sj_07.mp3","video":"sj_07.mp4"},
      {"key":"sj_8","text":"أَذْ   إِذْ   أُذْ","row":4,"displayCol":1,"audio":"sj_08.mp3","video":"sj_08.mp4"},
      {"key":"sj_9","text":"أَرْ   إِرْ   أُرْ","row":5,"displayCol":2,"audio":"sj_09.mp3","video":"sj_09.mp4"},
      {"key":"sj_10","text":"أَزْ   إِزْ   أُزْ","row":5,"displayCol":1,"audio":"sj_10.mp3","video":"sj_10.mp4"},
      {"key":"sj_11","text":"أَسْ   إِسْ   أُسْ","row":6,"displayCol":2,"audio":"sj_11.mp3","video":"sj_11.mp4"},
      {"key":"sj_12","text":"أَشْ   إِشْ   أُشْ","row":6,"displayCol":1,"audio":"sj_12.mp3","video":"sj_12.mp4"},
      {"key":"sj_13","text":"أَصْ   إِصْ   أُصْ","row":7,"displayCol":2,"audio":"sj_13.mp3","video":"sj_13.mp4"},
      {"key":"sj_14","text":"أَضْ   إِضْ   أُضْ","row":7,"displayCol":1,"audio":"sj_14.mp3","video":"sj_14.mp4"},
      {"key":"sj_15","text":"أَطْ   إِطْ   أُطْ","row":8,"displayCol":2,"audio":"sj_15.mp3","video":"sj_15.mp4"},
      {"key":"sj_16","text":"أَظْ   إِظْ   أُظْ","row":8,"displayCol":1,"audio":"sj_16.mp3","video":"sj_16.mp4"}
    ]
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
