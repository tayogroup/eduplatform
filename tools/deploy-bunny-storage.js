#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');
const readline = require('readline');

const root = process.cwd();
const distRoot = path.join(root, 'dist', 'pre_quraan');
const rawArgs = process.argv.slice(2);
const optionArgs = rawArgs.filter((arg) => arg.startsWith('--'));

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

function getOption(name) {
  const exact = `--${name}`;
  const prefix = `${exact}=`;
  const match = optionArgs.find((arg) => arg === exact || arg.startsWith(prefix));
  if (!match) return undefined;
  if (match === exact) return true;
  return match.slice(prefix.length);
}

function normalizePrefix(value) {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '');
}

const DEPLOY_TARGET_PREFIXES = {
  integration: 'pre_quraan_integration',
  staging: 'pre_quraan_staging',
  production: 'pre_quraan',
};

function defaultPrefixForTarget(target) {
  return DEPLOY_TARGET_PREFIXES[target] || '';
}

function envPrefixForTarget(target) {
  const suffix = target.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  return process.env[`BUNNY_DEPLOY_BASE_PATH_${suffix}`];
}

const storageZone = process.env.BUNNY_STORAGE_ZONE;
const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
const endpoint = (process.env.BUNNY_STORAGE_ENDPOINT || 'https://storage.bunnycdn.com').replace(/\/+$/, '');
const configuredTarget = getOption('target') || process.env.BUNNY_DEPLOY_TARGET;
const target = String(configuredTarget || 'production').toLowerCase();
const dryRun = Boolean(getOption('dry-run') || process.env.BUNNY_DEPLOY_DRY_RUN === '1');
const includePatterns = String(getOption('include') || process.env.BUNNY_DEPLOY_INCLUDE || '')
  .split(',')
  .map((value) => value.trim().replace(/\\/g, '/'))
  .filter(Boolean);
const remotePrefix = normalizePrefix(
  getOption('base-path') ||
  getOption('remote-prefix') ||
  envPrefixForTarget(target) ||
  process.env.BUNNY_DEPLOY_BASE_PATH ||
  (!configuredTarget ? process.env.BUNNY_REMOTE_PREFIX : '') ||
  defaultPrefixForTarget(target)
);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function walk(dir) {
  const files = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name.startsWith('.')) continue;

    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (item.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function matchesInclude(relativePath) {
  if (!includePatterns.length) return true;

  const normalized = relativePath.replace(/\\/g, '/');
  return includePatterns.some((pattern) => {
    if (pattern.endsWith('/')) {
      return normalized.startsWith(pattern);
    }
    return normalized === pattern || normalized.startsWith(`${pattern}/`);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  }[ext] || 'application/octet-stream';
}

function uploadFile(filePath) {
  const relativePath = path.relative(distRoot, filePath).split(path.sep).join('/');
  const remotePath = [storageZone, remotePrefix, relativePath].filter(Boolean).join('/');
  const url = new URL(`${endpoint}/${remotePath}`);
  const body = fs.readFileSync(filePath);

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
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

function readBuildMetadata() {
  const metadataPath = path.join(distRoot, '.bunny-build.json');
  if (!fs.existsSync(metadataPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch (error) {
    fail(`Invalid Bunny build metadata: ${metadataPath}: ${error.message}`);
  }
}

function validateTarget() {
  const validTargets = Object.keys(DEPLOY_TARGET_PREFIXES);
  if (!validTargets.includes(target)) {
    fail(`Invalid Bunny deploy target "${target}". Use ${validTargets.join(', ')}.`);
  }

  if (!remotePrefix) {
    fail('Missing Bunny deploy base path. Set BUNNY_DEPLOY_BASE_PATH or BUNNY_REMOTE_PREFIX.');
  }

  if (target !== 'production' && remotePrefix === defaultPrefixForTarget('production')) {
    fail(`Refusing ${target} deploy to the production path "pre_quraan". Use the ${target} deploy path or an explicit non-production path.`);
  }

  const metadata = readBuildMetadata();
  if (!metadata) {
    console.warn('Warning: missing dist/pre_quraan/.bunny-build.json. Rebuild with npm run build:bunny before deploying.');
    return;
  }

  if (metadata.remotePrefix && metadata.remotePrefix !== remotePrefix) {
    fail(
      `Build/deploy path mismatch. Build output is for "${metadata.remotePrefix}", ` +
      `but deploy target "${target}" is "${remotePrefix}". Rebuild with the matching base path.`
    );
  }
}

function askProductionConfirmation() {
  if (target !== 'production' || dryRun) return Promise.resolve();

  if (process.env.BUNNY_DEPLOY_CONFIRM === 'DEPLOY PRODUCTION') {
    return Promise.resolve();
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Type DEPLOY PRODUCTION to upload to Bunny production: ', (answer) => {
      rl.close();
      if (answer !== 'DEPLOY PRODUCTION') {
        fail('Production deploy cancelled.');
      }

      resolve();
    });
  });
}

async function main() {
  validateTarget();
  if (!storageZone) fail('Missing BUNNY_STORAGE_ZONE.');
  if (!accessKey) fail('Missing BUNNY_STORAGE_ACCESS_KEY.');
  if (!fs.existsSync(distRoot)) fail(`Missing Bunny output folder: ${distRoot}`);

  const files = walk(distRoot).filter((file) => {
    const relativePath = path.relative(distRoot, file).split(path.sep).join('/');
    return matchesInclude(relativePath);
  });
  console.log(`${dryRun ? 'Dry run: would upload' : 'Uploading'} ${files.length} files to ${endpoint}/${storageZone}/${remotePrefix}/`);

  if (dryRun) {
    for (const file of files) {
      console.log(`would upload ${path.relative(distRoot, file).split(path.sep).join('/')}`);
    }
    console.log('Bunny dry run complete.');
    return;
  }

  await askProductionConfirmation();

  for (const file of files) {
    const uploaded = await uploadFile(file);
    console.log(`uploaded ${uploaded}`);
  }

  console.log('Bunny upload complete.');
}

main().catch((error) => fail(error.message));
