(function (root) {
  'use strict';

  function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeLanguage(value) {
    const raw = String(value || '').trim().toLowerCase().replace('_', '-');
    const first = raw.split('-')[0];
    const aliases = {
      english: 'en',
      eng: 'en',
      arabic: 'ar',
      ar: 'ar',
      somali: 'so',
      som: 'so',
      swahili: 'sw',
      swa: 'sw',
      kiswahili: 'sw',
      punjabi: 'pa',
      panjabi: 'pa',
      urdu: 'ur'
    };
    const code = aliases[raw] || aliases[first] || first || 'en';
    return ['en', 'ar', 'so', 'sw', 'pa', 'ur'].indexOf(code) !== -1 ? code : 'en';
  }

  function normalizeLanguageScope(value) {
    const raw = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    const aliases = {
      ui: 'ui',
      interface: 'ui',
      ui_only: 'ui',
      content: 'content',
      lecture: 'content',
      lectures: 'content',
      message: 'content',
      messages: 'content',
      only_lectures: 'content',
      lectures_and_messages: 'content',
      content_messages: 'content',
      both: 'both',
      all: 'both',
      ui_and_content: 'both'
    };
    return aliases[raw] || 'both';
  }

  function readQueryValue(keys) {
    try {
      if (!root.location || !root.location.search) return '';
      const q = new URLSearchParams(root.location.search);
      for (let i = 0; i < keys.length; i += 1) {
        const value = q.get(keys[i]);
        if (value) return value;
      }
    } catch (_e) {}
    return '';
  }

  function readStoredValue(keys) {
    try {
      if (!root.sessionStorage) return '';
      for (let i = 0; i < keys.length; i += 1) {
        const value = root.sessionStorage.getItem(keys[i]);
        if (value) return value;
      }
    } catch (_e) {}
    return '';
  }

  function writeStoredValue(key, value) {
    try {
      if (root.sessionStorage && value) root.sessionStorage.setItem(key, value);
    } catch (_e) {}
  }

  function readPath(source, path) {
    try {
      const parts = String(path || '').split('.');
      let cur = source;
      for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i];
        if (!part) continue;
        cur = cur && cur[part];
      }
      return cur;
    } catch (_e) {
      return undefined;
    }
  }

  function localizeValue(value, language, fallbackLanguage) {
    if (!isObject(value)) return value;
    const lang = normalizeLanguage(language);
    const fb = normalizeLanguage(fallbackLanguage || 'en');
    if (value[lang] != null) return value[lang];
    if (value[fb] != null) return value[fb];
    if (value.en != null) return value.en;
    return value;
  }

  function createLocalizationApi() {
    const languageKeys = ['pq_lang', 'lang', 'preferred_language', 'language'];
    const scopeKeys = ['pq_lang_scope', 'language_scope', 'translation_scope', 'localization_scope'];

    const api = {
      normalizeLanguage: normalizeLanguage,
      normalizeScope: normalizeLanguageScope,
      getLanguage: function () {
        const raw =
          readQueryValue(languageKeys) ||
          readStoredValue(['pq_preferred_language', 'pq_lang', 'preferred_language']) ||
          root.__prequran_preferred_language ||
          '';
        return normalizeLanguage(raw);
      },
      getScope: function () {
        const raw =
          readQueryValue(scopeKeys) ||
          readStoredValue(['pq_language_scope', 'pq_lang_scope', 'language_scope']) ||
          root.__prequran_language_scope ||
          '';
        return normalizeLanguageScope(raw);
      },
      setPreferences: function (language, scope) {
        const lang = normalizeLanguage(language);
        const sc = normalizeLanguageScope(scope);
        root.__prequran_preferred_language = lang;
        root.__prequran_language_scope = sc;
        writeStoredValue('pq_preferred_language', lang);
        writeStoredValue('pq_language_scope', sc);
        return { language: lang, scope: sc };
      },
      enabledFor: function (area) {
        const scope = api.getScope();
        const type = String(area || 'ui').toLowerCase();
        if (scope === 'both') return true;
        if (scope === 'ui') return type === 'ui';
        if (scope === 'content') return type === 'content' || type === 'messages';
        return true;
      },
      value: function (value, area, fallback) {
        if (!api.enabledFor(area)) return fallback !== undefined ? fallback : value;
        const lang = api.getLanguage();
        const out = localizeValue(value, lang, 'en');
        return out === undefined || out === null ? fallback : out;
      },
      path: function (cfg, path, fallback, area) {
        const rawValue = readPath(cfg, path);
        if (!api.enabledFor(area)) {
          return rawValue === undefined || rawValue === null ? fallback : rawValue;
        }
        const lang = api.getLanguage();
        const translated = readPath(cfg, 'localization.translations.' + lang + '.' + path);
        if (translated !== undefined && translated !== null) {
          return localizeValue(translated, lang, 'en');
        }
        const localizedRaw = localizeValue(rawValue, lang, 'en');
        return localizedRaw === undefined || localizedRaw === null ? fallback : localizedRaw;
      }
    };

    const initialLang = api.getLanguage();
    const initialScope = api.getScope();
    api.setPreferences(initialLang, initialScope);
    return api;
  }

  root.PQL10n = root.PQL10n || createLocalizationApi();

  function ensureObject(parent, key) {
    if (!isObject(parent[key])) parent[key] = {};
    return parent[key];
  }

  function ensureTrailingSlash(value) {
    const text = String(value || '');
    return text ? text.replace(/\/?$/, '/') : '';
  }

  function padNumber(value, width) {
    return String(value).padStart(width, '0');
  }

  function buildSequentialMap(items, options) {
    const map = {};
    const keyPrefix = options.keyPrefix || '';
    const filePrefix = options.filePrefix || keyPrefix;
    const padWidth = Number(options.padWidth || 2);
    const ext = options.ext || '';
    const itemProperty = options.itemProperty || '';

    items.forEach(function (item, index) {
      const n = index + 1;
      const key = item && item.key ? String(item.key) : keyPrefix + n;
      const explicit = itemProperty && item && typeof item[itemProperty] === 'string'
        ? item[itemProperty].trim()
        : '';
      map[key] = explicit || filePrefix + padNumber(n, padWidth) + ext;
    });

    return map;
  }

  function normalizeSteps(cfg) {
    const steps = Array.isArray(cfg.steps) ? cfg.steps : [];
    const stepPassFilters = {};
    const stepInjection = {};
    const stepOrder = {};

    cfg.steps = steps.map(function (step, index) {
      const id = String(step && step.id || '').trim();
      const passFilters = Array.isArray(step && step.passFilters)
        ? step.passFilters.map(String)
        : Array.isArray(step && step.filters)
          ? step.filters.map(String)
          : step && step.filter
            ? [String(step.filter)]
            : ['all'];

      if (id) {
        stepPassFilters[id] = passFilters;
        stepInjection[id] = {
          id: id,
          type: String(step.type || ''),
          label: String(step.label || step.title || id),
          arabicLabel: String(step.arabicLabel || step.labelAr || step.ar || ''),
          filter: String(step.filter || passFilters[0] || 'all')
        };
        stepOrder[id] = index;
      }

      return Object.assign({}, step, {
        id: id,
        filter: String(step.filter || passFilters[0] || 'all'),
        passFilters: passFilters
      });
    });

    cfg.stepPassFilters = Object.assign({}, stepPassFilters, cfg.stepPassFilters || {});
    cfg.stepInjection = Object.assign({}, stepInjection, cfg.stepInjection || {});
    cfg.stepOrder = Object.assign({}, stepOrder, cfg.stepOrder || {});

    ['all_letters', 'heavy', 'light', 'alifaa', 'vowels'].forEach(function (id, offset) {
      if (cfg.stepOrder[id] == null) cfg.stepOrder[id] = steps.length + offset;
    });

    if (!Array.isArray(cfg.messageStepKeys) || !cfg.messageStepKeys.length) {
      cfg.messageStepKeys = cfg.steps.map(function (step) { return step.id; }).filter(Boolean);
    }
  }

  function normalizeMedia(cfg, items, keyPrefix) {
    const release = ensureObject(cfg, 'release');
    const assets = ensureObject(cfg, 'assets');
    const media = ensureObject(cfg, 'media');
    const cdnRoot = ensureTrailingSlash(assets.cdnRoot || '');
    const unitMediaRoot = String(assets.unitMediaRoot || '').replace(/^\/+/, '').replace(/\/?$/, '/');
    const unitMediaBase = cdnRoot && unitMediaRoot ? cdnRoot + unitMediaRoot : '';

    cfg.assetVersion = String(release.assetVersion || cfg.assetVersion || cfg.ASSET_VERSION || release.version || 'dev');
    cfg.ASSET_VERSION = cfg.assetVersion;

    if (unitMediaBase) {
      media.l6Base = media.l6Base || unitMediaBase + 'audio/male/';
      media.watchBase = media.watchBase || unitMediaBase + 'video/';
      media.animateBase = media.animateBase || unitMediaBase + 'animate/';
      media.soundLetterAudioBase = media.soundLetterAudioBase || unitMediaBase + 'audio/male/';
      media.soundAudioBase = media.soundAudioBase || media.soundLetterAudioBase;
      media.soundVideoBase = media.soundVideoBase || unitMediaBase + 'video/';
      media.soundImageBase = media.soundImageBase || unitMediaBase + 'sound/images/';
      media.soundExplainerBase = media.soundExplainerBase || unitMediaBase + 'sound/explainer/';
    }

    media.soundAudioBase = media.soundAudioBase || media.soundLetterAudioBase || media.l6Base || '';

    const filePrefix = String(assets.filePrefix || keyPrefix || '');
    const mediaPadWidth = Number(assets.mediaPadWidth || 2);
    const audioExt = String(assets.audioExt || '.mp3');
    const soundAudioExt = String(assets.soundAudioExt || audioExt);

    cfg.audioMap = cfg.audioMap || buildSequentialMap(items, {
      keyPrefix: keyPrefix,
      filePrefix: filePrefix,
      padWidth: mediaPadWidth,
      ext: audioExt,
      itemProperty: 'audio'
    });

    cfg.watchVideoByKey = cfg.watchVideoByKey || buildSequentialMap(items, {
      keyPrefix: keyPrefix,
      filePrefix: filePrefix,
      padWidth: mediaPadWidth,
      ext: '.mp4',
      itemProperty: 'video'
    });

    cfg.soundAudioByKey = cfg.soundAudioByKey || buildSequentialMap(items, {
      keyPrefix: keyPrefix,
      filePrefix: filePrefix,
      padWidth: mediaPadWidth,
      ext: soundAudioExt,
      itemProperty: 'audio'
    });

    cfg.soundVideoByKey = cfg.soundVideoByKey || buildSequentialMap(items, {
      keyPrefix: keyPrefix,
      filePrefix: filePrefix,
      padWidth: mediaPadWidth,
      ext: '.mp4',
      itemProperty: 'video'
    });

    cfg.soundImageByKey = cfg.soundImageByKey || buildSequentialMap(items, {
      keyPrefix: keyPrefix,
      filePrefix: filePrefix,
      padWidth: mediaPadWidth,
      ext: '.png'
    });

    cfg.animateVideoByKey = cfg.animateVideoByKey || buildSequentialMap(items, {
      keyPrefix: keyPrefix,
      filePrefix: filePrefix,
      padWidth: mediaPadWidth,
      ext: '.mp4',
      itemProperty: 'video'
    });
  }

  function normalizeMessages(cfg) {
    const baseMessages = isObject(cfg.messages) ? cfg.messages : {};
    const externalMessages = isObject(root.PQ_UNIT_MESSAGES) ? root.PQ_UNIT_MESSAGES : {};

    cfg.messages = Object.assign({}, baseMessages, externalMessages);
    cfg.messages.entry = Object.assign({}, baseMessages.entry || {}, externalMessages.entry || {});
    cfg.messages.entryPasses = Object.assign({}, baseMessages.entryPasses || {}, externalMessages.entryPasses || {});

    if (externalMessages.completion || baseMessages.completion) {
      cfg.messages.completion = Object.assign({}, baseMessages.completion || {}, externalMessages.completion || {});
    }
  }

  function normalizeLayout(cfg, items) {
    const layout = Object.assign({
      layoutMode: 'flow',
      browserGridCols: 4,
      mobileGridCols: 2,
      sepFontSize: '4.5rem',
      smallFontSize: '1.5rem',
      mobileTileMinHeight: '180px',
      mobileSepFontSize: '3.2rem',
      mobileSmallFontSize: '1.3rem',
      rtlColFromLtr: false,
      width: '100%',
      maxWidth: '100%',
      columnGap: '16px',
      rowGap: '16px',
      minTileWidth: '0px'
    }, cfg.layout || {});

    const requested = Number(cfg.wordLimit || items.length) || items.length;
    const finalCount = Math.max(1, Math.min(items.length, Math.floor(requested)));
    const limitedItems = items.slice(0, finalCount);

    cfg.wordLimit = finalCount;
    cfg.canvas = Object.assign({}, cfg.canvas || {}, {
      layoutMode: layout.layoutMode || 'flow',
      gridCols: Number(layout.gridCols || layout.browserGridCols || 4),
      mobileGridCols: Number(layout.mobileGridCols || 2),
      sepFontSize: layout.sepFontSize,
      smallFontSize: layout.smallFontSize,
      mobileTileMinHeight: layout.mobileTileMinHeight,
      mobileSepFontSize: layout.mobileSepFontSize,
      mobileSmallFontSize: layout.mobileSmallFontSize,
      rtlColFromLtr: !!layout.rtlColFromLtr,
      width: layout.width,
      maxWidth: layout.maxWidth,
      columnGap: layout.columnGap,
      rowGap: layout.rowGap,
      minTileWidth: layout.minTileWidth,
      cells: limitedItems.map(function (cell) {
        const out = {
          key: cell.key,
          text: cell.text
        };
        ['en', 'small', 'ar', 'span', 'row', 'displayCol', 'ltrCol', 'audio', 'video', 'pass', 'filterType'].forEach(function (key) {
          if (cell[key] !== undefined) out[key] = cell[key];
        });
        if (out.displayCol === undefined && out.ltrCol !== undefined) out.displayCol = out.ltrCol;
        return out;
      }),
      playSequence: limitedItems.map(function (cell) { return cell.key; })
    });
  }

  function normalize(rawConfig) {
    if (!isObject(rawConfig)) {
      throw new Error('Unit config must be an object.');
    }

    const cfg = rawConfig;
    cfg.schemaVersion = Number(cfg.schemaVersion || 1);

    const identity = ensureObject(cfg, 'identity');
    const moodle = ensureObject(cfg, 'moodle');
    const release = ensureObject(cfg, 'release');
    const content = ensureObject(cfg, 'content');
    const localization = ensureObject(cfg, 'localization');

    localization.defaultLanguage = normalizeLanguage(localization.defaultLanguage || 'en');
    localization.fallbackLanguage = normalizeLanguage(localization.fallbackLanguage || 'en');
    localization.defaultScope = normalizeLanguageScope(localization.defaultScope || 'both');
    localization.supportedLanguages = Array.isArray(localization.supportedLanguages)
      ? localization.supportedLanguages.map(normalizeLanguage)
      : ['en', 'ar', 'so', 'sw', 'pa', 'ur'];
    if (!isObject(localization.translations)) localization.translations = {};
    if (root.PQL10n && typeof root.PQL10n.setPreferences === 'function') {
      const lang = root.PQL10n.getLanguage ? root.PQL10n.getLanguage() : localization.defaultLanguage;
      const scope = root.PQL10n.getScope ? root.PQL10n.getScope() : localization.defaultScope;
      localization.effectiveLanguage = root.PQL10n.setPreferences(lang || localization.defaultLanguage, scope || localization.defaultScope).language;
      localization.effectiveScope = root.PQL10n.getScope();
    }

    identity.lessonId = identity.lessonId || cfg.lessonid || cfg.lessonId || '';
    identity.unitId = identity.unitId || cfg.unitid || cfg.unitId || '';
    identity.unitKey = identity.unitKey || cfg.unitKey || identity.unitId.replace(/_listen$/, '') || '';
    identity.storagePrefix = identity.storagePrefix || cfg.storagePrefix || identity.unitId;
    identity.keyPrefix = identity.keyPrefix || cfg.keyPrefix || '';

    moodle.wsGetFunction = moodle.wsGetFunction || cfg.wsGetFunction || '';
    moodle.wsSetFunction = moodle.wsSetFunction || cfg.wsSetFunction || '';

    release.version = String(release.version || cfg.version || '0.0.0');
    release.assetVersion = String(release.assetVersion || cfg.assetVersion || cfg.ASSET_VERSION || release.version);

    cfg.lessonid = identity.lessonId;
    cfg.unitid = identity.unitId;
    cfg.storagePrefix = identity.storagePrefix;
    cfg.wsGetFunction = moodle.wsGetFunction;
    cfg.wsSetFunction = moodle.wsSetFunction;

    cfg.storageKeys = Object.assign({
      managedProgressCache: identity.storagePrefix + '_managed_progress_cache',
      speakDoneKeys: 'pq_speak_done_keys_' + identity.storagePrefix
    }, cfg.storageKeys || {});

    const items = Array.isArray(content.items)
      ? content.items
      : Array.isArray(cfg.allCells)
        ? cfg.allCells
        : [];
    cfg.allCells = items;

    normalizeMessages(cfg);
    normalizeSteps(cfg);
    normalizeLayout(cfg, items);
    normalizeMedia(cfg, items, identity.keyPrefix);

    cfg.debug = Object.assign({}, cfg.debug || {}, {
      effectiveWordLimit: cfg.wordLimit,
      layoutMode: cfg.canvas.layoutMode,
      gridCols: cfg.canvas.gridCols,
      mobileGridCols: cfg.canvas.mobileGridCols,
      spanSupport: 'main-board-ready'
    });

    return cfg;
  }

  const api = { normalize: normalize };

  root.PQUnitConfigNormalizer = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
