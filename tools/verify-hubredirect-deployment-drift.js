const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const hubredirectDir = path.join(root, 'src', 'moodle', 'local_hubredirect');

function argValue(name) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  if (match) {
    return match.slice(prefix.length);
  }
  const index = process.argv.indexOf(name);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return '';
}

function hasArg(name) {
  return process.argv.includes(name);
}

function isTruthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function localFiles() {
  const includeRaw = process.env.EDUPLATFORM_HUBREDIRECT_DRIFT_INCLUDE || argValue('--include');
  const include = includeRaw
    ? new Set(includeRaw.split(',').map((name) => name.trim()).filter(Boolean))
    : null;
  return fs.readdirSync(hubredirectDir)
    .filter((name) => name.endsWith('.php'))
    .filter((name) => !include || include.has(name))
    .sort()
    .map((name) => {
      const filepath = path.join(hubredirectDir, name);
      const content = fs.readFileSync(filepath);
      const stat = fs.statSync(filepath);
      return {
        name,
        size: stat.size,
        sha256: sha256(content),
      };
    });
}

async function fetchText(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'application/json,text/html;q=0.9,*/*;q=0.8',
        'User-Agent': 'EduPlatform-SQA-Deployment-Drift-Verifier/1.0',
      },
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      url: response.url,
      text,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } finally {
    clearTimeout(timer);
  }
}

function baseUrl() {
  const value = argValue('--base-url') || process.env.EDUPLATFORM_BASE_URL;
  if (!value) {
    throw new Error('Missing EDUPLATFORM_BASE_URL or --base-url.');
  }
  return value.replace(/\/+$/, '');
}

function defaultProbeUrl(base) {
  return `${base}/local/hubredirect/deployment_drift_probe.php`;
}

async function readProbe(base) {
  const explicitProbeUrl = argValue('--probe-url') || process.env.EDUPLATFORM_HUBREDIRECT_DRIFT_PROBE_URL || '';
  const token = argValue('--token') || process.env.EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN || '';
  const probeUrl = new URL(explicitProbeUrl || defaultProbeUrl(base));
  if (token) {
    probeUrl.searchParams.set('token', token);
  }
  const response = await fetchText(probeUrl.toString());
  let json;
  try {
    json = JSON.parse(response.text);
  } catch (error) {
    const contentType = response.headers['content-type'] || '';
    const bodyPreview = response.text.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(`Probe did not return JSON. HTTP ${response.status}; content-type ${contentType || '(missing)'}; body ${bodyPreview}`);
  }
  if (!response.ok || !json.ok || !Array.isArray(json.files)) {
    const details = json.error ? ` error=${json.error}` : '';
    const message = json.message ? ` message=${json.message}` : '';
    throw new Error(`Probe did not return a valid checksum manifest. HTTP ${response.status}.${details}${message}`);
  }
  return {
    mode: 'probe',
    url: probeUrl.toString().replace(/token=[^&]+/, 'token=REDACTED'),
    files: json.files,
  };
}

function directUrl(base, fileName) {
  const url = new URL(`/local/hubredirect/${fileName}`, base);
  const consumer = process.env.EDUPLATFORM_CONSUMER || argValue('--consumer');
  const workspaceId = process.env.EDUPLATFORM_WORKSPACE_ID || argValue('--workspaceid');
  if (consumer) {
    url.searchParams.set('consumer', consumer);
  }
  if (workspaceId) {
    url.searchParams.set('workspaceid', workspaceId);
  }
  url.searchParams.set('_sqa_drift', String(Date.now()));
  return url.toString();
}

async function directPresenceCheck(base, files) {
  const results = [];
  const rawConcurrency = Number(process.env.EDUPLATFORM_HUBREDIRECT_DRIFT_CONCURRENCY || argValue('--concurrency') || 6);
  const concurrency = Number.isFinite(rawConcurrency) && rawConcurrency > 0 ? Math.floor(rawConcurrency) : 6;
  let next = 0;

  async function worker() {
    while (next < files.length) {
      const local = files[next++];
      const url = directUrl(base, local.name);
      try {
        const response = await fetchText(url);
        const text = response.text.slice(0, 2000);
        const bodyHasMissingHint = /404|not found/i.test(text);
        const missing = response.status === 404;
        results.push({
          name: local.name,
          status: missing ? 'missing' : 'served',
          httpStatus: response.status,
          localSha256: local.sha256,
          remoteBodySha256: sha256(Buffer.from(response.text)),
          bodyHasMissingHint,
          finalUrl: response.url,
        });
      } catch (error) {
        results.push({
          name: local.name,
          status: 'error',
          localSha256: local.sha256,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  return results.sort((left, right) => left.name.localeCompare(right.name));
}

function compareProbe(local, remoteFiles) {
  const remoteByName = new Map(remoteFiles.map((file) => [file.name, file]));
  const localByName = new Map(local.map((file) => [file.name, file]));
  const results = [];
  for (const localFile of local) {
    const remoteFile = remoteByName.get(localFile.name);
    if (!remoteFile) {
      results.push({ ...localFile, status: 'missing' });
      continue;
    }
    const checksumMatches = remoteFile.sha256 === localFile.sha256;
    results.push({
      name: localFile.name,
      status: checksumMatches ? 'match' : 'drift',
      localSize: localFile.size,
      remoteSize: remoteFile.size,
      localSha256: localFile.sha256,
      remoteSha256: remoteFile.sha256,
      remoteMtime: remoteFile.mtime,
    });
  }
  for (const remoteFile of remoteFiles) {
    if (!localByName.has(remoteFile.name)) {
      results.push({
        name: remoteFile.name,
        status: 'remote_only',
        remoteSize: remoteFile.size,
        remoteSha256: remoteFile.sha256,
        remoteMtime: remoteFile.mtime,
      });
    }
  }
  return results.sort((left, right) => left.name.localeCompare(right.name));
}

function summarize(results) {
  return results.reduce((summary, result) => {
    summary[result.status] = (summary[result.status] || 0) + 1;
    return summary;
  }, {});
}

function printTable(results) {
  for (const result of results) {
    const detail = result.status === 'drift'
      ? `${result.localSha256.slice(0, 12)} != ${result.remoteSha256.slice(0, 12)}`
      : result.status === 'missing'
        ? 'missing from live server'
        : result.status === 'served'
          ? `HTTP ${result.httpStatus} body ${result.remoteBodySha256.slice(0, 12)}`
          : result.status === 'error'
            ? result.error
            : result.localSha256 ? result.localSha256.slice(0, 12) : '';
    console.log(`${result.status.toUpperCase().padEnd(12)} ${result.name} ${detail || ''}`);
  }
}

async function main() {
  const base = baseUrl();
  const local = localFiles();
  if (!local.length) {
    throw new Error(`No PHP files found under ${path.relative(root, hubredirectDir)}.`);
  }

  let mode = 'probe';
  let probe = null;
  let results = [];
  const requireProbe = hasArg('--probe-only')
    || isTruthy(process.env.EDUPLATFORM_HUBREDIRECT_DRIFT_REQUIRE_PROBE)
    || Boolean(process.env.EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN || argValue('--token'));
  if (!hasArg('--direct')) {
    try {
      probe = await readProbe(base);
      results = compareProbe(local, probe.files);
    } catch (error) {
      if (requireProbe) {
        throw error;
      }
      console.warn(`WARN probe checksum mode unavailable: ${error instanceof Error ? error.message : String(error)}`);
      console.warn('WARN falling back to direct URL presence checks; exact source checksum comparison requires a JSON checksum probe response.');
      mode = 'direct';
      results = await directPresenceCheck(base, local);
    }
  } else {
    mode = 'direct';
    results = await directPresenceCheck(base, local);
  }

  const summary = summarize(results);
  const report = {
    mode,
    baseUrl: base,
    probeUrl: probe ? probe.url : undefined,
    generatedAt: new Date().toISOString(),
    summary,
    results,
  };

  if (hasArg('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`EduPlatform hubredirect deployment drift verifier (${mode})`);
    console.log(`Base URL: ${base}`);
    if (probe) {
      console.log(`Probe URL: ${probe.url}`);
    }
    console.log(`Summary: ${JSON.stringify(summary)}`);
    printTable(results);
  }

  const failingStatuses = mode === 'probe'
    ? new Set(['missing', 'drift'])
    : new Set(['missing', 'error']);
  if (results.some((result) => failingStatuses.has(result.status))) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
