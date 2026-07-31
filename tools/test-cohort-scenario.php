<?php
// Automated end-to-end scenario test for cross-timezone cohort matching:
// two shifts, two teachers, ten students. Exercises the REAL pqav_* pipeline
// (shift capping -> cohort proposal -> teacher ranking -> session generation)
// with no Moodle and no database, so it can run before anything is deployed.
//
//   php tools/test-cohort-scenario.php            (repo copy)
//   php tools/test-cohort-scenario.php /path/to/availabilitylib.php
//
// Exits 1 on any failed assertion.
declare(strict_types=1);

define('MOODLE_INTERNAL', 1);
$librarypath = $argv[1] ?? (__DIR__ . '/../src/moodle/local_hubredirect/availabilitylib.php');
if (!is_readable($librarypath)) {
    fwrite(STDERR, "Cannot read availabilitylib at: {$librarypath}\n");
    exit(1);
}
require $librarypath;

$failures = 0;
function check(string $name, bool $ok, string $detail = ''): void {
    global $failures;
    if ($ok) {
        echo "  ok   {$name}" . ($detail !== '' ? "  ({$detail})" : '') . "\n";
    } else {
        $failures++;
        echo "  FAIL {$name}" . ($detail !== '' ? " -- {$detail}" : '') . "\n";
    }
}
function heading(string $text): void {
    echo "\n== {$text} ==\n";
}

/** Weekly slots -> UTC intervals, exactly as an intake grid would produce. */
function grid(string $tz, int $fromhour, int $tohour, array $weekdays): array {
    $out = [];
    foreach ($weekdays as $d) {
        foreach (pqav_local_to_utc_intervals($d, $fromhour * 60, $tohour * 60, $tz) as $iv) {
            $out[] = $iv;
        }
    }
    return pqav_merge_intervals($out);
}

/**
 * Mirrors pqav_teacher_effective_intervals() without the DB: declared hours
 * intersected with the assigned shift window.
 */
function effective(array $declared, string $shift): array {
    $defs = pqav_shift_definitions();
    if ($shift === '' || !isset($defs[$shift])) {
        return $declared;
    }
    return pqav_intersect_intervals($declared, $defs[$shift]['windows']);
}
function hours(array $intervals): string {
    return round(pqav_total_minutes($intervals) / 60, 1) . 'h/wk';
}

$mon2fri = [0, 1, 2, 3, 4];
$sessions = 3;      // offering: 3 live sessions per week...
$minutes  = 60;     // ...of 60 minutes each.
$maxsize  = 8;

echo "SCENARIO: 2 shifts, 2 teachers, 10 students, offering = {$sessions} x {$minutes}min/week\n";

// ---------------------------------------------------------------- teachers
heading('Teachers: declared hours capped by shift');

// Teacher A: Nairobi, declares 10:00-20:00 local, Shift 1 (10:00-20:00 EAT).
$adeclared  = grid('Africa/Nairobi', 10, 20, $mon2fri);
$aeffective = effective($adeclared, 'shift1');

// Teacher B: Nairobi-based staff on the night shift, Shift 2 (20:00-06:00
// EAT) -- the Americas-facing window. NOTE the hours: to reach New York
// evenings (17:00-20:00 EDT = 21:00-00:00 UTC) a Nairobi teacher must work
// AFTER MIDNIGHT (00:00-03:00 EAT = 21:00-00:00 UTC the previous day).
// 20:00-24:00 EAT would be 17:00-21:00 UTC -- too early, zero overlap.
// Declared Tue-Sat because Tuesday 00:00 EAT is Monday evening in New York.
$bdeclared  = grid('Africa/Nairobi', 0, 3, [1, 2, 3, 4, 5]);
$beffective = effective($bdeclared, 'shift2');

check('Teacher A keeps full declared hours inside Shift 1',
    pqav_total_minutes($aeffective) === pqav_total_minutes($adeclared), hours($aeffective));
check('Teacher B keeps full declared hours inside Shift 2',
    pqav_total_minutes($beffective) === pqav_total_minutes($bdeclared), hours($beffective));

// A shift must never GRANT hours the teacher did not declare.
$overreach = effective(grid('Africa/Nairobi', 10, 12, $mon2fri), 'shift1');
check('shift never grants undeclared hours',
    pqav_total_minutes($overreach) === 10 * 60, hours($overreach));

// Cross-check: A's daytime hours must be excluded by Shift 2 and vice versa.
check('Shift 2 would erase Teacher A\'s daytime hours',
    pqav_total_minutes(effective($adeclared, 'shift2')) === 0);
check('Shift 1 would erase Teacher B\'s night hours',
    pqav_total_minutes(effective($bdeclared, 'shift1')) === 0);

$teachers = [101 => $aeffective, 202 => $beffective];   // real user ids, as in production

// ---------------------------------------------------------------- students
heading('Students: ten intake grids');

$students = [];
// 1-5: Nairobi families, after school 16:00-19:00 local.
for ($i = 1; $i <= 5; $i++) {
    $students[$i] = grid('Africa/Nairobi', 16, 19, $mon2fri);
}
// 6-9: New York families, after school 17:00-20:00 local.
for ($i = 6; $i <= 9; $i++) {
    $students[$i] = grid('America/New_York', 17, 20, $mon2fri);
}
// 10: admin created the student but never ticked the availability grid.
$students[10] = [];

check('ten students in the pool', count($students) === 10);
check('Nairobi and New York student windows never intersect',
    pqav_total_minutes(pqav_intersect_intervals($students[1], $students[6])) === 0);

// ------------------------------------------------------------ cohorting
heading('Cohort proposal');

$proposal = pqav_propose_cohorts($students, $sessions, $minutes, $maxsize);
$cohorts = $proposal['cohorts'];

check('splits into exactly two cohorts', count($cohorts) === 2, count($cohorts) . ' proposed');
$sizes = array_map(static fn(array $c): int => count($c['studentids']), $cohorts);
sort($sizes);
check('cohort sizes are 4 (NY) and 5 (Nairobi)', $sizes === [4, 5], implode(' / ', $sizes));

check('the student with no grid is reported unplaced',
    count($proposal['unplaced']) === 1 && (int)$proposal['unplaced'][0]['studentid'] === 10,
    $proposal['unplaced'][0]['reason'] ?? 'none');

// No student may appear in two cohorts, and none may be silently dropped.
$placed = [];
foreach ($cohorts as $c) {
    foreach ($c['studentids'] as $sid) {
        $placed[] = (int)$sid;
    }
}
check('no student placed twice', count($placed) === count(array_unique($placed)));
check('every student is either placed or explained',
    count($placed) + count($proposal['unplaced']) === 10, count($placed) . ' placed');

// Cohorts must not mix regions.
foreach ($cohorts as $index => $c) {
    $ids = array_map('intval', $c['studentids']);
    $nairobi = count(array_filter($ids, static fn(int $id): bool => $id <= 5));
    $newyork = count(array_filter($ids, static fn(int $id): bool => $id >= 6 && $id <= 9));
    check('cohort ' . ($index + 1) . ' is region-pure', $nairobi === 0 || $newyork === 0,
        "{$nairobi} Nairobi / {$newyork} New York");
    check('cohort ' . ($index + 1) . ' can host ' . $sessions . 'x' . $minutes . 'min',
        pqav_can_host_sessions($c['windows'], $sessions, $minutes)[0]);
}

// ------------------------------------------------------- teacher matching
heading('Teacher matching (shift-aware, load-balanced)');

$assigned = [];
$loadmap = [];
foreach ($cohorts as $index => $c) {
    $ranked = pqav_rank_teachers_for_cohort($c['windows'], $teachers, $sessions, $minutes, $loadmap);
    $top = $ranked[0] ?? null;
    $label = 'cohort ' . ($index + 1);
    check("{$label} gets a viable teacher", $top !== null && $top['viable'],
        $top ? 'teacher ' . $top['teacherid'] . ', overlap ' . round($top['minutes'] / 60, 1) . 'h' : 'none');
    if ($top && $top['viable']) {
        $assigned[(int)$top['teacherid']] = array_map('intval', $c['studentids']);
        // Simulate the load this assignment adds, so the next cohort ranks
        // against an updated picture.
        $loadmap[$top['teacherid']] = ($loadmap[$top['teacherid']] ?? 0) + ($sessions * $minutes);
    }
}
check('the two cohorts went to two DIFFERENT teachers', count($assigned) === 2,
    implode(' + ', array_keys($assigned)));
check('Teacher A (Shift 1) took the Nairobi cohort',
    isset($assigned[101]) && in_array(1, $assigned[101], true));
check('Teacher B (Shift 2) took the New York cohort',
    isset($assigned[202]) && in_array(6, $assigned[202], true));

// The wrong-shift teacher must be non-viable for the other cohort, not merely
// lower-ranked -- this is the check that proves shifts are enforced.
foreach ($cohorts as $c) {
    $isny = in_array(6, array_map('intval', $c['studentids']), true);
    $wrong = $isny ? [101 => $aeffective] : [202 => $beffective];
    $ranked = pqav_rank_teachers_for_cohort($c['windows'], $wrong, $sessions, $minutes);
    check('wrong-shift teacher is NOT viable for the ' . ($isny ? 'New York' : 'Nairobi') . ' cohort',
        !($ranked[0]['viable'] ?? false), $ranked[0]['reason'] ?? '');
}

// ---------------------------------------------------- session generation
heading('Session generation for the New York cohort');

$nycohort = null;
foreach ($cohorts as $c) {
    if (in_array(6, array_map('intval', $c['studentids']), true)) {
        $nycohort = $c;
    }
}
check('New York cohort located', $nycohort !== null);

if ($nycohort) {
    [$canhost, $slotstarts] = pqav_can_host_sessions($nycohort['windows'], $sessions, $minutes);
    check('three slots chosen on three distinct days', $canhost && count($slotstarts) === 3,
        implode(', ', array_map('pqav_interval_label', $slotstarts)));

    $days = array_map(static fn(array $iv): int => intdiv($iv[0], 1440), $slotstarts);
    check('slots really are on distinct days', count(array_unique($days)) === count($days));

    // Generate a term across the November 2026 US DST transition.
    $termstart = strtotime('2026-10-19 00:00:00 UTC');
    $all = [];
    foreach ($slotstarts as $slot) {
        foreach (pqav_generate_session_times($slot[0], $minutes, 'Africa/Nairobi', $termstart, 0, 4) as $t) {
            $all[] = $t;
        }
    }
    check('12 sessions generated (3/wk x 4 weeks)', count($all) === 12, count($all) . ' generated');

    $teacherlocal = [];
    $studentlocal = [];
    foreach ($all as $t) {
        $teacherlocal[] = (new DateTime('@' . $t['start']))
            ->setTimezone(new DateTimeZone('Africa/Nairobi'))->format('D H:i');
        $studentlocal[] = (new DateTime('@' . $t['start']))
            ->setTimezone(new DateTimeZone('America/New_York'))->format('D H:i');
    }
    // Anchored to the teacher: their wall clock is stable, the NY families see
    // the one-hour shift when the US falls back. That is the documented policy.
    check('teacher-local times stay fixed across DST', count(array_unique($teacherlocal)) === 3,
        implode(' | ', array_unique($teacherlocal)));
    check('New York families see the DST shift (policy: teacher-anchored)',
        count(array_unique($studentlocal)) === 6,
        implode(' | ', array_unique($studentlocal)));

    // Every generated session must fall inside the teacher's effective hours.
    $inside = 0;
    foreach ($all as $t) {
        if (pqav_covers_timestamp((int)$t['start'], $minutes, $beffective)) {
            $inside++;
        }
    }
    check('every session sits inside Teacher B\'s shift-capped hours',
        $inside === count($all), "{$inside}/" . count($all));

    // Sessions must not collide with each other.
    $starts = array_map(static fn(array $t): int => (int)$t['start'], $all);
    sort($starts);
    $collisions = 0;
    for ($i = 1; $i < count($starts); $i++) {
        if ($starts[$i] - $starts[$i - 1] < $minutes * 60) {
            $collisions++;
        }
    }
    check('no two generated sessions overlap', $collisions === 0, "{$collisions} collisions");
}

// ------------------------------------------------------------- edge cases
heading('Edge cases');

// A student available only one hour a week cannot take 3 sessions.
$thin = ['x' => grid('Africa/Nairobi', 18, 19, [0])];
$thinproposal = pqav_propose_cohorts($thin, $sessions, $minutes, $maxsize);
check('single-hour student is unplaced with a stated reason',
    count($thinproposal['unplaced']) === 1,
    $thinproposal['unplaced'][0]['reason'] ?? 'none');

// No teacher recorded at all -> ranking is empty, not a crash.
$empty = pqav_rank_teachers_for_cohort($cohorts[0]['windows'], [], $sessions, $minutes);
check('empty teacher pool yields no ranking (no crash)', $empty === []);

// The documented coverage gap: 03:00-07:00 UTC is outside BOTH shifts.
$defs = pqav_shift_definitions();
$gap = [[2 * 1440 + 4 * 60, 2 * 1440 + 5 * 60]];   // Wed 04:00-05:00 UTC
$cover1 = pqav_total_minutes(pqav_intersect_intervals($defs['shift1']['windows'], $gap));
$cover2 = pqav_total_minutes(pqav_intersect_intervals($defs['shift2']['windows'], $gap));
check('03:00-07:00 UTC gap is genuinely uncovered by both shifts (documented)',
    $cover1 === 0 && $cover2 === 0, "shift1 {$cover1}min, shift2 {$cover2}min");

echo "\n" . ($failures === 0 ? "ALL PASS\n" : "{$failures} FAILURE(S)\n");
exit($failures === 0 ? 0 : 1);
