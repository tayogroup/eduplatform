<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once(__DIR__ . '/live_security.php');

$childid = optional_param('childid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
$returnurl = new moodle_url($workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $urlparams);

function pqlt_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(pqlt_url('/local/hubredirect/live_trust.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Class Trust Center');
$PAGE->set_heading('Live Class Trust Center');
$PAGE->add_body_class('pqh-live-trust-page');

function pqlt_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlt_table_has_field(string $table, string $field): bool {
    global $DB;
    return pqlt_table_exists($table) && $DB->get_manager()->field_exists($table, $field);
}

function pqlt_apply_record_fields(string $table, stdClass $record, array $values): stdClass {
    foreach ($values as $field => $value) {
        if (pqlt_table_has_field($table, $field)) {
            $record->{$field} = $value;
        }
    }
    return $record;
}

function pqlt_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqlt_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlt_table_exists('local_prequran_comm_participant') && pqlt_table_exists('local_prequran_comm_thread')) {
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = ?
                AND p.role = ?
                AND t.studentid = ?",
            [$parentid, 'parent', $studentid]
        );
    }

    return false;
}

function pqlt_parent_children(int $parentid): array {
    global $DB;
    $children = [];

    if (pqlt_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC');
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }

    if (pqlt_table_exists('local_prequran_comm_participant') && pqlt_table_exists('local_prequran_comm_thread')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT t.studentid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = :parentid
                AND p.role = :role
                AND t.studentid IS NOT NULL",
            ['parentid' => $parentid, 'role' => 'parent']
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }

    return pqlt_enrich_children(array_values($children));
}

function pqlt_is_managed_student(int $userid): bool {
    try {
        $profile = profile_user_record($userid, false);
    } catch (Throwable $e) {
        return false;
    }
    foreach (['managed_student', 'managedstudent', 'managed'] as $field) {
        if (isset($profile->{$field})) {
            $value = strtolower(trim((string)$profile->{$field}));
            return in_array($value, ['1', 'yes', 'true', 'on'], true);
        }
    }
    return false;
}

function pqlt_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlt_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = ?
            AND r.shortname IN ('editingteacher', 'teacher', 'manager')",
        [$userid]
    );
}

function pqlt_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }

    if (pqlt_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', [
            'teacherid' => $teacherid,
            'status' => 'active',
        ]);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', [
                'teacherid' => $teacherid,
                'studentid' => $studentid,
                'status' => 'active',
            ]);
        }
    }

    if (!pqlt_has_teacher_role($teacherid) || !pqlt_is_managed_student($studentid)) {
        return false;
    }

    return $DB->record_exists_sql(
        "SELECT 1
           FROM {cohort_members} teacher_cm
           JOIN {cohort_members} student_cm ON student_cm.cohortid = teacher_cm.cohortid
          WHERE teacher_cm.userid = ?
            AND student_cm.userid = ?",
        [$teacherid, $studentid]
    );
}

function pqlt_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    $explicit = false;

    if (pqlt_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $explicit = true;
                $students[$studentid] = $studentid;
            }
        }
    }

    if (!$explicit && pqlt_has_teacher_role($teacherid)) {
        $teachercohorts = $DB->get_records('cohort_members', ['userid' => $teacherid], '', 'id, cohortid');
        foreach ($teachercohorts as $membership) {
            $members = $DB->get_records('cohort_members', ['cohortid' => (int)$membership->cohortid], '', 'userid');
            foreach ($members as $member) {
                $studentid = (int)$member->userid;
                if ($studentid > 0 && $studentid !== $teacherid && pqlt_is_managed_student($studentid)) {
                    $students[$studentid] = $studentid;
                }
            }
        }
    }

    return pqlt_enrich_children(array_values($students));
}

function pqlt_enrich_children(array $studentids): array {
    $children = [];
    foreach (array_unique(array_filter(array_map('intval', $studentids))) as $studentid) {
        $user = core_user::get_user($studentid);
        $children[] = [
            'studentid' => $studentid,
            'name' => $user ? fullname($user) : 'Student ' . $studentid,
        ];
    }
    usort($children, function($a, $b) {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $children;
}

function pqlt_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid)) {
        return true;
    }
    if ($userid === $studentid) {
        return true;
    }
    return pqlt_parent_can_access_child($userid, $studentid) || pqlt_teacher_can_access_student($userid, $studentid);
}

function pqlt_sessions(int $studentid): array {
    global $DB;
    if (!pqlt_table_exists('local_prequran_live_session') || !pqlt_table_exists('local_prequran_live_participant')) {
        return [];
    }

    return array_values($DB->get_records_sql(
        "SELECT s.id,
                s.title,
                s.teacherid,
                s.lessonid,
                s.unitid,
                s.scheduled_start,
                s.scheduled_end,
                s.status,
                s.recording_enabled,
                s.recording_consent_required,
                s.parent_observer_allowed,
                s.max_participants,
                a.attendance_status,
                a.participation_status,
                a.technical_issue,
                n.visible_to_parent,
                n.timemodified AS note_modified,
                COUNT(DISTINCT r.id) AS visible_recordings
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = p.studentid
      LEFT JOIN {local_prequran_live_note} n ON n.sessionid = s.id AND n.studentid = p.studentid
      LEFT JOIN {local_prequran_live_recording} r ON r.sessionid = s.id AND r.visible_to_parent = 1 AND r.status = 'available'
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
       GROUP BY s.id, s.title, s.teacherid, s.lessonid, s.unitid, s.scheduled_start, s.scheduled_end, s.status,
                s.recording_enabled, s.recording_consent_required, s.parent_observer_allowed, s.max_participants,
                a.attendance_status, a.participation_status, a.technical_issue, n.visible_to_parent, n.timemodified
       ORDER BY s.scheduled_start DESC, s.id DESC",
        ['studentid' => $studentid, 'role' => 'student', 'participantstatus' => 'active'],
        0,
        30
    ));
}

function pqlt_consent_record(int $studentid, int $guardianid, array $types): ?stdClass {
    global $DB;
    if (!pqlt_table_exists('local_prequran_live_consent')) {
        return null;
    }

    [$insql, $params] = $DB->get_in_or_equal($types, SQL_PARAMS_NAMED);
    $params['studentid'] = $studentid;
    $guardiansql = '';
    if ($guardianid > 0) {
        $params['guardianid'] = $guardianid;
        $guardiansql = ' AND guardianid = :guardianid';
    }
    $ordersql = $guardianid > 0 ? 'timemodified DESC' : 'granted DESC, timemodified DESC';
    $record = $DB->get_record_sql(
        "SELECT *
           FROM {local_prequran_live_consent}
          WHERE studentid = :studentid
            {$guardiansql}
            AND consent_type {$insql}
       ORDER BY {$ordersql}",
        $params,
        IGNORE_MULTIPLE
    );
    return $record ?: null;
}

function pqlt_consent_status(int $studentid, int $guardianid, array $types): string {
    $record = pqlt_consent_record($studentid, $guardianid, $types);
    if (!$record) {
        return 'Not recorded in system yet';
    }
    return !empty($record->granted) ? 'Granted' : 'Not granted';
}

function pqlt_save_parent_consent(int $studentid, int $guardianid, int $workspaceid, string $type, int $granted): void {
    global $DB;
    if (!pqlt_table_exists('local_prequran_live_consent')) {
        throw new invalid_parameter_exception('Live consent storage is not ready. Please ask support to run the Moodle upgrade.');
    }

    $now = time();
    $existing = $DB->get_record('local_prequran_live_consent', [
        'studentid' => $studentid,
        'guardianid' => $guardianid,
        'consent_type' => $type,
    ], '*', IGNORE_MISSING);
    $record = $existing ? (object)['id' => (int)$existing->id] : new stdClass();
    $record = pqlt_apply_record_fields('local_prequran_live_consent', $record, [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'guardianid' => $guardianid,
        'consent_type' => $type,
        'granted' => $granted,
        'version' => '1',
        'consent_source' => 'parent_trust_center',
        'details' => json_encode(['actorid' => $guardianid, 'source' => 'parent_trust_center']),
        'timemodified' => $now,
    ]);
    if ($existing) {
        $DB->update_record('local_prequran_live_consent', $record);
        return;
    }
    $record = pqlt_apply_record_fields('local_prequran_live_consent', $record, ['timecreated' => $now]);
    $DB->insert_record('local_prequran_live_consent', $record);
}

$modechildren = [];
if ($childid <= 0) {
    if (is_siteadmin($USER)) {
        $modechildren = [];
    } else if (pqlt_has_teacher_role((int)$USER->id) && !pqlt_is_managed_student((int)$USER->id)) {
        $modechildren = pqlt_teacher_students((int)$USER->id);
    } else {
        $modechildren = pqlt_parent_children((int)$USER->id);
    }
    if (count($modechildren) === 1) {
        $childid = (int)$modechildren[0]['studentid'];
    }
}

if ($childid > 0 && !pqlt_user_can_access_child((int)$USER->id, $childid)) {
    pqh_live_security_audit(
        'live_trust_access_denied',
        'student',
        $childid,
        ['studentid' => $childid]
    );
    pqh_access_denied(
        'You cannot view live-class trust details for this student.',
        $returnurl,
        'Live trust center access required'
    );
}

$islinkedparent = $childid > 0
    && (int)$USER->id !== $childid
    && !is_siteadmin((int)$USER->id)
    && pqlt_parent_can_access_child((int)$USER->id, $childid);
$notice = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This consent form expired. Please reload the page and try again.');
        }
        if (optional_param('action', '', PARAM_ALPHANUMEXT) !== 'save_parent_consent' || !$islinkedparent) {
            throw new invalid_parameter_exception('Only a linked parent or legal guardian can update consent for this student.');
        }
        if (!optional_param('guardian_confirmation', 0, PARAM_BOOL)) {
            throw new invalid_parameter_exception('Confirm that you are the student\'s parent or legal guardian.');
        }
        $livechoice = required_param('live_consent', PARAM_ALPHA);
        $recordingchoice = required_param('recording_consent', PARAM_ALPHA);
        if (!in_array($livechoice, ['grant', 'decline'], true)
            || !in_array($recordingchoice, ['grant', 'decline'], true)) {
            throw new invalid_parameter_exception('Choose Grant or Decline for both consent decisions.');
        }

        $transaction = $DB->start_delegated_transaction();
        pqlt_save_parent_consent($childid, (int)$USER->id, $workspaceid, 'live_session', $livechoice === 'grant' ? 1 : 0);
        pqlt_save_parent_consent($childid, (int)$USER->id, $workspaceid, 'recording', $recordingchoice === 'grant' ? 1 : 0);
        pqh_live_security_audit('parent_live_consent_updated', 'student', $childid, [
            'live_session' => $livechoice,
            'recording' => $recordingchoice,
        ]);
        $transaction->allow_commit();
        $notice = 'Your consent choices were saved.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');
$sessions = $childid > 0 ? pqlt_sessions($childid) : [];
$consentguardianid = $islinkedparent ? (int)$USER->id : 0;
$liveconsentrecord = $childid > 0 ? pqlt_consent_record($childid, $consentguardianid, ['live_session']) : null;
$recordingconsentrecord = $childid > 0 ? pqlt_consent_record($childid, $consentguardianid, ['recording', 'live_recording', 'live_session_recording']) : null;
$liveconsent = $liveconsentrecord ? (!empty($liveconsentrecord->granted) ? 'Granted' : 'Not granted') : 'Not recorded in system yet';
$recordingconsent = $recordingconsentrecord ? (!empty($recordingconsentrecord->granted) ? 'Granted' : 'Not granted') : 'Not recorded in system yet';
$completed = 0;
$published = 0;
$recordingenabled = 0;
foreach ($sessions as $session) {
    if (in_array((string)$session->status, ['completed', 'live'], true)) {
        $completed++;
    }
    if (!empty($session->visible_to_parent)) {
        $published++;
    }
    if (!empty($session->recording_enabled)) {
        $recordingenabled++;
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-trust-page header,
body.pqh-live-trust-page footer,
body.pqh-live-trust-page nav.navbar,
body.pqh-live-trust-page #page-header,
body.pqh-live-trust-page #page-footer,
body.pqh-live-trust-page .drawer,
body.pqh-live-trust-page .drawer-toggles,
body.pqh-live-trust-page .block-region,
body.pqh-live-trust-page [data-region="drawer"],
body.pqh-live-trust-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-trust-page #page,
body.pqh-live-trust-page #page-content,
body.pqh-live-trust-page #region-main,
body.pqh-live-trust-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
body.pqh-live-trust-page{background:#f4f7fb!important}
.pqlt-shell{min-height:100vh;padding:34px 18px 54px;background:linear-gradient(180deg,#f1fff4 0,#fff 52%);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlt-wrap{max-width:1100px;margin:0 auto}
.pqlt-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;padding:22px;border-radius:16px;background:linear-gradient(135deg,#eaffea 0,#fff 54%,#fff7e7 100%);border:1px solid rgba(111,78,50,.13);box-shadow:0 16px 38px rgba(105,76,45,.08)}
.pqlt-kicker{margin:0 0 6px;color:#6f4e32;font-size:13px;font-weight:950;text-transform:uppercase;letter-spacing:.04em}
.pqlt-title{margin:0;font-size:30px;line-height:1.1;font-weight:950;color:#4d3522}
.pqlt-subtitle{margin:8px 0 0;color:#64745a;font-size:15px;font-weight:750}
.pqlt-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlt-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border-radius:10px;background:#6f4e32;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950}
.pqlt-btn--light{background:#f4fff0;color:#4d3522!important;border:1px solid rgba(111,78,50,.16)}
.pqlt-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}
.pqlt-stat{padding:16px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqlt-stat strong{display:block;color:#6f4e32;font-size:24px;font-weight:950}
.pqlt-stat span{display:block;margin-top:4px;color:#64745a;font-size:12px;font-weight:850}
.pqlt-panel{margin-bottom:16px;padding:18px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqlt-panel h2{margin:0 0 10px;color:#4d3522;font-size:20px;font-weight:950}
.pqlt-alert{margin-bottom:16px;padding:13px 15px;border-radius:10px;font-size:14px;font-weight:850}
.pqlt-alert--ok{background:#eaffea;color:#2f6f4e;border:1px solid rgba(47,111,78,.18)}
.pqlt-alert--bad{background:#fff0ed;color:#8a342b;border:1px solid rgba(138,52,43,.18)}
.pqlt-policy{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.pqlt-policy div{padding:14px;border-radius:12px;background:#f8fbf6;border:1px solid rgba(111,78,50,.10)}
.pqlt-policy strong{display:block;margin-bottom:5px;color:#4d3522;font-size:13px;font-weight:950;text-transform:uppercase}
.pqlt-policy p{margin:0;color:#40586a;font-size:14px;font-weight:700;line-height:1.45}
.pqlt-consent-form{margin-top:16px;padding-top:16px;border-top:1px solid rgba(111,78,50,.13)}
.pqlt-consent-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pqlt-consent-choice{margin:0;padding:14px;border:1px solid rgba(111,78,50,.13);border-radius:10px;background:#fbfdf9}
.pqlt-consent-choice legend{padding:0 5px;color:#4d3522;font-size:14px;font-weight:950}
.pqlt-consent-choice label,.pqlt-confirm{display:flex;align-items:flex-start;gap:8px;color:#40586a;font-size:14px;font-weight:750;line-height:1.4}
.pqlt-consent-choice label+label{margin-top:9px}
.pqlt-confirm{margin:14px 0}
.pqlt-consent-note{margin:0 0 12px;color:#64745a;font-size:13px;font-weight:700;line-height:1.45}
.pqlt-list{display:grid;gap:12px}
.pqlt-card{padding:16px;border-radius:12px;background:#fff;border:1px solid rgba(23,48,68,.12)}
.pqlt-card__head{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px}
.pqlt-card h3{margin:0;color:#4d3522;font-size:18px;font-weight:950}
.pqlt-meta{margin:5px 0 0;color:#64745a;font-size:13px;font-weight:800}
.pqlt-badges{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
.pqlt-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pqlt-pill--ok{background:#eaffea;color:#2f6f4e}
.pqlt-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlt-empty{padding:24px;border-radius:14px;background:#fff;border:1px dashed rgba(111,78,50,.22);color:#64745a;font-weight:850}
.pqlt-students{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.pqlt-student{padding:16px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07);text-decoration:none;color:#4d3522!important;font-weight:950}
.pqlt-student span{display:block;margin-top:4px;color:#64745a;font-size:12px;font-weight:800}
@media(max-width:860px){.pqlt-top{display:block}.pqlt-actions{margin-top:14px}.pqlt-grid,.pqlt-policy{grid-template-columns:1fr 1fr}.pqlt-title{font-size:25px}}
@media(max-width:560px){.pqlt-grid,.pqlt-policy,.pqlt-consent-grid{grid-template-columns:1fr}.pqlt-card__head{display:block}}
<?php echo pqh_dashboard_header_css(); ?>
<?php echo pqh_design_system_css('.pqlt-shell'); ?>
<?php echo pqh_design_shell_css('.pqlt-shell'); ?>
</style>
<main class="pqlt-shell">
<?php echo pqh_design_shell_html('pqlt-shell'); ?>
  <div class="pqlt-wrap">
    <section class="pqlt-top pqh-workspace-top">
      <div>
        <p class="pqlt-kicker">Parent trust center</p>
        <h1 class="pqlt-title pqh-workspace-title">Live class safety for <?php echo s($childname); ?></h1>
        <p class="pqlt-subtitle pqh-workspace-sub">Clear visibility into sessions, attendance, recording policy, and parent-facing feedback.</p>
      </div>
      <div class="pqlt-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlt-btn pqlt-btn--light" href="<?php echo pqlt_url('/local/hubredirect/live_parent_trust.php', $urlparams, $childid > 0 ? ['childid' => $childid] : [])->out(false); ?>">Parent live hub</a>
        <a class="pqlt-btn pqlt-btn--light" href="<?php echo pqlt_url('/local/hubredirect/live_summaries.php', $urlparams, $childid > 0 ? ['childid' => $childid] : [])->out(false); ?>">Summaries</a>
        <a class="pqlt-btn pqlt-btn--light" href="<?php echo pqlt_url('/local/hubredirect/live_recordings.php', $urlparams, $childid > 0 ? ['childid' => $childid] : [])->out(false); ?>">Recordings</a>
        <a class="pqlt-btn" href="<?php echo pqlt_url($workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $urlparams, $childid > 0 ? ['childid' => $childid] : [])->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if ($notice !== ''): ?><div class="pqlt-alert pqlt-alert--ok" role="status"><?php echo s($notice); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqlt-alert pqlt-alert--bad" role="alert"><?php echo s($error); ?></div><?php endif; ?>

    <?php if ($childid <= 0): ?>
      <?php if ($modechildren): ?>
        <section class="pqlt-students" aria-label="Choose student">
          <?php foreach ($modechildren as $childrow): ?>
            <a class="pqlt-student" href="<?php echo pqlt_url('/local/hubredirect/live_trust.php', $urlparams, ['childid' => (int)$childrow['studentid']])->out(false); ?>">
              <?php echo s((string)$childrow['name']); ?>
              <span>Open live class trust center</span>
            </a>
          <?php endforeach; ?>
        </section>
      <?php else: ?>
        <div class="pqlt-empty">Choose a student from the dashboard first. Administrators can open this page with <code>?childid=STUDENT_USER_ID</code>.</div>
      <?php endif; ?>
    <?php else: ?>
      <section class="pqlt-grid" aria-label="Trust summary">
        <div class="pqlt-stat"><strong><?php echo count($sessions); ?></strong><span>visible live classes</span></div>
        <div class="pqlt-stat"><strong><?php echo $completed; ?></strong><span>started or completed</span></div>
        <div class="pqlt-stat"><strong><?php echo $published; ?></strong><span>parent summaries published</span></div>
        <div class="pqlt-stat"><strong><?php echo $recordingenabled; ?></strong><span>sessions marked for recording</span></div>
      </section>

      <section class="pqlt-panel">
        <h2>Safety and Consent</h2>
        <div class="pqlt-policy">
          <div>
            <strong>Live participation</strong>
            <p><?php echo s($liveconsent); ?></p>
          </div>
          <div>
            <strong>Recording consent</strong>
            <p><?php echo s($recordingconsent); ?></p>
          </div>
          <div>
            <strong>Privacy rule</strong>
            <p>Parents see attendance and approved summaries only. Private teacher notes stay hidden.</p>
          </div>
        </div>
        <?php if ($islinkedparent): ?>
          <form class="pqlt-consent-form" method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="save_parent_consent">
            <p class="pqlt-consent-note">Your choices apply to future live sessions. Recording consent permits session recording when the institution enables it; recordings remain unavailable to families until they are reviewed and published.</p>
            <div class="pqlt-consent-grid">
              <fieldset class="pqlt-consent-choice">
                <legend>Live class participation</legend>
                <label><input type="radio" name="live_consent" value="grant" required <?php echo $liveconsentrecord && !empty($liveconsentrecord->granted) ? 'checked' : ''; ?>> <span>Grant consent</span></label>
                <label><input type="radio" name="live_consent" value="decline" required <?php echo $liveconsentrecord && empty($liveconsentrecord->granted) ? 'checked' : ''; ?>> <span>Decline consent</span></label>
              </fieldset>
              <fieldset class="pqlt-consent-choice">
                <legend>Live-session recording</legend>
                <label><input type="radio" name="recording_consent" value="grant" required <?php echo $recordingconsentrecord && !empty($recordingconsentrecord->granted) ? 'checked' : ''; ?>> <span>Grant consent</span></label>
                <label><input type="radio" name="recording_consent" value="decline" required <?php echo $recordingconsentrecord && empty($recordingconsentrecord->granted) ? 'checked' : ''; ?>> <span>Decline consent</span></label>
              </fieldset>
            </div>
            <label class="pqlt-confirm"><input type="checkbox" name="guardian_confirmation" value="1" required> <span>I confirm that I am <?php echo s($childname); ?>'s parent or legal guardian and that these are my consent decisions.</span></label>
            <button class="pqlt-btn" type="submit">Save consent choices</button>
          </form>
        <?php else: ?>
          <div class="pqlt-alert pqlt-alert--bad" style="margin:16px 0 0">
            This is a read-only view. Consent can be completed only after <?php echo s($childname); ?>'s linked parent or legal guardian signs in to their own account and opens Dashboard &gt; Trust Center.
          </div>
        <?php endif; ?>
      </section>

      <section class="pqlt-panel">
        <h2>Class Transparency</h2>
        <?php if (!$sessions): ?>
          <div class="pqlt-empty">No live classes are linked to this student yet.</div>
        <?php else: ?>
          <div class="pqlt-list">
            <?php foreach ($sessions as $session): ?>
              <?php
                $teacher = core_user::get_user((int)$session->teacherid);
                $lesson = trim((string)$session->lessonid . ' / ' . (string)$session->unitid, ' /');
                $attendance = trim((string)($session->attendance_status ?? ''));
                $summaryvisible = !empty($session->visible_to_parent);
              ?>
              <article class="pqlt-card">
                <div class="pqlt-card__head">
                  <div>
                    <h3><?php echo s((string)$session->title); ?></h3>
                    <p class="pqlt-meta">
                      <?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?>
                      - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid); ?>
                    </p>
                    <?php if ($lesson !== ''): ?><p class="pqlt-meta"><?php echo s($lesson); ?></p><?php endif; ?>
                  </div>
                  <span class="pqlt-pill"><?php echo s((string)$session->status); ?></span>
                </div>
                <div class="pqlt-badges">
                  <span class="pqlt-pill <?php echo $attendance !== '' ? 'pqlt-pill--ok' : 'pqlt-pill--warn'; ?>">Attendance: <?php echo s($attendance !== '' ? str_replace('_', ' ', $attendance) : 'not marked'); ?></span>
                  <span class="pqlt-pill <?php echo $summaryvisible ? 'pqlt-pill--ok' : 'pqlt-pill--warn'; ?>">Summary: <?php echo $summaryvisible ? 'published' : 'not published'; ?></span>
                  <span class="pqlt-pill <?php echo !empty($session->recording_enabled) ? 'pqlt-pill--ok' : 'pqlt-pill--warn'; ?>">Recording: <?php echo !empty($session->recording_enabled) ? 'audio on; video consent-controlled' : 'audio policy not marked'; ?></span>
                  <span class="pqlt-pill">Capacity: <?php echo (int)$session->max_participants; ?></span>
                  <?php if (!empty($session->technical_issue)): ?><span class="pqlt-pill pqlt-pill--warn">Technical issue noted</span><?php endif; ?>
                  <?php if ((int)$session->visible_recordings > 0): ?><span class="pqlt-pill pqlt-pill--ok">Parent recording available</span><?php endif; ?>
                </div>
              </article>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
