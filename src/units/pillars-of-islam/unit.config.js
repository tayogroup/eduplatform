// Pillars of Islam Unit - Unit Authoring Config
// Seeded from Most Used Words clone shape with poi_ keys.

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
    "unitId": "pillars_of_islam",
    "unitKey": "pillars-of-islam",
    "storagePrefix": "pillars_of_islam",
    "keyPrefix": "poi_",
    "prefKey": "prequran_pillars_of_islam_state_v1"
  },
  "moodle": {
    "wsGetFunction": "local_prequran_get_pillars_of_islam_state",
    "wsSetFunction": "local_prequran_set_pillars_of_islam_state"
  },
  "release": {
    "version": "0.1.0",
    "assetVersion": "pillars-of-islam-clone-20260529a"
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
    "unitMediaRoot": "/lessons/pillars-of-islam/media",
    "filePrefix": "poi_",
    "mediaPadWidth": 2,
    "audioExt": ".mp3",
    "soundAudioExt": ".mp3",
    "videoFilePrefix": "poi_"
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
      "poi_01",
      "poi_02",
      "poi_03",
      "poi_04",
      "poi_05"
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
    "base": "/pre_quraan/messages/unit_steps/pillars-of-islam/",
    "manifest": "./unit.messages.js",
    "version": "pillars-of-islam-messages-v0.1.0",
    "entry": {},
    "entryPasses": {},
    "completion": {}
  },
  "media": {
    "lectureUrl": "/pre_quraan/messages/lectures/pillars-of-islam_lecture.mp4",
    "voiceBases": {
      "child_boy": "/pre_quraan/lessons/pillars-of-islam/media/audio/male/",
      "child_girl": "/pre_quraan/lessons/pillars-of-islam/media/audio/male/",
      "adult_male": "/pre_quraan/lessons/pillars-of-islam/media/audio/male/",
      "adult_female": "/pre_quraan/lessons/pillars-of-islam/media/audio/male/"
    },
    "adultMaleAlphaBase": "/pre_quraan/lessons/pillars-of-islam/media/audio/male/",
    "l6Base": "/pre_quraan/lessons/pillars-of-islam/media/audio/male/",
    "audioBase": "/pre_quraan/lessons/pillars-of-islam/media/audio/male/",
    "fallbackAudioBase": "/pre_quraan/lessons/pillars-of-islam/media/audio/male/",
    "fallbackWatchBase": "/pre_quraan/lessons/pillars-of-islam/media/video/",
    "watchBase": "/pre_quraan/lessons/pillars-of-islam/media/video/",
    "animateBase": "/pre_quraan/lessons/pillars-of-islam/media/video/"
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
    "imageBase": "/pre_quraan/lessons/pillars-of-islam/media/listen_plus/animals/images/",
    "audioBase": "/pre_quraan/lessons/pillars-of-islam/media/listen_plus/animals/audio/",
    "imageExt": ".png",
    "audioExt": ".mp3",
    "title": "Listen+",
    "subtitle": "Arabic sound + animal sound",
    "map": {}
  },
  "words": {
    "enabled": false,
    "imageBase": "/pre_quraan/lessons/pillars-of-islam/media/words/images/",
    "audioBase": "/pre_quraan/lessons/pillars-of-islam/media/words/audio/",
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
    "pageTitle": "PQ Unit - Pillars of Islam Unit",
    "headerTitle": "Pillars of Islam Unit",
    "headerArabicTitle": "أركان الإسلام",
    "aboutLabel": "About Pillars of Islam"
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
        "key": "poi_01",
        "text": "الشهادتان",
        "ar": "الشهادتان",
        "small": "Ash-Shahadatayn",
        "en": "The testimony of faith",
        "transliteration": "Ash-Shahadatayn",
        "meaning": "The testimony of faith",
        "row": 1,
        "displayCol": 4,
        "audio": "poi_01.mp3",
        "video": "poi_01.mp4"
      },
      {
        "key": "poi_02",
        "text": "الصلاة",
        "ar": "الصلاة",
        "small": "As-Salah",
        "en": "Prayer",
        "transliteration": "As-Salah",
        "meaning": "Prayer",
        "row": 1,
        "displayCol": 3,
        "audio": "poi_02.mp3",
        "video": "poi_02.mp4"
      },
      {
        "key": "poi_03",
        "text": "الزكاة",
        "ar": "الزكاة",
        "small": "Az-Zakah",
        "en": "Charity",
        "transliteration": "Az-Zakah",
        "meaning": "Charity",
        "row": 1,
        "displayCol": 2,
        "audio": "poi_03.mp3",
        "video": "poi_03.mp4"
      },
      {
        "key": "poi_04",
        "text": "الصوم",
        "ar": "الصوم",
        "small": "As-Sawm",
        "en": "Fasting",
        "transliteration": "As-Sawm",
        "meaning": "Fasting",
        "row": 1,
        "displayCol": 1,
        "audio": "poi_04.mp3",
        "video": "poi_04.mp4"
      },
      {
        "key": "poi_05",
        "text": "الحج",
        "ar": "الحج",
        "small": "Al-Hajj",
        "en": "Pilgrimage",
        "transliteration": "Al-Hajj",
        "meaning": "Pilgrimage",
        "row": 2,
        "displayCol": 4,
        "audio": "poi_05.mp3",
        "video": "poi_05.mp4"
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
    "poi_01": "poi_01.mp3",
    "poi_02": "poi_02.mp3",
    "poi_03": "poi_03.mp3",
    "poi_04": "poi_04.mp3",
    "poi_05": "poi_05.mp3"
  },
  "watchVideoByKey": {
    "poi_01": "poi_01.mp4",
    "poi_02": "poi_02.mp4",
    "poi_03": "poi_03.mp4",
    "poi_04": "poi_04.mp4",
    "poi_05": "poi_05.mp4"
  },
  "animateVideoByKey": {
    "poi_01": "poi_01.mp4",
    "poi_02": "poi_02.mp4",
    "poi_03": "poi_03.mp4",
    "poi_04": "poi_04.mp4",
    "poi_05": "poi_05.mp4"
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
