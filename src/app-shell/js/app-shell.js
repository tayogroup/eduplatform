// App shell UI.

import {
  I18N,
  LINK_MAP,
  ITEMS,
  LAST_CAT_KEY,
  LANG_KEY,
  BIG_KEY,
  DEFAULT_CAT,
  VIEW_ROOT,
  VIEW_MUQATTAAT,
  VIEW_TANWEEN_MENU,
  VIEW_TANWEEN,
  VIEW_TANWEEN_MVT,
  VIEW_TASHDEED,
  VIEW_TASHDEED_SHADDAH,
  VIEW_TASHDEED_SUKOON,
  VIEW_TASHDEED_TASHDEED,
  VIEW_TASHDEED_MADDAH,
  VIEW_FKD,
  VIEW_MADD,
  VIEW_SAKOON,
  VIEW_ENDING
} from './app-config.js?v=env-routing-20260519';

import {
  MUQATTAAT_ITEMS,
  TANWEEN_MENU_ITEMS,
  TANWEEN_ITEMS,
  TANWEEN_MVT_ITEMS,
  TASHDEED_ITEMS,
  TASHDEED_SHADDAH_ITEMS,
  TASHDEED_SUKOON_ITEMS,
  TASHDEED_TASHDEED_ITEMS,
  TASHDEED_MADDAH_ITEMS,
  FKD_ITEMS,
  MADD_ITEMS,
  SAKOON_ITEMS,
  ENDING_ITEMS
} from './tajweed-menus.js';

'use strict';

const catsEl        = document.getElementById('cats');
const gridEl        = document.getElementById('grid');
const appTitleEl    = document.getElementById('appTitle');
const parentLblEl   = document.getElementById('parentLbl');
const sectionTitleEl    = document.getElementById('sectionTitle');
const sectionSubtitleEl = document.getElementById('sectionSubtitle');
const btnBackView       = document.getElementById('btnBackView');

const gamesModal         = document.getElementById('gamesMenuModal');
const recordModal        = document.getElementById('recordMenuModal');
const harakatRecordModal = document.getElementById('harakatRecordModal');
const progressModal      = document.getElementById('progressModal');
const settingsModal      = document.getElementById('settingsModal');
const mobileInfoModal    = document.getElementById('mobileInfoModal');

/* ===== Dynamic games submenu content (Alphabet / Harakat / Joint) ===== */

const gamesTitleEl = gamesModal ? document.getElementById('gamesTitle') : null;
const gamesLinksEl = gamesModal ? gamesModal.querySelector('.games-links') : null;

// Preserve original Alphabet Dots content as default
const DEFAULT_GAMES_TITLE = gamesTitleEl ? gamesTitleEl.textContent : '';
const DEFAULT_GAMES_HTML  = gamesLinksEl ? gamesLinksEl.innerHTML : '';

// Config for Harakat Practice + Joint Practice
const GAMES_CONFIG = {
  "Harakat Practice": {
    title: "Harakat Practice",
    links: [
      {
        href: "https://ehelacademy.b-cdn.net/pre_quraan/scripts/harakat_letter_conveyor_belt.html",
        label: "Harakat Conveyor Belt"
      },
      {
        href: "https://ehelacademy.b-cdn.net/pre_quraan/scripts/harakat_sound_sniper6.html",
        label: "Harakat Sound Sniper"
      }
    ]
  },
  "Joint Practice": {
    title: "Joint Practice",
    links: [
      {
        href: "https://ehelacademy.b-cdn.net/pre_quraan/scripts/joint_2-letters_sound_sniper2.html",
        label: "Joint 2-Letters Sound Sniper"
      },
      {
        href: "https://ehelacademy.b-cdn.net/pre_quraan/scripts/joint_3-letters_sound_sniper.html",
        label: "Joint 3-Letters Sound Sniper"
      },
      {
        href: "https://ehelacademy.b-cdn.net/pre_quraan/scripts/joint_4-letters_sound_sniper2.html",
        label: "Joint 4-Letters Sound Sniper"
      },
      {
        href: "https://ehelacademy.b-cdn.net/pre_quraan/scripts/joint_2-letters_construction2.html",
        label: "Joint 2-Letters Construction"
      },
      {
        href: "https://ehelacademy.b-cdn.net/pre_quraan/scripts/joint_3-letters_construction2.html",
        label: "Joint 3-Letters Construction"
      },
      {
        href: "https://ehelacademy.b-cdn.net/pre_quraan/scripts/joint_4-letters_construction.html",
        label: "Joint 4-Letters Construction"
      }
    ]
  }
};

function setGamesMenuContent(sourceTitle){
  if (!gamesModal || !gamesLinksEl || !gamesTitleEl) return;

  const cfg = GAMES_CONFIG[sourceTitle];

  // If no special config (e.g. Alphabet Practice), restore default Alphabet Dots links
  if (!cfg) {
    gamesTitleEl.textContent = DEFAULT_GAMES_TITLE;
    gamesLinksEl.innerHTML   = DEFAULT_GAMES_HTML;
    return;
  }

  gamesTitleEl.textContent = cfg.title;
  gamesLinksEl.innerHTML   = '';

  cfg.links.forEach(link => {
    const a = document.createElement('a');
    a.className   = 'btn-link';
    a.href        = link.href;
    a.textContent = link.label;
    gamesLinksEl.appendChild(a);
  });
}

// New view + folder item for Extras → Pillars of Islam → 5 pillars
// Second level menus
const VIEW_PILLARS_MENU = 'pillars_menu';
const PILLARS_FOLDER_ITEM = { cat: 'Extras', t: 'Pillars of Islam', tag: '' };
const PILLARS_OF_FAITH_FOLDER_ITEM = { cat: 'Extras', t: 'Pillars of Faith', tag: '' };
const NAMES_ALLAH_FOLDER_ITEM  = { cat: 'Extras', t: 'Names of Allah', tag: '' };
const COMMON_QURAN_FOLDER_ITEM = { cat: 'Extras', t: 'Common Quran',  tag: '' };
const MANNERS_AKHLAQ_FOLDER_ITEM = { cat: 'Extras', t: 'Manners Akhlaq',  tag: '' };
const QURAN_MEMORIZATION_FOLDER_ITEM = { cat: 'Extras', t: 'Quran Memorization',  tag: '' };
const INTRO_TO_ARABIC_FOLDER_ITEM    = { cat: 'Extras', t: 'Intro to Arabic',     tag: '' };

/* ===== Section header copy ===== */

const SECTION_COPY = {
  alphabet: {
    title: 'Alphabet',
    subtitle: 'Learn Arabic letters, sounds, and dots in a fun way.'
  },
  movements: {
    title: 'Harakat (Movements)',
    subtitle: 'Practice short vowels and movements with colorful examples.'
  },
  joint: {
    title: 'Joint Letters',
    subtitle: 'See how letters connect to make real Arabic words.'
  },
  rules: {
    title: 'Rules',
    subtitle: 'Explore simple Tajweed rules with step-by-step practice.'
  },
  extras: {
    title: 'Extras',
    subtitle: 'Pillars of Islam, Names of Allah, Qur’an tools and more.'
  },
  default: {
    title: 'Explore',
    subtitle: 'Choose a section to start learning.'
  }
};

function updateSectionHeader() {
  if (!sectionTitleEl || !sectionSubtitleEl) return;
  const copy = SECTION_COPY[activeCat] || SECTION_COPY.default;
  sectionTitleEl.textContent    = copy.title;
  sectionSubtitleEl.textContent = copy.subtitle;
}

/* ===== Context-sensitive Back button ===== */

function updateBackButton() {
  if (!btnBackView) return;

  let targetView = null;
  let label      = 'Back';

  if (activeView === VIEW_ROOT) {
    targetView = null;
  } else if (
    activeView === VIEW_MUQATTAAT ||
    activeView === VIEW_TANWEEN_MENU ||
    activeView === VIEW_FKD ||
    activeView === VIEW_MADD ||
    activeView === VIEW_SAKOON ||
    activeView === VIEW_ENDING ||
    activeView === VIEW_TASHDEED ||
    activeView === VIEW_PILLARS_MENU
  ) {
    targetView = VIEW_ROOT;
    label = (activeCat === 'rules')
      ? 'Back to Rules'
      : (activeCat === 'extras' ? 'Back to Extras' : 'Back');
  } else if (
    activeView === VIEW_TANWEEN ||
    activeView === VIEW_TANWEEN_MVT
  ) {
    targetView = VIEW_TANWEEN_MENU;
    label = 'Back to Tanween Menu';
  } else if (
    activeView === VIEW_TASHDEED_SHADDAH ||
    activeView === VIEW_TASHDEED_SUKOON  ||
    activeView === VIEW_TASHDEED_TASHDEED ||
    activeView === VIEW_TASHDEED_MADDAH
  ) {
    targetView = VIEW_TASHDEED;
    label = 'Back to Tashdeed Menu';
  }

  if (!targetView) {
    btnBackView.classList.add('hidden');
    btnBackView.disabled = true;
    btnBackView.removeAttribute('data-target-view');
    btnBackView.removeAttribute('title');
    btnBackView.removeAttribute('aria-label');
    return;
  }

  btnBackView.classList.remove('hidden');
  btnBackView.disabled = false;
  btnBackView.dataset.targetView = targetView;
  btnBackView.setAttribute('aria-label', label);
  btnBackView.title = label;
}

/* ===== Rest of original DOM refs ===== */

const btnCloseRecord        = document.getElementById('btnCloseRecord');
const btnCloseHarakatRecord = document.getElementById('btnCloseHarakatRecord');
const btnCloseGames         = document.getElementById('btnCloseGames');
const btnCloseProgress      = document.getElementById('btnCloseProgress');
const btnCloseSettings      = document.getElementById('btnCloseSettings');
const btnCloseMobileInfo    = document.getElementById('btnCloseMobileInfo');

const btnBig       = document.getElementById('btnBig');
const btnSettings  = document.getElementById('btnSettings');
const btnProgress  = document.getElementById('btnProgress');
const langSel      = document.getElementById('lang');

let activeCat   = localStorage.getItem(LAST_CAT_KEY) || DEFAULT_CAT;
let activeView  = VIEW_ROOT;
let mobileInfoTimer = null;

function iconFor(cat){
  // Category icons (simple & safe SVGs)
  switch(cat){
    case 'alphabet':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18h2l1.2-3h5.6L16 18h2L12.9 4h-1.8L6 18zm3.8-5l2.1-5.6L14 13H9.8z" fill="#22c1e8"/></svg>';
    case 'movements':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h8l-2.5-2.5L12 8l6 6-6 6-1.5-1.5L13 16H5v-4z" fill="#66d992"/></svg>';
    case 'joint':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7a4 4 0 015.7 0l.6.6-1.4 1.4-.6-.6a2 2 0 10-2.9 2.9l.6.6-1.4 1.4-.6-.6A4 4 0 017 7zm10 10a4 4 0 01-5.7 0l-.6-.6 1.4-1.4.6.6a2 2 0 102.9-2.9l-.6-.6 1.4-1.4.6.6A4 4 0 0117 17z" fill="#fb923c"/></svg>';
    case 'rules':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6V3z" fill="#8b5cf6" opacity=".22"/><path d="M8 7h8M8 11h6M8 15h8" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/></svg>';
    case 'extras':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 5.3 5.8.5-4.4 3.8 1.3 5.7L12 14.9 7.1 17.3l1.3-5.7L4 7.8l5.8-.5L12 2z" fill="#ec4899"/></svg>';
    default:
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="#94a3b8" opacity=".35"/></svg>';
  }
}


/* ===== Content-level unit art (icons + stickers) ===== */
function unitKeyFromTitle(title){
  const t = (title || '').toLowerCase();
  if (t.includes('listen')) return 'listen';
  if (t.includes('watch')) return 'watch';
  if (t.includes('match')) return 'match';
  if (t.includes('speak')) return 'speak';
  if (t.includes('write')) return 'write';
  if (t.includes('record')) return 'record';
  if (t.includes('practice')) return 'practice';
  if (t.includes('quiz')) return 'quiz';
  if (t.includes('game') || t.includes('dots')) return 'game';
  if (t.includes('quran') || t.includes('common quran')) return 'quran';
  return 'learn';
}

function unitStickerFor(title){
  const key = unitKeyFromTitle(title);
  switch(key){
    case 'listen': return '🎧';
    case 'watch': return '▶️';
    case 'match': return '🧩';
    case 'speak': return '🎙️';
    case 'write': return '✍️';
    case 'record': return '🔴';
    case 'practice': return '⭐';
    case 'quiz': return '❓';
    case 'game': return '🎮';
    case 'quran': return '📖';
    default: return '✨';
  }
}

function tileTintForUnit(unit){
  switch(unit){
    case 'listen': return 'blue';
    case 'watch': return 'purple';
    case 'match': return 'green';
    case 'write': return 'orange';
    case 'speak': return 'blue';
    case 'record': return 'pink';
    case 'practice': return 'orange';
    case 'quiz': return 'slate';
    case 'game': return 'green';
    case 'quran': return 'orange';
    default: return 'blue';
  }
}

function unitIconFor(title){
  const key = unitKeyFromTitle(title);

  // Illustrated mini-thumbnails (SVG). No external assets.
  switch(key){
    case 'listen': return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgL" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#aee9ff"/><stop offset="1" stop-color="#e7f5ff"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgL)"/>
      <path d="M7.5 11.2v3.1a2.2 2.2 0 01-2.2 2.2H5v-5.3h.3a2.2 2.2 0 012.2-2z" fill="#22c1e8" opacity=".9"/>
      <path d="M16.5 11.2v3.1a2.2 2.2 0 002.2 2.2H19v-5.3h-.3a2.2 2.2 0 00-2.2-2z" fill="#22c1e8" opacity=".9"/>
      <path d="M9.1 10.3a2.9 2.9 0 015.8 0v4.5a2.9 2.9 0 01-5.8 0v-4.5z" fill="#0f2230" opacity=".12"/>
      <path d="M9.1 10.3a2.9 2.9 0 015.8 0" fill="none" stroke="#0f2230" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
      <path d="M8 17.2c1 .9 2.4 1.4 4 1.4s3-.5 4-1.4" fill="none" stroke="#ff7a18" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="17.9" cy="8.1" r="1" fill="#ff7a18"/><circle cx="6.1" cy="8.6" r=".9" fill="#66d992"/></svg>`;
    case 'watch': return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgW" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#d8ccff"/><stop offset="1" stop-color="#f2f0ff"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgW)"/>
      <rect x="5.5" y="7.2" width="13" height="9.6" rx="3" fill="#ffffff" opacity=".9"/>
      <path d="M11 9.3l5 3-5 3v-6z" fill="#0f2230" opacity=".75"/>
      <path d="M7.5 18.3h9" stroke="#0f2230" stroke-width="1.6" stroke-linecap="round" opacity=".28"/>
      <circle cx="18.7" cy="6.4" r="1" fill="#22c1e8"/><circle cx="16.9" cy="5.6" r=".7" fill="#ff7a18"/></svg>`;
    case 'match': return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgM" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#baf3c6"/><stop offset="1" stop-color="#e9fff1"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgM)"/>
      <rect x="6" y="7" width="6.6" height="6.6" rx="2.2" fill="#ffffff" opacity=".92"/>
      <rect x="11.4" y="10.4" width="6.6" height="6.6" rx="2.2" fill="#ffffff" opacity=".92"/>
      <path d="M7.6 10.4l1.4 1.4 2.6-3" fill="none" stroke="#22c55e" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12.7 13.8l1.2 1.2 2.4-2.8" fill="none" stroke="#22c55e" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
      <circle cx="18.2" cy="7.1" r="1" fill="#ff7a18"/></svg>`;
    case 'speak': return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgS" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#fff2cf"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgS)"/>
      <rect x="9.2" y="6.3" width="5.6" height="9.6" rx="2.8" fill="#ffffff" opacity=".92"/>
      <path d="M8 12a4 4 0 008 0" fill="none" stroke="#0f2230" stroke-width="1.7" stroke-linecap="round" opacity=".75"/>
      <path d="M12 16.2v2" stroke="#0f2230" stroke-width="1.7" stroke-linecap="round" opacity=".55"/>
      <path d="M16.2 10.2c1.2.8 1.9 1.8 1.9 2.9s-.7 2.2-1.9 2.9" fill="none" stroke="#ff7a18" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M17.4 9.1c1.7 1.2 2.7 2.6 2.7 4s-1 2.8-2.7 4" fill="none" stroke="#ff7a18" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></svg>`;
    case 'write': return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgP" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffcae9"/><stop offset="1" stop-color="#ffeaf6"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgP)"/>
      <path d="M7 16.6l.8 2.5 2.6-.7 7.1-7.1-2.6-2.6L7 16.6z" fill="#0f2230" opacity=".18"/>
      <path d="M13.8 8.7l2.6 2.6" stroke="#ff7a18" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M6.8 19.1h10.8" stroke="#0f2230" stroke-width="1.4" stroke-linecap="round" opacity=".35"/>
      <circle cx="6.6" cy="8.2" r="1" fill="#22c1e8"/></svg>`;
    case 'record': return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgR" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffe1e1"/><stop offset="1" stop-color="#fff5f5"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgR)"/>
      <rect x="6.2" y="7" width="2.2" height="10" rx="1.1" fill="#0f2230" opacity=".12"/>
      <rect x="15.6" y="6" width="2.2" height="12" rx="1.1" fill="#0f2230" opacity=".12"/>
      <circle cx="12" cy="12" r="4.2" fill="#ef4444" opacity=".95"/>
      <circle cx="10.8" cy="10.9" r="1" fill="#fff" opacity=".75"/></svg>`;
    case 'practice': return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgPr" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff7d1"/><stop offset="1" stop-color="#fff2cf"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgPr)"/>
      <path d="M12 6.3l5.8 5.7L12 17.7 6.2 12 12 6.3z" fill="#0f2230" opacity=".10"/>
      <path d="M9 12.2l1.6 1.6 4.3-5" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="18.3" cy="8" r=".9" fill="#ff7a18"/></svg>`;
    case 'quiz': return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgQ" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#f8fafc"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgQ)"/>
      <rect x="7" y="6.5" width="10" height="12" rx="2.5" fill="#ffffff" opacity=".92"/>
      <path d="M9 9h6M9 12h5M9 15h6" stroke="#0f2230" stroke-width="1.4" stroke-linecap="round" opacity=".35"/>
      <path d="M10 9.2c.2-1.2 1.2-2 2.4-2 1.4 0 2.4.9 2.4 2 0 .8-.4 1.2-1.1 1.7-.7.4-1 .7-1 1.5" fill="none" stroke="#0f2230" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>
      <circle cx="12" cy="16.9" r=".9" fill="#ff7a18"/></svg>`;
    case 'game': return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#d6fff0"/><stop offset="1" stop-color="#f1fff9"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgG)"/>
      <path d="M7.1 10.2h9.8a3.3 3.3 0 013.3 3.3v1.6a2.4 2.4 0 01-2.4 2.4h-.7l-1.6-1.5H9.5L7.9 17.5h-.7a2.4 2.4 0 01-2.4-2.4v-1.6a3.3 3.3 0 013.3-3.3z" fill="#ffffff" opacity=".92"/>
      <path d="M9.2 13.1H7.6m.8-.8v1.6" stroke="#0f2230" stroke-width="1.7" stroke-linecap="round"/>
      <circle cx="15.9" cy="13.2" r=".9" fill="#ff7a18"/><circle cx="17.8" cy="12.1" r=".9" fill="#22c1e8"/></svg>`;
    case 'quran': return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgB" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffe8b7"/><stop offset="1" stop-color="#fff6df"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgB)"/>
      <path d="M7 6.2h10v11.6a2 2 0 01-2 2H9a2 2 0 01-2-2V6.2z" fill="#ffffff" opacity=".92"/>
      <path d="M9 9h6M9 12h5M9 15h6" stroke="#0f2230" stroke-width="1.4" stroke-linecap="round" opacity=".35"/>
      <path d="M12 8c1.4 1.7 2 2.8 2 3.8A2 2 0 0112 13a2 2 0 01-2-1.2c0-1 .6-2.1 2-3.8z" fill="#ff7a18" opacity=".95"/></svg>`;
    default: return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="bgD" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e7f5ff"/><stop offset="1" stop-color="#fff2cf"/></linearGradient></defs>
      <rect x="2.5" y="3" width="19" height="18" rx="6" fill="url(#bgD)"/>
      <path d="M7 7h10v10H7V7z" fill="#ffffff" opacity=".92"/>
      <path d="M9 10h6M9 13h4" stroke="#0f2230" stroke-width="1.4" stroke-linecap="round" opacity=".4"/>
      <circle cx="17.8" cy="7.3" r=".9" fill="#66d992"/></svg>`;
  }
}

function tintMap(cat, fallback){
  const map = {
    alphabet:'blue',
    movements:'green',
    joint:'orange',
    rules:'purple',
    extras:'teal',
    pillars:'brown',
    muqattaat:'purple',
    tanween_menu:'purple',
    tanween:'purple',
    tanween_mvt:'purple',
    tashdeed_menu:'blue',
    tashdeed_shaddah:'blue',
    tashdeed_sukoon:'blue',
    tashdeed_tashdeed:'blue',
    tashdeed_maddah:'blue',
    fkd:'orange',
    madd:'blue',
    sakoon:'pink',
    ending:'yellow'
  };
  return map[cat] || fallback || 'blue';
}

function buzz(ms = 20){
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch(_) {}
}

function isMobileWidth(){
  return window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
}

function makeTile(item){
  const langCode = langSel.value;
  const L = I18N[langCode] || I18N.en;

  const tile = document.createElement('a');
  tile.className = 'tile';

  const link = LINK_MAP[item.t] || LINK_MAP[item.t + " (Harakat)"];
  tile.href = (link && !link.startsWith('#')) ? link : '#';

  if (!link || link.startsWith('#')) {
    tile.addEventListener('click', (e) => e.preventDefault());
  }

  tile.dataset.cat   = item.cat;
  tile.dataset.tag   = item.tag || '';
  tile.title         = item.t;
  tile.dataset.title = item.t;

  const thumb = document.createElement('div');
  thumb.className   = 'thumb';
  thumb.dataset.tint = tintMap(item.cat, item.tint);

  const ar = document.createElement('div');
  ar.className = 'arlabel';

  const baseLabel = I18N[langCode].cats?.[item.cat] || item.cat;
  const labelSpan = document.createElement('span');
  labelSpan.className = 'artext';
  labelSpan.textContent = baseLabel;

  let chipText;
  if (item.tag) {
    const tagStr = item.tag.toString();
    chipText = tagStr.startsWith('Unit') ? tagStr : tagStr.replace("unit","Unit ");
  } else {
    chipText = "Unit";
  }

  const unitSpan = document.createElement('span');
  unitSpan.className = 'unit-pill';
  unitSpan.textContent = chipText;

  ar.append(labelSpan, unitSpan);
  thumb.appendChild(ar);

  const mark = document.createElement('div');
  mark.className = 'catmark';
  mark.innerHTML = iconFor(item.cat);
  thumb.appendChild(mark);

  // Apply per-unit tint to thumbnail area
  thumb.dataset.tint = tileTintForUnit(tile.dataset.unit || 'learn');

  // Big illustrated art inside thumbnail
  const art = document.createElement('div');
  art.className = 'tileart';
  art.innerHTML = unitIconFor(item.t);
  const svg = art.querySelector('svg');
  if (svg){ svg.style.width = '100%'; svg.style.height = 'auto'; }
  thumb.appendChild(art);

  // Corner badge (tiny sticker)
  const cb = document.createElement('div');
  cb.className = 'cornerbadge';
  cb.dataset.unit = tile.dataset.unit || 'learn';
  cb.textContent = unitStickerFor(item.t);
  thumb.appendChild(cb);

  // Unit type for styling + corner sticker
  tile.dataset.unit = unitKeyFromTitle(item.t);

  const caption = document.createElement('div');
  caption.className = 'caption';

  const titleRow = document.createElement('div');
  titleRow.className = 'title-row';

  const titleEl = document.createElement('div');
  titleEl.className = 'title2';
  titleEl.textContent = (L.tiles?.[item.t]) || item.t;
  titleRow.appendChild(titleEl);

  const guideBtn = document.createElement('button');
  guideBtn.type = 'button';
  guideBtn.className = 'guide-inline';
  guideBtn.setAttribute('aria-label','Help / User guide');
  guideBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7l8 5-8 5V7z" fill="#0d2c3a"/></svg>';

  guideBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    ev.preventDefault();

    if (item.t === "Alphabet Listen") {
      window.open(
        "",
        "_blank"
      );
      return;
    }

    const lnk = LINK_MAP[item.t] || LINK_MAP[item.t + " (Harakat)"];
    if (!lnk) return;

    if (lnk.startsWith('#')) {
      // Adjust games modal content when opened via the guide button
      setGamesMenuContent(item.t);
      openModalByHash(lnk);
    } else {
      window.open(lnk, "_blank");
    }
  });

  titleRow.appendChild(guideBtn);

  caption.appendChild(titleRow);
  tile.append(thumb, caption);

  return tile;
}

function renderGrid(){
  gridEl.innerHTML = '';
  updateBackButton();
  const frag = document.createDocumentFragment();

  if (activeView === VIEW_MUQATTAAT) {
    MUQATTAAT_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_TANWEEN_MENU) {
    TANWEEN_MENU_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_TANWEEN) {
    TANWEEN_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_TANWEEN_MVT) {
    TANWEEN_MVT_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_TASHDEED) {
    TASHDEED_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_TASHDEED_SHADDAH) {
    TASHDEED_SHADDAH_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_TASHDEED_SUKOON) {
    TASHDEED_SUKOON_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_TASHDEED_TASHDEED) {
    TASHDEED_TASHDEED_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_TASHDEED_MADDAH) {
    TASHDEED_MADDAH_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_FKD) {
    FKD_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_MADD) {
    MADD_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_SAKOON) {
    SAKOON_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_ENDING) {
    ENDING_ITEMS.forEach(it => frag.appendChild(makeTile(it)));
  } else if (activeView === VIEW_PILLARS_MENU) {
    ITEMS.forEach(it => {
      if (it.cat === 'pillars') {
        frag.appendChild(makeTile(it));
      }
    });
  } else {
    if (activeCat === 'extras') {
      [
        PILLARS_FOLDER_ITEM,
        PILLARS_OF_FAITH_FOLDER_ITEM,
        NAMES_ALLAH_FOLDER_ITEM,
        COMMON_QURAN_FOLDER_ITEM,
		MANNERS_AKHLAQ_FOLDER_ITEM,
        QURAN_MEMORIZATION_FOLDER_ITEM,
        INTRO_TO_ARABIC_FOLDER_ITEM
      ].forEach(it => frag.appendChild(makeTile(it)));
    } else {
      ITEMS.forEach(it => {
        if (it.cat === activeCat) {
          frag.appendChild(makeTile(it));
        }
      });
    }
  }

  if (!frag.childNodes.length) {
    const empty = document.createElement('div');
    empty.style.cssText = "opacity:.75;font:900 14px system-ui;padding:14px;text-align:center;";
    empty.textContent = 'No results.';
    gridEl.appendChild(empty);
  } else {
    gridEl.appendChild(frag);
  }
}

function setActiveCatUI(){
  catsEl.querySelectorAll('.cat').forEach(catEl => {
    const on = (catEl.dataset.cat === activeCat);
    catEl.classList.toggle('active', on);
    catEl.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

const MODALS = {
  '#games':         gamesModal,
  '#record':        recordModal,
  '#harakatRecord': harakatRecordModal,
  '#progress':      progressModal,
  '#settings':      settingsModal
};

function openModal(modal){
  if (!modal) return;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  const first = modal.querySelector('a.btn-link, .btn-close, a, button, select');
  if (first) {
    try { first.focus(); } catch(_) {}
  }
}

function openModalByHash(hash){
  const modal = MODALS[hash];
  if (!modal) return;
  openModal(modal);
}

function closeModal(modal){
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
}

const mobileInfoModalEl = mobileInfoModal;

function openMobileInfo(){
  if (!mobileInfoModalEl) return;
  mobileInfoModalEl.classList.add('show');
  mobileInfoModalEl.setAttribute('aria-hidden','false');
  if (mobileInfoTimer) clearTimeout(mobileInfoTimer);
  mobileInfoTimer = setTimeout(closeMobileInfo, 2000);
}

function closeMobileInfo(){
  if (!mobileInfoModalEl) return;
  mobileInfoModalEl.classList.remove('show');
  mobileInfoModalEl.setAttribute('aria-hidden','true');
  if (mobileInfoTimer){
    clearTimeout(mobileInfoTimer);
    mobileInfoTimer = null;
  }
}

function buildCategoryUI(){
  catsEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  const keys = ['alphabet','movements','joint','rules','extras'];

  for (const key of keys) {
    const el = document.createElement('div');
    el.className   = 'cat';
    el.tabIndex    = 0;
    el.dataset.cat = key;
    el.innerHTML   = `<div class="icon">${iconFor(key)}</div><span></span>`;
    frag.appendChild(el);
  }
  catsEl.appendChild(frag);
}

function applyLanguageTexts(){
  const langCode = langSel.value;
  const L = I18N[langCode] || I18N.en;

  document.documentElement.lang = L._lang;
  document.documentElement.dir  = L._dir;
  document.body.classList.toggle('rtl', L._dir === 'rtl');

  if (parentLblEl) parentLblEl.textContent = L.parentLbl || 'Parent';
  if (appTitleEl)  appTitleEl.textContent  = L.title;

  catsEl.querySelectorAll('.cat').forEach(catEl => {
    const key = catEl.dataset.cat;
    const span = catEl.querySelector('span');
    if (span) {
      if (L.cats && L.cats[key]) {
        span.textContent = L.cats[key];
      } else if (key === 'extras') {
        span.textContent = 'Extras';
      }
    }
  });
}

/* ===== Init ===== */

(function init(){
  buildCategoryUI();

  const urlLang     = new URLSearchParams(location.search).get('lang');
  const storedLang  = localStorage.getItem(LANG_KEY);
  const initialLang = I18N[urlLang] ? urlLang : (I18N[storedLang] ? storedLang : 'en');
  langSel.value = initialLang;

  applyLanguageTexts();

  const bigOn = localStorage.getItem(BIG_KEY) === '1';
  document.body.classList.toggle('big', bigOn);
  btnBig.setAttribute('aria-pressed', bigOn ? 'true' : 'false');

  const validCats = new Set(['alphabet','movements','joint','rules','extras']);
  if (!validCats.has(activeCat)) activeCat = DEFAULT_CAT;

  activeView = VIEW_ROOT;

  setActiveCatUI();
  updateSectionHeader();
  renderGrid();

  if (isMobileWidth()) {
    openMobileInfo();
  }
})();

/* ===== Event handlers ===== */

catsEl.addEventListener('click', (e) => {
  const catEl = e.target.closest('.cat');
  if (!catEl) return;
  activeCat = catEl.dataset.cat;
  localStorage.setItem(LAST_CAT_KEY, activeCat);
  activeView = VIEW_ROOT;
  setActiveCatUI();
  updateSectionHeader();
  renderGrid();
  buzz();
});

gridEl.addEventListener('click', (e) => {
  const tile = e.target.closest('.tile');
  if (!tile) return;

  const title = tile.dataset.title || tile.title;

  // FOLDER TILES – open submenus

  // Pillars of Islam folder under Extras root
  if (title === "Pillars of Islam" && activeCat === 'extras' && activeView === VIEW_ROOT) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_PILLARS_MENU;
    renderGrid();
    buzz();
    return;
  }

  // Muqatta'at folder under Rules root
  if (title === "Muqatta'at Basics" && activeCat === 'rules' && activeView === VIEW_ROOT) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_MUQATTAAT;
    renderGrid();
    buzz();
    return;
  }

  // Tanween folder under Rules root
  if (title === "Tanween" && activeCat === 'rules' && activeView === VIEW_ROOT) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_TANWEEN_MENU;
    renderGrid();
    buzz();
    return;
  }

  // From Tanween menu → Tanween detailed
  if (title === "Tanween" && activeView === VIEW_TANWEEN_MENU) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_TANWEEN;
    renderGrid();
    buzz();
    return;
  }

  // From Tanween menu → Tanween & Movement detailed
  if (title === "Tanween & Movement" && activeView === VIEW_TANWEEN_MENU) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_TANWEEN_MVT;
    renderGrid();
    buzz();
    return;
  }

  // Tashdeed folder under Rules root
  if (title === "Tashdeed Shaddah" && activeCat === 'rules' && activeView === VIEW_ROOT) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_TASHDEED;
    renderGrid();
    buzz();
    return;
  }

  // From Tashdeed menu → each detailed submenu
  if (title === "Tashdeed Shaddah" && activeView === VIEW_TASHDEED) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_TASHDEED_SHADDAH;
    renderGrid();
    buzz();
    return;
  }

  if (title === "Tashdeed With Sukoon" && activeView === VIEW_TASHDEED) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_TASHDEED_SUKOON;
    renderGrid();
    buzz();
    return;
  }

  if (title === "Tashdeed With tashdeed" && activeView === VIEW_TASHDEED) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_TASHDEED_TASHDEED;
    renderGrid();
    buzz();
    return;
  }

  if (title === "Tashdeed With Haroof Maddah" && activeView === VIEW_TASHDEED) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_TASHDEED_MADDAH;
    renderGrid();
    buzz();
    return;
  }

  // Fatha-Kasra-Damma folder → detailed submenu
  if (title === "Fatha-Kasra-Damma" && activeCat === 'rules' && activeView === VIEW_ROOT) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_FKD;
    renderGrid();
    buzz();
    return;
  }

  // MaddoLeen folder → detailed submenu
  if (title === "MaddoLeen" && activeCat === 'rules' && activeView === VIEW_ROOT) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_MADD;
    renderGrid();
    buzz();
    return;
  }

  // Sakoon & Jazm folder → detailed submenu
  if (title === "Sakoon & Jazm" && activeCat === 'rules' && activeView === VIEW_ROOT) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_SAKOON;
    renderGrid();
    buzz();
    return;
  }

  // Ending of Rules folder → detailed submenu
  if (title === "Ending of Rules" && activeCat === 'rules' && activeView === VIEW_ROOT) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_ENDING;
    renderGrid();
    buzz();
    return;
  }

  // OLD BACK TILES: left in code for safety, but tiles are now removed from menus,
  // so these conditions will normally never hit.

  if (title === "Back to Rules" && activeView !== VIEW_ROOT) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_ROOT;
    renderGrid();
    buzz();
    return;
  }

  if (title === "Back to Tanween Menu" &&
      (activeView === VIEW_TANWEEN || activeView === VIEW_TANWEEN_MVT)) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_TANWEEN_MENU;
    renderGrid();
    buzz();
    return;
  }

  if (title === "Back to Tashdeed Menu" &&
      (activeView === VIEW_TASHDEED_SHADDAH ||
       activeView === VIEW_TASHDEED_SUKOON ||
       activeView === VIEW_TASHDEED_TASHDEED ||
       activeView === VIEW_TASHDEED_MADDAH)) {
    e.preventDefault();
    e.stopPropagation();
    activeView = VIEW_TASHDEED;
    renderGrid();
    buzz();
    return;
  }

  const link = LINK_MAP[title] || LINK_MAP[title + " (Harakat)"];
  if (!link) return;

  if (link.startsWith('#')) {
    e.preventDefault();
    e.stopPropagation();

    setGamesMenuContent(title);
    openModalByHash(link);
    buzz();
    return;
  }

  buzz();
  window.location.href = link;
});

if (btnBackView) {
  btnBackView.addEventListener('click', () => {
    const targetView = btnBackView.dataset.targetView;
    if (!targetView) return;

    if (targetView === VIEW_ROOT) {
      activeView = VIEW_ROOT;
    } else {
      activeView = targetView;
    }
    renderGrid();
    buzz();
  });
}

if (btnProgress) {
  btnProgress.addEventListener('click', () => {
    openModalByHash('#progress');
    buzz();
  });
}
if (btnSettings) {
  btnSettings.addEventListener('click', () => {
    openModalByHash('#settings');
    buzz();
  });
}

btnCloseGames.addEventListener('click', () => { closeModal(gamesModal); buzz(); });
btnCloseRecord.addEventListener('click', () => { closeModal(recordModal); buzz(); });
btnCloseHarakatRecord.addEventListener('click', () => { closeModal(harakatRecordModal); buzz(); });
btnCloseProgress.addEventListener('click', () => { closeModal(progressModal); buzz(); });
btnCloseSettings.addEventListener('click', () => { closeModal(settingsModal); buzz(); });
btnCloseMobileInfo.addEventListener('click', () => { closeMobileInfo(); buzz(); });

Object.values(MODALS).forEach(modal => {
  if (!modal) return;
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
      buzz();
    }
  });
});
if (mobileInfoModalEl) {
  mobileInfoModalEl.addEventListener('click', (e) => {
    if (e.target === mobileInfoModalEl) {
      closeMobileInfo();
      buzz();
    }
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;

  const openModalEl = Object.values(MODALS).find(
    modal => modal && modal.classList.contains('show')
  );
  if (openModalEl) closeModal(openModalEl);

  if (mobileInfoModalEl && mobileInfoModalEl.classList.contains('show')) {
    closeMobileInfo();
  }
});

langSel.addEventListener('change', () => {
  const lang = langSel.value;
  localStorage.setItem(LANG_KEY, lang);
  applyLanguageTexts();
  updateSectionHeader();
  renderGrid();
});

btnBig.addEventListener('click', () => {
  const on = !document.body.classList.contains('big');
  document.body.classList.toggle('big', on);
  localStorage.setItem(BIG_KEY, on ? '1' : '0');
  btnBig.setAttribute('aria-pressed', on ? 'true' : 'false');
  buzz();
});


/* ===== Hub hero interactions + How-to modal ===== */
const btnStartLearning = document.getElementById('btnStartLearning');
const btnHowToUse = document.getElementById('btnHowToUse');
const howtoModal = document.getElementById('howtoModal');
const btnCloseHowto = document.getElementById('btnCloseHowto');

function scrollToCategories(){
  const target = document.getElementById('sectionHeader') || catsEl || gridEl;
  if (!target) return;
  try { target.scrollIntoView({behavior:'smooth', block:'start'}); } catch(e){ target.scrollIntoView(); }
}
function openHowto(){
  if (!howtoModal) return;
  howtoModal.classList.add('show');
  howtoModal.setAttribute('aria-hidden','false');
  buzz();
}
function closeHowto(){
  if (!howtoModal) return;
  howtoModal.classList.remove('show');
  howtoModal.setAttribute('aria-hidden','true');
  buzz();
}

if (btnStartLearning) btnStartLearning.addEventListener('click', ()=>{ buzz(); scrollToCategories(); });
if (btnHowToUse) btnHowToUse.addEventListener('click', openHowto);
if (btnCloseHowto) btnCloseHowto.addEventListener('click', closeHowto);
if (howtoModal) howtoModal.addEventListener('click', (e)=>{ if (e.target === howtoModal) closeHowto(); });
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeHowto(); });

/* Rewards strip (visual only) */
function updateRewardsStrip(){
  const wl = document.getElementById('worldLabel');
  const rf = document.getElementById('rewardsFill');
  if (wl){
    const worldMap = { alphabet:"Alphabet World", movements:"Movements World", joint:"Join Letters World", rules:"Rules / Tajweed", extras:"Extras & Games" };
    wl.textContent = worldMap[activeCat] || "Learning World";
  }
  if (rf){
    const pct = { alphabet:38, movements:22, joint:18, rules:12, extras:28 }[activeCat] ?? 20;
    rf.style.width = pct + "%";
  }
}

// Hook into existing category UI update by patching updateSectionHeader (if exists)
const __origUpdateSectionHeader = typeof updateSectionHeader === 'function' ? updateSectionHeader : null;
if (__origUpdateSectionHeader){
  updateSectionHeader = function(){
    __origUpdateSectionHeader();
    updateRewardsStrip();
  };
}
