#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { loadNormalizedConfig } = require('./normalize-unit-config.js');

const root = process.cwd();
const unitsDir = path.resolve(root, 'src/units');
let failed = false;
const allowedUnitFiles = new Set([
  'index.html',
  'unit.config.js',
  'unit.messages.js',
  'unit.css',
  'unit.runtime.js',
]);

function fail(unitKey, message) {
  console.error(`[${unitKey}] ${message}`);
  failed = true;
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function assertNonEmptyString(unitKey, label, value) {
  if (typeof value !== 'string' || !value.trim()) {
    fail(unitKey, `Missing required string: ${label}`);
  }
}

function assertMoodleFunctionName(unitKey, label, value) {
  assertNonEmptyString(unitKey, label, value);
  if (typeof value === 'string' && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    fail(unitKey, `${label} must be a valid Moodle function name using letters, numbers, and underscores only: ${value}`);
  }
}

function assertUniqueBy(unitKey, label, items, getKey) {
  const seen = new Set();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    if (seen.has(key)) {
      fail(unitKey, `Duplicate ${label}: ${key}`);
    }
    seen.add(key);
  }
}

function validateSteps(unitKey, cfg) {
  if (!Array.isArray(cfg.steps) || !cfg.steps.length) {
    fail(unitKey, 'steps must be a non-empty array.');
    return;
  }

  assertUniqueBy(unitKey, 'step id', cfg.steps, (step) => step && step.id);

  const filterSets = isObject(cfg.filterSets) ? cfg.filterSets : {};

  cfg.steps.forEach((step, index) => {
    if (!isObject(step)) {
      fail(unitKey, `steps[${index}] must be an object.`);
      return;
    }

    assertNonEmptyString(unitKey, `steps[${index}].id`, step.id);
    assertNonEmptyString(unitKey, `steps[${index}].type`, step.type);
    assertNonEmptyString(unitKey, `steps[${index}].label`, step.label);

    if (!Array.isArray(step.passFilters) || !step.passFilters.length) {
      fail(unitKey, `steps[${index}].passFilters must be a non-empty array.`);
      return;
    }

    step.passFilters.forEach((filter) => {
      if (filter !== 'all' && !filterSets[filter]) {
        fail(unitKey, `step "${step.id}" references unknown pass filter "${filter}".`);
      }
    });
  });
}

function validateContent(unitKey, cfg) {
  const items = cfg.content && Array.isArray(cfg.content.items)
    ? cfg.content.items
    : cfg.allCells;

  if (!Array.isArray(items) || !items.length) {
    fail(unitKey, 'content.items must be a non-empty array.');
    return;
  }

  assertUniqueBy(unitKey, 'content key', items, (item) => item && item.key);

  items.forEach((item, index) => {
    if (!isObject(item)) {
      fail(unitKey, `content.items[${index}] must be an object.`);
      return;
    }

    assertNonEmptyString(unitKey, `content.items[${index}].key`, item.key);
    assertNonEmptyString(unitKey, `content.items[${index}].text`, item.text);
    assertNonEmptyString(unitKey, `content.items[${index}].audio`, item.audio);
    assertNonEmptyString(unitKey, `content.items[${index}].video`, item.video);

    const row = Number(item.row);
    const displayCol = Number(item.displayCol);
    const span = Math.max(1, Number(item.span || 1) || 1);
    const gridCols = Math.max(1, Number(cfg.canvas && cfg.canvas.gridCols || cfg.layout && cfg.layout.browserGridCols || 4) || 4);

    if (!Number.isInteger(row) || row < 1) {
      fail(unitKey, `content.items[${index}].row must be a positive integer.`);
    }

    if (!Number.isInteger(displayCol) || displayCol < 1) {
      fail(unitKey, `content.items[${index}].displayCol must be a positive integer.`);
    } else if (displayCol > gridCols) {
      fail(unitKey, `content.items[${index}].displayCol exceeds grid columns (${gridCols}).`);
    } else if (displayCol + span - 1 > gridCols) {
      fail(unitKey, `content.items[${index}] span overflows grid columns (${gridCols}).`);
    }

    if (item.ltrCol !== undefined) {
      fail(unitKey, `content.items[${index}].ltrCol is deprecated; use displayCol.`);
    }
  });

  if (!Array.isArray(cfg.canvas && cfg.canvas.cells) || cfg.canvas.cells.length !== cfg.wordLimit) {
    fail(unitKey, 'normalized canvas.cells length must match wordLimit.');
  }

  if (!Array.isArray(cfg.canvas && cfg.canvas.playSequence) || cfg.canvas.playSequence.length !== cfg.wordLimit) {
    fail(unitKey, 'normalized canvas.playSequence length must match wordLimit.');
  }
}

function validateGeneratedMaps(unitKey, cfg) {
  const requiredMaps = [
    'audioMap',
    'watchVideoByKey',
    'soundAudioByKey',
    'soundVideoByKey',
    'soundImageByKey',
    'animateVideoByKey'
  ];

  for (const mapKey of requiredMaps) {
    if (!isObject(cfg[mapKey]) || !Object.keys(cfg[mapKey]).length) {
      fail(unitKey, `normalized map missing or empty: ${mapKey}`);
    }
  }
}

function stripPreQuraanPrefix(value) {
  return String(value || '').replace(/^\/pre_quraan\/?/, '');
}

function validateLocalFile(unitKey, label, base, filename) {
  if (!base || !filename) return;
  if (!String(base).startsWith('/pre_quraan/')) return;

  const filePath = path.join(root, 'src', 'media', stripPreQuraanPrefix(base), filename);
  if (!fs.existsSync(filePath)) {
    fail(unitKey, `Missing local ${label}: ${path.relative(root, filePath)}`);
  }
}

function localBaseExists(base) {
  if (!base || !String(base).startsWith('/pre_quraan/')) return false;
  return fs.existsSync(path.join(root, 'src', 'media', stripPreQuraanPrefix(base)));
}

function validateLocalAssetMap(unitKey, label, assetCfg) {
  if (!isObject(assetCfg) || !isObject(assetCfg.map)) return;

  const imageBase = assetCfg.imageBase || '';
  const audioBase = assetCfg.audioBase || '';
  const imageExt = assetCfg.imageExt || '';
  const audioExt = assetCfg.audioExt || '';

  Object.entries(assetCfg.map).forEach(([key, item]) => {
    if (!isObject(item)) return;
    validateLocalFile(unitKey, `${label} image for ${key}`, imageBase, item.image ? `${item.image}${imageExt}` : '');
    validateLocalFile(unitKey, `${label} audio for ${key}`, audioBase, item.audio ? `${item.audio}${audioExt}` : '');
  });
}

function validateNoCloneLeaks(unitKey, unitDir, cfg) {
  const allowedAlphabet = unitKey === 'alphabet';
  const files = ['index.html', 'unit.config.js', 'unit.messages.js', 'unit.css', 'unit.runtime.js'];
  const mojibakePattern = /Ã|Â|â€|â€™|â€œ|â€�|â€“|â€”|âœ|â–|â€¢|ðŸ|�|Ø|Ù/;
  const alphabetLeakPattern = /\/lessons\/alphabet\b|\/unit_steps\/alphabet\b|\/units\/alphabet\b|alphabet_|Alphabet|\balph_\d+/;
  const unitPathPattern = /\/pre_quraan\/units\/([^/"?#]+)\//g;

  for (const file of files) {
    const filePath = path.join(unitDir, file);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, 'utf8');

    if (mojibakePattern.test(text)) {
      fail(unitKey, `Possible mojibake/encoding artifact in ${file}.`);
    }

    if (!allowedAlphabet && alphabetLeakPattern.test(text)) {
      fail(unitKey, `Alphabet-specific leftover found in ${file}.`);
    }

    let match;
    while ((match = unitPathPattern.exec(text))) {
      if (match[1] !== unitKey) {
        fail(unitKey, `Wrong unit script/path in ${file}: ${match[0]} expected /pre_quraan/units/${unitKey}/...`);
      }
    }
  }

  const keyPrefix = String(cfg.identity && cfg.identity.keyPrefix || '');
  const items = cfg.content && Array.isArray(cfg.content.items) ? cfg.content.items : [];
  if (keyPrefix) {
    items.forEach((item, index) => {
      const key = String(item && item.key || '');
      if (key && !key.startsWith(keyPrefix)) {
        fail(unitKey, `content.items[${index}].key "${key}" must start with identity.keyPrefix "${keyPrefix}".`);
      }
    });
  }
}

function collectMessageAudio(value, out = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectMessageAudio(item, out));
    return out;
  }

  if (!isObject(value)) return out;

  if (typeof value.audio === 'string' && value.audio.trim()) {
    out.push(value.audio.trim());
  }

  Object.entries(value).forEach(([key, child]) => {
    if (key !== 'audio') collectMessageAudio(child, out);
  });

  return out;
}

function fileStemFromKey(key) {
  const match = String(key || '').match(/^(.*?)(\d+)$/);
  if (!match) return String(key || '');
  return `${match[1]}${String(Number(match[2]) || 0).padStart(2, '0')}`;
}

function validateLocalMedia(unitKey, cfg) {
  const cdnRoot = String(cfg.assets && cfg.assets.cdnRoot || '');
  if (cdnRoot !== '/pre_quraan') return;

  const items = cfg.content && Array.isArray(cfg.content.items)
    ? cfg.content.items
    : [];
  const audioBase = stripPreQuraanPrefix(cfg.media && (cfg.media.l6Base || cfg.media.audioBase || cfg.media.fallbackAudioBase));
  const videoBase = stripPreQuraanPrefix(cfg.media && (cfg.media.watchBase || cfg.media.fallbackWatchBase));
  const animateBase = cfg.media && cfg.media.animateBase;
  const soundImageBase = cfg.media && cfg.media.soundImageBase;
  const soundExplainerBase = cfg.media && cfg.media.soundExplainerBase;

  items.forEach((item) => {
    if (item && item.audio && audioBase) {
      const audioPath = path.join(root, 'src', 'media', audioBase, item.audio);
      if (!fs.existsSync(audioPath)) {
        fail(unitKey, `Missing local audio file for ${item.key}: ${path.relative(root, audioPath)}`);
      }
    }

    if (item && item.video && videoBase) {
      const videoPath = path.join(root, 'src', 'media', videoBase, item.video);
      if (!fs.existsSync(videoPath)) {
        fail(unitKey, `Missing local video file for ${item.key}: ${path.relative(root, videoPath)}`);
      }
    }

    if (item && item.video && localBaseExists(animateBase)) {
      validateLocalFile(unitKey, `animate video for ${item.key}`, animateBase, item.video);
    }

    if (item && item.key) {
      const stem = fileStemFromKey(item.key);
      if (localBaseExists(soundImageBase)) {
        validateLocalFile(unitKey, `sound image for ${item.key}`, soundImageBase, `${stem}_articulation.png`);
      }
      if (localBaseExists(soundExplainerBase)) {
        validateLocalFile(unitKey, `sound explainer audio for ${item.key}`, soundExplainerBase, `${stem}_explainer.mp3`);
      }
    }
  });

  validateLocalAssetMap(unitKey, 'listenPlus', cfg.listenPlus);
  validateLocalAssetMap(unitKey, 'words', cfg.words);

  if (cfg.messages && cfg.messages.base) {
    collectMessageAudio(cfg.messages).forEach((audio) => {
      validateLocalFile(unitKey, 'message audio', cfg.messages.base, audio);
    });
  }
}

function validateUnitFolder(unitKey, unitDir) {
  const entries = fs.readdirSync(unitDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

  for (const directory of directories) {
    fail(unitKey, `Unexpected unit-owned directory: ${directory}. Unit folders must contain only the unit template files.`);
  }

  for (const requiredFile of allowedUnitFiles) {
    if (!files.includes(requiredFile)) {
      fail(unitKey, `Missing required unit template file: ${requiredFile}`);
    }
  }

  for (const file of files) {
    if (!allowedUnitFiles.has(file)) {
      fail(unitKey, `Unexpected unit-owned file: ${file}. Unit folders must contain only index.html, unit.config.js, unit.messages.js, unit.css, and unit.runtime.js.`);
    }
  }
}

function validateConfig(unitKey, cfg) {
  if (!isObject(cfg)) {
    fail(unitKey, 'Config did not normalize to an object.');
    return;
  }

  assertNonEmptyString(unitKey, 'identity.lessonId', cfg.identity && cfg.identity.lessonId);
  assertNonEmptyString(unitKey, 'identity.unitId', cfg.identity && cfg.identity.unitId);
  assertNonEmptyString(unitKey, 'identity.unitKey', cfg.identity && cfg.identity.unitKey);
  assertNonEmptyString(unitKey, 'identity.storagePrefix', cfg.identity && cfg.identity.storagePrefix);
  assertNonEmptyString(unitKey, 'identity.keyPrefix', cfg.identity && cfg.identity.keyPrefix);

  assertMoodleFunctionName(unitKey, 'moodle.wsGetFunction', cfg.moodle && cfg.moodle.wsGetFunction);
  assertMoodleFunctionName(unitKey, 'moodle.wsSetFunction', cfg.moodle && cfg.moodle.wsSetFunction);
  assertNonEmptyString(unitKey, 'release.version', cfg.release && cfg.release.version);
  assertNonEmptyString(unitKey, 'release.assetVersion', cfg.release && cfg.release.assetVersion);

  if (cfg.assetVersion === 'dev' || cfg.assetVersion === String(Date.now())) {
    fail(unitKey, 'assetVersion must be release-based, not dynamic.');
  }

  assertNonEmptyString(unitKey, 'unitid compatibility alias', cfg.unitid);
  assertNonEmptyString(unitKey, 'lessonid compatibility alias', cfg.lessonid);
  assertMoodleFunctionName(unitKey, 'wsGetFunction compatibility alias', cfg.wsGetFunction);
  assertMoodleFunctionName(unitKey, 'wsSetFunction compatibility alias', cfg.wsSetFunction);

  validateSteps(unitKey, cfg);
  validateContent(unitKey, cfg);
  validateGeneratedMaps(unitKey, cfg);
  validateLocalMedia(unitKey, cfg);
}

if (!fs.existsSync(unitsDir)) {
  console.error(`Missing units folder: ${unitsDir}`);
  process.exit(1);
}

for (const unit of fs.readdirSync(unitsDir, { withFileTypes: true })) {
  if (!unit.isDirectory()) continue;

  const unitDir = path.join(unitsDir, unit.name);
  validateUnitFolder(unit.name, unitDir);

  const configPath = path.join(unitDir, 'unit.config.js');
  if (!fs.existsSync(configPath)) {
    fail(unit.name, `Missing config: ${path.relative(root, configPath)}`);
    continue;
  }

  try {
    const cfg = loadNormalizedConfig(configPath);
    validateConfig(unit.name, cfg);
    validateNoCloneLeaks(unit.name, unitDir, cfg);
  } catch (error) {
    fail(unit.name, error && error.message ? error.message : String(error));
  }
}

if (failed) process.exit(1);
console.log('Unit config validation passed.');
