<?php
/**
 * Create academic terms for a workspace.
 *
 * Usage (from the Moodle root):
 *   php local/prequran/cli/create_academic_terms.php --workspaceid=23 --actorid=4 \
 *     --terms="2026T1:Term 1:2026-09-01:2026-12-18|2026T2:Term 2:2027-01-05:2027-03-26|2026T3:Term 3:2027-04-12:2027-06-30" \
 *     [--status=planned] [--dry-run]
 *
 * Each term is CODE:TITLE:START:END, terms separated by "|", dates as
 * YYYY-MM-DD. One flag rather than a repeated --term because Moodle's
 * cli_get_params keeps only the last value of a repeated option, which would
 * silently create one term out of three.
 *
 * WHY THIS EXISTS. local_prequran_acad_term drives more than a calendar page:
 * pqsyl_generated() reads it to build the schedule half of every syllabus, and
 * the offerings CLI reads it for start and end dates. A workspace with no terms
 * shows families an empty schedule on every approved syllabus. On the install
 * this was written for, the table held zero rows across every workspace, so the
 * Academic Calendar form had never successfully written one and there was
 * nothing to copy from.
 *
 * term_code is stored as given. The web form declares it PARAM_ALPHANUMEXT, so
 * a code typed there with a hyphen or a space is silently emptied — this script
 * rejects those loudly instead, because a term that saved with a blank code is
 * harder to notice than one that refused to save.
 *
 * Existing terms with the same workspace and code are UPDATED, not duplicated:
 * the table indexes (workspaceid, term_code) without a unique constraint, so a
 * second run would otherwise quietly double every term.
 *
 * @package   local_prequran
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');

[$options, $unrecognised] = cli_get_params([
    'workspaceid' => 0,
    'actorid' => 0,
    'terms' => '',
    'status' => 'planned',
    'term-type' => 'term',
    'dry-run' => false,
    'help' => false,
], ['h' => 'help']);

if ($options['help'] || $unrecognised) {
    cli_writeln("Create academic terms for a workspace.\n");
    cli_writeln("  --workspaceid=<id>  required");
    cli_writeln("  --actorid=<userid>  required");
    cli_writeln('  --terms="CODE:TITLE:START:END|CODE:TITLE:START:END"  required, dates YYYY-MM-DD');
    cli_writeln("  --status=<state>    planned (default), active or archived");
    cli_writeln("  --term-type=<type>  term (default)");
    cli_writeln("  --dry-run           report what would happen, write nothing");
    exit($unrecognised ? 1 : 0);
}

$workspaceid = (int)$options['workspaceid'];
$actorid = (int)$options['actorid'];
$status = trim((string)$options['status']);
$termtype = trim((string)$options['term-type']);
$dryrun = (bool)$options['dry-run'];

if ($workspaceid <= 0) { cli_error('--workspaceid is required.'); }
if ($actorid <= 0) { cli_error('--actorid is required.'); }
if (trim((string)$options['terms']) === '') { cli_error('--terms is required.'); }
if ($status === 'archived') {
    cli_writeln('!! status=archived: the syllabus schedule and the offerings CLI both skip archived terms.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) { cli_error("No workspace with id {$workspaceid}."); }
if (!$DB->record_exists('user', ['id' => $actorid, 'deleted' => 0])) { cli_error("No active user with id {$actorid}."); }
if (!pqh_user_can_manage_workspace($actorid, $workspaceid)) {
    cli_error("User {$actorid} cannot manage workspace {$workspaceid}.");
}

$parsedate = function (string $value, bool $endofday, string $where) {
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', trim($value), $m)) {
        cli_error("{$where}: '{$value}' is not YYYY-MM-DD.");
    }
    [, $y, $mo, $d] = array_map('intval', $m);
    if (!checkdate($mo, $d, $y)) {
        cli_error("{$where}: '{$value}' is not a real date.");
    }
    return $endofday ? make_timestamp($y, $mo, $d, 23, 59, 59) : make_timestamp($y, $mo, $d, 0, 0, 0);
};

// Parse everything before writing anything: a run that creates Term 1 and then
// dies on Term 3's typo leaves a workspace half-configured.
$parsed = [];
foreach (explode('|', (string)$options['terms']) as $chunk) {
    $chunk = trim($chunk);
    if ($chunk === '') { continue; }
    $bits = explode(':', $chunk);
    if (count($bits) !== 4) {
        cli_error("Each term must be CODE:TITLE:START:END — got '{$chunk}'.");
    }
    [$code, $title, $start, $end] = array_map('trim', $bits);
    if ($code === '' || $title === '') {
        cli_error("Term '{$chunk}' needs both a code and a title.");
    }
    if (!preg_match('/^[A-Za-z0-9_]+$/', $code)) {
        cli_error("Term code '{$code}' must be letters, digits and underscores only. "
            . "The web form declares this field PARAM_ALPHANUMEXT and would silently empty it.");
    }
    $startts = $parsedate($start, false, "term {$code} start");
    $endts = $parsedate($end, true, "term {$code} end");
    if ($endts <= $startts) {
        cli_error("Term {$code}: end must be after start.");
    }
    $parsed[] = (object)['code' => $code, 'title' => $title, 'start' => $startts, 'end' => $endts];
}
if (!$parsed) { cli_error('No terms parsed from --terms.'); }

usort($parsed, static fn($a, $b): int => $a->start <=> $b->start);
for ($i = 1; $i < count($parsed); $i++) {
    if ($parsed[$i]->start <= $parsed[$i - 1]->end) {
        cli_writeln(sprintf('!! %s starts before %s ends — overlapping terms.',
            $parsed[$i]->code, $parsed[$i - 1]->code));
    }
}

cli_writeln(sprintf('%s %d term(s) for workspace %d (%s), status %s',
    $dryrun ? 'DRY RUN —' : 'Writing',
    count($parsed), $workspaceid, $workspace->name ?? '?', $status));
cli_writeln(str_repeat('-', 68));

$created = 0; $updated = 0;
$now = time();

foreach ($parsed as $term) {
    $existing = $DB->get_record('local_prequran_acad_term',
        ['workspaceid' => $workspaceid, 'term_code' => $term->code], '*', IGNORE_MISSING);

    $record = (object)[
        'consumerid' => (int)($workspace->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'term_code' => $term->code,
        'title' => $term->title,
        'term_type' => $termtype,
        'startdate' => $term->start,
        'enddate' => $term->end,
        'status' => $status,
        'timemodified' => $now,
    ];

    $line = sprintf('  %-10s %-22s %s -> %s', $term->code, $term->title,
        userdate($term->start, '%Y-%m-%d'), userdate($term->end, '%Y-%m-%d'));

    if ($dryrun) {
        cli_writeln($line . ($existing ? '   would UPDATE' : '   would CREATE'));
        $existing ? $updated++ : $created++;
        continue;
    }

    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_acad_term', $record);
        $updated++;
        cli_writeln($line . '   UPDATED');
    } else {
        $record->createdby = $actorid;
        $record->timecreated = $now;
        $DB->insert_record('local_prequran_acad_term', $record);
        $created++;
        cli_writeln($line . '   CREATED');
    }
}

cli_writeln(str_repeat('-', 68));
cli_writeln(sprintf('%s: %d created, %d updated', $dryrun ? 'dry run' : 'done', $created, $updated));
if (!$dryrun && ($created || $updated)) {
    cli_writeln('The syllabus schedule reads these, so all approved syllabuses will now show a term structure.');
}
