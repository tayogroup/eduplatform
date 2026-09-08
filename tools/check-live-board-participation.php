<?php
/**
 * The live group board's reading of the app's participation data.
 *
 * pqlgb_current_activity() and pqlgb_checkpoint_spread() decide what a teacher
 * is told about how far into an activity a learner is and how their scored
 * work sits together. Both are pure functions of the progress document, so
 * they can be exercised for real rather than matched as text - which is what
 * this does: the shipped bytes are extracted from live_group_boardlib.php by
 * brace-counting (the file is behind MOODLE_INTERNAL and cannot be included)
 * and the extracted source is what runs.
 *
 * Exits 2 when extraction fails. A gate that cannot read its target and passes
 * is green about nothing.
 */
$lib = __DIR__ . '/../src/moodle/local_hubredirect/live_group_boardlib.php';
$src = @file_get_contents($lib);
if ($src === false) {
    fwrite(STDERR, "cannot read $lib\n");
    exit(2);
}

/** Extract one function's full text by counting braces from its signature. */
function extract_fn(string $src, string $name): string {
    $at = strpos($src, "function $name(");
    if ($at === false) {
        fwrite(STDERR, "cannot find function $name\n");
        exit(2);
    }
    $open = strpos($src, '{', $at);
    if ($open === false) {
        fwrite(STDERR, "cannot find the body of $name\n");
        exit(2);
    }
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
    fwrite(STDERR, "unbalanced braces in $name\n");
    exit(2);
}

eval(extract_fn($src, 'pqlgb_current_activity'));
eval(extract_fn($src, 'pqlgb_checkpoint_spread'));

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

// ---- how far into the current activity -------------------------------
check('the section the learner is standing in',
    pqlgb_current_activity(['resume' => 'step-08',
        'attempted' => ['step-08' => ['answered' => 3, 'total' => 7]]]),
    ['answered' => 3, 'total' => 7]);

// The whole point of reading `resume` rather than "the first row": a learner
// mid-way through several sections must be reported on the one they are IN.
check('never another section that also reports participation',
    pqlgb_current_activity(['resume' => 'step-12',
        'attempted' => ['step-08' => ['answered' => 3, 'total' => 7],
                        'step-12' => ['answered' => 2, 'total' => 6]]]),
    ['answered' => 2, 'total' => 6]);

check('silent where this section reports none',
    pqlgb_current_activity(['resume' => 'step-11',
        'attempted' => ['step-08' => ['answered' => 3, 'total' => 7]]]),
    null);

check('silent with no resume pointer at all',
    pqlgb_current_activity(['attempted' => ['step-08' => ['answered' => 3, 'total' => 7]]]),
    null);

// A zero denominator is not "0 of 0" on a tile, it is nothing to say.
check('silent on a zero total',
    pqlgb_current_activity(['resume' => 'step-08',
        'attempted' => ['step-08' => ['answered' => 0, 'total' => 0]]]),
    null);

// Nothing on a teacher's screen may claim more was done than was asked.
check('answered is clamped to the total',
    pqlgb_current_activity(['resume' => 'step-08',
        'attempted' => ['step-08' => ['answered' => 99, 'total' => 7]]]),
    ['answered' => 7, 'total' => 7]);

check('a missing answered reads as none, not as an error',
    pqlgb_current_activity(['resume' => 'step-08',
        'attempted' => ['step-08' => ['total' => 7]]]),
    ['answered' => 0, 'total' => 7]);

check('an empty document says nothing', pqlgb_current_activity([]), null);

// ---- the spread behind the weakest score -----------------------------
check('counts every scored check and means them',
    pqlgb_checkpoint_spread(['checkpoints' => [
        'step-09' => ['score' => 100], 'step-11' => ['score' => 60],
        'step-14-choosing' => ['score' => 50]]]),
    [3, 70]);

// A checkpoint with no score is a section that reported something else; it is
// not a zero, and averaging it in would drag the mean down for free.
check('a scoreless checkpoint is not counted as zero',
    pqlgb_checkpoint_spread(['checkpoints' => [
        'step-09' => ['score' => 80], 'step-11' => ['score' => null],
        'games-word-hunt' => []]]),
    [1, 80]);

check('no checkpoints at all', pqlgb_checkpoint_spread(['checkpoints' => []]), [0, 0]);
check('no checkpoints key at all', pqlgb_checkpoint_spread([]), [0, 0]);
check('rounds to a whole percent',
    pqlgb_checkpoint_spread(['checkpoints' => [
        'a' => ['score' => 67], 'b' => ['score' => 68]]]),
    [2, 68]);

echo "\n$pass passed, $fail failed\n";
if ($fail) {
    echo "the board would tell a teacher something the document does not say.\n";
    exit(1);
}
echo "the board reads participation the way the app writes it.\n";
