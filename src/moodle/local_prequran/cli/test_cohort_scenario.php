<?php
// CLI: Layer 2 scenario test -- 2 shifts, 2 teachers, 10 students -- run
// against the REAL database with the REAL matching functions.
//
// The pure-function suites (tools/test-availabilitylib.php,
// tools/test-cohort-scenario.php) prove the algorithm. This proves the layer
// they cannot reach: that availability actually round-trips through the
// database, that pqav_student_intervals()/pqav_teacher_effective_intervals()
// read what the intake forms write, and that cohort proposals come out right
// with live data. It does NOT test HTML forms or page rendering -- do those
// by hand per docs/cohort-matching-layer2-test.md.
//
//   php local/prequran/cli/test_cohort_scenario.php --dry-run
//   php local/prequran/cli/test_cohort_scenario.php --seed
//   php local/prequran/cli/test_cohort_scenario.php            (report only)
//   php local/prequran/cli/test_cohort_scenario.php --teardown
//
// SAFETY: every account it creates is prefixed `ehelk12-qa-scn-`, so it can
// never touch a real account, and --teardown removes exactly that set.
// Without --seed it changes nothing at all: it reads whatever QA accounts
// exist and reports the matching outcome.

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/availabilitylib.php');

[$options] = cli_get_params([
    'help' => false,
    'seed' => false,
    'teardown' => false,
    'dry-run' => false,
    'password' => 'EhelK12Qa#2026',
], ['h' => 'help']);

if ($options['help']) {
    cli_writeln("Layer 2 scenario test: 2 shifts, 2 teachers, 10 students.");
    cli_writeln("  --seed       create the QA accounts and availability data");
    cli_writeln("  --teardown   delete everything this script created");
    cli_writeln("  --dry-run    report what --seed would do, change nothing");
    cli_writeln("  (no flag)    report the matching outcome for existing data");
    exit(0);
}

const SCN_PREFIX = 'ehelk12-qa-scn-';
const SCN_WORKSPACEID = 23;   // Ehel K-12 School
const SCN_CONSUMERID = 8;     // Ehel K-12 School

$failures = 0;
function check(string $name, bool $ok, string $detail = ''): void {
    global $failures;
    if ($ok) {
        cli_writeln("  ok   {$name}" . ($detail !== '' ? "  ({$detail})" : ''));
    } else {
        $failures++;
        cli_writeln("  FAIL {$name}" . ($detail !== '' ? " -- {$detail}" : ''));
    }
}
/** Insert only columns that exist (schema-drift safe). */
function scn_filter(string $table, array $data): array {
    global $DB;
    $cols = $DB->get_columns($table);
    $out = [];
    foreach ($data as $k => $v) {
        if (isset($cols[$k])) {
            $out[$k] = $v;
        }
    }
    return $out;
}

// The scenario. Hours are each person's OWN local time, exactly as they would
// be ticked on the intake grid.
$scenario = [
    'teachers' => [
        'a' => [
            'first' => 'QA Teacher', 'last' => 'A (Shift 1)',
            'timezone' => 'Africa/Nairobi', 'shift' => 'shift1',
            'from' => 10, 'to' => 19, 'days' => [1, 2, 3, 4, 5],   // date('w'): Mon-Fri
        ],
        'b' => [
            'first' => 'QA Teacher', 'last' => 'B (Shift 2)',
            'timezone' => 'America/New_York', 'shift' => 'shift2',
            'from' => 17, 'to' => 20, 'days' => [1, 2, 3, 4, 5],
        ],
    ],
    // Students: 5 Nairobi evenings, 4 New York evenings, 1 with NO grid.
    'students' => [],
];
for ($i = 1; $i <= 5; $i++) {
    $scenario['students']["s{$i}"] = ['timezone' => 'Africa/Nairobi', 'from' => 16, 'to' => 19];
}
for ($i = 6; $i <= 9; $i++) {
    $scenario['students']["s{$i}"] = ['timezone' => 'America/New_York', 'from' => 17, 'to' => 20];
}
$scenario['students']['s10'] = ['timezone' => 'Africa/Nairobi', 'from' => 0, 'to' => 0]; // deliberately blank

$sessions = 3;
$minutes = 60;

// ---------------------------------------------------------------- teardown
if ($options['teardown']) {
    $users = $DB->get_records_select('user', $DB->sql_like('username', ':p'),
        ['p' => SCN_PREFIX . '%'], '', 'id, username');
    if (!$users) {
        cli_writeln('Nothing to remove.');
        exit(0);
    }
    cli_writeln('Removing ' . count($users) . ' QA scenario account(s)...');
    foreach ($users as $u) {
        $uid = (int)$u->id;
        foreach (['local_prequran_live_availability' => 'teacherid',
                  'local_prequran_student_profile' => 'userid',
                  'local_prequran_teacher_profile' => 'userid',
                  'local_prequran_workspace_member' => 'userid'] as $table => $field) {
            if ($DB->get_manager()->table_exists($table)) {
                $DB->delete_records($table, [$field => $uid]);
            }
        }
        if ($user = $DB->get_record('user', ['id' => $uid])) {
            delete_user($user);
        }
        cli_writeln('  removed ' . $u->username);
    }
    cli_writeln('Done.');
    exit(0);
}

// -------------------------------------------------------------------- seed
if ($options['seed'] || $options['dry-run']) {
    $mode = $options['dry-run'] ? '[dry-run] ' : '';
    cli_writeln($mode . 'Seeding scenario accounts into workspace #' . SCN_WORKSPACEID);

    foreach ($scenario['teachers'] as $key => $t) {
        $username = SCN_PREFIX . 'teacher-' . $key;
        if ($DB->record_exists('user', ['username' => $username])) {
            cli_writeln($mode . '  exists: ' . $username);
            $userid = (int)$DB->get_field('user', 'id', ['username' => $username]);
        } else if ($options['dry-run']) {
            cli_writeln($mode . '  would create ' . $username . ' (' . $t['timezone'] . ', ' . $t['shift'] . ')');
            continue;
        } else {
            $user = new stdClass();
            $user->username = $username;
            $user->email = $username . '@ehel.example.com';   // RFC 2606, non-routable
            $user->firstname = $t['first'];
            $user->lastname = $t['last'];
            $user->auth = 'manual';
            $user->confirmed = 1;
            $user->mnethostid = $CFG->mnet_localhost_id;
            $user->timezone = $t['timezone'];
            $user->password = $options['password'];
            $userid = (int)user_create_user($user, true, false);
            cli_writeln('  created ' . $username . ' (id ' . $userid . ')');
        }
        if ($options['dry-run']) {
            continue;
        }

        // Teacher profile with the shift assignment.
        if (!$DB->record_exists('local_prequran_teacher_profile', ['userid' => $userid])) {
            $DB->insert_record('local_prequran_teacher_profile', (object)scn_filter('local_prequran_teacher_profile', [
                'userid' => $userid, 'timezone' => $t['timezone'], 'shift' => $t['shift'],
                'status' => 'active', 'consumerid' => SCN_CONSUMERID, 'workspaceid' => SCN_WORKSPACEID,
                'timecreated' => time(), 'timemodified' => time(),
            ]));
        } else {
            $rec = $DB->get_record('local_prequran_teacher_profile', ['userid' => $userid]);
            $rec->shift = $t['shift'];
            $rec->timezone = $t['timezone'];
            $DB->update_record('local_prequran_teacher_profile', (object)scn_filter('local_prequran_teacher_profile', (array)$rec));
        }

        // Structured availability rows -- weekday here is date('w'), 0=Sunday,
        // matching what teacher_intake.php writes.
        $DB->delete_records('local_prequran_live_availability', ['teacherid' => $userid]);
        foreach ($t['days'] as $weekday) {
            $DB->insert_record('local_prequran_live_availability', (object)scn_filter('local_prequran_live_availability', [
                'teacherid' => $userid, 'weekday' => $weekday,
                'start_minute' => $t['from'] * 60, 'end_minute' => $t['to'] * 60,
                'timezone' => $t['timezone'], 'status' => 'active',
                'timecreated' => time(), 'timemodified' => time(),
            ]));
        }

        if (!$DB->record_exists('local_prequran_workspace_member',
                ['workspaceid' => SCN_WORKSPACEID, 'userid' => $userid, 'workspace_role' => 'teacher'])) {
            $DB->insert_record('local_prequran_workspace_member', (object)scn_filter('local_prequran_workspace_member', [
                'workspaceid' => SCN_WORKSPACEID, 'userid' => $userid, 'workspace_role' => 'teacher',
                'status' => 'active', 'timecreated' => time(), 'timemodified' => time(),
            ]));
        }
    }

    foreach ($scenario['students'] as $key => $s) {
        $username = SCN_PREFIX . $key;
        if ($DB->record_exists('user', ['username' => $username])) {
            $userid = (int)$DB->get_field('user', 'id', ['username' => $username]);
            cli_writeln($mode . '  exists: ' . $username);
        } else if ($options['dry-run']) {
            cli_writeln($mode . '  would create ' . $username . ' (' . $s['timezone']
                . ($s['to'] > $s['from'] ? ', ' . $s['from'] . ':00-' . $s['to'] . ':00' : ', NO availability') . ')');
            continue;
        } else {
            $user = new stdClass();
            $user->username = $username;
            $user->email = $username . '@ehel.example.com';
            $user->firstname = 'QA Student';
            $user->lastname = strtoupper($key);
            $user->auth = 'manual';
            $user->confirmed = 1;
            $user->mnethostid = $CFG->mnet_localhost_id;
            $user->timezone = $s['timezone'];
            $user->password = $options['password'];
            $userid = (int)user_create_user($user, true, false);
            cli_writeln('  created ' . $username . ' (id ' . $userid . ')');
        }
        if ($options['dry-run']) {
            continue;
        }

        // The structured availability the intake grid now persists. Slot
        // tokens are "day|hour" exactly as the form writes them.
        $slots = [];
        if ($s['to'] > $s['from']) {
            foreach (['mon', 'tue', 'wed', 'thu', 'fri'] as $day) {
                for ($h = $s['from']; $h < $s['to']; $h++) {
                    $slots[] = $day . '|' . $h;
                }
            }
        }
        $json = $slots ? json_encode(['timezone' => $s['timezone'], 'session_count' => $sessions,
            'slots' => $slots], JSON_UNESCAPED_SLASHES) : '';

        $existing = $DB->get_record('local_prequran_student_profile', ['userid' => $userid]);
        $row = scn_filter('local_prequran_student_profile', [
            'userid' => $userid, 'timezone' => $s['timezone'], 'availability_json' => $json,
            'status' => 'active', 'consumerid' => SCN_CONSUMERID, 'workspaceid' => SCN_WORKSPACEID,
            'timecreated' => time(), 'timemodified' => time(),
        ]);
        if ($existing) {
            $row['id'] = (int)$existing->id;
            $DB->update_record('local_prequran_student_profile', (object)$row);
        } else {
            $DB->insert_record('local_prequran_student_profile', (object)$row);
        }

        if (!$DB->record_exists('local_prequran_workspace_member',
                ['workspaceid' => SCN_WORKSPACEID, 'userid' => $userid, 'workspace_role' => 'student'])) {
            $DB->insert_record('local_prequran_workspace_member', (object)scn_filter('local_prequran_workspace_member', [
                'workspaceid' => SCN_WORKSPACEID, 'userid' => $userid, 'workspace_role' => 'student',
                'status' => 'active', 'timecreated' => time(), 'timemodified' => time(),
            ]));
        }
    }
    cli_writeln('');
    if ($options['dry-run']) {
        cli_writeln('[dry-run] nothing was changed. Re-run with --seed to apply.');
        exit(0);
    }
}

// ------------------------------------------------------------------ report
cli_writeln('');
cli_writeln('== Reading availability back through the real functions ==');

$teacherids = [];
foreach (array_keys($scenario['teachers']) as $key) {
    $id = (int)$DB->get_field('user', 'id', ['username' => SCN_PREFIX . 'teacher-' . $key]);
    if ($id > 0) {
        $teacherids[$key] = $id;
    }
}
$studentids = [];
foreach (array_keys($scenario['students']) as $key) {
    $id = (int)$DB->get_field('user', 'id', ['username' => SCN_PREFIX . $key]);
    if ($id > 0) {
        $studentids[$key] = $id;
    }
}

if (!$teacherids || !$studentids) {
    cli_writeln('No QA scenario accounts found. Run with --seed first.');
    exit(1);
}
check('two teachers present', count($teacherids) === 2, count($teacherids) . ' found');
check('ten students present', count($studentids) === 10, count($studentids) . ' found');

$teachermap = [];
foreach ($teacherids as $key => $id) {
    $declared = pqav_teacher_intervals($id);
    $effective = pqav_teacher_effective_intervals($id);
    $teachermap[$id] = $effective;
    cli_writeln(sprintf('  teacher %s (id %d): declared %.1fh/wk, after shift %.1fh/wk',
        $key, $id, pqav_total_minutes($declared) / 60, pqav_total_minutes($effective) / 60));
    check("teacher {$key} has availability the matcher can read", $effective !== []);
}

$studentmap = [];
$blank = 0;
foreach ($studentids as $key => $id) {
    $iv = pqav_student_intervals($id);
    $studentmap[$id] = $iv;
    if (!$iv) {
        $blank++;
    }
}
check('nine students have readable availability, one blank by design',
    $blank === 1, (10 - $blank) . ' with data, ' . $blank . ' blank');

cli_writeln('');
cli_writeln('== Cohort proposal (real data) ==');
$proposal = pqav_propose_cohorts($studentmap, $sessions, $minutes, 8);
check('exactly two cohorts proposed', count($proposal['cohorts']) === 2,
    count($proposal['cohorts']) . ' proposed');
check('exactly one student unplaced', count($proposal['unplaced']) === 1,
    ($proposal['unplaced'][0]['reason'] ?? 'n/a'));

$namefor = static function(int $id) use ($studentids): string {
    foreach ($studentids as $k => $v) {
        if ($v === $id) {
            return $k;
        }
    }
    return (string)$id;
};

$loadmap = [];
foreach ($proposal['cohorts'] as $i => $cohort) {
    $members = array_map($namefor, array_map('intval', $cohort['studentids']));
    sort($members);
    cli_writeln('  cohort ' . ($i + 1) . ': ' . implode(', ', $members));
    $ranked = pqav_rank_teachers_for_cohort($cohort['windows'], $teachermap, $sessions, $minutes, $loadmap);
    $top = $ranked[0] ?? null;
    check('  cohort ' . ($i + 1) . ' has a viable teacher',
        $top !== null && $top['viable'],
        $top ? 'teacher id ' . $top['teacherid'] . ', overlap '
            . round($top['minutes'] / 60, 1) . 'h, slots: ' . implode(' / ', $top['labels']) : 'none');
    if ($top && $top['viable']) {
        $loadmap[$top['teacherid']] = ($loadmap[$top['teacherid']] ?? 0) + ($sessions * $minutes);
    }
}
check('the two cohorts went to two different teachers', count($loadmap) === 2,
    count($loadmap) . ' teacher(s) used');

cli_writeln('');
cli_writeln($failures === 0 ? 'ALL PASS' : $failures . ' FAILURE(S)');
cli_writeln('Remember to run --teardown when finished.');
exit($failures === 0 ? 0 : 1);
