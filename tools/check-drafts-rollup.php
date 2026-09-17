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
$ing = file_get_contents(__DIR__ . '/../src/moodle/local_prequran/externallib_progress.php');
if ($ing === false) {
    fwrite(STDERR, "cannot read externallib_progress.php\n");
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

// The INGEST clamp, run rather than grepped for. It is a private static method,
// so it is lifted out and rebound as a plain function with the same body; the
// constant it reads is taken from the same file rather than retyped here.
if (!preg_match('/const MAX_DRAFT_CHARS = (\d+);/', $ing, $mm)) {
    fwrite(STDERR, "extract failed: MAX_DRAFT_CHARS not found in the ingest\n");
    exit(2);
}
define('MAX_DRAFT_CHARS', (int)$mm[1]);
$clampsrc = extract_fn($ing, 'clamp_draft_text');
$clampsrc = str_replace(['private static function clamp_draft_text', 'self::MAX_DRAFT_CHARS'],
                        ['function clamp_draft_text', 'MAX_DRAFT_CHARS'], $clampsrc);
eval($clampsrc);

if (!preg_match('/const MAX_DRAFT_SECTIONS = (\d+);/', $ing, $ms)) {
    fwrite(STDERR, "extract failed: MAX_DRAFT_SECTIONS not found in the ingest\n");
    exit(2);
}
define('MAX_DRAFT_SECTIONS', (int)$ms[1]);
$capsrc = extract_fn($ing, 'cap_drafts');
$capsrc = str_replace(['private static function cap_drafts', 'self::MAX_DRAFT_SECTIONS'],
                      ['function cap_drafts', 'MAX_DRAFT_SECTIONS'], $capsrc);
eval($capsrc);

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

echo "\nThe INGEST clamp — a backstop on the stored row, not a word limit:\n";
// BOUNDED AT BOTH ENDS. Every other assertion here is relative to the cap
// read out of the file, so a cap raised to 100,000,000 passed all of them -
// found by mutation, and it is the same shape as a floor set below the true
// count: a backstop with no ceiling on its own value is not a backstop.
// Low enough to bound the row, high enough that no Stage 1-8 writing task
// reaches it (100,000 characters is roughly 16,000 words).
ok('the cap is generous enough to be a backstop', MAX_DRAFT_CHARS >= 10000, MAX_DRAFT_CHARS);
ok('and small enough to actually bound the row', MAX_DRAFT_CHARS <= 100000, MAX_DRAFT_CHARS);
[$t, $cut] = clamp_draft_text(str_repeat('a', MAX_DRAFT_CHARS - 1));
ok('a draft under the cap is untouched',
    $cut === false && (function_exists('mb_strlen') ? mb_strlen($t) : strlen($t)) === MAX_DRAFT_CHARS - 1);
[$t, $cut] = clamp_draft_text(str_repeat('a', MAX_DRAFT_CHARS + 500));
ok('an over-long draft is clamped',
    (function_exists('mb_strlen') ? mb_strlen($t) : strlen($t)) === MAX_DRAFT_CHARS);
ok('and the truncation is RECORDED, never silent', $cut === true);
[$t, $cut] = clamp_draft_text(["not", "a", "string"]);
ok('a non-scalar payload becomes empty rather than a crash', $t === '' && $cut === false);

// LENGTH ONLY. Stripping control characters here would flatten a learner's own
// paragraphs, and course-app.js hydrates this text back into their editor.
[$t, ] = clamp_draft_text("para one\n\npara two");
ok('newlines survive the ingest', $t === "para one\n\npara two", $t);

echo "\nA server-shortened draft is never shown as whole:\n";
$r = pqpr_drafts_from_state(['drafts' => [
    'a' => ['text' => 'short enough to fit the display clamp', 'truncated' => true],
]], 'u01', 0);
ok('the reader honours the stored flag', ($r[0]['truncated'] ?? false) === true);

echo "\nHow MANY drafts one unit may hold — bounded without losing live work:\n";
// Measured before it was chosen: the widest English unit authors 8 draft
// sections, median 6. Same both-ends rule as the character cap: a section cap
// of 5 would delete real writing, one of 100000 would bound nothing.
ok('the section cap clears the widest real unit', MAX_DRAFT_SECTIONS >= 16, MAX_DRAFT_SECTIONS);
ok('and still bounds the row', MAX_DRAFT_SECTIONS <= 200, MAX_DRAFT_SECTIONS);

$full = [];
for ($i = 0; $i < MAX_DRAFT_SECTIONS; $i++) {
    $full["s{$i}"] = ['text' => 'x', 'at' => sprintf('2026-01-%02dT00:00:00Z', ($i % 28) + 1)];
}
[$kept, $ev] = cap_drafts($full, 's0');
ok('a map exactly at the cap is untouched', $ev === 0 && count($kept) === MAX_DRAFT_SECTIONS, $ev);

// UPDATING an existing section must never evict, whatever the cap is.
$upd = $full; $upd['s3'] = ['text' => 'edited', 'at' => '2030-01-01T00:00:00Z'];
[$kept, $ev] = cap_drafts($upd, 's3');
ok('editing an existing draft never evicts', $ev === 0 && count($kept) === MAX_DRAFT_SECTIONS, $ev);

// A NEW section on a full map: the incoming survives, the OLDEST goes.
$over = $full;
$over['brand-new'] = ['text' => 'the writing being done right now', 'at' => '2030-06-01T00:00:00Z'];
[$kept, $ev] = cap_drafts($over, 'brand-new');
ok('one over the cap evicts exactly one', $ev === 1, $ev);
ok('the learner\'s incoming draft is never the one dropped', isset($kept['brand-new']));
// THE GUARD, ACTUALLY EXERCISED. Above, the incoming draft carries the newest
// timestamp, so it survives eviction whether or not the guard protecting it
// exists - mutation found the assertion above passed with that guard deleted.
// A client that sends no `at` sorts OLDEST, which is the only case where the
// guard is what saves the writing a child is doing right now.
$beingtyped = $full;
$beingtyped['being-typed'] = ['text' => 'the words the child is writing now'];
[$kept2, $ev2] = cap_drafts($beingtyped, 'being-typed');
ok('an untimestamped INCOMING draft is still never evicted',
    isset($kept2['being-typed']), array_keys($kept2));
ok('something else went instead', $ev2 === 1 && count($kept2) === MAX_DRAFT_SECTIONS, $ev2);
ok('the oldest is what goes', !isset($kept['s0']), array_keys($kept));
ok('and the map is back at the cap', count($kept) === MAX_DRAFT_SECTIONS, count($kept));

// An entry with no timestamp predates the stamp being sent, so it sorts oldest.
$noat = $full; unset($noat['s0']);
$noat['ancient'] = ['text' => 'no at field'];
$noat['brand-new'] = ['text' => 'now', 'at' => '2030-06-01T00:00:00Z'];
[$kept, $ev] = cap_drafts($noat, 'brand-new');
ok('an entry with no timestamp is evicted first', !isset($kept['ancient']), array_keys($kept));

echo "\n" . ($fails ? "{$fails} FAILURE(S)\n" : "all checks passed\n");
exit($fails ? 1 : 0);
