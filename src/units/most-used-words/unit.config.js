// Most Used Words Unit - Unit Authoring Config
// Arabic labels use the user-provided 125-word list with harakat.

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
    "unitId": "most_used_words",
    "unitKey": "most-used-words",
    "storagePrefix": "most_used_words",
    "keyPrefix": "muw_"
  },
  "moodle": {
    "wsGetFunction": "local_prequran_get_most_used_words_state",
    "wsSetFunction": "local_prequran_set_most_used_words_state"
  },
  "release": {
    "version": "0.1.0",
    "assetVersion": "most-used-words-clone-20260529d"
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
    "unitMediaRoot": "/lessons/most-used-words/media",
    "filePrefix": "muw_",
    "mediaPadWidth": 2,
    "audioExt": ".mp3",
    "soundAudioExt": ".mp3",
    "videoFilePrefix": "muw_"
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
      "muw_01",
      "muw_02",
      "muw_03",
      "muw_04",
      "muw_05",
      "muw_06",
      "muw_07",
      "muw_08",
      "muw_09",
      "muw_10",
      "muw_11",
      "muw_12",
      "muw_13",
      "muw_14",
      "muw_15",
      "muw_16",
      "muw_17",
      "muw_18",
      "muw_19",
      "muw_20",
      "muw_21",
      "muw_22",
      "muw_23",
      "muw_24",
      "muw_25",
      "muw_26",
      "muw_27",
      "muw_28",
      "muw_29",
      "muw_30",
      "muw_31",
      "muw_32",
      "muw_33",
      "muw_34",
      "muw_35",
      "muw_36",
      "muw_37",
      "muw_38",
      "muw_39",
      "muw_40",
      "muw_41",
      "muw_42",
      "muw_43",
      "muw_44",
      "muw_45",
      "muw_46",
      "muw_47",
      "muw_48",
      "muw_49",
      "muw_50",
      "muw_51",
      "muw_52",
      "muw_53",
      "muw_54",
      "muw_55",
      "muw_56",
      "muw_57",
      "muw_58",
      "muw_59",
      "muw_60",
      "muw_61",
      "muw_62",
      "muw_63",
      "muw_64",
      "muw_65",
      "muw_66",
      "muw_67",
      "muw_68",
      "muw_69",
      "muw_70",
      "muw_71",
      "muw_72",
      "muw_73",
      "muw_74",
      "muw_75",
      "muw_76",
      "muw_77",
      "muw_78",
      "muw_79",
      "muw_80",
      "muw_81",
      "muw_82",
      "muw_83",
      "muw_84",
      "muw_85",
      "muw_86",
      "muw_87",
      "muw_88",
      "muw_89",
      "muw_90",
      "muw_91",
      "muw_92",
      "muw_93",
      "muw_94",
      "muw_95",
      "muw_96",
      "muw_97",
      "muw_98",
      "muw_99",
      "muw_100",
      "muw_101",
      "muw_102",
      "muw_103",
      "muw_104",
      "muw_105",
      "muw_106",
      "muw_107",
      "muw_108",
      "muw_109",
      "muw_110",
      "muw_111",
      "muw_112",
      "muw_113",
      "muw_114",
      "muw_115",
      "muw_116",
      "muw_117",
      "muw_118",
      "muw_119",
      "muw_120",
      "muw_121",
      "muw_122",
      "muw_123",
      "muw_124",
      "muw_125"
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
    "base": "/pre_quraan/messages/unit_steps/most-used-words/",
    "manifest": "./unit.messages.js",
    "version": "most-used-words-messages-v0.1.0",
    "entry": {},
    "entryPasses": {},
    "completion": {}
  },
  "media": {
    "lectureUrl": "/pre_quraan/messages/lectures/most-used-words_lecture.mp4",
    "voiceBases": {
      "child_boy": "/pre_quraan/lessons/most-used-words/media/audio/male/",
      "child_girl": "/pre_quraan/lessons/most-used-words/media/audio/male/",
      "adult_male": "/pre_quraan/lessons/most-used-words/media/audio/male/",
      "adult_female": "/pre_quraan/lessons/most-used-words/media/audio/male/"
    },
    "adultMaleAlphaBase": "/pre_quraan/lessons/most-used-words/media/audio/male/",
    "l6Base": "/pre_quraan/lessons/most-used-words/media/audio/male/",
    "audioBase": "/pre_quraan/lessons/most-used-words/media/audio/male/",
    "fallbackAudioBase": "/pre_quraan/lessons/most-used-words/media/audio/male/",
    "fallbackWatchBase": "/pre_quraan/lessons/most-used-words/media/video/",
    "watchBase": "/pre_quraan/lessons/most-used-words/media/video/",
    "animateBase": "/pre_quraan/lessons/most-used-words/media/video/"
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
    "imageBase": "/pre_quraan/lessons/most-used-words/media/listen_plus/animals/images/",
    "audioBase": "/pre_quraan/lessons/most-used-words/media/listen_plus/animals/audio/",
    "imageExt": ".png",
    "audioExt": ".mp3",
    "title": "Listen+",
    "subtitle": "Arabic sound + animal sound",
    "map": {}
  },
  "words": {
    "enabled": false,
    "imageBase": "/pre_quraan/lessons/most-used-words/media/words/images/",
    "audioBase": "/pre_quraan/lessons/most-used-words/media/words/audio/",
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
    "pageTitle": "PQ Unit - Most Used Words Unit",
    "headerTitle": "Most Used Words Unit",
    "headerArabicTitle": "الكلمات الأكثر استخداما",
    "aboutLabel": "About Most Used Words"
  },
  "defaults": {
    "voice": "child_boy",
    "speed": "1.0",
    "repeat": "1",
    "filter": "all"
  },
  "wordLimit": 125,
  "content": {
    "items": [
      {
        "key": "muw_01",
        "text": "اللَّهُ",
        "ar": "اللَّهُ",
        "small": "Allah",
        "en": "Al-lah",
        "row": 1,
        "displayCol": 4,
        "audio": "muw_01.mp3",
        "video": "muw_01.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_02",
        "text": "الشَّيْطَانُ",
        "ar": "الشَّيْطَانُ",
        "small": "Satan",
        "en": "Ash-shaytan",
        "row": 1,
        "displayCol": 3,
        "audio": "muw_02.mp3",
        "video": "muw_02.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_03",
        "text": "هُوَ",
        "ar": "هُوَ",
        "small": "he",
        "en": "huwa",
        "row": 1,
        "displayCol": 2,
        "audio": "muw_03.mp3",
        "video": "muw_03.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_04",
        "text": "هُمْ",
        "ar": "هُمْ",
        "small": "they",
        "en": "hum",
        "row": 1,
        "displayCol": 1,
        "audio": "muw_04.mp3",
        "video": "muw_04.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_05",
        "text": "أَنْتَ",
        "ar": "أَنْتَ",
        "small": "you",
        "en": "anta",
        "row": 2,
        "displayCol": 4,
        "audio": "muw_05.mp3",
        "video": "muw_05.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_06",
        "text": "أَنْتُمْ",
        "ar": "أَنْتُمْ",
        "small": "you all",
        "en": "antum",
        "row": 2,
        "displayCol": 3,
        "audio": "muw_06.mp3",
        "video": "muw_06.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_07",
        "text": "أَنَا",
        "ar": "أَنَا",
        "small": "I",
        "en": "ana",
        "row": 2,
        "displayCol": 2,
        "audio": "muw_07.mp3",
        "video": "muw_07.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_08",
        "text": "نَحْنُ",
        "ar": "نَحْنُ",
        "small": "we",
        "en": "nahnu",
        "row": 2,
        "displayCol": 1,
        "audio": "muw_08.mp3",
        "video": "muw_08.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_09",
        "text": "مَنْ",
        "ar": "مَنْ",
        "small": "who",
        "en": "man",
        "row": 3,
        "displayCol": 4,
        "audio": "muw_09.mp3",
        "video": "muw_09.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_10",
        "text": "هَلْ",
        "ar": "هَلْ",
        "small": "is / do / are",
        "en": "hal",
        "row": 3,
        "displayCol": 3,
        "audio": "muw_10.mp3",
        "video": "muw_10.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_11",
        "text": "خَيْرٌ",
        "ar": "خَيْرٌ",
        "small": "best",
        "en": "khayr",
        "row": 3,
        "displayCol": 2,
        "audio": "muw_11.mp3",
        "video": "muw_11.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_12",
        "text": "اسْمٌ",
        "ar": "اسْمٌ",
        "small": "name",
        "en": "ism",
        "row": 3,
        "displayCol": 1,
        "audio": "muw_12.mp3",
        "video": "muw_12.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_13",
        "text": "الرَّحْمٰنُ",
        "ar": "الرَّحْمٰنُ",
        "small": "the Most Gracious",
        "en": "Ar-Rahman",
        "row": 4,
        "displayCol": 4,
        "audio": "muw_13.mp3",
        "video": "muw_13.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_14",
        "text": "الرَّحِيمُ",
        "ar": "الرَّحِيمُ",
        "small": "the Most Merciful",
        "en": "Ar-Raheem",
        "row": 4,
        "displayCol": 3,
        "audio": "muw_14.mp3",
        "video": "muw_14.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_15",
        "text": "الْكَرِيمُ",
        "ar": "الْكَرِيمُ",
        "small": "Generous",
        "en": "Al-Kareem",
        "row": 4,
        "displayCol": 2,
        "audio": "muw_15.mp3",
        "video": "muw_15.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_16",
        "text": "الْحَمْدُ",
        "ar": "الْحَمْدُ",
        "small": "all praises and thanks",
        "en": "Al-hamd",
        "row": 4,
        "displayCol": 1,
        "audio": "muw_16.mp3",
        "video": "muw_16.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_17",
        "text": "لِلَّهِ",
        "ar": "لِلَّهِ",
        "small": "for Allah / to Allah",
        "en": "lil-lah",
        "row": 5,
        "displayCol": 4,
        "audio": "muw_17.mp3",
        "video": "muw_17.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_18",
        "text": "الْعَالَمِينَ",
        "ar": "الْعَالَمِينَ",
        "small": "the worlds",
        "en": "Al-aalameen",
        "row": 5,
        "displayCol": 3,
        "audio": "muw_18.mp3",
        "video": "muw_18.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_19",
        "text": "مُسْلِمٌ",
        "ar": "مُسْلِمٌ",
        "small": "Muslim",
        "en": "muslim",
        "row": 5,
        "displayCol": 2,
        "audio": "muw_19.mp3",
        "video": "muw_19.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_20",
        "text": "مُؤْمِنٌ",
        "ar": "مُؤْمِنٌ",
        "small": "believer",
        "en": "mu-min",
        "row": 5,
        "displayCol": 1,
        "audio": "muw_20.mp3",
        "video": "muw_20.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_21",
        "text": "مُشْرِكٌ",
        "ar": "مُشْرِكٌ",
        "small": "polytheist",
        "en": "mushrik",
        "row": 6,
        "displayCol": 4,
        "audio": "muw_21.mp3",
        "video": "muw_21.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_22",
        "text": "كَافِرٌ",
        "ar": "كَافِرٌ",
        "small": "disbeliever",
        "en": "kaafir",
        "row": 6,
        "displayCol": 3,
        "audio": "muw_22.mp3",
        "video": "muw_22.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_23",
        "text": "صَالِحٌ",
        "ar": "صَالِحٌ",
        "small": "righteous",
        "en": "saalih",
        "row": 6,
        "displayCol": 2,
        "audio": "muw_23.mp3",
        "video": "muw_23.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_24",
        "text": "يَوْمٌ",
        "ar": "يَوْمٌ",
        "small": "day",
        "en": "yawm",
        "row": 6,
        "displayCol": 1,
        "audio": "muw_24.mp3",
        "video": "muw_24.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_25",
        "text": "الدِّينُ",
        "ar": "الدِّينُ",
        "small": "the Judgment / religion",
        "en": "ad-deen",
        "row": 7,
        "displayCol": 4,
        "audio": "muw_25.mp3",
        "video": "muw_25.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_26",
        "text": "إِيَّاكَ",
        "ar": "إِيَّاكَ",
        "small": "You alone",
        "en": "iyyaaka",
        "row": 7,
        "displayCol": 3,
        "audio": "muw_26.mp3",
        "video": "muw_26.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_27",
        "text": "رَبٌّ",
        "ar": "رَبٌّ",
        "small": "Lord",
        "en": "rabb",
        "row": 7,
        "displayCol": 2,
        "audio": "muw_27.mp3",
        "video": "muw_27.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_28",
        "text": "مَا",
        "ar": "مَا",
        "small": "that which / what",
        "en": "maa",
        "row": 7,
        "displayCol": 1,
        "audio": "muw_28.mp3",
        "video": "muw_28.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_29",
        "text": "الصِّرَاطُ",
        "ar": "الصِّرَاطُ",
        "small": "the path",
        "en": "as-siraat",
        "row": 8,
        "displayCol": 4,
        "audio": "muw_29.mp3",
        "video": "muw_29.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_30",
        "text": "الْمُسْتَقِيمُ",
        "ar": "الْمُسْتَقِيمُ",
        "small": "the straight",
        "en": "al-mustaqeem",
        "row": 8,
        "displayCol": 3,
        "audio": "muw_30.mp3",
        "video": "muw_30.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_31",
        "text": "الَّذِينَ",
        "ar": "الَّذِينَ",
        "small": "those who",
        "en": "alladheena",
        "row": 8,
        "displayCol": 2,
        "audio": "muw_31.mp3",
        "video": "muw_31.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_32",
        "text": "غَيْرُ",
        "ar": "غَيْرُ",
        "small": "not / other than",
        "en": "ghayr",
        "row": 8,
        "displayCol": 1,
        "audio": "muw_32.mp3",
        "video": "muw_32.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_33",
        "text": "لَا",
        "ar": "لَا",
        "small": "not / no",
        "en": "laa",
        "row": 9,
        "displayCol": 4,
        "audio": "muw_33.mp3",
        "video": "muw_33.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_34",
        "text": "الضَّالِّينَ",
        "ar": "الضَّالِّينَ",
        "small": "those who go astray",
        "en": "ad-daalleen",
        "row": 9,
        "displayCol": 3,
        "audio": "muw_34.mp3",
        "video": "muw_34.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_35",
        "text": "هِيَ",
        "ar": "هِيَ",
        "small": "it / she",
        "en": "hiya",
        "row": 9,
        "displayCol": 2,
        "audio": "muw_35.mp3",
        "video": "muw_35.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_36",
        "text": "كِتَابٌ",
        "ar": "كِتَابٌ",
        "small": "a book",
        "en": "kitaab",
        "row": 9,
        "displayCol": 1,
        "audio": "muw_36.mp3",
        "video": "muw_36.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_37",
        "text": "أَنْزَلْنَا",
        "ar": "أَنْزَلْنَا",
        "small": "We revealed",
        "en": "anzalna",
        "row": 10,
        "displayCol": 4,
        "audio": "muw_37.mp3",
        "video": "muw_37.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_38",
        "text": "آيَةٌ",
        "ar": "آيَةٌ",
        "small": "sign / verse",
        "en": "aayah",
        "row": 10,
        "displayCol": 3,
        "audio": "muw_38.mp3",
        "video": "muw_38.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_39",
        "text": "الْأَرْضُ",
        "ar": "الْأَرْضُ",
        "small": "the earth",
        "en": "al-ard",
        "row": 10,
        "displayCol": 2,
        "audio": "muw_39.mp3",
        "video": "muw_39.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_40",
        "text": "السَّمَاءُ",
        "ar": "السَّمَاءُ",
        "small": "the heaven",
        "en": "as-samaa",
        "row": 10,
        "displayCol": 1,
        "audio": "muw_40.mp3",
        "video": "muw_40.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_41",
        "text": "أُولُو",
        "ar": "أُولُو",
        "small": "those of",
        "en": "uloo",
        "row": 11,
        "displayCol": 4,
        "audio": "muw_41.mp3",
        "video": "muw_41.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_42",
        "text": "لَوْ",
        "ar": "لَوْ",
        "small": "if",
        "en": "law",
        "row": 11,
        "displayCol": 3,
        "audio": "muw_42.mp3",
        "video": "muw_42.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_43",
        "text": "لِ",
        "ar": "لِ",
        "small": "for",
        "en": "li",
        "row": 11,
        "displayCol": 2,
        "audio": "muw_43.mp3",
        "video": "muw_43.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_44",
        "text": "مِنْ",
        "ar": "مِنْ",
        "small": "from",
        "en": "min",
        "row": 11,
        "displayCol": 1,
        "audio": "muw_44.mp3",
        "video": "muw_44.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_45",
        "text": "عَنْ",
        "ar": "عَنْ",
        "small": "with / about",
        "en": "an",
        "row": 12,
        "displayCol": 4,
        "audio": "muw_45.mp3",
        "video": "muw_45.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_46",
        "text": "لَقَدْ",
        "ar": "لَقَدْ",
        "small": "certainly",
        "en": "laqad",
        "row": 12,
        "displayCol": 3,
        "audio": "muw_46.mp3",
        "video": "muw_46.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_47",
        "text": "الْقُرْآنُ",
        "ar": "الْقُرْآنُ",
        "small": "the Qur?an",
        "en": "al-qur-aan",
        "row": 12,
        "displayCol": 2,
        "audio": "muw_47.mp3",
        "video": "muw_47.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_48",
        "text": "إِنْ",
        "ar": "إِنْ",
        "small": "if",
        "en": "in",
        "row": 12,
        "displayCol": 1,
        "audio": "muw_48.mp3",
        "video": "muw_48.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_49",
        "text": "شَاءَ",
        "ar": "شَاءَ",
        "small": "wills",
        "en": "shaa-a",
        "row": 13,
        "displayCol": 4,
        "audio": "muw_49.mp3",
        "video": "muw_49.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_50",
        "text": "إِنَّ",
        "ar": "إِنَّ",
        "small": "indeed",
        "en": "inna",
        "row": 13,
        "displayCol": 3,
        "audio": "muw_50.mp3",
        "video": "muw_50.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_51",
        "text": "إِنَّمَا",
        "ar": "إِنَّمَا",
        "small": "only",
        "en": "innamaa",
        "row": 13,
        "displayCol": 2,
        "audio": "muw_51.mp3",
        "video": "muw_51.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_52",
        "text": "عَمَلٌ",
        "ar": "عَمَلٌ",
        "small": "deeds",
        "en": "amaal",
        "row": 13,
        "displayCol": 1,
        "audio": "muw_52.mp3",
        "video": "muw_52.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_53",
        "text": "بِ",
        "ar": "بِ",
        "small": "in / by",
        "en": "bi",
        "row": 14,
        "displayCol": 4,
        "audio": "muw_53.mp3",
        "video": "muw_53.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_54",
        "text": "فِي",
        "ar": "فِي",
        "small": "in / into",
        "en": "fee",
        "row": 14,
        "displayCol": 3,
        "audio": "muw_54.mp3",
        "video": "muw_54.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_55",
        "text": "السَّبِيلُ",
        "ar": "السَّبِيلُ",
        "small": "the way",
        "en": "as-sabeel",
        "row": 14,
        "displayCol": 2,
        "audio": "muw_55.mp3",
        "video": "muw_55.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_56",
        "text": "عَلَىٰ",
        "ar": "عَلَىٰ",
        "small": "on / upon",
        "en": "alaa",
        "row": 14,
        "displayCol": 1,
        "audio": "muw_56.mp3",
        "video": "muw_56.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_57",
        "text": "الَّذِي",
        "ar": "الَّذِي",
        "small": "the one who",
        "en": "alladhee",
        "row": 15,
        "displayCol": 4,
        "audio": "muw_57.mp3",
        "video": "muw_57.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_58",
        "text": "أَيُّ",
        "ar": "أَيُّ",
        "small": "which of you",
        "en": "ayyukum",
        "row": 15,
        "displayCol": 3,
        "audio": "muw_58.mp3",
        "video": "muw_58.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_59",
        "text": "أَحْسَنُ",
        "ar": "أَحْسَنُ",
        "small": "best",
        "en": "ahsan",
        "row": 15,
        "displayCol": 2,
        "audio": "muw_59.mp3",
        "video": "muw_59.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_60",
        "text": "إِلَىٰ",
        "ar": "إِلَىٰ",
        "small": "to",
        "en": "ilaa",
        "row": 15,
        "displayCol": 1,
        "audio": "muw_60.mp3",
        "video": "muw_60.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_61",
        "text": "مَعَ",
        "ar": "مَعَ",
        "small": "with",
        "en": "maa",
        "row": 16,
        "displayCol": 4,
        "audio": "muw_61.mp3",
        "video": "muw_61.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_62",
        "text": "عِنْدَ",
        "ar": "عِنْدَ",
        "small": "near / with",
        "en": "inda",
        "row": 16,
        "displayCol": 3,
        "audio": "muw_62.mp3",
        "video": "muw_62.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_63",
        "text": "الْإِنْسَانُ",
        "ar": "الْإِنْسَانُ",
        "small": "mankind",
        "en": "al-insaan",
        "row": 16,
        "displayCol": 2,
        "audio": "muw_63.mp3",
        "video": "muw_63.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_64",
        "text": "إِلَّا",
        "ar": "إِلَّا",
        "small": "except",
        "en": "illaa",
        "row": 16,
        "displayCol": 1,
        "audio": "muw_64.mp3",
        "video": "muw_64.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_65",
        "text": "آمَنُوا",
        "ar": "آمَنُوا",
        "small": "they believed",
        "en": "aamanoo",
        "row": 17,
        "displayCol": 4,
        "audio": "muw_65.mp3",
        "video": "muw_65.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_66",
        "text": "الْحَقُّ",
        "ar": "الْحَقُّ",
        "small": "the truth",
        "en": "al-haqq",
        "row": 17,
        "displayCol": 3,
        "audio": "muw_66.mp3",
        "video": "muw_66.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_67",
        "text": "أَوْ",
        "ar": "أَوْ",
        "small": "or",
        "en": "aw",
        "row": 17,
        "displayCol": 2,
        "audio": "muw_67.mp3",
        "video": "muw_67.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_68",
        "text": "هَذَا",
        "ar": "هَذَا",
        "small": "this",
        "en": "haadhaa",
        "row": 17,
        "displayCol": 1,
        "audio": "muw_68.mp3",
        "video": "muw_68.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_69",
        "text": "هَذِهِ",
        "ar": "هَذِهِ",
        "small": "this",
        "en": "haadhihi",
        "row": 18,
        "displayCol": 4,
        "audio": "muw_69.mp3",
        "video": "muw_69.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_70",
        "text": "ذَٰلِكَ",
        "ar": "ذَٰلِكَ",
        "small": "that",
        "en": "dhaalika",
        "row": 18,
        "displayCol": 3,
        "audio": "muw_70.mp3",
        "video": "muw_70.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_71",
        "text": "تِلْكَ",
        "ar": "تِلْكَ",
        "small": "that / these",
        "en": "tilka",
        "row": 18,
        "displayCol": 2,
        "audio": "muw_71.mp3",
        "video": "muw_71.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_72",
        "text": "هَؤُلَاءِ",
        "ar": "هَؤُلَاءِ",
        "small": "these",
        "en": "haa-ulaa-i",
        "row": 18,
        "displayCol": 1,
        "audio": "muw_72.mp3",
        "video": "muw_72.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_73",
        "text": "أُولَٰئِكَ",
        "ar": "أُولَٰئِكَ",
        "small": "those",
        "en": "ulaa-ika",
        "row": 19,
        "displayCol": 4,
        "audio": "muw_73.mp3",
        "video": "muw_73.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_74",
        "text": "إِذْ",
        "ar": "إِذْ",
        "small": "when",
        "en": "idh",
        "row": 19,
        "displayCol": 3,
        "audio": "muw_74.mp3",
        "video": "muw_74.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_75",
        "text": "إِذَا",
        "ar": "إِذَا",
        "small": "when",
        "en": "idhaa",
        "row": 19,
        "displayCol": 2,
        "audio": "muw_75.mp3",
        "video": "muw_75.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_76",
        "text": "جَاءَ",
        "ar": "جَاءَ",
        "small": "he came",
        "en": "jaa-a",
        "row": 19,
        "displayCol": 1,
        "audio": "muw_76.mp3",
        "video": "muw_76.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_77",
        "text": "النَّاسُ",
        "ar": "النَّاسُ",
        "small": "the people",
        "en": "an-naas",
        "row": 20,
        "displayCol": 4,
        "audio": "muw_77.mp3",
        "video": "muw_77.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_78",
        "text": "فَعَلَ",
        "ar": "فَعَلَ",
        "small": "he did",
        "en": "faala",
        "row": 20,
        "displayCol": 3,
        "audio": "muw_78.mp3",
        "video": "muw_78.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_79",
        "text": "جَعَلَ",
        "ar": "جَعَلَ",
        "small": "he made",
        "en": "jaala",
        "row": 20,
        "displayCol": 2,
        "audio": "muw_79.mp3",
        "video": "muw_79.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_80",
        "text": "فَتَحَ",
        "ar": "فَتَحَ",
        "small": "he opened / revealed",
        "en": "fataha",
        "row": 20,
        "displayCol": 1,
        "audio": "muw_80.mp3",
        "video": "muw_80.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_81",
        "text": "قُلْ",
        "ar": "قُلْ",
        "small": "say",
        "en": "qul",
        "row": 21,
        "displayCol": 4,
        "audio": "muw_81.mp3",
        "video": "muw_81.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_82",
        "text": "أَحَدٌ",
        "ar": "أَحَدٌ",
        "small": "the One",
        "en": "ahad",
        "row": 21,
        "displayCol": 3,
        "audio": "muw_82.mp3",
        "video": "muw_82.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_83",
        "text": "لَمْ",
        "ar": "لَمْ",
        "small": "not",
        "en": "lam",
        "row": 21,
        "displayCol": 2,
        "audio": "muw_83.mp3",
        "video": "muw_83.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_84",
        "text": "لَنْ",
        "ar": "لَنْ",
        "small": "never",
        "en": "lan",
        "row": 21,
        "displayCol": 1,
        "audio": "muw_84.mp3",
        "video": "muw_84.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_85",
        "text": "نَصْرٌ",
        "ar": "نَصْرٌ",
        "small": "help",
        "en": "nasr",
        "row": 22,
        "displayCol": 4,
        "audio": "muw_85.mp3",
        "video": "muw_85.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_86",
        "text": "خَلَقَ",
        "ar": "خَلَقَ",
        "small": "he created",
        "en": "khalaqa",
        "row": 22,
        "displayCol": 3,
        "audio": "muw_86.mp3",
        "video": "muw_86.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_87",
        "text": "ذَكَرَ",
        "ar": "ذَكَرَ",
        "small": "he remembered",
        "en": "dhakara",
        "row": 22,
        "displayCol": 2,
        "audio": "muw_87.mp3",
        "video": "muw_87.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_88",
        "text": "عَبَدَ",
        "ar": "عَبَدَ",
        "small": "he worshipped",
        "en": "abada",
        "row": 22,
        "displayCol": 1,
        "audio": "muw_88.mp3",
        "video": "muw_88.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_89",
        "text": "شَيْءٌ",
        "ar": "شَيْءٌ",
        "small": "thing",
        "en": "shay",
        "row": 23,
        "displayCol": 4,
        "audio": "muw_89.mp3",
        "video": "muw_89.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_90",
        "text": "ضَرَبَ",
        "ar": "ضَرَبَ",
        "small": "he hit",
        "en": "daraba",
        "row": 23,
        "displayCol": 3,
        "audio": "muw_90.mp3",
        "video": "muw_90.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_91",
        "text": "سَمِعَ",
        "ar": "سَمِعَ",
        "small": "he listened / heard",
        "en": "samia",
        "row": 23,
        "displayCol": 2,
        "audio": "muw_91.mp3",
        "video": "muw_91.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_92",
        "text": "عَلِمَ",
        "ar": "عَلِمَ",
        "small": "he knew",
        "en": "alima",
        "row": 23,
        "displayCol": 1,
        "audio": "muw_92.mp3",
        "video": "muw_92.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_93",
        "text": "عَمِلَ",
        "ar": "عَمِلَ",
        "small": "he did",
        "en": "amila",
        "row": 24,
        "displayCol": 4,
        "audio": "muw_93.mp3",
        "video": "muw_93.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_94",
        "text": "حَدِيثٌ",
        "ar": "حَدِيثٌ",
        "small": "statement / story",
        "en": "hadeeth",
        "row": 24,
        "displayCol": 3,
        "audio": "muw_94.mp3",
        "video": "muw_94.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_95",
        "text": "إِلٰهٌ",
        "ar": "إِلٰهٌ",
        "small": "the God",
        "en": "ilaah",
        "row": 24,
        "displayCol": 2,
        "audio": "muw_95.mp3",
        "video": "muw_95.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_96",
        "text": "صَدْرٌ",
        "ar": "صَدْرٌ",
        "small": "chest",
        "en": "sadr",
        "row": 24,
        "displayCol": 1,
        "audio": "muw_96.mp3",
        "video": "muw_96.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_97",
        "text": "مَلَكٌ",
        "ar": "مَلَكٌ",
        "small": "angel",
        "en": "malak",
        "row": 25,
        "displayCol": 4,
        "audio": "muw_97.mp3",
        "video": "muw_97.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_98",
        "text": "جِنَّةٌ",
        "ar": "جِنَّةٌ",
        "small": "Jinn",
        "en": "jinnah",
        "row": 25,
        "displayCol": 3,
        "audio": "muw_98.mp3",
        "video": "muw_98.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_99",
        "text": "يَا",
        "ar": "يَا",
        "small": "O / oh",
        "en": "yaa",
        "row": 25,
        "displayCol": 2,
        "audio": "muw_99.mp3",
        "video": "muw_99.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_100",
        "text": "قَوْمٌ",
        "ar": "قَوْمٌ",
        "small": "people",
        "en": "qawm",
        "row": 25,
        "displayCol": 1,
        "audio": "muw_100.mp3",
        "video": "muw_100.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_101",
        "text": "أَيُّهَا",
        "ar": "أَيُّهَا",
        "small": "O / oh",
        "en": "ayyuhaa",
        "row": 26,
        "displayCol": 4,
        "audio": "muw_101.mp3",
        "video": "muw_101.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_102",
        "text": "أَنْ",
        "ar": "أَنْ",
        "small": "that",
        "en": "an",
        "row": 26,
        "displayCol": 3,
        "audio": "muw_102.mp3",
        "video": "muw_102.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_103",
        "text": "أَنَّ",
        "ar": "أَنَّ",
        "small": "that",
        "en": "anna",
        "row": 26,
        "displayCol": 2,
        "audio": "muw_103.mp3",
        "video": "muw_103.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_104",
        "text": "مُحَمَّدٌ",
        "ar": "مُحَمَّدٌ",
        "small": "Muhammad",
        "en": "Muhammad",
        "row": 26,
        "displayCol": 1,
        "audio": "muw_104.mp3",
        "video": "muw_104.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_105",
        "text": "رَسُولٌ",
        "ar": "رَسُولٌ",
        "small": "Messenger",
        "en": "Rasool",
        "row": 27,
        "displayCol": 4,
        "audio": "muw_105.mp3",
        "video": "muw_105.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_106",
        "text": "الصَّلَاةُ",
        "ar": "الصَّلَاةُ",
        "small": "the prayer",
        "en": "as-salah",
        "row": 27,
        "displayCol": 3,
        "audio": "muw_106.mp3",
        "video": "muw_106.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_107",
        "text": "شَرِيكٌ",
        "ar": "شَرِيكٌ",
        "small": "partner",
        "en": "shareek",
        "row": 27,
        "displayCol": 2,
        "audio": "muw_107.mp3",
        "video": "muw_107.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_108",
        "text": "مَاذَا",
        "ar": "مَاذَا",
        "small": "what",
        "en": "maadhaa",
        "row": 27,
        "displayCol": 1,
        "audio": "muw_108.mp3",
        "video": "muw_108.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_109",
        "text": "سُبْحَانَ",
        "ar": "سُبْحَانَ",
        "small": "Glory",
        "en": "subhaana",
        "row": 28,
        "displayCol": 4,
        "audio": "muw_109.mp3",
        "video": "muw_109.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_110",
        "text": "الْعَظِيمُ",
        "ar": "الْعَظِيمُ",
        "small": "The Great",
        "en": "al-azeem",
        "row": 28,
        "displayCol": 3,
        "audio": "muw_110.mp3",
        "video": "muw_110.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_111",
        "text": "طَيِّبَاتٌ",
        "ar": "طَيِّبَاتٌ",
        "small": "good things",
        "en": "tayyibaat",
        "row": 28,
        "displayCol": 2,
        "audio": "muw_111.mp3",
        "video": "muw_111.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_112",
        "text": "سَلَامٌ",
        "ar": "سَلَامٌ",
        "small": "peace",
        "en": "salaam",
        "row": 28,
        "displayCol": 1,
        "audio": "muw_112.mp3",
        "video": "muw_112.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_113",
        "text": "النَّبِيُّ",
        "ar": "النَّبِيُّ",
        "small": "The Prophet",
        "en": "an-nabi",
        "row": 29,
        "displayCol": 4,
        "audio": "muw_113.mp3",
        "video": "muw_113.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_114",
        "text": "رَحْمَةٌ",
        "ar": "رَحْمَةٌ",
        "small": "mercy",
        "en": "rahmah",
        "row": 29,
        "displayCol": 3,
        "audio": "muw_114.mp3",
        "video": "muw_114.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_115",
        "text": "عِبَادٌ",
        "ar": "عِبَادٌ",
        "small": "servant",
        "en": "abd",
        "row": 29,
        "displayCol": 2,
        "audio": "muw_115.mp3",
        "video": "muw_115.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_116",
        "text": "سَوْفَ",
        "ar": "سَوْفَ",
        "small": "soon",
        "en": "sawfa",
        "row": 29,
        "displayCol": 1,
        "audio": "muw_116.mp3",
        "video": "muw_116.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_117",
        "text": "إِبْرَاهِيمُ",
        "ar": "إِبْرَاهِيمُ",
        "small": "Ibrahim",
        "en": "Ibraheem",
        "row": 30,
        "displayCol": 4,
        "audio": "muw_117.mp3",
        "video": "muw_117.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_118",
        "text": "نَفْسٌ",
        "ar": "نَفْسٌ",
        "small": "soul",
        "en": "nafs",
        "row": 30,
        "displayCol": 3,
        "audio": "muw_118.mp3",
        "video": "muw_118.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_119",
        "text": "كَثِيرٌ",
        "ar": "كَثِيرٌ",
        "small": "much",
        "en": "katheer",
        "row": 30,
        "displayCol": 2,
        "audio": "muw_119.mp3",
        "video": "muw_119.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_120",
        "text": "الذُّنُوبُ",
        "ar": "الذُّنُوبُ",
        "small": "sin",
        "en": "dhanb",
        "row": 30,
        "displayCol": 1,
        "audio": "muw_120.mp3",
        "video": "muw_120.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_121",
        "text": "غَفُورٌ",
        "ar": "غَفُورٌ",
        "small": "Oft-Forgiving",
        "en": "ghafoor",
        "row": 31,
        "displayCol": 4,
        "audio": "muw_121.mp3",
        "video": "muw_121.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_122",
        "text": "الدُّنْيَا",
        "ar": "الدُّنْيَا",
        "small": "the world",
        "en": "ad-dunya",
        "row": 31,
        "displayCol": 3,
        "audio": "muw_122.mp3",
        "video": "muw_122.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_123",
        "text": "الْآخِرَةُ",
        "ar": "الْآخِرَةُ",
        "small": "the Hereafter",
        "en": "al-aakhirah",
        "row": 31,
        "displayCol": 2,
        "audio": "muw_123.mp3",
        "video": "muw_123.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_124",
        "text": "عَذَابٌ",
        "ar": "عَذَابٌ",
        "small": "punishment",
        "en": "adhaab",
        "row": 31,
        "displayCol": 1,
        "audio": "muw_124.mp3",
        "video": "muw_124.mp4",
        "filterType": "Most Used Word"
      },
      {
        "key": "muw_125",
        "text": "النَّارُ",
        "ar": "النَّارُ",
        "small": "the Fire",
        "en": "an-naar",
        "row": 32,
        "displayCol": 4,
        "audio": "muw_125.mp3",
        "video": "muw_125.mp4",
        "filterType": "Most Used Word"
      }
    ]
  },
  "debug": {
    "showTileAudioNames": true
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
