<?php
/**
 * READ ONLY. Why Grade 1 Maths launches into its standalone build and Grade 2
 * does not, answered by comparing the two side by side.
 *
 * Writes nothing. No set_config, no DB write, no file written. Safe to run on
 * production at any time.
 *
 *     cd /home/ehelacad/quraantest.academy
 *     php <thisfile>.php            # the whole comparison for user 1293
 *     php <thisfile>.php 1293       # or name another user id
 *
 * WHAT IT DISTINGUISHES, in one run, because these all look identical from the
 * outside ("clicking Grade 2 does not open the new build"):
 *
 *   A. the Mathematics Grade 2 COURSE does not exist, or its idnumber is not
 *      ehel-math-g02 - then course_launch.php resolves no course id and never
 *      reaches the override at all
 *   B. the course exists but this learner is NOT ENROLLED in it - so nothing on
 *      their dashboard launches it, and the Grade 2 tile they do have is the
 *      English one
 *   C. enrolled but the enrolment is suspended
 *   D. everything above is fine and pqpg_ehel_app_base() still returns the
 *      subject entry - i.e. the override genuinely is not firing
 *
 * The reason this is worth a script rather than a look in the admin UI: the
 * override map is only half the question. The other half is whether a launch
 * for that course can happen at all, and that lives in the course table and the
 * enrolments, not in the setting.
 */

define('CLI_SCRIPT', true);

function cg_say(string $m): void { fwrite(STDOUT, "  " . $m . "\n"); }
function cg_fail(string $m): void { fwrite(STDERR, "\n  ABORT: " . $m . "\n\n"); exit(1); }

if (!is_readable(__DIR__ . '/config.php')) {
    cg_fail("no config.php beside this script.\n"
        . "         Run it from the docroot: cd /home/ehelacad/quraantest.academy");
}
require(__DIR__ . '/config.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

global $CFG, $DB;

const CG_EXPECTDB = 'ehelacad_quraantest';
if ($CFG->dbname !== CG_EXPECTDB) {
    cg_fail("wrong installation. Wanted " . CG_EXPECTDB . ", found " . $CFG->dbname);
}

$userid = isset($argv[1]) ? (int)$argv[1] : 1293;
$user = $DB->get_record('user', ['id' => $userid], 'id, username, firstname, lastname, suspended, deleted');

fwrite(STDOUT, "\n  Grade 1 vs Grade 2 Maths launch, user " . $userid . "\n");
fwrite(STDOUT, "  " . str_repeat('=', 68) . "\n");
cg_say("database : " . $CFG->dbname);
cg_say("user     : " . ($user ? ($user->username . "  suspended=" . $user->suspended . " deleted=" . $user->deleted)
    : "NOT FOUND - nothing below will mean anything"));

/* ------------------------------------------------------------ the setting */
$raw = trim((string)get_config('local_prequran', 'ehel_app_url_overrides'));
$map = $raw === '' ? [] : json_decode($raw, true);
cg_say("");
cg_say("override map: " . ($raw === '' ? "(empty)" : (is_array($map) ? count($map) . " entry(s)" : "NOT VALID JSON")));
if (is_array($map)) {
    foreach ($map as $k => $v) {
        cg_say("  " . $k . " -> " . $v);
    }
}

/* ------------------------------------------------- the three course keys */
$keys = ['ehel-math-g01', 'ehel-math-g02', 'ehel-eng-g02'];

foreach ($keys as $key) {
    cg_say("");
    cg_say(str_repeat('-', 68));
    cg_say("KEY  " . $key);

    // A. does the course exist, under exactly this idnumber?
    $course = $DB->get_record('course', ['idnumber' => $key], 'id, idnumber, shortname, fullname, visible');
    if (!$course) {
        cg_say("  course row      : NONE with idnumber '" . $key . "'");
        // near-misses, because a wrong idnumber is the commonest cause and it
        // is invisible unless you go looking for what IS there
        $like = $DB->get_records_select('course', $DB->sql_like('idnumber', ':p'),
            ['p' => '%' . str_replace('ehel-', '', substr($key, 0, 10)) . '%'],
            'idnumber', 'id, idnumber, shortname', 0, 12);
        if ($like) {
            cg_say("  similar idnumbers present:");
            foreach ($like as $c) {
                cg_say("    id=" . $c->id . "  idnumber=" . $c->idnumber . "  " . $c->shortname);
            }
        }
        continue;
    }
    cg_say("  course row      : id=" . $course->id . "  shortname=" . $course->shortname
        . "  visible=" . $course->visible);
    cg_say("  fullname        : " . $course->fullname);

    // D. what the launcher would resolve for it
    $base = pqpg_ehel_app_base($key);
    cg_say("  app_base()      : " . ($base === null ? "NULL - not launchable as an EHEL course"
        : (is_array($base) ? (($base['url'] ?? $base[0] ?? json_encode($base))) : (string)$base)));

    // B/C. can THIS learner launch it
    $ctx = context_course::instance($course->id, IGNORE_MISSING);
    if (!$ctx) {
        cg_say("  enrolment       : no course context");
        continue;
    }
    $enrolled = $user ? is_enrolled($ctx, $user, '', true) : false;   // true = ACTIVE only
    $enrolledany = $user ? is_enrolled($ctx, $user, '', false) : false;
    cg_say("  enrolled active : " . ($enrolled ? "YES" : "no")
        . "   any status: " . ($enrolledany ? "yes" : "no"));
    if ($enrolledany && !$enrolled) {
        cg_say("  ^^ enrolled but SUSPENDED - course_launch.php requires an active"
            . " enrolment (is_enrolled(..., true))");
    }
}

/* -------------------------------------- what this learner actually HAS */
cg_say("");
cg_say(str_repeat('=', 68));
cg_say("Every EHEL course this user is enrolled in:");
$courses = $user ? enrol_get_all_users_courses($userid, true, 'idnumber') : [];
$n = 0;
foreach ($courses as $c) {
    if (strpos((string)$c->idnumber, 'ehel-') !== 0) {
        continue;
    }
    $n++;
    $b = pqpg_ehel_app_base($c->idnumber);
    $overridden = (is_array($map) && isset($map[$c->idnumber])) ? "  [OVERRIDDEN]" : "";
    cg_say("  " . str_pad($c->idnumber, 22) . " id=" . str_pad((string)$c->id, 6)
        . ($b === null ? "not launchable" : "launchable") . $overridden);
}
if ($n === 0) {
    cg_say("  none");
}

cg_say("");
cg_say("READ THIS ROW FIRST: if ehel-math-g02 is absent from the list above, the");
cg_say("override is irrelevant - there is no Grade 2 Maths launch for this learner");
cg_say("to make, and the Grade 2 tile they press is the English course.");
cg_say("");
cg_say("Nothing was written. Delete this script.");
exit(0);
