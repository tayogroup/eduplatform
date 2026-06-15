// Pillars of Faith Unit - Unit Authoring Config
// Seeded from Most Used Words clone shape with pof_ keys.

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
    "unitId": "pillars_of_faith",
    "unitKey": "pillars-of-faith",
    "storagePrefix": "pillars_of_faith",
    "keyPrefix": "pof_",
    "prefKey": "prequran_pillars_of_faith_state_v1"
  },
  "moodle": {
    "wsGetFunction": "local_prequran_get_pillars_of_faith_state",
    "wsSetFunction": "local_prequran_set_pillars_of_faith_state"
  },
  "release": {
    "version": "0.1.0",
    "assetVersion": "pillars-of-faith-clone-20260529a"
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
    "unitMediaRoot": "/lessons/pillars-of-faith/media",
    "filePrefix": "pof_",
    "mediaPadWidth": 2,
    "audioExt": ".mp3",
    "soundAudioExt": ".mp3",
    "videoFilePrefix": "pof_"
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
      "pof_01",
      "pof_02",
      "pof_03",
      "pof_04",
      "pof_05",
      "pof_06"
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
    "base": "/pre_quraan/messages/unit_steps/pillars-of-faith/",
    "manifest": "./unit.messages.js",
    "version": "pillars-of-faith-messages-v0.1.0",
    "entry": {},
    "entryPasses": {},
    "completion": {}
  },
  "media": {
    "lectureUrl": "/pre_quraan/messages/lectures/pillars-of-faith_lecture.mp4",
    "voiceBases": {
      "child_boy": "/pre_quraan/lessons/pillars-of-faith/media/audio/male/",
      "child_girl": "/pre_quraan/lessons/pillars-of-faith/media/audio/male/",
      "adult_male": "/pre_quraan/lessons/pillars-of-faith/media/audio/male/",
      "adult_female": "/pre_quraan/lessons/pillars-of-faith/media/audio/male/"
    },
    "adultMaleAlphaBase": "/pre_quraan/lessons/pillars-of-faith/media/audio/male/",
    "l6Base": "/pre_quraan/lessons/pillars-of-faith/media/audio/male/",
    "audioBase": "/pre_quraan/lessons/pillars-of-faith/media/audio/male/",
    "fallbackAudioBase": "/pre_quraan/lessons/pillars-of-faith/media/audio/male/",
    "fallbackWatchBase": "/pre_quraan/lessons/pillars-of-faith/media/video/",
    "watchBase": "/pre_quraan/lessons/pillars-of-faith/media/video/",
    "animateBase": "/pre_quraan/lessons/pillars-of-faith/media/video/"
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
    "imageBase": "/pre_quraan/lessons/pillars-of-faith/media/listen_plus/animals/images/",
    "audioBase": "/pre_quraan/lessons/pillars-of-faith/media/listen_plus/animals/audio/",
    "imageExt": ".png",
    "audioExt": ".mp3",
    "title": "Listen+",
    "subtitle": "Arabic sound + animal sound",
    "map": {}
  },
  "words": {
    "enabled": false,
    "imageBase": "/pre_quraan/lessons/pillars-of-faith/media/words/images/",
    "audioBase": "/pre_quraan/lessons/pillars-of-faith/media/words/audio/",
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
    "pageTitle": "PQ Unit - Pillars of Faith Unit",
    "headerTitle": "Pillars of Faith Unit",
    "headerArabicTitle": "أركان الإيمان",
    "aboutLabel": "About Pillars of Faith"
  },
  "defaults": {
    "voice": "child_boy",
    "speed": "1.0",
    "repeat": "1",
    "filter": "all"
  },
  "wordLimit": 6,
  "content": {
    "items": [
      {
        "key": "pof_01",
        "text": "الإيمان بالله",
        "ar": "الإيمان بالله",
        "small": "Iman Billah",
        "en": "Belief in Allah",
        "transliteration": "Iman Billah",
        "meaning": "Belief in Allah",
        "row": 1,
        "displayCol": 4,
        "audio": "pof_01.mp3",
        "video": "pof_01.mp4"
      },
      {
        "key": "pof_02",
        "text": "الإيمان بالملائكة",
        "ar": "الإيمان بالملائكة",
        "small": "Iman Bil-Malaikah",
        "en": "Belief in the angels",
        "transliteration": "Iman Bil-Malaikah",
        "meaning": "Belief in the angels",
        "row": 1,
        "displayCol": 3,
        "audio": "pof_02.mp3",
        "video": "pof_02.mp4"
      },
      {
        "key": "pof_03",
        "text": "الإيمان بالكتب",
        "ar": "الإيمان بالكتب",
        "small": "Iman Bil-Kutub",
        "en": "Belief in the books",
        "transliteration": "Iman Bil-Kutub",
        "meaning": "Belief in the books",
        "row": 1,
        "displayCol": 2,
        "audio": "pof_03.mp3",
        "video": "pof_03.mp4"
      },
      {
        "key": "pof_04",
        "text": "الإيمان بالرسل",
        "ar": "الإيمان بالرسل",
        "small": "Iman Bir-Rusul",
        "en": "Belief in the messengers",
        "transliteration": "Iman Bir-Rusul",
        "meaning": "Belief in the messengers",
        "row": 1,
        "displayCol": 1,
        "audio": "pof_04.mp3",
        "video": "pof_04.mp4"
      },
      {
        "key": "pof_05",
        "text": "الإيمان باليوم الآخر",
        "ar": "الإيمان باليوم الآخر",
        "small": "Iman Bil-Yawm Al-Akhir",
        "en": "Belief in the Last Day",
        "transliteration": "Iman Bil-Yawm Al-Akhir",
        "meaning": "Belief in the Last Day",
        "row": 2,
        "displayCol": 4,
        "audio": "pof_05.mp3",
        "video": "pof_05.mp4"
      },
      {
        "key": "pof_06",
        "text": "الإيمان بالقدر",
        "ar": "الإيمان بالقدر",
        "small": "Iman Bil-Qadar",
        "en": "Belief in divine decree",
        "transliteration": "Iman Bil-Qadar",
        "meaning": "Belief in divine decree",
        "row": 2,
        "displayCol": 3,
        "audio": "pof_06.mp3",
        "video": "pof_06.mp4"
      }
    ]
  },
  "debug": {
    "showTileAudioNames": false
  },
  "trace": {
    "rows": 2,
    "minPassesRequired": 6
  },
  "audioMap": {
    "pof_01": "pof_01.mp3",
    "pof_02": "pof_02.mp3",
    "pof_03": "pof_03.mp3",
    "pof_04": "pof_04.mp3",
    "pof_05": "pof_05.mp3",
    "pof_06": "pof_06.mp3"
  },
  "watchVideoByKey": {
    "pof_01": "pof_01.mp4",
    "pof_02": "pof_02.mp4",
    "pof_03": "pof_03.mp4",
    "pof_04": "pof_04.mp4",
    "pof_05": "pof_05.mp4",
    "pof_06": "pof_06.mp4"
  },
  "animateVideoByKey": {
    "pof_01": "pof_01.mp4",
    "pof_02": "pof_02.mp4",
    "pof_03": "pof_03.mp4",
    "pof_04": "pof_04.mp4",
    "pof_05": "pof_05.mp4",
    "pof_06": "pof_06.mp4"
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
