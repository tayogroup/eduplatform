<?php
// Installs the Wehel tutoring-category framing correction (repo commit
// 89ad35891) onto the K-12 Moodle: wehel_chat.php + wehel_prompt.json in
// local/hubredirect/. The app half is already live as v276; until this runs,
// the learnerCategory field the app sends is ignored and the model keeps its
// unit framing for tutoring-support learners.
//
// KEEPER — the durable copy lives in the repo at tools/server/ (as a .tpl the
// build script fills with the payload; the staged copy is self-contained).
// Runs on the K-12 Moodle server: stage on the Bunny zone under
// "Ehel Primary/qa/", curl it into the DOCROOT, run it there. Every REVISION
// staged to the CDN needs a FRESH filename — the edge caches the old bytes at
// the old path (the repo's same-path-new-bytes lesson).
//
// What it does, in order — and it stops at the first failure, restoring
// anything it already wrote:
//   1. Proves it is on the RIGHT INSTALL by the ehel-k12 consumer row in the
//      database (never wwwroot — CLI resolves it host-dependently here).
//   2. Backs up both live files beside themselves as .bak-<stamp>.
//   3. Writes the new files, verifies each landed byte-for-byte (sha1), then
//      verifies the MARKERS: categoryNotes.tutoring parses out of the JSON,
//      and the PHP both reads learnerCategory and appends the note.
//   4. Lints the new wehel_chat.php with php -l; any failure restores both
//      backups and exits non-zero.
// It deletes nothing. Afterwards: delete this script from the docroot and
// from qa/ on the zone; leave the .bak files.
define('CLI_SCRIPT', true);
require(__DIR__ . '/config.php');

function qa_fail(string $message): void {
    fwrite(STDERR, "FAIL: " . $message . "\n");
    exit(1);
}

// --- 1. the right install, by database ---------------------------------------
global $DB, $CFG;
try {
    $consumer = $DB->get_record('local_prequran_consumer', ['shortname' => 'ehel-k12']);
} catch (Throwable $e) {
    qa_fail("cannot read local_prequran_consumer — wrong install or wrong directory: " . $e->getMessage());
}
if (!$consumer) {
    qa_fail("no ehel-k12 consumer row — this is not the K-12 install. Do not proceed.");
}
echo "install check: ehel-k12 consumer id {$consumer->id} — right database\n";

$dir = __DIR__ . '/local/hubredirect';
if (!is_dir($dir)) {
    qa_fail("$dir does not exist — run this from the DOCROOT, not your home directory");
}

// --- payload (filled by tools/build-wehel-framing-installer.mjs) --------------
$files = [
    'wehel_chat.php' => ['sha1' => '{{CHAT_SHA1}}', 'b64' => '{{CHAT_B64}}'],
    'wehel_prompt.json' => ['sha1' => '{{PROMPT_SHA1}}', 'b64' => '{{PROMPT_B64}}'],
];

// --- 2-3. backup, write, verify ----------------------------------------------
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

foreach ($files as $name => $spec) {
    $path = "$dir/$name";
    if (!file_exists($path)) {
        $rollback();
        qa_fail("$path is missing — this install does not carry Wehel; stopping");
    }
    $backup = "$path.bak-$stamp";
    if (!copy($path, $backup)) {
        $rollback();
        qa_fail("could not back up $path");
    }
    $bytes = base64_decode($spec['b64'], true);
    if ($bytes === false || sha1($bytes) !== $spec['sha1']) {
        $rollback();
        qa_fail("$name payload is corrupt (sha1 mismatch before write) — re-stage the installer");
    }
    if (file_put_contents($path, $bytes) !== strlen($bytes)) {
        $rollback();
        qa_fail("short write on $path");
    }
    $written[$path] = $backup;
    if (sha1((string)file_get_contents($path)) !== $spec['sha1']) {
        $rollback();
        qa_fail("$name did not land byte-for-byte");
    }
    echo "wrote $name (" . strlen($bytes) . " bytes, backup $backup)\n";
}

// --- markers: the change is present, not merely a file of the right size ------
$prompt = json_decode((string)file_get_contents("$dir/wehel_prompt.json"), true);
if (!is_array($prompt) || !isset($prompt['categoryNotes']['tutoring']) || !is_array($prompt['categoryNotes']['tutoring'])) {
    $rollback();
    qa_fail("categoryNotes.tutoring did not arrive in wehel_prompt.json");
}
$chat = (string)file_get_contents("$dir/wehel_chat.php");
if (strpos($chat, "learnerCategory") === false || strpos($chat, 'categorynote') === false) {
    $rollback();
    qa_fail("wehel_chat.php does not carry the learnerCategory read + categorynote append");
}
echo "markers: categoryNotes.tutoring present; wehel_chat.php reads and injects it\n";

// --- 4. lint the PHP -----------------------------------------------------------
$lint = [];
$code = 0;
exec('php -l ' . escapeshellarg("$dir/wehel_chat.php") . ' 2>&1', $lint, $code);
if ($code !== 0) {
    $rollback();
    qa_fail("php -l failed on the new wehel_chat.php:\n" . implode("\n", $lint));
}
echo "lint: " . trim(implode(' ', $lint)) . "\n";

echo "\nDONE. Wehel now reframes tutoring-support learners (\"this lesson\", never \"this unit\").\n";
echo "Backups: *.bak-$stamp beside each file. Delete THIS SCRIPT from the docroot now,\n";
echo "and its copy from qa/ on the storage zone.\n";
