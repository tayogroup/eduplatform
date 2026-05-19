#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const root = process.cwd();
const rawArgs = process.argv.slice(2);
const optionArgs = rawArgs.filter((arg) => arg.startsWith('--'));
const unitKey = rawArgs.find((arg) => !arg.startsWith('--')) || 'all';
const srcUnitsDir = path.join(root, 'src', 'units');
const distRoot = path.join(root, 'dist', 'pre_quraan');

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
const remotePrefix = publicBasePath.replace(/^\/+|\/+$/g, '');
const rewriteTextExtensions = new Set(['.css', '.html', '.js', '.json']);

if (unitKey === 'all') {
  const units = fs.readdirSync(srcUnitsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (!units.length) {
    console.error(`No units found in ${srcUnitsDir}`);
    process.exit(1);
  }

  for (const unit of units) {
    childProcess.execFileSync(process.execPath, [__filename, unit, ...optionArgs], { stdio: 'inherit' });
  }

  fs.writeFileSync(
    path.join(distRoot, '.bunny-build.json'),
    `${JSON.stringify({
      publicBasePath,
      remotePrefix,
      builtAt: new Date().toISOString(),
      units,
    }, null, 2)}\n`,
    'utf8'
  );

  console.log(`Built ${units.length} unit(s) for Bunny output: ${units.join(', ')}`);
  console.log(`Public base path: ${publicBasePath}`);
  process.exit(0);
}

const srcUnitDir = path.join(root, 'src', 'units', unitKey);
const srcAppShellDir = path.join(root, 'src', 'app-shell');
const distUnitDir = path.join(distRoot, 'units', unitKey);
const distAppShellDir = path.join(distRoot, 'app');
const distCompatScriptDir = path.join(distRoot, 'scripts');
const distSharedStyleDir = path.join(distRoot, 'shared', 'css');
const distSharedScriptDir = path.join(distRoot, 'shared', 'js');
const distUnitStyleDir = path.join(distUnitDir, 'css');
const distUnitScriptDir = path.join(distUnitDir, 'js');
const srcSharedStyleDir = path.join(root, 'src', 'shared', 'css');
const srcSharedScriptDir = path.join(root, 'src', 'shared', 'js');
const srcMediaDir = path.join(root, 'src', 'media');
const srcRuntimeDir = path.join(srcSharedScriptDir, 'runtime');
const runtimeBundlePath = path.join(srcRuntimeDir, 'runtime.bundle.js');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  if (rewriteTextExtensions.has(path.extname(src).toLowerCase())) {
    fs.writeFileSync(dest, rewriteDeployText(fs.readFileSync(src, 'utf8')), 'utf8');
    return;
  }

  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);

  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, item.name);
    const to = path.join(dest, item.name);

    if (item.isDirectory()) {
      copyDir(from, to);
    } else if (item.isFile()) {
      copyFile(from, to);
    }
  }
}

function rewriteAppShellHtml(html) {
  return rewriteDeployText(html)
    .replace(/href="css\//g, `href="${publicBasePath}app/css/`)
    .replace(/src="js\//g, `src="${publicBasePath}app/js/`)
    .replace(/src="img\//g, `src="${publicBasePath}app/img/`);
}

function rewriteDeployText(text) {
  return text
    .replace(/\/pre_quraan\/styles\/shared\//g, `${publicBasePath}shared/css/`)
    .replace(/\/pre_quraan\/scripts\/js\/shared\//g, `${publicBasePath}shared/js/`)
    .replace(/\/pre_quraan\//g, publicBasePath)
    .replace(/(["'`])\/pre_quraan(?=["'`])/g, `$1${publicBasePathNoSlash}`);
}

if (!fs.existsSync(srcUnitDir)) {
  fail(`Unit source not found: ${srcUnitDir}`);
}

const indexPath = path.join(srcUnitDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  fail(`Unit index not found: ${indexPath}`);
}

try {
  require('./build-unit-runtime-bundle.js');
} catch (_e) {}

if (!fs.existsSync(runtimeBundlePath)) {
  fail(`Runtime bundle not found: ${runtimeBundlePath}`);
}

cleanDir(distUnitDir);
cleanDir(distAppShellDir);
cleanDir(distCompatScriptDir);
cleanDir(distSharedStyleDir);
cleanDir(distSharedScriptDir);
cleanDir(distUnitStyleDir);
cleanDir(distUnitScriptDir);
fs.rmSync(path.join(distRoot, 'styles', 'locked'), { recursive: true, force: true });
fs.rmSync(path.join(distRoot, 'scripts', 'js', 'locked'), { recursive: true, force: true });
fs.rmSync(path.join(distRoot, 'styles', 'shared'), { recursive: true, force: true });
fs.rmSync(path.join(distRoot, 'styles', 'units'), { recursive: true, force: true });
fs.rmSync(path.join(distRoot, 'styles'), { recursive: true, force: true });
fs.rmSync(path.join(distRoot, 'scripts', 'js', 'shared'), { recursive: true, force: true });
fs.rmSync(path.join(distRoot, 'scripts', 'js', 'units'), { recursive: true, force: true });
fs.rmSync(path.join(distRoot, 'scripts', 'js'), { recursive: true, force: true });

copyDir(srcSharedStyleDir, distSharedStyleDir);
copyDir(srcSharedScriptDir, distSharedScriptDir);
copyDir(srcMediaDir, distRoot);
copyDir(srcAppShellDir, distAppShellDir);
const appShellIndex = path.join(distAppShellDir, 'index.html');
if (fs.existsSync(appShellIndex)) {
  fs.writeFileSync(
    path.join(distCompatScriptDir, 'index_v030.html'),
    rewriteAppShellHtml(fs.readFileSync(appShellIndex, 'utf8')),
    'utf8'
  );
}
copyFile(path.join(srcUnitDir, 'unit.css'), path.join(distUnitStyleDir, 'unit.css'));
copyFile(path.join(srcUnitDir, 'unit.config.js'), path.join(distUnitScriptDir, 'unit.config.js'));
if (fs.existsSync(path.join(srcUnitDir, 'unit.messages.js'))) {
  copyFile(path.join(srcUnitDir, 'unit.messages.js'), path.join(distUnitScriptDir, 'unit.messages.js'));
}
copyFile(path.join(srcUnitDir, 'unit.runtime.js'), path.join(distUnitScriptDir, 'unit.runtime.js'));

let html = fs.readFileSync(indexPath, 'utf8');

const unitScriptBase = `${publicBasePathNoSlash}/units/${unitKey}/js`;

html = html
  .replace(/href="\.\/unit\.css"/g, `href="${publicBasePathNoSlash}/units/${unitKey}/css/unit.css"`)
  .replace(/src="\.\/unit\.messages\.js"/g, `src="${unitScriptBase}/unit.messages.js"`)
  .replace(/src="\.\/unit\.config\.js"/g, `src="${unitScriptBase}/unit.config.js"`)
  .replace(/src="\.\/unit\.runtime\.js"/g, `src="${unitScriptBase}/unit.runtime.js"`)
  .replace(/src="\.\/patches\/([^"]+)"/g, `src="${publicBasePath}shared/js/patches/$1"`)
  .replace(/\/pre_quraan\/styles\/shared\//g, `${publicBasePath}shared/css/`)
  .replace(/\/pre_quraan\/scripts\/js\/shared\//g, `${publicBasePath}shared/js/`)
  .replace(/\/pre_quraan\//g, publicBasePath);

fs.writeFileSync(path.join(distUnitDir, 'index.html'), html, 'utf8');

console.log(`Built ${unitKey} for Bunny output:`);
console.log(`  public base path: ${publicBasePath}`);
console.log(`  ${path.relative(root, path.join(distUnitDir, 'index.html'))}`);
if (fs.existsSync(appShellIndex)) {
  console.log(`  ${path.relative(root, appShellIndex)}`);
}
if (fs.existsSync(path.join(distCompatScriptDir, 'index_v030.html'))) {
  console.log(`  ${path.relative(root, path.join(distCompatScriptDir, 'index_v030.html'))}`);
}
console.log(`  ${path.relative(root, distSharedStyleDir)}`);
console.log(`  ${path.relative(root, distSharedScriptDir)}`);
if (fs.existsSync(srcMediaDir)) {
  console.log(`  ${path.relative(root, path.join(distRoot, 'lessons'))}`);
}
console.log(`  ${path.relative(root, path.join(distUnitStyleDir, 'unit.css'))}`);
console.log(`  ${path.relative(root, distUnitScriptDir)}`);
