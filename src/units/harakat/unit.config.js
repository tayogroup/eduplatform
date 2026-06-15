// Harakat Unit - Unit Authoring Config
// ------------------------------------------------------------
// This template is the preferred seed for cloned units.
// Keep it neutral: no source-unit content, no unit-specific media maps,
// and no hardcoded lesson assets outside harakat placeholders.
// Use tools/create-unit.js to replace placeholders, then fill content.items.

const __PQ_NORMALIZE_UNIT_CONFIG__ = (
  (typeof window !== 'undefined' && window.PQUnitConfigNormalizer) ||
  (typeof globalThis !== 'undefined' && globalThis.PQUnitConfigNormalizer)
);

if (!__PQ_NORMALIZE_UNIT_CONFIG__ || typeof __PQ_NORMALIZE_UNIT_CONFIG__.normalize !== 'function') {
  throw new Error('PQUnitConfigNormalizer must load before unit.config.js');
}

const UNIT_CFG = __PQ_NORMALIZE_UNIT_CONFIG__.normalize({
  "schemaVersion": 1,
  "identity": {
    "lessonId": "harakat_listen",
    "unitId": "harakat_listen",
    "unitKey": "harakat",
    "storagePrefix": "harakat_listen",
    "keyPrefix": "har_"
  },
  "moodle": {
    "wsGetFunction": "local_prequran_get_harakat_listen_state",
    "wsSetFunction": "local_prequran_set_harakat_listen_state"
  },
  "release": {
    "version": "0.1.0",
    "assetVersion": "harakat-rules-20260601b"
  },
  "localization": {
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
  "assets": {
    "cdnRoot": "/pre_quraan",
    "unitMediaRoot": "/lessons/harakat/media",
    "filePrefix": "har_",
    "mediaPadWidth": 2,
    "audioExt": ".mp3",
    "soundAudioExt": ".mp3",
    "videoFilePrefix": "har_"
  },
  "routes": {
    "academyHomeUrl": "https://quraan.academy/"
  },
  "messaging": {
    "useConfigStepMessages": true,
    "disableLegacyCompletionFeedback": true
  },
  "messageUi": {
    "titleText": "Message",
    "continueText": "Continue",
    "clap": {
      "enabled": true,
      "visual": true,
      "audio": "",
      "delayMs": 120
    }
  },
  "stepNavigation": {
    "previous": {
      "enabled": true,
      "label": "Step Back ←",
      "title": "Go back one step",
      "confirmTitle": "Go back one step?",
      "confirmText": "This will move you back to {previousStep}. Your progress for {currentStep} and {previousStep} will be reset so you can try again.",
      "confirmContinueText": "Yes, go back",
      "confirmCancelText": "Stay here"
    }
  },
  "steps": [
    {
      "id": "lecture",
      "step_index": 1,
      "type": "lecture",
      "label": "Lecture",
      "arabicLabel": "شرح",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    },    {
      "id": "rules",
      "step_index": 2,
      "type": "content",
      "label": "Rules",
      "arabicLabel": "القواعد",
      "actionLabel": "Complete Rules",
      "actionArabicLabel": "أكمل القواعد",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    },
    {
      "id": "diacritic",
            "step_index": 3,
      "type": "video_playlist",
      "label": "Diacritic",
      "arabicLabel": "الحركات",
      "passFilters": [
        "diacritic"
      ],
      "filter": "diacritic"
    },
    {
      "id": "listen",
            "step_index": 4,
      "type": "playlist",
      "label": "Listen",
      "arabicLabel": "استمع",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    },
    {
      "id": "watch",
            "step_index": 5,
      "type": "video_playlist",
      "label": "Watch",
      "arabicLabel": "شاهد",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    },
    {
      "id": "repeat",
            "step_index": 6,
      "type": "playlist",
      "label": "Repeat",
      "arabicLabel": "كرر",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    },
    {
      "id": "match",
            "step_index": 7,
      "type": "match",
      "label": "Match",
      "arabicLabel": "طابق",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    },
    {
      "id": "animate",
            "step_index": 8,
      "type": "animate",
      "label": "Animate",
      "arabicLabel": "شاهد الكتابة",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    },
    {
      "id": "write",
            "step_index": 9,
      "type": "write",
      "label": "Write",
      "arabicLabel": "اكتب",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    },
    {
      "id": "submit",
            "step_index": 10,
      "type": "submit",
      "label": "Submit",
      "arabicLabel": "أرسل",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    }
  ],
  "filterSets": {
    "all": [
      "har_01",
      "har_02",
      "har_03",
      "har_04",
      "har_05",
      "har_06",
      "har_07",
      "har_08",
      "har_09",
      "har_10",
      "har_11",
      "har_12",
      "har_13",
      "har_14",
      "har_15",
      "har_16",
      "har_17",
      "har_18",
      "har_19",
      "har_20",
      "har_21",
      "har_22",
      "har_23",
      "har_24",
      "har_25",
      "har_26",
      "har_27",
      "har_28"
    ],
    "heavy": [
      "har_07",
      "har_14",
      "har_15",
      "har_16",
      "har_17",
      "har_19",
      "har_21"
    ],
    "light": [
      "har_01",
      "har_02",
      "har_03",
      "har_04",
      "har_05",
      "har_06",
      "har_08",
      "har_09",
      "har_10",
      "har_11",
      "har_12",
      "har_13",
      "har_18",
      "har_20",
      "har_22",
      "har_23",
      "har_24",
      "har_25",
      "har_26",
      "har_27",
      "har_28"
    ],
    "alifaa": [
      "har_02",
      "har_03",
      "har_04",
      "har_06",
      "har_07",
      "har_10",
      "har_11",
      "har_16",
      "har_17",
      "har_20",
      "har_26",
      "har_27",
      "har_28"
    ],
    "vowel": [
      "har_01",
      "har_27",
      "har_28"
    ],
    "diacritic": [
      "har_dia_01",
      "har_dia_02",
      "har_dia_03",
      "har_dia_04",
      "har_dia_05",
      "har_dia_06",
      "har_dia_07",
      "har_dia_08",
      "har_dia_09",
      "har_dia_10",
      "har_dia_11",
      "har_dia_12",
      "har_dia_13",
      "har_dia_14",
      "har_dia_15"
    ]
  },
  "layout": {
    "layoutMode": "flow-span",
    "browserGridCols": 4,
    "mobileGridCols": 2,
    "sepFontSize": "6.5rem",
    "smallFontSize": "0.95rem",
    "mobileTileMinHeight": "132px",
    "mobileSepFontSize": "5.4rem",
    "mobileSmallFontSize": "0.9rem",
    "rtlColFromLtr": false,
    "width": "100%",
    "maxWidth": "100%",
    "columnGap": "12px",
    "rowGap": "12px",
    "minTileWidth": "0px"
  },
  "focusBadge": {
    "label": "Try to Focus",
    "icon": "✨"
  },
  "rewardBar": {
    "progressLabel": "Progress",
    "unitsDoneLabel": "Units Done",
    "totalStarsLabel": "Total Stars",
    "thisUnitLabel": "This Unit"
  },
  "stepperUi": {
    "stepPrefix": "Step",
    "progressLabel": "Progress"
  },
  "match": {
    "lives": 5,
    "maxGames": 3,
    "completeWhenMaxGamesUsed": true,
    "correctDwellMs": 900,
    "wrongDwellMs": 900,
    "autoAdvanceMs": 0,
    "shuffle": true,
    "reshuffleEvery": 3,
    "maxWrongPerLetter": 3,
    "autoPlayPrompt": true,
    "failEndsStep": false,
    "soundFeedback": true,
    "soundVolume": 0.35,
    "showCorrectTargetOnWrong": true,
    "showStatusText": true,
    "showPopups": true,
    "popupDwellMs": 1400,
    "minCorrectToPass": 0.6,
    "messages": {
      "base": "/pre_quraan/messages/unit_steps/harakat/",
      "manifest": "./unit.messages.js",
      "version": "harakat-messages-v0.1.0",
      "entry": {},
      "entryPasses": {},
      "completion": {}
    },
    "audioMessages": {
      "outOfLives": "",
      "completed": ""
    }
  },
  "playback": {
    "letterAudioMode": "sound",
    "letterAudioSequenceGapMs": 120,
    "steps": {
      "listen": {
        "letterAudioMode": "sound",
        "beforeStartMs": 500,
        "betweenLettersMs": 900,
        "afterCompleteMs": 500
      },
      "watch": {
        "letterAudioMode": "sound",
        "beforeStartMs": 500,
        "betweenLettersMs": 900,
        "afterCompleteMs": 500
      },
      "repeat": {
        "letterAudioMode": "sound",
        "beforeStartMs": 500,
        "betweenLettersMs": 900,
        "afterCompleteMs": 500
      },
      "animate": {
        "letterAudioMode": "sound",
        "beforeStartMs": 500,
        "betweenLettersMs": 700,
        "afterCompleteMs": 500
      },
      "write": {
        "letterAudioMode": "sound"
      },
      "submit": {
        "recordingUpload": {
          "enabled": true,
          "required": true,
          "wsFunction": "local_prequran_save_submit_recording",
          "maxBytes": 6000000
        }
      },
      "diacritic": {
        "beforeStartMs": 350,
        "betweenLettersMs": 650,
        "afterCompleteMs": 500,
        "videoPlaybackRate": 1
      }
    }
  },
  "messages": {
    "base": "/pre_quraan/messages/unit_steps/harakat/",
    "manifest": "./unit.messages.js",
    "version": "harakat-messages-v0.1.0",
    "entry": {
      "rules": {
        "title": "Rules",
        "body": "Read the Diacritics and Harakat rules carefully. Learn Harakat, Sukun, Shaddah, Tanween, Madd, and heavy and light letters, then click Complete Rules."
      },
      "diacritic": {
        "title": "Diacritic",
        "body": "Watch each Arabic diacritic and notice its sound mark."
      }
    },
    "entryPasses": {},
    "completion": {
      "rules": {
        "title": "Rules complete",
        "body": "Great reading. Continue to the Diacritic step."
      },
      "diacritic": {
        "title": "Diacritic complete",
        "body": "Good watching. Continue to listening."
      }
    }
  },
  "media": {
    "lectureUrl": "/pre_quraan/messages/lectures/harakat_lecture.mp4",
    "audioBase": "/pre_quraan/lessons/harakat/media/audio/male/",
    "l6Base": "/pre_quraan/lessons/harakat/media/audio/male/",
    "fallbackAudioBase": "/pre_quraan/lessons/harakat/media/audio/male/",
    "watchBase": "/pre_quraan/lessons/harakat/media/video/",
    "fallbackWatchBase": "/pre_quraan/lessons/harakat/media/video/",
    "animateBase": "/pre_quraan/lessons/harakat/media/video/",
    "voiceBases": {
      "child_boy": "/pre_quraan/lessons/harakat/media/audio/male/",
      "child_girl": "/pre_quraan/lessons/harakat/media/audio/male/",
      "adult_male": "/pre_quraan/lessons/harakat/media/audio/male/",
      "adult_female": "/pre_quraan/lessons/harakat/media/audio/male/"
    }
  },
  "write": {
    "chunkSize": 28,
    "chunks": [
      28
    ],
    "rows": 1,
    "cols": 1,
    "wideWords": [],
    "spanWords": {},
    "minPassesRequired": 1,
    "adapter": {
      "unitKey": "harakat_listen",
      "buttonId": "btnTrace",
      "displayLabel": "Write"
    },
    "canvas": {
      "width": 800,
      "height": 320,
      "borderColor": "#e7dbc1",
      "borderRadius": "10px",
      "inkColor": "#0d223a",
      "inkWidth": 8,
      "guide": {
        "top": 110,
        "mid": 150,
        "base": 205,
        "bottom": 260,
        "sidePadding": 24,
        "topColor": "#e8e2cf",
        "midColor": "#e0d6bc",
        "baseColor": "#d5c8a2",
        "bottomColor": "#e8e2cf",
        "midDash": [
          14,
          10
        ]
      },
      "ghostText": {
        "color": "#10223a",
        "alpha": 0.18,
        "normalFontPx": 74,
        "wideFontPx": 50
      }
    }
  },
  "listenPlus": {
    "enabled": false,
    "imageBase": "/pre_quraan/lessons/harakat/media/listen_plus/animals/images/",
    "audioBase": "/pre_quraan/lessons/harakat/media/listen_plus/animals/audio/",
    "imageExt": ".png",
    "audioExt": ".mp3",
    "title": "Listen+",
    "subtitle": "Arabic sound + animal sound",
    "map": {}
  },
  "words": {
    "enabled": false,
    "imageBase": "/pre_quraan/lessons/harakat/media/words/images/",
    "audioBase": "/pre_quraan/lessons/harakat/media/words/audio/",
    "imageExt": ".png",
    "audioExt": ".mp3",
    "title": "Words",
    "subtitle": "Arabic letter + Arabic word",
    "map": {}
  },
  "ui": {
    "pageTitle": "PQ Unit - Harakat Unit",
    "headerTitle": "Harakat Unit",
    "aboutLabel": "About Harakat",
    "showDbSavedToast": false
  },
  "stepInjection": {
    "watch": false,
    "speak": false,
    "submit": false,
    "beforeListen": [    {
      "id": "rules",
      "step_index": 2,
      "type": "content",
      "label": "Rules",
      "arabicLabel": "القواعد",
      "actionLabel": "Complete Rules",
      "actionArabicLabel": "أكمل القواعد",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    },
      {
        "id": "diacritic",
            "step_index": 3,
        "type": "video_playlist",
        "label": "Diacritic",
        "arabicLabel": "الحركات",
        "passFilters": [
          "diacritic"
        ],
        "filter": "diacritic"
      }
    ]
  },
  "defaults": {
    "voice": "child_boy",
    "speed": "1.0",
    "repeat": "1",
    "filter": "all"
  },
  "wordLimit": 43,
  "content": {
    "items": [
      {
        "key": "har_01",
        "legacyKey": "alif",
        "text": "ا",
        "ar": "ا",
        "small": "Alif",
        "en": "Alif",
        "row": 1,
        "displayCol": 1,
        "audio": "har_01.mp3",
        "video": "har_01.mp4",
        "filterType": "Vowel",
        "legacyAudio": "l02_02.mp3",
        "legacyVideo": "ا.mp4"
      },
      {
        "key": "har_02",
        "legacyKey": "ba",
        "text": "ب",
        "ar": "ب",
        "small": "Baa",
        "en": "Baa",
        "row": 1,
        "displayCol": 2,
        "audio": "har_02.mp3",
        "video": "har_02.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_03.mp3",
        "legacyVideo": "ب.mp4"
      },
      {
        "key": "har_03",
        "legacyKey": "ta",
        "text": "ت",
        "ar": "ت",
        "small": "Taa",
        "en": "Taa",
        "row": 1,
        "displayCol": 3,
        "audio": "har_03.mp3",
        "video": "har_03.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_04.mp3",
        "legacyVideo": "ت.mp4"
      },
      {
        "key": "har_04",
        "legacyKey": "tha",
        "text": "ث",
        "ar": "ث",
        "small": "Saa",
        "en": "Saa",
        "row": 1,
        "displayCol": 4,
        "audio": "har_04.mp3",
        "video": "har_04.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_05.mp3",
        "legacyVideo": "ث.mp4"
      },
      {
        "key": "har_05",
        "legacyKey": "jim",
        "text": "ج",
        "ar": "ج",
        "small": "Jeem",
        "en": "Jeem",
        "row": 2,
        "displayCol": 1,
        "audio": "har_05.mp3",
        "video": "har_05.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_06.mp3",
        "legacyVideo": "ج.mp4"
      },
      {
        "key": "har_06",
        "legacyKey": "ha2",
        "text": "ح",
        "ar": "ح",
        "small": "Haa",
        "en": "Haa",
        "row": 2,
        "displayCol": 2,
        "audio": "har_06.mp3",
        "video": "har_06.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_07.mp3",
        "legacyVideo": "ح.mp4"
      },
      {
        "key": "har_07",
        "legacyKey": "kha",
        "text": "خ",
        "ar": "خ",
        "small": "Khaa",
        "en": "Khaa",
        "row": 2,
        "displayCol": 3,
        "audio": "har_07.mp3",
        "video": "har_07.mp4",
        "filterType": "Heavy",
        "legacyAudio": "l02_08.mp3",
        "legacyVideo": "خ.mp4"
      },
      {
        "key": "har_08",
        "legacyKey": "dal",
        "text": "د",
        "ar": "د",
        "small": "Daal",
        "en": "Daal",
        "row": 2,
        "displayCol": 4,
        "audio": "har_08.mp3",
        "video": "har_08.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_09.mp3",
        "legacyVideo": "د.mp4"
      },
      {
        "key": "har_09",
        "legacyKey": "dhal",
        "text": "ذ",
        "ar": "ذ",
        "small": "Zaal",
        "en": "Zaal",
        "row": 3,
        "displayCol": 1,
        "audio": "har_09.mp3",
        "video": "har_09.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_10.mp3",
        "legacyVideo": "ذ.mp4"
      },
      {
        "key": "har_10",
        "legacyKey": "ra",
        "text": "ر",
        "ar": "ر",
        "small": "Raa",
        "en": "Raa",
        "row": 3,
        "displayCol": 2,
        "audio": "har_10.mp3",
        "video": "har_10.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_11.mp3",
        "legacyVideo": "ر.mp4"
      },
      {
        "key": "har_11",
        "legacyKey": "zay",
        "text": "ز",
        "ar": "ز",
        "small": "Zaa",
        "en": "Zaa",
        "row": 3,
        "displayCol": 3,
        "audio": "har_11.mp3",
        "video": "har_11.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_12.mp3",
        "legacyVideo": "ز.mp4"
      },
      {
        "key": "har_12",
        "legacyKey": "sin",
        "text": "س",
        "ar": "س",
        "small": "Seen",
        "en": "Seen",
        "row": 3,
        "displayCol": 4,
        "audio": "har_12.mp3",
        "video": "har_12.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_13.mp3",
        "legacyVideo": "س.mp4"
      },
      {
        "key": "har_13",
        "legacyKey": "shin",
        "text": "ش",
        "ar": "ش",
        "small": "Sheen",
        "en": "Sheen",
        "row": 4,
        "displayCol": 1,
        "audio": "har_13.mp3",
        "video": "har_13.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_14.mp3",
        "legacyVideo": "ش.mp4"
      },
      {
        "key": "har_14",
        "legacyKey": "sad",
        "text": "ص",
        "ar": "ص",
        "small": "Suaad",
        "en": "Suaad",
        "row": 4,
        "displayCol": 2,
        "audio": "har_14.mp3",
        "video": "har_14.mp4",
        "filterType": "Heavy",
        "legacyAudio": "l02_15.mp3",
        "legacyVideo": "ص.mp4"
      },
      {
        "key": "har_15",
        "legacyKey": "dad",
        "text": "ض",
        "ar": "ض",
        "small": "Duaad",
        "en": "Duaad",
        "row": 4,
        "displayCol": 3,
        "audio": "har_15.mp3",
        "video": "har_15.mp4",
        "filterType": "Heavy",
        "legacyAudio": "l02_16.mp3",
        "legacyVideo": "ض.mp4"
      },
      {
        "key": "har_16",
        "legacyKey": "ta2",
        "text": "ط",
        "ar": "ط",
        "small": "Taa heavy",
        "en": "Taa heavy",
        "row": 4,
        "displayCol": 4,
        "audio": "har_16.mp3",
        "video": "har_16.mp4",
        "filterType": "Heavy",
        "legacyAudio": "l02_17.mp3",
        "legacyVideo": "ط.mp4"
      },
      {
        "key": "har_17",
        "legacyKey": "za2",
        "text": "ظ",
        "ar": "ظ",
        "small": "Dhaa",
        "en": "Dhaa",
        "row": 5,
        "displayCol": 1,
        "audio": "har_17.mp3",
        "video": "har_17.mp4",
        "filterType": "Heavy",
        "legacyAudio": "l02_18.mp3",
        "legacyVideo": "ظ.mp4"
      },
      {
        "key": "har_18",
        "legacyKey": "ayn",
        "text": "ع",
        "ar": "ع",
        "small": "Ayn",
        "en": "Ayn",
        "row": 5,
        "displayCol": 2,
        "audio": "har_18.mp3",
        "video": "har_18.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_19.mp3",
        "legacyVideo": "ع.mp4"
      },
      {
        "key": "har_19",
        "legacyKey": "ghain",
        "text": "غ",
        "ar": "غ",
        "small": "Ghayn",
        "en": "Ghayn",
        "row": 5,
        "displayCol": 3,
        "audio": "har_19.mp3",
        "video": "har_19.mp4",
        "filterType": "Heavy",
        "legacyAudio": "l02_20.mp3",
        "legacyVideo": "غ.mp4"
      },
      {
        "key": "har_20",
        "legacyKey": "fa",
        "text": "ف",
        "ar": "ف",
        "small": "Faa",
        "en": "Faa",
        "row": 5,
        "displayCol": 4,
        "audio": "har_20.mp3",
        "video": "har_20.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_21.mp3",
        "legacyVideo": "ف.mp4"
      },
      {
        "key": "har_21",
        "legacyKey": "qaf",
        "text": "ق",
        "ar": "ق",
        "small": "Qaf",
        "en": "Qaf",
        "row": 6,
        "displayCol": 1,
        "audio": "har_21.mp3",
        "video": "har_21.mp4",
        "filterType": "Heavy",
        "legacyAudio": "l02_22.mp3",
        "legacyVideo": "ق.mp4"
      },
      {
        "key": "har_22",
        "legacyKey": "kaf",
        "text": "ك",
        "ar": "ك",
        "small": "Kaaf",
        "en": "Kaaf",
        "row": 6,
        "displayCol": 2,
        "audio": "har_22.mp3",
        "video": "har_22.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_23.mp3",
        "legacyVideo": "ك.mp4"
      },
      {
        "key": "har_23",
        "legacyKey": "lam",
        "text": "ل",
        "ar": "ل",
        "small": "Laam",
        "en": "Laam",
        "row": 6,
        "displayCol": 3,
        "audio": "har_23.mp3",
        "video": "har_23.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_24.mp3",
        "legacyVideo": "ل.mp4"
      },
      {
        "key": "har_24",
        "legacyKey": "mim",
        "text": "م",
        "ar": "م",
        "small": "Meem",
        "en": "Meem",
        "row": 6,
        "displayCol": 4,
        "audio": "har_24.mp3",
        "video": "har_24.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_25.mp3",
        "legacyVideo": "م.mp4"
      },
      {
        "key": "har_25",
        "legacyKey": "nun",
        "text": "ن",
        "ar": "ن",
        "small": "Noon",
        "en": "Noon",
        "row": 7,
        "displayCol": 1,
        "audio": "har_25.mp3",
        "video": "har_25.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_26.mp3",
        "legacyVideo": "ن.mp4"
      },
      {
        "key": "har_26",
        "legacyKey": "ha",
        "text": "ه",
        "ar": "ه",
        "small": "Haa",
        "en": "Haa",
        "row": 7,
        "displayCol": 2,
        "audio": "har_26.mp3",
        "video": "har_26.mp4",
        "filterType": "Light",
        "legacyAudio": "l02_27.mp3",
        "legacyVideo": "ه.mp4"
      },
      {
        "key": "har_27",
        "legacyKey": "waw",
        "text": "و",
        "ar": "و",
        "small": "Waw",
        "en": "Waw",
        "row": 7,
        "displayCol": 3,
        "audio": "har_27.mp3",
        "video": "har_27.mp4",
        "filterType": "Vowel",
        "legacyAudio": "l02_28.mp3",
        "legacyVideo": "و.mp4"
      },
      {
        "key": "har_28",
        "legacyKey": "ya",
        "text": "ي",
        "ar": "ي",
        "small": "Yaa",
        "en": "Yaa",
        "row": 7,
        "displayCol": 4,
        "audio": "har_28.mp3",
        "video": "har_28.mp4",
        "filterType": "Vowel",
        "legacyAudio": "l02_29.mp3",
        "legacyVideo": "ي.mp4"
      },
      {
        "key": "har_dia_01",
        "legacyKey": "dammah",
        "text": "◌ُ",
        "ar": "◌ُ",
        "small": "Dammah",
        "en": "Dammah",
        "row": 1,
        "displayCol": 1,
        "audio": "har_dia_01.mp3",
        "video": "har_dia_01.mp4",
        "filterType": "Diacritic",
        "hint": "Short u",
        "legacyVideo": "dammah.mp4"
      },
      {
        "key": "har_dia_02",
        "legacyKey": "kasrah",
        "text": "◌ِ",
        "ar": "◌ِ",
        "small": "Kasrah",
        "en": "Kasrah",
        "row": 1,
        "displayCol": 2,
        "audio": "har_dia_02.mp3",
        "video": "har_dia_02.mp4",
        "filterType": "Diacritic",
        "hint": "Short i",
        "legacyVideo": "kasrah.mp4"
      },
      {
        "key": "har_dia_03",
        "legacyKey": "fatha",
        "text": "◌َ",
        "ar": "◌َ",
        "small": "Fatha",
        "en": "Fatha",
        "row": 1,
        "displayCol": 3,
        "audio": "har_dia_03.mp3",
        "video": "har_dia_03.mp4",
        "filterType": "Diacritic",
        "hint": "Short a",
        "legacyVideo": "fatha.mp4"
      },
      {
        "key": "har_dia_04",
        "legacyKey": "dhammatain",
        "text": "◌ٌ",
        "ar": "◌ٌ",
        "small": "Dhammatain",
        "en": "Dhammatain",
        "row": 1,
        "displayCol": 4,
        "audio": "har_dia_04.mp3",
        "video": "har_dia_04.mp4",
        "filterType": "Diacritic",
        "hint": "un",
        "legacyVideo": "dammatain.mp4"
      },
      {
        "key": "har_dia_05",
        "legacyKey": "kasratain",
        "text": "◌ٍ",
        "ar": "◌ٍ",
        "small": "Kasratain",
        "en": "Kasratain",
        "row": 2,
        "displayCol": 1,
        "audio": "har_dia_05.mp3",
        "video": "har_dia_05.mp4",
        "filterType": "Diacritic",
        "hint": "in",
        "legacyVideo": "kasratain.mp4"
      },
      {
        "key": "har_dia_06",
        "legacyKey": "fathatain",
        "text": "◌ً",
        "ar": "◌ً",
        "small": "Fathatain",
        "en": "Fathatain",
        "row": 2,
        "displayCol": 2,
        "audio": "har_dia_06.mp3",
        "video": "har_dia_06.mp4",
        "filterType": "Diacritic",
        "hint": "an",
        "legacyVideo": "fathatain.mp4"
      },
      {
        "key": "har_dia_07",
        "legacyKey": "sukun",
        "text": "◌ْ",
        "ar": "◌ْ",
        "small": "Sukun",
        "en": "Sukun",
        "row": 2,
        "displayCol": 3,
        "audio": "har_dia_07.mp3",
        "video": "har_dia_07.mp4",
        "filterType": "Diacritic",
        "hint": "No vowel",
        "legacyVideo": "sukun.mp4"
      },
      {
        "key": "har_dia_08",
        "legacyKey": "shaddah",
        "text": "◌ّ",
        "ar": "◌ّ",
        "small": "Shaddah",
        "en": "Shaddah",
        "row": 2,
        "displayCol": 4,
        "audio": "har_dia_08.mp3",
        "video": "har_dia_08.mp4",
        "filterType": "Diacritic",
        "hint": "Double letter",
        "legacyVideo": "shaddah.mp4"
      },
      {
        "key": "har_dia_09",
        "legacyKey": "maddah",
        "text": "◌ٓ",
        "ar": "◌ٓ",
        "small": "Maddah",
        "en": "Maddah",
        "row": 3,
        "displayCol": 1,
        "audio": "har_dia_09.mp3",
        "video": "har_dia_09.mp4",
        "filterType": "Diacritic",
        "hint": "Long stretch",
        "legacyVideo": "maddah.mp4"
      },
      {
        "key": "har_dia_10",
        "legacyKey": "dagger_alif",
        "text": "◌ٰ",
        "ar": "◌ٰ",
        "small": "Dagger Alif",
        "en": "Dagger Alif",
        "row": 3,
        "displayCol": 2,
        "audio": "har_dia_10.mp3",
        "video": "har_dia_10.mp4",
        "filterType": "Diacritic",
        "hint": "Small alif",
        "legacyVideo": "dagger_alif.mp4"
      },
      {
        "key": "har_dia_11",
        "legacyKey": "alif_waslah",
        "text": "ٱ",
        "ar": "ٱ",
        "small": "Alif Waslah",
        "en": "Alif Waslah",
        "row": 3,
        "displayCol": 3,
        "audio": "har_dia_11.mp3",
        "video": "har_dia_11.mp4",
        "filterType": "Diacritic",
        "hint": "Connecting alif",
        "legacyVideo": "alif_waslah.mp4"
      },
      {
        "key": "har_dia_12",
        "legacyKey": "alif_maqsuura",
        "text": "ى",
        "ar": "ى",
        "small": "Alif Maqsuura",
        "en": "Alif Maqsuura",
        "row": 3,
        "displayCol": 4,
        "audio": "har_dia_12.mp3",
        "video": "har_dia_12.mp4",
        "filterType": "Diacritic",
        "hint": "Final alif",
        "legacyVideo": "alif_maqsuura.mp4"
      },
      {
        "key": "har_dia_13",
        "legacyKey": "taa_marbuuta",
        "text": "ة",
        "ar": "ة",
        "small": "Taa Marbuuta",
        "en": "Taa Marbuuta",
        "row": 4,
        "displayCol": 1,
        "audio": "har_dia_13.mp3",
        "video": "har_dia_13.mp4",
        "filterType": "Diacritic",
        "hint": "Final 't'",
        "legacyVideo": "taa_marbuuda.mp4"
      },
      {
        "key": "har_dia_14",
        "legacyKey": "hamza",
        "text": "ء",
        "ar": "ء",
        "small": "Hamza",
        "en": "Hamza",
        "row": 4,
        "displayCol": 2,
        "audio": "har_dia_14.mp3",
        "video": "har_dia_14.mp4",
        "filterType": "Diacritic",
        "hint": "Glottal stop",
        "legacyVideo": "hamsa.mp4"
      },
      {
        "key": "har_dia_15",
        "legacyKey": "hamza_wasl",
        "text": "ٱ",
        "ar": "ٱ",
        "small": "Hamza Wasl",
        "en": "Hamza Wasl",
        "row": 4,
        "displayCol": 3,
        "audio": "har_dia_15.mp3",
        "video": "har_dia_15.mp4",
        "filterType": "Diacritic",
        "hint": "Linking hamza",
        "legacyVideo": "hamsa_lwasli.mp4"
      }
    ]
  },
  "stepOrder": {
    "lecture": 0,
    "rules": 1,
    "diacritic": 2,
    "listen": 3,
    "watch": 4,
    "repeat": 5,
    "match": 6,
    "animate": 7,
    "write": 8,
    "submit": 9
  },
  "audioMap": {
    "har_01": "har_01.mp3",
    "har_02": "har_02.mp3",
    "har_03": "har_03.mp3",
    "har_04": "har_04.mp3",
    "har_05": "har_05.mp3",
    "har_06": "har_06.mp3",
    "har_07": "har_07.mp3",
    "har_08": "har_08.mp3",
    "har_09": "har_09.mp3",
    "har_10": "har_10.mp3",
    "har_11": "har_11.mp3",
    "har_12": "har_12.mp3",
    "har_13": "har_13.mp3",
    "har_14": "har_14.mp3",
    "har_15": "har_15.mp3",
    "har_16": "har_16.mp3",
    "har_17": "har_17.mp3",
    "har_18": "har_18.mp3",
    "har_19": "har_19.mp3",
    "har_20": "har_20.mp3",
    "har_21": "har_21.mp3",
    "har_22": "har_22.mp3",
    "har_23": "har_23.mp3",
    "har_24": "har_24.mp3",
    "har_25": "har_25.mp3",
    "har_26": "har_26.mp3",
    "har_27": "har_27.mp3",
    "har_28": "har_28.mp3",
    "har_dia_01": "har_dia_01.mp3",
    "har_dia_02": "har_dia_02.mp3",
    "har_dia_03": "har_dia_03.mp3",
    "har_dia_04": "har_dia_04.mp3",
    "har_dia_05": "har_dia_05.mp3",
    "har_dia_06": "har_dia_06.mp3",
    "har_dia_07": "har_dia_07.mp3",
    "har_dia_08": "har_dia_08.mp3",
    "har_dia_09": "har_dia_09.mp3",
    "har_dia_10": "har_dia_10.mp3",
    "har_dia_11": "har_dia_11.mp3",
    "har_dia_12": "har_dia_12.mp3",
    "har_dia_13": "har_dia_13.mp3",
    "har_dia_14": "har_dia_14.mp3",
    "har_dia_15": "har_dia_15.mp3"
  },
  "watchVideoByKey": {
    "har_01": "har_01.mp4",
    "har_02": "har_02.mp4",
    "har_03": "har_03.mp4",
    "har_04": "har_04.mp4",
    "har_05": "har_05.mp4",
    "har_06": "har_06.mp4",
    "har_07": "har_07.mp4",
    "har_08": "har_08.mp4",
    "har_09": "har_09.mp4",
    "har_10": "har_10.mp4",
    "har_11": "har_11.mp4",
    "har_12": "har_12.mp4",
    "har_13": "har_13.mp4",
    "har_14": "har_14.mp4",
    "har_15": "har_15.mp4",
    "har_16": "har_16.mp4",
    "har_17": "har_17.mp4",
    "har_18": "har_18.mp4",
    "har_19": "har_19.mp4",
    "har_20": "har_20.mp4",
    "har_21": "har_21.mp4",
    "har_22": "har_22.mp4",
    "har_23": "har_23.mp4",
    "har_24": "har_24.mp4",
    "har_25": "har_25.mp4",
    "har_26": "har_26.mp4",
    "har_27": "har_27.mp4",
    "har_28": "har_28.mp4",
    "har_dia_01": "har_dia_01.mp4",
    "har_dia_02": "har_dia_02.mp4",
    "har_dia_03": "har_dia_03.mp4",
    "har_dia_04": "har_dia_04.mp4",
    "har_dia_05": "har_dia_05.mp4",
    "har_dia_06": "har_dia_06.mp4",
    "har_dia_07": "har_dia_07.mp4",
    "har_dia_08": "har_dia_08.mp4",
    "har_dia_09": "har_dia_09.mp4",
    "har_dia_10": "har_dia_10.mp4",
    "har_dia_11": "har_dia_11.mp4",
    "har_dia_12": "har_dia_12.mp4",
    "har_dia_13": "har_dia_13.mp4",
    "har_dia_14": "har_dia_14.mp4",
    "har_dia_15": "har_dia_15.mp4"
  },
  "animateVideoByKey": {
    "har_01": "har_01.mp4",
    "har_02": "har_02.mp4",
    "har_03": "har_03.mp4",
    "har_04": "har_04.mp4",
    "har_05": "har_05.mp4",
    "har_06": "har_06.mp4",
    "har_07": "har_07.mp4",
    "har_08": "har_08.mp4",
    "har_09": "har_09.mp4",
    "har_10": "har_10.mp4",
    "har_11": "har_11.mp4",
    "har_12": "har_12.mp4",
    "har_13": "har_13.mp4",
    "har_14": "har_14.mp4",
    "har_15": "har_15.mp4",
    "har_16": "har_16.mp4",
    "har_17": "har_17.mp4",
    "har_18": "har_18.mp4",
    "har_19": "har_19.mp4",
    "har_20": "har_20.mp4",
    "har_21": "har_21.mp4",
    "har_22": "har_22.mp4",
    "har_23": "har_23.mp4",
    "har_24": "har_24.mp4",
    "har_25": "har_25.mp4",
    "har_26": "har_26.mp4",
    "har_27": "har_27.mp4",
    "har_28": "har_28.mp4",
    "har_dia_01": "har_dia_01.mp4",
    "har_dia_02": "har_dia_02.mp4",
    "har_dia_03": "har_dia_03.mp4",
    "har_dia_04": "har_dia_04.mp4",
    "har_dia_05": "har_dia_05.mp4",
    "har_dia_06": "har_dia_06.mp4",
    "har_dia_07": "har_dia_07.mp4",
    "har_dia_08": "har_dia_08.mp4",
    "har_dia_09": "har_dia_09.mp4",
    "har_dia_10": "har_dia_10.mp4",
    "har_dia_11": "har_dia_11.mp4",
    "har_dia_12": "har_dia_12.mp4",
    "har_dia_13": "har_dia_13.mp4",
    "har_dia_14": "har_dia_14.mp4",
    "har_dia_15": "har_dia_15.mp4"
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}





