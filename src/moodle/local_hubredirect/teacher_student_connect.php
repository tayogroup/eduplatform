<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/account_ids.php');

$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'Marketplace';
$isindependentteacher = pqh_has_independent_teacher_profile((int)$USER->id);
if (!$isindependentteacher) {
    pqh_access_denied(
        'Only approved independent teachers can find or invite students from this page.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Student connection access required'
    );
}

function pqtsc_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtsc_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtsc_table_exists($table)) {
        return false;
    }
    try {
        return array_key_exists($column, $DB->get_columns($table));
    } catch (Throwable $e) {
        return false;
    }
}

function pqtsc_exact_matches(string $query): array {
    global $DB, $CFG;
    $query = trim($query);
    if ($query === '' || !pqtsc_table_exists('local_prequran_student_profile')) {
        return [];
    }

    $where = [
        'LOWER(u.email) = LOWER(:studentemail)',
        'LOWER(u.username) = LOWER(:studentusername)',
        'u.idnumber = :accountnumber',
    ];
    $params = [
        'studentemail' => $query,
        'studentusername' => $query,
        'accountnumber' => $query,
        'mnethostid' => $CFG->mnet_localhost_id,
    ];
    if (ctype_digit($query)) {
        $where[] = 'u.id = :studentuserid';
        $params['studentuserid'] = (int)$query;
    }
    if (pqtsc_column_exists('local_prequran_student_profile', 'parent_email')) {
        $where[] = 'LOWER(sp.parent_email) = LOWER(:parentemail)';
        $params['parentemail'] = $query;
    }
    if (pqtsc_column_exists('local_prequran_student_profile', 'parent_phone')) {
        $where[] = 'sp.parent_phone = :parentphone';
        $params['parentphone'] = $query;
    }

    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.idnumber,
                sp.student_display_name
           FROM {user} u
           JOIN {local_prequran_student_profile} sp ON sp.userid = u.id
          WHERE u.deleted = 0
            AND u.mnethostid = :mnethostid
            AND (" . implode(' OR ', $where) . ")
       ORDER BY u.lastname ASC, u.firstname ASC, u.id ASC",
        $params,
        0,
        10
    ));
}

function pqtsc_linked_parentid(int $studentid): int {
    global $DB;
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (!pqtsc_table_exists($table)
                || !pqtsc_column_exists($table, 'studentid')
                || !pqtsc_column_exists($table, 'guardianid')) {
            continue;
        }
        $parentid = (int)$DB->get_field_sql(
            "SELECT MAX(guardianid) FROM {{$table}} WHERE studentid = :studentid AND guardianid > 0",
            ['studentid' => $studentid]
        );
        if ($parentid > 0) {
            return $parentid;
        }
    }
    return 0;
}

function pqtsc_request_connection(int $teacherid, int $studentid, int $consumerid, int $workspaceid): int {
    global $DB, $USER;
    if (!pqtsc_table_exists('local_prequran_teacher_request')) {
        throw new invalid_parameter_exception('The teacher connection request table is not installed.');
    }
    if (!$DB->record_exists('local_prequran_student_profile', ['userid' => $studentid])) {
        throw new invalid_parameter_exception('Choose a valid existing student profile.');
    }
    if ($workspaceid <= 0) {
        throw new invalid_parameter_exception('An independent-teacher workspace is required.');
    }
    if (pqtsc_table_exists('local_prequran_teacher_student') && $DB->record_exists('local_prequran_teacher_student', [
        'workspaceid' => $workspaceid,
        'teacherid' => $teacherid,
        'studentid' => $studentid,
        'status' => 'active',
    ])) {
        throw new invalid_parameter_exception('This student is already connected to your independent teaching workspace.');
    }

    $now = time();
    $parentid = pqtsc_linked_parentid($studentid);
    $where = 'teacherid = :teacherid AND studentid = :studentid AND request_status NOT IN (:assigned, :declined, :closed)';
    $params = [
        'teacherid' => $teacherid,
        'studentid' => $studentid,
        'assigned' => 'assigned',
        'declined' => 'declined',
        'closed' => 'closed',
    ];
    if ($consumerid > 0 && pqtsc_column_exists('local_prequran_teacher_request', 'consumerid')) {
        $where .= ' AND consumerid = :consumerid';
        $params['consumerid'] = $consumerid;
    }
    $existing = $DB->get_record_select(
        'local_prequran_teacher_request',
        $where,
        $params,
        '*',
        IGNORE_MULTIPLE
    );
    if ($existing) {
        $existing->request_status = 'selection_requested';
        $existing->parentid = $parentid;
        $existing->message = 'Independent teacher requested a connection to an existing learner. Awaiting guardian/adult learner and marketplace review.';
        $existing->timemodified = $now;
        $DB->update_record('local_prequran_teacher_request', $existing);
        return (int)$existing->id;
    }

    $record = (object)[
        'teacherid' => $teacherid,
        'parentid' => $parentid,
        'studentid' => $studentid,
        'request_status' => 'selection_requested',
        'message' => 'Independent teacher requested a connection to an existing learner. Awaiting guardian/adult learner and marketplace review.',
        'threadid' => 0,
        'admin_notes' => 'Created from Find or invite student. Existing identity was reused; no duplicate student profile was created.',
        'reviewedby' => 0,
        'reviewedat' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    if ($consumerid > 0 && pqtsc_column_exists('local_prequran_teacher_request', 'consumerid')) {
        $record->consumerid = $consumerid;
    }
    return (int)$DB->insert_record('local_prequran_teacher_request', $record);
}

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = $requestedworkspaceid > 0
    ? $requestedworkspaceid
    : pqh_current_workspace_id((int)$USER->id, (int)($consumercontext->workspaceid ?? 0));
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'An active independent-teacher workspace is required before connecting students.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Teacher workspace required'
    );
}

$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
$query = trim(optional_param('q', '', PARAM_TEXT));
$matches = $query !== '' ? pqtsc_exact_matches($query) : [];
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This connection request expired. Refresh and try again.');
        }
        $studentid = optional_param('studentid', 0, PARAM_INT);
        $requestid = pqtsc_request_connection(
            (int)$USER->id,
            $studentid,
            (int)($consumercontext->consumerid ?? 0),
            $workspaceid
        );
        $message = 'Connection request #' . $requestid . ' was submitted. The existing student record was not duplicated or changed.';
        $query = '';
        $matches = [];
    } catch (Throwable $e) {
        $error = 'Connection request was not submitted: ' . $e->getMessage();
    }
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_student_connect.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Find or Invite Student');
$PAGE->set_heading('Find or Invite Student');
$PAGE->add_body_class('pqh-teacher-student-connect-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-teacher-student-connect-page header,body.pqh-teacher-student-connect-page footer,body.pqh-teacher-student-connect-page nav.navbar,body.pqh-teacher-student-connect-page #page-header,body.pqh-teacher-student-connect-page #page-footer,body.pqh-teacher-student-connect-page .drawer,body.pqh-teacher-student-connect-page .drawer-toggles{display:none!important}
body.pqh-teacher-student-connect-page #page,body.pqh-teacher-student-connect-page #page-content,body.pqh-teacher-student-connect-page #region-main,body.pqh-teacher-student-connect-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqtsc-shell{min-height:100vh;padding:28px 18px 60px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqtsc-wrap{max-width:1080px;margin:0 auto}.pqtsc-top,.pqtsc-panel{padding:22px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 30px rgba(23,48,68,.07)}.pqtsc-top{display:flex;justify-content:space-between;gap:18px;align-items:center;margin-bottom:18px;background:linear-gradient(100deg,#4f8468,#eef4f3 72%,#fff)}.pqtsc-title{margin:0;font-size:30px;font-weight:950}.pqtsc-sub{margin:7px 0 0;color:#526b61;font-weight:800}.pqtsc-actions,.pqtsc-results{display:flex;flex-wrap:wrap;gap:10px}.pqtsc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 14px;border:1px solid rgba(23,48,68,.14);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-weight:950;cursor:pointer}.pqtsc-btn--primary{background:#2f6f4e;color:#fff!important}.pqtsc-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:18px}.pqtsc-panel h2{margin:0 0 8px;font-size:22px}.pqtsc-panel p{color:#5e7280;font-weight:750}.pqtsc-search{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:18px}.pqtsc-input{width:100%;min-height:46px;padding:10px 12px;border:1px solid rgba(23,48,68,.2);border-radius:8px;font:800 15px/1.2 inherit}.pqtsc-card{width:100%;padding:15px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff}.pqtsc-card strong{display:block;font-size:17px}.pqtsc-meta{margin:4px 0 12px!important;font-size:13px}.pqtsc-alert{margin-bottom:16px;padding:13px 15px;border-radius:8px;font-weight:850}.pqtsc-alert--ok{background:#edf9ef;color:#245c35}.pqtsc-alert--bad{background:#fff0ed;color:#883526}.pqtsc-note{margin-top:16px;padding:12px;border-left:4px solid #d99a26;background:#fff8e8;color:#66502e;font-weight:800}@media(max-width:760px){.pqtsc-top{display:block}.pqtsc-actions{margin-top:14px}.pqtsc-grid,.pqtsc-search{grid-template-columns:1fr}.pqtsc-title{font-size:25px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqtsc-shell"><div class="pqtsc-wrap">
  <section class="pqtsc-top pqh-workspace-top"><div><h1 class="pqtsc-title pqh-workspace-title">Find or Invite Student</h1><p class="pqtsc-sub pqh-workspace-sub">Reuse an existing learner identity or invite a genuinely new student into your independent teaching workspace.</p></div><div class="pqtsc-actions pqh-workspace-actions"><a class="pqtsc-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php', $urlparams))->out(false); ?>">Dashboard</a></div></section>
  <?php if ($message !== ''): ?><div class="pqtsc-alert pqtsc-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqtsc-alert pqtsc-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
  <div class="pqtsc-grid">
    <section class="pqtsc-panel"><h2>Find existing student</h2><p>Search using the exact Moodle user ID, <?php echo s($brandname); ?> account number, username, verified email, or guardian contact. Partial-name searches are intentionally not supported.</p><form method="get" class="pqtsc-search"><?php foreach ($urlparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?><input class="pqtsc-input" name="q" value="<?php echo s($query); ?>" placeholder="Exact account number, ID, email, username, or contact" required><button class="pqtsc-btn pqtsc-btn--primary" type="submit">Search</button></form>
      <?php if ($query !== ''): ?><div class="pqtsc-results" style="margin-top:16px"><?php if (!$matches): ?><div class="pqtsc-card">No exact existing learner match was found. Check the identifier or invite a new student.</div><?php else: ?><?php foreach ($matches as $match): ?><article class="pqtsc-card"><strong><?php echo s(trim((string)$match->student_display_name) !== '' ? (string)$match->student_display_name : fullname($match)); ?></strong><p class="pqtsc-meta">Account <?php echo s(trim((string)$match->idnumber) !== '' ? (string)$match->idnumber : 'not assigned'); ?> - Moodle ID <?php echo (int)$match->id; ?></p><form method="post"><input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>"><input type="hidden" name="studentid" value="<?php echo (int)$match->id; ?>"><button class="pqtsc-btn pqtsc-btn--primary" type="submit">Request connection</button></form></article><?php endforeach; ?><?php endif; ?></div><?php endif; ?>
      <div class="pqtsc-note">A match creates a connection request. It does not copy, transfer, or expose the institution's private grades, notes, billing, or communications.</div>
    </section>
    <section class="pqtsc-panel"><h2>Invite new student</h2><p>Use the full intake only when no existing learner account is found. The intake creates the learner and guardian records, consent, and workspace relationship.</p><a class="pqtsc-btn pqtsc-btn--primary" href="<?php echo (new moodle_url('/local/hubredirect/student_intake.php', $urlparams + ['mode' => 'new']))->out(false); ?>">Open new student intake</a><div class="pqtsc-note">Always search first. This prevents duplicate Moodle accounts and fragmented learning histories.</div></section>
  </div>
</div></main>
<?php echo $OUTPUT->footer();
