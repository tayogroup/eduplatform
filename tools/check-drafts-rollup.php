<?php
/**
 * pqpr_drafts_from_state(), exercised on the SHIPPED bytes.
 *
 * progress_rolluplib.php sits behind MOODLE_INTERNAL and requires accesslib, so
 * this extracts the three functions it needs by brace counting and runs THOSE.
 * A retyped copy of the logic would pass while the deployed file was broken —
 * the same reason check-ehel-app-url-override.php extracts rather than includes.
 *
 * Run: php tools/check-drafts-rollup.php
 */

$src = file_get_contents(__DIR__ . '/../src/moodle/local_hubredirect/progress_rolluplib.php');
if ($src === false) {
    fwrite(STDERR, "cannot read progress_rolluplib.php\n");
    exit(2);
}

function extract_fn(string $src, string $name): string {
    $at = strpos($src, 'function ' . $name . '(');
    if ($at === false) {
        fwrite(STDERR, "extract failed: {$name}() not found — the gate cannot read its target\n");
        exit(2);
    }
    $open = strpos($src, '{', $at);
    $depth = 0;
    for ($i = $open; $i < strlen($src); $i++) {
        if ($src[$i] === '{') { $depth++; }
        elseif ($src[$i] === '}') { $depth--; if ($depth === 0) { return substr($src, $at, $i - $at + 1); } }
    }
    fwrite(STDERR, "extract failed: {$name}() has unbalanced braces\n");
    exit(2);
}

// the cap the function clamps to, read from the file rather than retyped
if (!preg_match('/const PQPR_DRAFT_MAX_CHARS = (\d+);/', $src, $m)) {
    fwrite(STDERR, "extract failed: PQPR_DRAFT_MAX_CHARS not found\n");
    exit(2);
}
define('PQPR_DRAFT_MAX_CHARS', (int)$m[1]);

eval(extract_fn($src, 'pqpr_unit_label'));
eval(extract_fn($src, 'pqpr_section_label'));
eval(extract_fn($src, 'pqpr_drafts_from_state'));

$fails = 0;
function ok(string $label, bool $cond, $detail = null) {
    global $fails;
    if ($cond) { echo "  ok   {$label}\n"; return; }
    $fails++;
    echo "  FAIL {$label}" . ($detail === null ? '' : '  -> ' . var_export($detail, true)) . "\n";
}

echo "A draft a learner actually wrote:\n";
$rows = pqpr_drafts_from_state(['drafts' => [
    'writing:letter' => ['text' => 'Dear Amina, I went to the market.', 'words' => 7, 'at' => '2026-09-17T09:00:00Z'],
]], 'u03', 1700000000);
ok('one row', count($rows) === 1, count($rows));
ok('the words are carried through', ($rows[0]['text'] ?? '') === 'Dear Amina, I went to the market.', $rows[0]['text'] ?? null);
ok('the word count is the client\'s', ($rows[0]['words'] ?? 0) === 7, $rows[0]['words'] ?? null);
ok('not truncated', ($rows[0]['truncated'] ?? true) === false);
ok('the save time is kept', ($rows[0]['written_at'] ?? '') === '2026-09-17T09:00:00Z');

echo "\nNothing that looks like a mark — the rule this row set must keep:\n";
foreach (['score', 'passed', 'grade', 'correct', 'percent'] as $k) {
    ok("no '{$k}' key", !array_key_exists($k, $rows[0]));
}

echo "\nAn empty box is not a draft:\n";
ok('empty string skipped', pqpr_drafts_from_state(['drafts' => ['a' => ['text' => '']]], 'u01', 0) === []);
ok('whitespace skipped', pqpr_drafts_from_state(['drafts' => ['a' => ['text' => "   \n\t "]]], 'u01', 0) === []);
ok('no drafts key at all', pqpr_drafts_from_state([], 'u01', 0) === []);
ok('a non-scalar text is skipped, not rendered',
    pqpr_drafts_from_state(['drafts' => ['a' => ['text' => ['x']]]], 'u01', 0) === []);

echo "\nA textarea's newlines and control characters are flattened:\n";
$r = pqpr_drafts_from_state(['drafts' => ['a' => ['text' => "line one\nline two\r\n\tand three\x00"]]], 'u01', 0);
ok('collapsed to one line', ($r[0]['text'] ?? '') === 'line one line two and three', $r[0]['text'] ?? null);
// INTERIOR, not trailing: PHP trim() strips \0 for free (default charlist
// " \t\n\r\0\x0B"), so a control character at the END passed this even with
// the strip deleted. The mutation run found that, and it was the test that
// was weak rather than the code. This one is in the middle.
$r = pqpr_drafts_from_state(['drafts' => ['a' => ['text' => "one\x00two\x07three"]]], 'u01', 0);
ok('an interior control character is removed', ($r[0]['text'] ?? '') === 'one two three', $r[0]['text'] ?? null);

echo "\nLong writing is clamped — the ingest does NOT clamp it:\n";
$long = str_repeat('word ', 400);                       // 2000 chars
$r = pqpr_drafts_from_state(['drafts' => ['a' => ['text' => $long]]], 'u01', 0);
$len = function_exists('mb_strlen') ? mb_strlen($r[0]['text']) : strlen($r[0]['text']);
ok('clamped to the cap', $len === PQPR_DRAFT_MAX_CHARS, $len);
ok('and says it was', ($r[0]['truncated'] ?? false) === true);
ok('the word count is of the WHOLE draft, not the clamp',
    ($r[0]['words'] ?? 0) === 400, $r[0]['words'] ?? null);
// THE BOUNDARY, not just the far side of it. "a 2000-char draft comes back
// at the cap" is equally true of a clamp that truncates everything, so a
// draft just under the cap has to come back whole and unflagged.
$just = str_repeat('a', PQPR_DRAFT_MAX_CHARS - 1);
$r = pqpr_drafts_from_state(['drafts' => ['a' => ['text' => $just]]], 'u01', 0);
ok('a draft just under the cap is untouched', ($r[0]['text'] ?? '') === $just);
ok('and is not flagged truncated', ($r[0]['truncated'] ?? true) === false);

echo "\nA row written before the client sent a word count:\n";
$r = pqpr_drafts_from_state(['drafts' => ['a' => ['text' => 'one two three']]], 'u01', 0);
ok('counted from the text', ($r[0]['words'] ?? 0) === 3, $r[0]['words'] ?? null);

echo "\nEvery section is labelled for a human:\n";
$r = pqpr_drafts_from_state(['drafts' => [
    'writing:letter' => ['text' => 'a'], 'reflect' => ['text' => 'b'],
]], 'u02', 0);
ok('two rows', count($r) === 2, count($r));
foreach ($r as $row) {
    ok("label is not bare '{$row['section']}'", $row['label'] !== $row['section'], $row['label']);
    ok("label mentions the unit", strpos($row['label'], pqpr_unit_label('u02')) === 0, $row['label']);
}

echo "\n" . ($fails ? "{$fails} FAILURE(S)\n" : "all checks passed\n");
exit($fails ? 1 : 0);
