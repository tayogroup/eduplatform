<?php
/**
 * Point a grade of a subject at its standalone lesson build.
 *
 * Changes exactly one Moodle config value:
 *   local_prequran / ehel_app_url_overrides
 * which pqpg_ehel_app_base() reads to send a single course somewhere other than
 * its subject entry. Nothing is deployed and no file is edited.
 *
 * REPORTS BY DEFAULT. Pass --apply to write. Run it once with no argument and
 * read what it says the before and after will be.
 *
 *     cd /home/ehelacad/quraantest.academy
 *     php <thisfile>.php --grade 3,4                          # report (mathematics)
 *     php <thisfile>.php --grade 3,4 --apply                  # write
 *     php <thisfile>.php --subject science --grade 1          # another subject
 *
 * --subject defaults to mathematics, so every earlier invocation means what it
 * meant. Each subject carries its own TARGETS table and its own shared entry
 * (where a course goes when its key is removed), because those are the two
 * facts that differ between subjects and nothing else in this file does.
 *
 * Run it from the DOCROOT, not the home directory: the require below is
 * __DIR__-relative, so a home-directory run fails loudly rather than doing
 * something surprising.
 *
 * ONE SCRIPT FOR EVERY GRADE, where Grades 1 and 2 each got their own. This is
 * the third and fourth of these and a per-grade copy is now three chances for
 * the fences to drift apart; one file reviewed once is better than four files
 * reviewed four times. The grade-specific part is the TARGETS table below and
 * nothing else. It carries its own constants rather than reading
 * app.config.json, because it runs on the Moodle box where this repo does not
 * exist.
 *
 * WHAT ROUTING A GRADE HERE COSTS, stated because the setting cannot state it:
 * the standalone builds report progress under their own unit namespace
 * (l01..l08), not the shell course's eighteen term-ordered units. The live
 * group board, resume and last-seen all work; the gradebook will not show
 * eighteen units of completion, because eight strand lessons are not those
 * eighteen units. Mapping one onto the other is a curriculum decision nobody
 * has made. See each build's README :: THE UNIT PROBLEM.
 *
 * This file contains no credentials. Delete it when you are done.
 */

define('CLI_SCRIPT', true);

// cli_error() lives in clilib.php, which a bare config.php require does not
// load, so calling it here would fatal while reporting a different problem.
function rp_fail(string $msg): void {
    fwrite(STDERR, "\n  ABORT: " . $msg . "\n\n");
    exit(1);
}
function rp_say(string $msg): void {
    fwrite(STDOUT, "  " . $msg . "\n");
}

if (!is_readable(__DIR__ . '/config.php')) {
    rp_fail("no config.php beside this script.\n"
        . "         Run it from the docroot: cd /home/ehelacad/quraantest.academy");
}
require(__DIR__ . '/config.php');

global $CFG, $DB;

const RP_PLUGIN   = 'local_prequran';
const RP_SETTING  = 'ehel_app_url_overrides';
const RP_EXPECTDB = 'ehelacad_quraantest';
const RP_HOST     = 'https://ehelacademy.b-cdn.net/';
// Per subject: the shared entry (where a course goes when its key is removed)
// and the grade -> [course key, standalone build] table. The course key is the
// shell's own courseKey for that subject and grade (shell/subjects/<subject>.js),
// which is what pqpg_ehel_app_base() looks up.
$SUBJECTS = [
    'mathematics' => [
        'entry' => RP_HOST . 'Ehel%20Primary/app/mathematics/index.html',
        'targets' => [
            1 => ['ehel-math-g01', RP_HOST . 'Ehel%20Primary/app/mathematics/grade-1-v2/index.html'],
            2 => ['ehel-math-g02', RP_HOST . 'Ehel%20Primary/app/mathematics/grade-2-lessons/index.html'],
            3 => ['ehel-math-g03', RP_HOST . 'Ehel%20Primary/app/mathematics/grade-3-lessons/index.html'],
            4 => ['ehel-math-g04', RP_HOST . 'Ehel%20Primary/app/mathematics/grade-4-lessons/index.html'],
        ],
    ],
    'english' => [
        'entry' => RP_HOST . 'Ehel%20Primary/app/english/index.html',
        'targets' => [
            1 => ['ehel-eng-g01', RP_HOST . 'Ehel%20Primary/app/english/grade-1-v2/index.html'],
            2 => ['ehel-eng-g02', RP_HOST . 'Ehel%20Primary/app/english/grade-2-v2/index.html'],
            3 => ['ehel-eng-g03', RP_HOST . 'Ehel%20Primary/app/english/grade-3-v2/index.html'],
            4 => ['ehel-eng-g04', RP_HOST . 'Ehel%20Primary/app/english/grade-4-v2/index.html'],
        ],
    ],
    'science' => [
        'entry' => RP_HOST . 'Ehel%20Primary/app/science/index.html',
        'targets' => [
            1 => ['ehel-sci-g01', RP_HOST . 'Ehel%20Primary/app/science/grade-1-v2/index.html'],
            2 => ['ehel-sci-g02', RP_HOST . 'Ehel%20Primary/app/science/grade-2-v2/index.html'],
            3 => ['ehel-sci-g03', RP_HOST . 'Ehel%20Primary/app/science/grade-3-v2/index.html'],
            4 => ['ehel-sci-g04', RP_HOST . 'Ehel%20Primary/app/science/grade-4-v2/index.html'],
        ],
    ],
    // The course key is the shell's `ehel-comp-g${pad2(s)}` (shell/subjects/
    // computing.js) and pqpg_ehel_subject_map() knows 'comp' with letter g.
    'computing' => [
        'entry' => RP_HOST . 'Ehel%20Primary/app/computing/index.html',
        'targets' => [
            1 => ['ehel-comp-g01', RP_HOST . 'Ehel%20Primary/app/computing/grade-1-v2/index.html'],
            2 => ['ehel-comp-g02', RP_HOST . 'Ehel%20Primary/app/computing/grade-2-v2/index.html'],
            3 => ['ehel-comp-g03', RP_HOST . 'Ehel%20Primary/app/computing/grade-3-v2/index.html'],
            4 => ['ehel-comp-g04', RP_HOST . 'Ehel%20Primary/app/computing/grade-4-v2/index.html'],
        ],
    ],
    // The course key is the shell's `ehel-gp-g${pad2(s)}` (shell/subjects/
    // global-perspectives.js) and pqpg_ehel_subject_map() knows 'gp' with
    // letter g. The build reports progress as l01..l08 against 0838 directly;
    // the shell course is four topic units - THE UNIT PROBLEM applies.
    // Art & Design has NO shell entry: app/art-and-design/index.html does not
    // exist, so the standalone build is the only page a Stage 1 learner can
    // land on. `entry` (where a course goes when its key is REMOVED) is
    // therefore the same page - removing the override would otherwise send
    // the course to a 404. The course key is the catalogue's ehel-art-g01
    // (tools/generate-ehel-catalog.js, ART family); the slug `art` was added
    // to pqpg_ehel_subject_map() in the same change and must be on the box
    // before this row does anything.
    'art-and-design' => [
        'entry' => RP_HOST . 'Ehel%20Primary/app/art-and-design/grade-1-v2/index.html',
        'targets' => [
            1 => ['ehel-art-g01', RP_HOST . 'Ehel%20Primary/app/art-and-design/grade-1-v2/index.html'],
            // Grade 2 (built 2026-09-11): needs its course (ehel-art-g02, from the
            // catalogue) on the box before --grade 2 --apply does anything.
            2 => ['ehel-art-g02', RP_HOST . 'Ehel%20Primary/app/art-and-design/grade-2-v2/index.html'],
            // Grade 3 (built 2026-09-11): the same, for ehel-art-g03.
            3 => ['ehel-art-g03', RP_HOST . 'Ehel%20Primary/app/art-and-design/grade-3-v2/index.html'],
        ],
    ],
    'global-perspectives' => [
        'entry' => RP_HOST . 'Ehel%20Primary/app/global-perspectives/index.html',
        'targets' => [
            1 => ['ehel-gp-g01', RP_HOST . 'Ehel%20Primary/app/global-perspectives/grade-1-v2/index.html'],
            2 => ['ehel-gp-g02', RP_HOST . 'Ehel%20Primary/app/global-perspectives/grade-2-v2/index.html'],
            3 => ['ehel-gp-g03', RP_HOST . 'Ehel%20Primary/app/global-perspectives/grade-3-v2/index.html'],
            4 => ['ehel-gp-g04', RP_HOST . 'Ehel%20Primary/app/global-perspectives/grade-4-v2/index.html'],
        ],
    ],
];

$argv = $argv ?? [];
$apply = in_array('--apply', $argv, true);
$si = array_search('--subject', $argv, true);
$subject = ($si !== false && isset($argv[$si + 1])) ? strtolower(trim($argv[$si + 1])) : 'mathematics';
if (!isset($SUBJECTS[$subject])) {
    rp_fail("unknown subject '" . $subject . "'. Known: " . implode(', ', array_keys($SUBJECTS)));
}
$TARGETS = $SUBJECTS[$subject]['targets'];
// the shared subject entry, where a course goes when its key is removed
define('RP_ENTRY', $SUBJECTS[$subject]['entry']);
$gi = array_search('--grade', $argv, true);
if ($gi === false || !isset($argv[$gi + 1])) {
    rp_fail("which grade? e.g. --grade 3   or   --grade 3,4\n"
        . "         known: " . implode(', ', array_keys($TARGETS)));
}
$grades = [];
foreach (explode(',', $argv[$gi + 1]) as $g) {
    $g = (int)trim($g);
    if (!isset($TARGETS[$g])) {
        rp_fail("grade " . $g . " is not in this script's table. Known: "
            . implode(', ', array_keys($TARGETS)));
    }
    $grades[] = $g;
}
$grades = array_values(array_unique($grades));
sort($grades);

fwrite(STDOUT, "\n  Repoint " . ucfirst($subject) . " grade(s) " . implode(', ', $grades)
    . " (" . ($apply ? "APPLY" : "report only") . ")\n");
fwrite(STDOUT, "  " . str_repeat('-', 66) . "\n");

/* ---------------------------------------------------------------- fence 1
 * Identify the install by its DATABASE, never by wwwroot. This box hosts nine
 * Moodles and this config serves many hostnames, so from the CLI wwwroot reads
 * https://eduplatform.ai on the RIGHT install - a wwwroot guard fires falsely
 * on exactly the machine we want. */
rp_say("database : " . $CFG->dbname);
rp_say("wwwroot  : " . $CFG->wwwroot . "   (not used to identify the install)");
if ($CFG->dbname !== RP_EXPECTDB) {
    rp_fail("this is not the expected installation. Wanted database " . RP_EXPECTDB
        . ", found " . $CFG->dbname . ". Nothing was changed.");
}

/* ---------------------------------------------------------------- fence 2
 * The consumer that owns the K-12 courses must actually live here. Two slugs
 * are accepted because this one has been renamed once already. If neither is
 * found the script REFUSES but prints the slugs that DO exist, so a false
 * negative comes back as a diagnostic rather than a dead end. */
if (!$DB->get_manager()->table_exists('local_prequran_consumer')) {
    rp_fail("local_prequran is not installed here (no consumer table). Nothing was changed.");
}
$wanted = ['ehel-k12', 'ehel-primary'];
list($insql, $inparams) = $DB->get_in_or_equal($wanted, SQL_PARAMS_NAMED);
$owner = $DB->get_records_select('local_prequran_consumer', "slug $insql", $inparams,
    'id', 'id, slug, name, status');
if (empty($owner)) {
    $all = $DB->get_records('local_prequran_consumer', null, 'id', 'id, slug, status');
    $list = [];
    foreach ($all as $c) {
        $list[] = $c->slug . ' (' . $c->status . ')';
    }
    rp_fail("no consumer with slug " . implode(' or ', $wanted) . " on this install.\n"
        . "         Consumers present: " . (empty($list) ? "none" : implode(', ', $list)) . "\n"
        . "         Nothing was changed. Send that list back rather than forcing it.");
}
$found = reset($owner);
rp_say("consumer : slug=" . $found->slug . " id=" . $found->id . " status=" . $found->status);
if ($found->status !== 'active') {
    rp_say("WARNING: that consumer is not active. Read the line above before applying.");
}

/* ---------------------------------------------------------------- current */
$raw = (string)get_config(RP_PLUGIN, RP_SETTING);
$map = [];
if (trim($raw) !== '') {
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        rp_fail("the current value is not valid JSON. Fix or clear it in\n"
            . "         Site administration > Plugins > Local plugins > "
            . "Ehel app URL overrides before running this. Nothing was changed.");
    }
    $map = $decoded;
}

/* Print the WHOLE map, not just the keys being changed. This setting is shared
 * - Grade 1 and Grade 2 Maths and Grade 1 English all live in it - and the one
 * way to damage another course from here is to write a map that has quietly
 * lost an entry. Seeing them listed before and after is the cheapest guard. */
rp_say("");
rp_say("overrides currently in place: " . (empty($map) ? "none" : count($map)));
foreach ($map as $k => $v) {
    rp_say("  " . $k . " -> " . $v);
}

$before = $map;
$todo = [];
rp_say("");
foreach ($grades as $g) {
    list($key, $url) = $TARGETS[$g];
    $now = isset($map[$key]) ? (string)$map[$key] : '(not set)';
    if ($now === $url) {
        rp_say("grade " . $g . " (" . $key . ") is already pointed at its build. Nothing to do.");
        continue;
    }
    if ($now !== '(not set)') {
        rp_say("grade " . $g . " (" . $key . ") currently -> " . $now);
        rp_say("  STOP AND READ: it already points somewhere. Find out what that is");
        rp_say("  before replacing it.");
    } else {
        rp_say("grade " . $g . " (" . $key . ") currently -> the shared subject entry");
    }
    /* Host-locked the same way pqpg_ehel_app_base() locks it, so a bad value
     * can never be written here and then silently ignored at launch. */
    if (strpos($url, RP_HOST) !== 0) {
        rp_fail("target for grade " . $g . " is not on the app zone. Nothing was changed.");
    }
    $todo[$key] = $url;
}

if (empty($todo)) {
    rp_say("");
    rp_say("Nothing to change.");
    exit(0);
}

foreach ($todo as $k => $v) {
    $map[$k] = $v;
}
$new = json_encode($map, JSON_UNESCAPED_SLASHES);

rp_say("");
rp_say("overrides after the write: " . count($map));
foreach ($map as $k => $v) {
    rp_say("  " . $k . " -> " . $v . (isset($todo[$k]) ? "   <-- changing" : ""));
}

if (!$apply) {
    rp_say("");
    rp_say("Report only. Re-run with --apply to write it.");
    exit(0);
}

set_config(RP_SETTING, $new, RP_PLUGIN);

/* ---------------------------------------------------------------- read back
 * set_config() returning true is not evidence the value is stored; read it.
 * And check every OTHER key survived, not just the ones being written - a map
 * that writes these correctly while dropping Grade 1's would pass a check on
 * our own keys alone and break a live course. */
$check = (string)get_config(RP_PLUGIN, RP_SETTING);
if ($check !== $new) {
    rp_fail("wrote the setting but read back something else:\n         " . $check);
}
$rt = json_decode($check, true);
if (!is_array($rt)) {
    rp_fail("the stored value is no longer valid JSON.");
}
foreach ($map as $k => $v) {
    if (($rt[$k] ?? null) !== $v) {
        rp_fail("the stored map lost or changed " . $k . ". Restore it by hand in\n"
            . "         Site administration > Plugins > Local plugins > Ehel app URL overrides.");
    }
}

rp_say("");
rp_say("APPLIED and read back clean, with all " . count($rt) . " override(s) intact.");
foreach ($todo as $k => $v) {
    rp_say("  " . $k . " -> " . $v);
}
rp_say("");
rp_say("It takes effect on the next launch. No cache to wait for, no deploy.");
rp_say("");
rp_say("To roll back, paste this into Site administration > Plugins >");
rp_say("Local plugins > Ehel app URL overrides:");
$rollback = $before;
rp_say("  " . (empty($rollback) ? "(clear the box)" : json_encode($rollback, JSON_UNESCAPED_SLASHES)));
/* This is the map EXACTLY as it was before this run, which is not the same as
 * "back to the subject entry" - and saying the latter would be wrong for any
 * grade that was already overridden. Grade 1 is the case that proves it: its
 * rollback target is grade-1-preview, the five-lesson build kept complete for
 * exactly this, not app/mathematics/index.html. A grade whose key was absent
 * before does go back to the entry, and for that one the line below says so. */
rp_say("");
rp_say("That restores the overrides exactly as they were before this run.");
foreach ($todo as $k => $v) {
    rp_say("  " . $k . " -> " . (isset($before[$k]) ? $before[$k] : "removed, i.e. " . RP_ENTRY));
}
rp_say("");
rp_say("Now delete this script.");
exit(0);
