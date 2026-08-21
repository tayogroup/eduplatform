<?php
// Behavioural gate for `attempted` — the written-answer counts Global
// Perspectives sends on progress.summary (docs/progress-event-contract.md).
//
// Why a gate at all. GP's 315 assessment questions are self-marked free text,
// so the course has no score to report; `attempted` is what it sends instead.
// The one thing that must never happen is this turning into a grade — a count
// that reaches checkpoint.result becomes a coloured percentage in the family
// portal and a row in the gradebook, reporting mastery nobody measured. That is
// a property of the reducer, not of any file's shape, so only behaviour can
// check it.
//
// It loads the REAL externallib_progress.php and calls its real private statics
// by reflection. A copy of the logic here would pass while the shipped code was
// broken, which is the failure mode this repo has been bitten by before.
//
// MUTATION-TESTED. Each invariant was broken in turn and this had to fail. One
// mutation SURVIVED the first version — removing the sanitise_attempted() call
// from apply_event() entirely — because every apply_event case fed an already
// clean payload, so the sanitiser and the event path were tested separately and
// never as connected. The hostile-input-through-the-event-path case below is
// the assertion that closes it. Assert on what is STORED, not on what a helper
// returns in isolation.
//
//   npm run check:progress-attempted
//   php tools/check-progress-attempted.php

// --- Moodle stand-ins ------------------------------------------------------
// Just enough for externallib_progress.php to LOAD. The external_* classes are
// referenced only inside *_parameters()/_returns() bodies, which are never
// invoked here, so empty declarations are sufficient and honest.
class external_api {}
class external_function_parameters {}
class external_single_structure {}
class external_multiple_structure {}
class external_value {}

define('MOODLE_INTERNAL', true);

$target = __DIR__ . '/../src/moodle/local_prequran/externallib_progress.php';
if (!file_exists($target)) {
    fwrite(STDERR, "✗ cannot find externallib_progress.php at $target\n");
    exit(2);
}

// externallib_progress.php opens with require_once($CFG->libdir.'/externallib.php').
// The classes it needs are already declared above, so libdir only has to hold a
// file that exists — an empty one satisfies the require without shadowing them.
$libdir = sys_get_temp_dir() . '/ehel-progress-gate-libdir';
if (!is_dir($libdir)) {
    mkdir($libdir, 0777, true);
}
file_put_contents($libdir . '/externallib.php', "<?php\n// stub: the gate declares the external_* classes itself\n");
$CFG = new stdClass();
$CFG->libdir = $libdir;
require($target);

// --- harness ---------------------------------------------------------------
$class = new ReflectionClass('local_prequran_progress_external');
$call = function (string $method, array $args) use ($class) {
    $m = $class->getMethod($method);
    $m->setAccessible(true);
    return $m->invokeArgs(null, $args);
};
$applyEvent = $class->getMethod('apply_event');
$applyEvent->setAccessible(true);
$emptyState = function () use ($call) { return $call('empty_unit_state', []); };
$apply = function (array $state, array $ev) use ($applyEvent) {
    $result = $applyEvent->invokeArgs(null, [&$state, $ev]);
    return [$state, $result];
};

$pass = 0;
$fail = 0;
function check(string $name, $got, $want): void {
    global $pass, $fail;
    $g = json_encode($got);
    $w = json_encode($want);
    if ($g === $w) {
        $pass++;
        printf("  ok   %s\n", $name);
    } else {
        $fail++;
        printf("  FAIL %s\n         got  %s\n         want %s\n", $name, $g, $w);
    }
}

echo "sanitise_attempted — a client is not trusted to bound its own payload\n";
check('normal map survives',
    $call('sanitise_attempted', [['quiz' => ['answered' => 3, 'total' => 12]]]),
    ['quiz' => ['answered' => 3, 'total' => 12]]);
check('zero answered is kept (the empty-button-press case this exists for)',
    $call('sanitise_attempted', [['quiz' => ['answered' => 0, 'total' => 12]]]),
    ['quiz' => ['answered' => 0, 'total' => 12]]);
check('answered clamped to total',
    $call('sanitise_attempted', [['quiz' => ['answered' => 99, 'total' => 12]]]),
    ['quiz' => ['answered' => 12, 'total' => 12]]);
check('negative answered floors at 0',
    $call('sanitise_attempted', [['quiz' => ['answered' => -5, 'total' => 12]]]),
    ['quiz' => ['answered' => 0, 'total' => 12]]);
check('a section claiming no questions is dropped',
    $call('sanitise_attempted', [['quiz' => ['answered' => 0, 'total' => 0]]]), []);
check('string numerals cast',
    $call('sanitise_attempted', [['quiz' => ['answered' => '4', 'total' => '12']]]),
    ['quiz' => ['answered' => 4, 'total' => 12]]);
check('hostile section name rejected',
    $call('sanitise_attempted', [['<script>' => ['answered' => 1, 'total' => 2]]]), []);
check('over-long section name rejected',
    $call('sanitise_attempted', [[str_repeat('a', 41) => ['answered' => 1, 'total' => 2]]]), []);
check('non-array payload rejected', $call('sanitise_attempted', ['nope']), []);
check('non-array counts rejected', $call('sanitise_attempted', [['quiz' => 7]]), []);
$big = [];
for ($i = 0; $i < 40; $i++) {
    $big["s$i"] = ['answered' => 1, 'total' => 2];
}
check('map capped at MAX_ATTEMPTED_SECTIONS',
    count($call('sanitise_attempted', [$big])),
    local_prequran_progress_external::MAX_ATTEMPTED_SECTIONS);
check('unknown nested keys do not survive',
    $call('sanitise_attempted', [['quiz' => ['answered' => 1, 'total' => 2, 'evil' => ['a']]]]),
    ['quiz' => ['answered' => 1, 'total' => 2]]);

echo "\nempty_unit_state\n";
$empty = $emptyState();
check('attempted present', array_key_exists('attempted', $empty), true);
check('encodes as {} not [] on an untouched unit', json_encode($empty['attempted']), '{}');

echo "\napply_event(progress.summary)\n";
[$s1, $r1] = $apply($emptyState(), [
    'type' => 'progress.summary', 'at' => '2026-08-21T10:00:00Z',
    'sectionsDone' => ['quiz'], 'attempted' => ['quiz' => ['answered' => 3, 'total' => 12]],
]);
check('stored', $s1['attempted'], ['quiz' => ['answered' => 3, 'total' => 12]]);
check('classed as state, not durable', $r1, [true, false]);

[$s2, ] = $apply($s1, [
    'type' => 'progress.summary', 'at' => '2026-08-21T11:00:00Z',
    'attempted' => ['quiz' => ['answered' => 9, 'total' => 12]],
]);
check('later summary overwrites (whole-map last-write-wins)',
    $s2['attempted'], ['quiz' => ['answered' => 9, 'total' => 12]]);

[$s3, ] = $apply($s2, [
    'type' => 'progress.summary', 'at' => '2026-08-21T09:00:00Z',
    'attempted' => ['quiz' => ['answered' => 1, 'total' => 12]],
]);
check('an OLDER summary cannot drag it backwards',
    $s3['attempted'], ['quiz' => ['answered' => 9, 'total' => 12]]);

[$s4, ] = $apply($s2, ['type' => 'progress.summary', 'at' => '2026-08-21T12:00:00Z', 'xp' => 5]);
check('a summary carrying no attempted leaves it alone',
    $s4['attempted'], ['quiz' => ['answered' => 9, 'total' => 12]]);

// Hostile input THROUGH THE EVENT PATH. Without this, deleting the
// sanitise_attempted() call from apply_event() is invisible — see the mutation
// note at the top.
[$s5, ] = $apply($emptyState(), [
    'type' => 'progress.summary', 'at' => '2026-08-21T10:00:00Z',
    'attempted' => [
        'quiz' => ['answered' => 999, 'total' => 12],
        '<script>alert(1)</script>' => ['answered' => 1, 'total' => 2],
        'empty' => ['answered' => 0, 'total' => 0],
    ],
]);
check('the event path sanitises: clamped, hostile key dropped, empty dropped',
    $s5['attempted'], ['quiz' => ['answered' => 12, 'total' => 12]]);
[$s6, ] = $apply($emptyState(), [
    'type' => 'progress.summary', 'at' => '2026-08-21T10:00:00Z', 'attempted' => 'not-a-map',
]);
check('the event path rejects a non-map outright', json_encode($s6['attempted']), '{}');

echo "\nit must never become a grade\n";
check('no score field invented', array_key_exists('score', $s1), false);
check('no checkpoint created', count((array)$s1['checkpoints']), 0);

echo "\npublic_state\n";
$pub = $call('public_state', [$s1]);
check('attempted reaches the client', $pub['attempted'], ['quiz' => ['answered' => 3, 'total' => 12]]);
check('internal bookkeeping still stripped',
    array_key_exists('_lastAt', $pub) || array_key_exists('_appliedIds', $pub), false);

printf("\n%d passed, %d failed\n", $pass, $fail);
if ($fail > 0) {
    fwrite(STDERR, "✗ the attempted contract is broken — see the failures above.\n");
    exit(1);
}
echo "✓ attempted: sanitised, last-write-wins, and structurally incapable of becoming a grade.\n";
exit(0);
