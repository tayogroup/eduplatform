<?php
// Live-sessions function library — extracted VERBATIM from live_sessions.php
// (renamed pql_ -> pqlsesl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php and user/profile/lib.php loaded
// first. pqlsesl_visible_sessions() reads the page global $pageworkspaceid —
// the portal handler assigns it at file top level before calling.

defined('MOODLE_INTERNAL') || die();

function pqlsesl_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

function pqlsesl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlsesl_live_tables_ready(): bool {
    return pqlsesl_table_exists('local_prequran_live_session')
        && pqlsesl_table_exists('local_prequran_live_participant')
        && pqlsesl_table_exists('local_prequran_live_audit');
}

function pqlsesl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlsesl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlsesl_valid_timezone(string $timezone): string {
    $timezone = trim($timezone);
    if ($timezone === '') {
        return 'Africa/Nairobi';
    }
    try {
        new DateTimeZone($timezone);
        return $timezone;
    } catch (Throwable $e) {
        return 'Africa/Nairobi';
    }
}

function pqlsesl_default_schedule_timezone(): string {
    $timezone = trim((string)get_config('local_prequran', 'live_schedule_timezone'));
    return pqlsesl_valid_timezone($timezone !== '' ? $timezone : 'Africa/Nairobi');
}

function pqlsesl_private_teacher_recording_default(stdClass $consumercontext, int $workspaceid): bool {
    global $DB;

    $consumertype = strtolower(trim((string)($consumercontext->consumer_type ?? '')));
    if (in_array($consumertype, ['marketplace', 'teacher_workspace'], true)) {
        return true;
    }

    if ($workspaceid > 0 && pqlsesl_table_exists('local_prequran_workspace')) {
        $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], 'id,workspace_type,plan_code', IGNORE_MISSING);
        if ($workspace) {
            $workspacetype = strtolower(trim((string)($workspace->workspace_type ?? '')));
            $plancode = strtolower(trim((string)($workspace->plan_code ?? '')));
            return $workspacetype === 'solo_teacher'
                || strpos($plancode, 'teacher') !== false
                || strpos($plancode, 'marketplace') !== false;
        }
    }

    return false;
}

function pqlsesl_workspace_record(int $workspaceid): ?stdClass {
    global $DB;
    if ($workspaceid <= 0 || !pqlsesl_table_exists('local_prequran_workspace')) {
        return null;
    }
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
    return $workspace ?: null;
}

function pqlsesl_is_independent_workspace(int $workspaceid): bool {
    $workspace = pqlsesl_workspace_record($workspaceid);
    if (!$workspace) {
        return false;
    }
    $workspacetype = strtolower(trim((string)($workspace->workspace_type ?? '')));
    $plancode = strtolower(trim((string)($workspace->plan_code ?? '')));
    return $workspacetype === 'solo_teacher'
        || strpos($plancode, 'solo_teacher') !== false
        || strpos($plancode, 'independent') !== false;
}

function pqlsesl_active_teacher_profile_rows(int $userid): array {
    global $DB;
    if ($userid <= 0 || !pqlsesl_table_exists('local_prequran_teacher_profile')) {
        return [];
    }
    $where = 'userid = ?';
    $params = [$userid];
    if (pqlsesl_column_exists('local_prequran_teacher_profile', 'status')) {
        $where .= ' AND (status IS NULL OR LOWER(status) NOT IN (?, ?, ?))';
        $params[] = 'archived';
        $params[] = 'inactive';
        $params[] = 'rejected';
    }
    return $DB->get_records_select(
        'local_prequran_teacher_profile',
        $where,
        $params,
        pqlsesl_column_exists('local_prequran_teacher_profile', 'timemodified') ? 'timemodified DESC, id DESC' : 'id DESC',
        '*'
    );
}

function pqlsesl_normalized_teacher_work_models(string $value): array {
    $rawparts = [];
    $decoded = json_decode($value, true);
    if (is_array($decoded)) {
        $rawparts = array_values($decoded);
    } else {
        $rawparts = preg_split('/[,|;]/', $value, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    }
    $aliases = [
        'independent_teacher' => 'independent_teacher',
        'independent teacher' => 'independent_teacher',
        'independent teacher/tutor' => 'independent_teacher',
        'private/internal teacher only' => 'independent_teacher',
        'school_teacher' => 'independent_teacher',
        'teach for one school' => 'independent_teacher',
        'multi_school_teacher' => 'independent_teacher',
        'teach for multiple schools' => 'independent_teacher',
        'marketplace_teacher' => 'marketplace_teacher',
        'marketplace teacher/tutor' => 'marketplace_teacher',
        'marketplace_tutor' => 'marketplace_teacher',
        'public marketplace tutor' => 'marketplace_teacher',
    ];
    $models = [];
    foreach ($rawparts as $part) {
        $key = strtolower(trim((string)$part, " \t\n\r\0\x0B\"'[]"));
        if ($key !== '' && isset($aliases[$key]) && !in_array($aliases[$key], $models, true)) {
            $models[] = $aliases[$key];
        }
    }
    return $models;
}

function pqlsesl_has_independent_teacher_profile_record(int $userid): bool {
    if (pqh_has_independent_teacher_profile($userid)) {
        return true;
    }
    if (!pqlsesl_column_exists('local_prequran_teacher_profile', 'teacher_work_models')) {
        return false;
    }
    foreach (pqlsesl_active_teacher_profile_rows($userid) as $row) {
        $models = pqlsesl_normalized_teacher_work_models((string)($row->teacher_work_models ?? ''));
        if (in_array('independent_teacher', $models, true)) {
            return true;
        }
    }
    return false;
}

function pqlsesl_live_teacher_workspace_ids(int $userid): array {
    global $DB;
    if ($userid <= 0) {
        return [];
    }
    $ids = [];
    foreach (pqh_independent_teacher_workspace_ids($userid) as $workspaceid) {
        $workspaceid = (int)$workspaceid;
        if ($workspaceid > 0) {
            $ids[$workspaceid] = $workspaceid;
        }
    }
    if (pqlsesl_has_independent_teacher_profile_record($userid)
            && pqlsesl_column_exists('local_prequran_teacher_profile', 'workspaceid')) {
        foreach (pqlsesl_active_teacher_profile_rows($userid) as $row) {
            $workspaceid = (int)($row->workspaceid ?? 0);
            if ($workspaceid > 0 && pqh_consumer_context_allows_workspace(null, $workspaceid)) {
                $ids[$workspaceid] = $workspaceid;
            }
        }
    }
    if (pqlsesl_table_exists('local_prequran_workspace_member')
            && pqlsesl_column_exists('local_prequran_workspace_member', 'workspace_role')) {
        $rows = $DB->get_records_select(
            'local_prequran_workspace_member',
            'userid = ? AND status = ?',
            [$userid, 'active'],
            '',
            'id, workspaceid, workspace_role'
        );
        foreach ($rows as $row) {
            $role = strtolower(trim((string)($row->workspace_role ?? '')));
            $workspaceid = (int)($row->workspaceid ?? 0);
            if ($workspaceid > 0 && in_array($role, ['owner', 'admin', 'teacher', 'assistant_teacher'], true)
                    && pqh_consumer_context_allows_workspace(null, $workspaceid)) {
                $ids[$workspaceid] = $workspaceid;
            }
        }
    }
    return array_values($ids);
}

function pqlsesl_user_can_teach_live_workspace(int $userid, int $workspaceid): bool {
    if ($workspaceid <= 0) {
        return false;
    }
    if (pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
        return true;
    }
    return in_array($workspaceid, pqlsesl_live_teacher_workspace_ids($userid), true);
}

function pqlsesl_session_status_label(string $status): string {
    $labels = [
        'pending_institution_approval' => 'Pending institution approval',
        'pending_marketplace_approval' => 'Pending marketplace approval',
        'scheduled' => 'Scheduled',
        'live' => 'Live',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled',
        'failed' => 'Failed',
        'rejected' => 'Rejected',
    ];
    return $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

function pqlsesl_session_requires_approval($session): bool {
    return in_array((string)($session->status ?? ''), ['pending_institution_approval', 'pending_marketplace_approval'], true);
}

function pqlsesl_can_create_live_session(int $userid, int $workspaceid): bool {
    if (is_siteadmin($userid) || pqh_can_manage_academy_operations($userid)) {
        return true;
    }
    $isindependentteacher = pqlsesl_has_independent_teacher_profile_record($userid);
    if ($isindependentteacher) {
        return true;
    }
    // A teaching role in the workspace outranks the managed-student veto:
    // custom profile fields can default to yes for every account, which
    // would otherwise misclassify institution teachers as students.
    if ($workspaceid > 0 && pqlsesl_user_can_teach_live_workspace($userid, $workspaceid)) {
        return true;
    }
    if (pqlsesl_is_managed_student($userid)) {
        return false;
    }
    if ($workspaceid > 0) {
        return false;
    }
    return pqh_user_can_create_live_sessions($userid, $workspaceid) || pqlsesl_is_teacher($userid);
}

function pqlsesl_can_approve_live_session(int $userid, int $workspaceid): bool {
    if (is_siteadmin($userid) || pqh_can_manage_academy_operations($userid)) {
        return true;
    }
    if ($workspaceid <= 0 || pqlsesl_is_independent_workspace($workspaceid)) {
        return false;
    }
    return pqh_user_can_manage_workspace($userid, $workspaceid);
}

function pqlsesl_workspace_setting_enabled(int $workspaceid, string $key): bool {
    global $DB;
    if ($workspaceid <= 0
            || !pqh_table_exists_safe('local_prequran_workspace')
            || !pqh_table_has_field_safe('local_prequran_workspace', 'settingsjson')) {
        return false;
    }
    try {
        $json = (string)$DB->get_field('local_prequran_workspace', 'settingsjson', ['id' => $workspaceid], IGNORE_MISSING);
    } catch (Throwable $e) {
        return false;
    }
    if (trim($json) === '') {
        return false;
    }
    $settings = json_decode($json, true);
    return is_array($settings) && !empty($settings[$key]);
}

function pqlsesl_created_session_status(int $creatorid, int $teacherid, int $workspaceid): string {
    // Platform-wide policy (2026-07-17): teacher-created sessions publish
    // immediately on every consumer type - marketplace, independent, and
    // institution - identical to admin-created sessions. The approval
    // statuses remain supported for existing records and future policy
    // changes, but nothing new is created in a pending state.
    return 'scheduled';
}

function pqlsesl_parse_local_datetime(string $date, string $time, string $timezone): int {
    $timezone = pqlsesl_valid_timezone($timezone);
    $value = trim($date) . ' ' . trim($time);
    try {
        $dt = DateTimeImmutable::createFromFormat('!Y-m-d H:i', $value, new DateTimeZone($timezone));
        if (!$dt) {
            return 0;
        }
        return $dt->getTimestamp();
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlsesl_format_session_datetime(int $timestamp, string $timezone): string {
    $timezone = pqlsesl_valid_timezone($timezone);
    try {
        $dt = (new DateTimeImmutable('@' . $timestamp))->setTimezone(new DateTimeZone($timezone));
        return $dt->format('d/m/y, H:i');
    } catch (Throwable $e) {
        return userdate($timestamp, get_string('strftimedatetimeshort'), $timezone);
    }
}

function pqlsesl_series_ready(): bool {
    return pqlsesl_table_exists('local_prequran_live_series')
        && pqlsesl_column_exists('local_prequran_live_session', 'seriesid')
        && pqlsesl_column_exists('local_prequran_live_session', 'series_sequence');
}

function pqlsesl_is_managed_student(int $userid): bool {
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

function pqlsesl_is_teacher(int $userid): bool {
    global $DB;
    if (is_siteadmin($userid)) {
        return true;
    }
    if (pqlsesl_has_independent_teacher_profile_record($userid) || pqlsesl_live_teacher_workspace_ids($userid)) {
        return true;
    }
    if (pqlsesl_table_exists('local_prequran_teacher_student')
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

function pqlsesl_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    $explicit = false;

    if (pqlsesl_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records_sql(
            "SELECT studentid, MAX(cohortid) AS cohortid
               FROM {local_prequran_teacher_student}
              WHERE teacherid = :teacherid
                AND status = :status
           GROUP BY studentid",
            ['teacherid' => $teacherid, 'status' => 'active']
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $explicit = true;
                $students[$studentid] = ['studentid' => $studentid, 'cohortid' => (int)$row->cohortid];
            }
        }
    }

    if (pqlsesl_table_exists('local_prequran_workspace_member')) {
        foreach (pqlsesl_live_teacher_workspace_ids($teacherid) as $workspaceid) {
            $rows = $DB->get_records('local_prequran_workspace_member', [
                'workspaceid' => $workspaceid,
                'workspace_role' => 'student',
                'status' => 'active',
            ], '', 'id, userid');
            foreach ($rows as $row) {
                $studentid = (int)$row->userid;
                if ($studentid > 0 && $studentid !== $teacherid) {
                    $explicit = true;
                    $students[$studentid] = ['studentid' => $studentid, 'cohortid' => 0];
                }
            }
        }
    }

    if (!$explicit) {
        $teachercohorts = $DB->get_records('cohort_members', ['userid' => $teacherid], '', 'id, cohortid');
        foreach ($teachercohorts as $membership) {
            $cohortid = (int)$membership->cohortid;
            if ($cohortid <= 0) {
                continue;
            }
            $members = $DB->get_records('cohort_members', ['cohortid' => $cohortid], '', 'userid, cohortid');
            foreach ($members as $member) {
                $studentid = (int)$member->userid;
                if ($studentid > 0 && $studentid !== $teacherid && pqlsesl_is_managed_student($studentid)) {
                    $students[$studentid] = ['studentid' => $studentid, 'cohortid' => $cohortid];
                }
            }
        }
    }

    foreach ($students as $studentid => $student) {
        $user = core_user::get_user($studentid);
        $students[$studentid]['name'] = $user ? fullname($user) : 'Student ' . $studentid;
        if (empty($students[$studentid]['cohortid'])) {
            $cohortid = $DB->get_field_sql(
                "SELECT cohortid FROM {cohort_members} WHERE userid = ? ORDER BY id DESC",
                [$studentid],
                IGNORE_MULTIPLE
            );
            $students[$studentid]['cohortid'] = $cohortid ? (int)$cohortid : 0;
        }
    }

    uasort($students, function($a, $b) {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return array_values($students);
}

function pqlsesl_user_can_view_session($session): bool {
    global $DB, $USER;
    if (is_siteadmin($USER)) {
        return true;
    }
    if ((int)$session->teacherid === (int)$USER->id) {
        return true;
    }
    return $DB->record_exists('local_prequran_live_participant', [
        'sessionid' => (int)$session->id,
        'userid' => (int)$USER->id,
        'status' => 'active',
    ]);
}

function pqlsesl_agenda_slides_ready(): bool {
    return pqlsesl_column_exists('local_prequran_live_session', 'agenda_slides_path')
        && pqlsesl_column_exists('local_prequran_live_session', 'agenda_slides_filename');
}

function pqlsesl_agenda_slides_controls($session, string $returnurl): string {
    if (!pqlsesl_agenda_slides_ready()) {
        return '';
    }
    $sessionid = (int)$session->id;
    $html = html_writer::start_div('pql-agenda');
    if (trim((string)($session->agenda_slides_path ?? '')) !== '') {
        $filename = trim((string)($session->agenda_slides_filename ?? 'Agenda slides'));
        $html .= html_writer::link(
            pqh_live_session_agenda_file_url($sessionid),
            'Open agenda slides',
            ['class' => 'pql-btn pql-btn--light']
        );
        $html .= html_writer::link(
            pqh_live_session_agenda_editor_url($sessionid),
            'Edit online',
            ['class' => 'pql-btn pql-btn--light']
        );
        $html .= html_writer::link(
            pqh_live_session_materials_url($sessionid),
            'Teacher Materials',
            ['class' => 'pql-btn pql-btn--light', 'target' => '_blank', 'rel' => 'noopener']
        );
        $html .= html_writer::span('Attached: ' . s($filename), 'pql-agenda__status');
    } else {
        $html .= html_writer::span('No completed agenda slides attached yet.', 'pql-agenda__status');
        $html .= html_writer::link(
            pqh_live_session_agenda_editor_url($sessionid),
            'Create and edit online',
            ['class' => 'pql-btn pql-btn--light']
        );
        $html .= html_writer::link(
            pqh_live_session_materials_url($sessionid),
            'Teacher Materials',
            ['class' => 'pql-btn pql-btn--light', 'target' => '_blank', 'rel' => 'noopener']
        );
    }
    $html .= html_writer::start_tag('form', [
        'method' => 'post',
        'action' => pqh_live_session_agenda_upload_url($sessionid)->out(false),
        'enctype' => 'multipart/form-data',
        'class' => 'pql-agenda__form',
    ]);
    $html .= html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]);
    $html .= html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'return', 'value' => $returnurl]);
    $html .= html_writer::empty_tag('input', [
        'type' => 'file',
        'name' => 'agenda_file',
        'accept' => '.ppt,.pptx,.pdf',
        'required' => 'required',
        'class' => 'pql-agenda__file',
    ]);
    $html .= html_writer::tag('button', 'Attach agenda slides', ['class' => 'pql-btn pql-btn--light', 'type' => 'submit']);
    $html .= html_writer::end_tag('form');
    $html .= html_writer::end_div();
    return $html;
}

function pqlsesl_bbb_password($session, string $role): string {
    $secret = trim((string)get_config('local_prequran', 'bbb_shared_secret'));
    if ($secret === '') {
        return '';
    }
    return substr(sha1('prequran-live|' . (int)$session->id . '|' . (string)$session->bbb_meeting_id . '|' . $role . '|' . $secret), 0, 24);
}

function pqlsesl_bbb_is_configured(): bool {
    return trim((string)get_config('local_prequran', 'bbb_shared_secret')) !== '';
}

function pqlsesl_live_tutor_url($session, int $studentid = 0, bool $floating = true): moodle_url {
    $params = [
        'sessionid' => (int)$session->id,
        'embed' => 1,
        'panel' => 1,
        'frombbb' => 1,
    ];
    $context = pqh_requested_consumer_context();
    if (!empty($context->consumerslug)) {
        $params['consumer'] = (string)$context->consumerslug;
    }
    if ($floating) {
        $params['floating'] = 1;
    }
    if ($studentid > 0) {
        $params['studentid'] = $studentid;
    }
    if (!empty($session->workspaceid)) {
        $params['workspaceid'] = (int)$session->workspaceid;
    }
    return pqlsesl_url('/local/hubredirect/live_virtual_tutor.php', [], $params);
}

function pqlsesl_live_tutor_studentid($session, $participant): int {
    global $DB;
    if ($participant && (int)($participant->studentid ?? 0) > 0) {
        return (int)$participant->studentid;
    }
    if ($participant && (string)($participant->role ?? '') === 'student') {
        return (int)$participant->userid;
    }
    if (!pqlsesl_table_exists('local_prequran_live_participant')) {
        return 0;
    }
    $studentid = $DB->get_field_select(
        'local_prequran_live_participant',
        'studentid',
        'sessionid = ? AND status = ? AND role = ? AND studentid > 0',
        [(int)$session->id, 'active', 'student'],
        IGNORE_MULTIPLE
    );
    return $studentid ? (int)$studentid : 0;
}

function pqlsesl_live_launch_bridge(string $joinurl, moodle_url $tutorurl, moodle_url $lessonurl, $session, ?moodle_url $materialsurl = null, string $role = '', ?moodle_url $exiturl = null, ?moodle_url $directjoinurl = null): void {
    global $OUTPUT, $PAGE;

    $PAGE->set_pagelayout('embedded');
    $PAGE->set_title('Opening live session');
    $PAGE->set_heading('Opening live session');

    $joinurljson = json_encode($joinurl);
    $tutorurljson = json_encode($tutorurl->out(false));
    $lessonurljson = json_encode($lessonurl->out(false));
    $materialsurljson = json_encode($materialsurl ? $materialsurl->out(false) : '');
    $openmaterials = $materialsurl && in_array($role, ['teacher', 'admin_observer'], true);
    $openmaterialsjson = json_encode($openmaterials);
    $exiturljson = json_encode($exiturl ? $exiturl->out(false) : '');
    $directjoinurljson = json_encode($directjoinurl ? $directjoinurl->out(false) : '');
    $sessiontitle = s((string)$session->title);

    echo $OUTPUT->header();
    ?>
<style>
html,body{min-height:100%;background:#f4f6f9!important}
body{margin:0!important}
body.pqh-live-page header,
body.pqh-live-page footer,
body.pqh-live-page nav.navbar,
body.pqh-live-page #page-header,
body.pqh-live-page #page-footer,
body.pqh-live-page .drawer,
body.pqh-live-page .drawer-toggles,
body.pqh-live-page .secondary-navigation{display:none!important}
.pql-bridge{min-height:100vh;display:none;place-items:center;padding:24px;color:#0f2237;font-family:inherit}
.pql-bridge.is-visible{display:grid}
.pql-bridge__card{width:min(560px,100%);padding:24px;border:1px solid #e4e9ef;border-radius:14px;background:#fff;box-shadow:0 24px 70px rgba(23,48,68,.14)}
.pql-bridge__card h1{margin:0 0 8px;color:#0f2237;font-size:28px;line-height:1.1;font-weight:950;letter-spacing:0}
.pql-bridge__card p{margin:0 0 18px;color:#5b6b7c;font-size:15px;font-weight:800}
.pql-bridge__actions{display:flex;flex-wrap:wrap;gap:10px}
.pql-bridge__btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:10px;border:1px solid rgba(33,102,209,.25);background:#2166d1;color:#fff!important;text-decoration:none!important;font-size:14px;font-weight:950;cursor:pointer}
.pql-bridge__btn--light{background:#edf3fc;color:#17498f!important}
.pql-split{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;background:#10202e}
.pql-split[hidden]{display:none}
.pql-split__bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 12px;background:#173044;color:#fff}
.pql-split__title{font-size:13px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pql-split__actions{display:flex;gap:7px;flex-wrap:wrap}
.pql-split__btn{display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:0 11px;border-radius:8px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.1);color:#fff!important;font-size:12px;font-weight:900;cursor:pointer;text-decoration:none!important}
.pql-split__btn:hover{background:rgba(255,255,255,.22)}
.pql-split__body{flex:1;display:flex;min-height:0}
.pql-split__class{flex:1;min-width:0;height:100%;border:0;background:#10202e}
.pql-split__materials{width:min(420px,38vw);height:100%;border:0;border-left:1px solid rgba(255,255,255,.18);background:#fff}
.pql-split--nomat .pql-split__materials{display:none}
</style>
<main class="pql-bridge">
  <section class="pql-bridge__card">
    <h1><?php echo $sessiontitle; ?></h1>
    <p id="pql-bridge-status">Opening the live classroom now. If your browser blocks the materials helper, use the buttons below.</p>
    <div class="pql-bridge__actions">
      <?php if ($openmaterials): ?><button id="pql-open-class-materials" class="pql-bridge__btn" type="button">Open Class + Materials</button><?php endif; ?>
      <button id="pql-open-tools" class="pql-bridge__btn pql-bridge__btn--light" type="button">Open Tutor + Materials</button>
      <?php if ($materialsurl): ?><a id="pql-open-materials" class="pql-bridge__btn pql-bridge__btn--light" target="_blank" rel="noopener" href="<?php echo $materialsurl->out(false); ?>">Open Teacher Materials</a><?php endif; ?>
      <button id="pql-open-class" class="pql-bridge__btn<?php echo $openmaterials ? ' pql-bridge__btn--light' : ''; ?>" type="button">Continue to Class</button>
    </div>
  </section>
</main>
<?php if ($openmaterials): ?>
<div class="pql-split" id="pql-split" hidden>
  <div class="pql-split__bar">
    <span class="pql-split__title"><?php echo $sessiontitle; ?></span>
    <div class="pql-split__actions">
      <button id="pql-split-toggle" class="pql-split__btn" type="button">Show materials</button>
      <button id="pql-split-tutor" class="pql-split__btn" type="button">Virtual tutor</button>
      <button id="pql-split-fullscreen" class="pql-split__btn" type="button">Fullscreen</button>
      <?php if ($exiturl): ?><a id="pql-split-exit" class="pql-split__btn" href="<?php echo $exiturl->out(false); ?>">Exit</a><?php endif; ?>
    </div>
  </div>
  <div class="pql-split__body">
    <iframe id="pql-split-class" class="pql-split__class" title="Live classroom" allow="camera *; microphone *; display-capture *; autoplay *; fullscreen *; speaker-selection *" allowfullscreen></iframe>
    <iframe id="pql-split-materials" class="pql-split__materials" title="Teacher Materials"></iframe>
  </div>
</div>
<?php endif; ?>
<script>
(function(){
  var joinUrl = <?php echo $joinurljson; ?>;
  var tutorUrl = <?php echo $tutorurljson; ?>;
  var materialsUrl = <?php echo $materialsurljson; ?>;
  var shouldOpenMaterials = <?php echo $openmaterialsjson; ?>;
  var exitUrl = <?php echo $exiturljson; ?>;
  var directJoinUrl = <?php echo $directjoinurljson; ?>;
  var closeKey = 'pqa_live_session_closed_<?php echo (int)$session->id; ?>';
  var splitActive = false;
  var popupName = 'pqa_virtual_tutor_<?php echo (int)$session->id; ?>';
  var materialsPopupName = 'pqa_quraan_materials_<?php echo (int)$session->id; ?>';

  function addParam(url, name, value) {
    if (!url) {
      return '';
    }
    var separator = url.indexOf('?') === -1 ? '?' : '&';
    return url + separator + encodeURIComponent(name) + '=' + encodeURIComponent(value);
  }

  function parkedFeatures(index) {
    var screenWidth = window.screen && window.screen.availWidth ? window.screen.availWidth : 1280;
    var screenHeight = window.screen && window.screen.availHeight ? window.screen.availHeight : 820;
    var width = 320;
    var height = 220;
    var left = Math.max(0, screenWidth - width - 18);
    var top = Math.min(Math.max(0, screenHeight - height - 18), 24 + (index * 58));
    return 'popup=yes,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes';
  }

  function materialsFeatures() {
    var screenWidth = window.screen && window.screen.availWidth ? window.screen.availWidth : 1280;
    var screenHeight = window.screen && window.screen.availHeight ? window.screen.availHeight : 820;
    var width = Math.min(520, Math.max(380, Math.floor(screenWidth * 0.28)));
    var height = Math.min(760, Math.max(560, screenHeight - 120));
    var left = Math.max(0, screenWidth - width - 24);
    var top = 40;
    return 'popup=yes,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes';
  }

  function openTutor() {
    var popup = window.open('about:blank', popupName, parkedFeatures(0));
    if (popup) {
      try {
        popup.opener = null;
      } catch (e) {}
      try {
        popup.location.replace(tutorUrl);
      } catch (e) {
        popup.location.href = tutorUrl;
      }
      window.focus();
    }
    return !!popup;
  }

  function openMaterials() {
    if (!materialsUrl || !shouldOpenMaterials) {
      return false;
    }
    var popup = window.open(addParam(materialsUrl, 'compact', '1'), materialsPopupName, materialsFeatures());
    if (popup) {
      try {
        popup.blur();
      } catch (e) {}
      try {
        window.focus();
      } catch (e) {}
      return true;
    }
    return false;
  }

  function openParkedTools() {
    openTutor();
    openMaterials();
  }

  function openClass() {
    window.location.replace(joinUrl);
  }

  function openClassWithMaterials() {
    openMaterials();
    window.setTimeout(openClass, 250);
  }

  function ensureCompact(url) {
    return url.indexOf('compact=1') === -1 ? addParam(url, 'compact', '1') : url;
  }

  function renderSplit() {
    var split = document.getElementById('pql-split');
    if (!split) {
      return false;
    }
    try {
      window.localStorage.removeItem(closeKey);
    } catch (e) {}
    split.hidden = false;
    // Start with the classroom at full width; the toggle reveals materials.
    split.classList.add('pql-split--nomat');
    splitActive = true;
    var classFrame = document.getElementById('pql-split-class');
    var materialsFrame = document.getElementById('pql-split-materials');
    if (classFrame && !classFrame.src) {
      // Prefer the server round-trip: every load of the frame then gets its
      // own fresh BBB join URL instead of reusing the one baked into this page.
      classFrame.src = directJoinUrl || joinUrl;
    }
    if (materialsFrame && materialsUrl && !materialsFrame.src) {
      materialsFrame.src = ensureCompact(materialsUrl);
    }
    var toggleButton = document.getElementById('pql-split-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', function(){
        var hidden = split.classList.toggle('pql-split--nomat');
        toggleButton.textContent = hidden ? 'Show materials' : 'Hide materials';
      });
    }
    var tutorSplitButton = document.getElementById('pql-split-tutor');
    if (tutorSplitButton) {
      tutorSplitButton.addEventListener('click', openTutor);
    }
    var fullscreenButton = document.getElementById('pql-split-fullscreen');
    function enterFullscreen() {
      var target = document.documentElement;
      var request = target.requestFullscreen || target.webkitRequestFullscreen;
      if (request && !document.fullscreenElement) {
        try {
          var result = request.call(target);
          if (result && typeof result.catch === 'function') {
            result.catch(function(){});
          }
        } catch (e) {}
      }
    }
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', function(){
        if (document.fullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        } else {
          enterFullscreen();
        }
      });
      document.addEventListener('fullscreenchange', function(){
        fullscreenButton.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
      });
    }
    // Browsers only honour fullscreen from a user gesture. Launching from the
    // Start class click sometimes carries over; when it does not, the first
    // click on the top bar (or the Fullscreen button) completes it.
    enterFullscreen();
    var bar = split.querySelector('.pql-split__bar');
    if (bar) {
      bar.addEventListener('click', function once(){
        bar.removeEventListener('click', once);
        enterFullscreen();
      });
    }
    // When the class is ended, the closed page stamps localStorage; leave
    // the split view and return to the live sessions list automatically.
    window.setInterval(function(){
      var value = 0;
      try {
        value = parseInt(window.localStorage.getItem(closeKey) || '0', 10);
      } catch (e) {}
      if (value > 0 && exitUrl) {
        window.location.replace(exitUrl);
      }
    }, 1500);
    return true;
  }

  var tutorButton = document.getElementById('pql-open-tutor');
  var toolsButton = document.getElementById('pql-open-tools');
  var materialsButton = document.getElementById('pql-open-materials');
  var classButton = document.getElementById('pql-open-class');
  var classMaterialsButton = document.getElementById('pql-open-class-materials');
  var status = document.getElementById('pql-bridge-status');
  if (tutorButton) {
    tutorButton.addEventListener('click', openTutor);
  }
  if (materialsButton) {
    materialsButton.addEventListener('click', function(event){
      event.preventDefault();
      openMaterials();
    });
  }
  if (toolsButton) {
    toolsButton.addEventListener('click', openParkedTools);
  }
  if (classButton) {
    classButton.addEventListener('click', function(){
      openClass();
    });
  }
  if (classMaterialsButton) {
    classMaterialsButton.addEventListener('click', openClassWithMaterials);
  }

  function showFallback() {
    if (splitActive) {
      return;
    }
    var bridge = document.querySelector('.pql-bridge');
    if (bridge) {
      bridge.classList.add('is-visible');
    }
    if (status) {
      status.textContent = shouldOpenMaterials
        ? 'The live classroom should be opening. If Teacher Materials did not open, use Open Class + Materials.'
        : 'The live classroom should be opening. If it did not open, use Continue to Class.';
    }
  }

  function launchLiveSession() {
    if (shouldOpenMaterials && renderSplit()) {
      return;
    }
    if (shouldOpenMaterials) {
      openMaterials();
    }
    window.setTimeout(function(){
      openClass();
    }, shouldOpenMaterials ? 300 : 120);
  }

  window.setTimeout(showFallback, 1800);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', launchLiveSession);
  } else {
    launchLiveSession();
  }
})();
</script>
    <?php
    echo $OUTPUT->footer();
    exit;
}

function pqlsesl_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlsesl_table_exists('local_prequran_live_audit')) {
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

function pqlsesl_live_closed_page(int $sessionid, moodle_url $fallbackurl): void {
    global $OUTPUT, $PAGE;

    $PAGE->set_pagelayout('embedded');
    $PAGE->set_title('Live session closed');
    $PAGE->set_heading('Live session closed');

    $sessionidjson = json_encode((string)$sessionid);
    $fallbackjson = json_encode($fallbackurl->out(false));
    echo $OUTPUT->header();
    ?>
<style>
html,body{min-height:100%;background:#f4f6f9!important}
body{margin:0!important}
body.pqh-live-page header,
body.pqh-live-page footer,
body.pqh-live-page nav.navbar,
body.pqh-live-page #page-header,
body.pqh-live-page #page-footer,
body.pqh-live-page .drawer,
body.pqh-live-page .drawer-toggles,
body.pqh-live-page .secondary-navigation{display:none!important}
.pql-closed{min-height:100vh;display:grid;place-items:center;padding:24px;color:#0f2237;font-family:inherit}
.pql-closed__card{width:min(520px,100%);padding:24px;border:1px solid #e4e9ef;border-radius:14px;background:#fff;box-shadow:0 24px 70px rgba(23,48,68,.14)}
.pql-closed__card h1{margin:0 0 8px;color:#0f2237;font-size:26px;line-height:1.1;font-weight:950;letter-spacing:0}
.pql-closed__card p{margin:0;color:#5b6b7c;font-size:15px;font-weight:800}
</style>
<main class="pql-closed">
  <section class="pql-closed__card">
    <h1>Live session closed</h1>
    <p>Closing Teacher Materials and returning you to your workspace.</p>
  </section>
</main>
<script>
(function(){
  var sessionId = <?php echo $sessionidjson; ?>;
  var fallbackUrl = <?php echo $fallbackjson; ?>;
  try {
    window.localStorage.setItem('pqa_live_session_closed_' + sessionId, String(Date.now()));
  } catch (e) {}
  window.setTimeout(function(){
    try {
      window.close();
    } catch (e) {}
  }, 250);
  window.setTimeout(function(){
    if (!window.closed && fallbackUrl) {
      window.location.replace(fallbackUrl);
    }
  }, 900);
})();
</script>
    <?php
    echo $OUTPUT->footer();
    exit;
}

function pqlsesl_add_query_param(string $url, string $name, string $value): string {
    if ($url === '') {
        return '';
    }
    $separator = strpos($url, '?') === false ? '?' : '&';
    return $url . $separator . rawurlencode($name) . '=' . rawurlencode($value);
}

function pqlsesl_agenda_slides_public_document_url($session): string {
    $url = pqh_live_session_agenda_public_url($session);
    if ($url === '') {
        return '';
    }
    $version = max((int)($session->agenda_slides_uploadedat ?? 0), (int)($session->timemodified ?? 0), 1);
    return pqlsesl_add_query_param($url, 'v', (string)$version);
}

function pqlsesl_insert_agenda_slides_into_bbb($session, string $source): void {
    if (empty($session->bbb_meeting_id) || empty($session->agenda_slides_path)) {
        return;
    }
    if (!function_exists('local_prequran_bbb_insert_document')) {
        pqlsesl_audit((int)$session->id, 'agenda_slides_bbb_insert_failed', 'session', (int)$session->id, [
            'source' => $source,
            'error' => 'BBB insertDocument helper is unavailable.',
        ]);
        return;
    }
    $documenturl = pqlsesl_agenda_slides_public_document_url($session);
    $filename = clean_filename((string)($session->agenda_slides_filename ?? 'Live Session Agenda template.pptx'));
    if ($filename === '') {
        $filename = 'Live Session Agenda template.pptx';
    }
    if ($documenturl === '') {
        pqlsesl_audit((int)$session->id, 'agenda_slides_bbb_insert_failed', 'session', (int)$session->id, [
            'source' => $source,
            'error' => 'Agenda public URL is empty.',
            'bunny_path' => trim((string)($session->agenda_slides_path ?? '')),
        ]);
        return;
    }
    try {
        local_prequran_bbb_insert_document((string)$session->bbb_meeting_id, $documenturl, $filename, true, false, false, [
            'fitToWidth' => 'true',
            'fitToPage' => 'true',
        ]);
        pqlsesl_audit((int)$session->id, 'agenda_slides_bbb_inserted', 'session', (int)$session->id, [
            'source' => $source,
            'document_source' => 'agenda_public_url',
            'filename' => $filename,
            'url' => $documenturl,
        ]);
    } catch (Throwable $e) {
        pqlsesl_audit((int)$session->id, 'agenda_slides_bbb_insert_failed', 'session', (int)$session->id, [
            'source' => $source,
            'filename' => $filename,
            'url' => $documenturl,
            'error' => $e->getMessage(),
        ]);
    }
}

function pqlsesl_generate_recurring_starts(int $firststart, string $pattern, array $weekdays, int $until, int $count): array {
    $starts = [];
    $count = max(1, min(60, $count));
    $until = $until > 0 ? $until : $firststart;
    if ($pattern === 'none') {
        return [$firststart];
    }
    if ($pattern === 'daily') {
        $cursor = $firststart;
        while (count($starts) < $count && $cursor <= $until) {
            $starts[] = $cursor;
            $cursor += DAYSECS;
        }
        return $starts;
    }
    if ($pattern === 'weekly') {
        $cursor = $firststart;
        while (count($starts) < $count && $cursor <= $until) {
            $starts[] = $cursor;
            $cursor += WEEKSECS;
        }
        return $starts;
    }
    if ($pattern === 'weekdays') {
        $weekdays = array_values(array_unique(array_filter(array_map('intval', $weekdays), function($day) {
            return $day >= 0 && $day <= 6;
        })));
        if (!$weekdays) {
            $weekdays = [(int)date('w', $firststart)];
        }
        $cursor = $firststart;
        while (count($starts) < $count && $cursor <= $until) {
            if (in_array((int)date('w', $cursor), $weekdays, true)) {
                $starts[] = $cursor;
            }
            $cursor += DAYSECS;
        }
        return $starts;
    }
    return [$firststart];
}

function pqlsesl_teacher_availability_conflicts(int $teacherid, array $starts, int $duration): array {
    global $DB;
    if (!pqlsesl_table_exists('local_prequran_live_availability')) {
        return [];
    }
    $windows = $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active']);
    if (!$windows) {
        return [];
    }
    $conflicts = [];
    foreach ($starts as $start) {
        $weekday = (int)date('w', (int)$start);
        $minute = ((int)date('G', (int)$start) * 60) + (int)date('i', (int)$start);
        $endminute = $minute + max(15, $duration);
        $allowed = false;
        foreach ($windows as $window) {
            if ((int)$window->weekday === $weekday
                && $minute >= (int)$window->start_minute
                && $endminute <= (int)$window->end_minute) {
                $allowed = true;
                break;
            }
        }
        if (!$allowed) {
            $conflicts[] = [
                'type' => 'availability',
                'message' => 'Teacher is not marked available at ' . userdate((int)$start, get_string('strftimedatetimeshort')),
            ];
        }
    }
    return $conflicts;
}

function pqlsesl_schedule_conflicts(int $teacherid, array $studentids, array $starts, int $duration): array {
    global $DB;
    $conflicts = [];
    $maxparticipants = (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12;
    if ((count($studentids) + 1) > $maxparticipants) {
        $conflicts[] = [
            'type' => 'capacity',
            'message' => 'Selected group has ' . (count($studentids) + 1) . ' participants including teacher, above the BBB limit of ' . $maxparticipants . '.',
        ];
    }
    foreach (pqlsesl_teacher_availability_conflicts($teacherid, $starts, $duration) as $conflict) {
        $conflicts[] = $conflict;
    }
    foreach ($starts as $start) {
        $start = (int)$start;
        $end = $start + max(15, $duration) * MINSECS;
        $teacherconflicts = $DB->get_records_sql(
            "SELECT id, title, scheduled_start, scheduled_end
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND status NOT IN ('cancelled', 'failed', 'rejected')
                AND scheduled_start < :endtime
                AND scheduled_end > :starttime
           ORDER BY scheduled_start ASC",
            ['teacherid' => $teacherid, 'starttime' => $start, 'endtime' => $end],
            0,
            5
        );
        foreach ($teacherconflicts as $session) {
            $conflicts[] = [
                'type' => 'teacher_overlap',
                'message' => 'Teacher overlaps with "' . (string)$session->title . '" at ' . userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')) . '.',
            ];
        }
        if ($studentids) {
            list($insql, $inparams) = $DB->get_in_or_equal(array_values($studentids), SQL_PARAMS_NAMED, 'student');
            $params = $inparams + ['starttime' => $start, 'endtime' => $end];
            $studentconflicts = $DB->get_records_sql(
                "SELECT s.id, s.title, s.scheduled_start, p.studentid
                   FROM {local_prequran_live_session} s
                   JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
                  WHERE p.role = 'student'
                    AND p.status = 'active'
                    AND p.studentid {$insql}
                    AND s.status NOT IN ('cancelled', 'failed', 'rejected')
                    AND s.scheduled_start < :endtime
                    AND s.scheduled_end > :starttime
               ORDER BY s.scheduled_start ASC",
                $params,
                0,
                10
            );
            foreach ($studentconflicts as $session) {
                $student = core_user::get_user((int)$session->studentid);
                $conflicts[] = [
                    'type' => 'student_overlap',
                    'message' => ($student ? fullname($student) : 'Student ' . (int)$session->studentid) . ' overlaps with "' . (string)$session->title . '" at ' . userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')) . '.',
                ];
            }
        }
    }
    return array_slice($conflicts, 0, 20);
}

function pqlsesl_conflict_message(array $conflicts): string {
    if (!$conflicts) {
        return '';
    }
    $lines = ['Schedule conflict detected. No sessions were created.'];
    foreach ($conflicts as $conflict) {
        $lines[] = '- ' . (string)$conflict['message'];
    }
    return implode("\n", $lines);
}

function pqlsesl_insert_live_session(int $teacherid, array $studentids, array $payload, int $start, int $duration, int $seriesid = 0, int $sequence = 0): int {
    global $DB, $USER;
    $now = time();
    $pendingmeetingid = 'prequran-live-pending-' . $now . '-' . random_string(8);
    $record = (object)[
        'cohortid' => (int)$payload['cohortid'],
        'teacherid' => $teacherid,
        'lessonid' => (string)$payload['lessonid'],
        'unitid' => (string)$payload['unitid'],
        'title' => (string)$payload['title'],
        'description' => trim((string)($payload['schedule_exception_reason'] ?? '')) !== ''
            ? 'Schedule exception requested: ' . trim((string)$payload['schedule_exception_reason'])
            : '',
        'scheduled_start' => $start,
        'scheduled_end' => $start + max(15, $duration) * MINSECS,
        'timezone' => (string)$payload['timezone'],
        'status' => (string)($payload['status'] ?? 'scheduled'),
        'recording_enabled' => !empty($payload['recording_enabled']) ? 1 : 0,
        'recording_consent_required' => 1,
        'parent_observer_allowed' => 0,
        'max_participants' => (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12,
        'bbb_meeting_id' => $pendingmeetingid,
        'bbb_internal_meeting_id' => '',
        'bbb_created' => 0,
        'bbb_create_time' => 0,
        'bbb_last_error' => '',
        'createdby' => (int)$USER->id,
        'cancelledby' => 0,
        'cancellation_reason' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    if (pqlsesl_series_ready()) {
        $record->seriesid = $seriesid;
        $record->series_sequence = $sequence;
    }
    if (pqlsesl_column_exists('local_prequran_live_session', 'groupid')) {
        $record->groupid = (int)($payload['groupid'] ?? 0);
    }
    if (pqlsesl_column_exists('local_prequran_live_session', 'workspaceid')) {
        $record->workspaceid = (int)($payload['workspaceid'] ?? 0);
    }
    $sessionid = (int)$DB->insert_record('local_prequran_live_session', $record);
    $DB->set_field('local_prequran_live_session', 'bbb_meeting_id', 'prequran-live-' . $sessionid, ['id' => $sessionid]);
    try {
        pqh_attach_default_agenda_to_live_session($sessionid, (int)$USER->id);
        pqlsesl_audit($sessionid, 'agenda_slides_auto_attached', 'session', $sessionid, ['source' => 'live_session_create']);
    } catch (Throwable $e) {
        pqlsesl_audit($sessionid, 'agenda_slides_auto_attach_failed', 'session', $sessionid, ['error' => $e->getMessage()]);
    }

    $teacher = core_user::get_user($teacherid);
    $DB->insert_record('local_prequran_live_participant', (object)[
        'sessionid' => $sessionid,
        'userid' => $teacherid,
        'role' => 'teacher',
        'studentid' => 0,
        'status' => 'active',
        'displayname' => $teacher ? fullname($teacher) : 'Teacher ' . $teacherid,
        'invitedby' => (int)$USER->id,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    foreach ($studentids as $studentid) {
        $student = core_user::get_user((int)$studentid);
        $DB->insert_record('local_prequran_live_participant', (object)[
            'sessionid' => $sessionid,
            'userid' => (int)$studentid,
            'role' => 'student',
            'studentid' => (int)$studentid,
            'status' => 'active',
            'displayname' => $student ? fullname($student) : 'Student ' . (int)$studentid,
            'invitedby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }
    return $sessionid;
}

function pqlsesl_mark_student_join($session, $participant, string $role): void {
    global $DB, $USER;
    if ($role !== 'student' || !$participant || empty($participant->studentid)) {
        return;
    }
    if (!pqlsesl_table_exists('local_prequran_live_attendance')) {
        return;
    }
    $now = time();
    $studentid = (int)$participant->studentid;
    $status = $now > ((int)$session->scheduled_start + (5 * MINSECS)) ? 'late' : 'present';
    $existing = $DB->get_record('local_prequran_live_attendance', [
        'sessionid' => (int)$session->id,
        'studentid' => $studentid,
    ]);
    if ($existing) {
        if (empty($existing->join_time)) {
            $existing->join_time = $now;
        }
        $existing->attendance_status = $status;
        $existing->participation_status = 'joined';
        $existing->userid = (int)$USER->id;
        $existing->timemodified = $now;
        $DB->update_record('local_prequran_live_attendance', $existing);
        return;
    }
    $DB->insert_record('local_prequran_live_attendance', (object)[
        'sessionid' => (int)$session->id,
        'userid' => (int)$USER->id,
        'studentid' => $studentid,
        'join_time' => $now,
        'leave_time' => 0,
        'attendance_status' => $status,
        'participation_status' => 'joined',
        'technical_issue' => 0,
        'notes' => '',
        'markedby' => (int)$USER->id,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqlsesl_visible_sessions(): array {
    global $DB, $USER, $pageworkspaceid;
    if (is_siteadmin($USER) || pqh_can_manage_academy_operations((int)$USER->id)) {
        if ($pageworkspaceid > 0 && pqlsesl_column_exists('local_prequran_live_session', 'workspaceid')) {
            return array_values($DB->get_records_sql(
                "SELECT * FROM {local_prequran_live_session}
                  WHERE scheduled_end >= :fromtime
                    AND workspaceid = :workspaceid
               ORDER BY scheduled_start ASC, id ASC",
                ['fromtime' => time(), 'workspaceid' => $pageworkspaceid]
            ));
        }
        return array_values($DB->get_records_sql(
            "SELECT * FROM {local_prequran_live_session}
              WHERE scheduled_end >= :fromtime
           ORDER BY scheduled_start ASC, id ASC",
            ['fromtime' => time()]
        ));
    }
    if ($pageworkspaceid > 0
        && pqlsesl_column_exists('local_prequran_live_session', 'workspaceid')
        && pqlsesl_can_approve_live_session((int)$USER->id, $pageworkspaceid)) {
        return array_values($DB->get_records_sql(
            "SELECT * FROM {local_prequran_live_session}
              WHERE scheduled_end >= :fromtime
                AND workspaceid = :workspaceid
           ORDER BY scheduled_start ASC, id ASC",
            ['fromtime' => time(), 'workspaceid' => $pageworkspaceid]
        ));
    }
    return array_values($DB->get_records_sql(
        "SELECT DISTINCT s.*
           FROM {local_prequran_live_session} s
      LEFT JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
          WHERE s.scheduled_end >= :fromtime
            AND (s.teacherid = :teacherid OR (p.userid = :userid AND p.status = :status))
       ORDER BY s.scheduled_start ASC, s.id ASC",
        ['fromtime' => time(), 'teacherid' => (int)$USER->id, 'userid' => (int)$USER->id, 'status' => 'active']
    ));
}

function pqlsesl_delete_expired_live_sessions(int $beforetime): int {
    global $DB;
    if (!pqlsesl_live_tables_ready()) {
        return 0;
    }
    $sessionids = $DB->get_fieldset_select(
        'local_prequran_live_session',
        'id',
        'scheduled_end < ?',
        [max(0, $beforetime)]
    );
    $sessionids = array_values(array_filter(array_map('intval', $sessionids)));
    if (!$sessionids) {
        return 0;
    }

    [$insql, $params] = $DB->get_in_or_equal($sessionids, SQL_PARAMS_NAMED, 'expiredsession');
    $transaction = $DB->start_delegated_transaction();
    foreach ([
        'local_prequran_live_participant',
        'local_prequran_live_attendance',
        'local_prequran_live_note',
        'local_prequran_live_recording',
        'local_prequran_live_audit',
    ] as $table) {
        if (pqlsesl_table_exists($table)) {
            $DB->delete_records_select($table, "sessionid $insql", $params);
        }
    }
    $DB->delete_records_select('local_prequran_live_session', "id $insql", $params);
    $transaction->allow_commit();

    pqlsesl_audit(0, 'expired_sessions_deleted', 'session', 0, [
        'count' => count($sessionids),
        'beforetime' => $beforetime,
        'sessionids' => $sessionids,
    ]);
    return count($sessionids);
}
