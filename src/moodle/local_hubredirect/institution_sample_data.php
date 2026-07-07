<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/account_ids.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace owners and admins can create institution validation data.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Institution validation access required'
    );
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'Choose a valid workspace before creating institution validation data.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Institution validation unavailable'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_sample_data.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution Validation Data');
$PAGE->set_heading('Institution Validation Data');
$PAGE->add_body_class('pqisd-page');

function pqisd_unique_username(string $seed): string {
    global $DB, $CFG;
    $base = substr(preg_replace('/[^a-z0-9._-]+/', '.', strtolower($seed)) ?: 'institution.sample', 0, 80);
    $username = trim($base, '.-_');
    if ($username === '') {
        $username = 'institution.sample';
    }
    $candidate = $username;
    $suffix = 1;
    while ($DB->record_exists('user', ['username' => $candidate, 'mnethostid' => $CFG->mnet_localhost_id])) {
        $suffix++;
        $candidate = substr($username, 0, 70) . '.' . $suffix;
    }
    return $candidate;
}

function pqisd_user(string $username, string $firstname, string $lastname, string $email): int {
    global $DB, $CFG;
    $existing = $DB->get_record('user', [
        'username' => $username,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], 'id', IGNORE_MISSING);
    if ($existing) {
        return (int)$existing->id;
    }
    $emailuser = $DB->get_record('user', [
        'email' => $email,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], 'id', IGNORE_MISSING);
    if ($emailuser) {
        return (int)$emailuser->id;
    }
    $user = (object)[
        'auth' => 'manual',
        'confirmed' => 1,
        'mnethostid' => $CFG->mnet_localhost_id,
        'username' => pqisd_unique_username($username),
        'password' => generate_password(12),
        'firstname' => $firstname,
        'lastname' => $lastname,
        'email' => $email,
        'emailstop' => 1,
        'country' => '',
        'city' => '',
        'timezone' => '99',
        'lang' => $CFG->lang ?? 'en',
    ];
    $userid = (int)user_create_user($user, true, false);
    pqh_assign_account_id($userid, 'workspace');
    return $userid;
}

function pqisd_upsert_member(int $workspaceid, int $userid, string $role, int $actorid): void {
    pqhi_upsert_workspace_member($workspaceid, $userid, $role, $actorid, 'Seeded by institution validation data.');
}

function pqisd_upsert_teacher_student(int $workspaceid, int $teacherid, int $studentid, int $actorid): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_teacher_student')) {
        return;
    }
    $now = time();
    $record = (object)[
        'workspaceid' => $workspaceid,
        'teacherid' => $teacherid,
        'studentid' => $studentid,
        'cohortid' => 0,
        'status' => 'active',
        'assignedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_teacher_student', [
        'workspaceid' => $workspaceid,
        'teacherid' => $teacherid,
        'studentid' => $studentid,
    ], '*', IGNORE_MISSING);
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)($existing->timecreated ?? $now);
        $DB->update_record('local_prequran_teacher_student', pqhi_record_for_existing_columns('local_prequran_teacher_student', $record));
    } else {
        $DB->insert_record('local_prequran_teacher_student', pqhi_record_for_existing_columns('local_prequran_teacher_student', $record));
    }
}

function pqisd_upsert_comm_link(int $studentid, int $parentid): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_comm_consent')) {
        return;
    }
    $now = time();
    $record = (object)[
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'student_messaging_enabled' => 1,
        'free_text_enabled' => 0,
        'parent_visible' => 1,
        'consent_source' => 'institution_sample_data',
        'details' => 'Sample parent link for institution validation.',
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_comm_consent', ['studentid' => $studentid, 'guardianid' => $parentid], '*', IGNORE_MISSING);
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)($existing->timecreated ?? $now);
        $DB->update_record('local_prequran_comm_consent', pqhi_record_for_existing_columns('local_prequran_comm_consent', $record));
    } else {
        $DB->insert_record('local_prequran_comm_consent', pqhi_record_for_existing_columns('local_prequran_comm_consent', $record));
    }
}

function pqisd_upsert_live_consent(int $studentid, int $parentid, string $type): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_consent')) {
        return;
    }
    $now = time();
    $record = (object)[
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => $type,
        'granted' => 1,
        'version' => '1',
        'consent_source' => 'institution_sample_data',
        'details' => 'Sample consent for institution validation.',
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_live_consent', [
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => $type,
    ], '*', IGNORE_MISSING);
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)($existing->timecreated ?? $now);
        $DB->update_record('local_prequran_live_consent', pqhi_record_for_existing_columns('local_prequran_live_consent', $record));
    } else {
        $DB->insert_record('local_prequran_live_consent', pqhi_record_for_existing_columns('local_prequran_live_consent', $record));
    }
}

function pqisd_session(int $workspaceid, int $teacherid, string $title, int $start, string $status, int $actorid): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_session')) {
        return 0;
    }
    $existing = $DB->get_record('local_prequran_live_session', [
        'workspaceid' => $workspaceid,
        'title' => $title,
    ], '*', IGNORE_MISSING);
    $now = time();
    $record = (object)[
        'workspaceid' => $workspaceid,
        'seriesid' => 0,
        'series_sequence' => 0,
        'cohortid' => 0,
        'teacherid' => $teacherid,
        'session_type' => 'teacher_led',
        'teacher_required' => 1,
        'report_to_teacherid' => $teacherid,
        'lessonid' => 'institution-sample',
        'unitid' => 'workspace-validation',
        'title' => $title,
        'description' => 'Institution validation sample live class.',
        'scheduled_start' => $start,
        'scheduled_end' => $start + 3600,
        'timezone' => 'UTC',
        'status' => $status,
        'qa_status' => $status === 'completed' ? 'reviewed' : 'not_reviewed',
        'qa_score' => $status === 'completed' ? 90 : 0,
        'recording_enabled' => 1,
        'recording_consent_required' => 1,
        'parent_observer_allowed' => 1,
        'max_participants' => 12,
        'bbb_meeting_id' => 'sample-' . $workspaceid . '-' . preg_replace('/[^a-z0-9]+/', '-', strtolower($title)),
        'bbb_created' => 0,
        'createdby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)($existing->timecreated ?? $now);
        $DB->update_record('local_prequran_live_session', pqhi_record_for_existing_columns('local_prequran_live_session', $record));
        return (int)$existing->id;
    }
    return (int)$DB->insert_record('local_prequran_live_session', pqhi_record_for_existing_columns('local_prequran_live_session', $record));
}

function pqisd_participant(int $sessionid, int $userid, string $role, int $actorid): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_participant') || $sessionid <= 0) {
        return;
    }
    $now = time();
    $record = (object)[
        'sessionid' => $sessionid,
        'userid' => $userid,
        'role' => $role,
        'studentid' => $role === 'student' ? $userid : 0,
        'status' => 'active',
        'displayname' => fullname(core_user::get_user($userid)),
        'invitedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_live_participant', [
        'sessionid' => $sessionid,
        'userid' => $userid,
        'role' => $role,
    ], '*', IGNORE_MISSING);
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)($existing->timecreated ?? $now);
        $DB->update_record('local_prequran_live_participant', pqhi_record_for_existing_columns('local_prequran_live_participant', $record));
    } else {
        $DB->insert_record('local_prequran_live_participant', pqhi_record_for_existing_columns('local_prequran_live_participant', $record));
    }
}

function pqisd_attendance(int $sessionid, int $studentid, int $teacherid): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_attendance') || $sessionid <= 0) {
        return;
    }
    $now = time();
    $record = (object)[
        'sessionid' => $sessionid,
        'userid' => $studentid,
        'studentid' => $studentid,
        'join_time' => $now - 3500,
        'leave_time' => $now - 100,
        'attendance_status' => 'present',
        'participation_status' => 'engaged',
        'technical_issue' => 0,
        'notes' => 'Sample attendance for institution validation.',
        'markedby' => $teacherid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_live_attendance', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)($existing->timecreated ?? $now);
        $DB->update_record('local_prequran_live_attendance', pqhi_record_for_existing_columns('local_prequran_live_attendance', $record));
    } else {
        $DB->insert_record('local_prequran_live_attendance', pqhi_record_for_existing_columns('local_prequran_live_attendance', $record));
    }
}

function pqisd_note(int $sessionid, int $studentid, int $teacherid): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_note') || $sessionid <= 0) {
        return;
    }
    $now = time();
    $record = (object)[
        'sessionid' => $sessionid,
        'studentid' => $studentid,
        'teacherid' => $teacherid,
        'strengths' => 'Recognized sample lesson words with confidence.',
        'needs_practice' => 'Practice fluency and short-vowel review.',
        'homework' => 'Review the assigned validation material.',
        'homework_lessonid' => 'institution-sample',
        'homework_unitid' => 'workspace-validation',
        'homework_due_date' => time() + WEEKSECS,
        'homework_priority' => 'normal',
        'followup_status' => 'open',
        'parent_summary' => 'Sample parent-visible progress note.',
        'private_note' => 'Generated by institution validation data.',
        'visible_to_parent' => 1,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_live_note', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)($existing->timecreated ?? $now);
        $DB->update_record('local_prequran_live_note', pqhi_record_for_existing_columns('local_prequran_live_note', $record));
    } else {
        $DB->insert_record('local_prequran_live_note', pqhi_record_for_existing_columns('local_prequran_live_note', $record));
    }
}

function pqisd_material(int $workspaceid, int $studentid, int $actorid): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_material')) {
        return 0;
    }
    $title = 'Institution validation reading practice';
    $now = time();
    $record = (object)[
        'workspaceid' => $workspaceid,
        'title' => $title,
        'material_type' => 'link',
        'course_key' => 'institution-sample',
        'description' => 'Sample material used to validate workspace reports and assignment workflow.',
        'source_url' => '/local/hubredirect/workspace_dashboard.php?workspaceid=' . $workspaceid,
        'metadatajson' => json_encode(['sample' => true], JSON_UNESCAPED_SLASHES),
        'visibility' => 'workspace',
        'status' => 'active',
        'createdby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_workspace_material', ['workspaceid' => $workspaceid, 'title' => $title], '*', IGNORE_MISSING);
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)($existing->timecreated ?? $now);
        $DB->update_record('local_prequran_workspace_material', pqhi_record_for_existing_columns('local_prequran_workspace_material', $record));
        $materialid = (int)$existing->id;
    } else {
        $materialid = (int)$DB->insert_record('local_prequran_workspace_material', pqhi_record_for_existing_columns('local_prequran_workspace_material', $record));
    }
    if (pqh_table_exists_safe('local_prequran_workspace_mat_assign') && $materialid > 0) {
        $assign = (object)[
            'workspaceid' => $workspaceid,
            'materialid' => $materialid,
            'target_type' => 'student',
            'targetid' => $studentid,
            'status' => 'active',
            'workflow_status' => 'reviewed',
            'assignedby' => $actorid,
            'startedat' => $now - DAYSECS,
            'completedat' => $now - HOURSECS,
            'reviewedby' => $actorid,
            'reviewedat' => $now,
            'review_notes' => 'Sample reviewed assignment for institution reports.',
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $existingassign = $DB->get_record('local_prequran_workspace_mat_assign', [
            'workspaceid' => $workspaceid,
            'materialid' => $materialid,
            'target_type' => 'student',
            'targetid' => $studentid,
        ], '*', IGNORE_MISSING);
        if ($existingassign) {
            $assign->id = (int)$existingassign->id;
            $assign->timecreated = (int)($existingassign->timecreated ?? $now);
            $DB->update_record('local_prequran_workspace_mat_assign', pqhi_record_for_existing_columns('local_prequran_workspace_mat_assign', $assign));
        } else {
            $DB->insert_record('local_prequran_workspace_mat_assign', pqhi_record_for_existing_columns('local_prequran_workspace_mat_assign', $assign));
        }
    }
    return $materialid;
}

$message = '';
$error = '';
$created = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the validation data page and try again.',
            new moodle_url('/local/hubredirect/institution_sample_data.php', $urlparams),
            'Institution validation form expired'
        );
    }
    try {
        $seed = 'workspace' . $workspaceid;
        $teacherid = pqisd_user('sample.teacher.' . $seed, 'Sample', 'Teacher', 'sample.teacher.' . $seed . '@eduplatform.local');
        $studentid = pqisd_user('sample.student.' . $seed, 'Sample', 'Student', 'sample.student.' . $seed . '@eduplatform.local');
        $parentid = pqisd_user('sample.parent.' . $seed, 'Sample', 'Parent', 'sample.parent.' . $seed . '@eduplatform.local');
        pqisd_upsert_member($workspaceid, $teacherid, 'teacher', (int)$USER->id);
        pqisd_upsert_member($workspaceid, $studentid, 'student', (int)$USER->id);
        pqisd_upsert_member($workspaceid, $parentid, 'parent', (int)$USER->id);
        pqisd_upsert_teacher_student($workspaceid, $teacherid, $studentid, (int)$USER->id);
        pqisd_upsert_comm_link($studentid, $parentid);
        pqisd_upsert_live_consent($studentid, $parentid, 'live_session');
        pqisd_upsert_live_consent($studentid, $parentid, 'recording_policy');
        $pastsessionid = pqisd_session($workspaceid, $teacherid, 'Institution validation completed class', time() - DAYSECS, 'completed', (int)$USER->id);
        $futuresessionid = pqisd_session($workspaceid, $teacherid, 'Institution validation upcoming class', time() + DAYSECS, 'scheduled', (int)$USER->id);
        foreach ([$pastsessionid, $futuresessionid] as $sessionid) {
            pqisd_participant($sessionid, $teacherid, 'teacher', (int)$USER->id);
            pqisd_participant($sessionid, $studentid, 'student', (int)$USER->id);
        }
        pqisd_attendance($pastsessionid, $studentid, $teacherid);
        pqisd_note($pastsessionid, $studentid, $teacherid);
        $materialid = pqisd_material($workspaceid, $studentid, (int)$USER->id);
        $created = compact('teacherid', 'studentid', 'parentid', 'pastsessionid', 'futuresessionid', 'materialid');
        $message = 'Institution validation data is ready for reports, materials, sessions, and people testing.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqisd-page header,body.pqisd-page footer,body.pqisd-page nav.navbar,body.pqisd-page #page-header,body.pqisd-page #page-footer,body.pqisd-page .drawer,body.pqisd-page .drawer-toggles,body.pqisd-page .block-region,body.pqisd-page [data-region="drawer"],body.pqisd-page [data-region="right-hand-drawer"]{display:none!important}
body.pqisd-page #page,body.pqisd-page #page-content,body.pqisd-page #region-main,body.pqisd-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqisd-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqisd-wrap{max-width:1100px;margin:0 auto}.pqisd-top,.pqisd-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqisd-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqisd-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqisd-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqisd-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqisd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqisd-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqisd-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqisd-alert--ok{background:#edf9ef;color:#245c35}.pqisd-alert--bad{background:#fff0ed;color:#883526}.pqisd-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pqisd-list{margin:0;padding-left:18px;color:#536978;font-size:14px;font-weight:760;line-height:1.55}.pqisd-list li{margin:5px 0}.pqisd-id{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
@media(max-width:800px){.pqisd-top,.pqisd-grid{grid-template-columns:1fr}.pqisd-actions{justify-content:flex-start}}
<?php echo pqh_workspace_header_css(); ?>
</style>
<main class="pqisd-shell">
  <div class="pqisd-wrap">
    <section class="pqisd-top pqh-workspace-top">
      <div>
        <h1 class="pqisd-title pqh-workspace-title"><?php echo s($workspace->name); ?> Validation Data</h1>
        <p class="pqisd-sub pqh-workspace-sub">Seed scoped test data for institution people, sessions, attendance, reports, and materials.</p>
      </div>
      <nav class="pqisd-actions pqh-workspace-actions">
        <a class="pqisd-btn pqisd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a>
        <a class="pqisd-btn pqisd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_reports.php', $urlparams))->out(false); ?>">Reports</a>
        <a class="pqisd-btn pqisd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_people.php', $urlparams))->out(false); ?>">People</a>
      </nav>
    </section>
    <?php if ($message !== ''): ?><div class="pqisd-alert pqisd-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqisd-alert pqisd-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <section class="pqisd-grid">
      <form class="pqisd-panel" method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <h2>Create / Refresh Sample Data</h2>
        <ul class="pqisd-list">
          <li>Creates reusable sample teacher, student, and parent accounts for this workspace.</li>
          <li>Adds workspace membership, teacher assignment, and parent guardian links.</li>
          <li>Creates one completed class with attendance and a parent-visible note.</li>
          <li>Creates one upcoming class and one reviewed material assignment.</li>
        </ul>
        <button class="pqisd-btn" type="submit">Create validation data</button>
      </form>
      <article class="pqisd-panel">
        <h2>After Seeding</h2>
        <?php if ($created): ?>
          <?php foreach ($created as $label => $value): ?><span class="pqisd-id"><?php echo s($label); ?>: <?php echo (int)$value; ?></span><?php endforeach; ?>
        <?php else: ?>
          <p class="pqisd-sub">Run the seeder, then open the People, Sessions, Materials, and Reports pages to verify institution-scoped operations.</p>
        <?php endif; ?>
        <div class="pqisd-actions" style="justify-content:flex-start;margin-top:12px">
          <a class="pqisd-btn pqisd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_sessions.php', $urlparams))->out(false); ?>">Live sessions</a>
          <a class="pqisd-btn pqisd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams))->out(false); ?>">Materials</a>
          <a class="pqisd-btn pqisd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_reports.php', $urlparams))->out(false); ?>">Reports</a>
        </div>
      </article>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
