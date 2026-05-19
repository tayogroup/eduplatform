#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = process.cwd();
const unitKey = process.argv[2] || 'alphabet';
const configPath = path.join(root, 'src', 'units', unitKey, 'unit.config.js');
const normalizerPath = path.join(root, 'src', 'shared', 'js', 'shared-config-normalizer.js');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadNormalizedConfig(targetPath) {
  if (!fs.existsSync(normalizerPath)) {
    fail(`Missing normalizer: ${path.relative(root, normalizerPath)}`);
  }
  if (!fs.existsSync(targetPath)) {
    fail(`Missing config: ${path.relative(root, targetPath)}`);
  }

  const context = {
    console,
    window: {},
    globalThis: null,
    module: { exports: {} },
    exports: {}
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(normalizerPath, 'utf8'), context, {
    filename: normalizerPath
  });
  context.window.PQUnitConfigNormalizer = context.PQUnitConfigNormalizer;

  const messagesPath = path.join(path.dirname(targetPath), 'unit.messages.js');
  if (fs.existsSync(messagesPath)) {
    vm.runInContext(fs.readFileSync(messagesPath, 'utf8'), context, {
      filename: messagesPath
    });
    context.PQ_UNIT_MESSAGES = context.window.PQ_UNIT_MESSAGES;
  }

  vm.runInContext(fs.readFileSync(targetPath, 'utf8'), context, {
    filename: targetPath
  });

  const cfg = context.window.UNIT_CFG || context.UNIT_CFG;
  if (!cfg || typeof cfg !== 'object') {
    fail(`Config did not expose window.UNIT_CFG: ${path.relative(root, targetPath)}`);
  }

  return cfg;
}

if (require.main === module) {
  const cfg = loadNormalizedConfig(configPath);
  console.log(JSON.stringify({
    unitid: cfg.unitid,
    lessonid: cfg.lessonid,
    stepCount: Array.isArray(cfg.steps) ? cfg.steps.length : 0,
    itemCount: Array.isArray(cfg.allCells) ? cfg.allCells.length : 0,
    wordLimit: cfg.wordLimit,
    assetVersion: cfg.assetVersion
  }, null, 2));
}

module.exports = {
  loadNormalizedConfig
};
