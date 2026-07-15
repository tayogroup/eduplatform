const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const testResultsDir = path.join(root, 'test-results');
const bundleRoot = path.join(testResultsDir, 'sqa-evidence-bundles');
const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : '';
}

function hasArg(name) {
  return process.argv.includes(name);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function relativeToRoot(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function copyFileTracked(source, destination, manifest, category) {
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
  const stat = fs.statSync(source);
  manifest.files.push({
    category,
    source: relativeToRoot(source),
    bundled: relativeToRoot(destination),
    size: stat.size,
    sha256: sha256(source),
  });
}

function copyDir(source, destination, manifest, category, options = {}) {
  if (!exists(source)) {
    manifest.skipped.push({ category, source: relativeToRoot(source), reason: 'missing' });
    return;
  }
  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    const relative = relativeToRoot(sourcePath);
    if (options.skip && options.skip(sourcePath, relative, entry)) {
      continue;
    }
    if (entry.isDirectory()) {
      copyDir(sourcePath, destinationPath, manifest, category, options);
    } else if (entry.isFile()) {
      copyFileTracked(sourcePath, destinationPath, manifest, category);
    }
  }
}

function collectRootEvidence(bundleDir, manifest) {
  if (!exists(testResultsDir)) {
    manifest.skipped.push({ category: 'test-results', source: 'test-results', reason: 'missing' });
    return;
  }
  const rootEvidenceExts = new Set(['.json', '.md', '.csv', '.pdf', '.txt']);
  for (const entry of fs.readdirSync(testResultsDir, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!rootEvidenceExts.has(ext)) {
      continue;
    }
    copyFileTracked(
      path.join(testResultsDir, entry.name),
      path.join(bundleDir, 'root-test-results', entry.name),
      manifest,
      'root-test-results',
    );
  }
}

function walkFiles(dir, predicate, found = []) {
  if (!exists(dir)) {
    return found;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (path.relative(bundleRoot, filePath).startsWith('..')) {
        walkFiles(filePath, predicate, found);
      }
    } else if (entry.isFile() && predicate(filePath)) {
      found.push(filePath);
    }
  }
  return found;
}

function copyReferencedArtifacts(bundleDir, manifest) {
  const summaryFiles = walkFiles(testResultsDir, (filePath) => /-summary\.json$/i.test(path.basename(filePath)));
  const copied = new Set();
  for (const summaryFile of summaryFiles) {
    let summary;
    try {
      summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    } catch (error) {
      manifest.warnings.push(`Could not parse ${relativeToRoot(summaryFile)}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const artifacts = Array.isArray(summary.artifacts) ? summary.artifacts : [];
    for (const artifact of artifacts) {
      if (typeof artifact !== 'string' || !artifact) {
        continue;
      }
      const source = path.isAbsolute(artifact) ? artifact : path.resolve(path.dirname(summaryFile), artifact);
      if (!exists(source) || !fs.statSync(source).isFile()) {
        continue;
      }
      const key = path.resolve(source).toLowerCase();
      if (copied.has(key)) {
        continue;
      }
      copied.add(key);
      const destName = relativeToRoot(source).replace(/[:]/g, '').replace(/[\\/]/g, '__');
      copyFileTracked(source, path.join(bundleDir, 'referenced-artifacts', destName), manifest, 'referenced-artifacts');
    }
  }
}

function writeReadme(bundleDir, manifest) {
  const lines = [
    '# EduPlatform SQA Evidence Bundle',
    '',
    `Bundle ID: ${manifest.bundleId}`,
    `Created: ${manifest.createdAt}`,
    `Source root: ${root}`,
    '',
    '## Contents',
    '',
    '- `playwright-report/`: HTML Playwright report, when present.',
    '- `artifacts/`: Playwright per-test artifacts, screenshots, videos, and attachments.',
    '- `sqa-schedule/`: scheduled runner JSON summaries, when present.',
    '- `sqa-verification-sweep/`: package verifier, route smoke, and control sweep summaries.',
    '- `root-test-results/`: root-level result JSON/CSV/PDF/Markdown evidence.',
    '- `referenced-artifacts/`: files referenced from journey summary manifests.',
    '- `manifest.json`: file inventory with SHA-256 checksums.',
    '',
    '## Counts',
    '',
    `- Files: ${manifest.files.length}`,
    `- Skipped inputs: ${manifest.skipped.length}`,
    `- Warnings: ${manifest.warnings.length}`,
    '',
  ];
  fs.writeFileSync(path.join(bundleDir, 'README.md'), `${lines.join('\n')}\n`);
}

function createZip(bundleDir, manifest) {
  if (hasArg('--no-zip')) {
    manifest.zip = { status: 'skipped', reason: '--no-zip' };
    return;
  }
  if (process.platform !== 'win32') {
    manifest.zip = { status: 'skipped', reason: 'zip creation currently uses PowerShell Compress-Archive on Windows' };
    return;
  }
  const zipPath = `${bundleDir}.zip`;
  const command = [
    '$ErrorActionPreference = "Stop"',
    `$source = '${bundleDir.replace(/'/g, "''")}\\*'`,
    `$destination = '${zipPath.replace(/'/g, "''")}'`,
    'if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Force }',
    'Compress-Archive -Path $source -DestinationPath $destination -Force',
  ].join('; ');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status === 0 && exists(zipPath)) {
    manifest.zip = {
      status: 'created',
      path: relativeToRoot(zipPath),
      size: fs.statSync(zipPath).size,
      sha256: sha256(zipPath),
    };
    return;
  }
  manifest.zip = {
    status: 'failed',
    exitCode: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  };
}

function main() {
  if (!exists(testResultsDir)) {
    throw new Error('No test-results directory found. Run one or more SQA phases before finalizing evidence.');
  }

  const label = (argValue('--label') || process.env.EDUPLATFORM_EVIDENCE_BUNDLE_LABEL || 'eduplatform-sqa').replace(/[^a-zA-Z0-9_.-]+/g, '-');
  const bundleId = `${label}-${runId}`;
  const bundleDir = path.join(bundleRoot, bundleId);
  ensureDir(bundleDir);

  const manifest = {
    bundleId,
    createdAt: new Date().toISOString(),
    root,
    files: [],
    skipped: [],
    warnings: [],
    zip: null,
  };

  copyDir(path.join(testResultsDir, 'playwright-report'), path.join(bundleDir, 'playwright-report'), manifest, 'playwright-report');
  copyDir(path.join(testResultsDir, 'artifacts'), path.join(bundleDir, 'artifacts'), manifest, 'artifacts');
  copyDir(path.join(testResultsDir, 'sqa-schedule'), path.join(bundleDir, 'sqa-schedule'), manifest, 'sqa-schedule');
  copyDir(path.join(testResultsDir, 'sqa-verification-sweep'), path.join(bundleDir, 'sqa-verification-sweep'), manifest, 'sqa-verification-sweep');
  collectRootEvidence(bundleDir, manifest);
  copyReferencedArtifacts(bundleDir, manifest);

  writeReadme(bundleDir, manifest);
  fs.writeFileSync(path.join(bundleDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  createZip(bundleDir, manifest);
  fs.writeFileSync(path.join(bundleDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`SQA evidence bundle: ${bundleDir}`);
  if (manifest.zip?.status === 'created') {
    console.log(`SQA evidence zip: ${path.join(root, manifest.zip.path)}`);
  } else if (manifest.zip?.status === 'failed') {
    console.warn('WARN evidence zip creation failed; folder bundle is still complete.');
  }
  console.log(`Files bundled: ${manifest.files.length}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
