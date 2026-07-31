<?php
// CLI: FULLY remove the Ehel K-12 QA test accounts created by
// create_ehel_k12_qa_accounts.php -- not just the bare Moodle account, but
// every row anywhere in local_prequran_* that is ABOUT one of these test
// users: workspace membership, student/teacher profile, course enrolments,
// grades, invoices/payments, communications/messages, consent records, live
// sessions/attendance, recordings, referrals, quiz/practice history, etc.
//
// SAFETY:
//   - Only ever matches usernames prefixed `ehelk12-qa-` (see create script).
//     It is structurally impossible for this to touch a real account.
//   - Only deletes rows where the QA user is the SUBJECT of the row (its
//     userid/studentid/teacherid/parentid/guardianid column), never rows
//     where a QA user merely appears as an actor/approver/creator on
//     someone else's record -- so it can't cascade into real data even if a
//     QA account were used to approve/create something during testing.
//   - Defaults to --dry-run=1 (the OPPOSITE of this repo's other pilot
//     scripts) because this one deletes far more than a bare account across
//     a large, dynamically-discovered set of tables. You must pass
//     --dry-run=0 explicitly to actually delete anything.
//
//   php local/prequran/cli/delete_ehel_k12_qa_accounts.php
//                                                  (dry run, default, safe)
//   php local/prequran/cli/delete_ehel_k12_qa_accounts.php --dry-run=0
//                                                  (actually deletes)

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/user/lib.php');

[$options] = cli_get_params([
    'help' => false,
    'dry-run' => true,
], ['h' => 'help']);

if ($options['help']) {
    cli_writeln("Fully delete the Ehel K-12 QA test accounts and all related data.");
    cli_writeln("  --dry-run=1   (default) report what would be deleted, change nothing");
    cli_writeln("  --dry-run=0   actually delete everything");
    exit(0);
}

const QA_PREFIX = 'ehelk12-qa-';

// Columns that mean "this row is ABOUT this user" -- deliberately excludes
// actor/creator columns like createdby/approvedby/actorid, see safety note
// above.
const SUBJECT_COLUMNS = ['userid', 'studentid', 'teacherid', 'parentid', 'guardianid'];

$dry = (bool)$options['dry-run'];
$dbman = $DB->get_manager();

cli_writeln($dry ? '=== DRY RUN -- nothing will be changed ===' : '=== LIVE RUN -- this will delete data ===');
cli_writeln('');

// ---- 1. find the target accounts --------------------------------------
$candidates = $DB->get_records_select(
    'user',
    $DB->sql_like('username', ':pattern') . ' AND mnethostid = :mnethostid',
    ['pattern' => QA_PREFIX . '%', 'mnethostid' => $CFG->mnet_localhost_id],
    'username ASC'
);

if (!$candidates) {
    cli_writeln('No accounts found matching username prefix "' . QA_PREFIX . '". Nothing to do.');
    exit(0);
}

$userids = [];
foreach ($candidates as $u) {
    $tag = $u->deleted ? ' (already deleted)' : '';
    cli_writeln('found: ' . $u->username . ' (userid=' . $u->id . ')' . $tag);
    if (!$u->deleted) {
        $userids[] = (int)$u->id;
    }
}
cli_writeln('');

if (!$userids) {
    cli_writeln('All matching accounts are already deleted. Nothing left to clean up.');
    exit(0);
}

[$idsql, $idparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'uid');

// ---- 2. explicit parent/child cascades the generic sweep can't reach ---
// invoice_line hangs off invoiceid, not directly off studentid/teacherid.
if ($dbman->table_exists('local_prequran_invoice') && $dbman->table_exists('local_prequran_invoice_line')) {
    $invoicecols = $DB->get_columns('local_prequran_invoice');
    $linecols = $DB->get_columns('local_prequran_invoice_line');
    if (isset($invoicecols['studentid']) && isset($linecols['invoiceid'])) {
        $invoiceids = $DB->get_fieldset_select(
            'local_prequran_invoice', 'id', "studentid {$idsql}", $idparams
        );
        if ($invoiceids) {
            [$invsql, $invparams] = $DB->get_in_or_equal($invoiceids, SQL_PARAMS_NAMED, 'inv');
            $count = $DB->count_records_select('local_prequran_invoice_line', "invoiceid {$invsql}", $invparams);
            cli_writeln(sprintf('%-45s %d row(s)%s', 'local_prequran_invoice_line (via invoiceid)', $count,
                $dry ? '' : ' -- deleting'));
            if (!$dry && $count > 0) {
                $DB->delete_records_select('local_prequran_invoice_line', "invoiceid {$invsql}", $invparams);
            }
        }
    }
}

// ---- 3. generic dynamic sweep -------------------------------------------
// Every local_prequran_* table with a subject column, discovered live so
// this doesn't silently miss a table added after this script was written.
$tables = $DB->get_tables(false);
$totaltables = 0;
$totalrows = 0;

foreach ($tables as $table) {
    if (strpos($table, 'local_prequran_') !== 0) {
        continue;
    }
    $cols = $DB->get_columns($table);
    $matchedcol = null;
    foreach (SUBJECT_COLUMNS as $c) {
        if (isset($cols[$c])) {
            $matchedcol = $c;
            break; // one subject column per table is enough to scope on
        }
    }
    if ($matchedcol === null) {
        continue;
    }

    [$sql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'sub');
    $where = "{$matchedcol} {$sql}";
    $count = $DB->count_records_select($table, $where, $params);
    if ($count === 0) {
        continue;
    }
    $totaltables++;
    $totalrows += $count;
    cli_writeln(sprintf('%-45s %d row(s) via %s%s', $table, $count, $matchedcol, $dry ? '' : ' -- deleting'));
    if (!$dry) {
        $DB->delete_records_select($table, $where, $params);
    }
}

cli_writeln('');
cli_writeln("Plugin-table sweep: {$totaltables} table(s), {$totalrows} row(s) total" . ($dry ? '  [DRY RUN]' : ''));
cli_writeln('');

// ---- 4. delete the Moodle accounts last (core API, never raw SQL) -------
$deletedaccounts = 0;
foreach ($candidates as $u) {
    if ($u->deleted) {
        continue;
    }
    if ($dry) {
        cli_writeln("would delete Moodle account: {$u->username}");
    } else {
        delete_user($u);
        cli_writeln("deleted Moodle account: {$u->username}");
    }
    $deletedaccounts++;
}

cli_writeln('');
cli_writeln("Done. accounts=" . $deletedaccounts . ($dry ? '  [DRY RUN -- run again with --dry-run=0 to actually delete]' : ' deleted'));
