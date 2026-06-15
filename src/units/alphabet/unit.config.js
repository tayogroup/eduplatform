// ============================================================
// Alphabet Listen - Unit Authoring Config
// ------------------------------------------------------------
// This file contains unit-specific identity, steps, content, media,
// messages, and feature overrides. Generated runtime fields such as
// canvas.cells, audioMap, video maps, stepOrder, and storage aliases
// are added by shared-config-normalizer.js.
// ============================================================

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
    lessonId: 'alphabet',
    unitId: 'alphabet_listen',
    unitKey: 'alphabet',
    storagePrefix: 'alphabet_listen',
    keyPrefix: 'alph_'
  },

  moodle: {
    wsGetFunction: 'local_prequran_get_unit_state',
    wsSetFunction: 'local_prequran_set_unit_state'
  },

  release: {
    version: '1.0.2',
    assetVersion: 'alphabet-rules-skipfix-20260615e',
    marker: 'alphabet-rules-skipfix-20260615e'
  },

  localization: {
    defaultLanguage: 'en',
    fallbackLanguage: 'en',
    defaultScope: 'both',
    supportedLanguages: ['en', 'ar', 'so', 'sw', 'pa', 'ur'],
    translations: {
      ar: {
        ui: {
          pageTitle: 'وحدة الحروف',
          headerTitle: 'Alphabet Unit',
          headerArabicTitle: 'وحدة الحروف',
          aboutLabel: 'عن الحروف'
        },
        uiText: {
          playAll: '▶ تشغيل الكل',
          pause: '⏸ إيقاف',
          resume: '▶ متابعة',
          speakPopup: {
            okButton: 'حسنا'
          },
          writeOverlay: {
            closeTitle: 'إغلاق',
            resetTitle: 'إعادة',
            resetButton: 'إعادة ↺',
            printTitle: 'طباعة',
            printButton: 'طباعة',
            rowsLabel: 'الصفوف',
            colsLabel: 'الأعمدة',
            badgeAllWords: 'كل الكلمات',
            badgePartPrefix: 'جزء',
            badgeOfWord: 'من'
          }
        },
        stepperUi: {
          stepPrefix: 'الخطوة',
          progressLabel: 'التقدم',
          reviewAriaPrefix: 'مراجعة'
        },
        focusBadge: {
          great: { text: 'تركيز رائع' },
          good: { text: 'تركيز جيد' },
          keep: { text: 'ركّز' }
        },
        messageUi: {
          titleText: 'رسالة 😊',
          continueText: 'متابعة'
        },
        stepLabels: {
          lecture: 'Lecture',
          listen: 'Listen',
          watch: 'Watch',
          phonetics: 'Phonetics',
          repeat: 'Repeat',
          match: 'Match',
          speak: 'Speak',
          animate: 'Animate',
          write: 'Write',
          submit: 'Submit',
          soundclue: 'SoundClue',
          letterclue: 'LetterClue'
        }
      },
      so: {},
      sw: {},
      pa: {},
      ur: {}
    }
  },

  assets: {
    cdnRoot: '/pre_quraan',
    unitMediaRoot: '/lessons/alphabet/media',
    filePrefix: 'alph_',
    mediaPadWidth: 2
  },

  routes: {
    academyHomeUrl: 'https://quraan.academy/'
  },
  messaging: {
    useConfigStepMessages: true,
    disableLegacyCompletionFeedback: true
  },

  messageUi: {
    titleText: '😊 Message',
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
      label: 'Step Back \u2190',
      title: 'Go back one step',
      confirmTitle: 'Go back one step?',
      confirmText: 'This will move you back to {previousStep}. Your progress for {currentStep} and {previousStep} will be reset so you can try again.',
      confirmContinueText: 'Yes, go back',
      confirmCancelText: 'Stay here'
    }
  },
  messageUnitKey: 'alphabet_movement',
  // ==========================================================
  // STEP DEFINITIONS
  // ==========================================================
  // 	  { id: 'listen',     type: 'playlist',       label: 'Listen',  passFilters: ['all', 'light', 'alifaa', 'vowels', 'heavy', 'distinctions'] },
 
  steps: [
    { id: 'lecture',    step_index: 1,  type: 'lecture',        label: 'Lecture',    arabicLabel: 'شرح', passFilters: ['all'] },
    { id: 'rules',      step_index: 2,  type: 'content',        label: 'Rules',      arabicLabel: 'القواعد', passFilters: ['all', 'all'], passes_required: 2, default_passes_required: 2 },
    { id: 'listen',     step_index: 3,  type: 'playlist',       label: 'Listen',     arabicLabel: 'استمع', passFilters: ['all'] },
    { id: 'watch',      step_index: 4,  type: 'video_playlist', label: 'Watch',      arabicLabel: 'شاهد', passFilters: ['all'] },
    { id: 'phonetics',  step_index: 5,  type: 'phonetics',      label: 'Phonetics',  arabicLabel: 'النطق', passFilters: ['all'] },
    { id: 'repeat',     step_index: 6,  type: 'playlist',       label: 'Repeat',     arabicLabel: 'كرر', passFilters: ['all'] },
    { id: 'letterclue', step_index: 7,  type: 'letterclue',     label: 'LetterClue', arabicLabel: 'تلميحات الحروف', passFilters: ['all'] },
    { id: 'speak',      step_index: 8,  type: 'speak',          label: 'Speak',      arabicLabel: 'تحدث', passFilters: ['all'] },
    { id: 'match',      step_index: 9,  type: 'match',          label: 'Match',      arabicLabel: 'طابق', passFilters: ['all'] },
    { id: 'soundclue',  step_index: 10, type: 'soundclue',      label: 'SoundClue',  arabicLabel: 'تلميحات صوتية', passFilters: ['all'] },
    { id: 'animate',    step_index: 11, type: 'animate',        label: 'Animate',    arabicLabel: 'شاهد الكتابة', passFilters: ['all'] },
    { id: 'write',      step_index: 12, type: 'write',          label: 'Write',      arabicLabel: 'اكتب', passFilters: ['all'] },
    { id: 'submit',     step_index: 13, type: 'submit',         label: 'Submit',     arabicLabel: 'أرسل', passFilters: ['all'] }
  ],
  stepInjection: {
    beforeListen: [
      {
        id: 'rules',
        type: 'content',
        label: 'Rules',
        arabicLabel: 'القواعد',
        actionLabel: 'Rules',
        actionArabicLabel: 'القواعد',
        filter: 'all',
        passFilters: ['all', 'all'],
        passes_required: 2,
        default_passes_required: 2
      }
    ],
    rules: {
      id: 'rules',
      type: 'content',
      label: 'Rules',
      arabicLabel: 'القواعد',
      actionLabel: 'Rules',
      actionArabicLabel: 'القواعد',
      filter: 'all',
      passFilters: ['all', 'all'],
      passes_required: 2,
      default_passes_required: 2
    }
  },
  writeLabelMap: [
    { from: 'Trace1', to: 'Write' },
    { from: 'Trace 1', to: 'Write' },
    { from: 'Trace2', to: 'Write2' },
    { from: 'Trace 2', to: 'Write2' },
    { from: 'Trace', to: 'Write' }
  ],

	activeTileEffect: {
	  enabled: true,
	  mode: 'bounceGlow',
	  durationMs: 900,
	  glow: true,
	  bounce: true,
	  dimOthers: false
	},
	
	activeAudioAnimation: {
	  enabled: true,
	  type: 'magic-ring-pop',
	  speedMs: 850,
	  scale: 1.14,
	  ringColor: '#ffb300'
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
      outOfLives: 'You used all your lives. Let’s try again.',
      restarting: 'Starting again...',
      completed: 'Great job! Match complete.'
    },

    audioMessages: {
      outOfLives: '',
      completed: ''
    }
  },

  focusBadge: {
    great: {
      minScore: 120,
      cls: 'focus-great',
      text: 'Great Focus'
    },
    good: {
      minScore: 30,
      cls: 'focus-good',
      text: 'Good Focus'
    },
    keep: {
      cls: 'focus-keep',
      text: 'Try to Focus'
    }
  },

  uiText: {
    playAll: '▶ Play All',
    pause: '⏸ Pause',
    resume: '▶ Resume',

    writeOverlay: {
      closeTitle: 'Close',
      resetTitle: 'Reset',
      resetButton: 'Reset ↺',
      printTitle: 'Print',
      printButton: 'Print 🖨',
      rowsLabel: 'Rows',
      colsLabel: 'Cols',
      badgeAllWords: 'All Words',
      badgePartPrefix: 'Part',
      badgeSeparator: ' — ',
      badgeOfWord: 'of',
      badgeRangeOpen: '(',
      badgeRangeDash: '–',
      badgeRangeClose: ')'
    },

    speakPopup: {
      okButton: 'OK'
    }
  },

  ui: {
    pageTitle: 'PQ Unit - Alphabet Unit',
    headerTitle: 'Alphabet Unit',
    headerArabicTitle: 'وحدة الحروف',
    aboutLabel: 'About Alphabet',
    showDbSavedToast: false
  },

  stepperUi: {
    stepPrefix: 'Step',
    progressLabel: 'Progress',
    reviewAriaPrefix: 'Review',
    badgeCompleted: '✓',
    badgeActive: '▶',
    badgePending: '•'
  },

  defaults: {
    voice: 'child_boy',
    speed: '1.0',
    repeat: '1',
    filter: 'all'
  },

	filterSets: {
		
	/* this can be used to overwrite "all" default filter.
	Add passFilters: ['selected'] to a step definition.

	filterSets: {
	  selected: ['alph_1', 'alph_24', 'alph_21']
	}
	*/
	  vowels: ['alph_1', 'alph_27', 'alph_28'],
	  
	  distinctions: [
	    'alph_7',
		'alph_14',
		'alph_15',
		'alph_21'
	  ],

	  heavy: [
		'alph_7',
		'alph_14',
		'alph_15',
		'alph_16',
		'alph_17',
		'alph_19',
		'alph_21'
	  ],

	  light: [
		'alph_2', 'alph_3', 'alph_4', 'alph_5', 'alph_6',
		'alph_8', 'alph_9', 'alph_10', 'alph_11', 'alph_12',
		'alph_13', 'alph_18', 'alph_20', 'alph_22', 'alph_23',
		'alph_24', 'alph_25', 'alph_26'
	  ],

	  alifaa: [
		'alph_2',
		'alph_3',
		'alph_4',
		'alph_6',
		'alph_7',
		'alph_10',
		'alph_11',
		'alph_16',
		'alph_17',
		'alph_20',
		'alph_26',
		'alph_27',
		'alph_28'
	  ]
	},

  speakUi: {
    micEnablePopupText: 'Please enable microphone first.'
  },

  speakPopupUi: {
    overlayBackground: 'rgba(0,0,0,0.55)',
    zIndex: 99999,

    box: {
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '320px',
      width: '90%',
      textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0,0,0,.35)',
      fontWeight: '600'
    },

    message: {
      marginBottom: '18px',
      fontSize: '16px'
    },

    button: {
      background: '#4CAF50',
      color: '#fff',
      padding: '10px 18px',
      borderRadius: '10px',
      fontWeight: '700'
    }
  },

  wordLimit: 29,

  layout: {
    browserGridCols: 4,
    sepFontSize: '6.5rem',
    mobileGridCols: 2,
    mobileTileMinHeight: '260px',
    mobileSepFontSize: '5.4rem',
    mobileSmallFontSize: '1.05rem',
    width: '100%',
    maxWidth: '100%',
    columnGap: '16px',
    rowGap: '16px',
    minTileWidth: '0px'
  },

  playback: {
    // Per-step letter audio mode: 'name', 'sound', or 'both'.
    // 'name' uses audio/male; 'sound' uses audio/sound; 'both' plays name then sound.
    letterAudioMode: 'both',
    letterAudioSequenceGapMs: 120,
    steps: {
      listen: {
        letterAudioMode: 'name',
        letterAudioBase: '/pre_quraan/lessons/alphabet/media/audio/male/',
        beforeStartMs: 400,
        betweenLettersMs: 700,
        afterCompleteMs: 500
      },
listenplus: {
  letterAudioMode: 'name',
  anchorPlaybackRate: 0.65,
  anchorRepeats: 2,
  beforeStartMs: 500,
  betweenLettersMs: 3000,
  afterCompleteMs: 700,
  animalDelayMs: 0,
  syncPauseAfterLetterMs: 1200,
  animalHoldMs: 3500,
  animalAudioTimeoutMs: 7000
},

repeatRecording: {
  enabled: true,
  recordMs: 1400,
  autoStartDelayMs: 450,
  maxAttempts: 3,
  retryDelayMs: 600,
  replayStudent: true,
  feedbackHoldMs: 950,
  quality: {
    enabled: true,
    minDurationMs: 260,
    minRms: 0.026,
    minPeak: 0.075,
    minActiveRatio: 0.14,
    minLoudRatio: 0.035,
    minLoudRunMs: 45,
    minVoicedBins: 2,
    minVoiceScore: 3,
    hardMinPeak: 0.035,
    hardMinRms: 0.010,
    voiceThreshold: 0.045,
    binVoiceThreshold: 0.030,
    passIfAnalysisUnavailable: false,
    minDurationRatio: 0.25,
    maxDurationRatio: 3.2,
    maxEnvelopeDiff: 0.75,
    envelopeBins: 12
  }
},

sound: {
  letterAudioMode: 'both',
  preModalPlayback: 'video',
  resumeIncomplete: true,
  requireExplainerFirst: true,
  autoVideoAfterExplainer: true,
  autoPlayExplainerOnModalOpen: true,
  videoRepeatCount: 2,
  betweenVideoRepeatsMs: 180,
  beforeStartMs: 400,
  audioVideoGapMs: 250,
  betweenLettersMs: 700,
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
    enabled: false,
    engine: 'dtw',
    minScore: 0.58,
    maxAttempts: 3,
    allowDoneAfterMaxAttempts: true,
    replayTeacherStudent: true,
    passIfUnavailable: false,
    sampleRate: 8000,
    frameMs: 32,
    hopMs: 16,
    bandRatio: 0.32,
    distanceScale: 2.7,
    minFrames: 5,
    silenceThreshold: 0.012,
    requireVowelShape: true,
    vowelWindowMs: 350,
    vowelRegion: 'tail',
    vowelMinScore: 0.58,
    vowelDistanceScale: 0.62
  }
},

submit: {
  letterAudioMode: 'both',
  recordingUpload: {
    enabled: true,
    required: true,
    wsFunction: 'local_prequran_save_submit_recording',
    maxBytes: 6000000
  }
},

animate: {
  letterAudioMode: 'both',
  audioBeforeVideo: true,
  audioPlaybackRate: 1.0,
  videoPlaybackRate: 2.85,
  audioVideoGapMs: 250,
  modalMaxWidth: '52vw',
  modalMaxHeight: '52vh',
  beforeStartMs: 400,
  betweenLettersMs: 700,
  afterCompleteMs: 500
},

words: {
  letterAudioMode: 'both',
  letterAudioSourceStep: 'listen',
  modalLetterAudioMode: 'sound',
  modalLetterRepeats: 1,
  modalLetterPlaybackRate: 1.0,
  anchorPlaybackRate: 0.65,
  anchorRepeats: 3,
  wordRepeats: 3,
  beforeStartMs: 500,
  betweenLettersMs: 3000,
  afterCompleteMs: 700,
  wordDelayMs: 0,
  syncPauseAfterLetterMs: 1200,
  wordHoldMs: 3500,
  wordAudioTimeoutMs: 7000,
  progress: {
    label: 'Progress',
    checkText: '\u2713'
  }
},
      watch: {
        letterAudioMode: 'both',
        beforeStartMs: 400,
        betweenLettersMs: 700,
        afterCompleteMs: 500
      },
      repeat: {
        letterAudioMode: 'name',
        letterAudioBase: '/pre_quraan/lessons/alphabet/media/audio/male/',
        beforeStartMs: 400,
        betweenLettersMs: 2000,
        afterCompleteMs: 500
      },
	  match: {
        letterAudioMode: 'both',
        beforeStartMs: 400,
        betweenLettersMs: 2000,
        afterCompleteMs: 500
      }
    }
  },

  messages: {
    base: "/pre_quraan/messages/unit_steps/alphabet/",
    manifest: './unit.messages.js',
    version: "alphabet-messages-v1.0.0"
  },

  write: {
    chunkSize: 4,
    chunks: [4,4,34],
    rows: 1,
    cols: 2,
    wideWords: [13],
    spanWords: { 14: 2 },
    minPassesRequired: 14,

    adapter: {
      unitKey: 'alphabet_listen',
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

      practice: {
        startY: 330,
        endPadding: 36,
        gap: 84,
        color: '#e0d6bc',
        dash: [14, 10],
        width: 2
      },

      ghostText: {
        color: '#10223a',
        alpha: 0.18,
        normalFontPx: 74,
        wideFontPx: 50
      },

      byMode: {
		desktop: {
		  width: 800,
		  height: 1000,
		  ghostNormalFontPx: 148,
		  ghostWideFontPx: 100
		},
		mobile: {
		  width: 680,
		  height: 680,
		  ghostNormalFontPx: 116,
		  ghostWideFontPx: 80
		},
		print: {
		  width: 900,
		  height: 1000,
		  ghostNormalFontPx: 164,
		  ghostWideFontPx: 112
		}
      }
    },

    print: {
      pageMargin: '16px',
      columns: 2,
      gap: '12px'
    },

    overlayUi: {
      overlayBackground: 'rgba(0,0,0,.55)',
      zIndex: 9999,

      panel: {
        width: 'min(1100px,92vw)',
        height: 'min(760px,88vh)',
        background: '#fff',
        borderRadius: '18px',
        boxShadow: '0 18px 70px rgba(0,0,0,.35)'
      },

      topbar: {
        gap: '10px',
        padding: '12px 14px',
        borderBottom: '1px solid #eee'
      },

      closeButton: {
        background: '#f3f4f6',
        borderRadius: '12px',
        padding: '10px 14px',
        fontSize: '18px'
      },

      actionButton: {
        background: '#f3f4f6',
        borderRadius: '12px',
        padding: '10px 14px',
        fontWeight: '700'
      },

      badge: {
        fontWeight: '800'
      },

      grid: {
        padding: '16px',
        background: '#fafafa',
        gap: '14px',
        previewColumns: 3
      },

      tile: {
        background: '#fff',
        border: '1px solid #eee',
        borderRadius: '14px'
      },

      settings: {
        gap: '8px',
        marginLeft: '10px'
      },

      select: {
        padding: '6px 8px',
        borderRadius: '10px',
        border: '1px solid #ddd'
      },

      label: {
        fontSize: '12px',
        color: '#666'
      }
    }
  },

  listenPlus: {
    enabled: true,
    imageBase: '/pre_quraan/lessons/alphabet/media/listen_plus/animals/images/',
    audioBase: '/pre_quraan/lessons/alphabet/media/listen_plus/animals/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Listen+',
    subtitle: 'Arabic sound + animal sound',
    map: {
      alph_1:  { letter: 'A',  animal: 'Alligator', image: 'a_alligator',  audio: 'a_alligator' },
      alph_2:  { letter: 'B',  animal: 'Bear',      image: 'b_bear',       audio: 'b_bear' },
      alph_3:  { letter: 'T',  animal: 'Tiger',     image: 't_tiger',      audio: 't_tiger' },
      alph_4:  { letter: 'Th', animal: 'Thornbill', image: 'th_thornbill', audio: 'th_thornbill' },
      alph_5:  { letter: 'J',  animal: 'Jaguar',    image: 'j_jaguar',     audio: 'j_jaguar' },
      alph_6:  { letter: 'H',  animal: 'Horse',     image: 'h_horse',      audio: 'h_horse' },
      alph_7:  { letter: 'Kh', animal: 'Kangaroo',  image: 'kh_kangaroo',  audio: 'kh_kangaroo' },
      alph_8:  { letter: 'D',  animal: 'Duck',      image: 'd_duck',       audio: 'd_duck' },
      alph_9:  { letter: 'Dh', animal: 'Dhole',     image: 'dh_dhole',     audio: 'dh_dhole' },
      alph_10: { letter: 'R',  animal: 'Rabbit',    image: 'r_rabbit',     audio: 'r_rabbit' },
      alph_11: { letter: 'Z',  animal: 'Zebra',     image: 'z_zebra',      audio: 'z_zebra' },
      alph_12: { letter: 'S',  animal: 'Snake',     image: 's_snake',      audio: 's_snake' },
      alph_13: { letter: 'Sh', animal: 'Shark',     image: 'sh_shark',     audio: 'sh_shark' },
      alph_14: { letter: 'S',  animal: 'Seal',      image: 's_seal',       audio: 's_seal' },
      alph_15: { letter: 'D',  animal: 'Deer',      image: 'd_deer',       audio: 'd_deer' },
      alph_16: { letter: 'T',  animal: 'Turtle',    image: 't_turtle',     audio: 't_turtle' },
      alph_17: { letter: 'Z',  animal: 'Zebu',      image: 'z_zebu',       audio: 'z_zebu' },
      alph_18: { letter: 'A',  animal: 'Ant',       image: 'a_ant',        audio: 'a_ant' },
      alph_19: { letter: 'Gh', animal: 'Goat',      image: 'gh_goat',      audio: 'gh_goat' },
      alph_20: { letter: 'F',  animal: 'Fox',       image: 'f_fox',        audio: 'f_fox' },
      alph_21: { letter: 'Q',  animal: 'Quail',     image: 'q_quail',      audio: 'q_quail' },
      alph_22: { letter: 'K',  animal: 'Koala',     image: 'k_koala',      audio: 'k_koala' },
      alph_23: { letter: 'L',  animal: 'Lion',      image: 'l_lion',       audio: 'l_lion' },
      alph_24: { letter: 'M',  animal: 'Monkey',    image: 'm_monkey',     audio: 'm_monkey' },
      alph_25: { letter: 'N',  animal: 'Newt',      image: 'n_newt',       audio: 'n_newt' },
      alph_26: { letter: 'H',  animal: 'Hippo',     image: 'h_hippo',      audio: 'h_hippo' },
      alph_27: { letter: 'W',  animal: 'Wolf',      image: 'w_wolf',       audio: 'w_wolf' },
      alph_28: { letter: 'Y',  animal: 'Yak',       image: 'y_yak',        audio: 'y_yak' },
      alph_29: { letter: 'A',  animal: 'Ape',       image: 'a_ape',        audio: 'a_ape' }
    }
  },


  words: {
    enabled: true,
    imageBase: '/pre_quraan/lessons/alphabet/media/words/images/',
    audioBase: '/pre_quraan/lessons/alphabet/media/words/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Words',
    subtitle: 'Arabic letter + Arabic word',
    map: {
      alph_1:  { letter: 'ا', word: 'أسد',     image: 'alif_asad',       audio: 'alif_asad' },
      alph_2:  { letter: 'ب', word: 'بطة',     image: 'ba_batta',        audio: 'ba_batta' },
      alph_3:  { letter: 'ت', word: 'تمر',     image: 'ta_tamr',         audio: 'ta_tamr' },
      alph_4:  { letter: 'ث', word: 'ثعلب',    image: 'tha_thalab',      audio: 'tha_thalab' },
      alph_5:  { letter: 'ج', word: 'جمل',     image: 'jim_jamal',       audio: 'jim_jamal' },
      alph_6:  { letter: 'ح', word: 'حصان',    image: 'ha_hisan',        audio: 'ha_hisan' },
      alph_7:  { letter: 'خ', word: 'خروف',    image: 'kha_kharuf',      audio: 'kha_kharuf' },
      alph_8:  { letter: 'د', word: 'دجاجة',   image: 'dal_dajaja',      audio: 'dal_dajaja' },
      alph_9:  { letter: 'ذ', word: 'ذرة',     image: 'dhal_dhurra',     audio: 'dhal_dhurra' },
      alph_10: { letter: 'ر', word: 'رمان',    image: 'ra_rumman',       audio: 'ra_rumman' },
      alph_11: { letter: 'ز', word: 'زرافة',   image: 'zay_zarafa',      audio: 'zay_zarafa' },
      alph_12: { letter: 'س', word: 'سمكة',    image: 'sin_samaka',      audio: 'sin_samaka' },
      alph_13: { letter: 'ش', word: 'شمس',     image: 'shin_shams',      audio: 'shin_shams' },
      alph_14: { letter: 'ص', word: 'صقر',     image: 'sad_saqr',        audio: 'sad_saqr' },
      alph_15: { letter: 'ض', word: 'ضفدع',    image: 'dad_difda',       audio: 'dad_difda' },
      alph_16: { letter: 'ط', word: 'طائرة',   image: 'ta_taira',        audio: 'ta_taira' },
      alph_17: { letter: 'ظ', word: 'ظرف',     image: 'za_zarf',         audio: 'za_zarf' },
      alph_18: { letter: 'ع', word: 'عنب',     image: 'ayn_inab',        audio: 'ayn_inab' },
      alph_19: { letter: 'غ', word: 'غزال',    image: 'ghayn_ghazal',    audio: 'ghayn_ghazal' },
      alph_20: { letter: 'ف', word: 'فيل',     image: 'fa_fil',          audio: 'fa_fil' },
      alph_21: { letter: 'ق', word: 'قطة',     image: 'qaf_qitta',       audio: 'qaf_qitta' },
      alph_22: { letter: 'ك', word: 'كلب',     image: 'kaf_kalb',        audio: 'kaf_kalb' },
      alph_23: { letter: 'ل', word: 'ليمون',   image: 'lam_laymun',      audio: 'lam_laymun' },
      alph_24: { letter: 'م', word: 'موز',     image: 'mim_mawz',        audio: 'mim_mawz' },
      alph_25: { letter: 'ن', word: 'نحلة',    image: 'nun_nahla',       audio: 'nun_nahla' },
      alph_26: { letter: 'ه', word: 'هدهد',    image: 'ha_hudhud',       audio: 'ha_hudhud' },
      alph_27: { letter: 'و', word: 'وردة',    image: 'waw_warda',       audio: 'waw_warda' },
      alph_28: { letter: 'ي', word: 'يد',      image: 'ya_yad',          audio: 'ya_yad' },
      alph_29: { letter: 'ء', word: 'أرنب',    image: 'r_rabbit',         audio: 'hamza_arnab' }
    }
  },
	media: {

	  // Lecture
      lectureUrl: '/pre_quraan/messages/lectures/alphabet_lecture_faststart_20260611a.mp4',

	  // Voice variants
	  voiceBases: {
		child_boy: '/pre_quraan/lessons/alphabet/media/audio/male/',
		child_girl: '/pre_quraan/lessons/alphabet/media/audio/male/',
		adult_male: '/pre_quraan/lessons/alphabet/media/audio/male/',
		adult_female: '/pre_quraan/lessons/alphabet/media/audio/male/'
	  },

	  // Default voice
	  adultMaleAlphaBase:
		'/pre_quraan/lessons/alphabet/media/audio/male/',

	  // Fallbacks
	  l6Base:
		'/pre_quraan/lessons/alphabet/media/audio/male/',

	  watchBase:
		'/pre_quraan/lessons/alphabet/media/video/',

	  animateBase:
		'/pre_quraan/lessons/alphabet/media/animate/',

	  soundImageBase:
		'/pre_quraan/lessons/alphabet/media/sound/images/',

	  soundExplainerBase:
		'/pre_quraan/lessons/alphabet/media/sound/audio/',

	  letterSoundBase:
		'/pre_quraan/lessons/alphabet/media/audio/sound/',

	  soundAudioBase:
		'/pre_quraan/lessons/alphabet/media/sound/audio/',

	  fallbackAudioBase:
		'/pre_quraan/lessons/alphabet/media/audio/male/',

	  fallbackWatchBase:
		'/pre_quraan/lessons/alphabet/media/video/'
	},
  // Example long-word entries:
  // { key: 'alph_7', text: 'كهيعص', span: 2 },
  //  { key: 'alph_14', text: 'حم عسق', span: 2 },

  content: {
    items: [
			{ key: 'alph_1', text: 'ا', en: 'alif', row: 1, displayCol: 4, audio: 'alph_01.mp3', video: 'alph_01.mp4' },
			{ key: 'alph_2', text: 'ب', en: 'ba', row: 1, displayCol: 3, audio: 'alph_02.mp3', video: 'alph_02.mp4' },
			{ key: 'alph_3', text: 'ت', en: 'ta', row: 1, displayCol: 2, audio: 'alph_03.mp3', video: 'alph_03.mp4' },
			{ key: 'alph_4', text: 'ث', en: 'tha', row: 1, displayCol: 1, audio: 'alph_04.mp3', video: 'alph_04.mp4' },
			{ key: 'alph_5', text: 'ج', en: 'jeem', row: 2, displayCol: 4, audio: 'alph_05.mp3', video: 'alph_05.mp4' },
			{ key: 'alph_6', text: 'ح', en: 'ha', row: 2, displayCol: 3, audio: 'alph_06.mp3', video: 'alph_06.mp4' },
			{ key: 'alph_7', text: 'خ', en: 'kha', row: 2, displayCol: 2, audio: 'alph_07.mp3', video: 'alph_07.mp4' },
			{ key: 'alph_8', text: 'د', en: 'dal', row: 2, displayCol: 1, audio: 'alph_08.mp3', video: 'alph_08.mp4' },
			{ key: 'alph_9', text: 'ذ', en: 'dhal', row: 3, displayCol: 4, audio: 'alph_09.mp3', video: 'alph_09.mp4' },
			{ key: 'alph_10', text: 'ر', en: 'ra', row: 3, displayCol: 3, audio: 'alph_10.mp3', video: 'alph_10.mp4' },
			{ key: 'alph_11', text: 'ز', en: 'zay', row: 3, displayCol: 2, audio: 'alph_11.mp3', video: 'alph_11.mp4' },
			{ key: 'alph_12', text: 'س', en: 'seen', row: 3, displayCol: 1, audio: 'alph_12.mp3', video: 'alph_12.mp4' },
			{ key: 'alph_13', text: 'ش', en: 'sheen', row: 4, displayCol: 4, audio: 'alph_13.mp3', video: 'alph_13.mp4' },
			{ key: 'alph_14', text: 'ص', en: 'sad', row: 4, displayCol: 3, audio: 'alph_14.mp3', video: 'alph_14.mp4' },
			{ key: 'alph_15', text: 'ض', en: 'dad', row: 4, displayCol: 2, audio: 'alph_15.mp3', video: 'alph_15.mp4' },
			{ key: 'alph_16', text: 'ط', en: 'ta', row: 4, displayCol: 1, audio: 'alph_16.mp3', video: 'alph_16.mp4' },
			{ key: 'alph_17', text: 'ظ', en: 'za', row: 5, displayCol: 4, audio: 'alph_17.mp3', video: 'alph_17.mp4' },
			{ key: 'alph_18', text: 'ع', en: 'ayn', row: 5, displayCol: 3, audio: 'alph_18.mp3', video: 'alph_18.mp4' },
			{ key: 'alph_19', text: 'غ', en: 'ghayn', row: 5, displayCol: 2, audio: 'alph_19.mp3', video: 'alph_19.mp4' },
			{ key: 'alph_20', text: 'ف', en: 'fa', row: 5, displayCol: 1, audio: 'alph_20.mp3', video: 'alph_20.mp4' },
			{ key: 'alph_21', text: 'ق', en: 'qaf', row: 6, displayCol: 4, audio: 'alph_21.mp3', video: 'alph_21.mp4' },
			{ key: 'alph_22', text: 'ك', en: 'kaf', row: 6, displayCol: 3, audio: 'alph_22.mp3', video: 'alph_22.mp4' },
			{ key: 'alph_23', text: 'ل', en: 'lam', row: 6, displayCol: 2, audio: 'alph_23.mp3', video: 'alph_23.mp4' },
			{ key: 'alph_24', text: 'م', en: 'meem', row: 6, displayCol: 1, audio: 'alph_24.mp3', video: 'alph_24.mp4' },
			{ key: 'alph_25', text: 'ن', en: 'noon', row: 7, displayCol: 4, audio: 'alph_25.mp3', video: 'alph_25.mp4' },
			{ key: 'alph_26', text: 'ه', en: 'ha', row: 7, displayCol: 3, audio: 'alph_26.mp3', video: 'alph_26.mp4' },
			{ key: 'alph_27', text: 'و', en: 'waw', row: 7, displayCol: 2, audio: 'alph_27.mp3', video: 'alph_27.mp4' },
			{ key: 'alph_28', text: 'ي', en: 'ya', row: 7, displayCol: 1, audio: 'alph_28.mp3', video: 'alph_28.mp4' },
			{ key: 'alph_29', text: 'ء', en: 'hamza', row: 8, displayCol: 4, audio: 'alph_29.mp3', video: 'alph_29.mp4' }

    ]
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
  window.PQ_alphabet_listen = UNIT_CFG;
}
