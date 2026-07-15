// Tanween Unit - Unit Authoring Config
// ------------------------------------------------------------
// This template is the preferred seed for cloned units.
// Keep it neutral: no source-unit content, no unit-specific media maps,
// and no hardcoded lesson assets outside tanween-movement placeholders.
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
    unitId: 'tanween_listen',
    unitKey: 'tanween',
    storagePrefix: 'tanween_listen',
    keyPrefix: 'twm_'
  },

  moodle: {
    wsGetFunction: 'local_prequran_get_tanween_listen_state',
    wsSetFunction: 'local_prequran_set_tanween_listen_state'
  },

  release: {
    version: '1.0.0',
    assetVersion: 'tanween-rules-20260602a'
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
       "unitMediaRoot": "/lessons/tanween-movement/media",
       "filePrefix": "twm_",
       "mediaPadWidth": 2,
       "audioExt": ".mp3",
       "soundAudioExt": ".mp3",
       "videoFilePrefix": "twm_"
     },

  routes: {
       "academyHomeUrl": "https://quraan.academy/"
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
       {
         "id": "lecture",
         "type": "lecture",
         "label": "Lecture",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "شرح"
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
         ],
         "arabicLabel": "استمع"
       },
       {
         "id": "watch",
         "type": "video_playlist",
         "label": "Watch",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "شاهد"
       },
       {
         "id": "repeat",
         "type": "playlist",
         "label": "Repeat",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "كرر"
       },
       {
         "id": "speak",
         "type": "speak",
         "label": "Speak",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "تحدث"
       },
       {
         "id": "trace1",
         "type": "trace",
         "label": "Write1",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "اكتب"
       },
       {
         "id": "submit",
         "type": "submit",
         "label": "Submit",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "أرسل"
       },
       {
         "id": "listenplus",
         "type": "playlist",
         "label": "Listen+",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "استمع+"
       },
       {
         "id": "sound",
         "type": "sound",
         "label": "Sound",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "صوت"
       },
       {
         "id": "match",
         "type": "match",
         "label": "Match",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "طابق"
       },
       {
         "id": "animate",
         "type": "animate",
         "label": "Animate",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "حركة"
       },
       {
         "id": "words",
         "type": "playlist",
         "label": "Words",
         "passFilters": [
           "all"
         ],
         "arabicLabel": "كلمات"
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
       "vowels": [
         "twm_1",
         "twm_2",
         "twm_3",
         "twm_4",
         "twm_5",
         "twm_6",
         "twm_7",
         "twm_8",
         "twm_9",
         "twm_10",
         "twm_11",
         "twm_12",
         "twm_13",
         "twm_14",
         "twm_15",
         "twm_16",
         "twm_17",
         "twm_18",
         "twm_19",
         "twm_20",
         "twm_21",
         "twm_22",
         "twm_23",
         "twm_24",
         "twm_25",
         "twm_26",
         "twm_27",
         "twm_28",
         "twm_29",
         "twm_30",
         "twm_31",
         "twm_32",
         "twm_33",
         "twm_34",
         "twm_35",
         "twm_36",
         "twm_37",
         "twm_38",
         "twm_39",
         "twm_40",
         "twm_41",
         "twm_42",
         "twm_43",
         "twm_44",
         "twm_45",
         "twm_46",
         "twm_47",
         "twm_48",
         "twm_49",
         "twm_50",
         "twm_51",
         "twm_52",
         "twm_53",
         "twm_54"
       ],
       "distinctions": [
         "twm_1",
         "twm_2",
         "twm_3",
         "twm_4",
         "twm_5",
         "twm_6",
         "twm_7",
         "twm_8",
         "twm_9",
         "twm_10",
         "twm_11",
         "twm_12",
         "twm_13",
         "twm_14",
         "twm_15",
         "twm_16",
         "twm_17",
         "twm_18",
         "twm_19",
         "twm_20",
         "twm_21",
         "twm_22",
         "twm_23",
         "twm_24",
         "twm_25",
         "twm_26",
         "twm_27",
         "twm_28",
         "twm_29",
         "twm_30",
         "twm_31",
         "twm_32",
         "twm_33",
         "twm_34",
         "twm_35",
         "twm_36",
         "twm_37",
         "twm_38",
         "twm_39",
         "twm_40",
         "twm_41",
         "twm_42",
         "twm_43",
         "twm_44",
         "twm_45",
         "twm_46",
         "twm_47",
         "twm_48",
         "twm_49",
         "twm_50",
         "twm_51",
         "twm_52",
         "twm_53",
         "twm_54"
       ],
       "heavy": [
         "twm_1",
         "twm_2",
         "twm_3",
         "twm_4",
         "twm_5",
         "twm_6",
         "twm_7",
         "twm_8",
         "twm_9",
         "twm_10",
         "twm_11",
         "twm_12",
         "twm_13",
         "twm_14",
         "twm_15",
         "twm_16",
         "twm_17",
         "twm_18",
         "twm_19",
         "twm_20",
         "twm_21",
         "twm_22",
         "twm_23",
         "twm_24",
         "twm_25",
         "twm_26",
         "twm_27",
         "twm_28",
         "twm_29",
         "twm_30",
         "twm_31",
         "twm_32",
         "twm_33",
         "twm_34",
         "twm_35",
         "twm_36",
         "twm_37",
         "twm_38",
         "twm_39",
         "twm_40",
         "twm_41",
         "twm_42",
         "twm_43",
         "twm_44",
         "twm_45",
         "twm_46",
         "twm_47",
         "twm_48",
         "twm_49",
         "twm_50",
         "twm_51",
         "twm_52",
         "twm_53",
         "twm_54"
       ],
       "light": [
         "twm_1",
         "twm_2",
         "twm_3",
         "twm_4",
         "twm_5",
         "twm_6",
         "twm_7",
         "twm_8",
         "twm_9",
         "twm_10",
         "twm_11",
         "twm_12",
         "twm_13",
         "twm_14",
         "twm_15",
         "twm_16",
         "twm_17",
         "twm_18",
         "twm_19",
         "twm_20",
         "twm_21",
         "twm_22",
         "twm_23",
         "twm_24",
         "twm_25",
         "twm_26",
         "twm_27",
         "twm_28",
         "twm_29",
         "twm_30",
         "twm_31",
         "twm_32",
         "twm_33",
         "twm_34",
         "twm_35",
         "twm_36",
         "twm_37",
         "twm_38",
         "twm_39",
         "twm_40",
         "twm_41",
         "twm_42",
         "twm_43",
         "twm_44",
         "twm_45",
         "twm_46",
         "twm_47",
         "twm_48",
         "twm_49",
         "twm_50",
         "twm_51",
         "twm_52",
         "twm_53",
         "twm_54"
       ],
       "alifaa": [
         "twm_1",
         "twm_2",
         "twm_3",
         "twm_4",
         "twm_5",
         "twm_6",
         "twm_7",
         "twm_8",
         "twm_9",
         "twm_10",
         "twm_11",
         "twm_12",
         "twm_13",
         "twm_14",
         "twm_15",
         "twm_16",
         "twm_17",
         "twm_18",
         "twm_19",
         "twm_20",
         "twm_21",
         "twm_22",
         "twm_23",
         "twm_24",
         "twm_25",
         "twm_26",
         "twm_27",
         "twm_28",
         "twm_29",
         "twm_30",
         "twm_31",
         "twm_32",
         "twm_33",
         "twm_34",
         "twm_35",
         "twm_36",
         "twm_37",
         "twm_38",
         "twm_39",
         "twm_40",
         "twm_41",
         "twm_42",
         "twm_43",
         "twm_44",
         "twm_45",
         "twm_46",
         "twm_47",
         "twm_48",
         "twm_49",
         "twm_50",
         "twm_51",
         "twm_52",
         "twm_53",
         "twm_54"
       ]
     },

  layout: {
       "browserGridCols": 4,
       "mobileGridCols": 2,
       "mobileTileMinHeight": "158px",
       "mobileSepFontSize": "2.45rem",
       "mobileSmallFontSize": "1.05rem",
       "width": "100%",
       "maxWidth": "100%",
       "columnGap": "16px",
       "rowGap": "16px",
       "minTileWidth": "0px"
     },

  focusBadge: {
       "great": {
         "minScore": 120,
         "cls": "focus-great",
         "text": "Great Focus"
       },
       "good": {
         "minScore": 30,
         "cls": "focus-good",
         "text": "Good Focus"
       },
       "keep": {
         "cls": "focus-keep",
         "text": "Try to Focus"
       }
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

  playback: {
       "steps": {
         "listen": {
           "beforeStartMs": 400,
           "betweenLettersMs": 700,
           "afterCompleteMs": 500
         },
         "listenplus": {
           "anchorPlaybackRate": 0.65,
           "anchorRepeats": 2,
           "beforeStartMs": 500,
           "betweenLettersMs": 3000,
           "afterCompleteMs": 700,
           "animalDelayMs": 0,
           "syncPauseAfterLetterMs": 1200,
           "animalHoldMs": 3500,
           "animalAudioTimeoutMs": 7000
         },
         "repeatRecording": {
           "enabled": true,
           "recordMs": 1400,
           "autoStartDelayMs": 450,
           "replayStudent": true
         },
         "sound": {
           "beforeStartMs": 400,
           "audioVideoGapMs": 250,
           "betweenLettersMs": 700,
           "afterCompleteMs": 500
         },
         "animate": {
           "beforeStartMs": 400,
           "betweenLettersMs": 700,
           "afterCompleteMs": 500
         },
         "submit": {
           "recordingUpload": {
             "enabled": true,
             "required": true,
             "wsFunction": "local_prequran_save_submit_recording",
             "maxBytes": 6000000
           }
         },
         "words": {
           "anchorPlaybackRate": 0.65,
           "anchorRepeats": 3,
           "beforeStartMs": 500,
           "betweenLettersMs": 3000,
           "afterCompleteMs": 700,
           "wordDelayMs": 0,
           "syncPauseAfterLetterMs": 1200,
           "wordHoldMs": 3500,
           "wordAudioTimeoutMs": 7000
         },
         "watch": {
           "beforeStartMs": 400,
           "betweenLettersMs": 700,
           "afterCompleteMs": 500
         },
         "repeat": {
           "beforeStartMs": 400,
           "betweenLettersMs": 2000,
           "afterCompleteMs": 500
         },
         "match": {
           "beforeStartMs": 400,
           "betweenLettersMs": 2000,
           "afterCompleteMs": 500
         }
       }
     },

  messages: {
    base: '/pre_quraan/messages/unit_steps/tanween-movement/',
    manifest: './unit.messages.js',
    version: 'tanween-movement-messages-v0.1.0',
    entry: {},
    entryPasses: {},
    completion: {}
  },

  media: {
       "lectureUrl": "/pre_quraan/messages/lectures/tanween-movement_lecture.mp4",
       "voiceBases": {
         "child_boy": "/pre_quraan/lessons/tanween-movement/media/audio/male/",
         "child_girl": "",
         "adult_male": "/pre_quraan/lessons/tanween-movement/media/audio/male/",
         "adult_female": ""
       },
       "adultMaleAlphaBase": "/pre_quraan/lessons/tanween-movement/media/audio/male/",
       "l6Base": "/pre_quraan/lessons/tanween-movement/media/audio/male/",
       "watchBase": "/pre_quraan/lessons/tanween-movement/media/video/",
       "animateBase": "/pre_quraan/lessons/tanween-movement/media/animate/",
       "soundImageBase": "/pre_quraan/lessons/tanween-movement/media/sound/images/",
       "soundExplainerBase": "/pre_quraan/lessons/tanween-movement/media/sound/audio/",
       "soundAudioBase": "/pre_quraan/lessons/tanween-movement/media/sound/audio/",
       "fallbackAudioBase": "/pre_quraan/lessons/tanween-movement/media/audio/male/",
       "fallbackWatchBase": "/pre_quraan/lessons/tanween-movement/media/video/",
       "audioBase": "/pre_quraan/lessons/tanween-movement/media/audio/male/"
     },

  write: {
       "chunkSize": 4,
       "chunks": [
         4,
         4,
         34
       ],
       "rows": 1,
       "cols": 2,
       "wideWords": [
         13
       ],
       "spanWords": {
         "14": 2
       },
       "minPassesRequired": 14,
       "adapter": {
         "unitKey": "tanween_listen",
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
         "practice": {
           "startY": 330,
           "endPadding": 36,
           "gap": 84,
           "color": "#e0d6bc",
           "dash": [
             14,
             10
           ],
           "width": 2
         },
         "ghostText": {
           "color": "#10223a",
           "alpha": 0.18,
           "normalFontPx": 74,
           "wideFontPx": 50
         },
         "byMode": {
           "desktop": {
             "width": 800,
             "height": 1000,
             "ghostNormalFontPx": 148,
             "ghostWideFontPx": 100
           },
           "mobile": {
             "width": 680,
             "height": 680,
             "ghostNormalFontPx": 116,
             "ghostWideFontPx": 80
           },
           "print": {
             "width": 900,
             "height": 1000,
             "ghostNormalFontPx": 164,
             "ghostWideFontPx": 112
           }
         }
       },
       "print": {
         "pageMargin": "16px",
         "columns": 2,
         "gap": "12px"
       },
       "overlayUi": {
         "overlayBackground": "rgba(0,0,0,.55)",
         "zIndex": 9999,
         "panel": {
           "width": "min(1100px,92vw)",
           "height": "min(760px,88vh)",
           "background": "#fff",
           "borderRadius": "18px",
           "boxShadow": "0 18px 70px rgba(0,0,0,.35)"
         },
         "topbar": {
           "gap": "10px",
           "padding": "12px 14px",
           "borderBottom": "1px solid #eee"
         },
         "closeButton": {
           "background": "#f3f4f6",
           "borderRadius": "12px",
           "padding": "10px 14px",
           "fontSize": "18px"
         },
         "actionButton": {
           "background": "#f3f4f6",
           "borderRadius": "12px",
           "padding": "10px 14px",
           "fontWeight": "700"
         },
         "badge": {
           "fontWeight": "800"
         },
         "grid": {
           "padding": "16px",
           "background": "#fafafa",
           "gap": "14px",
           "previewColumns": 3
         },
         "tile": {
           "background": "#fff",
           "border": "1px solid #eee",
           "borderRadius": "14px"
         },
         "settings": {
           "gap": "8px",
           "marginLeft": "10px"
         },
         "select": {
           "padding": "6px 8px",
           "borderRadius": "10px",
           "border": "1px solid #ddd"
         },
         "label": {
           "fontSize": "12px",
           "color": "#666"
         }
       }
     },

  listenPlus: {
       "enabled": false,
       "imageBase": "/pre_quraan/lessons/tanween-movement/media/listen_plus/animals/images/",
       "audioBase": "/pre_quraan/lessons/tanween-movement/media/listen_plus/animals/audio/",
       "imageExt": ".png",
       "audioExt": ".mp3",
       "title": "Listen+",
       "subtitle": "Arabic sound + animal sound",
       "map": {}
     },

  words: {
       "enabled": false,
       "imageBase": "/pre_quraan/lessons/tanween-movement/media/words/images/",
       "audioBase": "/pre_quraan/lessons/tanween-movement/media/words/audio/",
       "imageExt": ".png",
       "audioExt": ".mp3",
       "title": "Words",
       "subtitle": "Arabic letter + Arabic word",
       "map": {}
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
        "from": "Trace2",
        "to": "Write2"
      },
      {
        "from": "Trace 2",
        "to": "Write2"
      },
      {
        "from": "Trace",
        "to": "Write"
      }
    ],

  activeTileEffect: {
      "enabled": true,
      "mode": "bounceGlow",
      "durationMs": 900,
      "glow": true,
      "bounce": true,
      "dimOthers": false
    },

  activeAudioAnimation: {
      "enabled": true,
      "type": "magic-ring-pop",
      "speedMs": 850,
      "scale": 1.14,
      "ringColor": "#ffb300"
    },

  ui: {
      "pageTitle": "PQ Unit - Tanween",
      "headerTitle": "Tanween Unit",
      "aboutLabel": "About Tanween",
      "showDbSavedToast": false
    },

  uiText: {
      "playAll": "Play All",
      "pause": "⏸ Pause",
      "resume": "Resume",
      "writeOverlay": {
        "closeTitle": "Close",
        "resetTitle": "Reset",
        "resetButton": "Reset",
        "printTitle": "Print",
        "printButton": "Print",
        "rowsLabel": "Rows",
        "colsLabel": "Cols",
        "badgeAllWords": "All Words",
        "badgePartPrefix": "Part",
        "badgeSeparator": " - ",
        "badgeOfWord": "of",
        "badgeRangeOpen": "(",
        "badgeRangeDash": "-",
        "badgeRangeClose": ")"
      },
      "speakPopup": {
        "okButton": "OK"
      }
    },

  speakUi: {
      "micEnablePopupText": "Please enable microphone first."
    },

  speakPopupUi: {
      "overlayBackground": "rgba(0,0,0,0.55)",
      "zIndex": 99999,
      "box": {
        "background": "#fff",
        "borderRadius": "16px",
        "padding": "24px",
        "maxWidth": "320px",
        "width": "90%",
        "textAlign": "center",
        "boxShadow": "0 20px 60px rgba(0,0,0,.35)",
        "fontWeight": "600"
      },
      "message": {
        "marginBottom": "18px",
        "fontSize": "16px"
      },
      "button": {
        "background": "#4CAF50",
        "color": "#fff",
        "padding": "10px 18px",
        "borderRadius": "10px",
        "fontWeight": "700"
      }
    },

  defaults: {
      "voice": "child_boy",
      "speed": "1.0",
      "repeat": "1",
      "filter": "all"
    },

  wordLimit: 54,

  content: {
    items: [
      {"key":"twm_1","text":"أَبَدًا","row":1,"displayCol":4,"audio":"twm_01.mp3","video":"twm_01.mp4"},
      {"key":"twm_2","text":"أَحَدٌ","row":1,"displayCol":3,"audio":"twm_02.mp3","video":"twm_02.mp4"},
      {"key":"twm_3","text":"أَخَذَ","row":1,"displayCol":2,"audio":"twm_03.mp3","video":"twm_03.mp4"},
      {"key":"twm_4","text":"أَذِنَ","row":1,"displayCol":1,"audio":"twm_04.mp3","video":"twm_04.mp4"},
      {"key":"twm_5","text":"أَمَرَ","row":2,"displayCol":4,"audio":"twm_05.mp3","video":"twm_05.mp4"},
      {"key":"twm_6","text":"أَنَا","row":2,"displayCol":3,"audio":"twm_06.mp3","video":"twm_06.mp4"},
      {"key":"twm_7","text":"بَخِلَ","row":2,"displayCol":2,"audio":"twm_07.mp3","video":"twm_07.mp4"},
      {"key":"twm_8","text":"بَرَرَةٍ","row":2,"displayCol":1,"audio":"twm_08.mp3","video":"twm_08.mp4"},
      {"key":"twm_9","text":"جَعَلَ","row":3,"displayCol":4,"audio":"twm_09.mp3","video":"twm_09.mp4"},
      {"key":"twm_10","text":"جَمَعَ","row":3,"displayCol":3,"audio":"twm_10.mp3","video":"twm_10.mp4"},
      {"key":"twm_11","text":"حَسَدَ","row":3,"displayCol":2,"audio":"twm_11.mp3","video":"twm_11.mp4"},
      {"key":"twm_12","text":"حَشَرَ","row":3,"displayCol":1,"audio":"twm_12.mp3","video":"twm_12.mp4"},
      {"key":"twm_13","text":"خَلَقَ","row":4,"displayCol":4,"audio":"twm_13.mp3","video":"twm_13.mp4"},
      {"key":"twm_14","text":"خَشِيَ","row":4,"displayCol":3,"audio":"twm_14.mp3","video":"twm_14.mp4"},
      {"key":"twm_15","text":"خُلِقَ","row":4,"displayCol":2,"audio":"twm_15.mp3","video":"twm_15.mp4"},
      {"key":"twm_16","text":"ذَكَرَ","row":4,"displayCol":1,"audio":"twm_16.mp3","video":"twm_16.mp4"},
      {"key":"twm_17","text":"رَفَعَ","row":5,"displayCol":4,"audio":"twm_17.mp3","video":"twm_17.mp4"},
      {"key":"twm_18","text":"رَقَبَةٍ","row":5,"displayCol":3,"audio":"twm_18.mp3","video":"twm_18.mp4"},
      {"key":"twm_19","text":"سُرُرٌ","row":5,"displayCol":2,"audio":"twm_19.mp3","video":"twm_19.mp4"},
      {"key":"twm_20","text":"سَفَرَةِ","row":5,"displayCol":1,"audio":"twm_20.mp3","video":"twm_20.mp4"},
      {"key":"twm_21","text":"صُحُفًا","row":6,"displayCol":4,"audio":"twm_21.mp3","video":"twm_21.mp4"},
      {"key":"twm_22","text":"وَسَطًا","row":6,"displayCol":3,"audio":"twm_22.mp3","video":"twm_22.mp4"},
      {"key":"twm_23","text":"طَبَقٍ","row":6,"displayCol":2,"audio":"twm_23.mp3","video":"twm_23.mp4"},
      {"key":"twm_24","text":"طَبَقًا","row":6,"displayCol":1,"audio":"twm_24.mp3","video":"twm_24.mp4"},
      {"key":"twm_25","text":"طُوًى","row":7,"displayCol":4,"audio":"twm_25.mp3","video":"twm_25.mp4"},
      {"key":"twm_26","text":"عَبَسَ","row":7,"displayCol":3,"audio":"twm_26.mp3","video":"twm_26.mp4"},
      {"key":"twm_27","text":"عَدَلَ","row":7,"displayCol":2,"audio":"twm_27.mp3","video":"twm_27.mp4"},
      {"key":"twm_28","text":"عَلَقٍ","row":7,"displayCol":1,"audio":"twm_28.mp3","video":"twm_28.mp4"},
      {"key":"twm_29","text":"عَمَدٍ","row":8,"displayCol":4,"audio":"twm_29.mp3","video":"twm_29.mp4"},
      {"key":"twm_30","text":"عِنَبًا","row":8,"displayCol":3,"audio":"twm_30.mp3","video":"twm_30.mp4"},
      {"key":"twm_31","text":"غَبَرةٌ","row":8,"displayCol":2,"audio":"twm_31.mp3","video":"twm_31.mp4"},
      {"key":"twm_32","text":"فَعَلَ","row":8,"displayCol":1,"audio":"twm_32.mp3","video":"twm_32.mp4"},
      {"key":"twm_33","text":"قَتَرَةٌ","row":9,"displayCol":4,"audio":"twm_33.mp3","video":"twm_33.mp4"},
      {"key":"twm_34","text":"قُتِلَ","row":9,"displayCol":3,"audio":"twm_34.mp3","video":"twm_34.mp4"},
      {"key":"twm_35","text":"قَدَرَ","row":9,"displayCol":2,"audio":"twm_35.mp3","video":"twm_35.mp4"},
      {"key":"twm_36","text":"قُرِئَ","row":9,"displayCol":1,"audio":"twm_36.mp3","video":"twm_36.mp4"},
      {"key":"twm_37","text":"قَسَمٌ","row":10,"displayCol":4,"audio":"twm_37.mp3","video":"twm_37.mp4"},
      {"key":"twm_38","text":"كَيَدٍ","row":10,"displayCol":3,"audio":"twm_38.mp3","video":"twm_38.mp4"},
      {"key":"twm_39","text":"كُتُبٌ","row":10,"displayCol":2,"audio":"twm_39.mp3","video":"twm_39.mp4"},
      {"key":"twm_40","text":"كَسَبَ","row":10,"displayCol":1,"audio":"twm_40.mp3","video":"twm_40.mp4"},
      {"key":"twm_41","text":"لَهَبٍ","row":11,"displayCol":4,"audio":"twm_41.mp3","video":"twm_41.mp4"},
      {"key":"twm_42","text":"لُمَزَةٍ","row":11,"displayCol":3,"audio":"twm_42.mp3","video":"twm_42.mp4"},
      {"key":"twm_43","text":"لُبَدًا","row":11,"displayCol":2,"audio":"twm_43.mp3","video":"twm_43.mp4"},
      {"key":"twm_44","text":"كُفُوًا","row":11,"displayCol":1,"audio":"twm_44.mp3","video":"twm_44.mp4"},
      {"key":"twm_45","text":"كَفَرَ","row":12,"displayCol":4,"audio":"twm_45.mp3","video":"twm_45.mp4"},
      {"key":"twm_46","text":"مَسَدٍ","row":12,"displayCol":3,"audio":"twm_46.mp3","video":"twm_46.mp4"},
      {"key":"twm_47","text":"نَخِرَةً","row":12,"displayCol":2,"audio":"twm_47.mp3","video":"twm_47.mp4"},
      {"key":"twm_48","text":"وَجَدَ","row":12,"displayCol":1,"audio":"twm_48.mp3","video":"twm_48.mp4"},
      {"key":"twm_49","text":"وَسَقَ","row":13,"displayCol":4,"audio":"twm_49.mp3","video":"twm_49.mp4"},
      {"key":"twm_50","text":"وَقَبَ","row":13,"displayCol":3,"audio":"twm_50.mp3","video":"twm_50.mp4"},
      {"key":"twm_51","text":"وَلَدَ","row":13,"displayCol":2,"audio":"twm_51.mp3","video":"twm_51.mp4"},
      {"key":"twm_52","text":"وَهَبَ","row":13,"displayCol":1,"audio":"twm_52.mp3","video":"twm_52.mp4"},
      {"key":"twm_53","text":"هُمَزَةٍ","row":14,"displayCol":4,"audio":"twm_53.mp3","video":"twm_53.mp4"},
      {"key":"twm_54","text":"هُدًى","row":14,"displayCol":3,"audio":"twm_54.mp3","video":"twm_54.mp4"}
    ]
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
}
