// Tashdeed Unit - Unit Authoring Config
// ------------------------------------------------------------
// This template is the preferred seed for cloned units.
// Keep it neutral: no source-unit content, no unit-specific media maps,
// and no hardcoded lesson assets outside tashdeed placeholders.
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
    unitId: 'tashdeed_shaddah_listen',
    unitKey: 'tashdeed',
    storagePrefix: 'tashdeed_shaddah_listen',
    keyPrefix: 'tash_'
  },

  moodle: {
    wsGetFunction: 'local_prequran_get_tashdeed_shaddah_listen_state',
    wsSetFunction: 'local_prequran_set_tashdeed_shaddah_listen_state'
  },

  release: {
    version: '1.0.0',
    assetVersion: 'tashdeed-rules-20260601a'
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
       "unitMediaRoot": "/lessons/tashdeed/media",
       "filePrefix": "tash_",
       "mediaPadWidth": 2,
       "audioExt": ".mp3",
       "soundAudioExt": ".mp3",
       "videoFilePrefix": "tash_"
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
         "label": "← Step",
         "title": "Go back one step",
         "confirmTitle": "Go back one step?",
         "confirmText": "This will move you back to {previousStep}. Your progress for {currentStep} and {previousStep} will be reset so you can try again.",
         "confirmContinueText": "Yes, go back",
         "confirmCancelText": "Stay here"
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
         "tash_1",
         "tash_2",
         "tash_3",
         "tash_4",
         "tash_5",
         "tash_6",
         "tash_7",
         "tash_8",
         "tash_9",
         "tash_10",
         "tash_11",
         "tash_12",
         "tash_13",
         "tash_14",
         "tash_15",
         "tash_16",
         "tash_17",
         "tash_18",
         "tash_19",
         "tash_20",
         "tash_21",
         "tash_22",
         "tash_23"
       ]
     },

  layout: {
       "layoutMode": "flow-span",
       "browserGridCols": 6,
       "mobileGridCols": 2,
       "sepFontSize": "3.4rem",
       "smallFontSize": "1rem",
       "mobileTileMinHeight": "140px",
       "mobileSepFontSize": "2.8rem",
       "mobileSmallFontSize": "0.95rem",
       "rtlColFromLtr": false,
       "width": "100%",
       "maxWidth": "100%",
       "columnGap": "10px",
       "rowGap": "10px",
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
       "messages": {
         "entry": {
           "lecture": {
             "text": "Welcome to the Tashdeed unit. Click Play Lecture and listen carefully before you begin."
           },
           "listen1": {
             "text": "Listen 1 is ready. Listen carefully to each Tashdeed word."
           },
           "listen2": {
             "text": "Listen 2 is ready. Listen again and focus on the shaddah sound."
           },
           "listen3": {
             "text": "Listen 3 is ready. Listen one more time and complete the practice."
           }
         },
         "entryPasses": {},
         "completion": {
           "listen3": {
             "text": "Congratulations. You have completed the Tashdeed unit."
           }
         }
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
    base: '/pre_quraan/messages/unit_steps/tashdeed/',
    manifest: './unit.messages.js',
    version: 'tashdeed-messages-v0.1.0',
    entry: {},
    entryPasses: {},
    completion: {}
  },

  media: {
       "audioBase": "/pre_quraan/lessons/tashdeed/media/audio/male/",
       "l6Base": "/pre_quraan/lessons/tashdeed/media/audio/male/",
       "fallbackAudioBase": "/pre_quraan/lessons/tashdeed/media/audio/male/",
       "watchBase": "tashdeed-video-not-provided/",
       "fallbackWatchBase": "tashdeed-video-not-provided/",
       "lectureUrl": "/pre_quraan/messages/lectures/tashdeed_lecture.mp4",
       "voiceBases": {
         "child_boy": "/pre_quraan/lessons/tashdeed/media/audio/male/",
         "child_girl": "",
         "adult_male": "/pre_quraan/lessons/tashdeed/media/audio/male/",
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
      unitKey: 'tashdeed_shaddah_listen',
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
    imageBase: '/pre_quraan/lessons/tashdeed/media/listen_plus/animals/images/',
    audioBase: '/pre_quraan/lessons/tashdeed/media/listen_plus/animals/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Listen+',
    subtitle: 'Arabic sound + animal sound',
    map: {}
  },

  words: {
    enabled: false,
    imageBase: '/pre_quraan/lessons/tashdeed/media/words/images/',
    audioBase: '/pre_quraan/lessons/tashdeed/media/words/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Words',
    subtitle: 'Arabic letter + Arabic word',
    map: {}
  },

  ui: {
      "pageTitle": "PQ Unit - Tashdeed Unit",
      "headerTitle": "Tashdeed Unit",
      "aboutLabel": "About Tashdeed",
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

  wordLimit: 23,

  content: {
    items: [
      {"key":"tash_1","text":"أَبَّ","row":1,"displayCol":1,"audio":"tash_01.mp3","video":"tash_01.mp4"},
      {"key":"tash_2","text":"أَبِّ","row":1,"displayCol":2,"audio":"tash_02.mp3","video":"tash_02.mp4"},
      {"key":"tash_3","text":"أَبُّ","row":1,"displayCol":3,"audio":"tash_03.mp3","video":"tash_03.mp4"},
      {"key":"tash_4","text":"إِبَّ","row":1,"displayCol":4,"audio":"tash_04.mp3","video":"tash_04.mp4"},
      {"key":"tash_5","text":"إِبِّ","row":1,"displayCol":5,"audio":"tash_05.mp3","video":"tash_05.mp4"},
      {"key":"tash_6","text":"إِبُّ","row":1,"displayCol":6,"audio":"tash_06.mp3","video":"tash_06.mp4"},
      {"key":"tash_7","text":"أُبَّ","row":2,"displayCol":1,"audio":"tash_07.mp3","video":"tash_07.mp4"},
      {"key":"tash_8","text":"أُبِّ","row":2,"displayCol":2,"audio":"tash_08.mp3","video":"tash_08.mp4"},
      {"key":"tash_9","text":"أُبُّ","row":2,"displayCol":3,"audio":"tash_09.mp3","video":"tash_09.mp4"},
      {"key":"tash_10","text":"أَبَّا","row":2,"displayCol":4,"audio":"tash_10.mp3","video":"tash_10.mp4"},
      {"key":"tash_11","text":"أَبٍّ","row":2,"displayCol":5,"audio":"tash_11.mp3","video":"tash_11.mp4"},
      {"key":"tash_12","text":"أَبٌّ","row":2,"displayCol":6,"audio":"tash_12.mp3","video":"tash_12.mp4"},
      {"key":"tash_13","text":"أِبًّا","row":3,"displayCol":1,"audio":"tash_13.mp3","video":"tash_13.mp4"},
      {"key":"tash_14","text":"أِبٍّ","row":3,"displayCol":2,"audio":"tash_14.mp3","video":"tash_14.mp4"},
      {"key":"tash_15","text":"أِبٌّ","row":3,"displayCol":3,"audio":"tash_15.mp3","video":"tash_15.mp4"},
      {"key":"tash_16","text":"أُبًّا","row":3,"displayCol":4,"audio":"tash_16.mp3","video":"tash_16.mp4"},
      {"key":"tash_17","text":"أُبٍّ","row":3,"displayCol":5,"audio":"tash_17.mp3","video":"tash_17.mp4"},
      {"key":"tash_18","text":"أُبٌّ","row":3,"displayCol":6,"audio":"tash_18.mp3","video":"tash_18.mp4"},
      {"key":"tash_19","text":"أَتَّ","row":4,"displayCol":1,"audio":"tash_19.mp3","video":"tash_19.mp4"},
      {"key":"tash_20","text":"أَتِّ","row":4,"displayCol":2,"audio":"tash_20.mp3","video":"tash_20.mp4"},
      {"key":"tash_21","text":"أَتُّ","row":4,"displayCol":3,"audio":"tash_21.mp3","video":"tash_21.mp4"},
      {"key":"tash_22","text":"أِتَّ","row":4,"displayCol":4,"audio":"tash_22.mp3","video":"tash_22.mp4"},
      {"key":"tash_23","text":"أِتِّ","row":4,"displayCol":5,"audio":"tash_23.mp3","video":"tash_23.mp4"}
    ]
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
