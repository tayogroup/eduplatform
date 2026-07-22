<?php
// CLI: create the DEMO pilot student accounts that cohorts.json rosters.
//
// The cohort-sync task deliberately NEVER creates accounts — it only links
// EXISTING users. This script fills that gap for the pilot/demo: it reads the
// deployed cohorts.json and creates any missing rostered users.
//
// SAFETY: it refuses to touch any username not prefixed `ehel-pilot-`, so it
// can only ever create the demo cohort — never a real account. Idempotent:
// existing usernames are skipped. Emails are @ehel.example.com (RFC 2606,
// non-routable) so a demo account can never send real mail.
//
//   php local/prequran/cli/create_pilot_accounts.php \
//       --url=https://app.ehelacademy.org/Ehel%20Primary/cohorts.json
//   php local/prequran/cli/create_pilot_accounts.php --dry-run
//   php local/prequran/cli/create_pilot_accounts.php --delete   (removes them)

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/user/lib.php');

[$options, $unrecognised] = cli_get_params([
    'help' => false,
    'url' => 'https://app.ehelacademy.org/Ehel%20Primary/cohorts.json',
    'password' => 'EhelPilot#2026',
    'dry-run' => false,
    'delete' => false,
], ['h' => 'help']);

if ($options['help']) {
    cli_writeln("Create (or --delete) the demo pilot accounts rostered in cohorts.json.");
    cli_writeln("  --url=URL     cohorts.json location (default: live app hostname)");
    cli_writeln("  --password=   demo password for created accounts (default EhelPilot#2026)");
    cli_writeln("  --dry-run     report what would happen, change nothing");
    cli_writeln("  --delete      delete the demo accounts (username prefix ehel-pilot- only)");
    exit(0);
}

const PILOT_PREFIX = 'ehel-pilot-';

// ---- load roster ----------------------------------------------------------
$raw = @file_get_contents($options['url']);
if ($raw === false) {
    cli_error('Could not fetch cohorts.json from ' . $options['url']);
}
$roster = json_decode($raw, true);
if (!is_array($roster) || empty($roster['cohorts'])) {
    cli_error('cohorts.json did not parse or has no cohorts.');
}

// Flatten unique members by username.
$members = [];
foreach ($roster['cohorts'] as $cohort) {
    foreach (($cohort['members'] ?? []) as $m) {
        $username = core_text::strtolower(trim((string)($m['username'] ?? '')));
        if ($username === '') {
            continue;
        }
        $members[$username] = $m; // dedupe
    }
}
if (!$members) {
    cli_error('No rostered members found. Populate cohorts.json members[] first.');
}

$created = 0; $skipped = 0; $deleted = 0; $refused = 0;

foreach ($members as $username => $m) {
    // Hard safety gate: only ever act on the demo prefix.
    if (strpos($username, PILOT_PREFIX) !== 0) {
        cli_writeln("REFUSED (not a pilot username): {$username}");
        $refused++;
        continue;
    }

    $existing = $DB->get_record('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id]);

    if ($options['delete']) {
        if ($existing && empty($existing->deleted)) {
            if (!$options['dry-run']) {
                delete_user($existing);
            }
            cli_writeln("deleted: {$username}");
            $deleted++;
        }
        continue;
    }

    if ($existing) {
        $skipped++;
        continue;
    }

    $email = core_text::strtolower(trim((string)($m['email'] ?? ($username . '@ehel.example.com'))));

    $user = new stdClass();
    $user->auth = 'manual';
    $user->confirmed = 1;
    $user->mnethostid = $CFG->mnet_localhost_id;
    $user->username = $username;
    $user->password = $options['password']; // hashed by user_create_user
    $user->firstname = (string)($m['firstname'] ?? 'Pilot');
    $user->lastname = (string)($m['lastname'] ?? 'Student');
    $user->email = $email;
    $user->lang = $CFG->lang ?? 'en';
    $user->timezone = '99';

    if (!$options['dry-run']) {
        user_create_user($user, true, false);
    }
    cli_writeln("created: {$username}  ({$user->firstname} {$user->lastname})");
    $created++;
}

cli_writeln('');
if ($options['delete']) {
    cli_writeln("Done. deleted={$deleted}, refused={$refused}" . ($options['dry-run'] ? '  [DRY RUN]' : ''));
} else {
    cli_writeln("Done. created={$created}, skipped(existing)={$skipped}, refused={$refused}" . ($options['dry-run'] ? '  [DRY RUN]' : ''));
    if ($created > 0 && !$options['dry-run']) {
        cli_writeln("Demo password for new accounts: {$options['password']}");
        cli_writeln("Next: run the cohort-sync task to enrol them into the pilot cohorts:");
        cli_writeln("  php admin/cli/scheduled_task.php --execute='\\local_prequran\\task\\cohort_sync'");
    }
}
