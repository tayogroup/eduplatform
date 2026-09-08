<?php
/**
 * What the FAMILY PORTAL is allowed to say about a child's participation.
 *
 * pqpr_attempts_from_state() turns the `attempted` map into rows a parent
 * reads. Until 2026-09-08 it returned every row and labelled it through
 * pqpr_section_label(), which falls through to ucfirst() for anything it does
 * not know — so the day a second app started reporting, a parent's portal read
 *
 *     Written answers
 *       3 / 7     Unit 1 · Step 08   answered
 *       5 / 122   Unit 1 · Step 03   answered
 *
 * Books read are not written answers, `Step 08` is a route id, and the last
 * pair is a video measured in seconds. The rule now is: a row is shown only
 * where it can be NAMED — the app's own caption, or a section id that is
 * already a name — and anything else is dropped rather than guessed at.
 *
 * The functions are pure, so this runs the SHIPPED BYTES: progress_rolluplib
 * is behind MOODLE_INTERNAL and cannot be included, so they are extracted by
 * brace-counting. Exit 2 when extraction fails, because a gate that cannot
 * read its target and passes is green about nothing.
 */
$lib = __DIR__ . '/../src/moodle/local_hubredirect/progress_rolluplib.php';
$src = @file_get_contents($lib);
if ($src === false) {
    fwrite(STDERR, "cannot read $lib\n");
    exit(2);
}

function grab(string $src, string $needle, string $what): string {
    $at = strpos($src, $needle);
    if ($at === false) {
        fwrite(STDERR, "cannot find $what\n");
        exit(2);
    }
    $open = strpos($src, '{', $at);
    $depth = 0;
    for ($i = $open, $n = strlen($src); $i < $n; $i++) {
        if ($src[$i] === '{') {
            $depth++;
        } elseif ($src[$i] === '}') {
            $depth--;
            if ($depth === 0) {
                return substr($src, $at, $i - $at + 1);
            }
        }
    }
    fwrite(STDERR, "unbalanced braces in $what\n");
    exit(2);
}

// The named-section list is the gate's other target: a route id must never be
// added to it, and losing it entirely would let every row through.
if (!preg_match('/const\s+PQPR_NAMED_ATTEMPT_SECTIONS\s*=\s*\[[^\]]*\];/', $src, $m)) {
    fwrite(STDERR, "cannot find PQPR_NAMED_ATTEMPT_SECTIONS\n");
    exit(2);
}
eval($m[0]);
eval(grab($src, 'function pqpr_unit_label(', 'pqpr_unit_label'));
eval(grab($src, 'function pqpr_section_label(', 'pqpr_section_label'));
eval(grab($src, 'function pqpr_attempts_from_state(', 'pqpr_attempts_from_state'));
eval(grab($src, 'function pqpr_week_counts_from_state(', 'pqpr_week_counts_from_state'));

$pass = 0;
$fail = 0;
function check(string $what, $got, $want) {
    global $pass, $fail;
    if ($got === $want) {
        $pass++;
        echo "  ok   $what\n";
        return;
    }
    $fail++;
    echo "  FAIL $what\n       got  " . json_encode($got) . "\n       want " . json_encode($want) . "\n";
}
function rows(array $attempted): array {
    return pqpr_attempts_from_state(['attempted' => $attempted], 'u01', 1000);
}

echo "a row a parent reads is NAMED, or it is not sent\n";

// The defect, in one assertion.
check('a route id with no caption is dropped',
    rows(['step-08' => ['answered' => 3, 'total' => 7]]), []);

$named = rows(['step-08' => ['answered' => 3, 'total' => 7,
    'label' => 'Reading books', 'noun' => 'books']]);
check('the app\'s own caption is used', $named[0]['label'], 'Unit 1 · Reading books');
check('  and the noun rides with it', $named[0]['noun'], 'books');
// "answered" is true of a written answer and false of a book read.
check('  and the verb is not "answered"', $named[0]['verb'], 'done');

// Global Perspectives keeps working: its ids ARE names, and its rows really
// are answers. This is the case the original heading was written for.
$gp = rows(['reflect' => ['answered' => 4, 'total' => 6]]);
check('a named section still needs no caption', $gp[0]['label'], 'Unit 1 · Reflection');
check('  and it is the one thing that says "answered"', $gp[0]['verb'], 'answered');

// The rule is about being NAMEABLE, not about which app sent it: a caption on
// a named section wins, because it is closer to the learner's screen.
$both = rows(['quiz' => ['answered' => 1, 'total' => 2, 'label' => 'Show what you know']]);
check('a caption beats the built-in name', $both[0]['label'], 'Unit 1 · Show what you know');

check('a zero total is dropped, caption or not',
    rows(['step-08' => ['answered' => 0, 'total' => 0, 'label' => 'Reading books']]), []);
check('answered is clamped to total',
    rows(['step-08' => ['answered' => 99, 'total' => 7, 'label' => 'Reading books']])[0]['answered'], 7);
check('a blank caption does not qualify a route id',
    rows(['step-08' => ['answered' => 3, 'total' => 7, 'label' => '   ']]), []);
check('no attempted map at all', pqpr_attempts_from_state([], 'u01', 1000), []);

// A route id must never be added to the named list — that is the whole defect
// coming back through the other door.
$bad = array_filter(PQPR_NAMED_ATTEMPT_SECTIONS, function ($s) {
    return (bool)preg_match('/^step-\d+$/', (string)$s);
});
check('no route id has been added to the named list', $bad, []);

// ---- what a family is told about THIS WEEK ---------------------------
// Four different claims, and the count ALONE can only make one of them. The
// group board learned this the expensive way: a zero rendered as "nothing this
// cycle" is a confident statement about a window nobody measured.
//
//   N finished this week          counted, and the week was covered
//   at least N finished this week the ring began mid-week, so a FLOOR
//   nothing yet this week         counted, covered, and genuinely none
//   not counted yet               no ring at all - say nothing about it
echo "\nthe week says which claim it is making\n";
function week(array $state): array {
    return pqpr_week_counts_from_state($state, 1000000);   // any Monday
}

// The case that matters most: entries exist, but nothing recorded WHEN
// counting began, so the count is not a measurement of the week.
check('no ring at all is NOT a zero',
    week(['_activity' => [[1000500, 's', 'step-04']]]),
    ['sections' => 0, 'checkpoints' => 0, 'has_ring' => false, 'covered' => false]);

check('a ring that predates the week is covered',
    week(['_activitySince' => 900000, '_activity' => [
        [1000500, 's', 'step-04'], [1000600, 'c', 'step-11'], [1000700, 's', 'step-05']]]),
    ['sections' => 2, 'checkpoints' => 1, 'has_ring' => true, 'covered' => true]);

check('a ring that began mid-week is a FLOOR',
    week(['_activitySince' => 1000400, '_activity' => [[1000500, 's', 'step-04']]])['covered'],
    false);

check('entries from before the week are not counted',
    week(['_activitySince' => 900000, '_activity' => [
        [999999, 's', 'old'], [1000001, 's', 'new']]])['sections'], 1);

// Measured and genuinely nothing - the one case where a zero may be printed.
check('an empty week is measured, not unknown',
    week(['_activitySince' => 900000, '_activity' => []]),
    ['sections' => 0, 'checkpoints' => 0, 'has_ring' => true, 'covered' => true]);

// Conflating them would let one quiz read as a finished section at a family.
check('checkpoints are counted apart from sections',
    week(['_activitySince' => 900000, '_activity' => [
        [1000500, 'c', 'a'], [1000600, 'c', 'b']]]),
    ['sections' => 0, 'checkpoints' => 2, 'has_ring' => true, 'covered' => true]);

check('a malformed entry is skipped, not fatal',
    week(['_activitySince' => 900000,
        '_activity' => ['nonsense', [1000500], [1000600, 's', 'ok']]])['sections'], 1);

echo "\n$pass passed, $fail failed\n";
if ($fail) {
    echo "a family portal would print something a parent cannot read.\n";
    exit(1);
}
echo "participation reaches a parent named, or not at all.\n";
