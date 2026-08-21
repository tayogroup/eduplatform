<?php
// CLI: move Intensive English progress rows from the app's old coursekey
// (ehel-ien-lNN) onto the catalogue's canonical one (ehel-intensive-eng-lNN).
//
// The executable twin of sql/merge_intensive_english_coursekey.sql. Same
// migration, but it takes the database and the table prefix from $CFG instead
// of asking an operator to pick the right ones — which is the whole reason it
// exists. The live box hosts nine Moodle installs, so "run this SQL in
// phpMyAdmin" carries a real chance of running it against a different school's
// database; a Moodle CLI script can only ever touch the install it is run from.
//
// WHY THE MIGRATION. The learner app emitted ehel-ien-lNN while catalog.json
// publishes ehel-intensive-eng-lNN, so every Intensive English progress row
// missed two lookups, both silently:
//   - pqpr_course_labels() found no local_prequran_curriculum_map row, so a
//     family saw the raw key "ehel-ien-l01" as the course name and the unit
//     total fell back to counting the units the learner had OPENED rather than
//     the 20 the level holds. Three units in, that reads as 100% complete.
//   - push_gradebook() resolves the course by idnumber and soft-skips when it
//     is absent, so no quiz score from this course reached a grade item.
// The app was fixed on 2026-08-21 (shell/subjects/intensive-english.js, live as
// app v230). This moves the rows written before that release.
//
// RUN IT SOON, and the reason is the unique key rather than tidiness.
// local_prequran_progress carries preqprog_ucu_uix UNIQUE on
// (environment, userid, coursekey, unit). Until v230 nothing had ever written
// the canonical key for this course, so today every old row has a free
// destination and none can collide. Once learners work on v230, anyone who
// revisits a unit holds a row under BOTH keys — and that pair cannot be merged
// by moving a row at all, because statejson is a reduced state document
// (sectionsDone, checkpoints, drafts) and there is no honest union of two of
// them. Collisions are reported and skipped here, never guessed at.
//
//   - Defaults to --dry-run=1 (the OPPOSITE of this repo's other pilot
//     scripts, matching delete_ehel_k12_qa_accounts.php, because the operation
//     writes to learner progress). Pass --dry-run=0 explicitly to move anything.
//   - Idempotent: a row whose destination is occupied is left where it is, so
//     re-running after reconciling a collision by hand picks it up.
//
//   php local/prequran/cli/merge_intensive_english_coursekey.php
//                                                  (dry run, default, safe)
//   php local/prequran/cli/merge_intensive_english_coursekey.php --dry-run=0
//   php local/prequran/cli/merge_intensive_english_coursekey.php --environment=production --dry-run=0

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');

[$options] = cli_get_params([
    'help' => false,
    'dry-run' => true,
    'environment' => '',
], ['h' => 'help']);

if ($options['help']) {
    cli_writeln("Move Intensive English progress rows onto the catalogue's coursekey.");
    cli_writeln("  --dry-run=1        (default) report what would move, change nothing");
    cli_writeln("  --dry-run=0        actually move the rows");
    cli_writeln("  --environment=ENV  only this environment (default: every one present)");
    exit(0);
}

const OLD_PREFIX = 'ehel-ien-l';
const NEW_PREFIX = 'ehel-intensive-eng-l';

$dry = (bool)$options['dry-run'];
$environment = trim((string)$options['environment']);

cli_writeln($dry
    ? '=== DRY RUN -- nothing will be changed ==='
    : '=== LIVE RUN -- this will rewrite progress rows ===');
cli_writeln(sprintf('database: %s   prefix: %s', $CFG->dbname, $CFG->prefix));
cli_writeln('');

// Plain table names, not new xmldb_table(...): database_manager::table_exists()
// accepts either, but the string form is what the rest of this plugin uses and
// it does not depend on ddllib having been loaded by the time the argument is
// constructed.
$dbman = $DB->get_manager();
if (!$dbman->table_exists('local_prequran_progress')) {
    cli_error('local_prequran_progress does not exist on this site — wrong install, or the progress schema was never created.');
}

/** ehel-ien-l01 -> ehel-intensive-eng-l01. OLD_PREFIX is 10 chars, so what follows is the level. */
function pqmie_canonical(string $coursekey): string {
    return NEW_PREFIX . substr($coursekey, strlen(OLD_PREFIX));
}

// ---- 1) What is there ------------------------------------------------------
$params = ['pattern' => $DB->sql_like_escape(OLD_PREFIX) . '%'];
$where = $DB->sql_like('coursekey', ':pattern', false, false);
if ($environment !== '') {
    $where .= ' AND environment = :env';
    $params['env'] = $environment;
}

$rows = $DB->get_records_select('local_prequran_progress', $where, $params, 'environment, userid, coursekey, unit');
if (!$rows) {
    cli_writeln('Nothing to do: no progress row uses the old coursekey.');
    cli_writeln('(If you expected some, check --environment and confirm this is the K-12 install.)');
    exit(0);
}

$bykey = [];
$learners = [];
foreach ($rows as $row) {
    $bykey[$row->environment . ' / ' . $row->coursekey] = ($bykey[$row->environment . ' / ' . $row->coursekey] ?? 0) + 1;
    $learners[$row->userid] = true;
}
cli_writeln(sprintf('Found %d row(s) across %d learner(s):', count($rows), count($learners)));
foreach ($bykey as $label => $count) {
    cli_writeln(sprintf('  %-40s %d row(s)', $label, $count));
}
cli_writeln('');

// ---- 2) Is the destination actually mapped? --------------------------------
// Moving a row onto a key the curriculum map does not know would fix nothing:
// the family would still see a raw string, and a unitcount of 0 reintroduces
// the inflated percentage under the new name. Worth saying before writing.
if ($dbman->table_exists('local_prequran_curriculum_map')) {
    $wanted = array_unique(array_map(static function ($row) {
        return pqmie_canonical($row->coursekey);
    }, $rows));
    foreach ($wanted as $idnumber) {
        $map = $DB->get_record('local_prequran_curriculum_map', ['idnumber' => $idnumber], 'idnumber,subject,stage,level,unitcount');
        if (!$map) {
            cli_writeln(sprintf('  ! %s has NO curriculum_map row — catalog_sync has not run, or the catalogue does not publish it.', $idnumber));
        } else if ((int)$map->unitcount <= 0) {
            cli_writeln(sprintf('  ! %s is mapped but unitcount is %d — the family would still see an inflated percent.', $idnumber, (int)$map->unitcount));
        } else {
            cli_writeln(sprintf('  ✓ %s -> %s · Stage %d (%s), %d units', $idnumber, $map->subject, (int)$map->stage, $map->level, (int)$map->unitcount));
        }
    }
    cli_writeln('');
} else {
    cli_writeln('  ! local_prequran_curriculum_map does not exist — cannot confirm the destination is mapped.');
    cli_writeln('');
}

// ---- 3) Split movable from collided ----------------------------------------
$movable = [];
$collisions = [];
foreach ($rows as $row) {
    $canonical = pqmie_canonical($row->coursekey);
    $twin = $DB->get_record('local_prequran_progress', [
        'environment' => $row->environment,
        'userid' => (int)$row->userid,
        'coursekey' => $canonical,
        'unit' => $row->unit,
    ], 'id,version,timemodified');
    if ($twin) {
        $collisions[] = [$row, $twin, $canonical];
    } else {
        $movable[] = [$row, $canonical];
    }
}

if ($collisions) {
    cli_writeln(sprintf('%d row(s) CANNOT move — a canonical row already exists for the same learner and unit.', count($collisions)));
    cli_writeln('Reconcile these by hand: compare the two statejson documents and keep the fuller one.');
    foreach ($collisions as [$row, $twin, $canonical]) {
        cli_writeln(sprintf('  user %-8d %-6s  %s (v%d, %s)  vs  %s (v%d, %s)',
            (int)$row->userid, $row->unit,
            $row->coursekey, (int)$row->version, userdate((int)$row->timemodified),
            $canonical, (int)$twin->version, userdate((int)$twin->timemodified)));
    }
    cli_writeln('');
}

if (!$movable) {
    cli_writeln('No row can be moved automatically. Nothing written.');
    exit(count($collisions) ? 1 : 0);
}

cli_writeln(sprintf('%d row(s) will move%s:', count($movable), $dry ? ' (dry run)' : ''));
foreach ($movable as [$row, $canonical]) {
    cli_writeln(sprintf('  user %-8d %-6s  %s -> %s', (int)$row->userid, $row->unit, $row->coursekey, $canonical));
}
cli_writeln('');

if ($dry) {
    cli_writeln('Dry run — nothing was changed. Re-run with --dry-run=0 to apply.');
    exit(0);
}

// ---- 4) Move them ----------------------------------------------------------
// One transaction: this is a rename across a unique key, and a half-applied
// migration is harder to reason about than none. The twin check above means no
// row here has an occupied destination, so the only way this throws is a
// concurrent write — in which case rolling the whole thing back is right.
$transaction = $DB->start_delegated_transaction();
$moved = 0;
foreach ($movable as [$row, $canonical]) {
    $DB->set_field('local_prequran_progress', 'coursekey', $canonical, ['id' => (int)$row->id]);
    $moved++;
}
$transaction->allow_commit();

cli_writeln(sprintf('Moved %d row(s).', $moved));
if ($collisions) {
    cli_writeln(sprintf('%d collision(s) left in place — see the list above.', count($collisions)));
}
cli_writeln('');
cli_writeln('Note: this does NOT backfill the gradebook. push_gradebook() runs at ingest,');
cli_writeln('so scores that were soft-skipped under the old key are not replayed by moving');
cli_writeln('the row — they reach a grade item on the learner\'s next quiz submission.');
cli_writeln('Verify with sql/verify_progress_curriculum_map.sql (checks 2 and 5).');

exit(0);
