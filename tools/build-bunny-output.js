#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const unitKey = process.argv[2] || 'alphabet';
const srcUnitDir = path.join(root, 'src', 'units', unitKey);
const srcAppShellDir = path.join(root, 'src', 'app-shell');
const distRoot = path.join(root, 'dist', 'pre_quraan');
const distUnitDir = path.join(distRoot, 'units', unitKey);
const distAppShellDir = path.join(distRoot, 'app');
const distCompatScriptDir = path.join(distRoot, 'scripts');
const distSharedStyleDir = path.join(distRoot, 'shared', 'css');
const distSharedScriptDir = path.join(distRoot, 'shared', 'js');
const distUnitStyleDir = path.join(distUnitDir, 'css');
const distUnitScriptDir = path.join(distUnitDir, 'js');
const srcSharedStyleDir = path.join(root, 'src', 'shared', 'css');
const srcSharedScriptDir = path.join(root, 'src', 'shared', 'js');
const srcRuntimeDir = path.join(srcUnitDir, 'runtime');
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
  return html
    .replace(/href="css\//g, 'href="/pre_quraan/app/css/')
    .replace(/src="js\//g, 'src="/pre_quraan/app/js/')
    .replace(/src="img\//g, 'src="/pre_quraan/app/img/');
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
copyFile(path.join(srcUnitDir, 'unit.runtime.js'), path.join(distUnitScriptDir, 'unit.runtime.js'));
copyDir(srcRuntimeDir, path.join(distUnitScriptDir, 'runtime'));
copyDir(path.join(srcUnitDir, 'patches'), path.join(distUnitScriptDir, 'patches'));

let html = fs.readFileSync(indexPath, 'utf8');

const unitScriptBase = `/pre_quraan/units/${unitKey}/js`;

html = html
  .replace(/href="\.\/unit\.css"/g, `href="/pre_quraan/units/${unitKey}/css/unit.css"`)
  .replace(/src="\.\/unit\.config\.js"/g, `src="${unitScriptBase}/unit.config.js"`)
  .replace(/src="\.\/unit\.runtime\.js"/g, `src="${unitScriptBase}/unit.runtime.js"`)
  .replace(/src="\.\/patches\/([^"]+)"/g, `src="${unitScriptBase}/patches/$1"`)
  .replace(/\/pre_quraan\/styles\/shared\//g, '/pre_quraan/shared/css/')
  .replace(/\/pre_quraan\/scripts\/js\/shared\//g, '/pre_quraan/shared/js/');

fs.writeFileSync(path.join(distUnitDir, 'index.html'), html, 'utf8');

console.log(`Built ${unitKey} for Bunny output:`);
console.log(`  ${path.relative(root, path.join(distUnitDir, 'index.html'))}`);
if (fs.existsSync(appShellIndex)) {
  console.log(`  ${path.relative(root, appShellIndex)}`);
}
if (fs.existsSync(path.join(distCompatScriptDir, 'index_v030.html'))) {
  console.log(`  ${path.relative(root, path.join(distCompatScriptDir, 'index_v030.html'))}`);
}
console.log(`  ${path.relative(root, distSharedStyleDir)}`);
console.log(`  ${path.relative(root, distSharedScriptDir)}`);
console.log(`  ${path.relative(root, path.join(distUnitStyleDir, 'unit.css'))}`);
console.log(`  ${path.relative(root, distUnitScriptDir)}`);
