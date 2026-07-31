<?php
// CLI: create the 3 DEMO pilot TEACHER accounts and assign each as editing
// teacher of one grade's English course (Grade 1-3). This fills the gap the
// sync tasks leave: cohort_sync only enrols students, and enrolment_reconcile
// only assigns teachers to marketplace *offering* courses — a plain catalog
// course (ehel-eng-gNN) gets no teacher automatically.
//
// SAFETY: like create_pilot_accounts.php, it refuses any username not prefixed
// `ehel-pilot-`, so it can only ever touch the demo cohort. Idempotent: existing
// accounts are reused; a teacher already enrolled is left as-is. Emails are
// @ehel.example.com (RFC 2606, non-routable).
//
//   php local/prequran/cli/create_pilot_teachers.php
//   php local/prequran/cli/create_pilot_teachers.php --dry-run
//   php local/prequran/cli/create_pilot_teachers.php --delete

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->libdir . '/enrollib.php');

[$options] = cli_get_params([
    'help' => false,
    'password' => 'EhelPilot#2026',
    'dry-run' => false,
    'delete' => false,
], ['h' => 'help']);

if ($options['help']) {
    cli_writeln("Create (or --delete) the 3 demo teacher accounts and assign them to the");
    cli_writeln("Grade 1-3 English courses as editing teachers.");
    cli_writeln("  --password=   demo password (default EhelPilot#2026)");
    cli_writeln("  --dry-run     report what would happen, change nothing");
    cli_writeln("  --delete      delete the demo teacher accounts (ehel-pilot- only)");
    exit(0);
}

const PILOT_PREFIX = 'ehel-pilot-';

// One teacher per grade: T1 -> Grade 1 (ehel-eng-g01), etc.
$teachers = [
    ['username' => 'ehel-pilot-t01', 'firstname' => 'Fatima', 'lastname' => 'Teacher (G1)', 'course' => 'ehel-eng-g01', 'grade' => 1],
    ['username' => 'ehel-pilot-t02', 'firstname' => 'Omar',   'lastname' => 'Teacher (G2)', 'course' => 'ehel-eng-g02', 'grade' => 2],
    ['username' => 'ehel-pilot-t03', 'firstname' => 'Sagal',  'lastname' => 'Teacher (G3)', 'course' => 'ehel-eng-g03', 'grade' => 3],
];

$teacherroleid = (int)$DB->get_field('role', 'id', ['shortname' => 'editingteacher']);
if ($teacherroleid <= 0 && !$options['delete']) {
    cli_error('No editingteacher role found on this site.');
}
$manual = enrol_get_plugin('manual');

$created = 0; $skipped = 0; $enrolled = 0; $deleted = 0;

foreach ($teachers as $t) {
    $username = core_text::strtolower($t['username']);
    if (strpos($username, PILOT_PREFIX) !== 0) {
        cli_writeln("REFUSED (not a pilot username): {$username}");
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

    // 1) account
    if ($existing) {
        $user = $existing;
        $skipped++;
    } else {
        $user = new stdClass();
        $user->auth = 'manual';
        $user->confirmed = 1;
        $user->mnethostid = $CFG->mnet_localhost_id;
        $user->username = $username;
        $user->password = $options['password'];
        $user->firstname = $t['firstname'];
        $user->lastname = $t['lastname'];
        $user->email = $username . '@ehel.example.com';
        $user->lang = $CFG->lang ?? 'en';
        $user->timezone = '99';
        if (!$options['dry-run']) {
            $user->id = user_create_user($user, true, false);
        } else {
            $user->id = 0;
        }
        cli_writeln("created: {$username}  ({$t['firstname']} {$t['lastname']})");
        $created++;
    }

    // 2) editing-teacher enrolment into the grade's English course
    $course = $DB->get_record('course', ['idnumber' => $t['course']]);
    if (!$course) {
        cli_writeln("  ! course {$t['course']} not found — run catalog_sync first. Skipping enrolment.");
        continue;
    }
    if ($options['dry-run']) {
        cli_writeln("  would enrol {$username} as editingteacher in {$t['course']}");
        continue;
    }
    $instance = $DB->get_record('enrol', ['courseid' => $course->id, 'enrol' => 'manual']);
    if (!$instance) {
        $iid = $manual->add_instance($course);
        $instance = $DB->get_record('enrol', ['id' => $iid]);
    }
    $ctx = context_course::instance($course->id);
    if (is_enrolled($ctx, (int)$user->id)) {
        // Ensure the editingteacher role is present even if already enrolled.
        role_assign($teacherroleid, (int)$user->id, $ctx->id);
        cli_writeln("  {$username} already enrolled in {$t['course']} (role ensured)");
    } else {
        $manual->enrol_user($instance, (int)$user->id, $teacherroleid, 0, 0, ENROL_USER_ACTIVE);
        cli_writeln("  enrolled {$username} as editingteacher in {$t['course']}");
        $enrolled++;
    }
}

cli_writeln('');
if ($options['delete']) {
    cli_writeln("Done. deleted={$deleted}" . ($options['dry-run'] ? '  [DRY RUN]' : ''));
} else {
    cli_writeln("Done. created={$created}, skipped(existing)={$skipped}, enrolled={$enrolled}"
        . ($options['dry-run'] ? '  [DRY RUN]' : ''));
    if ($created > 0 && !$options['dry-run']) {
        cli_writeln("Demo password for new accounts: {$options['password']}");
    }
}
