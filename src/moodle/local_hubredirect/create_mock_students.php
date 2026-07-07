<?php
// This file is part of EduPlatform custom live-class tooling.

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/account_ids.php');
require_once(__DIR__ . '/accesslib.php');

require_login();

if (!is_siteadmin($USER)) {
    pqh_access_denied(
        'Only site administrators can create mock student records.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Mock student setup access required'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/create_mock_students.php'));
$PAGE->set_title('Create Mock Students');
$PAGE->set_heading('Create Mock Students');

function pqms_table_exists(string $table): bool {
    global $DB;
    $manager = $DB->get_manager();
    return $manager->table_exists(new xmldb_table($table));
}

function pqms_profile_columns(): array {
    global $DB;
    if (!pqms_table_exists('local_prequran_student_profile')) {
        return [];
    }
    return $DB->get_columns('local_prequran_student_profile');
}

function pqms_set_field(stdClass $record, array $columns, string $field, $value): void {
    if (isset($columns[$field])) {
        $record->{$field} = $value;
    }
}

function pqms_normalize_username(string $seed): string {
    $username = strtolower(trim($seed));
    $username = preg_replace('/[^a-z0-9._-]+/', '.', $username);
    $username = trim($username, '.-_');
    return $username !== '' ? $username : 'qa.user';
}

function pqms_age_band(int $age): string {
    if ($age <= 7) {
        return '6-7';
    }
    if ($age <= 10) {
        return '8-10';
    }
    if ($age <= 13) {
        return '11-13';
    }
    if ($age <= 17) {
        return '14-17';
    }
    return '18+';
}

function pqms_bool(string $value): int {
    return in_array(strtolower(trim($value)), ['1', 'yes', 'true', 'on'], true) ? 1 : 0;
}

function pqms_contact_is_email(string $contact): bool {
    return (bool)filter_var(trim($contact), FILTER_VALIDATE_EMAIL);
}

function pqms_moodle_email(string $contact, string $fallbackprefix): string {
    $contact = trim($contact);
    if (pqms_contact_is_email($contact)) {
        return strtolower($contact);
    }
    $digits = preg_replace('/\D+/', '', $contact);
    if ($digits !== '') {
        return $fallbackprefix . '.' . $digits . '@phone.eduplatform.local';
    }
    return $fallbackprefix . '@eduplatform.local';
}

function pqms_find_user_by_username(string $username): ?stdClass {
    global $DB, $CFG;
    $user = $DB->get_record('user', [
        'username' => strtolower($username),
        'mnethostid' => $CFG->mnet_localhost_id,
        'deleted' => 0,
    ]);
    return $user ?: null;
}

function pqms_find_user_by_email(string $email): ?stdClass {
    global $DB;
    if ($email === '') {
        return null;
    }
    $user = $DB->get_record_select('user', 'LOWER(email) = LOWER(?) AND deleted = 0', [$email]);
    return $user ?: null;
}

function pqms_create_or_reuse_user(array $data, bool $isparent): array {
    global $CFG;

    $username = pqms_normalize_username($data['username']);
    $existing = pqms_find_user_by_username($username);
    if (!$existing && $isparent) {
        $existing = pqms_find_user_by_email($data['email']);
    }
    if ($existing) {
        return [$existing->id, false, $existing->username];
    }

    $user = new stdClass();
    $user->auth = 'manual';
    $user->confirmed = 1;
    $user->mnethostid = $CFG->mnet_localhost_id;
    $user->username = $username;
    $user->password = $data['password'];
    $user->firstname = $data['firstname'];
    $user->lastname = $data['lastname'];
    $user->email = $data['email'];
    $user->city = $data['city'];
    $user->country = $data['countrycode'];
    $user->timezone = $data['timezone'];
    $user->lang = 'en';
    $user->emailstop = 1;
    $user->description = $isparent ? 'Mock parent account for EduPlatform testing.' : 'Mock student account for EduPlatform testing.';

    $userid = user_create_user($user, true, false);
    pqh_assign_account_id((int)$userid, $isparent ? 'parent' : 'student');
    return [$userid, true, $username];
}

function pqms_read_rows(): array {
    $path = __DIR__ . '/mock_student_data.csv';
    if (!is_readable($path)) {
        throw new invalid_parameter_exception('Missing mock_student_data.csv beside create_mock_students.php.');
    }

    $handle = fopen($path, 'r');
    $headers = fgetcsv($handle);
    $rows = [];
    while (($values = fgetcsv($handle)) !== false) {
        if (count($values) !== count($headers)) {
            continue;
        }
        $rows[] = array_combine($headers, $values);
    }
    fclose($handle);
    return $rows;
}

function pqms_save_profile(int $studentid, int $parentid, array $row): int {
    global $DB, $USER;

    if (!pqms_table_exists('local_prequran_student_profile')) {
        throw new invalid_parameter_exception('Student profile table is missing.');
    }

    $columns = pqms_profile_columns();
    $now = time();
    $existing = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid]);

    $record = $existing ?: new stdClass();
    $record->userid = $studentid;
    $record->timezone = $row['timezone'];
    $record->language = $row['primary_language'];
    $record->age_years = (int)$row['age'];
    $record->age_band = pqms_age_band((int)$row['age']);
    $record->current_level = $row['current_level'];
    $record->learning_base = $row['base_of_learning'];
    $record->country = $row['country'];
    $record->city = $row['city'];
    $record->gender = $row['gender'];
    $record->availability = 'Sessions/week: ' . $row['number_of_sessions_per_week'] . '; Preferred: ' . $row['schedule_choices'];
    $record->parent_preferences = 'Pool: ' . $row['recommended_group_pool'] . '; Notes: ' . $row['admin_notes'];
    $record->status = 'active';
    $record->timemodified = $now;

    pqms_set_field($record, $columns, 'student_firstname', $row['student_firstname']);
    pqms_set_field($record, $columns, 'student_lastname', $row['student_lastname']);
    pqms_set_field($record, $columns, 'student_display_name', $row['student_display_name']);
    pqms_set_field($record, $columns, 'student_email', 'mock.student' . str_pad($row['mock_student_no'], 3, '0', STR_PAD_LEFT) . '@eduplatform.test');
    pqms_set_field($record, $columns, 'primary_language', $row['primary_language']);
    pqms_set_field($record, $columns, 'other_languages', $row['other_languages']);
    pqms_set_field($record, $columns, 'base_of_learning', $row['base_of_learning']);
    pqms_set_field($record, $columns, 'special_needs', $row['special_needs']);
    pqms_set_field($record, $columns, 'course_type', $row['course_type']);
    pqms_set_field($record, $columns, 'parent_name', $row['parent_name']);
    pqms_set_field($record, $columns, 'parent_email', $row['parent_contact_email_or_phone']);
    pqms_set_field($record, $columns, 'parent_phone', $row['parent_phone_whatsapp']);
    pqms_set_field($record, $columns, 'live_class_consent', pqms_bool($row['live_class_consent']));
    pqms_set_field($record, $columns, 'recording_consent', pqms_bool($row['recording_consent']));
    pqms_set_field($record, $columns, 'consent_notes', $row['consent_notes_comment']);
    pqms_set_field($record, $columns, 'recommended_group_pool', $row['recommended_group_pool']);
    pqms_set_field($record, $columns, 'recommended_group_size_target', (int)$row['recommended_group_size_target']);
    pqms_set_field($record, $columns, 'bbb_ready', pqms_bool($row['bbb_ready']));
    pqms_set_field($record, $columns, 'moodle_course_group_ready', pqms_bool($row['moodle_course_group_ready']));
    pqms_set_field($record, $columns, 'parentid', $parentid);
    pqms_set_field($record, $columns, 'guardianid', $parentid);
    pqms_set_field($record, $columns, 'timezone_group', $row['timezone_group']);

    if ($existing) {
        $DB->update_record('local_prequran_student_profile', $record);
        return (int)$existing->id;
    }

    pqms_set_field($record, $columns, 'createdby', $USER->id);
    pqms_set_field($record, $columns, 'timecreated', $now);
    return $DB->insert_record('local_prequran_student_profile', $record);
}

function pqms_upsert_comm_consent(int $studentid, int $parentid): void {
    global $DB, $USER;
    if ($parentid <= 0 || !pqms_table_exists('local_prequran_comm_consent')) {
        return;
    }
    $now = time();
    $columns = $DB->get_columns('local_prequran_comm_consent');
    if (!isset($columns['studentid']) || !isset($columns['guardianid'])) {
        pqms_audit('mock_student_comm_consent_skipped', $studentid, [
            'reason' => 'local_prequran_comm_consent is missing studentid or guardianid',
            'parentid' => $parentid,
        ]);
        return;
    }

    $existing = $DB->get_record('local_prequran_comm_consent', ['studentid' => $studentid, 'guardianid' => $parentid]);
    $record = $existing ?: new stdClass();
    $record->studentid = $studentid;
    $record->guardianid = $parentid;
    pqms_set_field($record, $columns, 'student_messaging_enabled', 0);
    pqms_set_field($record, $columns, 'free_text_enabled', 0);
    pqms_set_field($record, $columns, 'parent_visible', 1);
    pqms_set_field($record, $columns, 'consent_source', 'mock_import');
    pqms_set_field($record, $columns, 'consentstatus', 'granted');
    pqms_set_field($record, $columns, 'consentmethod', 'mock_import');
    pqms_set_field($record, $columns, 'consentedby', $USER->id);
    pqms_set_field($record, $columns, 'consentedat', $now);
    $record->timemodified = $now;
    if ($existing) {
        $DB->update_record('local_prequran_comm_consent', $record);
    } else {
        $record->timecreated = $now;
        $DB->insert_record('local_prequran_comm_consent', $record);
    }
}

function pqms_upsert_live_consent(int $studentid, int $parentid, string $type, int $granted, string $details): void {
    global $DB, $USER;
    if ($parentid <= 0 || !pqms_table_exists('local_prequran_live_consent')) {
        return;
    }
    $now = time();
    $columns = $DB->get_columns('local_prequran_live_consent');
    if (!isset($columns['studentid']) || !isset($columns['guardianid']) || !isset($columns['consent_type'])) {
        pqms_audit('mock_student_live_consent_skipped', $studentid, [
            'reason' => 'local_prequran_live_consent is missing studentid, guardianid, or consent_type',
            'parentid' => $parentid,
            'consent_type' => $type,
        ]);
        return;
    }

    $existing = $DB->get_record('local_prequran_live_consent', [
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => $type,
    ]);
    $record = $existing ?: new stdClass();
    $record->studentid = $studentid;
    $record->guardianid = $parentid;
    $record->consent_type = $type;
    $record->granted = $granted;
    pqms_set_field($record, $columns, 'version', '1');
    pqms_set_field($record, $columns, 'consent_source', 'mock_import');
    pqms_set_field($record, $columns, 'details', $details);
    pqms_set_field($record, $columns, 'consentedby', $USER->id);
    pqms_set_field($record, $columns, 'timeconsented', $now);
    $record->timemodified = $now;
    if ($existing) {
        $DB->update_record('local_prequran_live_consent', $record);
    } else {
        $record->timecreated = $now;
        $DB->insert_record('local_prequran_live_consent', $record);
    }
}

function pqms_audit(string $action, int $studentid, array $details): void {
    global $DB, $USER;
    if (!pqms_table_exists('local_prequran_live_audit')) {
        return;
    }
    $record = (object)[
        'sessionid' => 0,
        'actorid' => $USER->id,
        'action' => $action,
        'targettype' => 'student',
        'targetid' => $studentid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ];
    $DB->insert_record('local_prequran_live_audit', $record);
}

function pqms_create_students(array $rows): array {
    global $DB;

    $results = [];
    $transaction = $DB->start_delegated_transaction();
    foreach ($rows as $row) {
        $number = str_pad($row['mock_student_no'], 3, '0', STR_PAD_LEFT);
        $studentemail = 'mock.student' . $number . '@eduplatform.test';
        [$studentid, $studentcreated, $studentusername] = pqms_create_or_reuse_user([
            'username' => 'mock.student.' . $number,
            'password' => 'Student@Test123!',
            'firstname' => $row['student_firstname'],
            'lastname' => $row['student_lastname'],
            'email' => $studentemail,
            'city' => $row['city'],
            'countrycode' => '',
            'timezone' => $row['timezone'],
        ], false);

        $parentid = 0;
        $parentcreated = false;
        $parentusername = '';
        if (strtolower($row['parent_guardian_required']) === 'yes') {
            $parentname = trim($row['parent_name']) !== '' ? trim($row['parent_name']) : 'Mock Parent ' . $number;
            $parts = preg_split('/\s+/', $parentname, 2);
            $parentfirstname = $parts[0] ?? 'Mock';
            $parentlastname = $parts[1] ?? 'Parent';
            [$parentid, $parentcreated, $parentusername] = pqms_create_or_reuse_user([
                'username' => 'mock.parent.' . $number,
                'password' => 'Parent@Test123!',
                'firstname' => $parentfirstname,
                'lastname' => $parentlastname,
                'email' => pqms_moodle_email($row['parent_contact_email_or_phone'], 'mock.parent.' . $number),
                'city' => $row['city'],
                'countrycode' => '',
                'timezone' => $row['timezone'],
            ], true);
        }

        $profileid = pqms_save_profile($studentid, $parentid, $row);
        pqms_upsert_comm_consent($studentid, $parentid);
        pqms_upsert_live_consent($studentid, $parentid, 'live_session', pqms_bool($row['live_class_consent']), $row['consent_notes_comment']);
        pqms_upsert_live_consent($studentid, $parentid, 'recording', pqms_bool($row['recording_consent']), $row['consent_notes_comment']);

        pqms_audit($studentcreated ? 'mock_student_created' : 'mock_student_refreshed', $studentid, [
            'mock_student_no' => (int)$row['mock_student_no'],
            'profileid' => $profileid,
            'parentid' => $parentid,
            'parent_created' => $parentcreated ? 1 : 0,
            'course_type' => $row['course_type'],
            'timezone_group' => $row['timezone_group'],
            'recommended_group_pool' => $row['recommended_group_pool'],
        ]);

        $results[] = [
            'mock_student_no' => $row['mock_student_no'],
            'studentid' => $studentid,
            'studentusername' => $studentusername,
            'studentcreated' => $studentcreated,
            'profileid' => $profileid,
            'parentid' => $parentid,
            'parentusername' => $parentusername,
            'parentcreated' => $parentcreated,
            'timezone_group' => $row['timezone_group'],
            'course_type' => $row['course_type'],
        ];
    }
    $transaction->allow_commit();
    return $results;
}

$created = optional_param('created', 0, PARAM_INT);
$results = [];
$error = '';
$rows = [];

try {
    $rows = pqms_read_rows();
} catch (Throwable $e) {
    $error = $e->getMessage();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $error === '') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This mock student setup form expired. Refresh the page and try again.');
        }
        $results = pqms_create_students($rows);
        redirect(new moodle_url('/local/hubredirect/create_mock_students.php', ['created' => count($results)]));
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

echo $OUTPUT->header();
echo html_writer::start_div('pq-live-page');
echo html_writer::start_div('pq-live-hero');
echo html_writer::tag('h1', 'Create Mock Students');
echo html_writer::tag('p', 'Create or refresh 50 mock Moodle student accounts, parent accounts, profile records, consent records, and audit rows from the generated grouping spreadsheet.');
echo html_writer::link(new moodle_url('/local/hubredirect/live_grouping.php'), 'Student grouping', ['class' => 'pq-button secondary']);
echo html_writer::link(new moodle_url('/local/hubredirect/student_intake.php'), 'Student intake', ['class' => 'pq-button secondary']);
echo html_writer::end_div();

if ($created > 0) {
    echo html_writer::div('Created/refreshed ' . $created . ' mock student records. You can now use them for grouping, Moodle course groups, and BBB live sessions.', 'pq-alert success');
}
if ($error !== '') {
    echo html_writer::div(s($error), 'pq-alert error');
}

$counts = [];
foreach ($rows as $row) {
    $key = $row['timezone_group'];
    $counts[$key] = ($counts[$key] ?? 0) + 1;
}

echo html_writer::start_div('pq-card');
echo html_writer::tag('h2', 'Mock Data Summary');
echo html_writer::start_tag('table', ['class' => 'generaltable']);
echo html_writer::tag('tr', html_writer::tag('th', 'Timezone group') . html_writer::tag('th', 'Students'));
foreach ($counts as $group => $count) {
    echo html_writer::tag('tr', html_writer::tag('td', s($group)) . html_writer::tag('td', (string)$count));
}
echo html_writer::end_tag('table');
echo html_writer::start_tag('form', ['method' => 'post']);
echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]);
echo html_writer::tag('button', 'Create / refresh 50 mock students', ['type' => 'submit', 'class' => 'pq-button primary']);
echo html_writer::end_tag('form');
echo html_writer::end_div();

echo html_writer::start_div('pq-card');
echo html_writer::tag('h2', 'What This Creates');
echo html_writer::tag('p', 'Student usernames: mock.student.001 through mock.student.050. Parent usernames: mock.parent.001 through mock.parent.050 where a guardian is required.');
echo html_writer::tag('p', 'Temporary passwords: Student@Test123! for students and Parent@Test123! for parents. These accounts use mock email addresses and email is stopped.');
echo html_writer::end_div();

echo html_writer::end_div();
echo $OUTPUT->footer();
