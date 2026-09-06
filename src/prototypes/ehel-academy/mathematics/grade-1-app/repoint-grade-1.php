<?php
/**
 * Repoint Grade 1 Mathematics from the five-lesson build to the seven-lesson one.
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
const RP_COURSE   = 'ehel-math-g01';
const RP_EXPECTDB = 'ehelacad_quraantest';
const RP_FROM     = 'https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/grade-1-preview/index.html';
const RP_TO       = 'https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/grade-1-v2/index.html';

$apply = in_array('--apply', $argv ?? [], true);

fwrite(STDOUT, "\n  Repoint " . RP_COURSE . " -> grade-1-v2 (" . ($apply ? "APPLY" : "report only") . ")\n");
fwrite(STDOUT, "  " . str_repeat('-', 66) . "\n");

/* ---------------------------------------------------------------- fence 1
 * Identify the install by its DATABASE, never by wwwroot. This box hosts nine
 * Moodles and this config serves many hostnames, so from the CLI wwwroot reads
 * https://eduplatform.ai on the RIGHT install - a wwwroot guard fires falsely
 * on exactly the machine we want.
 *
 * Note what this does and does not buy. The database is SHARED: one Moodle
 * installation behind edufortomorrow.com, uniso.site and quraantest.academy.
 * So it excludes the other eight Moodles on the box, which is its job, but it
 * does not narrow within this one - hence fence 2. One installation means one
 * config_plugins table, so there is exactly one setting to write either way. */
rp_say("database : " . $CFG->dbname);
rp_say("wwwroot  : " . $CFG->wwwroot . "   (not used to identify the install)");
if ($CFG->dbname !== RP_EXPECTDB) {
    rp_fail("this is not the expected installation. Wanted database " . RP_EXPECTDB
        . ", found " . $CFG->dbname . ". Nothing was changed.");
}

/* ---------------------------------------------------------------- fence 2
 * The consumer that owns the K-12 courses must actually live here.
 *
 * Matched on slug, which is the column the plugin resolves consumers by. TWO
 * slugs are accepted because this one has been renamed once already
 * (ehel-primary -> ehel-k12) and there is a further rename script in the tree:
 * pinning a single string would abort on the correct install the next time
 * somebody runs one. If neither is found the script REFUSES but prints the
 * slugs that do exist, so a false negative comes back as a diagnostic rather
 * than a dead end. */
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

$before = isset($map[RP_COURSE]) ? (string)$map[RP_COURSE] : '(not set)';
rp_say("");
rp_say(RP_COURSE . " currently -> " . $before);

if ($before === RP_TO) {
    rp_say("");
    rp_say("Already pointed at grade-1-v2. Nothing to do.");
    exit(0);
}
if ($before !== RP_FROM && $before !== '(not set)') {
    rp_say("");
    rp_say("NOTE: it is not on the expected grade-1-preview value. Read the line above");
    rp_say("      before applying - someone has pointed this course somewhere else.");
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

if (!$apply) {
    rp_say("");
    rp_say("Report only. Re-run with --apply to write it.");
    exit(0);
}

set_config(RP_SETTING, $new, RP_PLUGIN);

/* ---------------------------------------------------------------- read back
 * set_config() returning true is not evidence the value is stored; read it. */
$check = (string)get_config(RP_PLUGIN, RP_SETTING);
if ($check !== $new) {
    rp_fail("wrote the setting but read back something else:\n         " . $check);
}
$rt = json_decode($check, true);
if (!is_array($rt) || ($rt[RP_COURSE] ?? '') !== RP_TO) {
    rp_fail("value stored but " . RP_COURSE . " does not resolve to the new URL.");
}

rp_say("");
rp_say("APPLIED and read back clean.");
rp_say(RP_COURSE . " -> " . RP_TO);
rp_say("");
rp_say("It takes effect on the next launch. No cache to wait for, no deploy.");
rp_say("");
rp_say("To roll back, either paste this into");
rp_say("Site administration > Plugins > Local plugins > Ehel app URL overrides:");
$map[RP_COURSE] = RP_FROM;
rp_say("  " . json_encode($map, JSON_UNESCAPED_SLASHES));
rp_say("or clear that box to send Grade 1 back to the shared subject entry.");
rp_say("");
rp_say("Now delete this script.");
exit(0);
