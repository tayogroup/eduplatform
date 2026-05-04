#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const unitKey = process.argv[2] || 'alphabet';
const srcUnitDir = path.join(root, 'src', 'units', unitKey);
const distRoot = path.join(root, 'dist', 'pre_quraan');
const distUnitDir = path.join(distRoot, 'units', unitKey);
const distStyleDir = path.join(distRoot, 'styles', 'units');
const distScriptDir = path.join(distRoot, 'scripts', 'js', 'units', unitKey);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
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

if (!fs.existsSync(srcUnitDir)) {
  fail(`Unit source not found: ${srcUnitDir}`);
}

const indexPath = path.join(srcUnitDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  fail(`Unit index not found: ${indexPath}`);
}

ensureDir(distUnitDir);
ensureDir(distStyleDir);
ensureDir(distScriptDir);

copyFile(path.join(srcUnitDir, 'unit.css'), path.join(distStyleDir, `${unitKey}.css`));
copyFile(path.join(srcUnitDir, 'unit.config.js'), path.join(distScriptDir, 'unit.config.js'));
copyFile(path.join(srcUnitDir, 'unit.runtime.js'), path.join(distScriptDir, 'unit.runtime.js'));
copyDir(path.join(srcUnitDir, 'patches'), path.join(distScriptDir, 'patches'));

let html = fs.readFileSync(indexPath, 'utf8');

const unitScriptBase = `/pre_quraan/scripts/js/units/${unitKey}`;

html = html
  .replace(/href="\.\/unit\.css"/g, `href="/pre_quraan/styles/units/${unitKey}.css"`)
  .replace(/src="\.\/unit\.config\.js"/g, `src="${unitScriptBase}/unit.config.js"`)
  .replace(/src="\.\/unit\.runtime\.js"/g, `src="${unitScriptBase}/unit.runtime.js"`)
  .replace(/src="\.\/patches\/([^"]+)"/g, `src="${unitScriptBase}/patches/$1"`);

fs.writeFileSync(path.join(distUnitDir, 'index.html'), html, 'utf8');

console.log(`Built ${unitKey} for Bunny output:`);
console.log(`  ${path.relative(root, path.join(distUnitDir, 'index.html'))}`);
console.log(`  ${path.relative(root, path.join(distStyleDir, `${unitKey}.css`))}`);
console.log(`  ${path.relative(root, distScriptDir)}`);
