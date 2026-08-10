<?php
/**
 * Publish a workspace's draft course offerings, in bulk.
 *
 * Usage (from the Moodle root):
 *   php local/prequran/cli/publish_offerings.php --workspaceid=23 --actorid=4 \
 *       [--keys=ehel_eng_g02,ehel_math_g01] [--dry-run]
 *
 * WHY THIS EXISTS. The portal has no publish action: course_offerings.php
 * publishes only through the Edit form's status field, one offering at a time.
 * Forty-one of those is not a review, it is forty-one chances to mistype a
 * price, so the bulk path is a script that changes exactly one column.
 *
 * PUBLISHING IS THE COMMERCIAL ACT. pqco_learner_visible_statuses() admits
 * 'published' and 'closed', but only 'published' passes the enrolment guard in
 * course_catalog_browse.php — so this is the transition that lets a family
 * request a place and be quoted a price. Draft offerings are invisible; closed
 * ones are visible but inert.
 *
 * PLACEHOLDERS ARE THE REASON FOR THE GUARD, and they are worse here than at
 * syllabus approval. An approved syllabus is visible to enrolled students and
 * parents. A published offering carries its own copy of the syllabus overview
 * — create_course_offerings.php copies it into the offering's 'syllabus' field
 * — and course_catalog_browse.php shows that to ANYONE browsing the catalogue,
 * enrolled or not. So a {{...}} that a family had to log in to see becomes
 * shop-window text. --i-know-it-has-placeholders is required when any are
 * found, and the count is reported per offering first.
 *
 * Only 'draft' is published. Closed, archived and already-published offerings
 * are reported and left alone: reviving a closed offering or re-publishing an
 * archived one are decisions, not housekeeping.
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
    'workspaceid' => 0,
    'actorid' => 0,
    'keys' => '',
    'dry-run' => false,
    'i-know-it-has-placeholders' => false,
    'help' => false,
], ['h' => 'help']);

if ($options['help'] || $unrecognised) {
    cli_writeln("Publish a workspace's draft course offerings.\n");
    cli_writeln('  --workspaceid=<id>  required');
    cli_writeln('  --actorid=<userid>  required, recorded on every audit row');
    cli_writeln('  --keys=<a,b,c>      comma-separated course_keys; default is every draft');
    cli_writeln('  --dry-run           report what would happen, write nothing');
    cli_writeln('  --i-know-it-has-placeholders   publish even though {{...}} text goes into the catalogue');
    exit($unrecognised ? 1 : 0);
}

$workspaceid = (int)$options['workspaceid'];
$actorid = (int)$options['actorid'];
$dryrun = (bool)$options['dry-run'];

if ($workspaceid <= 0) { cli_error('--workspaceid is required.'); }
if ($actorid <= 0) { cli_error('--actorid is required.'); }

$onlykeys = [];
foreach (explode(',', (string)$options['keys']) as $one) {
    $one = core_text::strtolower(trim($one));
    if ($one !== '') { $onlykeys[$one] = true; }
}
$unmatched = $onlykeys;

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) { cli_error("No workspace with id {$workspaceid}."); }
if (!$DB->record_exists('user', ['id' => $actorid, 'deleted' => 0])) { cli_error("No active user with id {$actorid}."); }
if (!pqh_user_can_manage_workspace($actorid, $workspaceid)) {
    cli_error("User {$actorid} cannot manage workspace {$workspaceid}.");
}

$offerings = $DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'course_key ASC');
if (!$offerings) { cli_error("No offerings in workspace {$workspaceid}."); }

// Counted before anything is written, so the total is known while there is
// still a decision to make about it.
$targets = [];
$placeholders = 0;
$now = time();
foreach ($offerings as $offering) {
    $key = core_text::strtolower((string)$offering->course_key);
    if ($onlykeys && !isset($onlykeys[$key])) { continue; }
    unset($unmatched[$key]);
    if ((string)$offering->status !== 'draft') { continue; }
    $text = (string)$offering->syllabus . (string)$offering->summary . (string)$offering->prerequisites;
    $found = preg_match_all('/\{\{[^}]*\}\}/', $text);
    $placeholders += $found;
    $targets[] = (object)['row' => $offering, 'placeholders' => $found];
}

foreach (array_keys($unmatched) as $missed) {
    cli_writeln("!! --keys named '{$missed}', which is not an offering in this workspace.");
}

if (!$targets) {
    cli_writeln('Nothing to publish — no offering is in draft.');
    exit(0);
}

cli_writeln(sprintf('%s %d offering(s) in workspace %d (%s)',
    $dryrun ? 'DRY RUN —' : 'Publishing', count($targets), $workspaceid, $workspace->name ?? '?'));

if ($placeholders > 0) {
    cli_writeln('');
    cli_writeln(sprintf('!! %d unfilled {{...}} placeholder(s) across %d offering(s).', $placeholders, count($targets)));
    cli_writeln('!! The catalogue shows an offering\'s syllabus text to anyone browsing, not only to enrolled families.');
    if (!$dryrun && !$options['i-know-it-has-placeholders']) {
        cli_error('Refusing to publish placeholder text without --i-know-it-has-placeholders.');
    }
}
cli_writeln(str_repeat('-', 78));

$published = 0; $skipped = 0; $failed = 0;

foreach ($targets as $target) {
    $offering = $target->row;
    $label = (string)$offering->course_key;
    $note = $target->placeholders ? sprintf('  [%d placeholder(s)]', $target->placeholders) : '';

    // A publication that is already over is not a shop window, it is a dead
    // link: pqco_offering_has_ended() will hide it the moment it appears.
    if ((int)$offering->enddate > 0 && (int)$offering->enddate < $now) {
        cli_writeln(sprintf('  %-24s SKIP  end date has passed (%s)', $label,
            userdate((int)$offering->enddate, '%Y-%m-%d')));
        $skipped++;
        continue;
    }

    if ($dryrun) {
        cli_writeln(sprintf('  %-24s would PUBLISH  %s %s%s', $label,
            $offering->pricing_currency, $offering->tuition_amount, $note));
        $published++;
        continue;
    }

    try {
        $DB->update_record('local_prequran_course_offering', (object)[
            'id' => (int)$offering->id,
            'status' => 'published',
            'timemodified' => $now,
        ]);
        pqco_course_audit('offering_published', 'course_offering', (int)$offering->id, [
            'consumerid' => (int)($offering->consumerid ?? 0),
            'workspaceid' => $workspaceid,
            'offeringid' => (int)$offering->id,
            'actorid' => $actorid,
            'previous_status' => 'draft',
            'status' => 'published',
            'title' => (string)$offering->title,
            'source' => 'cli/publish_offerings.php',
        ]);
        cli_writeln(sprintf('  %-24s PUBLISHED  %s %s%s', $label,
            $offering->pricing_currency, $offering->tuition_amount, $note));
        $published++;
    } catch (Throwable $e) {
        cli_writeln(sprintf('  %-24s FAIL  %s', $label, $e->getMessage()));
        $failed++;
    }
}

cli_writeln(str_repeat('-', 78));
cli_writeln(sprintf('%s: %d published, %d skipped, %d failed',
    $dryrun ? 'dry run' : 'done', $published, $skipped, $failed));
if (!$dryrun && $published) {
    cli_writeln('These are now enrollable. To take one back out of the catalogue without archiving it,');
    cli_writeln('set its status to \'closed\': still listed, but the enrolment handler refuses it.');
}
