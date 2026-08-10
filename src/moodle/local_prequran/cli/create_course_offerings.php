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
 * Anything published is reported and left alone — publishing is a commercial
 * act and a bulk run must not undo or overwrite one. ARCHIVED offerings are
 * ignored entirely rather than treated as existing: an archived offering is
 * retired, so it must not block a replacement from being created.
 *
 * An existing draft is UPDATED IN PLACE from this script's own defaults, which
 * means a whole-workspace re-run will overwrite fees, dates and capacity that
 * were set deliberately somewhere else — set_offering_fees.php's values among
 * them. Use --courses to name the one course you mean.
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
    'startdate' => '',
    'enddate' => '',
    'courses' => '',
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
    cli_writeln("  --startdate=<date>  YYYY-MM-DD; overrides the workspace terms");
    cli_writeln("  --enddate=<date>    YYYY-MM-DD; overrides the workspace terms");
    cli_writeln("  --courses=<ids>     comma-separated course idnumbers; only these are touched");
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

// Restrict the run to named courses. Without this the only way to add one
// missing offering is a run over every approved syllabus, and an existing draft
// is UPDATED in place from this script's defaults — which would blank the fees,
// dates and capacity that have since been set deliberately elsewhere. Matching
// is case-insensitive because idnumbers are typed by hand.
$onlycourses = [];
foreach (explode(',', (string)$options['courses']) as $one) {
    $one = core_text::strtolower(trim($one));
    if ($one !== '') { $onlycourses[$one] = true; }
}
$unmatched = $onlycourses;

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
$datesource = 'the workspace terms';

// Explicit dates win over the terms. Parsed strictly rather than with a bare
// strtotime: "2026-13-01" and "next tuesday" both produce a timestamp from a
// loose parse, and a silently wrong date on 40 offerings is worse than an
// error. The end is taken as the END of its day, so an offering that runs to
// 30 June covers 30 June rather than expiring as it begins.
$parsedate = function (string $value, bool $endofday) {
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $m)) {
        cli_error("Could not read '{$value}' as a date. Use YYYY-MM-DD.");
    }
    [, $y, $mo, $d] = array_map('intval', $m);
    if (!checkdate($mo, $d, $y)) {
        cli_error("'{$value}' is not a real date.");
    }
    // make_timestamp() rather than DateTime: it is Moodle's own helper, present
    // in every version this plugin runs on, and it applies the site timezone
    // the same way the portal does when it stores a date from the form.
    return $endofday
        ? make_timestamp($y, $mo, $d, 23, 59, 59)
        : make_timestamp($y, $mo, $d, 0, 0, 0);
};

$startraw = trim((string)$options['startdate']);
$endraw = trim((string)$options['enddate']);
if ($startraw !== '' || $endraw !== '') {
    if ($startraw === '' || $endraw === '') {
        cli_error('Pass both --startdate and --enddate, or neither.');
    }
    $startdate = $parsedate($startraw, false);
    $enddate = $parsedate($endraw, true);
    if ($enddate <= $startdate) {
        cli_error('--enddate must be after --startdate.');
    }
    $datesource = 'the command line';
}

if ($startdate === 0 && $enddate === 0) {
    cli_writeln('!! No academic terms for this workspace and no --startdate/--enddate given.');
    cli_writeln('!! Offerings will carry NO dates. Pass --startdate and --enddate, or create the');
    cli_writeln('!! terms in the Academic Calendar first — the syllabus schedule reads them too.');
} else {
    cli_writeln(sprintf('Dates from %s: %s to %s',
        $datesource,
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

    if ($onlycourses && !isset($onlycourses[core_text::strtolower($label)])) {
        continue;
    }
    // Tracked separately: emptying $onlycourses would switch the filter off
    // mid-loop and let every remaining course through.
    unset($unmatched[core_text::strtolower($label)]);

    // Archived offerings are retired, so one must not block a replacement being
    // created. Excluded from the lookup rather than skipped afterwards: leaving
    // it in would make this a get_record over two rows once a replacement
    // exists, which returns whichever the database happens to order first.
    $existing = $DB->get_record_select('local_prequran_course_offering',
        'workspaceid = :ws AND moodlecourseid = :courseid AND status <> :archived',
        ['ws' => $workspaceid, 'courseid' => (int)$course->id, 'archived' => 'archived'],
        '*', IGNORE_MULTIPLE);
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
// A --courses value that matched nothing is silence otherwise: the run reports
// "0 created" and reads like the work was already done.
foreach (array_keys($unmatched) as $missed) {
    cli_writeln("!! --courses named '{$missed}', which has no approved syllabus in this workspace and year.");
}
cli_writeln(sprintf('%s: %d created, %d updated, %d skipped, %d failed',
    $dryrun ? 'dry run' : 'done', $created, $updated, $skipped, $failed));
if (!$dryrun && ($created || $updated) && $status === 'draft') {
    cli_writeln('Every offering is a DRAFT: not enrollable and not visible to families until published.');
    cli_writeln('Fees, refund policy, instalments and scholarships are deliberately unset — fill them in the portal.');
}
