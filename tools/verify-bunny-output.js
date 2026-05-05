#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const distRoot = path.join(root, 'dist', 'pre_quraan');
const htmlFiles = [
  path.join(distRoot, 'app', 'index.html'),
  path.join(distRoot, 'scripts', 'index_v030.html'),
  path.join(distRoot, 'units', 'alphabet', 'index.html'),
];

const requiredPaths = [
  'app/index.html',
  'app/css/app-shell.css',
  'app/css/design-system.css',
  'app/js/token-bootstrap.js',
  'app/js/app-config.js',
  'app/js/tajweed-menus.js',
  'app/js/app-shell.js',
  'app/js/parent-badge.js',
  'app/img/hero-quran-kid.png',
  'scripts/index_v030.html',
  'units/alphabet/index.html',
  'shared/css/arabic-tiles.css',
  'shared/css/core-lesson-layout.css',
  'shared/css/stepper-lecture.css',
  'shared/css/overrides.css',
  'shared/js/core-auth-tokens.js',
  'shared/js/core-speak-engine.js',
  'shared/js/core-speak-adapter.js',
  'shared/js/shared-speak-runtime.js',
  'shared/js/shared-config-normalizer.js',
  'shared/js/shared-match-engine.js',
  'units/alphabet/css/unit.css',
  'units/alphabet/js/unit.config.js',
  'units/alphabet/js/unit.runtime.js',
  'units/alphabet/js/runtime/runtime.bundle.js',
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(distRoot, relativePath));
}

if (!fs.existsSync(distRoot)) {
  fail(`Missing Bunny output folder: ${distRoot}`);
  process.exit();
}

for (const requiredPath of requiredPaths) {
  if (!fileExists(requiredPath)) {
    fail(`Missing required output: ${requiredPath}`);
  }
}

for (const htmlFile of htmlFiles) {
  if (!fs.existsSync(htmlFile)) {
    fail(`Missing HTML file: ${path.relative(root, htmlFile)}`);
    continue;
  }

  const html = fs.readFileSync(htmlFile, 'utf8');
  const htmlDir = path.dirname(htmlFile);
  const refs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1].split('?')[0])
    .filter((ref) => !/^(https?:|mailto:|tel:|#)/i.test(ref));

  for (const ref of refs) {
    const resolved = ref.startsWith('/pre_quraan/')
      ? path.join(distRoot, ref.replace(/^\/pre_quraan\//, ''))
      : path.resolve(htmlDir, ref);

    if (!resolved.startsWith(path.resolve(distRoot))) {
      fail(`Reference escapes dist folder in ${path.relative(root, htmlFile)}: ${ref}`);
      continue;
    }

    if (!fs.existsSync(resolved)) {
      fail(`Missing referenced file in ${path.relative(root, htmlFile)}: ${ref}`);
    }
  }
}

if (!process.exitCode) {
  console.log('Bunny output verification passed.');
}
