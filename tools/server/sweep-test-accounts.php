<?php
// READ-ONLY sweep: test-style accounts that could capture a real family.
//
// KEEPER — the durable copy lives in the repo at tools/server/. It runs on the
// K-12 Moodle server, not on the dev machine: stage it on the Bunny zone under
// "Ehel Primary/qa/" and curl it into the docroot. Every REVISION staged to
// the CDN needs a FRESH filename (sweep-test-accounts-2.php, -3, …) — the edge
// caches the old bytes at the old path and a re-stage under the same name
// serves the previous version (the repo's same-path-new-bytes lesson, which
// bit this very script's first fix).
//
// The hazard (seen live 2026-08-25): intake dedupes by contact email, so a QA
// account made with a REAL email is link-bait — "ZZ TEST Approval Parent"
// (user 1309, made 2026-08-15, never logged in) captured a genuine conversion,
// and the family's welcome email said "keep using the password you have" for a
// password nobody knows, under a test name.
//
// This lists every non-deleted account whose NAME or USERNAME carries a test
// marker, splits them by whether their email domain can actually ROUTE (a
// reserved domain cannot capture anyone), and shows what each is wired to —
// guardian links, student/teacher profiles, cohort memberships — because
// repair differs for a linked account (fix in place) and an orphan (suspend).
// Writes nothing. Run from the K-12 DOCROOT:  php sweep-test-accounts.php
//
// v2 (2026-08-25): domain classification is a proper check on the address's
// domain, not a substring. v1 matched only a literal "@example." — so all 44
// @ehel.example.com fixtures and the @eduplatform.local pair were reported as
// routable link-bait, drowning the three real hits in 46 false ones.
define('CLI_SCRIPT', true);
require(__DIR__ . '/config.php');

function qa_fail(string $message): void {
    fwrite(STDERR, $message . "\n");
    exit(1);
}

/**
 * Can mail to this address actually arrive anywhere?
 *
 * False for the RFC-reserved names (example.com/net/org and the .test /
 * .example / .invalid / .localhost TLDs, RFC 2606/6761), for .local (mDNS,
 * never leaves a LAN), and for anything with no domain at all. Suffix-matched
 * on the registrable tail, so every subdomain of a reserved name is reserved
 * too — @ehel.example.com is exactly as unroutable as @example.com.
 */
function qa_email_routable(string $email): bool {
    $at = strrpos($email, '@');
    if ($at === false) {
        return false;
    }
    $domain = strtolower(trim(substr($email, $at + 1), " \t.\r\n"));
    if ($domain === '' || strpos($domain, '.') === false && $domain !== 'localhost') {
        // A dotless domain that is not localhost cannot resolve publicly.
        return false;
    }
    foreach (['test', 'example', 'invalid', 'localhost', 'local'] as $tld) {
        if ($domain === $tld || substr($domain, -strlen('.' . $tld)) === '.' . $tld) {
            return false;
        }
    }
    foreach (['example.com', 'example.net', 'example.org'] as $reserved) {
        if ($domain === $reserved || substr($domain, -strlen('.' . $reserved)) === '.' . $reserved) {
            return false;
        }
    }
    return true;
}

global $DB;
try {
    $consumerid = (int)$DB->get_field('local_prequran_consumer', 'id', ['slug' => 'ehel-k12'], IGNORE_MISSING);
} catch (Throwable $e) {
    $consumerid = 0;
}
if ($consumerid <= 0) {
    qa_fail("WRONG INSTALL: db={$CFG->dbname} has no ehel-k12 consumer.");
}
echo "Install OK: db {$CFG->dbname}\n\n";

$tableexists = function (string $table) use ($DB): bool {
    try {
        return $DB->get_manager()->table_exists(new xmldb_table($table));
    } catch (Throwable $e) {
        return false;
    }
};

// Test markers, case-insensitive, matched against name and username. Word-ish
// on 'test' so "Protestant" or a family genuinely named Testa is not dragged
// in by substring — the same trap the English audio grep note warns about.
$testpattern = '/\bzz ?test\b|zztest|\bqa\b|\bsqa\b|\btest\b|\bpilot\b|\bdemo\b|example/i';

$users = $DB->get_records_select('user', 'deleted = 0', [],
    'id ASC', 'id, username, firstname, lastname, email, auth, suspended, timecreated, firstaccess, lastlogin');

$real = [];
$fake = [];
foreach ($users as $u) {
    $name = trim($u->firstname . ' ' . $u->lastname);
    $hay = $name . ' ' . $u->username;
    if (!preg_match($testpattern, $hay)) {
        continue;
    }
    // Linkage: what would break (or mislead) if this account were removed.
    $links = [];
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $t) {
        if (!$tableexists($t)) {
            continue;
        }
        $asguardian = (int)$DB->count_records($t, ['guardianid' => (int)$u->id]);
        $asstudent = (int)$DB->count_records($t, ['studentid' => (int)$u->id]);
        if ($asguardian) {
            $links[] = "guardian×{$asguardian}(" . str_replace('local_prequran_', '', $t) . ")";
        }
        if ($asstudent) {
            $links[] = "student×{$asstudent}(" . str_replace('local_prequran_', '', $t) . ")";
        }
    }
    foreach (['local_prequran_student_profile' => 'student-profile', 'local_prequran_teacher_profile' => 'teacher-profile'] as $t => $label) {
        if ($tableexists($t) && $DB->record_exists($t, ['userid' => (int)$u->id])) {
            $links[] = $label;
        }
    }
    $cohorts = $tableexists('cohort_members') ? (int)$DB->count_records('cohort_members', ['userid' => (int)$u->id]) : 0;
    if ($cohorts) {
        $links[] = "cohorts×{$cohorts}";
    }
    $row = [
        'id' => (int)$u->id,
        'username' => (string)$u->username,
        'name' => $name,
        'email' => (string)$u->email,
        'suspended' => (int)$u->suspended === 1,
        'created' => date('Y-m-d', (int)$u->timecreated),
        'lastlogin' => (int)$u->lastlogin > 0 ? date('Y-m-d', (int)$u->lastlogin) : 'never',
        'links' => $links,
    ];
    if (qa_email_routable((string)$u->email)) {
        $real[] = $row;
    } else {
        $fake[] = $row;
    }
}

echo "== LINK-BAIT: test-marked accounts with ROUTABLE emails (" . count($real) . ") ==\n";
echo "An intake using one of these emails LINKS the family to the test account.\n\n";
if (!$real) {
    echo "  none — no test account can capture a real family by email.\n";
}
foreach ($real as $r) {
    $flags = [];
    if (!$r['suspended']) {
        $flags[] = 'ACTIVE';
    }
    if ($r['lastlogin'] === 'never') {
        $flags[] = 'never logged in';
    }
    printf("  #%-5d %-28s %-30s %s\n", $r['id'], $r['username'], $r['name'], $r['email']);
    printf("         created %s | %s%s\n", $r['created'], implode(' | ', $flags) ?: 'suspended',
        $r['links'] ? ' | wired: ' . implode(', ', $r['links']) : ' | no links — safe to suspend');
}

echo "\n== Fixture accounts with reserved/non-routable emails (" . count($fake) . ") — cannot capture anyone ==\n";
foreach ($fake as $r) {
    printf("  #%-5d %-32s %-28s %s%s\n", $r['id'], $r['username'], $r['name'],
        $r['suspended'] ? 'suspended' : 'active',
        $r['links'] ? ' | wired: ' . implode(', ', $r['links']) : '');
}

echo "\nWhat to do with a LINK-BAIT row (this script changes nothing):\n";
echo "  - wired to a real family: fix IN PLACE — real name via the admin UI,\n";
echo "    password via: php admin/cli/reset_password.php\n";
echo "  - not wired: suspend it, or point its email at a .invalid address so it\n";
echo "    can never match an intake again. cleanup_pilot_test_accounts.php\n";
echo "    exists for the bulk case — review its list before running anything.\n";
