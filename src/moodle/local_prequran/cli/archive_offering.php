<?php
/**
 * Archive a single course offering.
 *
 * Usage (from the Moodle root):
 *   php local/prequran/cli/archive_offering.php --offeringid=30 --workspaceid=23 \
 *       --actorid=4 [--dry-run]
 *
 * Archiving retires an offering without destroying anything: the row, its audit
 * trail and any enrolment requests attached to it all survive, and
 * pqco_learner_visible_statuses() excludes 'archived', so it leaves the
 * catalogue. Deleting would take the enrolment history with it.
 *
 * --workspaceid is required as well as --offeringid, and the offering must be
 * in it. Offering ids are global, so a mistyped id is otherwise a valid id
 * belonging to another school, and archiving quietly succeeds against the wrong
 * tenant's course.
 *
 * The current status, title and any enrolment counts are printed before the
 * write, because "archive offering 30" is only a safe instruction if 30 is the
 * offering the person meant.
 *
 * @package   local_prequran
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_catalog.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');

[$options, $unrecognised] = cli_get_params([
    'offeringid' => 0,
    'workspaceid' => 0,
    'actorid' => 0,
    'dry-run' => false,
    'help' => false,
], ['h' => 'help']);

if ($options['help'] || $unrecognised) {
    cli_writeln("Archive one course offering.\n");
    cli_writeln('  --offeringid=<id>   required');
    cli_writeln('  --workspaceid=<id>  required, and the offering must belong to it');
    cli_writeln('  --actorid=<userid>  required, recorded on the audit row');
    cli_writeln('  --dry-run           report what would happen, write nothing');
    exit($unrecognised ? 1 : 0);
}

$offeringid = (int)$options['offeringid'];
$workspaceid = (int)$options['workspaceid'];
$actorid = (int)$options['actorid'];
$dryrun = (bool)$options['dry-run'];

if ($offeringid <= 0) { cli_error('--offeringid is required.'); }
if ($workspaceid <= 0) { cli_error('--workspaceid is required.'); }
if ($actorid <= 0) { cli_error('--actorid is required.'); }

if (!$DB->record_exists('user', ['id' => $actorid, 'deleted' => 0])) { cli_error("No active user with id {$actorid}."); }
if (!pqh_user_can_manage_workspace($actorid, $workspaceid)) {
    cli_error("User {$actorid} cannot manage workspace {$workspaceid}.");
}

$offering = $DB->get_record('local_prequran_course_offering',
    ['id' => $offeringid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING);
if (!$offering) {
    cli_error("No offering {$offeringid} in workspace {$workspaceid}. "
        . 'Offering ids are global — check you have the right one before widening the search.');
}

cli_writeln(sprintf('Offering %d  %s  (%s)', $offeringid, $offering->title, $offering->course_key));
cli_writeln(sprintf('  status     %s', $offering->status));
cli_writeln(sprintf('  pricing    %s %s  reg %s  mat %s',
    $offering->pricing_currency, $offering->tuition_amount,
    var_export($offering->registration_fee, true), var_export($offering->materials_fee, true)));
cli_writeln(sprintf('  dates      %s -> %s',
    $offering->startdate ? userdate((int)$offering->startdate, '%Y-%m-%d') : 'unset',
    $offering->enddate ? userdate((int)$offering->enddate, '%Y-%m-%d') : 'unset'));

if (pqh_table_exists_safe('local_prequran_course_enrol_req')) {
    $rows = $DB->get_records_sql(
        'SELECT status, COUNT(1) AS n FROM {local_prequran_course_enrol_req} WHERE offeringid = :id GROUP BY status',
        ['id' => $offeringid]);
    if ($rows) {
        foreach ($rows as $row) {
            cli_writeln(sprintf('  requests   %-12s %d', $row->status, $row->n));
        }
        cli_writeln('  Archiving does not touch these — enrolled students stay enrolled in the Moodle course.');
    } else {
        cli_writeln('  requests   none');
    }
}

if ((string)$offering->status === 'archived') {
    cli_writeln('Already archived — nothing to do.');
    exit(0);
}

if ($dryrun) {
    cli_writeln(sprintf('DRY RUN — would archive (from %s). Nothing written.', $offering->status));
    exit(0);
}

$DB->update_record('local_prequran_course_offering', (object)[
    'id' => $offeringid,
    'status' => 'archived',
    'timemodified' => time(),
]);
pqco_course_audit('offering_archived', 'course_offering', $offeringid, [
    'consumerid' => (int)($offering->consumerid ?? 0),
    'workspaceid' => $workspaceid,
    'offeringid' => $offeringid,
    'actorid' => $actorid,
    'from' => ['status' => (string)$offering->status],
    'to' => ['status' => 'archived'],
    'source' => 'cli/archive_offering.php',
]);

cli_writeln(sprintf('Archived offering %d (was %s). It no longer appears in the catalogue.',
    $offeringid, $offering->status));
