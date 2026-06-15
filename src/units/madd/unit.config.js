// Madd Unit - Unit Authoring Config
// ------------------------------------------------------------
// This template is the preferred seed for cloned units.
// Keep it neutral: no source-unit content, no unit-specific media maps,
// and no hardcoded lesson assets outside madd placeholders.
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
    unitId: 'madd_listen',
    unitKey: 'madd',
    storagePrefix: 'madd_listen',
    keyPrefix: 'madd_'
  },

  moodle: {
    wsGetFunction: 'local_prequran_get_madd_listen_state',
    wsSetFunction: 'local_prequran_set_madd_listen_state'
  },

  release: {
    version: '1.0.0',
    assetVersion: 'madd-rules-20260531a'
  },

  localization: {
       "defaultLanguage": "en",
       "fallbackLanguage": "en",
       "defaultScope": "both",
       "supportedLanguages": [
         "en",
         "ar",
         "so",
         "sw",
         "pa",
         "ur"
       ],
       "translations": {
         "ar": {},
         "so": {},
         "sw": {},
         "pa": {},
         "ur": {}
       }
     },

  assets: {
       "cdnRoot": "/pre_quraan",
       "unitMediaRoot": "/lessons/madd/media",
       "filePrefix": "madd_",
       "videoFilePrefix": "madd_",
       "mediaPadWidth": 2,
       "audioExt": ".mp3",
       "soundAudioExt": ".mp3"
     },

  routes: {
    academyHomeUrl: 'https://quraan.academy/'
  },

  messaging: {
       "useConfigStepMessages": true,
       "disableLegacyCompletionFeedback": true
     },

  messageUi: {
       "titleText": "Message",
       "continueText": "Continue",
       "clap": {
         "enabled": true,
         "visual": true,
         "audio": "",
         "delayMs": 120
       }
     },

  stepNavigation: {
       "previous": {
         "enabled": true,
         "label": "Step Back",
         "title": "Go back one step",
         "confirmTitle": "Go back one step?",
         "confirmText": "This will move you back to {previousStep}. Your progress for {currentStep} and {previousStep} will be reset so you can try again.",
         "confirmContinueText": "Yes, go back",
         "confirmCancelText": "Stay here"
       }
     },

  steps: [
       {
         "id": "lecture",
         "type": "lecture",
         "label": "Lecture",
         "passFilters": [
           "all"
         ]
       },
       {
         "id": "rules",
         "type": "content",
         "label": "Rules",
         "actionLabel": "Complete Rules",
         "actionArabicLabel": "أكمل القواعد",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "القواعد"
       },
       {
         "id": "listen",
         "type": "playlist",
         "label": "Listen",
         "passFilters": [
           "all"
         ]
       },
       {
         "id": "watch",
         "type": "video_playlist",
         "label": "Watch",
         "passFilters": [
           "all"
         ]
       },
       {
         "id": "repeat",
         "type": "playlist",
         "label": "Repeat",
         "passFilters": [
           "all"
         ]
       },
       {
         "id": "trace1",
         "type": "trace",
         "label": "Write1",
         "passFilters": [
           "all"
         ]
       }
     ],

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
    }
  },

  filterSets: {
       "all": []
     },

  layout: {
       "layoutMode": "flow-span",
       "browserGridCols": 6,
       "mobileGridCols": 2,
       "sepFontSize": "4.5rem",
       "mobileSepFontSize": "3.2rem",
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
        "base": "/pre_quraan/messages/unit_steps/madd/",
        "manifest": "./unit.messages.js",
        "version": "madd-messages-v1.0.0"
      },
    audioMessages: {
      outOfLives: '',
      completed: ''
    }
  },

  playback: {
       "letterAudioMode": "name",
       "letterAudioSequenceGapMs": 120,
       "steps": {
         "listen": {
           "letterAudioMode": "name",
           "beforeStartMs": 500,
           "betweenLettersMs": 900,
           "afterCompleteMs": 500
         },
         "watch": {
           "letterAudioMode": "name",
           "beforeStartMs": 500,
           "betweenLettersMs": 900,
           "afterCompleteMs": 500
         },
         "repeat": {
           "letterAudioMode": "name",
           "beforeStartMs": 500,
           "betweenLettersMs": 1200,
           "afterCompleteMs": 500
         }
       }
     },

  messages: {
    base: '/pre_quraan/messages/unit_steps/madd/',
    manifest: './unit.messages.js',
    version: 'madd-messages-v0.1.0',
    entry: {},
    entryPasses: {},
    completion: {}
  },

  media: {
       "lectureUrl": "/pre_quraan/messages/lectures/madd_lecture.mp4",
       "voiceBases": {
         "child_boy": "/pre_quraan/lessons/madd/media/audio/male/",
         "child_girl": "/pre_quraan/lessons/madd/media/audio/male/",
         "adult_male": "/pre_quraan/lessons/madd/media/audio/male/",
         "adult_female": "/pre_quraan/lessons/madd/media/audio/male/"
       },
       "adultMaleAlphaBase": "/pre_quraan/lessons/madd/media/audio/male/",
       "l6Base": "/pre_quraan/lessons/madd/media/audio/male/",
       "audioBase": "/pre_quraan/lessons/madd/media/audio/male/",
       "fallbackAudioBase": "/pre_quraan/lessons/madd/media/audio/male/",
       "soundLetterAudioBase": "/pre_quraan/lessons/madd/media/audio/male/",
       "soundAudioBase": "/pre_quraan/lessons/madd/media/audio/male/",
       "watchBase": "/pre_quraan/lessons/madd/media/video/",
       "fallbackWatchBase": "/pre_quraan/lessons/madd/media/video/",
       "animateBase": "/pre_quraan/lessons/madd/media/animate/",
       "soundVideoBase": "/pre_quraan/lessons/madd/media/video/",
       "soundImageBase": "/pre_quraan/lessons/madd/media/sound/images/",
       "soundExplainerBase": "/pre_quraan/lessons/madd/media/sound/audio/"
     },

  write: {
       "passes": 3,
       "chunkSize": 10,
       "chunks": [
         {
           "id": "chunk1",
           "label": "Chunk 1",
           "start": 0,
           "end": 9
         },
         {
           "id": "chunk2",
           "label": "Chunk 2",
           "start": 10,
           "end": 19
         },
         {
           "id": "chunk3",
           "label": "Chunk 3",
           "start": 20,
           "end": 29
         }
       ],
       "rows": 5,
       "cols": 2,
       "fontScale": 0.9,
       "wideWords": [],
       "spanWords": {},
       "minPassesRequired": 3,
       "adapter": {
         "unitKey": "madd_listen",
         "buttonId": "btnTrace",
         "displayLabel": "Write"
       }
     },

  listenPlus: {
       "enabled": false,
       "imageBase": "/pre_quraan/lessons/madd/media/listen_plus/animals/images/",
       "audioBase": "/pre_quraan/lessons/madd/media/listen_plus/animals/audio/",
       "imageExt": ".png",
       "audioExt": ".mp3",
       "title": "Listen+",
       "subtitle": "Arabic sound + animal sound",
       "map": {}
     },

  words: {
       "enabled": false,
       "imageBase": "/pre_quraan/lessons/madd/media/words/images/",
       "audioBase": "/pre_quraan/lessons/madd/media/words/audio/",
       "imageExt": ".png",
       "audioExt": ".mp3",
       "title": "Words",
       "subtitle": "Arabic letter + Arabic word",
       "map": {}
     },

  settings: {
      "defaults": {
        "voice": "child_boy",
        "speed": "1.0",
        "repeat": "1",
        "filter": "all"
      },
      "speeds": [
        "Very Slow",
        "Slow",
        "Normal"
      ],
      "speedValues": [
        0.7,
        0.85,
        1
      ],
      "repeats": [
        1,
        2,
        3
      ]
    },

  writeLabelMap: [
      {
        "from": "Trace1",
        "to": "Write"
      },
      {
        "from": "Trace 1",
        "to": "Write"
      },
      {
        "from": "Trace",
        "to": "Write"
      }
    ],

  ui: {
      "pageTitle": "PQ Unit - Madd Unit",
      "headerTitle": "Madd Unit",
      "aboutLabel": "About Madd",
      "showDbSavedToast": false
    },

  uiText: {
      "playAll": "Play All",
      "pause": "Pause",
      "resume": "Resume",
      "speakPopup": {
        "okButton": "OK"
      }
    },

  defaults: {
      "voice": "child_boy",
      "speed": "1.0",
      "repeat": "1",
      "filter": "all"
    },

  content: {
    items: [
      {"key":"madd_1","text":"بٰ","row":1,"displayCol":6,"audio":"madd_01.mp3","video":"madd_01.mp4","small":"ب ٰ"},
      {"key":"madd_2","text":"ىٰ","row":1,"displayCol":5,"audio":"madd_02.mp3","video":"madd_02.mp4","small":"ى ٰ"},
      {"key":"madd_3","text":"رٰ","row":1,"displayCol":4,"audio":"madd_03.mp3","video":"madd_03.mp4","small":"ر ٰ"},
      {"key":"madd_4","text":"مٰ","row":1,"displayCol":3,"audio":"madd_04.mp3","video":"madd_04.mp4","small":"م ٰ"},
      {"key":"madd_5","text":"لٰ","row":1,"displayCol":2,"audio":"madd_05.mp3","video":"madd_05.mp4","small":"ل ٰ"},
      {"key":"madd_6","text":"وٰ","row":1,"displayCol":1,"audio":"madd_06.mp3","video":"madd_06.mp4","small":"و ٰ"},
      {"key":"madd_7","text":"نٰ","row":2,"displayCol":6,"audio":"madd_07.mp3","video":"madd_07.mp4","small":"ن ٰ"},
      {"key":"madd_8","text":"هٰ","row":2,"displayCol":5,"audio":"madd_08.mp3","video":"madd_08.mp4","small":"ه ٰ"},
      {"key":"madd_9","text":"هٰ","row":2,"displayCol":4,"audio":"madd_09.mp3","video":"madd_09.mp4","small":"ه ٰ"},
      {"key":"madd_10","text":"عٰ","row":2,"displayCol":3,"audio":"madd_10.mp3","video":"madd_10.mp4","small":"ع ٰ"},
      {"key":"madd_11","text":"حٰ","row":2,"displayCol":2,"audio":"madd_11.mp3","video":"madd_11.mp4","small":"ح ٰ"},
      {"key":"madd_12","text":"غٰ","row":2,"displayCol":1,"audio":"madd_12.mp3","video":"madd_12.mp4","small":"غ ٰ"},
      {"key":"madd_13","text":"خٰ","row":3,"displayCol":6,"audio":"madd_13.mp3","video":"madd_13.mp4","small":"خ ٰ"},
      {"key":"madd_14","text":"تٰ","row":3,"displayCol":5,"audio":"madd_14.mp3","video":"madd_14.mp4","small":"ت ٰ"},
      {"key":"madd_15","text":"ثٰ","row":3,"displayCol":4,"audio":"madd_15.mp3","video":"madd_15.mp4","small":"ث ٰ"},
      {"key":"madd_16","text":"جٰ","row":3,"displayCol":3,"audio":"madd_16.mp3","video":"madd_16.mp4","small":"ج ٰ"},
      {"key":"madd_17","text":"دٰ","row":3,"displayCol":2,"audio":"madd_17.mp3","video":"madd_17.mp4","small":"د ٰ"},
      {"key":"madd_18","text":"ذٰ","row":3,"displayCol":1,"audio":"madd_18.mp3","video":"madd_18.mp4","small":"ذ ٰ"},
      {"key":"madd_19","text":"زٰ","row":4,"displayCol":6,"audio":"madd_19.mp3","video":"madd_19.mp4","small":"ز ٰ"},
      {"key":"madd_20","text":"سٰ","row":4,"displayCol":5,"audio":"madd_20.mp3","video":"madd_20.mp4","small":"س ٰ"},
      {"key":"madd_21","text":"شٰ","row":4,"displayCol":4,"audio":"madd_21.mp3","video":"madd_21.mp4","small":"ش ٰ"},
      {"key":"madd_22","text":"صٰ","row":4,"displayCol":3,"audio":"madd_22.mp3","video":"madd_22.mp4","small":"ص ٰ"},
      {"key":"madd_23","text":"ضٰ","row":4,"displayCol":2,"audio":"madd_23.mp3","video":"madd_23.mp4","small":"ض ٰ"},
      {"key":"madd_24","text":"طٰ","row":4,"displayCol":1,"audio":"madd_24.mp3","video":"madd_24.mp4","small":"ط ٰ"},
      {"key":"madd_25","text":"ظٰ","row":5,"displayCol":6,"audio":"madd_25.mp3","video":"madd_25.mp4","small":"ظ ٰ"},
      {"key":"madd_26","text":"فٰ","row":5,"displayCol":5,"audio":"madd_26.mp3","video":"madd_26.mp4","small":"ف ٰ"},
      {"key":"madd_27","text":"قٰ","row":5,"displayCol":4,"audio":"madd_27.mp3","video":"madd_27.mp4","small":"ق ٰ"},
      {"key":"madd_28","text":"كٰ","row":5,"displayCol":3,"audio":"madd_28.mp3","video":"madd_28.mp4","small":"ك ٰ"},
      {"key":"madd_29","text":"اٖ","row":5,"displayCol":2,"audio":"madd_29.mp3","video":"madd_29.mp4","small":"ا ٖ"},
      {"key":"madd_30","text":"هٖ","row":5,"displayCol":1,"audio":"madd_30.mp3","video":"madd_30.mp4","small":"ه ٖ"}
    ]
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
