<?php
/**
 * Approve every draft syllabus in a workspace, in bulk.
 *
 * Usage (from the Moodle root):
 *   php local/prequran/cli/approve_syllabus_drafts.php \
 *       --workspaceid=23 --year=2026 --actorid=<userid> [--dry-run]
 *
 * Approval is a two-step transition, not one: pqsyl_transition() only approves
 * a syllabus already in 'in_review', so each draft is submitted and then
 * approved. Both steps go through pqsyl_transition() rather than touching the
 * table, so the status rules, the audit rows and the approver's identity are
 * all recorded the way the portal records them.
 *
 * --actorid is REQUIRED and is not defaulted to admin. pqsyl_can_approve()
 * asks pqh_user_can_manage_workspace(), which wants platform_admin, owner or
 * admin ON THAT WORKSPACE — a Moodle site administrator with no workspace role
 * fails it. Defaulting to admin would therefore throw once per syllabus and
 * read like forty separate failures instead of one wrong argument, so the
 * permission is checked once, before anything is written.
 *
 * WHAT APPROVAL MEANS HERE: a syllabus is created with visibility 'enrolled',
 * so approving it is what makes it readable by students and parents. Drafts are
 * not visible to them. Any {{...}} placeholder still in the text becomes
 * visible at the moment of approval. This script reports how many placeholders
 * it is about to publish and requires --i-know-it-has-placeholders to proceed
 * when there are any, because "40 approved" and "40 approved, 205 placeholders
 * now in front of families" deserve different levels of deliberateness.
 *
 * @package   local_prequran
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
// accesslib first — syllabus_portallib depends on it, and pqsyl_ready() calls
// pqh_table_exists_safe() on its first line.
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/syllabus_portallib.php');

[$options, $unrecognised] = cli_get_params([
    'workspaceid' => 0,
    'year' => 0,
    'actorid' => 0,
    'note' => '',
    'dry-run' => false,
    'i-know-it-has-placeholders' => false,
    'help' => false,
], ['h' => 'help']);

if ($options['help'] || $unrecognised) {
    cli_writeln("Approve every draft syllabus in a workspace.\n");
    cli_writeln("  --workspaceid=<id>  the school's workspace (required)");
    cli_writeln("  --year=<YYYY>       academic year, 2026 = 2026-27 (required)");
    cli_writeln("  --actorid=<userid>  the approving school administrator (required)");
    cli_writeln("  --note=<text>       recorded against each approval");
    cli_writeln("  --dry-run           report what would happen, write nothing");
    cli_writeln("  --i-know-it-has-placeholders   proceed even though {{...}} text will go live");
    exit($unrecognised ? 1 : 0);
}

$workspaceid = (int)$options['workspaceid'];
$year = (int)$options['year'];
$actorid = (int)$options['actorid'];
$dryrun = (bool)$options['dry-run'];
$note = (string)$options['note'];

if ($workspaceid <= 0) {
    cli_error('--workspaceid is required.');
}
if ($year < 2000 || $year > 2100) {
    cli_error('--year is required, as a four-digit year (2026 = 2026-27).');
}
if ($actorid <= 0) {
    cli_error('--actorid is required: the user who is approving. See the note in this file about why it is not defaulted.');
}
if (!pqsyl_ready()) {
    cli_error('The syllabus table does not exist. Run the local_prequran upgrade first.');
}
if (!$DB->record_exists('user', ['id' => $actorid, 'deleted' => 0])) {
    cli_error("No active user with id {$actorid}.");
}
$actor = $DB->get_record('user', ['id' => $actorid], 'id,firstname,lastname,username');

// Checked ONCE. Forty identical permission errors would look like a broken
// script rather than a wrong --actorid.
if (!pqsyl_can_approve($actorid, $workspaceid)) {
    cli_error("User {$actorid} ({$actor->username}) cannot approve in workspace {$workspaceid}. "
        . "Approval needs the workspace role platform_admin, owner or admin — being a Moodle site "
        . "administrator is not enough. Pick a user who manages this workspace.");
}

$rows = $DB->get_records('local_prequran_syllabus',
    ['workspaceid' => $workspaceid, 'academicyear' => $year], '', 'id,moodlecourseid,status');
if (!$rows) {
    cli_error("No syllabuses in workspace {$workspaceid} for {$year}.");
}

// Count what is about to become visible to students and parents.
$targets = [];
$placeholders = 0;
foreach ($rows as $row) {
    if (!in_array((string)$row->status, ['draft', 'in_review'], true)) {
        continue;
    }
    $full = $DB->get_record('local_prequran_syllabus', ['id' => $row->id]);
    $text = (string)$full->overview . (string)$full->teacher_intro . (string)$full->contact . (string)$full->policies_json;
    $found = preg_match_all('/\{\{[^}]*\}\}/', $text);
    $placeholders += $found;
    $targets[] = (object)['row' => $full, 'placeholders' => $found];
}

if (!$targets) {
    cli_writeln('Nothing to approve — no syllabus is in draft or awaiting approval.');
    exit(0);
}

cli_writeln(sprintf('%s %d syllabus(es) in workspace %d, year %d-%s, approving as %s %s (id %d)',
    $dryrun ? 'DRY RUN —' : 'Approving',
    count($targets), $workspaceid, $year, substr((string)($year + 1), 2),
    $actor->firstname, $actor->lastname, $actorid));

if ($placeholders > 0) {
    cli_writeln('');
    cli_writeln(sprintf('!! %d unfilled {{...}} placeholder(s) across %d syllabus(es).', $placeholders, count($targets)));
    cli_writeln('!! These are created with visibility \'enrolled\', so approving publishes them to students and parents.');
    if (!$dryrun && !$options['i-know-it-has-placeholders']) {
        cli_error('Refusing to publish placeholder text without --i-know-it-has-placeholders. Re-run with it to proceed, or fill the placeholders first.');
    }
}
cli_writeln(str_repeat('-', 72));

$approved = 0;
$failed = 0;

foreach ($targets as $target) {
    $row = $target->row;
    $course = $DB->get_record('course', ['id' => $row->moodlecourseid], 'id,idnumber,fullname', IGNORE_MISSING);
    $label = $course ? $course->idnumber : ('course ' . $row->moodlecourseid);

    if ($dryrun) {
        cli_writeln(sprintf('  %-22s would APPROVE (from %s)%s', $label, $row->status,
            $target->placeholders ? sprintf('  [%d placeholder(s)]', $target->placeholders) : ''));
        $approved++;
        continue;
    }

    try {
        // draft -> in_review -> approved. A row already in review skips step one.
        if ((string)$row->status === 'draft') {
            pqsyl_transition($workspaceid, (int)$row->moodlecourseid, $year, $actorid, 'submit');
        }
        pqsyl_transition($workspaceid, (int)$row->moodlecourseid, $year, $actorid, 'approve', $note);
        cli_writeln(sprintf('  %-22s APPROVED  %s', $label, $course->fullname ?? ''));
        $approved++;
    } catch (Throwable $e) {
        cli_writeln(sprintf('  %-22s FAIL  %s', $label, $e->getMessage()));
        $failed++;
    }
}

cli_writeln(str_repeat('-', 72));
cli_writeln(sprintf('%s: %d approved, %d failed', $dryrun ? 'dry run' : 'done', $approved, $failed));
if (!$dryrun && $approved) {
    cli_writeln('Editing any approved syllabus returns it to draft and it must be approved again.');
}
