// App shell configuration.

// Language + category labels
export const I18N = {
  en:{ _dir:'ltr', _lang:'en', title:'Pre-Quran Arabic', parentLbl:'Parent',
    cats:{
      alphabet:'Alphabet',
      movements:'Movements',
      joint:'Joint',
      rules:'Rules / Tajweed',
      pillars:'Pillars of Islam',
      muqattaat:"Muqattiat",
      tanween_menu:"Tanween",
      tanween:"Tanween",
      tanween_mvt:"Tanween & Movement",
      tashdeed_menu:"Tashdeed",
      tashdeed_shaddah:"Tashdeed Shaddah",
      tashdeed_sukoon:"Tashdeed With Sukoon",
      tashdeed_tashdeed:"Tashdeed With tashdeed",
      tashdeed_maddah:"Tashdeed With Haroof Maddah",
      fkd:"Fatha-Kasra-Damma",
      madd:"MaddoLeen",
      sakoon:"Sakoon & Jazm",
      ending:"Ending of Rules"
    },
    tiles:{
      "Muqatta'at Basics":"Muqattiat"
    } 
  },
  ar:{ _dir:'rtl', _lang:'ar', title:'الدورة التمهيدية للعربية', parentLbl:'وليّ الأمر',
    cats:{
      alphabet:'الحروف',
      movements:'الحركات',
      joint:'المتصلة',
      rules:'القواعد والتجويد',
      pillars:'أركان الإسلام',
      muqattaat:"الحروف المقطعة",
      tanween_menu:"التنوين",
      tanween:"التنوين",
      tanween_mvt:"التنوين والحركات",
      tashdeed_menu:"التشديد",
      tashdeed_shaddah:"تشديد شدة",
      tashdeed_sukoon:"تشديد مع سكون",
      tashdeed_tashdeed:"تشديد مع تشديد",
      tashdeed_maddah:"تشديد مع حروف المد",
      fkd:"الفتحة والكسرة والضمة",
      madd:"مد ولین",
      sakoon:"السكون والجزم",
      ending:"خاتمة القواعد"
    } },
  ur:{ _dir:'rtl', _lang:'ur', title:'پری قرآن عربی', parentLbl:'والدین',
    cats:{
      alphabet:'حروف',
      movements:'حرکات',
      joint:'جوائنٹ',
      rules:'قواعد و تجوید',
      pillars:'ارکانِ اسلام',
      muqattaat:"مقطعات",
      tanween_menu:"تنوین",
      tanween:"تنوین",
      tanween_mvt:"تنوین اور حرکات",
      tashdeed_menu:"تشدید",
      tashdeed_shaddah:"تشدید شدہ",
      tashdeed_sukoon:"تشدید مع سکون",
      tashdeed_tashdeed:"تشدید مع تشدید",
      tashdeed_maddah:"تشدید مع حروف مد",
      fkd:"زبر زیر پیش",
      madd:"مد و لین",
      sakoon:"سکون و جزم",
      ending:"قواعد کا اختتام"
    } },
  sw:{ _dir:'ltr', _lang:'sw', title:'Kozi ya Kiarabu — Awali', parentLbl:'Mzazi',
    cats:{
      alphabet:'Alfabeti',
      movements:'Harakati',
      joint:'Joint',
      rules:'Kanuni / Tajweed',
      pillars:'Nguzo za Uislamu',
      muqattaat:"Muqatta'at",
      tanween_menu:"Tanween",
      tanween:"Tanween",
      tanween_mvt:"Tanween & Movement",
      tashdeed_menu:"Tashdeed",
      tashdeed_shaddah:"Tashdeed Shaddah",
      tashdeed_sukoon:"Tashdeed With Sukoon",
      tashdeed_tashdeed:"Tashdeed With tashdeed",
      tashdeed_maddah:"Tashdeed With Haroof Maddah",
      fkd:"Fatha-Kasra-Damma",
      madd:"MaddoLeen",
      sakoon:"Sakoon & Jazm",
      ending:"Ending of Rules"
    } },
  so:{ _dir:'ltr', _lang:'so', title:'Koorsada Carabiga — Hordhac', parentLbl:'Waalid',
    cats:{
      alphabet:'Alfabeet',
      movements:'Haraqaad',
      joint:'Joint',
      rules:'Xeerarka / Tajwiidka',
      pillars:'Tiirarka Islaamka',
      muqattaat:"Muqatta'at",
      tanween_menu:"Tanween",
      tanween:"Tanween",
      tanween_mvt:"Tanween & Movement",
      tashdeed_menu:"Tashdeed",
      tashdeed_shaddah:"Tashdeed Shaddah",
      tashdeed_sukoon:"Tashdeed With Sukoon",
      tashdeed_tashdeed:"Tashdeed With tashdeed",
      tashdeed_maddah:"Tashdeed With Haroof Maddah",
      fkd:"Fatha-Kasra-Damma",
      madd:"MaddoLeen",
      sakoon:"Sakoon & Jazm",
      ending:"Ending of Rules"
    } }
};

const SECURE_BASE = "https://quraan.academy/local/hubredirect/issue_child.php?goto=";
const IS_LOCAL_PREVIEW = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const IS_STATIC_STAGING = window.location.pathname.indexOf("/pre_quraan_staging/") === 0;
const USE_STATIC_UNIT_LINKS = IS_LOCAL_PREVIEW || IS_STATIC_STAGING;
const ALPHABET_LISTEN_URL = USE_STATIC_UNIT_LINKS
  ? "/pre_quraan/units/alphabet/index.html?managed=1"
  : SECURE_BASE + "alphabet_listen";
const MUQATTIAT_LISTEN_URL = USE_STATIC_UNIT_LINKS
  ? "/pre_quraan/units/muqattiat/index.html?managed=1"
  : SECURE_BASE + "muqattaat_listen";
const TANWEEN_MOVEMENT_URL = USE_STATIC_UNIT_LINKS
  ? "/pre_quraan/units/tanween-movement/index.html?managed=1"
  : SECURE_BASE + "tanween_mvt1";

// Lesson links
export const LINK_MAP = {
  /* Alphabet */
  "Alphabet Listen":     ALPHABET_LISTEN_URL,
  "Alphabet Match":      SECURE_BASE + "match01",
  // REMOVED: Alphabet Order / Trans1 / Trans2
  // "Alphabet Order":      SECURE_BASE + "alphabet_order",
  // "Alphabet Trans1":     SECURE_BASE + "alphabet_trans1",
  // "Alphabet Trans2":     SECURE_BASE + "alphabet_trans2",
  "Alphabet Watch":      SECURE_BASE + "alphabet_watch",
  "Alphabet Speak":      SECURE_BASE + "speak01",
  "Alphabet Diacritics": SECURE_BASE + "diacritics01",

  "Alphabet Write":      SECURE_BASE + "write03",
  "Alphabet Record":     "#record",
  // Alphabet & Harakat games submenu (modal)
  "Alphabet Practice":   "#games",
  "Alphabet Quiz":       "https://quraan.academy/mod/page/view.php?id=347&inpopup=1",

  /* Movements */
  "Alphabet Diacritics (Harakat)": SECURE_BASE + "diacritics01",
  "Harakat Listen":      SECURE_BASE + "harakat_listen",
  "Harakat Watch":       SECURE_BASE + "harakat_watch",
  "Harakat Speak":       SECURE_BASE + "harakat_speak",
  "Harakat Match":       SECURE_BASE + "harakat_match",
  "Harakat Write":       SECURE_BASE + "harakt_write01",
  "Harakat Record":      "#harakatRecord",
  "Harakat Practice":    "#games",
  "Harakat Quiz":        "https://quraan.academy/mod/page/view.php?id=347&inpopup=1",

  /* Joint */
  "Connections":         SECURE_BASE + "connections_ws",
  "2 Joined Letters":    SECURE_BASE + "two_joined1",
  "3 Joined Letters":    SECURE_BASE + "three_joined1",
  "4 Joined Letters":    SECURE_BASE + "four_joined2",
  "Joint Practice":      "#games", // NEW: Joint Practice submenu (same games modal)

  /* Rules / Tajweed root-level lesson links */
  "Tanween":             SECURE_BASE + "tanween14",
  "Tanween & Movement":  TANWEEN_MOVEMENT_URL,
  "Fatha-Kasra-Damma":   SECURE_BASE + "standing1",
  "MaddoLeen":           SECURE_BASE + "maddoleen3",
  "Sakoon & Jazm":       SECURE_BASE + "sakoon_jazm2",
  "Tashdeed Shaddah":            SECURE_BASE + "tashdeed_w_shaddah",
  "Tashdeed With Sukoon":        SECURE_BASE + "tashdeed_w_sukoon",
  "Tashdeed With tashdeed":      SECURE_BASE + "tashdeed_w_tashdeed",
  "Tashdeed With Haroof Maddah": SECURE_BASE + "tashdeed_w_haroof_maddah",
  "Ending of Rules":             SECURE_BASE + "ending_rules1",

  /* Muqatta'at detailed lessons (now displayed as Muqattiat) */
  "Muqattiat Intro":    SECURE_BASE + "muqattaat_intro",
  "Muqattiat Listen":   MUQATTIAT_LISTEN_URL,
  "Muqattiat Match":    SECURE_BASE + "muqattaat_match",
  "Muqattiat Speak":    SECURE_BASE + "muqattaat_speak",
  "Muqattiat Write":    SECURE_BASE + "muqattaat_write",
  "Muqattiat Record":   SECURE_BASE + "muqattaat_record",
  "Muqattiat Practice": SECURE_BASE + "muqattaat_practice",
  "Muqattiat Quiz":     SECURE_BASE + "muqattaat_quiz",

  /* Tanween detailed lessons */
  "Tanween Intro":       SECURE_BASE + "tanween_intro",
  "Tanween Listen":      SECURE_BASE + "tanween_listen",
  "Tanween Match":       SECURE_BASE + "tanween_match",
  "Tanween Speak":       SECURE_BASE + "tanween_speak",
  "Tanween Write":       SECURE_BASE + "tanween_write",
  "Tanween Record":      SECURE_BASE + "tanween_record",
  "Tanween Practice":    SECURE_BASE + "tanween_practice",
  "Tanween Quiz":        SECURE_BASE + "tanween_quiz",

  /* Tanween & Movement detailed lessons */
  "Tanween & Movement Intro":    SECURE_BASE + "tanween_mvt_intro",
  "Tanween & Movement Listen":   SECURE_BASE + "tanween_mvt_listen",
  "Tanween & Movement Match":    SECURE_BASE + "tanween_mvt_match",
  "Tanween & Movement Speak":    SECURE_BASE + "tanween_mvt_speak",
  "Tanween & Movement Write":    SECURE_BASE + "tanween_mvt_write",
  "Tanween & Movement Record":   SECURE_BASE + "tanween_mvt_record",
  "Tanween & Movement Practice": SECURE_BASE + "tanween_mvt_practice",
  "Tanween & Movement Quiz":     SECURE_BASE + "tanween_mvt_quiz",

  /* Fatha-Kasra-Damma detailed lessons */
  "Fatha-Kasra-Damma Listen":     SECURE_BASE + "standing_listen",
  "Fatha-Kasra-Damma Match":      SECURE_BASE + "standing_match",
  "Fatha-Kasra-Damma Speak":      SECURE_BASE + "standing_speak",
  "Fatha-Kasra-Damma Write":      SECURE_BASE + "standing_write",
  "Fatha-Kasra-Damma Record":     SECURE_BASE + "standing_record",
  "Fatha-Kasra-Damma Practice":   SECURE_BASE + "standing_practice",
  "Fatha-Kasra-Damma Quiz":       SECURE_BASE + "standing_quiz",

  /* MaddoLeen detailed lessons */
  "MaddoLeen Listen":     SECURE_BASE + "maddoleen_listen",
  "MaddoLeen Match":      SECURE_BASE + "maddoleen_match",
  "MaddoLeen Speak":      SECURE_BASE + "maddoleen_speak",
  "MaddoLeen Write":      SECURE_BASE + "maddoleen_write",
  "MaddoLeen Record":     SECURE_BASE + "maddoleen_record",
  "MaddoLeen Practice":   SECURE_BASE + "maddoleen_practice",
  "MaddoLeen Quiz":       SECURE_BASE + "maddoleen_quiz",

  /* Sakoon/Sukun & Jazm detailed lessons */
  "Sukun & Jazm Listen":     SECURE_BASE + "sakoon_jazm_listen",
  "Sukun & Jazm Match":      SECURE_BASE + "sakoon_jazm_match",
  "Sukun & Jazm Speak":      SECURE_BASE + "sakoon_jazm_speak",
  "Sukun & Jazm Write":      SECURE_BASE + "sakoon_jazm_write",
  "Sukun & Jazm Record":     SECURE_BASE + "sakoon_jazm_record",
  "Sukun & Jazm Practice":   SECURE_BASE + "sakoon_jazm_practice",
  "Sukun & Jazm Quiz":       SECURE_BASE + "sakoon_jazm_quiz",

  /* Ending of Rules detailed lessons */
  "Ending of Rules Listen":     SECURE_BASE + "ending_rules_listen",
  "Ending of Rules Match":      SECURE_BASE + "ending_rules_match",
  "Ending of Rules Speak":      SECURE_BASE + "ending_rules_speak",
  "Ending of Rules Write":      SECURE_BASE + "ending_rules_write",
  "Ending of Rules Record":     SECURE_BASE + "ending_rules_record",
  "Ending of Rules Practice":   SECURE_BASE + "ending_rules_practice",
  "Ending of Rules Quiz":       SECURE_BASE + "ending_rules_quiz",

  /* Tashdeed Shaddah detailed lessons + Intros */
  "Tashdeed Shaddah Intro":            SECURE_BASE + "tashdeed_shaddah_intro",
  "Tashdeed Shaddah Listen":           SECURE_BASE + "tashdeed_shaddah_listen",
  "Tashdeed Shaddah Match":            SECURE_BASE + "tashdeed_shaddah_match",
  "Tashdeed Shaddah Speak":            SECURE_BASE + "tashdeed_shaddah_speak",
  "Tashdeed Shaddah Write":            SECURE_BASE + "tashdeed_shaddah_write",
  "Tashdeed Shaddah Record":           SECURE_BASE + "tashdeed_shaddah_record",
  "Tashdeed Shaddah Practice":         SECURE_BASE + "tashdeed_shaddah_practice",
  "Tashdeed Shaddah Quiz":             SECURE_BASE + "tashdeed_shaddah_quiz",

  "Tashdeed With Sukoon Intro":        SECURE_BASE + "tashdeed_sukoon_intro",
  "Tashdeed With Sukoon Listen":       SECURE_BASE + "tashdeed_sukoon_listen",
  "Tashdeed With Sukoon Match":        SECURE_BASE + "tashdeed_sukoon_match",
  "Tashdeed With Sukoon Speak":        SECURE_BASE + "tashdeed_sukoon_speak",
  "Tashdeed With Sukoon Write":        SECURE_BASE + "tashdeed_sukoon_write",
  "Tashdeed With Sukoon Record":       SECURE_BASE + "tashdeed_sukoon_record",
  "Tashdeed With Sukoon Practice":     SECURE_BASE + "tashdeed_sukoon_practice",
  "Tashdeed With Sukoon Quiz":         SECURE_BASE + "tashdeed_sukoon_quiz",

  "Tashdeed With tashdeed Intro":      SECURE_BASE + "tashdeed_tashdeed_intro",
  "Tashdeed With tashdeed Listen":     SECURE_BASE + "tashdeed_tashdeed_listen",
  "Tashdeed With tashdeed Match":      SECURE_BASE + "tashdeed_tashdeed_match",
  "Tashdeed With tashdeed Speak":      SECURE_BASE + "tashdeed_tashdeed_speak",
  "Tashdeed With tashdeed Write":      SECURE_BASE + "tashdeed_tashdeed_write",
  "Tashdeed With tashdeed Record":     SECURE_BASE + "tashdeed_tashdeed_record",
  "Tashdeed With tashdeed Practice":   SECURE_BASE + "tashdeed_tashdeed_practice",
  "Tashdeed With tashdeed Quiz":       SECURE_BASE + "tashdeed_tashdeed_quiz",

  "Tashdeed With Haroof Maddah Intro":    SECURE_BASE + "tashdeed_maddah_intro",
  "Tashdeed With Haroof Maddah Listen":   SECURE_BASE + "tashdeed_maddah_listen",
  "Tashdeed With Haroof Maddah Match":    SECURE_BASE + "tashdeed_maddah_match",
  "Tashdeed With Haroof Maddah Speak":    SECURE_BASE + "tashdeed_maddah_speak",
  "Tashdeed With Haroof Maddah Write":    SECURE_BASE + "tashdeed_maddah_write",
  "Tashdeed With Haroof Maddah Record":   SECURE_BASE + "tashdeed_maddah_record",
  "Tashdeed With Haroof Maddah Practice": SECURE_BASE + "tashdeed_maddah_practice",
  "Tashdeed With Haroof Maddah Quiz":     SECURE_BASE + "tashdeed_maddah_quiz",

  /* New short Haroof Maddah aliases */
  "Haroof Maddah Intro":     SECURE_BASE + "tashdeed_maddah_intro",
  "Haroof Maddah Listen":    SECURE_BASE + "tashdeed_maddah_listen",
  "Haroof Maddah Match":     SECURE_BASE + "tashdeed_maddah_match",
  "Haroof Maddah Speak":     SECURE_BASE + "tashdeed_maddah_speak",
  "Haroof Maddah Write":     SECURE_BASE + "tashdeed_maddah_write",
  "Haroof Maddah Record":    SECURE_BASE + "tashdeed_maddah_record",
  "Haroof Maddah Practice":  SECURE_BASE + "tashdeed_maddah_practice",
  "Haroof Maddah Quiz":      SECURE_BASE + "tashdeed_maddah_quiz"
};

// Root-level tiles
export const ITEMS = [
  /* Alphabet */
  {t:"Alphabet Listen",       cat:"alphabet",  tag:"unit1",    tint:"blue"},
  {t:"Alphabet Watch",        cat:"alphabet",  tag:"unit2",    tint:"blue"},
  {t:"Alphabet Match",        cat:"alphabet",  tag:"unit3",    tint:"blue"},
  {t:"Alphabet Speak",        cat:"alphabet",  tag:"unit4",    tint:"blue"},
  {t:"Alphabet Write",        cat:"alphabet",  tag:"unit5",    tint:"blue"},
  {t:"Alphabet Record",       cat:"alphabet",  tag:"unit6",    tint:"blue"},
  {t:"Alphabet Practice",     cat:"alphabet",  tag:"unit7",    tint:"blue"},
  {t:"Alphabet Quiz",         cat:"alphabet",  tag:"unit8",    tint:"blue"},

  /* Movements */
  {t:"Alphabet Diacritics",   cat:"movements", tag:"unit1",    tint:"green"},
  {t:"Harakat Listen",        cat:"movements", tag:"unit2",    tint:"green"},
  {t:"Harakat Watch",         cat:"movements", tag:"unit3",    tint:"green"},
  {t:"Harakat Match",         cat:"movements", tag:"unit4",    tint:"green"},
  {t:"Harakat Speak",         cat:"movements", tag:"unit5",    tint:"green"},
  {t:"Harakat Write",         cat:"movements", tag:"unit6",    tint:"green"},
  {t:"Harakat Record",        cat:"movements", tag:"unit7",    tint:"green"},
  {t:"Harakat Practice",      cat:"movements", tag:"unit8",    tint:"green"},
  {t:"Harakat Quiz",          cat:"movements", tag:"unit9",    tint:"green"},

  /* Joint */
  {t:"Connections",           cat:"joint",     tag:"unit1",    tint:"orange"},
  {t:"2 Joined Letters",      cat:"joint",     tag:"unit2",    tint:"orange"},
  {t:"3 Joined Letters",      cat:"joint",     tag:"unit3",    tint:"orange"},
  {t:"4 Joined Letters",      cat:"joint",     tag:"unit4",    tint:"orange"},
  {t:"Joint Practice",        cat:"joint",     tag:"unit5",    tint:"orange"}, // NEW tile

  /* Rules / Tajweed (first-level submenu) */
  {t:"Muqatta'at Basics",     cat:"rules",     tag:"Section 1",    tint:"purple"},
  {t:"Tanween",               cat:"rules",     tag:"Section 2",    tint:"purple"},
  {t:"Fatha-Kasra-Damma",     cat:"rules",     tag:"Section 3",    tint:"orange"},
  {t:"MaddoLeen",             cat:"rules",     tag:"Section 4",    tint:"blue"},
  {t:"Sakoon & Jazm",         cat:"rules",     tag:"Section 5",    tint:"pink"},
  {t:"Tashdeed Shaddah",      cat:"rules",     tag:"Section 6",    tint:"blue"},
  {t:"Ending of Rules",       cat:"rules",     tag:"Section 7",    tint:"yellow"},

  /* Pillars */
  {t:"Ashahad",               cat:"pillars",   tag:"unit1",    tint:"brown"},
  {t:"Salat",                 cat:"pillars",   tag:"unit2",    tint:"brown"},
  {t:"Sawm",                  cat:"pillars",   tag:"unit3",    tint:"brown"},
  {t:"Sakat",                 cat:"pillars",   tag:"unit4",    tint:"brown"},
  {t:"Hajj",                  cat:"pillars",   tag:"unit5",    tint:"brown"}
];

// Storage keys & defaults
export const LAST_CAT_KEY = 'pq_last_cat';
export const LANG_KEY     = 'pq_lang';
export const BIG_KEY      = 'pq_big';
export const DEFAULT_CAT  = 'alphabet';

// View IDs
export const VIEW_ROOT              = 'root';
export const VIEW_MUQATTAAT         = 'muqattaat';
export const VIEW_TANWEEN_MENU      = 'tanween_menu';
export const VIEW_TANWEEN           = 'tanween';
export const VIEW_TANWEEN_MVT       = 'tanween_mvt';
export const VIEW_TASHDEED          = 'tashdeed';
export const VIEW_TASHDEED_SHADDAH  = 'tashdeed_shaddah';
export const VIEW_TASHDEED_SUKOON   = 'tashdeed_sukoon';
export const VIEW_TASHDEED_TASHDEED = 'tashdeed_tashdeed';
export const VIEW_TASHDEED_MADDAH   = 'tashdeed_maddah';
export const VIEW_FKD               = 'fatha_kasra_damma';
export const VIEW_MADD              = 'maddoleen';
export const VIEW_SAKOON            = 'sakoon_jazm';
export const VIEW_ENDING            = 'ending_rules';
