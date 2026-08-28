<?php
// Wehel daily allowance — the QA probe. Reads the live ledger, mints a real
// learner launch URL, and can spend or restore the day for the QA account.
//
// KEEPER — this is the durable copy. It runs on the K-12 Moodle server, not on
// the dev machine: stage it on the Bunny zone under "Ehel Primary/qa/" and curl
// it into the DOCROOT (/home/ehelacad/quraantest.academy). Every REVISION
// staged to the CDN needs a FRESH filename (…-20260828a.php, -b, …) — the edge
// caches the old bytes at the old path and a re-stage under the same name
// serves the previous version. Delete both copies when you are done: the staged
// file is publicly fetchable at the edge while it is up.
//
//     php wehel-allowance-probe.php            # report + launch URL
//     php wehel-allowance-probe.php --seed     # spend the day, so ONE question is refused
//     php wehel-allowance-probe.php --reset    # give the day back
//
// It reads and prints; the only WRITE it can make is one user preference on one
// fenced QA account, and --reset undoes it. It creates nothing, enrols nobody
// and deletes nothing.
//
// What it verified on 2026-08-28, against live v314 + the deployed
// wehel_chat.php, as #1331 (Stage 6, tutoring → 40 minutes):
//   · the first question of the day charged 0
//   · a 75-second pause charged 60 — the gap cap held
//   · the ledger read back 20260828|60|…|78494|56037, its token totals matching
//     the client's to the digit
//   · seeded past the limit, the next question was refused with "That is all 40
//     minutes of Wehel for today", rendered as a normal reply rather than the
//     offline banner, and left tokens=0 — the refusal costs nothing because it
//     happens before the API call
//
// Read the client's on-screen figure carefully if you compare the two: it is the
// server's count PLUS up to one capped gap, so the browser legitimately shows up
// to 60s more than the database. The ledger below is the only server-side number.

// CLI_SCRIPT must be defined BEFORE config.php: Moodle refuses a command-line
// require without it ("Command line scripts must define CLI_SCRIPT before
// requiring config.php"). The PHP_SAPI guard further down cannot do this job —
// it runs after the require, which is exactly where the refusal happens.
define('CLI_SCRIPT', true);

// It does `require(__DIR__ . '/config.php')`, so a run from the home directory
// fails loudly rather than finding the wrong Moodle.
require(__DIR__ . '/config.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

// cli_error() lives in clilib.php, which a bare config.php require does not
// load — a helper script carries its own fail rather than pulling in more of
// Moodle.
function qa_fail(string $why): void {
    fwrite(STDERR, "\nREFUSED: {$why}\n\n");
    exit(1);
}
function qa_say(string $line = ''): void {
    fwrite(STDOUT, $line . "\n");
}

if (PHP_SAPI !== 'cli') {
    qa_fail('CLI only.');
}

// --- fence 1: the right INSTALL ------------------------------------------------
// Identified by its DATABASE, never by $CFG->wwwroot: this box hosts nine
// Moodles and the K-12 config serves many hostnames, so from the CLI wwwroot
// reads https://eduplatform.ai on the RIGHT install and a wwwroot guard fires
// falsely.
$consumer = $DB->get_record('local_prequran_consumer', ['slug' => 'ehel-k12'], 'id, slug', IGNORE_MISSING);
if (!$consumer) {
    qa_fail('this database has no ehel-k12 consumer row, so it is not the K-12 install. Nothing was read or written.');
}

// --- fence 2: the right ACCOUNT ------------------------------------------------
// Two fences, not an id: an id alone is one typo away from a real child's
// account, and this script can spend their day.
const QA_USERID = 1331;
const QA_USERNAME = 'qa.tutoring.learner';
$user = $DB->get_record('user', ['id' => QA_USERID], 'id, username, suspended, deleted', IGNORE_MISSING);
if (!$user) {
    qa_fail('user ' . QA_USERID . ' does not exist here.');
}
if ($user->username !== QA_USERNAME) {
    qa_fail('user ' . QA_USERID . ' is "' . $user->username . '", not ' . QA_USERNAME . '. This is not the QA learner — refusing to touch it.');
}
if (!empty($user->deleted)) {
    qa_fail('the QA learner is deleted.');
}

$args = array_slice($argv, 1);
foreach ($args as $arg) {
    if (!in_array($arg, ['--seed', '--reset'], true)) {
        // An unrecognised argument is refused rather than ignored: silently
        // falling back to the default action is how a typo becomes a surprise.
        qa_fail('unknown argument "' . $arg . '". Use --seed, --reset, or nothing.');
    }
}
$seed = in_array('--seed', $args, true);
$reset = in_array('--reset', $args, true);
if ($seed && $reset) {
    qa_fail('--seed and --reset together mean nothing. Pick one.');
}

const LEDGER = 'local_hubredirect_wehel_time';
$today = date('Ymd');

qa_say('');
qa_say('  install : ehel-k12 (consumer row #' . $consumer->id . ')');
qa_say('  learner : #' . $user->id . ' ' . $user->username . ($user->suspended ? '  [SUSPENDED — the launch will not work until this is lifted]' : ''));
qa_say('  category: ' . (pqpg_launch_category(QA_USERID) ?: '(none — an ordinary school learner)'));

$before = (string)get_user_preferences(LEDGER, '', QA_USERID);
qa_say('  ledger  : ' . ($before === '' ? '(empty — no Wehel today)' : $before));
if ($before !== '') {
    $parts = explode('|', $before);
    qa_say('            day=' . ($parts[0] ?? '?') . '  used=' . ($parts[1] ?? '?') . 's  last=' . ($parts[2] ?? '?')
        . '  tokens=' . ($parts[3] ?? '0') . '  weighted=' . ($parts[4] ?? '0'));
}

if ($seed) {
    // used far past any band, and last=0 so the NEXT question charges nothing
    // and is refused on the reading alone. That exercises the real refusal
    // path on one API call instead of forty.
    $value = $today . '|999999|0|0|0';
    set_user_preference(LEDGER, $value, QA_USERID);
    qa_say('');
    qa_say('  SEEDED  : ' . $value);
    qa_say('            The next question this learner asks will be refused. Run --reset afterwards.');
}

if ($reset) {
    unset_user_preference(LEDGER, QA_USERID);
    qa_say('');
    qa_say('  RESET   : the day is given back (preference removed).');
}

// --- the launch URL ------------------------------------------------------------
// Minted by the REAL function the platform uses, so the token carries the same
// signed claims a learner's own launch does. The base is passed explicitly:
// $CFG->wwwroot resolves to the wrong host from the CLI here, and it decides
// pwsEndpoint — the origin every cross-origin call in the app is aimed at.
//
// NOT minted on --reset. Every mint is a live 12-hour bearer token that then has
// to be revoked, and --reset is the step you run when you are FINISHED with the
// learner; handing out a fresh token there is the opposite of tidying up. (On
// 2026-08-28 the reset run minted a third token, which is why the revoke that
// followed reported 3 rather than 2.)
if ($reset) {
    qa_say('');
    qa_say('  No launch URL on --reset. Revoke anything still outstanding with:');
    // A heredoc, not an escaped string: this line is itself a php -r one-liner
    // full of quotes, and the escaped version rendered `CLI_SCRIPT\x27` — a
    // command that looks right in the source and does not run. Only $qaid
    // interpolates.
    $qaid = QA_USERID;
    qa_say(<<<HINT
    php -r "define('CLI_SCRIPT',true); require('config.php'); require_once('local/prequran/progress_gatewaylib.php'); echo pqpg_revoke_user_tokens({$qaid}), ' revoked', PHP_EOL;"
HINT);
    qa_say('');
    exit(0);
}

$base = 'https://students.k-12.ehelacademy.org';
$url = pqpg_ehel_launch_url(QA_USERID, 'ehel-tutoring-math', '', $base);
qa_say('');
if ($url === '') {
    qa_say('  launch  : could not be minted (no app base for that course key).');
} else {
    qa_say('  LAUNCH URL (valid ~12h, this learner only — revoke it when you are done):');
    qa_say('');
    qa_say('  ' . $url);
}
qa_say('');
