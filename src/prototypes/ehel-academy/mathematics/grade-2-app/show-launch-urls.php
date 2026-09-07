<?php
/**
 * READ ONLY. The exact URL the app sends this learner to, per course, printed
 * side by side so Grade 1 and Grade 2 can be compared as bytes rather than as
 * descriptions.
 *
 * Writes nothing: no set_config, no DB write, no file — and deliberately does
 * NOT mint a token, which would insert a local_prequran_token_issue row. The
 * token has no bearing on which page you land on; the path does, and the path
 * is what this prints.
 *
 *     cd /home/ehelacad/quraantest.academy
 *     php <thisfile>.php            # user 1293
 *     php <thisfile>.php 1293
 *
 * WHY THIS AND NOT MORE READING. Everything checkable in the code is already
 * symmetric between the two grades — one override map holding both keys, one
 * URL builder (pqpg_ehel_launch_url), one resolver (pqpg_ehel_app_base), one
 * dashboard link builder (pqh_course_launch_link), and a normaliser that
 * passes both keys through untouched. Both courses exist, both are visible,
 * and this learner is actively enrolled in both. So either the server prints
 * the new path for ehel-math-g02 — in which case the routing is right and what
 * is left is the browser or the click — or it prints the old one, and this is
 * where that shows.
 *
 * Read the LANDING PATH line. That is the whole answer.
 */

define('CLI_SCRIPT', true);

function sl_say(string $m): void { fwrite(STDOUT, "  " . $m . "\n"); }
function sl_fail(string $m): void { fwrite(STDERR, "\n  ABORT: " . $m . "\n\n"); exit(1); }

if (!is_readable(__DIR__ . '/config.php')) {
    sl_fail("no config.php beside this script.\n"
        . "         Run it from the docroot: cd /home/ehelacad/quraantest.academy");
}
require(__DIR__ . '/config.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_catalog.php');

global $CFG, $DB;

if ($CFG->dbname !== 'ehelacad_quraantest') {
    sl_fail("wrong installation: " . $CFG->dbname);
}

$userid = isset($argv[1]) ? (int)$argv[1] : 1293;

fwrite(STDOUT, "\n  What the app sends user " . $userid . " to\n");
fwrite(STDOUT, "  " . str_repeat('=', 70) . "\n");

$raw = trim((string)get_config('local_prequran', 'ehel_app_url_overrides'));
sl_say("override setting is " . ($raw === '' ? "EMPTY" : strlen($raw) . " bytes"));

foreach (['ehel-math-g01', 'ehel-math-g02'] as $key) {
    sl_say("");
    sl_say(str_repeat('-', 70));
    sl_say("COURSE  " . $key);

    // 1. what the dashboard puts in the href
    if (function_exists('pqh_course_launch_link')) {
        $link = pqh_course_launch_link($key, $userid);
        sl_say("  dashboard href : " . $link->out(false));
        // the normaliser is the one step that could rewrite the key on the way
        // through, so print what it did rather than trusting that it did nothing
        $norm = function_exists('pqh_normalize_course_key') ? pqh_normalize_course_key($key) : '(n/a)';
        sl_say("  normalised key : " . ($norm === '' ? "'' (passed through untouched - correct)" : $norm));
    } else {
        sl_say("  dashboard href : pqh_course_launch_link() not loaded");
    }

    // 2. what course_launch.php will resolve when that href is followed
    $base = pqpg_ehel_app_base($key);
    if ($base === null) {
        sl_say("  app_base()     : NULL - not launchable");
        continue;
    }
    // the same expression pqpg_ehel_launch_url builds, minus the token, which
    // is minted (a DB insert) and does not affect the path
    $landing = $base['appurl'] . '?' . $base['levelparam'] . '=' . $base['stage'] . '&unit=1&pwsEndpoint=...&pwsToken=...&studentid=' . $userid;
    sl_say("  LANDING PATH   : " . $base['appurl']);
    sl_say("  full launch    : " . $landing);
}

sl_say("");
sl_say(str_repeat('=', 70));
sl_say("If both LANDING PATH lines name grade-1-v2 and grade-2-lessons, the");
sl_say("server is routing both correctly and nothing here is left to fix: what");
sl_say("remains is which link is being clicked, or a page the browser is");
sl_say("serving from its own cache. A launch URL already in a tab or a history");
sl_say("entry was resolved when it was minted and is never re-resolved.");
sl_say("");
sl_say("Nothing was written. Delete this script.");
exit(0);
