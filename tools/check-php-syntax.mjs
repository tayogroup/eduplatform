// Syntax gate for the PHP this repo authors: every .php under src/ and tools/
// must open correctly and must parse.
//
// WHY THIS EXISTS
//
// src/moodle is the source of truth for the Moodle plugins, but nothing in the
// npm workflow ever parsed it — the JS gates cover JS, and PHP only got
// executed once it reached a server. sql_tools.php sat on main broken through
// several commits, and deploy/bbb-live-corrupted-q-files-rescue-20260624-v01.zip
// records the same class of damage being cleaned up once before that.
//
// The damage is always the same shape: a botched global replace turns every
// lowercase "p" into "q", so `<?php` becomes `<?qhq`. It is invisible in a diff
// review of a large file, which is what makes a mechanical check worth having.
//
// THREE CHECKS, AND WHY NONE OF THEM IS REDUNDANT
//
//  1. Opening tag — every file must begin with `<?php` (or a shebang).
//  2. Corruption markers — p->q damage anywhere in the body.
//  3. `php -l` — the real parser.
//
// Check 2 exists because the damage is not always whole-file. a2fd7041d was a
// PARTIAL corruption: some lines were mangled, others were not. A file can keep
// a valid `<?php` opening AND parse cleanly while still being broken, because
// the damage landed inside a string:
//
//     require_once(__DIR__ . "/config.qhq");   // lints clean, fatals at runtime
//
// Checks 1 and 3 both pass that. Only a content scan catches it.
//
// Check 1 exists because check 3 CANNOT be relied on to catch `<?qhq` alone.
// With short_open_tag=Off — the normal production setting — `<?qhq` is not a
// PHP tag at all, so the whole file is inline HTML, it lints perfectly clean,
// and PHP serves the source instead of running it. That is worse than a fatal:
// nothing executes, including require_login(), so the file's contents go to
// whoever asks for the URL. This gate only caught sql_tools.php because a
// winget PHP with no php.ini defaults short_open_tag to On.
//
// So check 2 pins `-d short_open_tag=1` (catching the corruption as a parse
// error wherever it can), and check 1 catches it regardless of any ini, with no
// PHP needed at all.
//
// deploy/ is deliberately NOT covered. It holds gitignored release bundles —
// snapshots of what shipped, including corrupted ones kept as evidence.
//
// Usage:
//   node tools/check-php-syntax.mjs            # gate: exits 1 on any failure
//   node tools/check-php-syntax.mjs --list     # list what would be checked
//   PHP_BINARY=/path/to/php node tools/...     # override binary discovery

import { execFile } from "node:child_process";
import { readdir, access, open } from "node:fs/promises";
import { constants } from "node:fs";
import { cpus } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOTS = ["src", "tools"];
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "deploy", ".claude"]);

const run = (bin, args) => new Promise((resolve) => {
  execFile(bin, args, { windowsHide: true }, (error, stdout, stderr) =>
    resolve({ ok: !error, out: `${stdout}${stderr}`.trim() }));
});

/**
 * Find a PHP CLI: an explicit override, then the PATH, then the winget install
 * location. The last one matters because a freshly winget-installed PHP updates
 * the persistent user PATH but NOT already-running shells, so a developer who
 * just installed it would otherwise be told it is missing.
 */
async function findPhp() {
  const candidates = [];
  if (process.env.PHP_BINARY) candidates.push(process.env.PHP_BINARY);
  candidates.push("php");
  const local = process.env.LOCALAPPDATA;
  if (local) {
    const pkgs = path.join(local, "Microsoft", "WinGet", "Packages");
    try {
      for (const entry of await readdir(pkgs, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name.startsWith("PHP.PHP.")) {
          candidates.push(path.join(pkgs, entry.name, "php.exe"));
        }
      }
    } catch { /* no winget packages dir — fine */ }
  }
  for (const bin of candidates) {
    const { ok, out } = await run(bin, ["-v"]);
    if (ok) return { bin, version: out.split("\n")[0] };
  }
  return null;
}

async function collect(dir, found = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await collect(path.join(dir, entry.name), found);
    } else if (entry.name.endsWith(".php")) {
      found.push(path.join(dir, entry.name));
    }
  }
  return found;
}

/**
 * Strings that cannot occur in correct PHP but DO occur when p->q damage lands
 * mid-file. Every one was verified zero-hit across all 610 files before being
 * added; a marker that fires on good code would train people to ignore this
 * gate, which is worse than not having it.
 *
 * Two words are deliberately ABSENT:
 *
 *   "qhq" on its own — dashboard.php legitimately contains $pqhq and
 *   $pqhplatquiet, both built from the pqh_ prefix. It would false-positive.
 *
 *   "exqort" — live_leadership.php and live_teacher_profile.php contain
 *   `optional_param('export', optional_param('exqort', ...))` ON PURPOSE. That
 *   is a compatibility shim from the June 2026 incident: corrupted pages went
 *   live and emitted ?exqort= links, so both spellings are still accepted.
 *   Flagging it would be flagging the fix, not the bug.
 */
const MARKERS = [
  "<?qhq", ".qhq", "strict_tyqes",
  "qublic ", "qrivate ", "qrotected ", "qarent::",
  "qreg_match", "qreg_replace", "imqlode", "exqlode", "array_maq",
  "strqos", "sqrintf", "oqtional_qaram",
  "httqs://", "httq://",
  // Corrupted CSS class names. The damage reaches markup and stylesheets, not
  // just code: accesslib.php carried 20 dead `.qqh-worksqace-*` selectors, each
  // sitting beside its correct `.pqh-workspace-*` twin, and a local Moodle
  // render is what surfaced them. `qqh-` is the general form (any corrupted
  // pqh- class); `worksqace` and `qqhst` are the two that actually occurred.
  "qqh-", "worksqace", "qqhst",
];

/** Checks 1 and 2, from a single read of the file. */
async function inspect(file) {
  const fh = await open(file, "r");
  let text;
  try {
    text = (await fh.readFile()).toString("latin1");
  } finally {
    await fh.close();
  }
  const problems = [];

  const head = text.slice(0, 5);
  if (head !== "<?php" && !text.startsWith("#!")) {
    problems.push(`does not begin with <?php (starts "${head.replace(/[\r\n]/g, "\\n")}")`
      + (head.startsWith("<?") ? " — looks like the p->q corruption" : ""));
  }

  for (const marker of MARKERS) {
    let at = text.indexOf(marker);
    while (at !== -1) {
      const line = text.slice(0, at).split("\n").length;
      problems.push(`line ${line}: ${JSON.stringify(marker)} — p->q corruption`);
      at = text.indexOf(marker, at + marker.length);
    }
  }
  return problems;
}

const files = [];
for (const r of ROOTS) {
  await access(path.join(ROOT, r), constants.R_OK).then(
    () => collect(path.join(ROOT, r), files), () => {});
}
files.sort();

if (process.argv.includes("--list")) {
  files.forEach((f) => console.log(path.relative(ROOT, f)));
  console.log(`${files.length} file(s)`);
  process.exit(0);
}

const failures = [];

// --- checks 1 + 2: opening tag and markers (instant, needs no PHP) ---------
for (const f of files) {
  for (const problem of await inspect(f)) {
    failures.push({ file: path.relative(ROOT, f), out: problem });
  }
}

// --- check 3: the real parser ----------------------------------------------
const php = await findPhp();
if (!php) {
  // A gate that passes because it did not run is worse than no gate: it would
  // report success over unparsed code. So this fails, loudly, with the fix.
  for (const { file, out } of failures) console.error(`FAIL  ${file}\n      ${out}`);
  console.error("\ncheck:php — no PHP CLI found, so nothing was parsed.\n");
  console.error("  Install one:     winget install --id PHP.PHP.8.4 --scope user");
  console.error("  Or point at one: PHP_BINARY=/path/to/php npm run check:php");
  console.error("\n  (winget's PHP.PHP.8.3 manifest currently 404s; 8.4 works.)");
  process.exit(1);
}

console.log(php.version);
console.log(`checking ${files.length} PHP file(s) under ${ROOTS.map((r) => r + "/").join(", ")}\n`);

const queue = files.slice();
const workers = Array.from({ length: Math.max(1, Math.min(12, cpus().length)) }, async () => {
  for (let f = queue.shift(); f !== undefined; f = queue.shift()) {
    // short_open_tag pinned ON deliberately — see the header. Without it the
    // `<?qhq` corruption lints clean and this gate is blind to the one bug it
    // was written for.
    const { ok, out } = await run(php.bin, ["-d", "short_open_tag=1", "-l", f]);
    if (!ok) failures.push({ file: path.relative(ROOT, f), out });
  }
});
await Promise.all(workers);

const seen = new Set();
for (const { file, out } of failures.sort((a, b) => a.file.localeCompare(b.file))) {
  const key = file + out;
  if (seen.has(key)) continue;
  seen.add(key);
  console.error(`FAIL  ${file}`);
  for (const line of out.split("\n")) {
    if (line.trim() && !/^No syntax errors/.test(line)) console.error(`      ${line.trim()}`);
  }
}

if (failures.length) {
  console.error(`\n${new Set(failures.map((f) => f.file)).size} of ${files.length} file(s) failed.`);
  process.exit(1);
}
console.log(`All ${files.length} PHP file(s) open correctly, carry no p->q markers, and parse.`);
