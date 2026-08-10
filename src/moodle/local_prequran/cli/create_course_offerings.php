<?php
/**
 * Create a draft course offering for every course with an APPROVED syllabus.
 *
 * Usage (from the Moodle root):
 *   php local/prequran/cli/create_course_offerings.php \
 *       --workspaceid=23 --year=2026 --actorid=<userid> \
 *       --tuition=200 [--currency=USD] [--capacity=0] [--status=draft] [--dry-run]
 *
 * WHAT IT DERIVES, and what it refuses to invent.
 *
 * Title, summary, syllabus text and prerequisites come from the Moodle course
 * and the approved syllabus, so an offering reads the same as the syllabus a
 * family has already been shown. Start and end dates come from the workspace's
 * own academic terms (earliest start, latest end of the non-archived terms) —
 * "dates from the workspace terms" rather than a date this script picked.
 *
 * Money is passed in, never guessed. --tuition is required. Registration and
 * materials fees, refund policy, instalments and scholarships are left EMPTY
 * rather than defaulted, because an empty fee reads as "not set" in the portal
 * while a zero reads as "decided, and it is free".
 *
 * course_key is a slug of the Moodle idnumber (ehel-eng-g01 -> ehel_eng_g01).
 * These are custom offerings as far as pqh_course_catalog() is concerned:
 * pqh_normalize_course_key() only returns non-empty for a match in THAT
 * catalogue, which lists subjects like quran_tafsir, not the Ehel stage
 * courses. Deriving the slug from the idnumber keeps it stable and traceable
 * back to the course.
 *
 * SAFETY: an existing offering is only updated while it is still 'draft'.
 * Anything published or archived is reported and left alone — publishing is a
 * commercial act and a bulk run must not undo or overwrite one.
 *
 * @package   local_prequran
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/syllabus_portallib.php');
// course_offeringlib calls pqh_normalize_course_key()/…_keys() from
// course_catalog.php. The path this script uses (pqco_course_audit) does not
// reach them today, but the seeder shipped broken on exactly this assumption —
// a library required without its own dependency, which loads fine and dies on
// first use. course_catalog.php is a pure library behind a MOODLE_INTERNAL
// guard, so requiring it costs nothing and removes the trap.
require_once($CFG->dirroot . '/local/hubredirect/course_catalog.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');

[$options, $unrecognised] = cli_get_params([
    'workspaceid' => 0,
    'year' => 0,
    'actorid' => 0,
    'tuition' => '',
    'currency' => 'USD',
    'capacity' => 0,
    'status' => 'draft',
    'dry-run' => false,
    'help' => false,
], ['h' => 'help']);

if ($options['help'] || $unrecognised) {
    cli_writeln("Create draft course offerings for every approved syllabus.\n");
    cli_writeln("  --workspaceid=<id>  the school's workspace (required)");
    cli_writeln("  --year=<YYYY>       academic year, 2026 = 2026-27 (required)");
    cli_writeln("  --actorid=<userid>  who is creating them (required)");
    cli_writeln("  --tuition=<amount>  tuition per offering (required; no default)");
    cli_writeln("  --currency=<code>   default USD");
    cli_writeln("  --capacity=<n>      default 0 (unlimited)");
    cli_writeln("  --status=<state>    draft (default) or published");
    cli_writeln("  --dry-run           report what would happen, write nothing");
    exit($unrecognised ? 1 : 0);
}

$workspaceid = (int)$options['workspaceid'];
$year = (int)$options['year'];
$actorid = (int)$options['actorid'];
$tuition = trim((string)$options['tuition']);
$currency = strtoupper(trim((string)$options['currency']));
$capacity = max(0, (int)$options['capacity']);
$status = trim((string)$options['status']);
$dryrun = (bool)$options['dry-run'];

if ($workspaceid <= 0) { cli_error('--workspaceid is required.'); }
if ($year < 2000 || $year > 2100) { cli_error('--year is required (2026 = 2026-27).'); }
if ($actorid <= 0) { cli_error('--actorid is required.'); }
if ($tuition === '') { cli_error('--tuition is required. This script does not guess a price.'); }
if (!in_array($status, ['draft', 'published'], true)) { cli_error("--status must be draft or published, not '{$status}'."); }
if (!pqsyl_ready()) { cli_error('The syllabus table does not exist.'); }

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) { cli_error("No workspace with id {$workspaceid}."); }

$actor = $DB->get_record('user', ['id' => $actorid, 'deleted' => 0], '*', IGNORE_MISSING);
if (!$actor) { cli_error("No active user with id {$actorid}."); }
if (!pqh_user_can_manage_workspace($actorid, $workspaceid)) {
    cli_error("User {$actorid} cannot manage workspace {$workspaceid}.");
}
// pqco_course_audit() reads $USER for the actor, so the audit trail names the
// person passed in rather than whoever the CLI happens to boot as.
\core\session\manager::set_user($actor);

// Dates from the workspace's own terms, not from this script's imagination.
$terms = $DB->get_records_select('local_prequran_acad_term',
    'workspaceid = :ws AND status <> :archived', ['ws' => $workspaceid, 'archived' => 'archived'],
    'startdate ASC', 'id,title,startdate,enddate');
$startdate = 0;
$enddate = 0;
foreach ($terms as $term) {
    if ((int)$term->startdate > 0 && ($startdate === 0 || (int)$term->startdate < $startdate)) { $startdate = (int)$term->startdate; }
    if ((int)$term->enddate > $enddate) { $enddate = (int)$term->enddate; }
}
if ($startdate === 0 && $enddate === 0) {
    cli_writeln('!! No academic terms found for this workspace — offerings will carry no dates.');
} else {
    cli_writeln(sprintf('Term span from %d term(s): %s to %s',
        count($terms),
        $startdate ? userdate($startdate, '%e %B %Y') : '(none)',
        $enddate ? userdate($enddate, '%e %B %Y') : '(none)'));
}

// One offering per course that has an APPROVED syllabus.
$syllabuses = $DB->get_records('local_prequran_syllabus',
    ['workspaceid' => $workspaceid, 'academicyear' => $year, 'status' => 'approved']);
if (!$syllabuses) { cli_error("No approved syllabuses in workspace {$workspaceid} for {$year}."); }

$hasSessions = pqh_table_has_field_safe('local_prequran_course_offering', 'sessions_per_week');

cli_writeln(sprintf('%s %d approved syllabus(es) — tuition %s %s, capacity %d, status %s',
    $dryrun ? 'DRY RUN —' : 'Creating offerings for',
    count($syllabuses), $currency, $tuition, $capacity, $status));
cli_writeln(str_repeat('-', 76));

$created = 0; $updated = 0; $skipped = 0; $failed = 0;
$now = time();

foreach ($syllabuses as $syl) {
    $course = $DB->get_record('course', ['id' => $syl->moodlecourseid], 'id,idnumber,fullname,summary', IGNORE_MISSING);
    if (!$course) {
        cli_writeln(sprintf('  %-22s SKIP  course %d no longer exists', '?', $syl->moodlecourseid));
        $skipped++;
        continue;
    }
    $label = (string)$course->idnumber;
    $slug = trim(preg_replace('/[^a-z0-9]+/', '_', strtolower($label)) ?? '', '_');

    $existing = $DB->get_record('local_prequran_course_offering',
        ['workspaceid' => $workspaceid, 'moodlecourseid' => (int)$course->id], '*', IGNORE_MISSING);
    if ($existing && (string)$existing->status !== 'draft') {
        cli_writeln(sprintf("  %-22s SKIP  offering already '%s' — not overwriting", $label, $existing->status));
        $skipped++;
        continue;
    }

    $policies = pqsyl_decode_policies($syl);
    $record = (object)[
        'consumerid' => (int)($workspace->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'moodlecourseid' => (int)$course->id,
        'course_key' => $slug,
        'title' => core_text::substr((string)$course->fullname, 0, 255),
        'summary' => (string)$course->summary,
        'syllabus' => core_text::substr((string)$syl->overview, 0, 8000),
        'prerequisites' => core_text::substr((string)($policies['prerequisites'] ?? ''), 0, 4000),
        'startdate' => $startdate,
        'enddate' => $enddate,
        'capacity' => $capacity,
        'tuition_amount' => $tuition,
        'pricing_currency' => $currency,
        // Left empty on purpose: an empty fee reads as "not set", a zero reads
        // as "decided, and it is free".
        'registration_fee' => '',
        'materials_fee' => '',
        'installment_eligible' => 0,
        'scholarship_eligible' => 0,
        'tax_behavior' => 'not_configured',
        'refund_policy_label' => '',
        'payment_required_timing' => 'workspace_policy',
        'visibility' => 'workspace',
        'approval_mode' => 'admin_approval',
        'status' => $status,
        'timemodified' => $now,
    ];
    if ($hasSessions) {
        $record->sessions_per_week = 0;
        $record->session_minutes = 0;
    }

    if ($dryrun) {
        cli_writeln(sprintf('  %-22s would %s  %s', $label, $existing ? 'UPDATE' : 'CREATE', $course->fullname));
        $existing ? $updated++ : $created++;
        continue;
    }

    try {
        if ($existing) {
            $record->id = (int)$existing->id;
            $record->timecreated = (int)$existing->timecreated;
            $DB->update_record('local_prequran_course_offering', $record);
            $offeringid = (int)$existing->id;
            $action = 'offering_updated';
            $updated++;
        } else {
            $record->createdby = $actorid;
            $record->timecreated = $now;
            $offeringid = (int)$DB->insert_record('local_prequran_course_offering', $record);
            $action = 'offering_created';
            $created++;
        }
        pqco_course_audit($action, 'course_offering', $offeringid, [
            'consumerid' => (int)$record->consumerid,
            'workspaceid' => $workspaceid,
            'offeringid' => $offeringid,
            'status' => (string)$record->status,
            'title' => (string)$record->title,
            'moodlecourseid' => (int)$record->moodlecourseid,
            'pricing_currency' => (string)$record->pricing_currency,
            'tuition_amount' => (string)$record->tuition_amount,
        ]);
        cli_writeln(sprintf('  %-22s %s  %s', $label, $existing ? 'UPDATED' : 'CREATED', $course->fullname));
    } catch (Throwable $e) {
        cli_writeln(sprintf('  %-22s FAIL  %s', $label, $e->getMessage()));
        $failed++;
    }
}

cli_writeln(str_repeat('-', 76));
cli_writeln(sprintf('%s: %d created, %d updated, %d skipped, %d failed',
    $dryrun ? 'dry run' : 'done', $created, $updated, $skipped, $failed));
if (!$dryrun && ($created || $updated) && $status === 'draft') {
    cli_writeln('Every offering is a DRAFT: not enrollable and not visible to families until published.');
    cli_writeln('Fees, refund policy, instalments and scholarships are deliberately unset — fill them in the portal.');
}
