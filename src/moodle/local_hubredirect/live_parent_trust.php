<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');

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

function pqlpt_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(pqlpt_url('/local/hubredirect/live_parent_trust.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Parent Live-Class Hub');
$PAGE->set_heading('Parent Live-Class Hub');
$PAGE->add_body_class('pqh-live-parent-trust-page');

function pqlpt_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlpt_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlpt_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlpt_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqlpt_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlpt_table_exists('local_prequran_comm_participant') && pqlpt_table_exists('local_prequran_comm_thread')) {
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

function pqlpt_is_managed_student(int $userid): bool {
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

function pqlpt_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlpt_table_exists('local_prequran_teacher_student')
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

function pqlpt_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (pqlpt_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $teacherid, 'studentid' => $studentid, 'status' => 'active']);
        }
    }
    if (!pqlpt_has_teacher_role($teacherid) || !pqlpt_is_managed_student($studentid)) {
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

function pqlpt_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid) || $userid === $studentid) {
        return true;
    }
    return pqlpt_parent_can_access_child($userid, $studentid) || pqlpt_teacher_can_access_student($userid, $studentid);
}

function pqlpt_enrich_children(array $studentids): array {
    $children = [];
    foreach (array_unique(array_filter(array_map('intval', $studentids))) as $studentid) {
        $user = core_user::get_user($studentid);
        $children[] = ['studentid' => $studentid, 'name' => $user ? fullname($user) : 'Student ' . $studentid];
    }
    usort($children, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $children;
}

function pqlpt_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    if (pqlpt_table_exists('local_prequran_comm_consent')) {
        foreach ($DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC') as $row) {
            if ((int)$row->studentid > 0) {
                $children[(int)$row->studentid] = (int)$row->studentid;
            }
        }
    }
    if (pqlpt_table_exists('local_prequran_comm_participant') && pqlpt_table_exists('local_prequran_comm_thread')) {
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
            if ((int)$row->studentid > 0) {
                $children[(int)$row->studentid] = (int)$row->studentid;
            }
        }
    }
    return pqlpt_enrich_children(array_values($children));
}

function pqlpt_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    if (pqlpt_table_exists('local_prequran_teacher_student')) {
        foreach ($DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']) as $row) {
            if ((int)$row->studentid > 0) {
                $students[(int)$row->studentid] = (int)$row->studentid;
            }
        }
    }
    return pqlpt_enrich_children(array_values($students));
}

function pqlpt_join_state($session): array {
    $before = ((int)get_config('local_prequran', 'bbb_join_window_before_minutes') ?: 10) * MINSECS;
    $after = ((int)get_config('local_prequran', 'bbb_join_window_after_minutes') ?: 15) * MINSECS;
    $now = time();
    $open = $now >= ((int)$session->scheduled_start - $before) && $now <= ((int)$session->scheduled_start + $after);
    if ((string)$session->status === 'cancelled') {
        return ['cancelled', 'Cancelled'];
    }
    if ($open && !empty($session->bbb_created)) {
        return ['open', 'Join class'];
    }
    if ($open) {
        return ['waiting', 'Teacher has not started yet'];
    }
    if ($now < ((int)$session->scheduled_start - $before)) {
        return ['early', 'Opens ' . userdate((int)$session->scheduled_start - $before, get_string('strftimetime'))];
    }
    return ['closed', 'Join window closed'];
}

function pqlpt_upcoming_sessions(int $studentid, int $limit = 5): array {
    global $DB;
    if (!pqlpt_table_exists('local_prequran_live_session') || !pqlpt_table_exists('local_prequran_live_participant')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT s.*,
                a.attendance_status,
                n.visible_to_parent AS summary_visible,
                n.homework,
                (SELECT COUNT(1)
                   FROM {local_prequran_live_recording} r
                  WHERE r.sessionid = s.id
                    AND r.visible_to_parent = 1
                    AND r.status = 'available') AS visible_recordings
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = p.studentid
      LEFT JOIN {local_prequran_live_note} n ON n.sessionid = s.id AND n.studentid = p.studentid
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
            AND s.scheduled_start >= :nowtime
            AND s.status <> :cancelled
       ORDER BY s.scheduled_start ASC, s.id ASC",
        [
            'studentid' => $studentid,
            'role' => 'student',
            'participantstatus' => 'active',
            'nowtime' => time() - HOURSECS,
            'cancelled' => 'cancelled',
        ],
        0,
        $limit
    ));
}

function pqlpt_public_summaries(int $studentid, int $limit = 4): array {
    global $DB;
    if (!pqlpt_table_exists('local_prequran_live_note') || !pqlpt_table_exists('local_prequran_live_session')) {
        return [];
    }
    $followupselect = pqlpt_column_exists('local_prequran_live_note', 'followup_status')
        ? "n.followup_status, n.followup_message, n.followup_resolved,"
        : "'none' AS followup_status, '' AS followup_message, 0 AS followup_resolved,";
    $parentresponseselect = pqlpt_column_exists('local_prequran_live_note', 'parent_response_status')
        ? "n.parent_response_status, n.parent_responseat,"
        : "'none' AS parent_response_status, 0 AS parent_responseat,";
    $homeworkselect = pqlpt_column_exists('local_prequran_live_note', 'homework_unitid')
        ? "n.homework_lessonid, n.homework_unitid, n.homework_due_date, n.homework_priority,"
        : "'' AS homework_lessonid, '' AS homework_unitid, 0 AS homework_due_date, 'normal' AS homework_priority,";

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
                s.scheduled_start,
                s.scheduled_end,
                s.lessonid,
                s.unitid,
                a.attendance_status,
                a.participation_status
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = n.sessionid AND a.studentid = n.studentid
          WHERE n.studentid = :studentid
            AND n.visible_to_parent = 1
       ORDER BY s.scheduled_start DESC, n.timemodified DESC",
        ['studentid' => $studentid],
        0,
        $limit
    ));
}

function pqlpt_focus_summary(int $studentid, int $sessionid): array {
    global $DB;
    $summary = ['hasdata' => false, 'active_ms' => 0, 'idle_count' => 0, 'last_time' => 0, 'current_step' => ''];
    if (!pqlpt_table_exists('local_prequran_focusagg')
        || !pqlpt_column_exists('local_prequran_focusagg', 'live_sessionid')) {
        return $summary;
    }
    $row = $DB->get_record_sql(
        "SELECT COALESCE(SUM(active_ms), 0) AS active_ms,
                COALESCE(SUM(idle_count), 0) AS idle_count,
                MAX(last_time) AS last_time
           FROM {local_prequran_focusagg}
          WHERE userid = :userid
            AND live_sessionid = :sessionid",
        ['userid' => $studentid, 'sessionid' => $sessionid]
    );
    if ($row) {
        $summary['active_ms'] = (int)$row->active_ms;
        $summary['idle_count'] = (int)$row->idle_count;
        $summary['last_time'] = (int)$row->last_time;
        $summary['hasdata'] = $summary['active_ms'] > 0 || $summary['idle_count'] > 0 || $summary['last_time'] > 0;
    }
    $latest = $DB->get_record_sql(
        "SELECT step_id, unitid
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

function pqlpt_focus_minutes(int $ms): string {
    return (int)round($ms / 60000) . ' min';
}

function pqlpt_focus_step_label(string $stepid): string {
    $stepid = trim($stepid);
    return $stepid === '' ? 'Not recorded' : ucwords(str_replace(['_', '-'], ' ', $stepid));
}

function pqlpt_visible_recordings(int $studentid, int $limit = 3): array {
    global $DB;
    if (!pqlpt_table_exists('local_prequran_live_recording')
        || !pqlpt_table_exists('local_prequran_live_session')
        || !pqlpt_table_exists('local_prequran_live_participant')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT r.id,
                r.sessionid,
                r.playback_url,
                r.playback_format,
                r.duration_minutes,
                r.expiresat,
                s.title AS session_title,
                s.scheduled_start,
                s.teacherid
           FROM {local_prequran_live_recording} r
           JOIN {local_prequran_live_session} s ON s.id = r.sessionid
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
            AND r.visible_to_parent = 1
            AND r.status = :recordingstatus
            AND (r.expiresat = 0 OR r.expiresat > :nowtime)
       ORDER BY s.scheduled_start DESC, r.id DESC",
        [
            'studentid' => $studentid,
            'role' => 'student',
            'participantstatus' => 'active',
            'recordingstatus' => 'available',
            'nowtime' => time(),
        ],
        0,
        $limit
    ));
}

function pqlpt_series_rows(int $studentid): array {
    global $DB;
    if (!pqlpt_table_exists('local_prequran_live_series')
        || !pqlpt_table_exists('local_prequran_live_session')
        || !pqlpt_table_exists('local_prequran_live_participant')
        || !pqlpt_column_exists('local_prequran_live_session', 'seriesid')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT DISTINCT se.*
           FROM {local_prequran_live_series} se
           JOIN {local_prequran_live_session} s ON s.seriesid = se.id
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
            AND se.status <> :cancelled
       ORDER BY se.date_start DESC, se.id DESC",
        ['studentid' => $studentid, 'role' => 'student', 'participantstatus' => 'active', 'cancelled' => 'cancelled']
    ));
}

function pqlpt_latest_series_change(int $seriesid): int {
    global $DB;
    if (!pqlpt_table_exists('local_prequran_live_audit')) {
        return 0;
    }
    return (int)$DB->get_field_sql(
        "SELECT MAX(timecreated)
           FROM {local_prequran_live_audit}
          WHERE targettype = :targettype
            AND targetid = :targetid
            AND action IN (
                'series_updated',
                'series_session_updated',
                'series_single_session_cancelled',
                'series_cancelled',
                'session_cancelled',
                'series_change_notifications_processed',
                'series_cancel_notifications_processed',
                'series_single_cancel_notice'
            )",
        ['targettype' => 'series', 'targetid' => $seriesid]
    );
}

function pqlpt_ack_record(int $seriesid, int $studentid, int $parentid) {
    global $DB;
    if (!pqlpt_table_exists('local_prequran_live_ack')) {
        return false;
    }
    return $DB->get_record('local_prequran_live_ack', ['seriesid' => $seriesid, 'studentid' => $studentid, 'parentid' => $parentid], '*', IGNORE_MISSING);
}

function pqlpt_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlpt_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqlpt_staff_can_preview_child(int $userid, int $studentid): bool {
    return $studentid > 0 && (is_siteadmin($userid) || pqlpt_teacher_can_access_student($userid, $studentid));
}

function pqlpt_linked_parents(int $studentid): array {
    global $DB;
    $parentids = [];
    if ($studentid <= 0) {
        return [];
    }
    if (pqlpt_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['studentid' => $studentid]);
        foreach ($rows as $row) {
            if ((int)$row->guardianid > 0) {
                $parentids[(int)$row->guardianid] = (int)$row->guardianid;
            }
        }
    }
    if (pqlpt_table_exists('local_prequran_comm_participant') && pqlpt_table_exists('local_prequran_comm_thread')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT p.userid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE t.studentid = :studentid
                AND p.role = :role",
            ['studentid' => $studentid, 'role' => 'parent']
        );
        foreach ($rows as $row) {
            if ((int)$row->userid > 0) {
                $parentids[(int)$row->userid] = (int)$row->userid;
            }
        }
    }

    $parents = [];
    foreach ($parentids as $parentid) {
        $user = core_user::get_user($parentid);
        $parents[] = [
            'userid' => $parentid,
            'name' => $user ? fullname($user) : 'Parent ' . $parentid,
            'email' => $user && !empty($user->email) ? (string)$user->email : '',
        ];
    }
    usort($parents, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $parents;
}

function pqlpt_pending_ack_count(int $studentid): int {
    $parents = pqlpt_linked_parents($studentid);
    $parentids = array_map(static function(array $parent): int {
        return (int)$parent['userid'];
    }, $parents);
    $pending = 0;
    foreach (pqlpt_series_rows($studentid) as $series) {
        $latestchange = pqlpt_latest_series_change((int)$series->id);
        if ($latestchange <= 0) {
            continue;
        }
        if (!$parentids) {
            $pending++;
            continue;
        }
        foreach ($parentids as $parentid) {
            $ack = pqlpt_ack_record((int)$series->id, $studentid, $parentid);
            if (!$ack || (string)$ack->ack_status !== 'acknowledged' || (int)$ack->acknowledgedat < $latestchange) {
                $pending++;
            }
        }
    }
    return $pending;
}

function pqlpt_support_missing_items(): array {
    $missing = [];
    $tables = [
        'local_prequran_live_session',
        'local_prequran_live_participant',
        'local_prequran_live_attendance',
        'local_prequran_live_note',
        'local_prequran_live_recording',
        'local_prequran_live_series',
        'local_prequran_live_ack',
        'local_prequran_live_audit',
    ];
    foreach ($tables as $table) {
        if (!pqlpt_table_exists($table)) {
            $missing[] = 'Missing table: ' . $table;
        }
    }
    $columns = [
        'local_prequran_live_session' => ['seriesid', 'status', 'bbb_created'],
        'local_prequran_live_note' => ['visible_to_parent', 'followup_status', 'parent_response_status', 'homework_unitid'],
        'local_prequran_live_recording' => ['visible_to_parent', 'status', 'expiresat'],
        'local_prequran_live_ack' => ['ack_status', 'acknowledgedat', 'lastchangeat'],
    ];
    foreach ($columns as $table => $tablecolumns) {
        foreach ($tablecolumns as $column) {
            if (!pqlpt_column_exists($table, $column)) {
                $missing[] = 'Missing column: ' . $table . '.' . $column;
            }
        }
    }
    return $missing;
}

function pqlpt_recent_staff_preview_audit_exists(int $studentid): bool {
    global $DB, $USER;
    if (!pqlpt_table_exists('local_prequran_live_audit')) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {local_prequran_live_audit}
          WHERE actorid = :actorid
            AND action = :action
            AND targettype = :targettype
            AND targetid = :targetid
            AND timecreated >= :mintime",
        [
            'actorid' => (int)$USER->id,
            'action' => 'parent_trust_preview_opened',
            'targettype' => 'student',
            'targetid' => $studentid,
            'mintime' => time() - HOURSECS,
        ]
    );
}

function pqlpt_support_reason_options(): array {
    return [
        'parent_support_request' => 'Parent support request',
        'scheduling_issue' => 'Scheduling issue',
        'recording_summary_question' => 'Recording or summary question',
        'technical_support' => 'Technical support',
        'safety_privacy_review' => 'Safety/privacy review',
        'other' => 'Other',
    ];
}

if (data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'ack_series_change') {
    global $DB, $USER;
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Your security token expired. Open the parent live hub again before acknowledging a schedule change.',
            pqlpt_url('/local/hubredirect/live_parent_trust.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []),
            'Schedule acknowledgement expired'
        );
    }
    $seriesid = optional_param('seriesid', 0, PARAM_INT);
    $studentid = optional_param('studentid', 0, PARAM_INT);
    if ($seriesid <= 0 || $studentid <= 0) {
        pqh_access_denied(
            'Choose a valid recurring class before acknowledging a schedule change.',
            pqlpt_url('/local/hubredirect/live_parent_trust.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []),
            'Schedule acknowledgement unavailable'
        );
    }
    if (!pqlpt_parent_can_access_child((int)$USER->id, $studentid)) {
        pqh_access_denied(
            'Only linked parents can acknowledge schedule changes.',
            $returnurl,
            'Schedule acknowledgement access required'
        );
    }
    if (!pqlpt_table_exists('local_prequran_live_ack')) {
        pqh_access_denied(
            'Schedule acknowledgement is not installed yet.',
            pqlpt_url('/local/hubredirect/live_parent_trust.php', $urlparams, ['childid' => $studentid]),
            'Schedule acknowledgement unavailable'
        );
    }
    $latestchange = pqlpt_latest_series_change($seriesid);
    $now = time();
    $record = pqlpt_ack_record($seriesid, $studentid, (int)$USER->id);
    if ($record) {
        $record->ack_status = 'acknowledged';
        $record->acknowledgedat = $now;
        $record->lastchangeat = $latestchange;
        $record->timemodified = $now;
        $DB->update_record('local_prequran_live_ack', $record);
    } else {
        $DB->insert_record('local_prequran_live_ack', (object)[
            'seriesid' => $seriesid,
            'studentid' => $studentid,
            'parentid' => (int)$USER->id,
            'ack_status' => 'acknowledged',
            'ack_message' => '',
            'acknowledgedat' => $now,
            'lastchangeat' => $latestchange,
            'remindedat' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }
    pqlpt_audit(0, 'series_schedule_acknowledged', 'series', $seriesid, [
        'studentid' => $studentid,
        'parentid' => (int)$USER->id,
        'source' => 'parent_trust_dashboard',
        'lastchangeat' => $latestchange,
    ]);
    redirect(pqlpt_url('/local/hubredirect/live_parent_trust.php', $urlparams, ['childid' => $studentid, 'acknowledged' => 1]));
}

if (data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'log_support_case') {
    global $DB, $USER;
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Your security token expired. Open the parent live hub again before saving a support case.',
            pqlpt_url('/local/hubredirect/live_parent_trust.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []),
            'Support case expired'
        );
    }
    $studentid = optional_param('studentid', 0, PARAM_INT);
    if ($studentid <= 0) {
        pqh_access_denied(
            'Choose a valid student before saving a support case.',
            pqlpt_url('/local/hubredirect/live_parent_trust.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []),
            'Support case unavailable'
        );
    }
    if (!pqlpt_staff_can_preview_child((int)$USER->id, $studentid)) {
        pqh_access_denied(
            'Only authorized staff can log parent trust support cases.',
            $returnurl,
            'Parent trust support access required'
        );
    }
    $reason = optional_param('support_reason', 'other', PARAM_ALPHANUMEXT);
    $reasonoptions = pqlpt_support_reason_options();
    if (!array_key_exists($reason, $reasonoptions)) {
        $reason = 'other';
    }
    $casenote = optional_param('case_note', '', PARAM_TEXT);
    $casestatus = optional_param('case_status', 'open', PARAM_ALPHANUMEXT);
    if (!in_array($casestatus, ['open', 'resolved', 'escalated'], true)) {
        $casestatus = 'open';
    }
    $details = [
        'viewerid' => (int)$USER->id,
        'support_reason' => $reason,
        'support_reason_label' => $reasonoptions[$reason],
        'case_status' => $casestatus,
        'case_note' => $casenote,
        'source' => 'parent_trust_support_panel',
    ];
    pqlpt_audit(0, 'parent_trust_preview_opened', 'student', $studentid, $details);
    pqlpt_audit(0, 'parent_trust_support_case_logged', 'student', $studentid, $details);
    redirect(pqlpt_url('/local/hubredirect/live_parent_trust.php', $urlparams, ['childid' => $studentid, 'supportlogged' => 1]));
}

if ($childid > 0 && !pqlpt_user_can_access_child((int)$USER->id, $childid)) {
    pqh_access_denied(
        'You cannot view the parent live-class hub for this student.',
        $returnurl,
        'Parent live hub access required'
    );
}

$modechildren = is_siteadmin($USER) ? [] : pqlpt_parent_children((int)$USER->id);
if (!$modechildren && pqlpt_has_teacher_role((int)$USER->id)) {
    $modechildren = pqlpt_teacher_students((int)$USER->id);
}
if ($childid <= 0 && count($modechildren) === 1) {
    $childid = (int)$modechildren[0]['studentid'];
}

$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');
$upcoming = $childid > 0 ? pqlpt_upcoming_sessions($childid, 5) : [];
$summaries = $childid > 0 ? pqlpt_public_summaries($childid, 4) : [];
$recordings = $childid > 0 ? pqlpt_visible_recordings($childid, 3) : [];
$seriesrows = $childid > 0 ? pqlpt_series_rows($childid) : [];
$openfollowups = array_values(array_filter($summaries, static function($summary): bool {
    return (string)($summary->followup_status ?? 'none') !== 'none' && empty($summary->followup_resolved);
}));
$homeworkrows = array_values(array_filter($summaries, static function($summary): bool {
    return trim((string)($summary->homework ?? '') . ' ' . (string)($summary->homework_unitid ?? '')) !== '';
}));
$supportmode = $childid > 0 && pqlpt_staff_can_preview_child((int)$USER->id, $childid);
$canackasparent = $childid > 0 && !$supportmode && pqlpt_parent_can_access_child((int)$USER->id, $childid);
$linkedparents = $supportmode ? pqlpt_linked_parents($childid) : [];
$pendingackcount = $supportmode ? pqlpt_pending_ack_count($childid) : 0;
$missingitems = $supportmode ? pqlpt_support_missing_items() : [];
$supporturl = $childid > 0 ? pqlpt_url('/local/hubredirect/live_parent_trust.php', $urlparams, ['childid' => $childid]) : null;
$supportreasonoptions = pqlpt_support_reason_options();
if ($supportmode && !pqlpt_recent_staff_preview_audit_exists($childid)) {
    pqlpt_audit(0, 'parent_trust_preview_opened', 'student', $childid, [
        'viewerid' => (int)$USER->id,
        'linked_parents' => count($linkedparents),
        'upcoming_sessions' => count($upcoming),
        'visible_summaries' => count($summaries),
        'open_followups' => count($openfollowups),
        'visible_recordings' => count($recordings),
        'pending_acknowledgements' => $pendingackcount,
    ]);
}
$diagnostics = [];
if ($childid > 0) {
    if (!pqlpt_table_exists('local_prequran_live_ack')) {
        $diagnostics[] = 'Schedule read receipts are not enabled yet.';
    }
    if (!$upcoming) {
        $diagnostics[] = 'No upcoming live sessions are currently scheduled.';
    }
    if (!$summaries) {
        $diagnostics[] = 'No parent-visible teacher summaries are ready yet.';
    }
    if (!$recordings) {
        $diagnostics[] = 'No approved live-class recordings are available yet.';
    }
    if (!pqlpt_parent_can_access_child((int)$USER->id, $childid) && !is_siteadmin($USER) && (int)$USER->id !== $childid) {
        $diagnostics[] = 'This login is not linked as a parent for this student.';
    }
    if ($supportmode && !$linkedparents) {
        $diagnostics[] = 'Staff preview: no linked parent/guardian record was found for this student.';
    }
}

$acknowledged = optional_param('acknowledged', 0, PARAM_INT);
$supportlogged = optional_param('supportlogged', 0, PARAM_INT);

echo $OUTPUT->header();
?>
<style>
body.pqh-live-parent-trust-page header,
body.pqh-live-parent-trust-page footer,
body.pqh-live-parent-trust-page nav.navbar,
body.pqh-live-parent-trust-page #page-header,
body.pqh-live-parent-trust-page #page-footer,
body.pqh-live-parent-trust-page .drawer,
body.pqh-live-parent-trust-page .drawer-toggles,
body.pqh-live-parent-trust-page .block-region,
body.pqh-live-parent-trust-page [data-region="drawer"],
body.pqh-live-parent-trust-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-parent-trust-page #page,
body.pqh-live-parent-trust-page #page-content,
body.pqh-live-parent-trust-page #region-main,
body.pqh-live-parent-trust-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlpt-shell{min-height:100vh;padding:34px 18px 58px;background:linear-gradient(180deg,#f1fff4 0,#f6f9fc 42%,#fff 100%);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlpt-wrap{max-width:1120px;margin:0 auto}
.pqlpt-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px;padding:24px;border-radius:16px;background:linear-gradient(135deg,#eaffea 0,#fff 54%,#fff7e7 100%);border:1px solid rgba(111,78,50,.13);box-shadow:0 16px 38px rgba(105,76,45,.08)}
.pqlpt-title{margin:0;font-size:34px;line-height:1.08;font-weight:950;color:#241b24}
.pqlpt-subtitle{margin:8px 0 0;font-size:15px;font-weight:800;color:#586c78}
.pqlpt-kicker{margin:0 0 8px;font-size:12px;font-weight:950;text-transform:uppercase;color:#7b5a3a;letter-spacing:0}
.pqlpt-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.pqlpt-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border-radius:9px;border:1px solid rgba(23,48,68,.14);background:#2f7d4f;color:#fff!important;text-decoration:none!important;font-size:14px;font-weight:900;box-shadow:none}
.pqlpt-btn--light{background:#eef5f7;color:#0d2b42!important}
.pqlpt-btn--warm{background:#7b5230;color:#fff!important}
.pqlpt-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0}
.pqlpt-metric,.pqlpt-card{background:#fff;border:1px solid rgba(23,48,68,.1);border-radius:14px;box-shadow:0 14px 34px rgba(23,48,68,.07)}
.pqlpt-metric{padding:16px}
.pqlpt-metric strong{display:block;font-size:28px;font-weight:950;color:#7b5230}
.pqlpt-metric span{display:block;margin-top:6px;font-size:13px;font-weight:900;color:#586c78}
.pqlpt-layout{display:grid;grid-template-columns:1.4fr .9fr;gap:16px}
.pqlpt-card{padding:18px;margin-bottom:16px}
.pqlpt-card h2{margin:0 0 12px;font-size:21px;font-weight:950;color:#241b24}
.pqlpt-item{padding:14px;border:1px solid rgba(23,48,68,.1);border-radius:12px;background:#fbfdf9;margin-top:10px}
.pqlpt-item h3{margin:0;font-size:18px;font-weight:950;color:#173044}
.pqlpt-meta{margin:6px 0 0;font-size:13px;font-weight:800;color:#586c78}
.pqlpt-pill{display:inline-flex;align-items:center;min-height:32px;padding:0 12px;border-radius:999px;background:#eef5f7;font-size:12px;font-weight:950;color:#173044}
.pqlpt-pill--warn{background:#fff2d5;color:#7b5230}
.pqlpt-pill--ok{background:#eafaef;color:#245c35}
.pqlpt-pill--hot{background:#ffe7e0;color:#8b2c1f}
.pqlpt-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.pqlpt-empty,.pqlpt-notice{padding:18px;border:1px dashed rgba(23,48,68,.18);border-radius:12px;background:#fff;font-size:15px;font-weight:850;color:#586c78}
.pqlpt-notice{margin-bottom:16px;border-style:solid;background:#eafaef;color:#245c35}
.pqlpt-alerts{display:grid;gap:10px;margin:0 0 16px}
.pqlpt-alert{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;border-radius:12px;border:1px solid rgba(123,82,48,.16);background:#fff8e9;color:#5f452b;font-size:14px;font-weight:900}
.pqlpt-alert strong{font-weight:950;color:#241b24}
.pqlpt-priority{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:0 0 16px}
.pqlpt-priority a,.pqlpt-priority form{margin:0}
.pqlpt-priority form button{width:100%}
.pqlpt-select{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:14px}
.pqlpt-student{display:block;padding:15px;border:1px solid rgba(23,48,68,.12);border-radius:12px;background:#fff;color:#173044!important;text-decoration:none!important;font-weight:950}
.pqlpt-student span{display:block;margin-top:5px;color:#586c78;font-size:13px;font-weight:800}
.pqlpt-mini{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.pqlpt-live-activity{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
.pqlpt-live-activity div{padding:10px;border-radius:10px;background:#fff;border:1px solid rgba(23,48,68,.08)}
.pqlpt-live-activity strong{display:block;font-size:16px;font-weight:950;color:#7b5230}
.pqlpt-live-activity span{display:block;margin-top:3px;font-size:11px;font-weight:900;color:#586c78}
.pqlpt-field{padding:12px;border-radius:10px;background:#f8fbf5;border:1px solid rgba(23,48,68,.08)}
.pqlpt-field strong{display:block;font-size:12px;font-weight:950;text-transform:uppercase;color:#40291e}
.pqlpt-field p{margin:6px 0 0;font-size:14px;font-weight:800;color:#415665}
.pqlpt-support{margin:0 0 16px;padding:18px;border-radius:14px;border:1px solid rgba(47,125,79,.22);background:#f6fff8;box-shadow:0 14px 34px rgba(23,48,68,.06)}
.pqlpt-support h2{margin:0 0 6px;font-size:21px;font-weight:950;color:#173044}
.pqlpt-support__text{margin:0 0 12px;font-size:14px;font-weight:850;color:#586c78}
.pqlpt-support__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}
.pqlpt-support__metric{padding:12px;border-radius:10px;background:#fff;border:1px solid rgba(23,48,68,.08)}
.pqlpt-support__metric strong{display:block;font-size:22px;font-weight:950;color:#7b5230}
.pqlpt-support__metric span{font-size:12px;font-weight:900;color:#586c78}
.pqlpt-support__copy{width:100%;box-sizing:border-box;min-height:40px;margin:6px 0 12px;padding:8px 10px;border-radius:9px;border:1px solid rgba(23,48,68,.14);background:#fff;color:#173044;font-size:13px;font-weight:800}
.pqlpt-support__list{margin:8px 0 0;padding-left:18px;color:#415665;font-size:13px;font-weight:800}
.pqlpt-support__list li{margin:4px 0}
.pqlpt-support__form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0;padding:14px;border:1px solid rgba(23,48,68,.1);border-radius:12px;background:#fff}
.pqlpt-support__form label{display:block;margin:0 0 5px;font-size:12px;font-weight:950;color:#415665}
.pqlpt-support__input,.pqlpt-support__textarea{width:100%;box-sizing:border-box;border:1px solid rgba(23,48,68,.14);border-radius:9px;background:#fff;color:#173044;font-size:13px;font-weight:800}
.pqlpt-support__input{min-height:40px;padding:0 10px}
.pqlpt-support__textarea{min-height:84px;padding:9px 10px;resize:vertical}
.pqlpt-support__wide{grid-column:1/-1}
@media(max-width:920px){.pqlpt-layout{grid-template-columns:1fr}.pqlpt-grid{grid-template-columns:1fr 1fr}.pqlpt-top{display:block}.pqlpt-actions{margin-top:14px}}
@media(max-width:620px){.pqlpt-shell{padding:18px 10px 42px}.pqlpt-top,.pqlpt-card{padding:16px}.pqlpt-grid,.pqlpt-mini,.pqlpt-live-activity,.pqlpt-support__grid,.pqlpt-support__form{grid-template-columns:1fr}.pqlpt-support__wide{grid-column:auto}.pqlpt-row,.pqlpt-alert{display:block}.pqlpt-title{font-size:27px}.pqlpt-btn{width:100%;margin-top:8px}.pqlpt-pill{margin-top:10px}.pqlpt-item h3{font-size:17px;overflow-wrap:anywhere}.pqlpt-meta,.pqlpt-field p{overflow-wrap:anywhere}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlpt-shell">
  <div class="pqlpt-wrap">
    <section class="pqlpt-top pqh-workspace-top">
      <div>
        <p class="pqlpt-kicker">Parent trust dashboard</p>
        <h1 class="pqlpt-title pqh-workspace-title">Live-class hub for <?php echo s($childname); ?></h1>
        <p class="pqlpt-subtitle pqh-workspace-sub">Upcoming classes, teacher feedback, recordings, homework, follow-ups, and schedule acknowledgements in one place.</p>
      </div>
      <div class="pqlpt-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_schedule.php', $urlparams, $childid > 0 ? ['childid' => $childid] : [])->out(false); ?>">Schedule</a>
        <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_summaries.php', $urlparams, $childid > 0 ? ['childid' => $childid] : [])->out(false); ?>">Summaries</a>
        <a class="pqlpt-btn pqlpt-btn--warm" href="<?php echo pqlpt_url($workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $urlparams)->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if ($acknowledged): ?><div class="pqlpt-notice">Schedule acknowledgement saved.</div><?php endif; ?>
    <?php if ($supportlogged): ?><div class="pqlpt-notice">Support reason and case note saved to the audit trail.</div><?php endif; ?>

    <?php if ($childid <= 0): ?>
      <section class="pqlpt-card">
        <h2>Select a student</h2>
        <?php if (!$modechildren): ?>
          <div class="pqlpt-empty">No linked student accounts were found for this login.</div>
        <?php else: ?>
          <div class="pqlpt-select">
            <?php foreach ($modechildren as $childrow): ?>
              <a class="pqlpt-student" href="<?php echo pqlpt_url('/local/hubredirect/live_parent_trust.php', $urlparams, ['childid' => (int)$childrow['studentid']])->out(false); ?>">
                <?php echo s((string)$childrow['name']); ?>
                <span>Open parent live-class hub</span>
              </a>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </section>
    <?php else: ?>
      <?php
        $nextjoin = null;
        foreach ($upcoming as $session) {
            [$state] = pqlpt_join_state($session);
            if ($state === 'open') {
                $nextjoin = $session;
                break;
            }
        }
        $pendingackseries = null;
        foreach ($seriesrows as $series) {
            $latestchange = pqlpt_latest_series_change((int)$series->id);
            $ack = pqlpt_ack_record((int)$series->id, $childid, (int)$USER->id);
            if ($latestchange > 0 && (!$ack || (string)$ack->ack_status !== 'acknowledged' || (int)$ack->acknowledgedat < $latestchange)) {
                $pendingackseries = $series;
                break;
            }
        }
      ?>
      <?php if ($nextjoin || $pendingackseries || $openfollowups || $homeworkrows): ?>
        <section class="pqlpt-priority" aria-label="Priority actions">
          <?php if ($nextjoin): ?>
            <a class="pqlpt-btn" href="<?php echo pqlpt_url('/local/hubredirect/live_sessions.php', $urlparams, ['join' => (int)$nextjoin->id])->out(false); ?>">Join live class now</a>
          <?php endif; ?>
          <?php if ($pendingackseries && $canackasparent): ?>
            <form method="post">
              <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
              <?php if (!empty($consumercontext->consumerslug)): ?><input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>"><?php endif; ?>
              <?php if ($workspaceid > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$workspaceid; ?>"><?php endif; ?>
              <input type="hidden" name="action" value="ack_series_change">
              <input type="hidden" name="seriesid" value="<?php echo (int)$pendingackseries->id; ?>">
              <input type="hidden" name="studentid" value="<?php echo (int)$childid; ?>">
              <button class="pqlpt-btn pqlpt-btn--warm" type="submit">Acknowledge schedule change</button>
            </form>
          <?php endif; ?>
          <?php if ($openfollowups): ?>
            <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_summaries.php', $urlparams, ['childid' => $childid])->out(false); ?>">Respond to teacher follow-up</a>
          <?php endif; ?>
          <?php if ($homeworkrows): ?>
            <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_summaries.php', $urlparams, ['childid' => $childid])->out(false); ?>">Open homework</a>
          <?php endif; ?>
        </section>
      <?php endif; ?>

      <?php if ($diagnostics): ?>
        <section class="pqlpt-alerts" aria-label="Dashboard health">
          <?php foreach ($diagnostics as $diagnostic): ?>
            <div class="pqlpt-alert"><strong>Status</strong><span><?php echo s($diagnostic); ?></span></div>
          <?php endforeach; ?>
        </section>
      <?php endif; ?>

      <?php if ($supportmode): ?>
        <section class="pqlpt-support" aria-label="Staff preview and support tools">
          <h2>Staff Preview &amp; Support</h2>
          <p class="pqlpt-support__text">You are viewing the parent trust dashboard as support staff. Private teacher notes remain hidden here; this panel is only visible to authorized staff.</p>
          <div class="pqlpt-support__grid">
            <div class="pqlpt-support__metric"><strong><?php echo count($linkedparents); ?></strong><span>linked parents</span></div>
            <div class="pqlpt-support__metric"><strong><?php echo count($upcoming); ?></strong><span>upcoming sessions</span></div>
            <div class="pqlpt-support__metric"><strong><?php echo count($summaries); ?></strong><span>visible summaries</span></div>
            <div class="pqlpt-support__metric"><strong><?php echo count($openfollowups); ?></strong><span>open follow-ups</span></div>
            <div class="pqlpt-support__metric"><strong><?php echo $pendingackcount; ?></strong><span>pending acknowledgements</span></div>
            <div class="pqlpt-support__metric"><strong><?php echo count($recordings); ?></strong><span>visible recordings</span></div>
          </div>
          <label class="pqlpt-meta" for="pqlpt-support-url">Parent hub URL</label>
          <input id="pqlpt-support-url" class="pqlpt-support__copy" type="text" readonly value="<?php echo s($supporturl ? $supporturl->out(false) : ''); ?>" onclick="this.select();">
          <form class="pqlpt-support__form" method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <?php if (!empty($consumercontext->consumerslug)): ?><input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>"><?php endif; ?>
            <?php if ($workspaceid > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$workspaceid; ?>"><?php endif; ?>
            <input type="hidden" name="action" value="log_support_case">
            <input type="hidden" name="studentid" value="<?php echo (int)$childid; ?>">
            <div>
              <label for="support_reason">Access reason</label>
              <select id="support_reason" class="pqlpt-support__input" name="support_reason" required>
                <?php foreach ($supportreasonoptions as $reasonkey => $reasonlabel): ?>
                  <option value="<?php echo s($reasonkey); ?>"><?php echo s($reasonlabel); ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div>
              <label for="case_status">Case status</label>
              <select id="case_status" class="pqlpt-support__input" name="case_status">
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
            <div class="pqlpt-support__wide">
              <label for="case_note">Support case note</label>
              <textarea id="case_note" class="pqlpt-support__textarea" name="case_note" placeholder="Parent-safe reason for previewing this dashboard"></textarea>
            </div>
            <div class="pqlpt-support__wide">
              <button class="pqlpt-btn" type="submit">Save support reason</button>
            </div>
          </form>
          <div class="pqlpt-actions pqh-workspace-actions">
            <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_schedule.php', $urlparams, ['childid' => $childid])->out(false); ?>">Open schedule</a>
            <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_summaries.php', $urlparams, ['childid' => $childid])->out(false); ?>">Open summaries</a>
            <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_recordings.php', $urlparams, ['childid' => $childid])->out(false); ?>">Open recordings</a>
            <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_trust.php', $urlparams, ['childid' => $childid])->out(false); ?>">Trust center</a>
            <?php if (is_siteadmin($USER)): ?><a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_parent_trust_audit.php', $urlparams, ['studentid' => $childid])->out(false); ?>">Support audit</a><?php endif; ?>
          </div>
          <?php if ($linkedparents): ?>
            <ul class="pqlpt-support__list">
              <?php foreach ($linkedparents as $parent): ?>
                <li><?php echo s((string)$parent['name']); ?> (<?php echo s(pqh_account_no_label((int)$parent['userid'])); ?>, #<?php echo (int)$parent['userid']; ?><?php echo $parent['email'] !== '' ? ', ' . s((string)$parent['email']) : ''; ?>)</li>
              <?php endforeach; ?>
            </ul>
          <?php endif; ?>
          <?php if ($missingitems): ?>
            <ul class="pqlpt-support__list">
              <?php foreach ($missingitems as $missingitem): ?><li><?php echo s($missingitem); ?></li><?php endforeach; ?>
            </ul>
          <?php endif; ?>
        </section>
      <?php endif; ?>

      <section class="pqlpt-grid" aria-label="Live class overview">
        <div class="pqlpt-metric"><strong><?php echo count($upcoming); ?></strong><span>upcoming classes</span></div>
        <div class="pqlpt-metric"><strong><?php echo count($openfollowups); ?></strong><span>open follow-ups</span></div>
        <div class="pqlpt-metric"><strong><?php echo count($homeworkrows); ?></strong><span>recent homework items</span></div>
        <div class="pqlpt-metric"><strong><?php echo count($recordings); ?></strong><span>approved recordings</span></div>
      </section>

      <div class="pqlpt-layout">
        <div>
          <section class="pqlpt-card">
            <h2>Upcoming Live Sessions</h2>
            <?php if (!$upcoming): ?>
              <div class="pqlpt-empty">No upcoming live sessions are scheduled.</div>
            <?php else: ?>
              <?php foreach ($upcoming as $session): ?>
                <?php
                  [$joinstate, $joinlabel] = pqlpt_join_state($session);
                  $teacher = core_user::get_user((int)$session->teacherid);
                  $joinpillclass = $joinstate === 'open' ? 'pqlpt-pill--ok' : ($joinstate === 'waiting' ? 'pqlpt-pill--warn' : '');
                ?>
                <article class="pqlpt-item">
                  <div class="pqlpt-row">
                    <div>
                      <h3><?php echo s((string)$session->title); ?></h3>
                      <p class="pqlpt-meta"><?php echo s(userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'))); ?> - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid); ?></p>
                      <p class="pqlpt-meta">Target: <?php echo s(trim((string)$session->lessonid . ' / ' . (string)$session->unitid, ' /') ?: 'not set'); ?></p>
                    </div>
                    <span class="pqlpt-pill <?php echo $joinpillclass; ?>"><?php echo s($joinlabel); ?></span>
                  </div>
                  <div class="pqlpt-actions pqh-workspace-actions" style="margin-top:10px">
                    <?php if ($joinstate === 'open'): ?><a class="pqlpt-btn" href="<?php echo pqlpt_url('/local/hubredirect/live_sessions.php', $urlparams, ['join' => (int)$session->id])->out(false); ?>">Join class</a><?php endif; ?>
                    <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_schedule.php', $urlparams, ['childid' => $childid])->out(false); ?>">View schedule</a>
                  </div>
                </article>
              <?php endforeach; ?>
            <?php endif; ?>
          </section>

          <section class="pqlpt-card">
            <h2>Latest Teacher Feedback</h2>
            <?php if (!$summaries): ?>
              <div class="pqlpt-empty">No parent-visible teacher summaries are ready yet.</div>
            <?php else: ?>
              <?php foreach ($summaries as $summary): ?>
                <?php
                  $followupopen = (string)($summary->followup_status ?? 'none') !== 'none' && empty($summary->followup_resolved);
                  $homeworkurl = (string)($summary->homework_unitid ?? '') !== ''
                      ? pqlpt_url('/local/hubredirect/issue_child.php', $urlparams, ['goto' => (string)$summary->homework_unitid, 'managed_student' => 0, 'monitor_studentid' => $childid])
                      : null;
                  $activity = pqlpt_focus_summary($childid, (int)$summary->sessionid);
                ?>
                <article class="pqlpt-item">
                  <div class="pqlpt-row">
                    <div>
                      <h3><?php echo s((string)$summary->title); ?></h3>
                      <p class="pqlpt-meta"><?php echo s(userdate((int)$summary->scheduled_start, get_string('strftimedatetimeshort'))); ?> - <?php echo s((string)($summary->attendance_status ?: 'attendance pending')); ?></p>
                    </div>
                    <?php if ($followupopen): ?><span class="pqlpt-pill pqlpt-pill--hot">Waiting for your response</span><?php endif; ?>
                  </div>
                  <?php if (!empty($activity['hasdata'])): ?>
                    <div class="pqlpt-live-activity" aria-label="Session learning activity">
                      <div><strong><?php echo s(pqlpt_focus_minutes((int)$activity['active_ms'])); ?></strong><span>active lesson time</span></div>
                      <div><strong><?php echo s(pqlpt_focus_step_label((string)$activity['current_step'])); ?></strong><span>last step</span></div>
                      <div><strong><?php echo (int)$activity['idle_count']; ?></strong><span>focus reminders</span></div>
                      <div><strong><?php echo !empty($activity['last_time']) ? userdate((int)$activity['last_time'], get_string('strftimetime')) : 'n/a'; ?></strong><span>last activity</span></div>
                    </div>
                  <?php endif; ?>
                  <div class="pqlpt-mini">
                    <div class="pqlpt-field"><strong>Strengths</strong><p><?php echo s((string)$summary->strengths ?: 'Not added yet.'); ?></p></div>
                    <div class="pqlpt-field"><strong>Needs Practice</strong><p><?php echo s((string)$summary->needs_practice ?: 'Not added yet.'); ?></p></div>
                    <div class="pqlpt-field"><strong>Homework</strong><p><?php echo s((string)$summary->homework ?: 'No homework assigned.'); ?></p></div>
                    <div class="pqlpt-field"><strong>Parent Summary</strong><p><?php echo s((string)$summary->parent_summary ?: 'Not added yet.'); ?></p></div>
                  </div>
                  <div class="pqlpt-actions pqh-workspace-actions" style="margin-top:10px">
                    <?php if ($homeworkurl): ?><a class="pqlpt-btn" href="<?php echo $homeworkurl->out(false); ?>">Open homework</a><?php endif; ?>
                    <?php if ($followupopen): ?><a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_summaries.php', $urlparams, ['childid' => $childid])->out(false); ?>">Respond to follow-up</a><?php endif; ?>
                    <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_summaries.php', $urlparams, ['childid' => $childid])->out(false); ?>">View summary</a>
                  </div>
                </article>
              <?php endforeach; ?>
            <?php endif; ?>
          </section>
        </div>

        <aside>
          <section class="pqlpt-card">
            <h2>Schedule Acknowledgements</h2>
            <?php if (!$seriesrows): ?>
              <div class="pqlpt-empty">No recurring live class series found.</div>
            <?php else: ?>
              <?php foreach ($seriesrows as $series): ?>
                <?php
                  $latestchange = pqlpt_latest_series_change((int)$series->id);
                  $ack = pqlpt_ack_record((int)$series->id, $childid, (int)$USER->id);
                  $current = $ack && (string)$ack->ack_status === 'acknowledged' && (int)$ack->acknowledgedat >= $latestchange;
                ?>
                <article class="pqlpt-item">
                  <div class="pqlpt-row">
                    <div>
                      <h3><?php echo s((string)$series->title); ?></h3>
                      <p class="pqlpt-meta"><?php echo s((string)$series->pattern); ?> - <?php echo s((string)$series->start_time); ?></p>
                    </div>
                    <span class="pqlpt-pill <?php echo $current ? 'pqlpt-pill--ok' : 'pqlpt-pill--warn'; ?>"><?php echo $current ? 'Acknowledged' : 'Schedule change needs acknowledgement'; ?></span>
                  </div>
                  <?php if ($latestchange > 0 && !$current && $canackasparent): ?>
                    <form method="post" class="pqlpt-actions pqh-workspace-actions" style="margin-top:10px">
                      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                      <?php if (!empty($consumercontext->consumerslug)): ?><input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>"><?php endif; ?>
                      <?php if ($workspaceid > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$workspaceid; ?>"><?php endif; ?>
                      <input type="hidden" name="action" value="ack_series_change">
                      <input type="hidden" name="seriesid" value="<?php echo (int)$series->id; ?>">
                      <input type="hidden" name="studentid" value="<?php echo (int)$childid; ?>">
                      <button class="pqlpt-btn" type="submit">Acknowledge change</button>
                      <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_series_schedule.php', $urlparams, ['childid' => $childid])->out(false); ?>">Change history</a>
                    </form>
                  <?php else: ?>
                    <div class="pqlpt-actions pqh-workspace-actions" style="margin-top:10px">
                      <a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_series_schedule.php', $urlparams, ['childid' => $childid])->out(false); ?>">View series</a>
                    </div>
                  <?php endif; ?>
                </article>
              <?php endforeach; ?>
            <?php endif; ?>
          </section>

          <section class="pqlpt-card">
            <h2>Approved Recordings</h2>
            <?php if (!$recordings): ?>
              <div class="pqlpt-empty">No approved recordings are available yet.</div>
            <?php else: ?>
              <?php foreach ($recordings as $recording): ?>
                <article class="pqlpt-item">
                  <h3><?php echo s((string)$recording->session_title); ?></h3>
                  <p class="pqlpt-meta"><?php echo s(userdate((int)$recording->scheduled_start, get_string('strftimedatetimeshort'))); ?><?php echo !empty($recording->expiresat) ? ' - Expires ' . s(userdate((int)$recording->expiresat, get_string('strftimedate'))) : ''; ?></p>
                  <div class="pqlpt-actions pqh-workspace-actions" style="margin-top:10px">
                    <?php if ((string)$recording->playback_url !== ''): ?><a class="pqlpt-btn" href="<?php echo s((string)$recording->playback_url); ?>" target="_blank" rel="noopener noreferrer">Open recording</a><?php endif; ?>
                  </div>
                </article>
              <?php endforeach; ?>
              <div class="pqlpt-actions pqh-workspace-actions" style="margin-top:10px"><a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_recordings.php', $urlparams, ['childid' => $childid])->out(false); ?>">All recordings</a></div>
            <?php endif; ?>
          </section>

          <section class="pqlpt-card">
            <h2>Safety & Trust</h2>
            <div class="pqlpt-field"><strong>Parent-visible only</strong><p>Private teacher notes are not shown on parent pages.</p></div>
            <div class="pqlpt-field" style="margin-top:10px"><strong>Reviewed recordings</strong><p>Only recordings published for parents are listed here.</p></div>
            <div class="pqlpt-actions pqh-workspace-actions" style="margin-top:12px"><a class="pqlpt-btn pqlpt-btn--light" href="<?php echo pqlpt_url('/local/hubredirect/live_trust.php', $urlparams, ['childid' => $childid])->out(false); ?>">Trust center</a></div>
          </section>
        </aside>
      </div>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
