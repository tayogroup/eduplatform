#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const distRoot = path.join(root, 'dist', 'pre_quraan');
const htmlFiles = [
  path.join(distRoot, 'scripts', 'index_v030.html'),
  path.join(distRoot, 'units', 'alphabet', 'index.html'),
];

const requiredPaths = [
  'scripts/index_v030.html',
  'scripts/css/prequranv16.css',
  'scripts/css/pq_design_system_v012.css',
  'scripts/js/token-bootstrap.js',
  'scripts/js/app-config3_v003.js',
  'scripts/js/tajweed-menus_v003.js',
  'scripts/js/ui_app_v022.js',
  'scripts/js/parent-badge.js',
  'scripts/img/hero_quran_kid_v001.png',
  'units/alphabet/index.html',
  'styles/units/alphabet.css',
  'scripts/js/units/alphabet/unit.config.js',
  'scripts/js/units/alphabet/unit.runtime.js',
  'scripts/js/units/alphabet/runtime/runtime.bundle.js',
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
