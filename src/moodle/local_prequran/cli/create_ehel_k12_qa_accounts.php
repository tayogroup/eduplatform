<?php
// CLI: create QA test STUDENT and TEACHER accounts for Ehel K-12 School
// (consumerid 8, workspaceid 23) for controlled testing -- e.g. exercising
// the role-portal-subdomain feature (pqh_enforce_role_domain()) or any other
// role-gated flow, without touching real student/teacher accounts.
//
// SAFETY: only ever creates/touches usernames prefixed `ehelk12-qa-`, so it
// can never create or affect a real account. Idempotent: an existing
// matching username is left alone (its workspace-member/profile rows are
// still ensured). Emails are @ehel.example.com (RFC 2606, non-routable),
// matching the convention already used by create_pilot_accounts.php.
//
//   php local/prequran/cli/create_ehel_k12_qa_accounts.php --dry-run
//   php local/prequran/cli/create_ehel_k12_qa_accounts.php
//   php local/prequran/cli/create_ehel_k12_qa_accounts.php --students=10 --teachers=2
//
// Companion teardown: delete_ehel_k12_qa_accounts.php -- removes these
// accounts AND every related row (workspace membership, student/teacher
// profile, enrolments, grades, invoices/payments, communications, consent,
// live sessions/attendance, referrals), not just the bare Moodle account.

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/user/lib.php');

[$options] = cli_get_params([
    'help' => false,
    'password' => 'EhelK12Qa#2026',
    'students' => 30,
    'teachers' => 3,
    'dry-run' => false,
], ['h' => 'help']);

if ($options['help']) {
    cli_writeln("Create QA test student/teacher accounts for Ehel K-12 School.");
    cli_writeln("  --password=   account password (default EhelK12Qa#2026)");
    cli_writeln("  --students=   how many test students to create (default 30)");
    cli_writeln("  --teachers=   how many test teachers to create (default 3)");
    cli_writeln("  --dry-run     report what would happen, change nothing");
    exit(0);
}

const QA_PREFIX = 'ehelk12-qa-';
const QA_WORKSPACEID = 23; // Ehel K-12 School
const QA_CONSUMERID = 8;   // Ehel K-12 School

$now = time();
$dry = (bool)$options['dry-run'];

$workspace = $DB->get_record('local_prequran_workspace', ['id' => QA_WORKSPACEID], '*', IGNORE_MISSING);
if (!$workspace) {
    cli_error('Workspace ' . QA_WORKSPACEID . ' (expected Ehel K-12 School) was not found.');
}
cli_writeln('Target workspace: #' . QA_WORKSPACEID . ' "' . $workspace->name . '"');
cli_writeln('');

/** Insert only the columns that actually exist (schema-drift safe). */
function ehelqa_filter(string $table, array $data): array {
    global $DB;
    $cols = $DB->get_columns($table);
    $out = [];
    foreach ($data as $k => $v) {
        if (isset($cols[$k])) {
            $out[$k] = $v;
        }
    }
    return $out;
}

function ehelqa_upsert_member(int $wsid, int $userid, string $role): void {
    global $DB, $now;
    $existing = $DB->get_record('local_prequran_workspace_member',
        ['workspaceid' => $wsid, 'userid' => $userid, 'workspace_role' => $role]);
    if ($existing) {
        if ((string)$existing->status !== 'active') {
            $DB->update_record('local_prequran_workspace_member',
                (object)['id' => (int)$existing->id, 'status' => 'active', 'timemodified' => $now]);
        }
        return;
    }
    $DB->insert_record('local_prequran_workspace_member', (object)ehelqa_filter('local_prequran_workspace_member', [
        'workspaceid' => $wsid, 'userid' => $userid, 'workspace_role' => $role, 'status' => 'active',
        'notes' => 'QA test account (' . QA_PREFIX . ')', 'createdby' => 2,
        'timecreated' => $now, 'timemodified' => $now,
    ]));
}

$studentcount = max(0, (int)$options['students']);
$teachercount = max(0, (int)$options['teachers']);
$created = 0;
$existed = 0;

// ---- students --------------------------------------------------------
for ($i = 1; $i <= $studentcount; $i++) {
    $n = str_pad((string)$i, 2, '0', STR_PAD_LEFT);
    $username = QA_PREFIX . 'student' . $n;
    $existing = $DB->get_record('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id]);
    $isnew = !$existing || !empty($existing->deleted);

    if ($dry) {
        cli_writeln(($isnew ? 'would create' : 'exists') . ": {$username}");
        continue;
    }

    if ($isnew) {
        $user = new stdClass();
        $user->auth = 'manual';
        $user->confirmed = 1;
        $user->mnethostid = $CFG->mnet_localhost_id;
        $user->username = $username;
        $user->password = $options['password']; // hashed internally by user_create_user()
        $user->firstname = 'QA Student';
        $user->lastname = $n;
        $user->email = $username . '@ehel.example.com';
        $user->lang = $CFG->lang ?? 'en';
        $user->timezone = '99';
        $userid = (int)user_create_user($user, true, false);
        $created++;
    } else {
        $userid = (int)$existing->id;
        $existed++;
    }

    ehelqa_upsert_member(QA_WORKSPACEID, $userid, 'student');

    if ($DB->get_manager()->table_exists('local_prequran_student_profile')
            && !$DB->record_exists('local_prequran_student_profile', ['userid' => $userid])) {
        $DB->insert_record('local_prequran_student_profile', (object)ehelqa_filter('local_prequran_student_profile', [
            'userid' => $userid, 'student_display_name' => "QA Student {$n}", 'timezone' => 'Africa/Nairobi',
            'language' => 'en', 'current_level' => '', 'learning_base' => '', 'country' => '', 'city' => '',
            'gender' => '', 'live_class_consent' => 1, 'recording_consent' => 1,
            'enrollment_approval_status' => 'approved', 'status' => 'active',
            // course_type must be set explicitly -- the column has a DB-level
            // default of 'pre_quraan' (leftover from the single-vertical era)
            // that otherwise silently makes every new profile show a
            // "Pre-Quraan" course card regardless of institution_type.
            'course_type' => '',
            'createdby' => 2, 'timecreated' => $now, 'timemodified' => $now,
        ]));
    }

    cli_writeln(($isnew ? 'created' : 'reused') . ": {$username} (userid={$userid})");
}

// ---- teachers ----------------------------------------------------------
for ($i = 1; $i <= $teachercount; $i++) {
    $n = str_pad((string)$i, 2, '0', STR_PAD_LEFT);
    $username = QA_PREFIX . 'teacher' . $n;
    $existing = $DB->get_record('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id]);
    $isnew = !$existing || !empty($existing->deleted);

    if ($dry) {
        cli_writeln(($isnew ? 'would create' : 'exists') . ": {$username}");
        continue;
    }

    if ($isnew) {
        $user = new stdClass();
        $user->auth = 'manual';
        $user->confirmed = 1;
        $user->mnethostid = $CFG->mnet_localhost_id;
        $user->username = $username;
        $user->password = $options['password'];
        $user->firstname = 'QA Teacher';
        $user->lastname = $n;
        $user->email = $username . '@ehel.example.com';
        $user->lang = $CFG->lang ?? 'en';
        $user->timezone = '99';
        $userid = (int)user_create_user($user, true, false);
        $created++;
    } else {
        $userid = (int)$existing->id;
        $existed++;
    }

    ehelqa_upsert_member(QA_WORKSPACEID, $userid, 'teacher');

    if ($DB->get_manager()->table_exists('local_prequran_teacher_profile')
            && !$DB->record_exists('local_prequran_teacher_profile', ['userid' => $userid])) {
        $DB->insert_record('local_prequran_teacher_profile', (object)ehelqa_filter('local_prequran_teacher_profile', [
            'userid' => $userid, 'teacher_display_name' => "QA Teacher {$n}", 'gender' => '', 'country' => '',
            'city' => '', 'timezone' => 'Africa/Nairobi', 'primary_language' => 'en', 'status' => 'active',
            'vetting_status' => 'approved', 'marketplace_visible' => 0, 'marketplace_status' => 'unlisted',
            'consumerid' => QA_CONSUMERID, 'workspaceid' => QA_WORKSPACEID,
            'createdby' => 2, 'timecreated' => $now, 'timemodified' => $now,
        ]));
    }

    cli_writeln(($isnew ? 'created' : 'reused') . ": {$username} (userid={$userid})");
}

cli_writeln('');
cli_writeln("Done. created={$created}, already-existed={$existed}" . ($dry ? '  [DRY RUN]' : ''));
if ($created > 0 && !$dry) {
    cli_writeln("Password for all new QA accounts: {$options['password']}");
    cli_writeln("Usernames: " . QA_PREFIX . "student01.." . QA_PREFIX . "student" . str_pad((string)$studentcount, 2, '0', STR_PAD_LEFT));
    cli_writeln("           " . QA_PREFIX . "teacher01.." . QA_PREFIX . "teacher" . str_pad((string)$teachercount, 2, '0', STR_PAD_LEFT));
    cli_writeln('To remove everything created here later: php local/prequran/cli/delete_ehel_k12_qa_accounts.php --dry-run');
}
