(function (root) {
  'use strict';

  function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

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

    items.forEach(function (_item, index) {
      const n = index + 1;
      map[keyPrefix + n] = filePrefix + padNumber(n, padWidth) + ext;
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

    cfg.audioMap = cfg.audioMap || buildSequentialMap(items, {
      keyPrefix: keyPrefix,
      filePrefix: filePrefix,
      padWidth: mediaPadWidth,
      ext: '.mp3'
    });

    cfg.watchVideoByKey = cfg.watchVideoByKey || buildSequentialMap(items, {
      keyPrefix: keyPrefix,
      filePrefix: filePrefix,
      padWidth: mediaPadWidth,
      ext: '.mp4'
    });

    cfg.soundAudioByKey = cfg.soundAudioByKey || buildSequentialMap(items, {
      keyPrefix: keyPrefix,
      filePrefix: filePrefix,
      padWidth: mediaPadWidth,
      ext: '.mp3'
    });

    cfg.soundVideoByKey = cfg.soundVideoByKey || buildSequentialMap(items, {
      keyPrefix: keyPrefix,
      filePrefix: filePrefix,
      padWidth: mediaPadWidth,
      ext: '.mp4'
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
      ext: '.mp4'
    });
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
        ['en', 'small', 'ar', 'span', 'pass', 'filterType'].forEach(function (key) {
          if (cell[key] !== undefined) out[key] = cell[key];
        });
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
