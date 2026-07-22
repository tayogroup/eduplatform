<?php
// Workspace recurring-series query/write library — extracted VERBATIM from
// workspace_series.php (renamed pqwser_ -> pqwserl_) for the token-gated portal
// endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Every function below is a page-defined function copied without
// behavioural change; the shared helpers it calls (pqh_table_exists_safe,
// pqh_table_has_field_safe, pqh_requested_consumer_context, core_user, fullname,
// local_prequran_notify_*) live in accesslib.php / notificationlib.php and are
// NOT copied here.
// Requires: local/hubredirect/accesslib.php + local/prequran/notificationlib.php
// loaded first. Including this file produces no output.

defined('MOODLE_INTERNAL') || die();

function pqwserl_ready(): bool {
    return pqh_table_exists_safe('local_prequran_live_series')
        && pqh_table_exists_safe('local_prequran_live_session')
        && pqh_table_has_field_safe('local_prequran_live_series', 'workspaceid')
        && pqh_table_has_field_safe('local_prequran_live_session', 'seriesid');
}

function pqwserl_fields(string $table, array $wanted): string {
    $fields = [];
    foreach ($wanted as $field) {
        if (pqh_table_has_field_safe($table, $field)) {
            $fields[] = $field;
        }
    }
    return $fields ? implode(',', $fields) : '*';
}

function pqwserl_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqwserl_parse_datetime(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $timestamp = strtotime($value);
    return $timestamp ? (int)$timestamp : 0;
}

function pqwserl_audit(int $workspaceid, string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return;
    }
    $details['workspaceid'] = $workspaceid;
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $targettype === 'session' ? $targetid : 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqwserl_series(int $workspaceid): array {
    global $DB;
    if (!pqwserl_ready()) {
        return [];
    }
    $rows = array_values($DB->get_records(
        'local_prequran_live_series',
        ['workspaceid' => $workspaceid],
        'timemodified DESC, id DESC',
        pqwserl_fields('local_prequran_live_series', ['id', 'workspaceid', 'teacherid', 'title', 'lessonid', 'unitid', 'pattern', 'duration_minutes', 'date_start', 'date_end', 'session_count', 'status', 'timemodified']),
        0,
        80
    ));
    foreach ($rows as $row) {
        $row->session_total = (int)$DB->count_records('local_prequran_live_session', ['seriesid' => (int)$row->id]);
        $row->cancelled_total = (int)$DB->count_records('local_prequran_live_session', ['seriesid' => (int)$row->id, 'status' => 'cancelled']);
        $row->upcoming_total = (int)$DB->count_records_select(
            'local_prequran_live_session',
            'seriesid = ? AND scheduled_start >= ? AND status <> ?',
            [(int)$row->id, time(), 'cancelled']
        );
    }
    return $rows;
}

function pqwserl_get_series(int $workspaceid, int $seriesid): ?stdClass {
    global $DB;
    if (!pqwserl_ready() || $seriesid <= 0) {
        return null;
    }
    return $DB->get_record('local_prequran_live_series', ['id' => $seriesid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) ?: null;
}

function pqwserl_sessions(int $seriesid): array {
    global $DB;
    if (!pqwserl_ready() || $seriesid <= 0) {
        return [];
    }
    return array_values($DB->get_records(
        'local_prequran_live_session',
        ['seriesid' => $seriesid],
        'scheduled_start ASC, id ASC',
        pqwserl_fields('local_prequran_live_session', ['id', 'workspaceid', 'seriesid', 'series_sequence', 'title', 'teacherid', 'lessonid', 'unitid', 'scheduled_start', 'scheduled_end', 'timezone', 'status', 'bbb_created', 'timemodified'])
    ));
}

function pqwserl_series_studentids(int $seriesid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_participant')) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT DISTINCT p.userid
           FROM {local_prequran_live_participant} p
           JOIN {local_prequran_live_session} s ON s.id = p.sessionid
          WHERE s.seriesid = :seriesid
            AND p.role = :role
            AND p.status = :status",
        ['seriesid' => $seriesid, 'role' => 'student', 'status' => 'active']
    );
    return array_values(array_map('intval', array_keys($rows)));
}

function pqwserl_notify_series_change(stdClass $series, string $subject, string $message, string $eventtype): void {
    $context = pqh_requested_consumer_context();
    $params = ['workspaceid' => (int)$series->workspaceid];
    if (!empty($context->consumerslug)) {
        $params['consumer'] = (string)$context->consumerslug;
    }
    $url = new moodle_url('/local/hubredirect/live_sessions.php', $params);
    $teacherid = (int)($series->teacherid ?? 0);
    if ($teacherid > 0) {
        local_prequran_notify_user_live_update(0, $teacherid, $subject, $message, $url, 'Open live sessions', $eventtype);
    }
    foreach (pqwserl_series_studentids((int)$series->id) as $studentid) {
        local_prequran_notify_parent_live_update(0, $studentid, $subject, $message, $url, 'Open live sessions', $eventtype);
    }
}

function pqwserl_update_series(int $workspaceid, int $seriesid): void {
    global $DB;
    $series = pqwserl_get_series($workspaceid, $seriesid);
    if (!$series) {
        throw new invalid_parameter_exception('Recurring series was not found in this workspace.');
    }

    $title = trim(optional_param('title', '', PARAM_TEXT));
    if ($title === '') {
        throw new invalid_parameter_exception('Series title is required.');
    }
    $duration = max(15, min(240, optional_param('duration_minutes', 60, PARAM_INT)));
    $lessonid = trim(optional_param('lessonid', '', PARAM_ALPHANUMEXT));
    $unitid = trim(optional_param('unitid', '', PARAM_ALPHANUMEXT));
    $now = time();

    $series->title = $title;
    if (pqh_table_has_field_safe('local_prequran_live_series', 'lessonid')) {
        $series->lessonid = $lessonid;
    }
    if (pqh_table_has_field_safe('local_prequran_live_series', 'unitid')) {
        $series->unitid = $unitid;
    }
    if (pqh_table_has_field_safe('local_prequran_live_series', 'duration_minutes')) {
        $series->duration_minutes = $duration;
    }
    $series->timemodified = $now;
    $DB->update_record('local_prequran_live_series', $series);

    $sessions = $DB->get_records_select(
        'local_prequran_live_session',
        'seriesid = ? AND scheduled_start >= ? AND status <> ?',
        [$seriesid, $now, 'cancelled']
    );
    foreach ($sessions as $session) {
        $session->title = $title;
        if (pqh_table_has_field_safe('local_prequran_live_session', 'lessonid')) {
            $session->lessonid = $lessonid;
        }
        if (pqh_table_has_field_safe('local_prequran_live_session', 'unitid')) {
            $session->unitid = $unitid;
        }
        if (pqh_table_has_field_safe('local_prequran_live_session', 'scheduled_end')) {
            $session->scheduled_end = (int)$session->scheduled_start + ($duration * 60);
        }
        $session->timemodified = $now;
        $DB->update_record('local_prequran_live_session', $session);
    }

    pqwserl_audit($workspaceid, 'workspace_series_updated', 'series', $seriesid, ['future_sessions_updated' => count($sessions)]);
    pqwserl_notify_series_change($series, 'Recurring live series updated', $title . ' has been updated for future workspace classes.', 'workspace_series_updated');
}

function pqwserl_reschedule_session(int $workspaceid, int $sessionid): int {
    global $DB;
    $session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
    if (!$session) {
        throw new invalid_parameter_exception('Class session was not found in this workspace.');
    }
    $series = pqwserl_get_series($workspaceid, (int)($session->seriesid ?? 0));
    if (!$series) {
        throw new invalid_parameter_exception('This class is not part of a workspace recurring series.');
    }
    if ((string)($session->status ?? '') === 'completed') {
        throw new invalid_parameter_exception('Completed classes cannot be rescheduled.');
    }
    $newstart = pqwserl_parse_datetime(optional_param('scheduled_start', '', PARAM_TEXT));
    if ($newstart <= 0) {
        throw new invalid_parameter_exception('Choose a valid new class date and time.');
    }
    $duration = max(15 * 60, (int)($session->scheduled_end ?? 0) - (int)($session->scheduled_start ?? 0));
    $oldstart = (int)($session->scheduled_start ?? 0);
    $session->scheduled_start = $newstart;
    $session->scheduled_end = $newstart + $duration;
    if (pqh_table_has_field_safe('local_prequran_live_session', 'bbb_created')) {
        $session->bbb_created = 0;
    }
    foreach (['bbb_internal_meeting_id', 'bbb_last_error'] as $field) {
        if (pqh_table_has_field_safe('local_prequran_live_session', $field)) {
            $session->{$field} = '';
        }
    }
    if (pqh_table_has_field_safe('local_prequran_live_session', 'bbb_create_time')) {
        $session->bbb_create_time = 0;
    }
    if (pqh_table_has_field_safe('local_prequran_live_session', 'bbb_meeting_id')) {
        $session->bbb_meeting_id = 'prequran-live-' . (int)$session->id;
    }
    $session->timemodified = time();
    $DB->update_record('local_prequran_live_session', $session);

    pqwserl_audit($workspaceid, 'workspace_series_session_rescheduled', 'session', $sessionid, ['seriesid' => (int)$series->id, 'oldstart' => $oldstart, 'newstart' => $newstart]);
    pqwserl_notify_series_change($series, 'Workspace class rescheduled', (string)$session->title . ' has been moved to ' . userdate($newstart, get_string('strftimedatetimeshort')) . '.', 'workspace_series_session_rescheduled');
    return (int)$series->id;
}

function pqwserl_cancel_session(int $workspaceid, int $sessionid): int {
    global $DB, $USER;
    $session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
    if (!$session) {
        throw new invalid_parameter_exception('Class session was not found in this workspace.');
    }
    $series = pqwserl_get_series($workspaceid, (int)($session->seriesid ?? 0));
    if (!$series) {
        throw new invalid_parameter_exception('This class is not part of a workspace recurring series.');
    }
    $reason = trim(optional_param('cancellation_reason', '', PARAM_TEXT));
    $session->status = 'cancelled';
    if (pqh_table_has_field_safe('local_prequran_live_session', 'cancelledby')) {
        $session->cancelledby = (int)$USER->id;
    }
    if (pqh_table_has_field_safe('local_prequran_live_session', 'cancellation_reason')) {
        $session->cancellation_reason = $reason;
    }
    $session->timemodified = time();
    $DB->update_record('local_prequran_live_session', $session);

    pqwserl_audit($workspaceid, 'workspace_series_single_session_cancelled', 'session', $sessionid, ['seriesid' => (int)$series->id, 'reason' => $reason]);
    pqwserl_notify_series_change($series, 'Workspace class cancelled', (string)$session->title . ' has been cancelled. ' . $reason, 'workspace_series_single_session_cancelled');
    return (int)$series->id;
}

function pqwserl_cancel_series(int $workspaceid, int $seriesid): void {
    global $DB, $USER;
    $series = pqwserl_get_series($workspaceid, $seriesid);
    if (!$series) {
        throw new invalid_parameter_exception('Recurring series was not found in this workspace.');
    }
    $reason = trim(optional_param('cancellation_reason', '', PARAM_TEXT));
    $now = time();
    $series->status = 'cancelled';
    if (pqh_table_has_field_safe('local_prequran_live_series', 'cancelledby')) {
        $series->cancelledby = (int)$USER->id;
    }
    if (pqh_table_has_field_safe('local_prequran_live_series', 'cancellation_reason')) {
        $series->cancellation_reason = $reason;
    }
    $series->timemodified = $now;
    $DB->update_record('local_prequran_live_series', $series);

    $sessions = $DB->get_records_select(
        'local_prequran_live_session',
        'seriesid = ? AND scheduled_start >= ? AND status NOT IN (?, ?)',
        [$seriesid, $now, 'cancelled', 'completed']
    );
    foreach ($sessions as $session) {
        $session->status = 'cancelled';
        if (pqh_table_has_field_safe('local_prequran_live_session', 'cancelledby')) {
            $session->cancelledby = (int)$USER->id;
        }
        if (pqh_table_has_field_safe('local_prequran_live_session', 'cancellation_reason')) {
            $session->cancellation_reason = $reason;
        }
        $session->timemodified = $now;
        $DB->update_record('local_prequran_live_session', $session);
    }

    pqwserl_audit($workspaceid, 'workspace_series_cancelled', 'series', $seriesid, ['future_sessions_cancelled' => count($sessions), 'reason' => $reason]);
    pqwserl_notify_series_change($series, 'Recurring live series cancelled', (string)$series->title . ' has been cancelled. ' . $reason, 'workspace_series_cancelled');
}
