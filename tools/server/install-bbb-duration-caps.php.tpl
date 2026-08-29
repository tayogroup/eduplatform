<?php
// Installs the BBB live-class duration caps (repo commit 0133895c3) onto the
// K-12 Moodle: 19 files across local/hubredirect and local/prequran. Policy
// (owner, 2026-08-29): a live class is at most 90 minutes for everyone;
// administrators may overwrite up to 240 minutes; every BBB room keeps its
// 30-minute grace, so the ceiling clamped in local_prequran_bbb_meeting_defaults
// is 270 minutes (4.5 hours).
//
// KEEPER — the durable copy lives in the repo at tools/server/ (as a .tpl the
// build script tools/build-bbb-duration-installer.mjs fills with the payload;
// the staged copy is self-contained). Runs on the K-12 Moodle server: stage on
// the Bunny zone under "Ehel Primary/qa/", curl it into the DOCROOT, run it
// there. Every REVISION staged to the CDN needs a FRESH filename — the edge
// caches the old bytes at the old path (the repo's same-path-new-bytes lesson).
//
// What it does, in order — and it stops at the first failure, restoring
// anything it already wrote:
//   1. Proves it is on the RIGHT INSTALL by the ehel-k12 consumer row in the
//      database (never wwwroot — CLI resolves it host-dependently here).
//   2. Verifies EVERY payload's sha1 before touching a single file.
//   3. Backs up each live file beside itself as .bak-<stamp>, writes the new
//      bytes (accesslib.php FIRST, so the pqh_live_duration_* helpers exist
//      before any caller lands), and verifies each landed byte-for-byte.
//   4. Verifies a MARKER in every file (the change is present, not merely a
//      file of the right size), then lints each with php -l; any failure
//      restores every backup and exits non-zero.
// It deletes nothing. Afterwards: delete this script from the docroot and
// from qa/ on the zone; leave the .bak files. Then reset the web opcache
// (design_version.php?reset=1) — this CLI run cannot reach it.
define('CLI_SCRIPT', true);
require(__DIR__ . '/config.php');

function qa_fail(string $message): void {
    fwrite(STDERR, "FAIL: " . $message . "\n");
    exit(1);
}

// --- 1. the right install, by database ---------------------------------------
global $DB, $CFG;
try {
    $consumer = $DB->get_record('local_prequran_consumer', ['slug' => 'ehel-k12']);
} catch (Throwable $e) {
    qa_fail("cannot read local_prequran_consumer — wrong install or wrong directory: " . $e->getMessage());
}
if (!$consumer) {
    qa_fail("no ehel-k12 consumer row — this is not the K-12 install. Do not proceed.");
}
echo "install check: ehel-k12 consumer id {$consumer->id} — right database\n";

foreach (['local/hubredirect', 'local/prequran/portal_handlers'] as $dir) {
    if (!is_dir(__DIR__ . '/' . $dir)) {
        qa_fail(__DIR__ . "/$dir does not exist — run this from the DOCROOT, not your home directory");
    }
}

// --- payload (filled by tools/build-bbb-duration-installer.mjs) ---------------
// Ordered map: docroot-relative path => ['sha1' => …, 'b64' => …, 'marker' => …].
// accesslib.php is deliberately FIRST.
$files = json_decode(base64_decode('{{MANIFEST_B64}}'), true);
if (!is_array($files) || count($files) < 19) {
    qa_fail("payload manifest did not decode — re-stage the installer");
}

// --- 2. every payload proves itself before anything is touched ----------------
$decoded = [];
foreach ($files as $rel => $spec) {
    $bytes = base64_decode($spec['b64'], true);
    if ($bytes === false || sha1($bytes) !== $spec['sha1']) {
        qa_fail("$rel payload is corrupt (sha1 mismatch before write) — re-stage the installer");
    }
    if (strpos($bytes, $spec['marker']) === false) {
        qa_fail("$rel payload does not carry its marker '{$spec['marker']}' — wrong build");
    }
    if (!file_exists(__DIR__ . '/' . $rel)) {
        qa_fail(__DIR__ . "/$rel is missing on this install — the served tree differs from what this expects; stopping before any write");
    }
    $decoded[$rel] = $bytes;
}
echo "payload check: " . count($decoded) . " files, every sha1 and marker present\n";

// --- 3. backup, write, verify -------------------------------------------------
$stamp = date('Ymd-His');
$written = []; // path => backup path, for rollback
$rollback = function () use (&$written) {
    foreach ($written as $path => $backup) {
        if (@copy($backup, $path)) {
            echo "restored $path from $backup\n";
        } else {
            fwrite(STDERR, "COULD NOT RESTORE $path from $backup — do it by hand\n");
        }
    }
};

foreach ($decoded as $rel => $bytes) {
    $path = __DIR__ . '/' . $rel;
    $backup = "$path.bak-$stamp";
    if (!copy($path, $backup)) {
        $rollback();
        qa_fail("could not back up $path");
    }
    if (file_put_contents($path, $bytes) !== strlen($bytes)) {
        $written[$path] = $backup;
        $rollback();
        qa_fail("short write on $path");
    }
    $written[$path] = $backup;
    if (sha1((string)file_get_contents($path)) !== $files[$rel]['sha1']) {
        $rollback();
        qa_fail("$rel did not land byte-for-byte");
    }
    echo "wrote $rel (" . strlen($bytes) . " bytes)\n";
}

// --- 4. lint every written file ------------------------------------------------
foreach ($decoded as $rel => $bytes) {
    $lint = [];
    $code = 0;
    exec('php -l ' . escapeshellarg(__DIR__ . '/' . $rel) . ' 2>&1', $lint, $code);
    if ($code !== 0) {
        $rollback();
        qa_fail("php -l failed on $rel:\n" . implode("\n", $lint));
    }
}
echo "lint: all " . count($decoded) . " files parse\n";

echo "\nDONE. Live classes now cap at 90 minutes (administrators 240 + 30 grace = 4.5h room ceiling).\n";
echo "Backups: *.bak-$stamp beside each file. Delete THIS SCRIPT from the docroot now,\n";
echo "and its copy from qa/ on the storage zone. Then reset the web opcache:\n";
echo "open design_version.php with &reset=1 — a CLI run cannot clear the server's opcache.\n";
