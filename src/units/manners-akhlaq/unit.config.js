// Manners Akhlaq Unit - Unit Authoring Config
// Seeded from Most Used Words clone shape with mak_ keys.

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
    "lessonId": "extras",
    "unitId": "manners_akhlaq",
    "unitKey": "manners-akhlaq",
    "storagePrefix": "manners_akhlaq",
    "keyPrefix": "mak_",
    "prefKey": "prequran_manners_akhlaq_state_v1"
  },
  "moodle": {
    "wsGetFunction": "local_prequran_get_manners_akhlaq_state",
    "wsSetFunction": "local_prequran_set_manners_akhlaq_state"
  },
  "release": {
    "version": "0.1.0",
    "assetVersion": "manners-akhlaq-clone-20260529a"
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
    "unitMediaRoot": "/lessons/manners-akhlaq/media",
    "filePrefix": "mak_",
    "mediaPadWidth": 2,
    "audioExt": ".mp3",
    "soundAudioExt": ".mp3",
    "videoFilePrefix": "mak_"
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
      "label": "← Step Back",
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
      "type": "lecture",
      "label": "Lecture",
      "arabicLabel": "شرح",
      "passFilters": [
        "all"
      ],
      "filter": "all"
    },
    {
      "id": "listen",
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
      "mak_01",
      "mak_02",
      "mak_03",
      "mak_04",
      "mak_05"
    ]
  },
  "layout": {
    "layoutMode": "flow-span",
    "browserGridCols": 4,
    "mobileGridCols": 2,
    "sepFontSize": 22,
    "cellAspectRatio": "1 / 1"
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
      "outOfLives": "You used all your lives. Let us try again.",
      "restarting": "Starting again...",
      "completed": "Great job! Match complete."
    },
    "audioMessages": {
      "outOfLives": "",
      "completed": ""
    }
  },
  "playback": {
    "letterAudioMode": "both",
    "letterAudioSequenceGapMs": 120,
    "steps": {
      "listen": {
        "letterAudioMode": "both",
        "beforeStartMs": 500,
        "betweenLettersMs": 900,
        "afterCompleteMs": 500
      },
      "watch": {
        "letterAudioMode": "both",
        "beforeStartMs": 500,
        "betweenLettersMs": 900,
        "afterCompleteMs": 500
      },
      "repeat": {
        "letterAudioMode": "both",
        "beforeStartMs": 500,
        "betweenLettersMs": 900,
        "afterCompleteMs": 500
      },
      "animate": {
        "letterAudioMode": "both",
        "beforeStartMs": 500,
        "betweenLettersMs": 700,
        "afterCompleteMs": 500
      },
      "write": {
        "letterAudioMode": "both"
      },
      "submit": {
        "recordingUpload": {
          "enabled": true,
          "required": true,
          "wsFunction": "local_prequran_save_submit_recording",
          "maxBytes": 6000000
        }
      }
    }
  },
  "messages": {
    "base": "/pre_quraan/messages/unit_steps/manners-akhlaq/",
    "manifest": "./unit.messages.js",
    "version": "manners-akhlaq-messages-v0.1.0",
    "entry": {},
    "entryPasses": {},
    "completion": {}
  },
  "media": {
    "lectureUrl": "/pre_quraan/messages/lectures/manners-akhlaq_lecture.mp4",
    "voiceBases": {
      "child_boy": "/pre_quraan/lessons/manners-akhlaq/media/audio/male/",
      "child_girl": "/pre_quraan/lessons/manners-akhlaq/media/audio/male/",
      "adult_male": "/pre_quraan/lessons/manners-akhlaq/media/audio/male/",
      "adult_female": "/pre_quraan/lessons/manners-akhlaq/media/audio/male/"
    },
    "adultMaleAlphaBase": "/pre_quraan/lessons/manners-akhlaq/media/audio/male/",
    "l6Base": "/pre_quraan/lessons/manners-akhlaq/media/audio/male/",
    "audioBase": "/pre_quraan/lessons/manners-akhlaq/media/audio/male/",
    "fallbackAudioBase": "/pre_quraan/lessons/manners-akhlaq/media/audio/male/",
    "fallbackWatchBase": "/pre_quraan/lessons/manners-akhlaq/media/video/",
    "watchBase": "/pre_quraan/lessons/manners-akhlaq/media/video/",
    "animateBase": "/pre_quraan/lessons/manners-akhlaq/media/video/"
  },
  "write": {
    "chunkSize": 32,
    "chunks": [
      32,
      32,
      32,
      29
    ],
    "rows": 8,
    "cols": 4,
    "wideWords": [],
    "spanWords": {},
    "minPassesRequired": 125,
    "adapter": {
      "unitKey": "most_used_words",
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
    "imageBase": "/pre_quraan/lessons/manners-akhlaq/media/listen_plus/animals/images/",
    "audioBase": "/pre_quraan/lessons/manners-akhlaq/media/listen_plus/animals/audio/",
    "imageExt": ".png",
    "audioExt": ".mp3",
    "title": "Listen+",
    "subtitle": "Arabic sound + animal sound",
    "map": {}
  },
  "words": {
    "enabled": false,
    "imageBase": "/pre_quraan/lessons/manners-akhlaq/media/words/images/",
    "audioBase": "/pre_quraan/lessons/manners-akhlaq/media/words/audio/",
    "imageExt": ".png",
    "audioExt": ".mp3",
    "title": "Words",
    "subtitle": "Arabic letter + Arabic word",
    "map": {}
  },
  "writeLabelMap": [
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
  "activeTileEffect": {
    "enabled": true,
    "mode": "bounceGlow",
    "durationMs": 900,
    "glow": true,
    "bounce": true,
    "dimOthers": false
  },
  "activeAudioAnimation": {
    "enabled": true,
    "type": "magic-ring-pop",
    "speedMs": 850,
    "scale": 1.14,
    "ringColor": "#ffb300"
  },
  "ui": {
    "pageTitle": "PQ Unit - Manners Akhlaq Unit",
    "headerTitle": "Manners Akhlaq Unit",
    "headerArabicTitle": "الأخلاق والآداب",
    "aboutLabel": "About Manners Akhlaq"
  },
  "defaults": {
    "voice": "child_boy",
    "speed": "1.0",
    "repeat": "1",
    "filter": "all"
  },
  "wordLimit": 5,
  "content": {
    "items": [
      {
        "key": "mak_01",
        "text": "الصدق",
        "ar": "الصدق",
        "small": "As-Sidq",
        "en": "Truthfulness",
        "transliteration": "As-Sidq",
        "meaning": "Truthfulness",
        "row": 1,
        "displayCol": 4,
        "audio": "mak_01.mp3",
        "video": "mak_01.mp4"
      },
      {
        "key": "mak_02",
        "text": "الأمانة",
        "ar": "الأمانة",
        "small": "Al-Amanah",
        "en": "Trustworthiness",
        "transliteration": "Al-Amanah",
        "meaning": "Trustworthiness",
        "row": 1,
        "displayCol": 3,
        "audio": "mak_02.mp3",
        "video": "mak_02.mp4"
      },
      {
        "key": "mak_03",
        "text": "بر الوالدين",
        "ar": "بر الوالدين",
        "small": "Birr Al-Walidayn",
        "en": "Honoring parents",
        "transliteration": "Birr Al-Walidayn",
        "meaning": "Honoring parents",
        "row": 1,
        "displayCol": 2,
        "audio": "mak_03.mp3",
        "video": "mak_03.mp4"
      },
      {
        "key": "mak_04",
        "text": "الإحسان",
        "ar": "الإحسان",
        "small": "Al-Ihsan",
        "en": "Kindness and excellence",
        "transliteration": "Al-Ihsan",
        "meaning": "Kindness and excellence",
        "row": 1,
        "displayCol": 1,
        "audio": "mak_04.mp3",
        "video": "mak_04.mp4"
      },
      {
        "key": "mak_05",
        "text": "الحياء",
        "ar": "الحياء",
        "small": "Al-Haya",
        "en": "Modesty",
        "transliteration": "Al-Haya",
        "meaning": "Modesty",
        "row": 2,
        "displayCol": 4,
        "audio": "mak_05.mp3",
        "video": "mak_05.mp4"
      }
    ]
  },
  "debug": {
    "showTileAudioNames": false
  },
  "trace": {
    "rows": 2,
    "minPassesRequired": 5
  },
  "audioMap": {
    "mak_01": "mak_01.mp3",
    "mak_02": "mak_02.mp3",
    "mak_03": "mak_03.mp3",
    "mak_04": "mak_04.mp3",
    "mak_05": "mak_05.mp3"
  },
  "watchVideoByKey": {
    "mak_01": "mak_01.mp4",
    "mak_02": "mak_02.mp4",
    "mak_03": "mak_03.mp4",
    "mak_04": "mak_04.mp4",
    "mak_05": "mak_05.mp4"
  },
  "animateVideoByKey": {
    "mak_01": "mak_01.mp4",
    "mak_02": "mak_02.mp4",
    "mak_03": "mak_03.mp4",
    "mak_04": "mak_04.mp4",
    "mak_05": "mak_05.mp4"
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
