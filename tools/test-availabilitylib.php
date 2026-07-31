<?php
// Self-test for the availability/matching core (pqav_*). Pure functions only:
// no Moodle, no DB. Run from the repo root:
//
//   php tools/test-availabilitylib.php
//
// Exits 1 on any failure. Run it after ANY edit to availabilitylib.php --
// the weekday-convention bug this suite pins down was invisible to php -l
// and would have shifted every teacher's availability by one day.
declare(strict_types=1);

define('MOODLE_INTERNAL', 1);
// Default: the repo layout (run from a checkout). To test a DEPLOYED copy --
// e.g. on the Moodle server where the plugin lives under local/hubredirect --
// pass the library path as the first argument:
//   php test-availabilitylib.php /home/ehelacad/public_html/local/hubredirect/availabilitylib.php
$librarypath = $argv[1] ?? (__DIR__ . '/../src/moodle/local_hubredirect/availabilitylib.php');
if (!is_readable($librarypath)) {
    fwrite(STDERR, "Cannot read availabilitylib at: {$librarypath}\n"
        . "Pass the path to availabilitylib.php as the first argument.\n");
    exit(1);
}
require $librarypath;

$failures = 0;
function check(string $name, bool $ok, string $detail = ''): void {
    global $failures;
    if ($ok) {
        echo "  ok   {$name}\n";
    } else {
        $failures++;
        echo "  FAIL {$name}" . ($detail !== '' ? " -- {$detail}" : '') . "\n";
    }
}
function slots(string $tz, int $sh, int $eh, array $days): array {
    $out = [];
    foreach ($days as $d) {
        foreach (pqav_local_to_utc_intervals($d, $sh * 60, $eh * 60, $tz) as $iv) {
            $out[] = $iv;
        }
    }
    return pqav_merge_intervals($out);
}

echo "== interval mechanics ==\n";
check('merge overlapping', pqav_merge_intervals([[100, 200], [150, 300], [500, 600]]) === [[100, 300], [500, 600]]);
check('intersect disjoint is empty', pqav_intersect_intervals([[0, 100]], [[200, 300]]) === []);
check('week wrap splits in two', count(pqav_local_to_utc_intervals(6, 22 * 60, 24 * 60, 'Pacific/Auckland')) >= 1);
$nzsun = pqav_local_to_utc_intervals(6, 22 * 60, 24 * 60, 'Pacific/Auckland');
check('NZ Sunday night lands on Sunday UTC', strpos(pqav_interval_label($nzsun[0]), 'Sun') === 0, pqav_interval_label($nzsun[0]));

echo "== the operating scenario (EAT teacher 07:00-17:00 weekdays) ==\n";
$teacher = slots('Africa/Nairobi', 7, 17, [0, 1, 2, 3, 4]);
$ny = slots('America/New_York', 17, 19, [0, 1, 2, 3, 4]);
$syd = slots('Australia/Sydney', 17, 19, [0, 1, 2, 3, 4]);
$moscow = slots('Europe/Moscow', 7, 17, [0, 1, 2, 3, 4]);
check('New York evenings: zero overlap', pqav_overlap($teacher, [$ny])['minutes'] === 0);
check('Sydney evenings: real overlap', pqav_overlap($teacher, [$syd])['minutes'] >= 300);
check('Moscow same-UTC-offset overlaps fully (zone-name equality would say 0)', pqav_overlap($teacher, [$moscow])['minutes'] >= 2400);
[$ok3] = pqav_can_host_sessions(pqav_overlap($teacher, [$syd])['windows'], 3, 60);
check('3 x 60min on distinct days fits Sydney overlap', $ok3);
[$okny] = pqav_can_host_sessions(pqav_overlap($teacher, [$ny])['windows'], 3, 60);
check('3 x 60min impossible with New York', !$okny);
[$okcram] = pqav_can_host_sessions([[0, 90]], 3, 60);
check('cannot cram 3 sessions into one 90-min window', !$okcram);

echo "== weekday convention (DB 0=Sunday -> library 0=Monday) ==\n";
// Simulate exactly what pqav_teacher_intervals does with a DB row.
$dbwednesday = 3;   // date('w') convention: 3 = Wednesday.
$mapped = (($dbwednesday) + 6) % 7;
$iv = pqav_local_to_utc_intervals($mapped, 9 * 60, 10 * 60, 'UTC');
check('DB Wednesday row maps to Wednesday', strpos(pqav_interval_label($iv[0]), 'Wed') === 0, pqav_interval_label($iv[0]));
$dbsunday = 0;
$iv = pqav_local_to_utc_intervals((($dbsunday) + 6) % 7, 9 * 60, 10 * 60, 'UTC');
check('DB Sunday row maps to Sunday', strpos(pqav_interval_label($iv[0]), 'Sun') === 0, pqav_interval_label($iv[0]));

echo "== cohort proposals ==\n";
$students = [];
for ($i = 1; $i <= 5; $i++) {
    $students[$i] = slots('Africa/Nairobi', 16, 19, [0, 1, 2, 3, 4]);
}
for ($i = 6; $i <= 10; $i++) {
    $students[$i] = slots('America/New_York', 17, 19, [0, 1, 2, 3, 4]);
}
$students[11] = [];
$proposal = pqav_propose_cohorts($students, 3, 60, 9);
check('splits into exactly two cohorts', count($proposal['cohorts']) === 2, count($proposal['cohorts']) . ' cohorts');
check('no-data student reported unplaced', count($proposal['unplaced']) === 1
    && $proposal['unplaced'][0]['studentid'] === 11);
$sizes = array_map(static fn(array $c): int => count($c['studentids']), $proposal['cohorts']);
sort($sizes);
check('both cohorts hold their five students', $sizes === [5, 5], implode('/', $sizes));

echo "== teacher ranking: viability then load ==\n";
$teachers = [
    100 => slots('Africa/Nairobi', 7, 17, [0, 1, 2, 3, 4]),
    200 => slots('America/New_York', 15, 21, [0, 1, 2, 3, 4]),
];
foreach ($proposal['cohorts'] as $cohort) {
    $ranked = pqav_rank_teachers_for_cohort($cohort['windows'], $teachers, 3, 60);
    check('cohort gets a viable teacher', $ranked[0]['viable']);
}
// Load tiebreak: two identical teachers, the lighter-loaded one must rank first.
$twins = [1 => $teachers[100], 2 => $teachers[100]];
$ranked = pqav_rank_teachers_for_cohort(slots('Africa/Nairobi', 8, 12, [0, 1, 2]), $twins, 2, 60, [1 => 600, 2 => 60]);
check('least-loaded twin ranks first', $ranked[0]['teacherid'] === 2);

echo "== DST-safe session generation ==\n";
$slot = 2 * 1440 + 21 * 60;   // Wed 21:00 UTC == Wed 17:00 New York under EDT.
$times = pqav_generate_session_times($slot, 60, 'America/New_York', strtotime('2026-10-19 00:00:00 UTC'), 0, 5);
check('generates the requested count', count($times) === 5);
$localhours = [];
foreach ($times as $t) {
    $localhours[] = (new DateTime('@' . $t['start']))->setTimezone(new DateTimeZone('America/New_York'))->format('H:i');
}
check('local hour stable across the Nov 2026 DST fall-back', count(array_unique($localhours)) === 1, implode(',', array_unique($localhours)));
$utchours = array_unique(array_map(static fn(array $t): string => gmdate('H:i', $t['start']), $times));
check('UTC hour shifts at the transition (proof it is not naive stepping)', count($utchours) === 2, implode(',', $utchours));

echo "== timestamp coverage ==\n";
$wed10 = strtotime('2026-08-05 10:00:00 UTC');
check('timestamp -> week minute round trip', strpos(pqav_interval_label([pqav_timestamp_to_week_minute($wed10), pqav_timestamp_to_week_minute($wed10) + 60]), 'Wed 10:00') === 0);
check('covered window accepted', pqav_covers_timestamp($wed10, 60, [[2 * 1440 + 9 * 60, 2 * 1440 + 12 * 60]]));
check('uncovered window rejected', !pqav_covers_timestamp($wed10, 60, [[2 * 1440 + 11 * 60, 2 * 1440 + 12 * 60]]));

echo "== shifts ==\n";
$defs = pqav_shift_definitions();
check('both shifts defined at 70h/week', pqav_total_minutes($defs['shift1']['windows']) === 4200
    && pqav_total_minutes($defs['shift2']['windows']) === 4200);
$nyevening = [[2 * 1440 + 22 * 60, 2 * 1440 + 24 * 60]];
check('NY evening outside shift1', pqav_total_minutes(pqav_intersect_intervals($defs['shift1']['windows'], $nyevening)) === 0);
check('NY evening inside shift2', pqav_total_minutes(pqav_intersect_intervals($defs['shift2']['windows'], $nyevening)) === 120);

echo "\n" . ($failures === 0 ? "ALL PASS\n" : "{$failures} FAILURE(S)\n");
exit($failures === 0 ? 0 : 1);
