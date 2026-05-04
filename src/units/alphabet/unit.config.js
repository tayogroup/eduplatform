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
    lessonId: 'tajweed',
    unitId: 'alphabet_listen',
    unitKey: 'alphabet',
    storagePrefix: 'alphabet_listen',
    keyPrefix: 'alph_'
  },

  moodle: {
    wsGetFunction: 'local_prequran_get_alphabet_listen_state',
    wsSetFunction: 'local_prequran_set_alphabet_listen_state'
  },

  release: {
    version: '1.0.0',
    assetVersion: 'alphabet-v1.0.0'
  },

  assets: {
    cdnRoot: 'https://ehelacademy.b-cdn.net/pre_quraan',
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
  messageUnitKey: 'alphabet_movement',
  // ==========================================================
  // STEP DEFINITIONS
  // ==========================================================
  steps: [
    { id: 'speak',      type: 'speak',          label: 'Speak',   passFilters: ['all'] },
    { id: 'lecture',    type: 'lecture',        label: 'Lecture', passFilters: ['all'] },
    { id: 'listen',     type: 'playlist',       label: 'Listen',  passFilters: ['all', 'light', 'alifaa', 'vowels', 'heavy', 'distinctions'] },
    { id: 'listenplus', type: 'playlist',       label: 'Listen+', passFilters: ['all', 'heavy', 'light', 'alifaa', 'vowels'] },
    { id: 'watch',      type: 'video_playlist', label: 'Watch',   passFilters: ['all', 'heavy', 'light', 'alifaa', 'vowels'] },
    { id: 'sound',      type: 'sound',          label: 'Sound',   passFilters: ['all', 'heavy', 'light', 'alifaa', 'vowels'] },
    { id: 'repeat',     type: 'playlist',       label: 'Repeat',  passFilters: ['all', 'heavy', 'light', 'alifaa', 'vowels'] },
    { id: 'match',      type: 'match',          label: 'Match',   passFilters: ['all'] },
    { id: 'animate',    type: 'animate',        label: 'Animate', passFilters: ['all'] },
    { id: 'trace1',     type: 'trace',          label: 'Write1',  passFilters: ['all'] },
    { id: 'words',      type: 'playlist',       label: 'Words',   passFilters: ['all'] }
  ],
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
    mobileGridCols: 2,
    mobileTileMinHeight: '158px',
    mobileSepFontSize: '2.45rem',
    mobileSmallFontSize: '1.05rem',
    width: '100%',
    maxWidth: '100%',
    columnGap: '16px',
    rowGap: '16px',
    minTileWidth: '0px'
  },

  playback: {
    steps: {
      listen: {
        beforeStartMs: 400,
        betweenLettersMs: 700,
        afterCompleteMs: 500
      },
listenplus: {
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
  replayStudent: true
},

sound: {
  beforeStartMs: 400,
  audioVideoGapMs: 250,
  betweenLettersMs: 700,
  afterCompleteMs: 500
},

animate: {
  beforeStartMs: 400,
  betweenLettersMs: 700,
  afterCompleteMs: 500
},

words: {
  anchorPlaybackRate: 0.65,
  anchorRepeats: 3,
  beforeStartMs: 500,
  betweenLettersMs: 3000,
  afterCompleteMs: 700,
  wordDelayMs: 0,
  syncPauseAfterLetterMs: 1200,
  wordHoldMs: 3500,
  wordAudioTimeoutMs: 7000
},
      watch: {
        beforeStartMs: 400,
        betweenLettersMs: 700,
        afterCompleteMs: 500
      },
      repeat: {
        beforeStartMs: 400,
        betweenLettersMs: 2000,
        afterCompleteMs: 500
      },
	  match: {
        beforeStartMs: 400,
        betweenLettersMs: 2000,
        afterCompleteMs: 500
      }
    }
  },

  messages: {
    base: 'https://ehelacademy.b-cdn.net/pre_quraan/messages/unit_steps/alphabet/',

    entry: {
      lecture: {
        audio: 'alphabet_lecture step.mp3',
        text: 'Welcome to Quraan Academy Pre-quraan course.  You are in the first unit, the Alphabet, Lecture step. Click ‘Play Lecture’ and listen to the lecture carefully. Make sure you are in a quiet space with no distractions, and stay focused throughout the entire unit.'
      },
      listen: {
        audio: 'alphabet_listen_step_all_lettlers.mp3',
        text: 'You have completed Alphabet Movement Lecture step. You have now entered Listen step, all letters. Listen carefully. Do not repeat—just focus on how each sound is different. Notice which sounds are strong, soft, or long. You will have the opportunity to watch and repeat later. Click on Listen to continue'
      },
      watch: {
        audio: 'step_watch.mp3',
        clap: true,
        text: 'Good Job! You have completed the Alphabet Listen step. You have now entered the Watch step, all letters section. Click “Watch” and look carefully at how each letter is pronounced and formed. Watch quietly, keep your eyes on the screen, and do not repeat yet. You will have the opportunity to repeat later.'
      },
      repeat: {
        audio: 'step_repeat.mp3',
        text: 'You have completed Alphabet Watch step. You have now entered Repeat step. Click on Play All, then listen and repeat after.'
      },
      speak: {
        audio: 'step_speak.mp3',
        text: 'You have completed Alphabet Repeat step. You have now entered Speak step. Tap a word, record your voice, and compare with the correct pronunciation.'
      },
	  animate: {
        audio: 'step_animate.mp3',
        text: 'You have completed Alphabet Repeat step. You have now entered Animate step. Tap a word, record your voice, and compare with the correct pronunciation.'
      },
      trace1: {
        audio: 'step_trace1.mp3',
        text: 'You have completed Alphabet Animate step. You have now entered Write step. Click on Write, Trace, and then Print.'
      }
    },

	entryPasses: {	
	  listen: [
		{
		  audio: 'alphabet_listen_step_heavy_letters.mp3',
		  text: 'You have completed Listen step, all letters section.  You are now in Listen step, heavy letters section. Listen carefully. Do not repeat—just focus on the deep, strong sound. You will have the opportunity to watch and repeat later. Click on Listen to continue'
		},
		{
		  audio: 'alphabet_listen_step_light_letters.mp3',
		  text: 'You have completed Listen step, heavy letters section.  You are now in Listen step, light letters section.  Listen carefully. Do not repeat—just focus on the soft, clear sound. Notice how the tongue stays relaxed and the sound is not heavy. You will have the opportunity to watch and repeat later. Click on Listen to continue'
		},
		{
		  audio: 'alphabet_listen_step_alifaa_letters.mp3',
		  text: 'You have completed Listen step, heavy letters section. You are now in letters with Alif. Listen carefully. Do not repeat—just focus on the long, stretched sound. Notice how the sound is held longer and flows smoothly. You will have the opportunity to watch and repeat later. Click on Listen to continue'
		},
		{
		  audio: 'alphabet_listen_step_vowels_letters.mp3',
		  text: 'You have completed Listen step, letters with Alif section.  You are now in vowels section. Listen carefully. Do not repeat—just focus on the short, clear sound. Notice how each vowel changes the letter sound quickly and lightly. You will have the opportunity to watch and repeat later. Click on Watch to continue'
		}
	  ],	  
	  watch: [
		{
		  audio: 'alphabet_listen_step_heavy_letters.mp3',
		  text: 'You have completed Watch step, all letters section.  You are now in Listen step, heavy letters section. Listen carefully. Do not repeat—just focus on the deep, strong sound. You will have the opportunity to watch and repeat later. Click on Listen to continue'
		},
		{
		  audio: 'alphabet_listen_step_light_letters.mp3',
		  text: 'You have completed Watch step, heavy letters section.  You are now in Listen step, light letters section.  Listen carefully. Do not repeat—just focus on the soft, clear sound. Notice how the tongue stays relaxed and the sound is not heavy. You will have the opportunity to watch and repeat later. Click on Listen to continue'
		},
		{
		  audio: 'alphabet_listen_step_alifaa_letters.mp3',
		  text: 'You have completed Watch step, heavy letters section. You are now in letters with Alif. Listen carefully. Do not repeat—just focus on the long, stretched sound. Notice how the sound is held longer and flows smoothly. You will have the opportunity to watch and repeat later. Click on Listen to continue'
		},
		{
		  audio: 'alphabet_listen_step_vowels_letters.mp3',
		  text: 'You have completed Watch step, letters with Alif section.  You are now in vowels section. Listen carefully. Do not repeat—just focus on the short, clear sound. Notice how each vowel changes the letter sound quickly and lightly. You will have the opportunity to watch and repeat later. Click on Watch to continue'
		}
	  ],	  
	  repeat: [
		{
		  audio: 'alphabet_listen_step_heavy_letters.mp3',
		  text: 'You have completed Repeat step, all letters section.  You are now in Listen step, heavy letters section. Listen carefully. Do not repeat—just focus on the deep, strong sound. You will have the opportunity to watch and repeat later. Click on Listen to continue'
		},
		{
		  audio: 'alphabet_listen_step_light_letters.mp3',
		  text: 'You have completed Repeat step, heavy letters section.  You are now in Listen step, light letters section.  Listen carefully. Do not repeat—just focus on the soft, clear sound. Notice how the tongue stays relaxed and the sound is not heavy. You will have the opportunity to watch and repeat later. Click on Listen to continue'
		},
		{
		  audio: 'alphabet_listen_step_alifaa_letters.mp3',
		  text: 'You have completed Repeat step, heavy letters section. You are now in letters with Alif. Listen carefully. Do not repeat—just focus on the long, stretched sound. Notice how the sound is held longer and flows smoothly. You will have the opportunity to watch and repeat later. Click on Listen to continue'
		},
		{
		  audio: 'alphabet_listen_step_vowels_letters.mp3',
		  text: 'You have completed Repeat step, letters with Alif section.  You are now in vowels section. Listen carefully. Do not repeat—just focus on the short, clear sound. Notice how each vowel changes the letter sound quickly and lightly. You will have the opportunity to watch and repeat later. Click on Watch to continue'
		}
	  ],
	  
      trace1: [
		{
		  audio: 'step_trace1_pass2.mp3',
		  text: '...'
		}
	  ]
	},

		completion: {
		  audio: 'step_completion.mp3',
		  text: 'Congratulations. You have completed Alphabet Learn Unit. You can now move to unmanaged mode or to the next unit.'
		}
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
    imageBase: 'https://ehelacademy.b-cdn.net/pre_quraan/lessons/alphabet/media/listen_plus/animals/images/',
    audioBase: 'https://ehelacademy.b-cdn.net/pre_quraan/lessons/alphabet/media/listen_plus/animals/audio/',
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
    imageBase: 'https://ehelacademy.b-cdn.net/pre_quraan/lessons/alphabet/media/words/images/',
    audioBase: 'https://ehelacademy.b-cdn.net/pre_quraan/lessons/alphabet/media/words/audio/',
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
      alph_29: { letter: 'ء', word: 'أرنب',    image: 'hamza_arnab',     audio: 'hamza_arnab' }
    }
  },
	media: {

	  // Lecture
	  lectureUrl: 'https://ehelacademy.b-cdn.net/pre_quraan/messages/lectures/alphabet_lecture.mp4',

	  // Voice variants
	  voiceBases: {
		child_boy: 'https://ehelacademy.b-cdn.net/pre_quraan/lessons/lesson1/audios/child_boy_alphabet/',
		child_girl: 'https://ehelacademy.b-cdn.net/pre_quraan/lessons/lesson1/audios/child_girl_alphabet/',
		adult_male: 'https://ehelacademy.b-cdn.net/pre_quraan/lessons/lesson1/audios/adult_male_alphabet/',
		adult_female: 'https://ehelacademy.b-cdn.net/pre_quraan/lessons/lesson1/audios/adult_female_alphabet/'
	  },

	  // Default voice
	  adultMaleAlphaBase:
		'https://ehelacademy.b-cdn.net/pre_quraan/lessons/lesson1/audios/adult_male_alphabet/',

	  // Fallbacks
	  fallbackAudioBase:
		'https://ehelacademy.b-cdn.net/pre_quraan/lessons/lesson11/audios/',

	  fallbackWatchBase:
		'https://ehelacademy.b-cdn.net/pre_quraan/lessons/lesson6/videos/'
	},
  // Example long-word entries:
  // { key: 'alph_7', text: 'كهيعص', span: 2 },
  //  { key: 'alph_14', text: 'حم عسق', span: 2 },

  content: {
    items: [
			{ key: 'alph_1', text: 'ا', en: 'alif' },
			{ key: 'alph_2', text: 'ب', en: 'ba' },
			{ key: 'alph_3', text: 'ت', en: 'ta' },
			{ key: 'alph_4', text: 'ث', en: 'tha' },
			{ key: 'alph_5', text: 'ج', en: 'jeem' },
			{ key: 'alph_6', text: 'ح', en: 'ha' },
			{ key: 'alph_7', text: 'خ', en: 'kha' },
			{ key: 'alph_8', text: 'د', en: 'dal' },
			{ key: 'alph_9', text: 'ذ', en: 'dhal' },
			{ key: 'alph_10', text: 'ر', en: 'ra' },
			{ key: 'alph_11', text: 'ز', en: 'zay' },
			{ key: 'alph_12', text: 'س', en: 'seen' },
			{ key: 'alph_13', text: 'ش', en: 'sheen' },
			{ key: 'alph_14', text: 'ص', en: 'sad' },
			{ key: 'alph_15', text: 'ض', en: 'dad' },
			{ key: 'alph_16', text: 'ط', en: 'ta' },
			{ key: 'alph_17', text: 'ظ', en: 'za' },
			{ key: 'alph_18', text: 'ع', en: 'ayn' },
			{ key: 'alph_19', text: 'غ', en: 'ghayn' },
			{ key: 'alph_20', text: 'ف', en: 'fa' },
			{ key: 'alph_21', text: 'ق', en: 'qaf' },
			{ key: 'alph_22', text: 'ك', en: 'kaf' },
			{ key: 'alph_23', text: 'ل', en: 'lam' },
			{ key: 'alph_24', text: 'م', en: 'meem' },
			{ key: 'alph_25', text: 'ن', en: 'noon' },
			{ key: 'alph_26', text: 'ه', en: 'ha' },
			{ key: 'alph_27', text: 'و', en: 'waw' },
			{ key: 'alph_28', text: 'ي', en: 'ya' },
			{ key: 'alph_29', text: 'ء', en: 'hamza' }

    ]
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
  window.PQ_alphabet_listen = UNIT_CFG;
}
