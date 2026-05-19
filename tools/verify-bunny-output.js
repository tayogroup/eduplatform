#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcUnitsDir = path.join(root, 'src', 'units');
const distRoot = path.join(root, 'dist', 'pre_quraan');
const rawArgs = process.argv.slice(2);
const optionArgs = rawArgs.filter((arg) => arg.startsWith('--'));
const unitKeys = fs.existsSync(srcUnitsDir)
  ? fs.readdirSync(srcUnitsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  : ['alphabet'];

function getOption(name) {
  const prefix = `--${name}=`;
  const match = optionArgs.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function normalizeBasePath(value) {
  const configured = value || process.env.PREQURAAN_PUBLIC_BASE_PATH || process.env.BUNNY_PUBLIC_BASE_PATH || '/pre_quraan/';
  const trimmed = configured.trim();
  if (!trimmed) return '/pre_quraan/';

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

const publicBasePath = normalizeBasePath(getOption('base-path'));
const publicBasePathNoSlash = publicBasePath.replace(/\/$/, '');

const htmlFiles = [
  path.join(distRoot, 'app', 'index.html'),
  path.join(distRoot, 'scripts', 'index_v030.html'),
  ...unitKeys.map((unitKey) => path.join(distRoot, 'units', unitKey, 'index.html')),
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
  'shared/css/arabic-tiles.css',
  'shared/css/core-lesson-layout.css',
  'shared/css/stepper-lecture.css',
  'shared/css/overrides.css',
  'shared/css/child-message.css',
  'shared/css/sound-modal.css',
  'shared/css/unit-canvas.css',
  'shared/js/core-auth-tokens.js',
  'shared/js/core-speak-engine.js',
  'shared/js/core-speak-adapter.js',
  'shared/js/shared-speak-runtime.js',
  'shared/js/shared-config-normalizer.js',
  'shared/js/shared-match-engine.js',
  'shared/js/runtime/runtime.bundle.js',
  'shared/js/patches/access-gate.js',
  'shared/js/patches/browser-ui-mode.js',
  'shared/js/patches/filter-apply-fix.js',
  'shared/js/patches/filter-runtime-fix.js',
  'shared/js/patches/hash-token-reader.js',
  'shared/js/patches/iframe-token-request.js',
  'shared/js/patches/loading-failsafe.js',
  'shared/js/patches/mobile-ui-sync.js',
  ...unitKeys.flatMap((unitKey) => [
    `units/${unitKey}/index.html`,
    `units/${unitKey}/css/unit.css`,
    `units/${unitKey}/js/unit.config.js`,
    `units/${unitKey}/js/unit.runtime.js`,
  ]),
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(distRoot, relativePath));
}

function walk(dir) {
  const files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (item.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

if (!fs.existsSync(distRoot)) {
  fail(`Missing Bunny output folder: ${distRoot}`);
  process.exit();
}

const metadataPath = path.join(distRoot, '.bunny-build.json');
if (fs.existsSync(metadataPath)) {
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    if (metadata.publicBasePath && metadata.publicBasePath !== publicBasePath) {
      fail(`Build metadata base path is ${metadata.publicBasePath}, but verification expected ${publicBasePath}.`);
    }
  } catch (error) {
    fail(`Invalid Bunny build metadata: ${metadataPath}: ${error.message}`);
  }
} else {
  console.warn('Warning: missing dist/pre_quraan/.bunny-build.json. Rebuild with npm run build:bunny to record the expected base path.');
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
    if (ref.startsWith('/') && !ref.startsWith(publicBasePath)) {
      fail(`Unexpected absolute path in ${path.relative(root, htmlFile)}: ${ref} (expected ${publicBasePath}...)`);
      continue;
    }

    const resolved = ref.startsWith(publicBasePath)
      ? path.join(distRoot, ref.slice(publicBasePath.length))
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

const textExtensionsToScan = new Set(['.html', '.js', '.json']);
for (const file of walk(distRoot)) {
  if (!textExtensionsToScan.has(path.extname(file).toLowerCase())) continue;

  const text = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  const productionPathPattern = /(?<!_staging)\/pre_quraan(?:\/|["'`])/g;
  const productionCdnPattern = /https?:\/\/[^"'\s]+\/pre_quraan\//g;

  if (publicBasePath !== '/pre_quraan/' && productionPathPattern.test(text)) {
    fail(`Production base path found in ${relative}; expected ${publicBasePath}.`);
  }

  if (publicBasePath !== '/pre_quraan/' && productionCdnPattern.test(text)) {
    fail(`Production CDN path found in ${relative}; expected ${publicBasePath}.`);
  }
}

if (!process.exitCode) {
  console.log(`Bunny output verification passed for ${publicBasePathNoSlash}/.`);
}
