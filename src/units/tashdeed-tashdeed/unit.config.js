// Tashdeed Tashdeed Unit - Unit Authoring Config
// ------------------------------------------------------------
// This template is the preferred seed for cloned units.
// Keep it neutral: no source-unit content, no unit-specific media maps,
// and no hardcoded lesson assets outside tashdeed-tashdeed placeholders.
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
    unitId: 'tashdeed_tashdeed_listen',
    unitKey: 'tashdeed-tashdeed',
    storagePrefix: 'tashdeed_tashdeed_listen',
    keyPrefix: 'ttd_'
  },

  moodle: {
    wsGetFunction: 'local_prequran_get_tashdeed_tashdeed_listen_state',
    wsSetFunction: 'local_prequran_set_tashdeed_tashdeed_listen_state'
  },

  release: {
    version: '1.0.0',
    assetVersion: 'tashdeed-tashdeed-rules-20260601a'
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
       "unitMediaRoot": "/lessons/tashdeed-tashdeed/media",
       "filePrefix": "ttd_",
       "mediaPadWidth": 2,
       "audioExt": ".mp3",
       "soundAudioExt": ".mp3",
       "videoFilePrefix": "ttd_"
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
         "ttd_1",
         "ttd_2",
         "ttd_3",
         "ttd_4",
         "ttd_5",
         "ttd_6",
         "ttd_7",
         "ttd_8",
         "ttd_9",
         "ttd_10"
       ]
     },

  layout: {
       "layoutMode": "flow-span",
       "browserGridCols": 4,
       "mobileGridCols": 1,
       "sepFontSize": "2.8rem",
       "smallFontSize": "1rem",
       "mobileTileMinHeight": "128px",
       "mobileSepFontSize": "2.3rem",
       "mobileSmallFontSize": "0.95rem",
       "rtlColFromLtr": false,
       "width": "100%",
       "maxWidth": "100%",
       "columnGap": "12px",
       "rowGap": "12px",
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
             "text": "Welcome to the Tashdeed Tashdeed unit. Click Play Lecture and listen carefully before you begin."
           },
           "listen1": {
             "text": "Listen 1 is ready. Listen carefully to each Tashdeed Tashdeed word."
           },
           "listen2": {
             "text": "Listen 2 is ready. Listen again and focus on the repeated shaddah sounds."
           },
           "listen3": {
             "text": "Listen 3 is ready. Listen one more time and complete the practice."
           }
         },
         "entryPasses": {},
         "completion": {
           "listen3": {
             "text": "Congratulations. You have completed the Tashdeed Tashdeed unit."
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
    base: '/pre_quraan/messages/unit_steps/tashdeed-tashdeed/',
    manifest: './unit.messages.js',
    version: 'tashdeed-tashdeed-messages-v0.1.0',
    entry: {},
    entryPasses: {},
    completion: {}
  },

  media: {
       "audioBase": "/pre_quraan/lessons/tashdeed-tashdeed/media/audio/male/",
       "l6Base": "/pre_quraan/lessons/tashdeed-tashdeed/media/audio/male/",
       "fallbackAudioBase": "/pre_quraan/lessons/tashdeed-tashdeed/media/audio/male/",
       "watchBase": "tashdeed-tashdeed-video-not-provided/",
       "fallbackWatchBase": "tashdeed-tashdeed-video-not-provided/",
       "lectureUrl": "/pre_quraan/messages/lectures/tashdeed-tashdeed_lecture.mp4",
       "voiceBases": {
         "child_boy": "/pre_quraan/lessons/tashdeed-tashdeed/media/audio/male/",
         "child_girl": "",
         "adult_male": "/pre_quraan/lessons/tashdeed-tashdeed/media/audio/male/",
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
      unitKey: 'tashdeed_tashdeed_listen',
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
    imageBase: '/pre_quraan/lessons/tashdeed-tashdeed/media/listen_plus/animals/images/',
    audioBase: '/pre_quraan/lessons/tashdeed-tashdeed/media/listen_plus/animals/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Listen+',
    subtitle: 'Arabic sound + animal sound',
    map: {}
  },

  words: {
    enabled: false,
    imageBase: '/pre_quraan/lessons/tashdeed-tashdeed/media/words/images/',
    audioBase: '/pre_quraan/lessons/tashdeed-tashdeed/media/words/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Words',
    subtitle: 'Arabic letter + Arabic word',
    map: {}
  },

  ui: {
      "pageTitle": "PQ Unit - Tashdeed Tashdeed Unit",
      "headerTitle": "Tashdeed Tashdeed Unit",
      "aboutLabel": "About Tashdeed Tashdeed",
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

  wordLimit: 10,

  content: {
    items: [
      {"key":"ttd_1","text":"يَزَّكىّٰ","row":1,"displayCol":1,"span":1,"audio":"ttd_01.mp3","video":"ttd_01.mp4"},
      {"key":"ttd_2","text":"يزَّكَّرُ","row":1,"displayCol":2,"span":1,"audio":"ttd_02.mp3","video":"ttd_02.mp4"},
      {"key":"ttd_3","text":"اَلْمُدَّثِّرُ","row":1,"displayCol":3,"span":1,"audio":"ttd_03.mp3","video":"ttd_03.mp4"},
      {"key":"ttd_4","text":"اَلْمُزَّمِّل","row":1,"displayCol":4,"span":1,"audio":"ttd_04.mp3","video":"ttd_04.mp4"},
      {"key":"ttd_5","text":"عِلِّيِّيْنَ","row":2,"displayCol":1,"span":1,"audio":"ttd_05.mp3","video":"ttd_05.mp4"},
      {"key":"ttd_6","text":"عِلِّيُّوْنَ","row":2,"displayCol":2,"span":1,"audio":"ttd_06.mp3","video":"ttd_06.mp4"},
      {"key":"ttd_7","text":"اِنَّ  الَّذِيْنَ","row":2,"displayCol":3,"span":2,"audio":"ttd_07.mp3","video":"ttd_07.mp4"},
      {"key":"ttd_8","text":"اِلَّا  الَّذِيْنَ","row":3,"displayCol":1,"span":2,"audio":"ttd_08.mp3","video":"ttd_08.mp4"},
      {"key":"ttd_9","text":"مِنْ  شَرِّ  ٱلشَّقَّةِ","row":3,"displayCol":3,"span":2,"audio":"ttd_09.mp3","video":"ttd_09.mp4"},
      {"key":"ttd_10","text":"فَعَّالٌ  لِّمَا  يُرِيدُ","row":4,"displayCol":1,"span":3,"audio":"ttd_10.mp3","video":"ttd_10.mp4"}
    ]
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
