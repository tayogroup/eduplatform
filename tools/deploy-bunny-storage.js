#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');

const root = process.cwd();
const distRoot = path.join(root, 'dist', 'pre_quraan');
const storageZone = process.env.BUNNY_STORAGE_ZONE;
const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
const endpoint = (process.env.BUNNY_STORAGE_ENDPOINT || 'https://storage.bunnycdn.com').replace(/\/+$/, '');
const remotePrefix = (process.env.BUNNY_REMOTE_PREFIX || 'pre_quraan').replace(/^\/+|\/+$/g, '');

function fail(message) {
  console.error(message);
  process.exit(1);
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

async function main() {
  if (!storageZone) fail('Missing BUNNY_STORAGE_ZONE.');
  if (!accessKey) fail('Missing BUNNY_STORAGE_ACCESS_KEY.');
  if (!fs.existsSync(distRoot)) fail(`Missing Bunny output folder: ${distRoot}`);

  const files = walk(distRoot);
  console.log(`Uploading ${files.length} files to ${endpoint}/${storageZone}/${remotePrefix}/`);

  for (const file of files) {
    const uploaded = await uploadFile(file);
    console.log(`uploaded ${uploaded}`);
  }

  console.log('Bunny upload complete.');
}

main().catch((error) => fail(error.message));
