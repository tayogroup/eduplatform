<?php
/**
 * Set registration and materials fees on a workspace's course offerings.
 *
 * Usage (from the Moodle root):
 *   php local/prequran/cli/set_offering_fees.php --workspaceid=23 --actorid=4 \
 *       --registration=0.00 --materials=0.00 [--include-published] [--dry-run]
 *
 * WHY THIS EXISTS. create_course_offerings.php deliberately leaves both fee
 * columns EMPTY rather than zero, so that nobody could mistake "not decided
 * yet" for "we have decided it is nothing". That was the right default at
 * creation time and the wrong thing to ship, because the two pages disagree
 * about what empty means:
 *
 *   - course_offerings.php (staff) adds the two through pqfin_money_to_cents(),
 *     which maps '' to 0, and prints "Fees 0.00".
 *   - course_catalog_browse.php (families) prints the itemisation
 *     UNCONDITIONALLY: "Tuition 200, registration , materials . Total USD
 *     200.00." An empty string does not suppress the word in front of it.
 *
 * So an undecided fee is already being shown to families as nothing, in a
 * sentence with two holes in it. This script makes the value explicit, which
 * fixes the sentence and turns an accident into a statement somebody chose.
 *
 * ONLY the two fee columns and timemodified are written. Not a whole-record
 * update: the portal's save path rebuilds every field from a form, and a bulk
 * run that did the same would silently rewrite dates, capacity and status from
 * whatever this script happened to know about.
 *
 * PUBLISHED OFFERINGS ARE SKIPPED unless --include-published. A published
 * offering can already have enrolment requests attached that were made at the
 * old price; changing what those families owe is not a bulk operation.
 *
 * @package   local_prequran
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
// course_offeringlib needs course_catalog.php's key helpers; see the same note
// in create_course_offerings.php. Required rather than assumed.
require_once($CFG->dirroot . '/local/hubredirect/course_catalog.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');

[$options, $unrecognised] = cli_get_params([
    'workspaceid' => 0,
    'actorid' => 0,
    'registration' => '',
    'materials' => '',
    'include-published' => false,
    'dry-run' => false,
    'help' => false,
], ['h' => 'help']);

if ($options['help'] || $unrecognised) {
    cli_writeln("Set registration and materials fees on a workspace's offerings.\n");
    cli_writeln('  --workspaceid=<id>    required');
    cli_writeln('  --actorid=<userid>    required, recorded on every audit row');
    cli_writeln('  --registration=<amt>  required, e.g. 0.00');
    cli_writeln('  --materials=<amt>     required, e.g. 0.00');
    cli_writeln('  --include-published   also change published offerings (see the note in this file)');
    cli_writeln('  --dry-run             report what would change, write nothing');
    exit($unrecognised ? 1 : 0);
}

$workspaceid = (int)$options['workspaceid'];
$actorid = (int)$options['actorid'];
$dryrun = (bool)$options['dry-run'];
$includepublished = (bool)$options['include-published'];

if ($workspaceid <= 0) { cli_error('--workspaceid is required.'); }
if ($actorid <= 0) { cli_error('--actorid is required.'); }

// Both amounts must be given explicitly. Defaulting either one to '' would
// reintroduce the blank this script exists to remove.
foreach (['registration', 'materials'] as $flag) {
    if (trim((string)$options[$flag]) === '') {
        cli_error("--{$flag} is required. Pass 0.00 to state that there is no such fee.");
    }
}
$registration = pqfin_normalize_money_string((string)$options['registration']);
$materials = pqfin_normalize_money_string((string)$options['materials']);
if ($registration === '') {
    cli_error("--registration='{$options['registration']}' is not a money amount.");
}
if ($materials === '') {
    cli_error("--materials='{$options['materials']}' is not a money amount.");
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) { cli_error("No workspace with id {$workspaceid}."); }
if (!$DB->record_exists('user', ['id' => $actorid, 'deleted' => 0])) { cli_error("No active user with id {$actorid}."); }
if (!pqh_user_can_manage_workspace($actorid, $workspaceid)) {
    cli_error("User {$actorid} cannot manage workspace {$workspaceid}.");
}

// The fee columns arrive with upgrade 202607310028. Checked rather than
// assumed, the same way course_offerings.php checks before writing them.
foreach (['registration_fee', 'materials_fee'] as $column) {
    if (!pqh_table_has_field_safe('local_prequran_course_offering', $column)) {
        cli_error("Column {$column} does not exist. Run the local_prequran upgrade first.");
    }
}

$offerings = $DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'course_key ASC');
if (!$offerings) { cli_error("No offerings in workspace {$workspaceid}."); }

cli_writeln(sprintf('%s registration=%s materials=%s on workspace %d (%s)',
    $dryrun ? 'DRY RUN —' : 'Setting', $registration, $materials, $workspaceid, $workspace->name ?? '?'));
cli_writeln(str_repeat('-', 78));

$changed = 0; $unchanged = 0; $skipped = 0;
$now = time();

foreach ($offerings as $offering) {
    $status = (string)$offering->status;
    $label = (string)$offering->course_key;

    if ($status === 'published' && !$includepublished) {
        cli_writeln(sprintf('  %-24s SKIP  published — families may already have requested at the old price', $label));
        $skipped++;
        continue;
    }
    if ($status === 'archived') {
        cli_writeln(sprintf('  %-24s SKIP  archived', $label));
        $skipped++;
        continue;
    }

    $was = sprintf("reg '%s' / mat '%s'",
        (string)($offering->registration_fee ?? ''), (string)($offering->materials_fee ?? ''));

    if ((string)($offering->registration_fee ?? '') === $registration
            && (string)($offering->materials_fee ?? '') === $materials) {
        cli_writeln(sprintf('  %-24s ok    already %s', $label, $was));
        $unchanged++;
        continue;
    }

    if ($dryrun) {
        cli_writeln(sprintf('  %-24s would set  %s -> reg \'%s\' / mat \'%s\'  [%s]',
            $label, $was, $registration, $materials, $status));
        $changed++;
        continue;
    }

    $DB->update_record('local_prequran_course_offering', (object)[
        'id' => (int)$offering->id,
        'registration_fee' => $registration,
        'materials_fee' => $materials,
        'timemodified' => $now,
    ]);
    pqco_course_audit('offering_fees_updated', 'course_offering', (int)$offering->id, [
        'consumerid' => (int)($offering->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'offeringid' => (int)$offering->id,
        'actorid' => $actorid,
        'from' => [
            'registration_fee' => (string)($offering->registration_fee ?? ''),
            'materials_fee' => (string)($offering->materials_fee ?? ''),
        ],
        'to' => ['registration_fee' => $registration, 'materials_fee' => $materials],
        'source' => 'cli/set_offering_fees.php',
    ]);
    cli_writeln(sprintf('  %-24s SET   %s -> reg \'%s\' / mat \'%s\'  [%s]',
        $label, $was, $registration, $materials, $status));
    $changed++;
}

cli_writeln(str_repeat('-', 78));
cli_writeln(sprintf('%s: %d changed, %d already correct, %d skipped',
    $dryrun ? 'dry run' : 'done', $changed, $unchanged, $skipped));
if (!$dryrun && $changed) {
    cli_writeln('The browse page prints the itemisation, so families now read a complete sentence.');
    cli_writeln('Refund policy is a separate field and is still unset — the browse page hides that row when empty.');
}
