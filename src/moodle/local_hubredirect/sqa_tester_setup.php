<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/account_ids.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only site administrators can create or refresh the SQA tester account.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'SQA tester setup access required'
    );
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/sqa_tester_setup.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('SQA Tester Setup');
$PAGE->set_heading('SQA Tester Setup');

function pqsqa_ensure_role(): int {
    global $CFG, $DB;

    $role = $DB->get_record('role', ['shortname' => 'sqa_tester'], 'id', IGNORE_MISSING);
    if (!$role) {
        $upgradelib = $CFG->dirroot . '/local/prequran/db/upgradelib.php';
        if (is_readable($upgradelib)) {
            require_once($upgradelib);
            if (function_exists('xmldb_local_prequran_ensure_sqa_tester_role')) {
                xmldb_local_prequran_ensure_sqa_tester_role();
            }
        }
        $role = $DB->get_record('role', ['shortname' => 'sqa_tester'], 'id', IGNORE_MISSING);
    }

    return $role ? (int)$role->id : 0;
}

function pqsqa_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqsqa_audit(string $action, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqsqa_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'sqa_tester',
        'targetid' => $targetid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqsqa_create_or_update_user(string $username, string $password, string $email, int $roleid): array {
    global $CFG, $DB;

    $username = core_text::strtolower(trim($username));
    $email = trim($email);
    $now = time();

    $existing = $DB->get_record('user', [
        'username' => $username,
        'mnethostid' => $CFG->mnet_localhost_id,
        'deleted' => 0,
    ], '*', IGNORE_MISSING);

    if ($existing) {
        $userid = (int)$existing->id;
        $existing->firstname = 'SQA';
        $existing->lastname = 'Tester';
        $existing->email = $email;
        $existing->emailstop = 1;
        $existing->timezone = 'Africa/Nairobi';
        $existing->description = 'Quran Academy SQA tester account for release checks, regression testing, and evidence collection.';
        $existing->timemodified = $now;
        user_update_user($existing, false, false);
        $created = false;
    } else {
        $user = (object)[
            'auth' => 'manual',
            'confirmed' => 1,
            'mnethostid' => $CFG->mnet_localhost_id,
            'username' => $username,
            'password' => $password,
            'firstname' => 'SQA',
            'lastname' => 'Tester',
            'email' => $email,
            'emailstop' => 1,
            'country' => '',
            'city' => '',
            'timezone' => 'Africa/Nairobi',
            'lang' => $CFG->lang ?? 'en',
            'description' => 'Quran Academy SQA tester account for release checks, regression testing, and evidence collection.',
        ];
        $userid = (int)user_create_user($user, true, false);
        pqh_assign_account_id($userid, 'sqa');
        $created = true;
    }

    if ($roleid > 0) {
        role_assign($roleid, $userid, context_system::instance()->id);
    }

    pqsqa_audit($created ? 'sqa_tester_created' : 'sqa_tester_updated', $userid, [
        'username' => $username,
        'roleid' => $roleid,
    ]);

    return [
        'userid' => $userid,
        'username' => $username,
        'email' => $email,
        'created' => $created,
        'roleid' => $roleid,
        'password' => $created ? $password : '',
    ];
}

$username = optional_param('username', 'sqa.tester', PARAM_USERNAME);
$email = optional_param('email', 'sqa.tester@eduplatform.test', PARAM_EMAIL);
$password = optional_param('password', 'Sqa@Test123!', PARAM_RAW);
$result = null;
$error = '';
$roleid = pqsqa_ensure_role();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This SQA tester setup form expired. Refresh the page and try again.');
        }
        if ($roleid <= 0) {
            throw new invalid_parameter_exception('Unable to create or find the sqa_tester role.');
        }
        $result = pqsqa_create_or_update_user($username, $password, $email, $roleid);
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

echo $OUTPUT->header();
?>
<style>
.pqsqa-wrap{max-width:1000px;margin:0 auto;padding:24px}
.pqsqa-card{background:#fff;border:1px solid #dfe8e4;border-radius:10px;padding:22px;margin-bottom:16px;box-shadow:0 10px 28px rgba(16,24,40,.06)}
.pqsqa-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.pqsqa-field label{display:block;margin:0 0 5px;color:#526861;font-size:12px;font-weight:800}
.pqsqa-field input{width:100%;min-height:40px;border:1px solid #d7e1dc;border-radius:8px;padding:0 10px}
.pqsqa-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.pqsqa-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border:0;border-radius:8px;background:#1f7a68;color:#fff!important;text-decoration:none;font-weight:900}
.pqsqa-btn--light{background:#eef7f4;color:#173d36!important;border:1px solid #d7e6df}
.pqsqa-ok{padding:13px 14px;border-radius:8px;background:#ecf9f1;color:#185c32;font-weight:800}
.pqsqa-error{padding:13px 14px;border-radius:8px;background:#fff0e6;color:#8a3e2e;font-weight:800}
.pqsqa-code{display:inline-block;padding:2px 6px;border-radius:5px;background:#f4f7f5;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
@media(max-width:760px){.pqsqa-grid{grid-template-columns:1fr}}
</style>
<main class="pqsqa-wrap">
  <section class="pqsqa-card">
    <h1>SQA Tester Setup</h1>
    <p>Create or refresh a Moodle user assigned to the <span class="pqsqa-code">sqa_tester</span> system role. Use this account for QA dashboard checks, release smoke testing, and test evidence capture.</p>
  </section>

  <section class="pqsqa-card">
    <h2>Role Status</h2>
    <?php if ($roleid > 0): ?>
      <div class="pqsqa-ok">SQA Tester role is ready. Role ID: <?php echo (int)$roleid; ?></div>
    <?php else: ?>
      <div class="pqsqa-error">SQA Tester role could not be created or found. Run the local_prequran upgrade or check role permissions.</div>
    <?php endif; ?>
  </section>

  <section class="pqsqa-card">
    <h2>Create / Refresh User</h2>
    <?php if ($error !== ''): ?>
      <div class="pqsqa-error"><?php echo s($error); ?></div>
    <?php elseif ($result): ?>
      <div class="pqsqa-ok">
        SQA tester account is ready:
        username <span class="pqsqa-code"><?php echo s($result['username']); ?></span>,
        user ID <span class="pqsqa-code"><?php echo (int)$result['userid']; ?></span>.
        <?php if ($result['password'] !== ''): ?>
          Temporary password: <span class="pqsqa-code"><?php echo s($result['password']); ?></span>
        <?php else: ?>
          Existing password was not changed.
        <?php endif; ?>
      </div>
    <?php endif; ?>
    <form method="post">
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
      <div class="pqsqa-grid">
        <div class="pqsqa-field">
          <label for="pqsqa-username">Username</label>
          <input id="pqsqa-username" name="username" value="<?php echo s($username); ?>" required>
        </div>
        <div class="pqsqa-field">
          <label for="pqsqa-email">Email</label>
          <input id="pqsqa-email" name="email" value="<?php echo s($email); ?>" required>
        </div>
        <div class="pqsqa-field">
          <label for="pqsqa-password">Temporary password for new user</label>
          <input id="pqsqa-password" name="password" value="<?php echo s($password); ?>" required>
        </div>
      </div>
      <div class="pqsqa-actions">
        <button class="pqsqa-btn" type="submit">Create / refresh SQA tester</button>
        <a class="pqsqa-btn pqsqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Open dashboard</a>
      </div>
    </form>
  </section>
</main>
<?php
echo $OUTPUT->footer();
