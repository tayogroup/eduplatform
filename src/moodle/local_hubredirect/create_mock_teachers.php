<?php
// This file is part of EduPlatform custom live-class tooling.

declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/account_ids.php');
require_once(__DIR__ . '/accesslib.php');

require_login();

if (!is_siteadmin($USER)) {
    pqh_access_denied(
        'Only site administrators can create mock teacher records.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Mock teacher setup access required'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/create_mock_teachers.php'));
$PAGE->set_title('Create Mock Teachers');
$PAGE->set_heading('Create Mock Teachers');
$PAGE->set_pagelayout('standard');

function pqmt_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists(new xmldb_table($table));
}

function pqmt_teacher_profile_columns(): array {
    global $DB;
    static $columns = null;
    if ($columns === null) {
        $columns = pqmt_table_exists('local_prequran_teacher_profile') ? $DB->get_columns('local_prequran_teacher_profile') : [];
    }
    return $columns;
}

function pqmt_set_field(stdClass $record, array $columns, string $field, $value): void {
    if (isset($columns[$field])) {
        $record->{$field} = $value;
    }
}

function pqmt_bool(string $value): int {
    return in_array(strtolower(trim($value)), ['1', 'yes', 'true', 'on'], true) ? 1 : 0;
}

function pqmt_country_code(string $country): string {
    $map = [
        'kenya' => 'KE',
        'india' => 'IN',
        'united states' => 'US',
        'usa' => 'US',
    ];
    $key = strtolower(trim($country));
    return $map[$key] ?? '';
}

function pqmt_normalize_username(string $seed): string {
    $username = strtolower(trim($seed));
    $username = preg_replace('/[^a-z0-9._-]+/', '.', (string)$username);
    $username = trim((string)$username, '.-_');
    return $username !== '' ? $username : 'teacher';
}

function pqmt_contact_is_email(string $contact): bool {
    return (bool)filter_var(trim($contact), FILTER_VALIDATE_EMAIL);
}

function pqmt_moodle_email(string $contact, string $username): string {
    $contact = trim($contact);
    if (pqmt_contact_is_email($contact)) {
        return strtolower($contact);
    }
    $digits = preg_replace('/\D+/', '', $contact);
    if ($digits !== '') {
        return 'teacher.' . $digits . '@phone.eduplatform.local';
    }
    return $username . '@eduplatform.local';
}

function pqmt_find_user_by_username(string $username): ?stdClass {
    global $DB, $CFG;
    $user = $DB->get_record('user', [
        'username' => strtolower($username),
        'mnethostid' => $CFG->mnet_localhost_id,
        'deleted' => 0,
    ]);
    return $user ?: null;
}

function pqmt_find_user_by_email(string $email): ?stdClass {
    global $DB, $CFG;
    if ($email === '' || !pqmt_contact_is_email($email)) {
        return null;
    }
    $user = $DB->get_record('user', [
        'email' => strtolower($email),
        'mnethostid' => $CFG->mnet_localhost_id,
        'deleted' => 0,
    ], '*', IGNORE_MULTIPLE);
    return $user ?: null;
}

function pqmt_read_rows(): array {
    $path = __DIR__ . '/mock_teacher_data.csv';
    if (!is_readable($path)) {
        throw new invalid_parameter_exception('Missing mock_teacher_data.csv beside create_mock_teachers.php.');
    }

    $handle = fopen($path, 'r');
    if (!$handle) {
        throw new invalid_parameter_exception('Could not open mock_teacher_data.csv.');
    }
    $headers = fgetcsv($handle);
    if (!$headers) {
        fclose($handle);
        return [];
    }

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

function pqmt_create_or_reuse_user(array $row): array {
    global $CFG;

    $username = pqmt_normalize_username((string)$row['teacher_username']);
    $email = pqmt_moodle_email((string)$row['teacher_contact'], $username);
    $existing = pqmt_find_user_by_username($username);
    if (!$existing && pqmt_contact_is_email((string)$row['teacher_contact'])) {
        $existing = pqmt_find_user_by_email($email);
    }

    if ($existing) {
        $existing->firstname = (string)$row['teacher_firstname'];
        $existing->lastname = (string)$row['teacher_lastname'];
        $existing->email = $email;
        $existing->city = (string)$row['city'];
        $existing->country = pqmt_country_code((string)$row['country']);
        $existing->timezone = (string)$row['timezone'];
        user_update_user($existing, false, false);
        return [(int)$existing->id, false, $existing->username, ''];
    }

    $password = 'Teacher@Test123!';
    $user = new stdClass();
    $user->auth = 'manual';
    $user->confirmed = 1;
    $user->mnethostid = $CFG->mnet_localhost_id;
    $user->username = $username;
    $user->password = $password;
    $user->firstname = (string)$row['teacher_firstname'];
    $user->lastname = (string)$row['teacher_lastname'];
    $user->email = $email;
    $user->emailstop = 1;
    $user->country = pqmt_country_code((string)$row['country']);
    $user->city = (string)$row['city'];
    $user->timezone = (string)$row['timezone'];
    $user->lang = $CFG->lang ?? 'en';
    $user->description = 'Mock teacher account for EduPlatform live-session testing.';

    $userid = (int)user_create_user($user, true, false);
    pqh_assign_account_id($userid, 'teacher');
    return [$userid, true, $username, $password];
}

function pqmt_save_profile(int $teacherid, array $row): int {
    global $DB, $USER;

    if (!pqmt_table_exists('local_prequran_teacher_profile')) {
        throw new invalid_parameter_exception('Teacher profile table is missing.');
    }

    $columns = pqmt_teacher_profile_columns();
    $now = time();
    $existing = $DB->get_record('local_prequran_teacher_profile', ['userid' => $teacherid]);
    $record = $existing ?: new stdClass();

    pqmt_set_field($record, $columns, 'userid', $teacherid);
    pqmt_set_field($record, $columns, 'teacher_display_name', (string)$row['teacher_display_name']);
    pqmt_set_field($record, $columns, 'teacher_phone', (string)$row['teacher_phone']);
    pqmt_set_field($record, $columns, 'preferred_contact', (string)$row['preferred_contact']);
    pqmt_set_field($record, $columns, 'gender', (string)$row['gender']);
    pqmt_set_field($record, $columns, 'country', (string)$row['country']);
    pqmt_set_field($record, $columns, 'city', (string)$row['city']);
    pqmt_set_field($record, $columns, 'timezone', (string)$row['timezone']);
    pqmt_set_field($record, $columns, 'timezone_group', (string)$row['timezone_group']);
    pqmt_set_field($record, $columns, 'primary_language', (string)$row['primary_language']);
    pqmt_set_field($record, $columns, 'other_languages', (string)$row['other_languages']);
    pqmt_set_field($record, $columns, 'courses_taught', (string)$row['courses_taught']);
    pqmt_set_field($record, $columns, 'levels_taught', (string)$row['levels_taught']);
    pqmt_set_field($record, $columns, 'max_students_per_class', (int)$row['max_students_per_class']);
    pqmt_set_field($record, $columns, 'max_weekly_hours', (int)$row['max_weekly_hours']);
    pqmt_set_field($record, $columns, 'availability_summary', (string)$row['availability_summary']);
    pqmt_set_field($record, $columns, 'bbb_trained', pqmt_bool((string)$row['bbb_trained']));
    pqmt_set_field($record, $columns, 'safeguarding_trained', pqmt_bool((string)$row['safeguarding_trained']));
    pqmt_set_field($record, $columns, 'recording_qa_ack', pqmt_bool((string)$row['recording_qa_ack']));
    pqmt_set_field($record, $columns, 'status', (string)$row['status']);
    pqmt_set_field($record, $columns, 'can_teach_children', (string)$row['can_teach_children']);
    pqmt_set_field($record, $columns, 'preferred_student_gender', (string)$row['preferred_student_gender']);
    pqmt_set_field($record, $columns, 'preferred_age_range', (string)$row['preferred_age_range']);
    pqmt_set_field($record, $columns, 'group_capacity_notes', (string)$row['group_capacity_notes']);
    pqmt_set_field($record, $columns, 'moodle_course_ready', pqmt_bool((string)$row['moodle_course_ready']));
    pqmt_set_field($record, $columns, 'bbb_ready', pqmt_bool((string)$row['bbb_ready']));
    pqmt_set_field($record, $columns, 'quality_review_required', (string)$row['quality_review_required']);
    pqmt_set_field($record, $columns, 'admin_notes', (string)$row['admin_notes']);
    pqmt_set_field($record, $columns, 'timemodified', $now);

    if ($existing) {
        $DB->update_record('local_prequran_teacher_profile', $record);
        return (int)$existing->id;
    }

    pqmt_set_field($record, $columns, 'createdby', (int)$USER->id);
    pqmt_set_field($record, $columns, 'timecreated', $now);
    return (int)$DB->insert_record('local_prequran_teacher_profile', $record);
}

function pqmt_weekday_number(string $day): int {
    $day = strtolower(trim($day));
    if (is_numeric($day)) {
        $weekday = (int)$day;
        return ($weekday >= 0 && $weekday <= 6) ? $weekday : -1;
    }
    $map = [
        'sun' => 0, 'sunday' => 0,
        'mon' => 1, 'monday' => 1,
        'tue' => 2, 'tuesday' => 2,
        'wed' => 3, 'wednesday' => 3,
        'thu' => 4, 'thursday' => 4,
        'fri' => 5, 'friday' => 5,
        'sat' => 6, 'saturday' => 6,
    ];
    return $map[$day] ?? -1;
}

function pqmt_time_to_minutes(string $time): ?int {
    $time = strtolower(trim($time));
    if (!preg_match('/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/', $time, $matches)) {
        return null;
    }
    $hour = (int)$matches[1];
    $minute = isset($matches[2]) && $matches[2] !== '' ? (int)$matches[2] : 0;
    $ampm = $matches[3] ?? '';
    if ($ampm === 'pm' && $hour < 12) {
        $hour += 12;
    } else if ($ampm === 'am' && $hour === 12) {
        $hour = 0;
    }
    if ($hour < 0 || $hour > 23 || $minute < 0 || $minute > 59) {
        return null;
    }
    return ($hour * 60) + $minute;
}

function pqmt_save_availability(int $teacherid, array $row): int {
    global $DB, $USER;

    if (!pqmt_table_exists('local_prequran_live_availability')) {
        return 0;
    }

    $created = 0;
    $now = time();
    $slots = array_filter(array_map('trim', explode(',', (string)$row['availability_slots'])));
    foreach ($slots as $slot) {
        [$day, $time] = array_pad(explode('|', $slot, 2), 2, '');
        $weekday = pqmt_weekday_number($day);
        $start = pqmt_time_to_minutes($time);
        if ($weekday < 0 || $start === null) {
            continue;
        }
        $end = min(24 * 60, $start + 60);
        $params = [
            'teacherid' => $teacherid,
            'weekday' => $weekday,
            'start_minute' => $start,
            'end_minute' => $end,
            'status' => 'active',
        ];
        if ($DB->record_exists('local_prequran_live_availability', $params)) {
            continue;
        }
        $availability = (object)$params;
        $availability->timezone = (string)$row['timezone'];
        $availability->createdby = (int)$USER->id;
        $availability->timecreated = $now;
        $availability->timemodified = $now;
        $DB->insert_record('local_prequran_live_availability', $availability);
        $created++;
    }
    return $created;
}

function pqmt_audit(string $action, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqmt_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'teacher',
        'targetid' => $targetid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqmt_create_teachers(array $rows): array {
    global $DB;

    $results = [];
    $transaction = $DB->start_delegated_transaction();
    try {
        foreach ($rows as $row) {
            [$userid, $created, $username, $password] = pqmt_create_or_reuse_user($row);
            $profileid = pqmt_save_profile($userid, $row);
            $availabilitycreated = pqmt_save_availability($userid, $row);
            $action = $created ? 'mock_teacher_created' : 'mock_teacher_refreshed';
            pqmt_audit($action, $userid, [
                'mock_teacher_no' => $row['mock_teacher_no'],
                'profileid' => $profileid,
                'username' => $username,
                'country' => $row['country'],
                'timezone' => $row['timezone'],
                'availability_created' => $availabilitycreated,
            ]);
            $results[] = [
                'mock_teacher_no' => $row['mock_teacher_no'],
                'username' => $username,
                'userid' => $userid,
                'accountno' => pqh_account_no_value($userid),
                'profileid' => $profileid,
                'displayname' => $row['teacher_display_name'],
                'country' => $row['country'],
                'timezone' => $row['timezone'],
                'status' => $row['status'],
                'created' => $created,
                'password' => $password,
                'availabilitycreated' => $availabilitycreated,
            ];
        }
        $transaction->allow_commit();
    } catch (Throwable $e) {
        $transaction->rollback($e);
        throw $e;
    }
    return $results;
}

$results = [];
$error = '';
$rows = [];

try {
    $rows = pqmt_read_rows();
} catch (Throwable $e) {
    $error = $e->getMessage();
}

$ready = pqmt_table_exists('local_prequran_teacher_profile');
$availabilityready = pqmt_table_exists('local_prequran_live_availability');

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST' && $error === '') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This mock teacher setup form expired. Refresh the page and try again.');
        }
        $results = pqmt_create_teachers($rows);
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$counts = [];
foreach ($rows as $row) {
    $country = (string)$row['country'];
    $counts[$country] = ($counts[$country] ?? 0) + 1;
}

echo $OUTPUT->header();
?>
<style>
.pqmt-wrap { max-width: 1180px; margin: 0 auto; padding: 24px; }
.pqmt-card { background: #fff; border: 1px solid #dfe6ea; border-radius: 8px; padding: 24px; margin-bottom: 18px; box-shadow: 0 10px 28px rgba(16, 24, 40, .06); }
.pqmt-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
.pqmt-btn { border: 0; border-radius: 7px; padding: 12px 18px; font-weight: 700; background: #2f7d4f; color: #fff; text-decoration: none; display: inline-block; }
.pqmt-btn--light { background: #eef4f7; color: #0f2437; border: 1px solid #d7e1e7; }
.pqmt-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
.pqmt-table th, .pqmt-table td { border-bottom: 1px solid #e8eef2; padding: 10px; text-align: left; vertical-align: top; }
.pqmt-ok { background: #edf8ef; color: #185c32; padding: 14px 16px; border-radius: 7px; font-weight: 700; }
.pqmt-warn { background: #fff5df; color: #76500f; padding: 14px 16px; border-radius: 7px; font-weight: 700; margin-top: 12px; }
.pqmt-error { background: #fdeceb; color: #8f2a1f; padding: 14px 16px; border-radius: 7px; font-weight: 700; margin-top: 12px; }
.pqmt-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-top: 18px; }
.pqmt-stat { background: #f7fafb; border: 1px solid #e2e8ec; border-radius: 8px; padding: 14px; }
.pqmt-stat strong { display: block; color: #7a4f2a; font-size: 1.5rem; }
</style>
<div class="pqmt-wrap">
  <section class="pqmt-card">
    <h1>Create Mock Teachers</h1>
    <p>This admin-only tool creates or refreshes the five teacher records from the teacher mockup: two Kenya teachers, two India teachers, and one US teacher. It also stores teacher availability for scheduling and BBB class assignment.</p>

    <?php if (!$ready): ?>
      <div class="pqmt-error">Teacher profile table is missing. Create local_prequran_teacher_profile before running this tool.</div>
    <?php endif; ?>
    <?php if ($ready && !$availabilityready): ?>
      <div class="pqmt-warn">Availability table is missing. Teacher accounts and profiles can be created, but availability slots will be skipped.</div>
    <?php endif; ?>
    <?php if ($error !== ''): ?>
      <div class="pqmt-error"><?php echo s($error); ?></div>
    <?php endif; ?>

    <div class="pqmt-stats">
      <div class="pqmt-stat"><strong><?php echo count($rows); ?></strong> mock teachers</div>
      <?php foreach ($counts as $country => $count): ?>
        <div class="pqmt-stat"><strong><?php echo (int)$count; ?></strong><?php echo s($country); ?></div>
      <?php endforeach; ?>
    </div>

    <?php if ($ready): ?>
      <form method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <div class="pqmt-actions">
          <button class="pqmt-btn" type="submit">Create / refresh mock teachers</button>
          <a class="pqmt-btn pqmt-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_directory.php'))->out(false); ?>">Teacher directory</a>
          <a class="pqmt-btn pqmt-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_intake.php'))->out(false); ?>">Teacher intake</a>
          <a class="pqmt-btn pqmt-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
        </div>
      </form>
    <?php endif; ?>
  </section>

  <?php if (!empty($results)): ?>
    <section class="pqmt-card">
      <div class="pqmt-ok">Mock teacher records are ready.</div>
      <table class="pqmt-table">
        <thead>
          <tr>
            <th>Mock</th>
            <th>Teacher</th>
            <th>Username</th>
            <th>Account No.</th>
            <th>Moodle ID</th>
            <th>Profile ID</th>
            <th>Location</th>
            <th>Status</th>
            <th>Availability added</th>
            <th>Temporary password</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($results as $result): ?>
            <tr>
              <td><?php echo s($result['mock_teacher_no']); ?></td>
              <td><?php echo s($result['displayname']); ?></td>
              <td><?php echo s($result['username']); ?></td>
              <td><?php echo s((string)($result['accountno'] ?? '')); ?></td>
              <td><?php echo (int)$result['userid']; ?></td>
              <td><?php echo (int)$result['profileid']; ?></td>
              <td><?php echo s($result['country'] . ' / ' . $result['timezone']); ?></td>
              <td><?php echo $result['created'] ? 'Created' : 'Refreshed'; ?> · <?php echo s($result['status']); ?></td>
              <td><?php echo (int)$result['availabilitycreated']; ?></td>
              <td><?php echo $result['created'] ? s($result['password']) : 'Unchanged'; ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
  <?php endif; ?>
</div>
<?php
echo $OUTPUT->footer();
