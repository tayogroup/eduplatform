// ============================================================
// Muqattiat Listen Learn Unit - Unit Authoring Config
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
    unitId: 'muqattiat_listen',
    unitKey: 'muqattiat',
    storagePrefix: 'muqattiat_listen',
    keyPrefix: 'muq_'
  },

  moodle: {
    wsGetFunction: 'local_prequran_get_muqattiat_listen_state',
    wsSetFunction: 'local_prequran_set_muqattiat_listen_state'
  },

  release: {
    version: '1.0.0',
    assetVersion: 'muqattiat-v1.0.0'
  },

  assets: {
    cdnRoot: '/pre_quraan',
    unitMediaRoot: '/lessons/muqattiat/media',
    filePrefix: 'muq_',
    mediaPadWidth: 2,
    audioExt: '.mp3',
    soundAudioExt: '.mp3'
  },

  routes: {
    academyHomeUrl: 'https://quraan.academy/'
  },
  messaging: {
    useConfigStepMessages: true,
    disableLegacyCompletionFeedback: true
  },

  messageUi: {
    titleText: 'Message',
    continueText: 'Continue',
    clap: {
      enabled: true,
      visual: true,
      audio: '',
      delayMs: 120
    }
  },
  messageUnitKey: 'muqattiat_movement',
  // ==========================================================
  // STEP DEFINITIONS
  // ==========================================================
  steps: [
    { id: 'listen',     type: 'playlist',       label: 'Listen',  passFilters: ['all'] },
    { id: 'speak',      type: 'speak',          label: 'Speak',   passFilters: ['all'] },
    { id: 'lecture',    type: 'lecture',        label: 'Lecture', passFilters: ['all'] },
    { id: 'listenplus', type: 'playlist',       label: 'Listen+', passFilters: ['all'] },
    { id: 'watch',      type: 'video_playlist', label: 'Watch',   passFilters: ['all'] },
    { id: 'sound',      type: 'sound',          label: 'Sound',   passFilters: ['all'] },
    { id: 'repeat',     type: 'playlist',       label: 'Repeat',  passFilters: ['all'] },
    { id: 'match',      type: 'match',          label: 'Match',   passFilters: ['all'] },
    { id: 'animate',    type: 'animate',        label: 'Animate', passFilters: ['all'] },
    { id: 'trace1',     type: 'trace',          label: 'Write1',  passFilters: ['all'] },
    { id: 'submit',     type: 'submit',         label: 'Submit',  passFilters: ['all'] },
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
      outOfLives: 'You used all your lives. Let us try again.',
      restarting: 'Starting again...',
      completed: 'Great job! Match complete.'
    },

    audioMessages: {
      outOfLives: '',
      completed: ''
    }
  },

  messages: {
    base: '/pre_quraan/messages/unit_steps/muqattiat/',
    manifest: './unit.messages.js',
    version: 'muqattiat-messages-v1.0.0'
  },

  write: {
    chunkSize: 4,
    chunks: [4, 4, 4, 2],
    rows: 4,
    cols: 4,
    wideWords: [7, 14],
    spanWords: { 7: 2, 14: 2 },
    minPassesRequired: 14,

    adapter: {
      unitKey: 'muqattiat_listen',
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
    enabled: false,
    imageBase: '/pre_quraan/lessons/muqattiat/media/listen_plus/animals/images/',
    audioBase: '/pre_quraan/lessons/muqattiat/media/listen_plus/animals/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Listen+',
    subtitle: 'Arabic sound + animal sound',
    map: {}
  },


  words: {
    enabled: false,
    imageBase: '/pre_quraan/lessons/muqattiat/media/words/images/',
    audioBase: '/pre_quraan/lessons/muqattiat/media/words/audio/',
    imageExt: '.png',
    audioExt: '.mp3',
    title: 'Words',
    subtitle: 'Arabic letter + Arabic word',
    map: {}
  },
	media: {

	  // Lecture
	  lectureUrl: '/pre_quraan/lessons/muqattiat/media/video/lecture.mp4',

	  // Voice variants
	  voiceBases: {
		child_boy: '/pre_quraan/lessons/muqattiat/media/audio/male/',
		child_girl: '/pre_quraan/lessons/muqattiat/media/audio/male/',
		adult_male: '/pre_quraan/lessons/muqattiat/media/audio/male/',
		adult_female: '/pre_quraan/lessons/muqattiat/media/audio/male/'
	  },

	  // Default voice
	  adultMaleAlphaBase:
		'/pre_quraan/lessons/muqattiat/media/audio/male/',

	  // Fallbacks
	  l6Base:
		'/pre_quraan/lessons/muqattiat/media/audio/male/',

	  audioBase:
		'/pre_quraan/lessons/muqattiat/media/audio/male/',

	  fallbackAudioBase:
		'/pre_quraan/lessons/muqattiat/media/audio/male/',

	  fallbackWatchBase:
		'/pre_quraan/lessons/muqattiat/media/video/'
	},
  // Example long-word entries:
    
  content: {
    items: [
      { key: 'muq_1', text: 'الٓمّٓ', row: 1, displayCol: 4, audio: 'muq_01.mp3', video: 'muq_01.mp4' },
      { key: 'muq_2', text: 'الٓمّٓصٓ', row: 1, displayCol: 3, audio: 'muq_02.mp3', video: 'muq_02.mp4' },
      { key: 'muq_3', text: 'اٰلٓرٰ', row: 1, displayCol: 2, audio: 'muq_03.mp3', video: 'muq_03.mp4' },
      { key: 'muq_4', text: 'الٓمّٓرٰ', row: 1, displayCol: 1, audio: 'muq_04.mp3', video: 'muq_04.mp4' },
      { key: 'muq_5', text: 'كٓهٰيٰعٓصٓ', row: 2, displayCol: 3, span: 2, audio: 'muq_05.mp3', video: 'muq_05.mp4' },
      { key: 'muq_6', text: 'طٰهٰ', row: 2, displayCol: 2, audio: 'muq_06.mp3', video: 'muq_06.mp4' },
      { key: 'muq_7', text: 'طٰسٓمّٓ', row: 2, displayCol: 1, audio: 'muq_07.mp3', video: 'muq_07.mp4' },
      { key: 'muq_8', text: 'طٰسٓ', row: 3, displayCol: 4, audio: 'muq_08.mp3', video: 'muq_08.mp4' },
      { key: 'muq_9', text: 'يٰسٓ', row: 3, displayCol: 3, audio: 'muq_09.mp3', video: 'muq_09.mp4' },
      { key: 'muq_10', text: 'صٓ', row: 3, displayCol: 2, audio: 'muq_10.mp3', video: 'muq_10.mp4' },
      { key: 'muq_11', text: 'حٰمٓ', row: 3, displayCol: 1, audio: 'muq_11.mp3', video: 'muq_11.mp4' },
      { key: 'muq_12', text: 'حٰمٓ عٓسٓقٓ', row: 4, displayCol: 3, span: 2, audio: 'muq_12.mp3', video: 'muq_12.mp4' },
      { key: 'muq_13', text: 'قٓ', row: 4, displayCol: 2, audio: 'muq_13.mp3', video: 'muq_13.mp4' },
      { key: 'muq_14', text: 'نٓ', row: 4, displayCol: 1, audio: 'muq_14.mp3', video: 'muq_14.mp4' }
    ]
  }
});

if (typeof window !== 'undefined') {
  window.UNIT_CFG = UNIT_CFG;
  window.PQ_muqattiat_listen = UNIT_CFG;
}

