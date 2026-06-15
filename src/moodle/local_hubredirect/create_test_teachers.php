<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can create test teachers.');
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/create_test_teachers.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Create Test Teachers');
$PAGE->set_heading('Create Test Teachers');

function pqtt_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtt_audit(string $action, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqtt_table_exists('local_prequran_live_audit')) {
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

function pqtt_create_or_update_profile(int $userid, string $displayname): int {
    global $DB, $USER;
    $now = time();
    $profile = (object)[
        'userid' => $userid,
        'teacher_display_name' => $displayname,
        'teacher_phone' => '',
        'preferred_contact' => 'email',
        'gender' => '',
        'country' => '',
        'city' => '',
        'timezone' => 'Africa/Nairobi',
        'primary_language' => 'English',
        'other_languages' => 'Arabic',
        'courses_taught' => 'Pre-quraan Course, Quraan Memorization Course',
        'levels_taught' => 'Test teacher',
        'max_students_per_class' => 9,
        'max_weekly_hours' => 10,
        'availability_summary' => 'Test teacher account. Availability should be configured before scheduling real classes.',
        'bbb_trained' => 1,
        'safeguarding_trained' => 1,
        'recording_qa_ack' => 1,
        'status' => 'active',
        'admin_notes' => 'Seeded test teacher.',
        'timemodified' => $now,
    ];

    $existing = $DB->get_record('local_prequran_teacher_profile', ['userid' => $userid]);
    if ($existing) {
        $profile->id = (int)$existing->id;
        $DB->update_record('local_prequran_teacher_profile', $profile);
        return (int)$existing->id;
    }

    $profile->createdby = (int)$USER->id;
    $profile->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_teacher_profile', $profile);
}

function pqtt_create_teacher(string $username, string $password): array {
    global $DB, $CFG;

    $existing = $DB->get_record('user', [
        'username' => $username,
        'mnethostid' => $CFG->mnet_localhost_id,
        'deleted' => 0,
    ]);

    if ($existing) {
        $userid = (int)$existing->id;
        $profileid = pqtt_create_or_update_profile($userid, ucfirst($username));
        pqtt_audit('test_teacher_updated', $userid, ['username' => $username, 'profileid' => $profileid]);
        return [
            'username' => $username,
            'userid' => $userid,
            'profileid' => $profileid,
            'created' => false,
            'password' => '',
        ];
    }

    $user = (object)[
        'auth' => 'manual',
        'confirmed' => 1,
        'mnethostid' => $CFG->mnet_localhost_id,
        'username' => $username,
        'password' => $password,
        'firstname' => ucfirst($username),
        'lastname' => 'Test',
        'email' => $username . '@quraanacademy.test',
        'emailstop' => 1,
        'country' => '',
        'city' => '',
        'timezone' => 'Africa/Nairobi',
        'lang' => $CFG->lang ?? 'en',
    ];

    $userid = (int)user_create_user($user, true, false);
    $profileid = pqtt_create_or_update_profile($userid, ucfirst($username));
    pqtt_audit('test_teacher_created', $userid, ['username' => $username, 'profileid' => $profileid]);

    return [
        'username' => $username,
        'userid' => $userid,
        'profileid' => $profileid,
        'created' => true,
        'password' => $password,
    ];
}

$ready = pqtt_table_exists('local_prequran_teacher_profile');
$results = [];
$error = '';
$password = 'Teacher@Test123!';

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $transaction = $DB->start_delegated_transaction();
    try {
        for ($i = 1; $i <= 5; $i++) {
            $results[] = pqtt_create_teacher('teacher' . $i, $password);
        }
        $transaction->allow_commit();
    } catch (Throwable $e) {
        $transaction->rollback($e);
        $error = $e->getMessage();
    }
}

echo $OUTPUT->header();
?>
<style>
.pqtt-wrap { max-width: 1100px; margin: 0 auto; padding: 24px; }
.pqtt-card { background: #fff; border: 1px solid #dfe6ea; border-radius: 8px; padding: 24px; margin-bottom: 18px; box-shadow: 0 10px 28px rgba(16, 24, 40, .06); }
.pqtt-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
.pqtt-btn { border: 0; border-radius: 7px; padding: 12px 18px; font-weight: 700; background: #2f7d4f; color: #fff; text-decoration: none; display: inline-block; }
.pqtt-btn--light { background: #eef4f7; color: #0f2437; border: 1px solid #d7e1e7; }
.pqtt-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
.pqtt-table th, .pqtt-table td { border-bottom: 1px solid #e8eef2; padding: 10px; text-align: left; }
.pqtt-ok { background: #edf8ef; color: #185c32; padding: 14px 16px; border-radius: 7px; font-weight: 700; }
.pqtt-error { background: #fdeceb; color: #8f2a1f; padding: 14px 16px; border-radius: 7px; font-weight: 700; }
</style>
<div class="pqtt-wrap">
  <section class="pqtt-card">
    <h1>Create Test Teachers</h1>
    <p>This admin-only tool creates or refreshes five Moodle teacher test accounts: teacher1, teacher2, teacher3, teacher4, and teacher5.</p>
    <?php if (!$ready): ?>
      <div class="pqtt-error">Teacher profile table is missing. Create local_prequran_teacher_profile before running this tool.</div>
    <?php elseif ($error !== ''): ?>
      <div class="pqtt-error"><?php echo s($error); ?></div>
    <?php elseif (!empty($results)): ?>
      <div class="pqtt-ok">Test teachers are ready.</div>
      <table class="pqtt-table">
        <thead><tr><th>Username</th><th>Moodle user ID</th><th>Teacher profile ID</th><th>Status</th><th>Temporary password</th></tr></thead>
        <tbody>
          <?php foreach ($results as $row): ?>
            <tr>
              <td><?php echo s($row['username']); ?></td>
              <td><?php echo (int)$row['userid']; ?></td>
              <td><?php echo (int)$row['profileid']; ?></td>
              <td><?php echo $row['created'] ? 'Created' : 'Already existed; profile refreshed'; ?></td>
              <td><?php echo $row['created'] ? s($row['password']) : 'Unchanged'; ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>

    <?php if ($ready): ?>
      <form method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <div class="pqtt-actions">
          <button class="pqtt-btn" type="submit">Create / refresh test teachers</button>
          <a class="pqtt-btn pqtt-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_directory.php'))->out(false); ?>">Teacher directory</a>
          <a class="pqtt-btn pqtt-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
        </div>
      </form>
    <?php endif; ?>
  </section>
</div>
<?php
echo $OUTPUT->footer();
