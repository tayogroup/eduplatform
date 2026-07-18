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

function pqls_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(pqls_url('/local/hubredirect/live_summaries.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Session Summaries');
$PAGE->set_heading('Live Session Summaries');
$PAGE->add_body_class('pqh-live-summaries-page');

function pqls_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqls_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqls_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqls_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqls_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqls_table_exists('local_prequran_comm_participant') && pqls_table_exists('local_prequran_comm_thread')) {
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

function pqls_parent_children(int $parentid): array {
    global $DB;
    $children = [];

    if (pqls_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC');
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }

    if (pqls_table_exists('local_prequran_comm_participant') && pqls_table_exists('local_prequran_comm_thread')) {
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

    return pqls_enrich_children(array_values($children));
}

function pqls_is_managed_student(int $userid): bool {
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

function pqls_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqls_table_exists('local_prequran_teacher_student')
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

function pqls_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }

    if (pqls_table_exists('local_prequran_teacher_student')) {
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

    if (!pqls_has_teacher_role($teacherid) || !pqls_is_managed_student($studentid)) {
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

function pqls_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    $explicit = false;

    if (pqls_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $explicit = true;
                $students[$studentid] = $studentid;
            }
        }
    }

    if (!$explicit && pqls_has_teacher_role($teacherid)) {
        $teachercohorts = $DB->get_records('cohort_members', ['userid' => $teacherid], '', 'id, cohortid');
        foreach ($teachercohorts as $membership) {
            $members = $DB->get_records('cohort_members', ['cohortid' => (int)$membership->cohortid], '', 'userid');
            foreach ($members as $member) {
                $studentid = (int)$member->userid;
                if ($studentid > 0 && $studentid !== $teacherid && pqls_is_managed_student($studentid)) {
                    $students[$studentid] = $studentid;
                }
            }
        }
    }

    return pqls_enrich_children(array_values($students));
}

function pqls_enrich_children(array $studentids): array {
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

function pqls_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid)) {
        return true;
    }
    if ($userid === $studentid) {
        return true;
    }
    return pqls_parent_can_access_child($userid, $studentid) || pqls_teacher_can_access_student($userid, $studentid);
}

function pqls_clean_text(string $value, int $max = 1000): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqls_audit(int $sessionid, int $studentid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqls_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'student',
        'targetid' => $studentid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqls_focus_summary(int $studentid, int $sessionid): array {
    global $DB;
    $summary = [
        'ready' => false,
        'hasdata' => false,
        'active_ms' => 0,
        'idle_count' => 0,
        'leave_count' => 0,
        'current_step' => '',
        'last_time' => 0,
    ];
    if (!pqls_table_exists('local_prequran_focusagg')
        || !pqls_column_exists('local_prequran_focusagg', 'live_sessionid')) {
        return $summary;
    }
    $summary['ready'] = true;
    $row = $DB->get_record_sql(
        "SELECT COALESCE(SUM(active_ms), 0) AS active_ms,
                COALESCE(SUM(idle_count), 0) AS idle_count,
                COALESCE(SUM(leave_count), 0) AS leave_count,
                MAX(last_time) AS last_time
           FROM {local_prequran_focusagg}
          WHERE userid = :userid
            AND live_sessionid = :sessionid",
        ['userid' => $studentid, 'sessionid' => $sessionid]
    );
    if ($row) {
        $summary['active_ms'] = (int)$row->active_ms;
        $summary['idle_count'] = (int)$row->idle_count;
        $summary['leave_count'] = (int)$row->leave_count;
        $summary['last_time'] = (int)$row->last_time;
        $summary['hasdata'] = $summary['active_ms'] > 0 || $summary['idle_count'] > 0 || $summary['leave_count'] > 0 || $summary['last_time'] > 0;
    }
    $latest = $DB->get_record_sql(
        "SELECT step_id, unitid, last_time
           FROM {local_prequran_focusagg}
          WHERE userid = :userid
            AND live_sessionid = :sessionid
       ORDER BY last_time DESC",
        ['userid' => $studentid, 'sessionid' => $sessionid],
        IGNORE_MULTIPLE
    );
    if ($latest) {
        $summary['current_step'] = (string)($latest->step_id ?: $latest->unitid ?: '');
    }
    return $summary;
}

function pqls_practice_coach_summary(int $studentid, int $sessionid): array {
    global $DB;
    $summary = [
        'ready' => false,
        'hasdata' => false,
        'count' => 0,
        'idle' => 0,
        'away' => 0,
        'latest_message' => '',
        'latest_recommendation' => '',
        'latest_time' => 0,
    ];
    if (!pqls_table_exists('local_prequran_practice_coach_event')) {
        return $summary;
    }
    $summary['ready'] = true;
    $row = $DB->get_record_sql(
        "SELECT COUNT(1) AS coach_count,
                SUM(CASE WHEN trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_count,
                SUM(CASE WHEN trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_count,
                MAX(timecreated) AS latest_time
           FROM {local_prequran_practice_coach_event}
          WHERE userid = :userid
            AND live_sessionid = :sessionid",
        ['userid' => $studentid, 'sessionid' => $sessionid]
    );
    if ($row) {
        $summary['count'] = (int)$row->coach_count;
        $summary['idle'] = (int)$row->idle_count;
        $summary['away'] = (int)$row->away_count;
        $summary['latest_time'] = (int)$row->latest_time;
        $summary['hasdata'] = $summary['count'] > 0;
    }
    $recommendationselect = pqls_column_exists('local_prequran_practice_coach_event', 'recommendation_message')
        ? 'recommendation_message,'
        : "'' AS recommendation_message,";
    $latest = $DB->get_record_sql(
        "SELECT message, {$recommendationselect} timecreated
           FROM {local_prequran_practice_coach_event}
          WHERE userid = :userid
            AND live_sessionid = :sessionid
       ORDER BY timecreated DESC, id DESC",
        ['userid' => $studentid, 'sessionid' => $sessionid],
        IGNORE_MULTIPLE
    );
    if ($latest) {
        $summary['latest_message'] = (string)$latest->message;
        $summary['latest_recommendation'] = (string)($latest->recommendation_message ?? '');
        $summary['latest_time'] = (int)$latest->timecreated;
    }
    return $summary;
}

function pqls_format_minutes(int $ms): string {
    return (int)round($ms / 60000) . ' min';
}

function pqls_step_label(string $stepid): string {
    $stepid = trim($stepid);
    if ($stepid === '') {
        return 'Not recorded';
    }
    return ucwords(str_replace(['_', '-'], ' ', $stepid));
}

function pqls_public_summaries(int $studentid): array {
    global $DB;
    if (!pqls_table_exists('local_prequran_live_note')
        || !pqls_table_exists('local_prequran_live_session')) {
        return [];
    }

    $homeworkselect = pqls_column_exists('local_prequran_live_note', 'homework_unitid')
        ? "n.homework_lessonid, n.homework_unitid, n.homework_due_date, n.homework_priority,"
        : "'' AS homework_lessonid, '' AS homework_unitid, 0 AS homework_due_date, 'normal' AS homework_priority,";
    $followupselect = pqls_column_exists('local_prequran_live_note', 'followup_status')
        ? "n.followup_status, n.followup_message, n.followup_resolved,"
        : "'none' AS followup_status, '' AS followup_message, 0 AS followup_resolved,";
    $parentresponseselect = pqls_column_exists('local_prequran_live_note', 'parent_response_status')
        ? "n.parent_response_status, n.parent_response_message, n.parent_responseby, n.parent_responseat,"
        : "'none' AS parent_response_status, '' AS parent_response_message, 0 AS parent_responseby, 0 AS parent_responseat,";
    return array_values($DB->get_records_sql(
        "SELECT n.id,
                n.sessionid,
                n.studentid,
                n.teacherid,
                n.strengths,
                n.needs_practice,
                n.homework,
                {$homeworkselect}
                {$followupselect}
                {$parentresponseselect}
                n.parent_summary,
                n.timemodified,
                s.title,
                s.lessonid,
                s.unitid,
                s.scheduled_start,
                s.scheduled_end,
                s.status,
                a.attendance_status,
                a.participation_status,
                a.technical_issue
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = n.sessionid AND a.studentid = n.studentid
          WHERE n.studentid = :studentid
            AND n.visible_to_parent = 1
       ORDER BY s.scheduled_start DESC, n.timemodified DESC",
        ['studentid' => $studentid]
    ));
}

$modechildren = [];
if ($childid <= 0) {
    if (is_siteadmin($USER)) {
        $modechildren = [];
    } else if (pqls_has_teacher_role((int)$USER->id) && !pqls_is_managed_student((int)$USER->id)) {
        $modechildren = pqls_teacher_students((int)$USER->id);
    } else {
        $modechildren = pqls_parent_children((int)$USER->id);
    }
    if (count($modechildren) === 1) {
        $childid = (int)$modechildren[0]['studentid'];
    }
}

if ($childid > 0 && !pqls_user_can_access_child((int)$USER->id, $childid)) {
    pqh_live_security_audit(
        'live_summary_access_denied',
        'student',
        $childid,
        ['studentid' => $childid]
    );
    pqh_access_denied(
        'You cannot view live-session summaries for this student.',
        $returnurl,
        'Live summary access required'
    );
}

if (data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'parent_followup_response') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Your security token expired. Open the summary again before saving your response.',
            pqls_url('/local/hubredirect/live_summaries.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []),
            'Follow-up response expired'
        );
    }
    $responsefieldsready = pqls_column_exists('local_prequran_live_note', 'parent_response_status');
    if (!$responsefieldsready) {
        pqh_access_denied(
            'Parent follow-up response fields are not installed yet.',
            pqls_url('/local/hubredirect/live_summaries.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []),
            'Follow-up response unavailable'
        );
    }
    $sessionid = optional_param('sessionid', 0, PARAM_INT);
    $studentid = optional_param('studentid', 0, PARAM_INT);
    if ($sessionid <= 0 || $studentid <= 0) {
        pqh_access_denied(
            'Choose a valid live summary before saving a follow-up response.',
            pqls_url('/local/hubredirect/live_summaries.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []),
            'Follow-up response unavailable'
        );
    }
    if (!pqls_parent_can_access_child((int)$USER->id, $studentid) && !is_siteadmin($USER)) {
        pqh_live_security_audit(
            'live_summary_response_denied',
            'student',
            $studentid,
            ['sessionid' => $sessionid, 'studentid' => $studentid]
        );
        pqh_access_denied(
            'Only a linked parent or guardian can respond to this follow-up.',
            $returnurl,
            'Follow-up response access required'
        );
    }
    $note = $DB->get_record('local_prequran_live_note', [
        'sessionid' => $sessionid,
        'studentid' => $studentid,
        'visible_to_parent' => 1,
    ]);
    if (!$note) {
        pqh_access_denied(
            'This parent-visible live summary is no longer available.',
            pqls_url('/local/hubredirect/live_summaries.php', $urlparams, ['childid' => $studentid]),
            'Follow-up response unavailable'
        );
    }
    $status = optional_param('parent_response_status', 'reviewed', PARAM_ALPHANUMEXT);
    if (!in_array($status, ['reviewed', 'homework_completed', 'needs_help'], true)) {
        $status = 'reviewed';
    }
    $now = time();
    $note->parent_response_status = $status;
    $note->parent_response_message = pqls_clean_text(optional_param('parent_response_message', '', PARAM_RAW), 1000);
    $note->parent_responseby = (int)$USER->id;
    $note->parent_responseat = $now;
    if (in_array($status, ['reviewed', 'homework_completed'], true)) {
        $note->followup_resolved = 1;
        $note->followup_resolvedby = (int)$USER->id;
        $note->followup_resolvedat = $now;
    } else {
        $note->followup_resolved = 0;
    }
    $note->timemodified = $now;
    $DB->update_record('local_prequran_live_note', $note);

    $actionmap = [
        'reviewed' => 'followup_parent_acknowledged',
        'homework_completed' => 'followup_homework_completed',
        'needs_help' => 'followup_parent_needs_help',
    ];
    pqls_audit($sessionid, $studentid, $actionmap[$status] ?? 'followup_parent_response_saved', [
        'status' => $status,
        'message' => (string)$note->parent_response_message,
    ]);
    redirect(pqls_url('/local/hubredirect/live_summaries.php', $urlparams, ['childid' => $studentid, 'result' => 'followup_response_saved']));
}

$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');
$summaries = $childid > 0 ? pqls_public_summaries($childid) : [];
$needsattention = array_values(array_filter($summaries, function($summary) {
    return (string)($summary->followup_status ?? 'none') !== 'none' && empty($summary->followup_resolved);
}));
$result = optional_param('result', '', PARAM_ALPHANUMEXT);

echo $OUTPUT->header();
?>
<style>
body.pqh-live-summaries-page header,
body.pqh-live-summaries-page footer,
body.pqh-live-summaries-page nav.navbar,
body.pqh-live-summaries-page #page-header,
body.pqh-live-summaries-page #page-footer,
body.pqh-live-summaries-page .drawer,
body.pqh-live-summaries-page .drawer-toggles,
body.pqh-live-summaries-page .block-region,
body.pqh-live-summaries-page [data-region="drawer"],
body.pqh-live-summaries-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-summaries-page #page,
body.pqh-live-summaries-page #page-content,
body.pqh-live-summaries-page #region-main,
body.pqh-live-summaries-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
body.pqh-live-summaries-page{background:#f4f7fb!important}
.pqls-shell{min-height:100vh;padding:34px 18px 54px;background:linear-gradient(180deg,#f1fff4 0,#fff 50%);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqls-wrap{max-width:1040px;margin:0 auto}
.pqls-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;padding:22px;border-radius:16px;background:linear-gradient(135deg,#eaffea 0,#fff 54%,#fff7e7 100%);border:1px solid rgba(111,78,50,.13);box-shadow:0 16px 38px rgba(105,76,45,.08)}
.pqls-kicker{margin:0 0 6px;color:#6f4e32;font-size:13px;font-weight:950;text-transform:uppercase;letter-spacing:.04em}
.pqls-title{margin:0;font-size:30px;line-height:1.1;font-weight:950;color:#4d3522}
.pqls-subtitle{margin:8px 0 0;color:#64745a;font-size:15px;font-weight:750}
.pqls-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqls-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border-radius:10px;background:#6f4e32;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950}
.pqls-btn--light{background:#f4fff0;color:#4d3522!important;border:1px solid rgba(111,78,50,.16)}
.pqls-list{display:grid;gap:14px}
.pqls-card{padding:18px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqls-card__head{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}
.pqls-card h2{margin:0;color:#4d3522;font-size:20px;font-weight:950}
.pqls-meta{margin:5px 0 0;color:#64745a;font-size:13px;font-weight:800}
.pqls-pill{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border-radius:999px;background:#f4fff0;color:#3f8a55;font-size:12px;font-weight:950;white-space:nowrap}
.pqls-pill--attention{background:#fff4dc;color:#7b5a3a}
.pqls-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pqls-field{padding:14px;border-radius:12px;background:#f8fbf6;border:1px solid rgba(111,78,50,.10)}
.pqls-attention{margin-bottom:14px;padding:18px;border-radius:14px;background:#fffaf1;border:1px solid rgba(123,90,58,.18);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqls-attention h2{margin:0 0 10px;color:#6f4e32;font-size:20px;font-weight:950}
.pqls-attention__item{padding:12px;border-radius:10px;background:#fff;border:1px solid rgba(111,78,50,.13);margin-top:10px}
.pqls-attention__item strong{display:block;color:#4d3522;font-size:14px;font-weight:950}
.pqls-attention__item p{margin:5px 0 0;color:#40586a;font-size:14px;font-weight:750;line-height:1.45;white-space:pre-wrap}
.pqls-response{margin-top:12px;padding:12px;border-radius:10px;background:#fff;border:1px solid rgba(111,78,50,.13)}
.pqls-response__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.pqls-response textarea{width:100%;min-height:74px;margin-top:8px;padding:9px 10px;border:1px solid rgba(111,78,50,.18);border-radius:9px;font:800 14px/1.35 system-ui;color:#173044}
.pqls-response button{border:0;cursor:pointer}
.pqls-alert{margin-bottom:14px;padding:12px 14px;border-radius:12px;background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16);font-weight:900}
.pqls-field strong{display:block;margin-bottom:5px;color:#4d3522;font-size:13px;font-weight:950;text-transform:uppercase}
.pqls-field p{margin:0;color:#40586a;font-size:14px;font-weight:700;line-height:1.45;white-space:pre-wrap}
.pqls-field--wide{grid-column:1/-1}
.pqls-activity{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 12px}
.pqls-activity__item{padding:12px;border-radius:12px;background:#f8fbf6;border:1px solid rgba(111,78,50,.10)}
.pqls-activity__item strong{display:block;color:#4d3522;font-size:18px;font-weight:950}
.pqls-activity__item span{display:block;margin-top:3px;color:#64745a;font-size:12px;font-weight:850}
.pqls-coach{margin:0 0 12px;padding:14px;border-radius:12px;background:#f3fff7;border:1px solid rgba(47,111,78,.14)}
.pqls-coach h3{margin:0 0 8px;color:#2f6f4e;font-size:16px;font-weight:950}
.pqls-coach__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.pqls-coach__item{padding:10px;border-radius:10px;background:#fff;border:1px solid rgba(47,111,78,.1)}
.pqls-coach__item strong{display:block;color:#2f6f4e;font-size:18px;font-weight:950}
.pqls-coach__item span{display:block;margin-top:3px;color:#64745a;font-size:12px;font-weight:850}
.pqls-coach p{margin:9px 0 0;color:#40586a;font-size:13px;font-weight:750;line-height:1.42}
.pqls-empty{padding:24px;border-radius:14px;background:#fff;border:1px dashed rgba(111,78,50,.22);color:#64745a;font-weight:850}
.pqls-students{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.pqls-student{padding:16px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07);text-decoration:none;color:#4d3522!important;font-weight:950}
.pqls-student span{display:block;margin-top:4px;color:#64745a;font-size:12px;font-weight:800}
@media(max-width:720px){.pqls-top{display:block}.pqls-actions{margin-top:14px}.pqls-title{font-size:25px}.pqls-card__head{display:block}.pqls-pill{margin-top:10px}.pqls-grid,.pqls-activity,.pqls-coach__grid{grid-template-columns:1fr}}
<?php echo pqh_dashboard_header_css(); ?>
/* ---- EduPlatform design system layer (2026-07-19) ---- */
.pqls-shell{
  --pqh-ink:#0f2237;--pqh-muted:#5b6b7c;--pqh-faint:#8494a5;--pqh-line:#e4e9ef;--pqh-bg:#f4f6f9;--pqh-surface:#fff;
  --pqh-tint:#edf3fc;--pqh-tint-2:#e0ebfa;--pqh-primary:#2166d1;--pqh-primary-ink:#17498f;
  background:var(--pqh-bg)!important;color:var(--pqh-ink)}
.pqls-shell .pqh-workspace-top{background:linear-gradient(120deg,#d7e6f9 0%,#e9f1fc 60%,#f3f8fe 100%)!important;border:1px solid #c5d9f1!important;box-shadow:none!important;border-radius:14px!important}
.pqls-shell .pqh-workspace-title{color:var(--pqh-ink)!important;font-size:26px!important;font-weight:800!important;letter-spacing:-.02em!important;text-shadow:none!important}
.pqls-shell .pqh-workspace-sub{color:var(--pqh-muted)!important;font-weight:500!important;opacity:1}
.pqls-shell .pqh-workspace-actions a,.pqls-shell .pqh-workspace-actions button,.pqls-btn{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;color:var(--pqh-ink)!important;font-weight:650!important;border-radius:10px!important;box-shadow:none!important}
.pqls-shell .pqh-workspace-actions a:hover,.pqls-shell .pqh-workspace-actions button:hover,.pqls-btn:hover{background:var(--pqh-tint)!important;border-color:var(--pqh-tint-2)!important;text-decoration:none!important}
.pqls-shell .pqh-workspace-actions a.pqh-workspace-logout{background:var(--pqh-ink)!important;border-color:var(--pqh-ink)!important;color:#fff!important}
.pqls-shell [class*="-card"],.pqls-shell [class*="-panel"],.pqls-shell [class*="-summary"],.pqls-shell [class*="-item"]{background:var(--pqh-surface);border-color:var(--pqh-line)!important;border-radius:14px;box-shadow:0 1px 2px rgba(15,34,55,.05)}
.pqls-shell [class*="-pill"]{background:var(--pqh-tint)!important;color:var(--pqh-primary-ink)!important;border-radius:8px!important;font-weight:650!important}
.pqls-shell h1,.pqls-shell h2,.pqls-shell h3{color:var(--pqh-ink)}
<?php echo pqh_design_shell_css('.pqls-shell'); ?>
</style>
<main class="pqls-shell">
<?php echo pqh_design_shell_html('pqls-shell'); ?>
  <div class="pqls-wrap">
    <section class="pqls-top pqh-workspace-top">
      <div>
        <p class="pqls-kicker">Live review summaries</p>
        <h1 class="pqls-title pqh-workspace-title">Teacher feedback for <?php echo s($childname); ?></h1>
        <p class="pqls-subtitle pqh-workspace-sub">Parent-visible class notes only. Private teacher notes are never shown here.</p>
      </div>
      <div class="pqls-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqls-btn pqls-btn--light" href="<?php echo pqls_url('/local/hubredirect/live_parent_trust.php', $urlparams, $childid > 0 ? ['childid' => $childid] : [])->out(false); ?>">Parent live hub</a>
        <a class="pqls-btn pqls-btn--light" href="<?php echo pqls_url('/local/hubredirect/live_sessions.php', $urlparams)->out(false); ?>">Live sessions</a>
        <a class="pqls-btn" href="<?php echo pqls_url($workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $urlparams, $childid > 0 ? ['childid' => $childid] : [])->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if ($childid <= 0): ?>
      <?php if ($modechildren): ?>
        <section class="pqls-students" aria-label="Choose student">
          <?php foreach ($modechildren as $childrow): ?>
            <a class="pqls-student" href="<?php echo pqls_url('/local/hubredirect/live_summaries.php', $urlparams, ['childid' => (int)$childrow['studentid']])->out(false); ?>">
              <?php echo s((string)$childrow['name']); ?>
              <span>Open live-session summaries</span>
            </a>
          <?php endforeach; ?>
        </section>
      <?php else: ?>
        <div class="pqls-empty">Choose a student from the dashboard first. Administrators can open this page with <code>?childid=STUDENT_USER_ID</code>.</div>
      <?php endif; ?>
    <?php else: ?>
      <?php if ($result === 'followup_response_saved'): ?><div class="pqls-alert">Follow-up response saved.</div><?php endif; ?>
      <?php if (!$summaries): ?>
        <div class="pqls-empty">No live-session summaries are ready yet. A summary appears here after the teacher saves feedback and marks it visible to parents.</div>
      <?php else: ?>
        <?php if ($needsattention): ?>
          <section class="pqls-attention" aria-label="Needs attention">
            <h2>Needs Attention</h2>
            <?php foreach ($needsattention as $item): ?>
              <div class="pqls-attention__item">
                <strong><?php echo s((string)$item->title); ?> - <?php echo s(ucfirst(str_replace('_', ' ', (string)$item->followup_status))); ?></strong>
                <p><?php echo s((string)$item->followup_message !== '' ? (string)$item->followup_message : 'The teacher requested follow-up for this class.'); ?></p>
              </div>
            <?php endforeach; ?>
          </section>
        <?php endif; ?>
        <section class="pqls-list" aria-label="Live session summaries">
          <?php foreach ($summaries as $summary): ?>
            <?php
              $teacher = core_user::get_user((int)$summary->teacherid);
              $lesson = trim((string)$summary->lessonid . ' / ' . (string)$summary->unitid, ' /');
              $attendance = trim((string)($summary->attendance_status ?? ''));
              $participation = trim((string)($summary->participation_status ?? ''));
              $homeworkunit = trim((string)($summary->homework_lessonid ?? '') . ' / ' . (string)($summary->homework_unitid ?? ''), ' /');
              $homeworkurl = (string)($summary->homework_unitid ?? '') !== ''
                  ? pqls_url('/local/hubredirect/issue_child.php', $urlparams, ['goto' => (string)$summary->homework_unitid, 'managed_student' => 0, 'monitor_studentid' => $childid])
                  : null;
              $followupurl = pqls_url('/local/hubredirect/live_followup_message.php', $urlparams, [
                  'sessionid' => (int)$summary->sessionid,
                  'studentid' => $childid,
                  'sesskey' => sesskey(),
              ]);
              $activity = pqls_focus_summary($childid, (int)$summary->sessionid);
              $coach = pqls_practice_coach_summary($childid, (int)$summary->sessionid);
            ?>
            <article class="pqls-card">
              <div class="pqls-card__head">
                <div>
                  <h2><?php echo s((string)$summary->title); ?></h2>
                  <p class="pqls-meta">
                    <?php echo userdate((int)$summary->scheduled_start, get_string('strftimedatetimeshort')); ?>
                    - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$summary->teacherid); ?>
                  </p>
                  <?php if ($lesson !== ''): ?><p class="pqls-meta"><?php echo s($lesson); ?></p><?php endif; ?>
                </div>
                <span class="pqls-pill"><?php echo s($attendance !== '' ? ucfirst(str_replace('_', ' ', $attendance)) : (string)$summary->status); ?></span>
              </div>
              <?php if (!empty($activity['hasdata'])): ?>
                <div class="pqls-activity" aria-label="Session learning activity">
                  <div class="pqls-activity__item"><strong><?php echo s(pqls_format_minutes((int)$activity['active_ms'])); ?></strong><span>active lesson time</span></div>
                  <div class="pqls-activity__item"><strong><?php echo s(pqls_step_label((string)$activity['current_step'])); ?></strong><span>last step recorded</span></div>
                  <div class="pqls-activity__item"><strong><?php echo (int)$activity['idle_count']; ?></strong><span>focus reminders</span></div>
                  <div class="pqls-activity__item"><strong><?php echo !empty($activity['last_time']) ? userdate((int)$activity['last_time'], get_string('strftimetime')) : 'n/a'; ?></strong><span>last activity</span></div>
                </div>
              <?php endif; ?>
              <?php if (!empty($coach['hasdata'])): ?>
                <section class="pqls-coach" aria-label="Chatbot Practice Coach support">
                  <h3>Chatbot Practice Coach Support</h3>
                  <div class="pqls-coach__grid">
                    <div class="pqls-coach__item"><strong><?php echo (int)$coach['count']; ?></strong><span>support prompts</span></div>
                    <div class="pqls-coach__item"><strong><?php echo (int)$coach['idle']; ?></strong><span>focus reminders</span></div>
                    <div class="pqls-coach__item"><strong><?php echo (int)$coach['away']; ?></strong><span>screen-return prompts</span></div>
                  </div>
                  <?php if ((string)$coach['latest_message'] !== ''): ?>
                    <p>Latest coach feedback: <?php echo s((string)$coach['latest_message']); ?><?php echo !empty($coach['latest_time']) ? ' - ' . s(userdate((int)$coach['latest_time'], get_string('strftimetime'))) : ''; ?></p>
                  <?php endif; ?>
                  <?php if ((string)$coach['latest_recommendation'] !== ''): ?>
                    <p>Suggested next step: <?php echo s((string)$coach['latest_recommendation']); ?></p>
                  <?php endif; ?>
                </section>
              <?php endif; ?>
              <div class="pqls-grid">
                <div class="pqls-field">
                  <strong>Strengths</strong>
                  <p><?php echo s((string)$summary->strengths !== '' ? (string)$summary->strengths : 'No strengths note added.'); ?></p>
                </div>
                <div class="pqls-field">
                  <strong>Needs Practice</strong>
                  <p><?php echo s((string)$summary->needs_practice !== '' ? (string)$summary->needs_practice : 'No practice note added.'); ?></p>
                </div>
                <div class="pqls-field">
                  <strong>Homework</strong>
                  <p><?php echo s((string)$summary->homework !== '' ? (string)$summary->homework : 'No homework assigned.'); ?></p>
                  <?php if ($homeworkunit !== ''): ?><p><?php echo s($homeworkunit); ?><?php echo !empty($summary->homework_due_date) ? ' - Due ' . userdate((int)$summary->homework_due_date, get_string('strftimedate')) : ''; ?> - <?php echo s(ucfirst((string)$summary->homework_priority)); ?> priority</p><?php endif; ?>
                  <?php if ($homeworkurl): ?><p><a class="pqls-btn pqls-btn--light" href="<?php echo $homeworkurl->out(false); ?>">Practice assigned homework</a></p><?php endif; ?>
                </div>
                <div class="pqls-field">
                  <strong>Participation</strong>
                  <p><?php echo s($participation !== '' ? $participation : 'No participation note added.'); ?><?php echo !empty($summary->technical_issue) ? s("\nTechnical issue reported.") : ''; ?></p>
                </div>
                <div class="pqls-field pqls-field--wide">
                  <strong>Parent Summary</strong>
                  <p><?php echo s((string)$summary->parent_summary !== '' ? (string)$summary->parent_summary : 'No parent summary added.'); ?></p>
                </div>
                <?php if ((string)($summary->followup_status ?? 'none') !== 'none' && empty($summary->followup_resolved)): ?>
                  <div class="pqls-field pqls-field--wide">
                    <strong>Follow-Up</strong>
                    <p><?php echo s((string)$summary->followup_message !== '' ? (string)$summary->followup_message : 'The teacher requested follow-up for this class.'); ?></p>
                    <p><a class="pqls-btn pqls-btn--light" href="<?php echo $followupurl->out(false); ?>">Reply to follow-up</a></p>
                    <?php if (pqls_column_exists('local_prequran_live_note', 'parent_response_status') && pqls_parent_can_access_child((int)$USER->id, $childid)): ?>
                      <form class="pqls-response" method="post">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <?php if (!empty($consumercontext->consumerslug)): ?><input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>"><?php endif; ?>
                        <?php if ($workspaceid > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$workspaceid; ?>"><?php endif; ?>
                        <input type="hidden" name="action" value="parent_followup_response">
                        <input type="hidden" name="sessionid" value="<?php echo (int)$summary->sessionid; ?>">
                        <input type="hidden" name="studentid" value="<?php echo (int)$childid; ?>">
                        <strong>Your Response</strong>
                        <textarea name="parent_response_message" placeholder="Optional note for the teacher"><?php echo s((string)($summary->parent_response_message ?? '')); ?></textarea>
                        <div class="pqls-response__actions pqh-workspace-actions">
                          <button class="pqls-btn pqls-btn--light" type="submit" name="parent_response_status" value="reviewed">Marked as reviewed</button>
                          <button class="pqls-btn pqls-btn--light" type="submit" name="parent_response_status" value="homework_completed">Homework completed</button>
                          <button class="pqls-btn" type="submit" name="parent_response_status" value="needs_help">Need teacher help</button>
                        </div>
                      </form>
                    <?php endif; ?>
                  </div>
                <?php elseif ((string)($summary->parent_response_status ?? 'none') !== 'none'): ?>
                  <div class="pqls-field pqls-field--wide">
                    <strong>Follow-Up Response</strong>
                    <p><?php echo s(ucfirst(str_replace('_', ' ', (string)$summary->parent_response_status))); ?><?php echo !empty($summary->parent_responseat) ? ' - ' . userdate((int)$summary->parent_responseat, get_string('strftimedatetimeshort')) : ''; ?></p>
                    <?php if ((string)($summary->parent_response_message ?? '') !== ''): ?><p><?php echo s((string)$summary->parent_response_message); ?></p><?php endif; ?>
                  </div>
                <?php endif; ?>
              </div>
            </article>
          <?php endforeach; ?>
        </section>
      <?php endif; ?>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
