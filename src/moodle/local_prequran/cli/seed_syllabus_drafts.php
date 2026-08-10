<?php
/**
 * Seed draft course syllabuses in bulk.
 *
 * Creates one DRAFT syllabus per course from the payload produced by
 * tools/export-syllabus-drafts.js, so a school starts from a written draft per
 * course rather than forty empty forms.
 *
 * Usage (from the Moodle root):
 *   php local/prequran/cli/seed_syllabus_drafts.php \
 *       --file=/path/to/syllabus-drafts.json --workspaceid=23 --year=2026 [--dry-run]
 *
 * It writes through pqsyl_save(), never straight into the table, so the
 * plugin's own validation, policy encoding and audit trail all run. That also
 * means the length caps in pqsyl_save apply; the exporter reports anything
 * close to one rather than letting the server trim in silence.
 *
 * WHAT IT REFUSES TO TOUCH, and why it matters:
 * pqsyl_save() deliberately sends an APPROVED syllabus back to draft when it is
 * edited — correct for a teacher revising their own work, catastrophic for a
 * bulk run, which would silently un-approve every syllabus a school had already
 * signed off. So a course whose syllabus is anything other than absent or
 * 'draft' is skipped and reported.
 *
 * --reopen lifts that refusal for a correction to an already-approved syllabus,
 * and REQUIRES --courses naming the ones to touch. The pairing is the whole
 * point: an unqualified --force would un-approve a school's entire catalogue in
 * one keystroke, whereas naming two courses is a statement about two courses.
 * Each reopened syllabus returns to draft and has to be approved again, which
 * is stated at the end of the run so it cannot be forgotten.
 *
 * @package   local_prequran
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
// accesslib BEFORE syllabus_portallib, and in that order: the syllabus library
// says at the top that it requires accesslib, and pqsyl_ready() calls
// pqh_table_exists_safe() from it on the very first line. Loading only the
// syllabus library gives a script that starts, prints --help perfectly, and
// dies the moment it does anything — which is exactly how it failed the first
// time it was run for real. local/hubredirect/syllabus.php loads them in this
// same order.
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/syllabus_portallib.php');

[$options, $unrecognised] = cli_get_params([
    'file' => '',
    'workspaceid' => 0,
    'year' => 0,
    'courses' => '',
    'reopen' => false,
    'dry-run' => false,
    'help' => false,
], ['h' => 'help']);

if ($options['help'] || $unrecognised) {
    cli_writeln("Seed draft syllabuses from a JSON payload.\n");
    cli_writeln("  --file=<path>       payload from tools/export-syllabus-drafts.js (required)");
    cli_writeln("  --workspaceid=<id>  the school's workspace (required)");
    cli_writeln("  --year=<YYYY>       academic year, 2026 = 2026-27 (required)");
    cli_writeln("  --courses=<ids>     comma-separated course idnumbers; only these are touched");
    cli_writeln("  --reopen            also rewrite approved syllabuses (requires --courses)");
    cli_writeln("  --dry-run           report what would happen, write nothing");
    exit($unrecognised ? 1 : 0);
}

$file = (string)$options['file'];
$workspaceid = (int)$options['workspaceid'];
$year = (int)$options['year'];
$dryrun = (bool)$options['dry-run'];
$reopen = (bool)$options['reopen'];

$onlycourses = [];
foreach (explode(',', (string)$options['courses']) as $one) {
    $one = core_text::strtolower(trim($one));
    if ($one !== '') { $onlycourses[$one] = true; }
}
$unmatched = $onlycourses;
if ($reopen && !$onlycourses) {
    cli_error('--reopen requires --courses. Reopening every approved syllabus in a workspace is not '
        . 'a thing this script will do on one flag; name the courses you are correcting.');
}

if ($file === '' || !is_readable($file)) {
    cli_error("--file is required and must be readable: {$file}");
}
if ($workspaceid <= 0) {
    cli_error('--workspaceid is required.');
}
if ($year < 2000 || $year > 2100) {
    cli_error('--year is required, as a four-digit year (2026 = 2026-27).');
}
if (!pqsyl_ready()) {
    cli_error('The syllabus table does not exist. Run the local_prequran upgrade first.');
}

$payload = json_decode(file_get_contents($file), true);
if (!is_array($payload) || empty($payload['entries'])) {
    cli_error('The payload has no entries. Re-run tools/export-syllabus-drafts.js.');
}

// The workspace has to exist, or every course lookup below is against nothing.
if (!$DB->record_exists('local_prequran_workspace', ['id' => $workspaceid])) {
    cli_error("No workspace with id {$workspaceid}.");
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid]);
$consumercontext = (object)['consumerid' => (int)($workspace->consumerid ?? 0)];

// The actor recorded against every row. admin is honest for a bulk seed: it was
// not written by the teacher whose name would otherwise sit in the audit trail.
$actorid = (int)get_admin()->id;

cli_writeln(sprintf(
    "%s %d entr%s into workspace %d (%s), academic year %d-%s",
    $dryrun ? 'DRY RUN —' : 'Seeding',
    count($payload['entries']),
    count($payload['entries']) === 1 ? 'y' : 'ies',
    $workspaceid,
    $workspace->name ?? '?',
    $year,
    substr((string)($year + 1), 2)
));
cli_writeln(str_repeat('-', 72));

$created = 0;
$updated = 0;
$skipped = 0;
$missing = 0;
$reopened = [];

foreach ($payload['entries'] as $entry) {
    $idnumber = (string)($entry['idnumber'] ?? '');
    if ($idnumber === '') {
        cli_writeln("  ?                 SKIP  entry has no idnumber");
        $skipped++;
        continue;
    }

    if ($onlycourses && !isset($onlycourses[core_text::strtolower($idnumber)])) {
        continue;
    }
    // Tracked separately: emptying $onlycourses would switch the filter off
    // mid-loop and let every remaining entry through.
    unset($unmatched[core_text::strtolower($idnumber)]);

    $course = $DB->get_record('course', ['idnumber' => $idnumber], 'id,fullname', IGNORE_MISSING);
    if (!$course) {
        cli_writeln(sprintf("  %-18s MISS  no Moodle course with this idnumber", $idnumber));
        $missing++;
        continue;
    }

    $existing = pqsyl_get($workspaceid, (int)$course->id, $year);
    $status = $existing ? (string)$existing->status : '';
    if ($existing && $status !== 'draft' && !$reopen) {
        cli_writeln(sprintf("  %-18s SKIP  already '%s' — refusing to reopen it", $idnumber, $status));
        $skipped++;
        continue;
    }
    if ($existing && $status !== 'draft') {
        cli_writeln(sprintf("  %-18s REOPEN  was '%s' — pqsyl_save returns it to draft", $idnumber, $status));
        $reopened[] = $idnumber;
    }

    $data = [
        'overview' => (string)($entry['overview'] ?? ''),
        'teacher_intro' => (string)($entry['teacher_intro'] ?? ''),
        'contact' => (string)($entry['contact'] ?? ''),
    ];
    foreach ((array)($entry['policies'] ?? []) as $key => $text) {
        $data['policy_' . $key] = (string)$text;
    }

    if ($dryrun) {
        cli_writeln(sprintf(
            "  %-18s %s  %s (%d chars overview, %d policies)",
            $idnumber,
            $existing ? 'would UPDATE' : 'would CREATE',
            $course->fullname,
            strlen($data['overview']),
            count((array)($entry['policies'] ?? []))
        ));
        $existing ? $updated++ : $created++;
        continue;
    }

    try {
        pqsyl_save($workspaceid, $consumercontext, (int)$course->id, $year, $actorid, $data);
        cli_writeln(sprintf("  %-18s %s  %s", $idnumber, $existing ? 'UPDATED' : 'CREATED', $course->fullname));
        $existing ? $updated++ : $created++;
    } catch (Throwable $e) {
        cli_writeln(sprintf("  %-18s FAIL  %s", $idnumber, $e->getMessage()));
        $skipped++;
    }
}

cli_writeln(str_repeat('-', 72));
cli_writeln(sprintf(
    "%s: %d created, %d updated, %d skipped, %d course(s) not found",
    $dryrun ? 'dry run' : 'done',
    $created,
    $updated,
    $skipped,
    $missing
));
foreach (array_keys($unmatched) as $missed) {
    cli_writeln("!! --courses named '{$missed}', which is not in the payload.");
}
if ($missing) {
    cli_writeln("A missing course means the catalogue has not been synced, or the idnumber differs. Check catalog_sync before re-running.");
}
if ($reopened) {
    cli_writeln(sprintf('%d syllabus(es) were reopened and are back in draft: %s',
        count($reopened), implode(', ', $reopened)));
    cli_writeln('They are NOT approved any more. Re-run approve_syllabus_drafts.php, or families lose access to them.');
}
if (!$dryrun && ($created || $updated)) {
    cli_writeln("Every syllabus is a DRAFT. A school administrator still has to approve each one.");
}
