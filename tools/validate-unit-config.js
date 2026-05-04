#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { loadNormalizedConfig } = require('./normalize-unit-config.js');

const root = process.cwd();
const unitsDir = path.resolve(root, 'src/units');
let failed = false;

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

  assertNonEmptyString(unitKey, 'moodle.wsGetFunction', cfg.moodle && cfg.moodle.wsGetFunction);
  assertNonEmptyString(unitKey, 'moodle.wsSetFunction', cfg.moodle && cfg.moodle.wsSetFunction);
  assertNonEmptyString(unitKey, 'release.version', cfg.release && cfg.release.version);
  assertNonEmptyString(unitKey, 'release.assetVersion', cfg.release && cfg.release.assetVersion);

  if (cfg.assetVersion === 'dev' || cfg.assetVersion === String(Date.now())) {
    fail(unitKey, 'assetVersion must be release-based, not dynamic.');
  }

  assertNonEmptyString(unitKey, 'unitid compatibility alias', cfg.unitid);
  assertNonEmptyString(unitKey, 'lessonid compatibility alias', cfg.lessonid);
  assertNonEmptyString(unitKey, 'wsGetFunction compatibility alias', cfg.wsGetFunction);
  assertNonEmptyString(unitKey, 'wsSetFunction compatibility alias', cfg.wsSetFunction);

  validateSteps(unitKey, cfg);
  validateContent(unitKey, cfg);
  validateGeneratedMaps(unitKey, cfg);
}

if (!fs.existsSync(unitsDir)) {
  console.error(`Missing units folder: ${unitsDir}`);
  process.exit(1);
}

for (const unit of fs.readdirSync(unitsDir, { withFileTypes: true })) {
  if (!unit.isDirectory()) continue;

  const configPath = path.join(unitsDir, unit.name, 'unit.config.js');
  if (!fs.existsSync(configPath)) {
    fail(unit.name, `Missing config: ${path.relative(root, configPath)}`);
    continue;
  }

  try {
    validateConfig(unit.name, loadNormalizedConfig(configPath));
  } catch (error) {
    fail(unit.name, error && error.message ? error.message : String(error));
  }
}

if (failed) process.exit(1);
console.log('Unit config validation passed.');
