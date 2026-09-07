<?php
/**
 * Point Grade 2 Mathematics at the nine-lesson standalone build.
 *
 * Changes exactly one Moodle config value:
 *   local_prequran / ehel_app_url_overrides
 * which pqpg_ehel_app_base() reads to send a single course somewhere other than
 * its subject entry. Nothing is deployed and no file is edited.
 *
 * REPORTS BY DEFAULT. Pass --apply to write. Run it once with no argument first
 * and read what it says the before and after will be.
 *
 * Run it from the DOCROOT, not from the home directory:
 *     cd /home/ehelacad/quraantest.academy
 *     php <thisfile>.php            # report
 *     php <thisfile>.php --apply    # write
 * The require below is __DIR__-relative, so a home-directory run fails loudly
 * rather than doing something surprising.
 *
 * HOW THIS DIFFERS FROM repoint-grade-1.php, and it is the whole difference:
 * Grade 1 was already overridden (preview -> v2), so that script MOVED a value.
 * Grade 2 has never been overridden - it launches at the shared subject entry
 * like every other grade - so the expected before-state here is "not set", and
 * an existing value means somebody has pointed this course somewhere already.
 * That is a stop-and-read, not something to overwrite.
 *
 * WHAT ROUTING GRADE 2 HERE COSTS, stated because the setting cannot state it:
 * the standalone build reports progress under its own unit namespace
 * (l01..l09), not the course's fifteen term-ordered units. The live group
 * board, resume and last-seen all work; the gradebook will not show fifteen
 * units of completion, because nine strand lessons are not those fifteen
 * units. See grade-2-app/README.md :: THE UNIT PROBLEM.
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
const RP_COURSE   = 'ehel-math-g02';
const RP_EXPECTDB = 'ehelacad_quraantest';
const RP_TO       = 'https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/grade-2-lessons/index.html';
// the shared subject entry, which is where this course goes today and where
// clearing the key sends it back to
const RP_ENTRY    = 'https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/index.html';

$apply = in_array('--apply', $argv ?? [], true);

fwrite(STDOUT, "\n  Repoint " . RP_COURSE . " -> grade-2-lessons (" . ($apply ? "APPLY" : "report only") . ")\n");
fwrite(STDOUT, "  " . str_repeat('-', 66) . "\n");

/* ---------------------------------------------------------------- fence 1
 * Identify the install by its DATABASE, never by wwwroot. This box hosts nine
 * Moodles and this config serves many hostnames, so from the CLI wwwroot reads
 * https://eduplatform.ai on the RIGHT install - a wwwroot guard fires falsely
 * on exactly the machine we want.
 *
 * The database is SHARED: one Moodle installation behind edufortomorrow.com,
 * uniso.site and quraantest.academy. So it excludes the other eight Moodles on
 * the box, which is its job, but it does not narrow within this one - hence
 * fence 2. */
rp_say("database : " . $CFG->dbname);
rp_say("wwwroot  : " . $CFG->wwwroot . "   (not used to identify the install)");
if ($CFG->dbname !== RP_EXPECTDB) {
    rp_fail("this is not the expected installation. Wanted database " . RP_EXPECTDB
        . ", found " . $CFG->dbname . ". Nothing was changed.");
}

/* ---------------------------------------------------------------- fence 2
 * The consumer that owns the K-12 courses must actually live here. Matched on
 * slug, and TWO slugs are accepted because this one has been renamed once
 * already (ehel-primary -> ehel-k12). If neither is found the script REFUSES
 * but prints the slugs that DO exist, so a false negative comes back as a
 * diagnostic rather than a dead end. */
if (!$DB->get_manager()->table_exists('local_prequran_consumer')) {
    rp_fail("local_prequran is not installed here (no consumer table). Nothing was changed.");
}
$wanted = ['ehel-k12', 'ehel-primary'];
list($insql, $inparams) = $DB->get_in_or_equal($wanted, SQL_PARAMS_NAMED);
$owner = $DB->get_records_select('local_prequran_consumer', "slug $insql", $inparams, 'id', 'id, slug, name, status');
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
rp_say("consumer : slug=" . $found->slug . " id=" . $found->id . " status=" . $found->status
    . "  (" . $DB->count_records('local_prequran_consumer') . " consumer rows total)");
if ($found->status !== 'active') {
    rp_say("WARNING: that consumer is not active. Read the line above before applying.");
}

/* ---------------------------------------------------------------- current */
$raw = (string)get_config(RP_PLUGIN, RP_SETTING);
rp_say("");
rp_say("current setting value:");
rp_say("  " . ($raw === '' ? "(empty - every course launches at its subject entry)" : $raw));

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

/* Print the WHOLE map, not just our key. This setting is shared - Grade 1
 * Maths lives in it too - and the one way to damage another course from here
 * is to write a map that has quietly lost an entry. Seeing them listed before
 * and after is the cheapest guard against that. */
rp_say("");
rp_say("overrides currently in place: " . (empty($map) ? "none" : count($map)));
foreach ($map as $k => $v) {
    rp_say("  " . $k . " -> " . $v);
}

$before = isset($map[RP_COURSE]) ? (string)$map[RP_COURSE] : '(not set)';
rp_say("");
rp_say(RP_COURSE . " currently -> " . $before
    . ($before === '(not set)' ? "   i.e. the shared subject entry" : ""));

if ($before === RP_TO) {
    rp_say("");
    rp_say("Already pointed at grade-2-lessons. Nothing to do.");
    exit(0);
}
if ($before !== '(not set)') {
    rp_say("");
    rp_say("STOP AND READ. Grade 2 has never been overridden, so a value here means");
    rp_say("somebody has pointed this course somewhere already. Find out what that is");
    rp_say("before replacing it. Re-run with --apply only if you meant to.");
}

/* ---------------------------------------------------------------- the write
 * Host-locked the same way pqpg_ehel_app_base() locks it, so a bad value can
 * never be written here and then silently ignored at launch. */
if (!preg_match('~^https://ehelacademy\.b-cdn\.net/~', RP_TO)) {
    rp_fail("target URL is not on the app zone. Nothing was changed.");
}

$map[RP_COURSE] = RP_TO;
$new = json_encode($map, JSON_UNESCAPED_SLASHES);

rp_say("");
rp_say("new setting value would be:");
rp_say("  " . $new);
rp_say("");
rp_say("overrides after the write: " . count($map));
foreach ($map as $k => $v) {
    rp_say("  " . $k . " -> " . $v);
}

if (!$apply) {
    rp_say("");
    rp_say("Report only. Re-run with --apply to write it.");
    exit(0);
}

set_config(RP_SETTING, $new, RP_PLUGIN);

/* ---------------------------------------------------------------- read back
 * set_config() returning true is not evidence the value is stored; read it.
 * And check every OTHER key survived, not just ours - a map that writes our
 * course correctly while dropping Grade 1's would pass a check on RP_COURSE
 * alone and break a live course. */
$check = (string)get_config(RP_PLUGIN, RP_SETTING);
if ($check !== $new) {
    rp_fail("wrote the setting but read back something else:\n         " . $check);
}
$rt = json_decode($check, true);
if (!is_array($rt) || ($rt[RP_COURSE] ?? '') !== RP_TO) {
    rp_fail("value stored but " . RP_COURSE . " does not resolve to the new URL.");
}
foreach ($map as $k => $v) {
    if (($rt[$k] ?? null) !== $v) {
        rp_fail("the stored map lost or changed " . $k . ". Restore it by hand in\n"
            . "         Site administration > Plugins > Local plugins > Ehel app URL overrides.");
    }
}

rp_say("");
rp_say("APPLIED and read back clean, with all " . count($rt) . " override(s) intact.");
rp_say(RP_COURSE . " -> " . RP_TO);
rp_say("");
rp_say("It takes effect on the next launch. No cache to wait for, no deploy.");
rp_say("");
rp_say("To roll back, remove just this course's key by pasting this into");
rp_say("Site administration > Plugins > Local plugins > Ehel app URL overrides:");
unset($map[RP_COURSE]);
rp_say("  " . (empty($map) ? "(clear the box)" : json_encode($map, JSON_UNESCAPED_SLASHES)));
rp_say("which sends Grade 2 back to " . RP_ENTRY);
rp_say("");
rp_say("Now delete this script.");
exit(0);
