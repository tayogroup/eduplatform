#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');

const args = parseArgs(process.argv.slice(2));
const maicZip = path.resolve(args.maic || args._[0] || path.join(os.homedir(), 'Downloads', 'Fractions with Pizza.maic.zip'));
const assetZip = path.resolve(args.assets || args.asset || args._[1] || path.join(os.homedir(), 'Downloads', 'Fractions with Pizza.zip'));
const lessonSlug = slugify(args.slug || path.basename(maicZip).replace(/\.maic\.zip$/i, '').replace(/\.zip$/i, '') || 'openmaic-lesson');
const outFile = path.resolve(args.out || path.join(root, 'dist', 'pre_quraan', 'units', 'openmaic-classroom', `${lessonSlug}-standalone.html`));
const savedOutFile = path.resolve(args.save || path.join(root, 'outputs', 'openmaic', `${lessonSlug}-standalone.html`));
const workDir = path.resolve(args.work || path.join(root, 'outputs', 'openmaic', 'work', lessonSlug));
const combinedDir = path.join(workDir, 'combined');
const maicDir = path.join(workDir, 'maic');
const assetDir = path.join(workDir, 'assets');
const slideDir = path.join(workDir, 'slides');

assertInsideWorkspace(workDir);
assertInsideWorkspace(outFile);
assertInsideWorkspace(savedOutFile);
assertFile(maicZip, 'OpenMAIC classroom ZIP');
assertFile(assetZip, 'OpenMAIC companion ZIP');

resetDir(workDir);
fs.mkdirSync(combinedDir, { recursive: true });

extractZip(maicZip, maicDir);
extractZip(assetZip, assetDir);

const manifestPath = findFirstFile(maicDir, (file) => path.basename(file).toLowerCase() === 'manifest.json');
if (!manifestPath) throw new Error(`No manifest.json found in ${maicZip}`);
copyFile(manifestPath, path.join(combinedDir, 'manifest.json'));

const audioDir = findFirstDir(maicDir, (dir) => path.basename(dir).toLowerCase() === 'audio');
if (!audioDir) throw new Error(`No audio folder found in ${maicZip}`);
copyDir(audioDir, path.join(combinedDir, 'audio'));

const mediaDir = findFirstDir(maicDir, (dir) => path.basename(dir).toLowerCase() === 'media');
if (mediaDir) copyDir(mediaDir, path.join(combinedDir, 'media'));

const pptxPath = findFirstFile(assetDir, (file) => file.toLowerCase().endsWith('.pptx'));
if (pptxPath) {
  copyFile(pptxPath, path.join(combinedDir, path.basename(pptxPath)));
  try {
    exportSlidesWithPowerPoint(pptxPath, slideDir);
  } catch (error) {
    console.warn(`PowerPoint slide export failed; continuing with JSON slide fallback.\n${error.message}`);
  }
} else {
  console.warn(`No PPTX found in ${assetZip}; slide scenes will use JSON rendering fallback.`);
}

const interactiveHtmlFiles = findFiles(assetDir, (file) => file.toLowerCase().endsWith('.html'));
interactiveHtmlFiles.forEach((file) => {
  copyFile(file, path.join(combinedDir, path.basename(file)));
});

runNodeScript(path.join(root, 'tools', 'create-openmaic-standalone-html.js'), [
  combinedDir,
  outFile,
  fs.existsSync(slideDir) ? slideDir : path.join(combinedDir, 'slides')
]);

if (savedOutFile !== outFile) {
  fs.mkdirSync(path.dirname(savedOutFile), { recursive: true });
  fs.copyFileSync(outFile, savedOutFile);
}

console.log('');
console.log('Polished OpenMAIC lesson generated.');
console.log(`Served file: ${outFile}`);
console.log(`Saved copy:  ${savedOutFile}`);
console.log(`Work dir:    ${workDir}`);

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      parsed._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function extractZip(zipPath, destination) {
  fs.mkdirSync(destination, { recursive: true });
  const result = spawnSync('tar.exe', ['-xf', zipPath, '-C', destination], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20
  });
  if (result.status !== 0) {
    throw new Error(`ZIP extraction failed for ${zipPath}:\n${result.stderr || result.stdout}`);
  }
}

function exportSlidesWithPowerPoint(pptxPath, destination) {
  fs.mkdirSync(destination, { recursive: true });
  const helperPath = path.join(root, 'tools', 'export-pptx-slides.vbs');
  const result = spawnSync('cscript.exe', ['//Nologo', helperPath, pptxPath, destination], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20
  });
  if (result.status !== 0) {
    throw new Error(`PowerPoint export failed:\n${result.stderr || result.stdout}`);
  }
  const exportedSlides = findFiles(destination, (file) => /^slide\d+\.png$/i.test(path.basename(file)));
  if (!exportedSlides.length) throw new Error(`PowerPoint export produced no slides in ${destination}`);
}

function runNodeScript(scriptPath, scriptArgs) {
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  if (result.status !== 0) throw new Error(`Node script failed: ${scriptPath}`);
}

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else if (entry.isFile()) copyFile(src, dest);
  }
}

function resetDir(dir) {
  assertInsideWorkspace(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function findFirstFile(dir, predicate) {
  return findFiles(dir, predicate)[0] || '';
}

function findFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  const matches = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && predicate(fullPath)) matches.push(fullPath);
    if (entry.isDirectory()) matches.push(...findFiles(fullPath, predicate));
  }
  return matches;
}

function findFirstDir(dir, predicate) {
  if (!fs.existsSync(dir)) return '';
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dir, entry.name);
    if (predicate(fullPath)) return fullPath;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = findFirstDir(path.join(dir, entry.name), predicate);
    if (found) return found;
  }
  return '';
}

function assertFile(file, label) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`Missing ${label}: ${file}`);
}

function assertInsideWorkspace(targetPath) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetPath);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`Refusing to write outside workspace: ${targetPath}`);
  }
}

function slugify(value) {
  return String(value || 'openmaic-lesson')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'openmaic-lesson';
}
