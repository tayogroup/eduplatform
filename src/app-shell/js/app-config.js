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
      tashdeed_shaddah:"Tashdeed",
      tashdeed_sukoon:"Tashdeed with Sakoon",
      tashdeed_tashdeed:"Tashdeed with Tashdeed",
      tashdeed_maddah:"Tashdeed with Harof Madah",
      fkd:"Madd",
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
      tashdeed_shaddah:"Tashdeed",
      tashdeed_sukoon:"Tashdeed with Sakoon",
      tashdeed_tashdeed:"Tashdeed with Tashdeed",
      tashdeed_maddah:"Tashdeed with Harof Madah",
      fkd:"Madd",
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
      tashdeed_shaddah:"Tashdeed",
      tashdeed_sukoon:"Tashdeed with Sakoon",
      tashdeed_tashdeed:"Tashdeed with Tashdeed",
      tashdeed_maddah:"Tashdeed with Harof Madah",
      fkd:"Madd",
      madd:"MaddoLeen",
      sakoon:"Sakoon & Jazm",
      ending:"Ending of Rules"
    } }
};

const currentMoodleOrigin = () => {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const configured = params.get("moodle_origin") || params.get("moodle_base") || params.get("moodle");
    if (configured) return new URL(configured).origin;

    const host = String(window.location.hostname || "").toLowerCase();
    if (host.includes("quraantest")) return "https://quraantest.academy";

    if (document.referrer) {
      const referrerHost = new URL(document.referrer).hostname.toLowerCase();
      if (referrerHost.includes("quraantest")) return "https://quraantest.academy";
    }
  } catch (_e) {}
  return "https://quraan.academy";
};

export const MOODLE_ORIGIN = currentMoodleOrigin();
const SECURE_BASE = `${MOODLE_ORIGIN}/local/hubredirect/issue_child.php?goto=`;
const IS_LOCAL_PREVIEW = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const STATIC_BUNNY_QA_BASE_PATHS = ["/pre_quraan_integration/", "/pre_quraan_staging/"];
const CURRENT_BUNNY_BASE_PATH = STATIC_BUNNY_QA_BASE_PATHS.find((basePath) => window.location.pathname.indexOf(basePath) === 0) || "/pre_quraan/";
const CURRENT_ENVIRONMENT = CURRENT_BUNNY_BASE_PATH.indexOf("pre_quraan_integration") !== -1
  ? "integration"
  : (CURRENT_BUNNY_BASE_PATH.indexOf("pre_quraan_staging") !== -1 ? "staging" : "production");
const IS_STATIC_BUNNY_QA = CURRENT_ENVIRONMENT !== "production";
const USE_STATIC_UNIT_LINKS = IS_LOCAL_PREVIEW;
const withEnvironment = (url) => {
  if (CURRENT_ENVIRONMENT === "production") return url;
  const separator = url.indexOf("?") === -1 ? "?" : "&";
  return `${url}${separator}pq_env=${encodeURIComponent(CURRENT_ENVIRONMENT)}`;
};
const secureLessonUrl = (goto) => withEnvironment(SECURE_BASE + goto);
const secureManagedLessonUrl = (goto) => withEnvironment(`${SECURE_BASE}${goto}&managed_student=1`);
const staticUnitUrl = (path) => withEnvironment(CURRENT_BUNNY_BASE_PATH + path.replace(/^\/+/, ""));
const ALPHABET_LISTEN_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/alphabet/index.html?managed=1")
  : secureLessonUrl("alphabet_listen");
const ALPHABET_QUIZ_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("scripts/alphabet_quiz_chatbot_unlocked_20260613b.html")
  : secureLessonUrl("alphabet_quiz_chatbot");
export const ARABIC_LETTER_RACEWAY_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("scripts/arabic_letter_raceway_20260614a.html")
  : secureManagedLessonUrl("arabic_letter_raceway_20260614a.html");
const HARAKAT_LISTEN_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/harakat/index.html?managed=1")
  : secureLessonUrl("harakat_listen");
const JOINT_LISTEN_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/connection-forms/index.html?managed=1")
  : secureLessonUrl("connections_ws");
const MUQATTIAT_LISTEN_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/muqattiat/index.html?managed=1")
  : secureLessonUrl("muqattaat_listen");
const TANWEEN_MOVEMENT_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/tanween-movement/index.html?managed=1")
  : secureLessonUrl("tanween_mvt1");
const TANWEEN_LISTEN_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/tanween/index.html?managed=1")
  : secureLessonUrl("tanween_listen");
const MADD_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/madd/index.html?managed=1")
  : secureLessonUrl("standing1");
const MADDOLEEN_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/maddoleen/index.html?managed=1")
  : secureLessonUrl("maddoleen3");
const SUKOON_JAZM_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/sukoon-jazm/index.html?managed=1")
  : secureLessonUrl("sakoon_jazm2");
const TASHDEED_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/tashdeed/index.html?managed=1")
  : secureLessonUrl("tashdeed_w_shaddah");
const TASHDEED_SUKOON_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/tashdeed-sukoon/index.html?managed=1")
  : secureLessonUrl("tashdeed_w_sukoon");
const TASHDEED_TASHDEED_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/tashdeed-tashdeed/index.html?managed=1")
  : secureLessonUrl("tashdeed_w_tashdeed");
const TASHDEED_HAROOF_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/tashdeed-with-haroof/index.html?managed=1")
  : secureLessonUrl("tashdeed_w_haroof_maddah");
const ENDING_RULES_URL = USE_STATIC_UNIT_LINKS
  ? "#"
  : secureLessonUrl("ending_rules1");
const PILLARS_OF_ISLAM_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/pillars-of-islam/index.html?managed=1")
  : secureLessonUrl("pillars_of_islam");
const PILLARS_OF_FAITH_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/pillars-of-faith/index.html?managed=1")
  : secureLessonUrl("pillars_of_faith");
const MANNERS_AKHLAQ_URL = USE_STATIC_UNIT_LINKS
  ? staticUnitUrl("units/manners-akhlaq/index.html?managed=1")
  : secureLessonUrl("manners_akhlaq");

// Lesson links
export const LINK_MAP = {
  /* Alphabet */
  "Alphabet Learn":      ALPHABET_LISTEN_URL,
  "Alphabet Listen":     ALPHABET_LISTEN_URL,
  "Alphabet Match":      secureLessonUrl("match01"),
  // REMOVED: Alphabet Order / Trans1 / Trans2
  // "Alphabet Order":      secureLessonUrl("alphabet_order"),
  // "Alphabet Trans1":     secureLessonUrl("alphabet_trans1"),
  // "Alphabet Trans2":     secureLessonUrl("alphabet_trans2"),
  "Alphabet Watch":      secureLessonUrl("alphabet_watch"),
  "Alphabet Speak":      secureLessonUrl("speak01"),
  "Alphabet Diacritics": secureLessonUrl("diacritics01"),

  "Alphabet Write":      secureLessonUrl("write03"),
  "Alphabet Record":     "#record",
  // Alphabet & Harakat games submenu (modal)
  "Alphabet Practice":   "#games",
  "Alphabet Quiz":       ALPHABET_QUIZ_URL,

  /* Movements */
  "Alphabet Diacritics (Harakat)": secureLessonUrl("diacritics01"),
  "Harakat Learn":       HARAKAT_LISTEN_URL,
  "Harakat Listen":      HARAKAT_LISTEN_URL,
  "Harakat Watch":       secureLessonUrl("harakat_watch"),
  "Harakat Speak":       secureLessonUrl("harakat_speak"),
  "Harakat Match":       secureLessonUrl("harakat_match"),
  "Harakat Write":       secureLessonUrl("harakt_write01"),
  "Harakat Record":      "#harakatRecord",
  "Harakat Practice":    "#games",
  "Harakat Quiz":        `${MOODLE_ORIGIN}/mod/page/view.php?id=347&inpopup=1`,

  /* Joint */
  "Joint Learn":         JOINT_LISTEN_URL,
  "Connections":         JOINT_LISTEN_URL,
  "2 Joined Letters":    secureLessonUrl("two_joined1"),
  "3 Joined Letters":    secureLessonUrl("three_joined1"),
  "4 Joined Letters":    secureLessonUrl("four_joined2"),
  "Joint Practice":      "#games", // NEW: Joint Practice submenu (same games modal)
  "Joint Quiz":          `${MOODLE_ORIGIN}/mod/page/view.php?id=347&inpopup=1`,

  /* Rules / Tajweed root-level lesson links */
  "Tanween":             TANWEEN_LISTEN_URL,
  "Tanween & Movement":  TANWEEN_MOVEMENT_URL,
  "Madd":                MADD_URL,
  "Fatha-Kasra-Damma":   MADD_URL,
  "MaddoLeen":           MADDOLEEN_URL,
  "Sakoon & Jazm":       SUKOON_JAZM_URL,
  "Tashdeed":                    TASHDEED_URL,
  "Tashdeed Shaddah":            TASHDEED_URL,
  "Tashdeed with Sakoon":        TASHDEED_SUKOON_URL,
  "Tashdeed With Sukoon":        TASHDEED_SUKOON_URL,
  "Tashdeed with Tashdeed":      TASHDEED_TASHDEED_URL,
  "Tashdeed With tashdeed":      TASHDEED_TASHDEED_URL,
  "Tashdeed with Harof Madah":   TASHDEED_HAROOF_URL,
  "Tashdeed with Haroof Maddah": TASHDEED_HAROOF_URL,
  "Tashdeed With Haroof Maddah": TASHDEED_HAROOF_URL,
  "Ending of Rules":             ENDING_RULES_URL,

  /* Muqatta'at detailed lessons (now displayed as Muqattiat) */
  "Muqattiat Intro":    secureLessonUrl("muqattaat_intro"),
  "Muqattiat Learn":    MUQATTIAT_LISTEN_URL,
  "Muqattiat Listen":   MUQATTIAT_LISTEN_URL,
  "Muqattiat Match":    secureLessonUrl("muqattaat_match"),
  "Muqattiat Speak":    secureLessonUrl("muqattaat_speak"),
  "Muqattiat Write":    secureLessonUrl("muqattaat_write"),
  "Muqattiat Record":   secureLessonUrl("muqattaat_record"),
  "Muqattiat Practice": secureLessonUrl("muqattaat_practice"),
  "Muqattiat Quiz":     secureLessonUrl("muqattaat_quiz"),

  /* Tanween detailed lessons */
  "Tanween Learn":       TANWEEN_LISTEN_URL,
  "Tanween Intro":       secureLessonUrl("tanween_intro"),
  "Tanween Listen":      TANWEEN_LISTEN_URL,
  "Tanween Match":       secureLessonUrl("tanween_match"),
  "Tanween Speak":       secureLessonUrl("tanween_speak"),
  "Tanween Write":       secureLessonUrl("tanween_write"),
  "Tanween Record":      secureLessonUrl("tanween_record"),
  "Tanween Practice":    secureLessonUrl("tanween_practice"),
  "Tanween Quiz":        secureLessonUrl("tanween_quiz"),

  /* Tanween & Movement detailed lessons */
  "Tanween & Movement Learn":    TANWEEN_MOVEMENT_URL,
  "Tanween & Movement Intro":    TANWEEN_MOVEMENT_URL,
  "Tanween & Movement Listen":   TANWEEN_MOVEMENT_URL,
  "Tanween & Movement Match":    TANWEEN_MOVEMENT_URL,
  "Tanween & Movement Speak":    TANWEEN_MOVEMENT_URL,
  "Tanween & Movement Write":    TANWEEN_MOVEMENT_URL,
  "Tanween & Movement Record":   TANWEEN_MOVEMENT_URL,
  "Tanween & Movement Practice": TANWEEN_MOVEMENT_URL,
  "Tanween & Movement Quiz":     TANWEEN_MOVEMENT_URL,

  /* Madd detailed lessons, formerly Fatha-Kasra-Damma */
  "Madd Learn":                   MADD_URL,
  "Madd Listen":                  MADD_URL,
  "Madd Match":                   MADD_URL,
  "Madd Speak":                   MADD_URL,
  "Madd Write":                   MADD_URL,
  "Madd Record":                  MADD_URL,
  "Madd Practice":                MADD_URL,
  "Madd Quiz":                    MADD_URL,

  /* Legacy Fatha-Kasra-Damma detailed lesson aliases */
  "Fatha-Kasra-Damma Listen":     MADD_URL,
  "Fatha-Kasra-Damma Match":      MADD_URL,
  "Fatha-Kasra-Damma Speak":      MADD_URL,
  "Fatha-Kasra-Damma Write":      MADD_URL,
  "Fatha-Kasra-Damma Record":     MADD_URL,
  "Fatha-Kasra-Damma Practice":   MADD_URL,
  "Fatha-Kasra-Damma Quiz":       MADD_URL,

  /* MaddoLeen detailed lessons */
  "MaddoLeen Learn":      MADDOLEEN_URL,
  "MaddoLeen Listen":     MADDOLEEN_URL,
  "MaddoLeen Match":      MADDOLEEN_URL,
  "MaddoLeen Speak":      MADDOLEEN_URL,
  "MaddoLeen Write":      MADDOLEEN_URL,
  "MaddoLeen Record":     MADDOLEEN_URL,
  "MaddoLeen Practice":   MADDOLEEN_URL,
  "MaddoLeen Quiz":       MADDOLEEN_URL,

  /* Sakoon/Sukun & Jazm detailed lessons */
  "Sukun & Jazm Learn":      SUKOON_JAZM_URL,
  "Sukun & Jazm Listen":     SUKOON_JAZM_URL,
  "Sukun & Jazm Match":      SUKOON_JAZM_URL,
  "Sukun & Jazm Speak":      SUKOON_JAZM_URL,
  "Sukun & Jazm Write":      SUKOON_JAZM_URL,
  "Sukun & Jazm Record":     SUKOON_JAZM_URL,
  "Sukun & Jazm Practice":   SUKOON_JAZM_URL,
  "Sukun & Jazm Quiz":       SUKOON_JAZM_URL,

  /* Ending of Rules detailed lessons */
  "Ending of Rules Learn":      ENDING_RULES_URL,
  "Ending of Rules Listen":     ENDING_RULES_URL,
  "Ending of Rules Match":      ENDING_RULES_URL,
  "Ending of Rules Speak":      ENDING_RULES_URL,
  "Ending of Rules Write":      ENDING_RULES_URL,
  "Ending of Rules Record":     ENDING_RULES_URL,
  "Ending of Rules Practice":   ENDING_RULES_URL,
  "Ending of Rules Quiz":       ENDING_RULES_URL,

  /* Tashdeed Shaddah detailed lessons + Intros */
  "Tashdeed Intro":                      TASHDEED_URL,
  "Tashdeed Learn":                      TASHDEED_URL,
  "Tashdeed Listen":                     TASHDEED_URL,
  "Tashdeed Match":                      TASHDEED_URL,
  "Tashdeed Speak":                      TASHDEED_URL,
  "Tashdeed Write":                      TASHDEED_URL,
  "Tashdeed Record":                     TASHDEED_URL,
  "Tashdeed Practice":                   TASHDEED_URL,
  "Tashdeed Quiz":                       TASHDEED_URL,

  /* Legacy Tashdeed Shaddah detailed lesson aliases */
  "Tashdeed Shaddah Intro":            TASHDEED_URL,
  "Tashdeed Shaddah Listen":           TASHDEED_URL,
  "Tashdeed Shaddah Match":            TASHDEED_URL,
  "Tashdeed Shaddah Speak":            TASHDEED_URL,
  "Tashdeed Shaddah Write":            TASHDEED_URL,
  "Tashdeed Shaddah Record":           TASHDEED_URL,
  "Tashdeed Shaddah Practice":         TASHDEED_URL,
  "Tashdeed Shaddah Quiz":             TASHDEED_URL,

  "Tashdeed with Sakoon Intro":        TASHDEED_SUKOON_URL,
  "Tashdeed with Sakoon Learn":        TASHDEED_SUKOON_URL,
  "Tashdeed with Sakoon Listen":       TASHDEED_SUKOON_URL,
  "Tashdeed with Sakoon Match":        TASHDEED_SUKOON_URL,
  "Tashdeed with Sakoon Speak":        TASHDEED_SUKOON_URL,
  "Tashdeed with Sakoon Write":        TASHDEED_SUKOON_URL,
  "Tashdeed with Sakoon Record":       TASHDEED_SUKOON_URL,
  "Tashdeed with Sakoon Practice":     TASHDEED_SUKOON_URL,
  "Tashdeed with Sakoon Quiz":         TASHDEED_SUKOON_URL,

  /* Legacy Tashdeed With Sukoon detailed lesson aliases */
  "Tashdeed With Sukoon Intro":        TASHDEED_SUKOON_URL,
  "Tashdeed With Sukoon Listen":       TASHDEED_SUKOON_URL,
  "Tashdeed With Sukoon Match":        TASHDEED_SUKOON_URL,
  "Tashdeed With Sukoon Speak":        TASHDEED_SUKOON_URL,
  "Tashdeed With Sukoon Write":        TASHDEED_SUKOON_URL,
  "Tashdeed With Sukoon Record":       TASHDEED_SUKOON_URL,
  "Tashdeed With Sukoon Practice":     TASHDEED_SUKOON_URL,
  "Tashdeed With Sukoon Quiz":         TASHDEED_SUKOON_URL,

  "Tashdeed with Tashdeed Intro":      TASHDEED_TASHDEED_URL,
  "Tashdeed with Tashdeed Learn":      TASHDEED_TASHDEED_URL,
  "Tashdeed with Tashdeed Listen":     TASHDEED_TASHDEED_URL,
  "Tashdeed with Tashdeed Match":      TASHDEED_TASHDEED_URL,
  "Tashdeed with Tashdeed Speak":      TASHDEED_TASHDEED_URL,
  "Tashdeed with Tashdeed Write":      TASHDEED_TASHDEED_URL,
  "Tashdeed with Tashdeed Record":     TASHDEED_TASHDEED_URL,
  "Tashdeed with Tashdeed Practice":   TASHDEED_TASHDEED_URL,
  "Tashdeed with Tashdeed Quiz":       TASHDEED_TASHDEED_URL,

  /* Legacy Tashdeed With tashdeed detailed lesson aliases */
  "Tashdeed With tashdeed Intro":      TASHDEED_TASHDEED_URL,
  "Tashdeed With tashdeed Listen":     TASHDEED_TASHDEED_URL,
  "Tashdeed With tashdeed Match":      TASHDEED_TASHDEED_URL,
  "Tashdeed With tashdeed Speak":      TASHDEED_TASHDEED_URL,
  "Tashdeed With tashdeed Write":      TASHDEED_TASHDEED_URL,
  "Tashdeed With tashdeed Record":     TASHDEED_TASHDEED_URL,
  "Tashdeed With tashdeed Practice":   TASHDEED_TASHDEED_URL,
  "Tashdeed With tashdeed Quiz":       TASHDEED_TASHDEED_URL,

  "Tashdeed with Harof Madah Intro":       TASHDEED_HAROOF_URL,
  "Tashdeed with Harof Madah Learn":       TASHDEED_HAROOF_URL,
  "Tashdeed with Harof Madah Listen":      TASHDEED_HAROOF_URL,
  "Tashdeed with Harof Madah Match":       TASHDEED_HAROOF_URL,
  "Tashdeed with Harof Madah Speak":       TASHDEED_HAROOF_URL,
  "Tashdeed with Harof Madah Write":       TASHDEED_HAROOF_URL,
  "Tashdeed with Harof Madah Record":      TASHDEED_HAROOF_URL,
  "Tashdeed with Harof Madah Practice":    TASHDEED_HAROOF_URL,
  "Tashdeed with Harof Madah Quiz":        TASHDEED_HAROOF_URL,

  /* Legacy Tashdeed with Haroof Maddah detailed lesson aliases */
  "Tashdeed with Haroof Maddah Intro":    TASHDEED_HAROOF_URL,
  "Tashdeed with Haroof Maddah Learn":    TASHDEED_HAROOF_URL,
  "Tashdeed with Haroof Maddah Listen":   TASHDEED_HAROOF_URL,
  "Tashdeed with Haroof Maddah Match":    TASHDEED_HAROOF_URL,
  "Tashdeed with Haroof Maddah Speak":    TASHDEED_HAROOF_URL,
  "Tashdeed with Haroof Maddah Write":    TASHDEED_HAROOF_URL,
  "Tashdeed with Haroof Maddah Record":   TASHDEED_HAROOF_URL,
  "Tashdeed with Haroof Maddah Practice": TASHDEED_HAROOF_URL,
  "Tashdeed with Haroof Maddah Quiz":     TASHDEED_HAROOF_URL,

  /* Legacy Tashdeed With Haroof Maddah detailed lesson aliases */
  "Tashdeed With Haroof Maddah Intro":    TASHDEED_HAROOF_URL,
  "Tashdeed With Haroof Maddah Listen":   TASHDEED_HAROOF_URL,
  "Tashdeed With Haroof Maddah Match":    TASHDEED_HAROOF_URL,
  "Tashdeed With Haroof Maddah Speak":    TASHDEED_HAROOF_URL,
  "Tashdeed With Haroof Maddah Write":    TASHDEED_HAROOF_URL,
  "Tashdeed With Haroof Maddah Record":   TASHDEED_HAROOF_URL,
  "Tashdeed With Haroof Maddah Practice": TASHDEED_HAROOF_URL,
  "Tashdeed With Haroof Maddah Quiz":     TASHDEED_HAROOF_URL,

  /* Short Haroof Maddah aliases */
  "Haroof Maddah Learn":     TASHDEED_HAROOF_URL,
  "Haroof Maddah Intro":     TASHDEED_HAROOF_URL,
  "Haroof Maddah Listen":    TASHDEED_HAROOF_URL,
  "Haroof Maddah Match":     TASHDEED_HAROOF_URL,
  "Haroof Maddah Speak":     TASHDEED_HAROOF_URL,
  "Haroof Maddah Write":     TASHDEED_HAROOF_URL,
  "Haroof Maddah Record":    TASHDEED_HAROOF_URL,
  "Haroof Maddah Practice":  TASHDEED_HAROOF_URL,
  "Haroof Maddah Quiz":      TASHDEED_HAROOF_URL,

  /* Extras detailed lessons */
  "Pillars of Islam Learn":    PILLARS_OF_ISLAM_URL,
  "Pillars of Islam Practice": "#games",
  "Pillars of Islam Quiz":     `${MOODLE_ORIGIN}/mod/page/view.php?id=347&inpopup=1`,
  "Pillars of Faith Learn":    PILLARS_OF_FAITH_URL,
  "Pillars of Faith Practice": "#games",
  "Pillars of Faith Quiz":     `${MOODLE_ORIGIN}/mod/page/view.php?id=347&inpopup=1`,
  "Manners Akhlaq Learn":      MANNERS_AKHLAQ_URL,
  "Manners Akhlaq Practice":   "#games",
  "Manners Akhlaq Quiz":       `${MOODLE_ORIGIN}/mod/page/view.php?id=347&inpopup=1`
};

// Root-level tiles
export const ITEMS = [
  /* Alphabet */
  {t:"Alphabet Learn",        cat:"alphabet",  tag:"",         tint:"blue", hideTag:true},
  {t:"Alphabet Practice",     cat:"alphabet",  tag:"",         tint:"blue", hideTag:true},
  {t:"Alphabet Quiz",         cat:"alphabet",  tag:"",         tint:"blue", hideTag:true},

  /* Movements */
  {t:"Harakat Learn",         cat:"movements", tag:"",         tint:"green", hideTag:true},
  {t:"Harakat Practice",      cat:"movements", tag:"",         tint:"green", hideTag:true},
  {t:"Harakat Quiz",          cat:"movements", tag:"",         tint:"green", hideTag:true},

  /* Joint */
  {t:"Joint Learn",           cat:"joint",     tag:"",         tint:"orange", hideTag:true},
  {t:"Joint Practice",        cat:"joint",     tag:"",         tint:"orange", hideTag:true},
  {t:"Joint Quiz",            cat:"joint",     tag:"",         tint:"orange", hideTag:true},

  /* Rules / Tajweed (first-level submenu) */
  {t:"Muqatta'at Basics",     cat:"rules",     tag:"Section 1",    tint:"purple"},
  {t:"Tanween",               cat:"rules",     tag:"Section 2",    tint:"purple"},
  {t:"Madd",                  cat:"rules",     tag:"Section 3",    tint:"orange"},
  {t:"MaddoLeen",             cat:"rules",     tag:"Section 4",    tint:"blue"},
  {t:"Sakoon & Jazm",         cat:"rules",     tag:"Section 5",    tint:"pink"},
  {t:"Tashdeed",              cat:"rules",     tag:"Section 6",    tint:"blue"},
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

