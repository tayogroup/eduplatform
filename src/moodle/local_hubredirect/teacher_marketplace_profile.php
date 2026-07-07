<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqtmp_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtmp_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtmp_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqtmp_ready(): bool {
    return pqtmp_table_exists('local_prequran_teacher_profile')
        && pqtmp_table_exists('local_prequran_teacher_request')
        && pqtmp_column_exists('local_prequran_teacher_profile', 'marketplace_visible')
        && pqtmp_column_exists('local_prequran_teacher_profile', 'marketplace_status')
        && pqtmp_column_exists('local_prequran_teacher_profile', 'vetting_status');
}

function pqtmp_safe_lines(string $value): string {
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    return nl2br(s($value));
}

function pqtmp_parent_children(int $parentid): array {
    global $DB;
    if ($parentid <= 0 || !pqtmp_table_exists('local_prequran_comm_consent') || !pqtmp_table_exists('local_prequran_student_profile')) {
        return [];
    }
    $children = array_values($DB->get_records_sql(
        "SELECT sp.userid, sp.student_display_name
           FROM {local_prequran_comm_consent} cc
           JOIN {local_prequran_student_profile} sp ON sp.userid = cc.studentid
          WHERE cc.guardianid = :parentid
       ORDER BY sp.student_display_name ASC",
        ['parentid' => $parentid],
        0,
        100
    ));
    return array_values(array_filter($children, static function($child): bool {
        return pqh_user_belongs_to_consumer_context((int)($child->userid ?? 0));
    }));
}

function pqtmp_add_participant(int $threadid, int $userid, string $role, int $canreply): void {
    global $DB;
    if ($threadid <= 0 || $userid <= 0 || !pqtmp_table_exists('local_prequran_comm_participant')) {
        return;
    }
    if ($DB->record_exists('local_prequran_comm_participant', ['threadid' => $threadid, 'userid' => $userid])) {
        return;
    }
    $now = time();
    $DB->insert_record('local_prequran_comm_participant', (object)[
        'threadid' => $threadid,
        'userid' => $userid,
        'role' => $role,
        'canreply' => $canreply,
        'lastreadmessageid' => 0,
        'muted' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqtmp_create_message_thread(int $teacherid, int $parentid, int $studentid, string $subject, string $body): int {
    global $DB;
    if (!pqtmp_table_exists('local_prequran_comm_thread')
        || !pqtmp_table_exists('local_prequran_comm_participant')
        || !pqtmp_table_exists('local_prequran_comm_message')) {
        return 0;
    }
    $now = time();
    $threadid = (int)$DB->insert_record('local_prequran_comm_thread', (object)[
        'type' => 'parent_teacher',
        'cohortid' => 0,
        'studentid' => $studentid > 0 ? $studentid : 0,
        'createdby' => $parentid,
        'status' => 'active',
        'subject' => $subject,
        'lastmessageat' => $now,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
        'threadid' => $threadid,
        'senderid' => $parentid,
        'studentid' => $studentid > 0 ? $studentid : 0,
        'messagekind' => 'text',
        'body' => $body,
        'templatekey' => 'teacher_marketplace_request',
        'status' => 'visible',
        'moderationflags' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    pqtmp_add_participant($threadid, $parentid, 'parent', 1);
    pqtmp_add_participant($threadid, $teacherid, 'teacher', 1);
    if (pqtmp_table_exists('local_prequran_comm_audit')) {
        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => $threadid,
            'messageid' => $messageid,
            'actorid' => $parentid,
            'action' => 'teacher_marketplace_request_created',
            'details' => json_encode(['teacherid' => $teacherid, 'studentid' => $studentid]),
            'timecreated' => $now,
        ]);
    }
    return $threadid;
}

function pqtmp_child_allowed(int $studentid, array $children): bool {
    global $USER;
    if ($studentid <= 0) {
        return true;
    }
    if (!pqh_user_belongs_to_consumer_context($studentid)) {
        return false;
    }
    $allowedstudents = array_fill_keys(array_map(static function($child): int {
        return (int)$child->userid;
    }, $children), true);
    return isset($allowedstudents[$studentid]) || pqh_can_manage_academy_operations((int)$USER->id);
}

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $consumerparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
$brandname = (string)$consumercontext->consumername;
$loggedin = isloggedin() && !isguestuser();
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$requestloginurl = new moodle_url('/local/hubredirect/teacher_marketplace_request.php', ['teacherid' => $teacherid] + $consumerparams);
$studentintakeurl = new moodle_url('/local/hubredirect/public_intake.php', ['teacherid' => $teacherid] + $consumerparams);
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', ['teacherid' => $teacherid] + $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Profile');
$PAGE->set_heading('Teacher Profile');
$PAGE->add_body_class('pqh-teacher-marketplace-profile-page');

$ready = pqtmp_ready();
$teacher = null;
$children = $loggedin ? pqtmp_parent_children((int)$USER->id) : [];
$message = '';
$error = '';
$createdthreadid = 0;

if ($ready && $teacherid > 0) {
    $consumerwhere = '';
    $consumerqueryparams = [];
    if (pqtmp_column_exists('local_prequran_teacher_profile', 'consumerid') && (int)$consumercontext->consumerid > 0) {
        $consumerwhere = ' AND tp.consumerid = :consumerid';
        $consumerqueryparams['consumerid'] = (int)$consumercontext->consumerid;
    }
    $teacher = $DB->get_record_sql(
        "SELECT tp.*, u.firstname, u.lastname
           FROM {local_prequran_teacher_profile} tp
           JOIN {user} u ON u.id = tp.userid
          WHERE tp.userid = :teacherid
            AND tp.status = :activestatus
            AND tp.marketplace_visible = 1
            AND tp.marketplace_status = :marketstatus
            AND tp.vetting_status = :vettingstatus
            {$consumerwhere}
            AND u.deleted = 0
            AND u.suspended = 0",
        ['teacherid' => $teacherid, 'activestatus' => 'active', 'marketstatus' => 'published', 'vettingstatus' => 'approved'] + $consumerqueryparams,
        IGNORE_MISSING
    ) ?: null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('submit_request', '', PARAM_TEXT) === '1') {
    require_login();
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This teacher request form expired. Please refresh and try again.');
        }
        if (!$ready || !$teacher) {
            throw new invalid_parameter_exception('This teacher profile is not available.');
        }
        $studentid = optional_param('studentid', 0, PARAM_INT);
        $body = trim(optional_param('request_message', '', PARAM_TEXT));
        if ($body === '') {
            $error = 'Please enter a message for the teacher.';
        } else {
            if (!pqtmp_child_allowed($studentid, $children)) {
                throw new invalid_parameter_exception('You can only send a teacher request for a linked child.');
            }
            $teachername = trim((string)$teacher->teacher_display_name) !== '' ? (string)$teacher->teacher_display_name : fullname($teacher);
            $subject = 'Teacher marketplace enquiry: ' . $teachername;
            $createdthreadid = pqtmp_create_message_thread((int)$teacher->userid, (int)$USER->id, $studentid, $subject, $body);
            $now = time();
            $requestrecord = (object)[
                'teacherid' => (int)$teacher->userid,
                'parentid' => (int)$USER->id,
                'studentid' => $studentid,
                'request_status' => 'new',
                'message' => $body,
                'threadid' => $createdthreadid,
                'admin_notes' => '',
                'reviewedby' => 0,
                'reviewedat' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            if (pqtmp_column_exists('local_prequran_teacher_request', 'consumerid')) {
                $requestrecord->consumerid = (int)$consumercontext->consumerid;
            }
            $requestid = (int)$DB->insert_record('local_prequran_teacher_request', $requestrecord);
            if (pqtmp_table_exists('local_prequran_live_audit')) {
                $DB->insert_record('local_prequran_live_audit', (object)[
                    'sessionid' => 0,
                    'actorid' => (int)$USER->id,
                    'action' => 'teacher_marketplace_request_submitted',
                    'targettype' => 'teacher_request',
                    'targetid' => $requestid,
                    'details' => json_encode(['teacherid' => (int)$teacher->userid, 'studentid' => $studentid, 'threadid' => $createdthreadid, 'consumerid' => (int)$consumercontext->consumerid, 'consumerslug' => (string)$consumercontext->consumerslug]),
                    'timecreated' => $now,
                ]);
            }
            $message = 'Your message was sent. ' . $brandname . ' may review the request before any teacher assignment is made.';
        }
    } catch (Throwable $e) {
        $error = 'Request did not complete: ' . $e->getMessage();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('submit_selection', '', PARAM_TEXT) === '1') {
    require_login();
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This teacher selection form expired. Please refresh and try again.');
        }
        if (!$ready || !$teacher) {
            throw new invalid_parameter_exception('This teacher profile is not available.');
        }
        $studentid = optional_param('selection_studentid', 0, PARAM_INT);
        if (!pqtmp_child_allowed($studentid, $children)) {
            throw new invalid_parameter_exception('You can only request a teacher for a linked child.');
        }
        $teachername = trim((string)$teacher->teacher_display_name) !== '' ? (string)$teacher->teacher_display_name : fullname($teacher);
        $notes = trim(optional_param('selection_notes', '', PARAM_TEXT));
        $body = "Formal teacher selection request for {$teachername}.";
        if ($notes !== '') {
            $body .= "\n\nParent notes: " . $notes;
        }
        $body .= "\n\n{$brandname} will review the request and may coordinate next steps. This request does not automatically assign the teacher.";
        $subject = 'Teacher selection request: ' . $teachername;
        $createdthreadid = pqtmp_create_message_thread((int)$teacher->userid, (int)$USER->id, $studentid, $subject, $body);
        $now = time();
        $requestconsumerwhere = '';
        $requestconsumerparams = [];
        if (pqtmp_column_exists('local_prequran_teacher_request', 'consumerid') && (int)$consumercontext->consumerid > 0) {
            $requestconsumerwhere = ' AND consumerid = :requestconsumerid';
            $requestconsumerparams['requestconsumerid'] = (int)$consumercontext->consumerid;
        }
        $existingrequest = $DB->get_record_sql(
            "SELECT *
               FROM {local_prequran_teacher_request}
              WHERE teacherid = :teacherid
                AND parentid = :parentid
                AND studentid = :studentid
                {$requestconsumerwhere}
                AND request_status NOT IN ('matched', 'assigned', 'declined', 'closed')
           ORDER BY timecreated DESC, id DESC",
            ['teacherid' => (int)$teacher->userid, 'parentid' => (int)$USER->id, 'studentid' => $studentid] + $requestconsumerparams,
            IGNORE_MULTIPLE
        );
        if ($existingrequest) {
            $existingrequest->request_status = 'selection_requested';
            $existingrequest->message = $body;
            $existingrequest->threadid = $createdthreadid;
            if (pqtmp_column_exists('local_prequran_teacher_request', 'consumerid')) {
                $existingrequest->consumerid = (int)$consumercontext->consumerid;
            }
            $existingrequest->timemodified = $now;
            $DB->update_record('local_prequran_teacher_request', $existingrequest);
            $requestid = (int)$existingrequest->id;
        } else {
            $requestrecord = (object)[
                'teacherid' => (int)$teacher->userid,
                'parentid' => (int)$USER->id,
                'studentid' => $studentid,
                'request_status' => 'selection_requested',
                'message' => $body,
                'threadid' => $createdthreadid,
                'admin_notes' => '',
                'reviewedby' => 0,
                'reviewedat' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            if (pqtmp_column_exists('local_prequran_teacher_request', 'consumerid')) {
                $requestrecord->consumerid = (int)$consumercontext->consumerid;
            }
            $requestid = (int)$DB->insert_record('local_prequran_teacher_request', $requestrecord);
        }
        if (pqtmp_table_exists('local_prequran_live_audit')) {
            $DB->insert_record('local_prequran_live_audit', (object)[
                'sessionid' => 0,
                'actorid' => (int)$USER->id,
                'action' => 'teacher_marketplace_selection_requested',
                'targettype' => 'teacher_request',
                'targetid' => $requestid,
                'details' => json_encode(['teacherid' => (int)$teacher->userid, 'studentid' => $studentid, 'threadid' => $createdthreadid, 'consumerid' => (int)$consumercontext->consumerid, 'consumerslug' => (string)$consumercontext->consumerslug]),
                'timecreated' => $now,
            ]);
        }
        $message = 'Your teacher selection request was submitted. ' . $brandname . ' will review and coordinate next steps; the family remains responsible for the final teacher choice.';
    } catch (Throwable $e) {
        $error = 'Selection request did not complete: ' . $e->getMessage();
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqh-teacher-marketplace-profile-page header,body.pqh-teacher-marketplace-profile-page footer,body.pqh-teacher-marketplace-profile-page nav.navbar,body.pqh-teacher-marketplace-profile-page #page-header,body.pqh-teacher-marketplace-profile-page #page-footer,body.pqh-teacher-marketplace-profile-page .drawer,body.pqh-teacher-marketplace-profile-page .drawer-toggles,body.pqh-teacher-marketplace-profile-page .block-region,body.pqh-teacher-marketplace-profile-page [data-region="drawer"],body.pqh-teacher-marketplace-profile-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-teacher-marketplace-profile-page #page,body.pqh-teacher-marketplace-profile-page #page-content,body.pqh-teacher-marketplace-profile-page #region-main,body.pqh-teacher-marketplace-profile-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqtmp-shell{min-height:100vh;padding:28px 18px 54px;background:#f4f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqtmp-wrap{max-width:1040px;margin:0 auto}.pqtmp-top,.pqtmp-panel,.pqtmp-note{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqtmp-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:14px}.pqtmp-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqtmp-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqtmp-actions{display:flex;gap:9px;flex-wrap:wrap}.pqtmp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 13px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}.pqtmp-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqtmp-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:14px}.pqtmp-panel{padding:18px;margin-bottom:14px;scroll-margin-top:20px}.pqtmp-panel h2{margin:0 0 10px;font-size:19px;font-weight:950;color:#241b24}.pqtmp-text{margin:0;color:#4f6472;font-size:14px;font-weight:780;line-height:1.52}.pqtmp-meta{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.pqtmp-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#eef7ee;color:#2f5d42;font-size:12px;font-weight:950}.pqtmp-pill--gold{background:#fff6de;color:#745323}.pqtmp-note{padding:14px 16px;margin-bottom:14px;color:#4f6472;font-size:14px;font-weight:850;line-height:1.45}.pqtmp-input,.pqtmp-select,.pqtmp-textarea{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}.pqtmp-textarea{min-height:130px}.pqtmp-field{display:grid;gap:6px;margin-bottom:10px}.pqtmp-field label{font-size:12px;font-weight:900;color:#415665}.pqtmp-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-weight:850}.pqtmp-alert--ok{background:#edf9ef;color:#245c35}.pqtmp-alert--bad{background:#fff0ed;color:#883526}.pqtmp-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;background:#fff;color:#5e7280;font-weight:850}.pqtmp-help{padding:10px 12px;margin:0 0 12px;border-radius:8px;background:#f7fafc;color:#4f6472;font-size:13px;font-weight:850;line-height:1.45}
@media(max-width:760px){.pqtmp-top{display:block}.pqtmp-actions{margin-top:12px}.pqtmp-grid{grid-template-columns:1fr}.pqtmp-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqtmp-shell">
  <div class="pqtmp-wrap">
    <section class="pqtmp-top pqh-workspace-top">
      <div>
        <h1 class="pqtmp-title pqh-workspace-title"><?php echo $teacher ? s(trim((string)$teacher->teacher_display_name) !== '' ? (string)$teacher->teacher_display_name : fullname($teacher)) : 'Teacher Profile'; ?></h1>
        <p class="pqtmp-sub pqh-workspace-sub">Private teacher/tutor profile for parent review.</p>
      </div>
      <div class="pqtmp-actions pqh-workspace-actions">
        <a class="pqtmp-btn pqtmp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams))->out(false); ?>">Marketplace</a>
        <?php if ($loggedin): ?>
          <a class="pqtmp-btn pqtmp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace_requests.php', $consumerparams))->out(false); ?>">My requests</a>
          <a class="pqtmp-btn pqtmp-btn--light" href="<?php echo (new moodle_url((int)($consumercontext->workspaceid ?? 0) > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $consumerparams))->out(false); ?>">Dashboard</a>
        <?php else: ?>
          <a class="pqtmp-btn pqtmp-btn--light" href="<?php echo (new moodle_url('/login/index.php', $consumerparams))->out(false); ?>">Log in</a>
        <?php endif; ?>
      </div>
    </section>
    <section class="pqtmp-note"><?php echo s($brandname); ?> performs initial marketplace review and controls which profiles are visible. Visibility is not a guarantee of fit, outcome, or assignment. Families should review the profile, communicate with the teacher or tutor, and make the final selection for their child or for themselves.</section>
    <?php if ($message !== ''): ?><div class="pqtmp-alert pqtmp-alert--ok"><?php echo s($message); ?><?php if ($createdthreadid > 0): ?> <a href="<?php echo (new moodle_url('/local/hubredirect/communications.php', $consumerparams + ['threadid' => $createdthreadid, 'opencomm' => 'messages']))->out(false) . '#threadid=' . (int)$createdthreadid; ?>">Open message thread</a><?php endif; ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqtmp-alert pqtmp-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <?php if (!$ready): ?>
      <div class="pqtmp-empty">Teacher marketplace schema is not ready yet. Please run the local_prequran Moodle upgrade.</div>
    <?php elseif (!$teacher): ?>
      <div class="pqtmp-empty">This teacher profile is not available.</div>
    <?php else: ?>
      <div class="pqtmp-grid">
        <div>
          <section class="pqtmp-panel">
            <h2>Overview</h2>
            <div class="pqtmp-meta">
              <?php if ((string)$teacher->primary_language !== ''): ?><span class="pqtmp-pill"><?php echo s((string)$teacher->primary_language); ?></span><?php endif; ?>
              <?php if ((string)$teacher->other_languages !== ''): ?><span class="pqtmp-pill"><?php echo s((string)$teacher->other_languages); ?></span><?php endif; ?>
              <?php if ((string)$teacher->timezone !== ''): ?><span class="pqtmp-pill"><?php echo s((string)$teacher->timezone); ?></span><?php endif; ?>
              <span class="pqtmp-pill pqtmp-pill--gold">Academy reviewed</span>
            </div>
            <?php if ((string)$teacher->marketplace_bio !== ''): ?><p class="pqtmp-text"><?php echo pqtmp_safe_lines((string)$teacher->marketplace_bio); ?></p><?php endif; ?>
          </section>
          <?php foreach ([
              'Skills' => (string)$teacher->marketplace_skills,
              'Experience' => (string)$teacher->marketplace_experience,
              'Education and qualifications' => (string)$teacher->marketplace_education,
              'Teaching style' => (string)$teacher->marketplace_teaching_style,
              'Courses intended to teach' => trim((string)$teacher->marketplace_courses) !== '' ? (string)$teacher->marketplace_courses : (string)$teacher->courses_taught,
              'Availability' => (string)$teacher->availability_summary,
              'Academy vetting summary' => (string)$teacher->vetting_summary,
          ] as $heading => $content): ?>
            <?php if (trim($content) !== ''): ?>
              <section class="pqtmp-panel"><h2><?php echo s($heading); ?></h2><p class="pqtmp-text"><?php echo pqtmp_safe_lines($content); ?></p></section>
            <?php endif; ?>
          <?php endforeach; ?>
        </div>
        <aside>
          <?php if (!$loggedin): ?>
            <section class="pqtmp-panel" id="request-teacher">
              <h2>Request This Teacher</h2>
              <p class="pqtmp-text">Log in or create a parent/student intake request before sending a teacher message or selection request.</p>
              <p><a class="pqtmp-btn" href="<?php echo $requestloginurl->out(false); ?>">Log in to request</a></p>
              <p><a class="pqtmp-btn pqtmp-btn--light" href="<?php echo $studentintakeurl->out(false); ?>">Student intake</a></p>
            </section>
          <?php else: ?>
            <section class="pqtmp-panel" id="request-teacher">
              <h2>Request / Select This Teacher</h2>
              <p class="pqtmp-text">Use this when you are ready for <?php echo s($brandname); ?> to record your preference and review next steps. This does not automatically assign the teacher or create a teaching agreement.</p>
              <?php if (!$children): ?>
                <div class="pqtmp-help">No linked student was found for your account. You can request this teacher for yourself, or submit a student intake first if this is for a child.</div>
                <p><a class="pqtmp-btn pqtmp-btn--light" href="<?php echo $studentintakeurl->out(false); ?>">Student intake</a></p>
              <?php endif; ?>
              <form method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
                <?php if ((int)($consumercontext->workspaceid ?? 0) > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$consumercontext->workspaceid; ?>"><?php endif; ?>
                <div class="pqtmp-field">
                  <label>Student</label>
                  <select class="pqtmp-select" name="selection_studentid">
                    <option value="0">For myself / not linked to a child</option>
                    <?php foreach ($children as $child): ?>
                      <option value="<?php echo (int)$child->userid; ?>"><?php echo s((string)$child->student_display_name); ?></option>
                    <?php endforeach; ?>
                  </select>
                </div>
                <div class="pqtmp-field">
                  <label>Notes for <?php echo s($brandname); ?></label>
                  <textarea class="pqtmp-textarea" name="selection_notes" placeholder="Optional: share why this teacher looks like a good fit, learner goals, schedule needs, or questions for review."></textarea>
                </div>
                <button class="pqtmp-btn" type="submit" name="submit_selection" value="1">Request / select teacher</button>
              </form>
            </section>
            <section class="pqtmp-panel">
              <h2>Message This Teacher</h2>
              <?php if (!$children): ?>
                <div class="pqtmp-help">Messages can be sent without a linked student, but linking a student gives <?php echo s($brandname); ?> better context for scheduling and placement.</div>
              <?php endif; ?>
              <form method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
                <?php if ((int)($consumercontext->workspaceid ?? 0) > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$consumercontext->workspaceid; ?>"><?php endif; ?>
                <div class="pqtmp-field">
                  <label>Student</label>
                  <select class="pqtmp-select" name="studentid">
                    <option value="0">For myself / not linked to a child</option>
                    <?php foreach ($children as $child): ?>
                      <option value="<?php echo (int)$child->userid; ?>"><?php echo s((string)$child->student_display_name); ?></option>
                    <?php endforeach; ?>
                  </select>
                </div>
                <div class="pqtmp-field">
                  <label>Message</label>
                  <textarea class="pqtmp-textarea" name="request_message" placeholder="Share the learner age or level, goals, preferred schedule, and any questions for the teacher."></textarea>
                </div>
                <button class="pqtmp-btn" type="submit" name="submit_request" value="1">Send message</button>
              </form>
            </section>
          <?php endif; ?>
        </aside>
      </div>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
