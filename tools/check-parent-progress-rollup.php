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

echo "\n$pass passed, $fail failed\n";
if ($fail) {
    echo "a family portal would print something a parent cannot read.\n";
    exit(1);
}
echo "participation reaches a parent named, or not at all.\n";
