#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');

const root = process.cwd();
const distRoot = path.join(root, 'dist', 'pre_quraan');
const dryRun = process.argv.includes('--dry-run');

const manifest = [
  'shared/css/communications.css',
  'shared/js/shared-communications-panel.js',
  'shared/js/patches/iframe-token-request.js',
  'shared/js/patches/stepper-arabic-labels.js',
  'shared/js/runtime/runtime.bundle.js',
  'units/alphabet/index.html',
  'units/alphabet/css/unit.css',
  'units/alphabet/js/unit.messages.js',
  'units/alphabet/js/unit.config.js',
  'units/alphabet/js/unit.runtime.js',
  'units/muqattiat/index.html',
  'units/muqattiat/css/unit.css',
  'units/muqattiat/js/unit.messages.js',
  'units/muqattiat/js/unit.config.js',
  'units/muqattiat/js/unit.runtime.js',
  'units/tanween-movement/index.html',
  'units/tanween-movement/css/unit.css',
  'units/tanween-movement/js/unit.messages.js',
  'units/tanween-movement/js/unit.config.js',
  'units/tanween-movement/js/unit.runtime.js',
];

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(path.join(root, '.env'));

const storageZone = process.env.BUNNY_STORAGE_ZONE;
const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
const endpoint = (process.env.BUNNY_STORAGE_ENDPOINT || 'https://storage.bunnycdn.com').replace(/\/+$/, '');
const remotePrefix = (process.env.BUNNY_REMOTE_PREFIX || 'pre_quraan').replace(/^\/+|\/+$/g, '');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  }[ext] || 'application/octet-stream';
}

function remoteUrl(relativePath) {
  const remotePath = [storageZone, remotePrefix, relativePath].filter(Boolean).join('/');
  return new URL(`${endpoint}/${remotePath}`);
}

function uploadFile(relativePath) {
  const filePath = path.join(distRoot, ...relativePath.split('/'));
  if (!fs.existsSync(filePath)) {
    fail(`Missing build artifact: ${path.relative(root, filePath)}`);
  }

  const body = fs.readFileSync(filePath);

  return new Promise((resolve, reject) => {
    const req = https.request(remoteUrl(relativePath), {
      method: 'PUT',
      headers: {
        AccessKey: accessKey,
        'Content-Length': body.length,
        'Content-Type': contentType(filePath),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(relativePath);
          return;
        }
        reject(new Error(`${relativePath}: HTTP ${res.statusCode} ${Buffer.concat(chunks).toString('utf8')}`));
      });
    });

    req.on('error', reject);
    req.end(body);
  });
}

async function main() {
  if (!storageZone) fail('Missing BUNNY_STORAGE_ZONE.');
  if (!accessKey) fail('Missing BUNNY_STORAGE_ACCESS_KEY.');
  if (!fs.existsSync(distRoot)) fail(`Missing Bunny output folder: ${distRoot}`);

  for (const relativePath of manifest) {
    const filePath = path.join(distRoot, ...relativePath.split('/'));
    if (!fs.existsSync(filePath)) {
      fail(`Missing build artifact: ${path.relative(root, filePath)}`);
    }
  }

  if (dryRun) {
    console.log(`Dry run: ${manifest.length} files ready for ${endpoint}/${storageZone}/${remotePrefix}/`);
    manifest.forEach((relativePath) => console.log(relativePath));
    return;
  }

  console.log(`Uploading ${manifest.length} communication rollout files to ${endpoint}/${storageZone}/${remotePrefix}/`);
  for (const relativePath of manifest) {
    const uploaded = await uploadFile(relativePath);
    console.log(`uploaded ${uploaded}`);
  }
  console.log('Bunny communications upload complete.');
}

main().catch((error) => fail(error.message));
