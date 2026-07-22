<?php
// ---- report: live-series (admin/teacher recurring live-class series manager) ---
// Ported from local_hubredirect/live_series.php via live_series_portallib
// (pqlserl_*). Dispatched from portal_data.php AFTER token auth: $claims is
// verified, $USER is the token user, JSON exception handler + CORS headers are
// installed. The legacy page stays live in parallel and is untouched.
//
// This is the broader admin/teacher series page (canoperate = siteadmin /
// academy-operations, or a teacher who can create live sessions can manage their
// own series). It is DISTINCT from workspace-series (workspace_series.php), which
// is scoped to a single workspace owner.
//
// GET  ?report=live-series&token=…[&consumer=&workspaceid=]
//      -> the recurring series list exactly as the legacy page renders it: each
//         series with its aggregate session counts, next start, derived status,
//         active student IDs, class sessions, recent communication audit rows and
//         parent-acknowledgement stats (+ teacher names). There are no BBB creds
//         in series data to curate. There are no per-session hyperlinks on the
//         legacy page (sessions carry only an inline cancel form, ported below);
//         a portal client that wants a per-session detail/review view launches
//         portal_launch report=live-sessions (session roster) or report=live-review.
// POST body JSON {"do": …}:
//      do=update_series  (legacy action=update_series)
//      do=cancel_session (legacy action=cancel_session)
//      do=cancel_series  (legacy action=cancel_series)
//      do=remind_ack     (legacy action=remind_ack)
// Each write block is ported VERBATIM from the page. The legacy blocks read their
// fields with optional_param() (they were built for a form POST); token auth
// already replaces confirm_sesskey() (dropped), so the only bridge is to map the
// JSON body onto $_POST before running the block. Every DB write, audit
// (pqlserl_audit) and parent/teacher notify then runs byte-for-byte as on the
// page, and the legacy redirect-with-message is returned as ok JSON instead.
// Access is the legacy page check verbatim: canoperate + canmanageseries, with
// pqh_access_denied(...) -> pqpd_fail(403, same message). The legacy page never
// calls pqh_live_security_audit, so there is none to keep.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_series_portallib.php');

$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';

// ---- ENTRY access check (legacy denial messages, verbatim) --------------------
$canoperate = is_siteadmin($USER) || pqh_can_manage_academy_operations((int)$USER->id);
$canmanageseries = $canoperate || pqh_user_can_create_live_sessions(
    (int)$USER->id,
    (int)($consumercontext->workspaceid ?? 0)
);
if (!$canmanageseries) {
    pqpd_fail(403, 'Only teachers and administrators can manage live class series.');
}

$ready = pqlserl_ready();

$ispost = (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST');
if ($ispost) {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid JSON body.');
    }
    if (!$ready) {
        pqpd_fail(409, 'Run the Phase 16 series SQL before managing recurring class series.');
    }
    $do = (string)($body['do'] ?? '');

    // ---- do: update_series (legacy action=update_series, verbatim) -----------
    if ($do === 'update_series') {
        $_POST['seriesid'] = (string)($body['seriesid'] ?? 0);
        $_POST['teacherid'] = (string)($body['teacherid'] ?? 0);
        $_POST['title'] = (string)($body['title'] ?? '');
        $_POST['lessonid'] = (string)($body['lessonid'] ?? '');
        $_POST['unitid'] = (string)($body['unitid'] ?? '');
        $_POST['start_time'] = (string)($body['start_time'] ?? '');
        $_POST['duration_minutes'] = (string)($body['duration_minutes'] ?? 60);
        $_POST['studentids_raw'] = (string)($body['studentids_raw'] ?? '');

        $seriesid = optional_param('seriesid', 0, PARAM_INT);
        $series = $seriesid > 0 ? $DB->get_record('local_prequran_live_series', ['id' => $seriesid]) : false;
        if (!$series) {
            pqpd_fail(403, 'Choose a valid live class series before editing it.');
        }
        if (!$canoperate && (int)$series->teacherid !== (int)$USER->id) {
            pqpd_fail(403, 'You cannot edit this class series.');
        }

        $now = time();
        $teacherid = $canoperate ? optional_param('teacherid', 0, PARAM_INT) : (int)$series->teacherid;
        $title = optional_param('title', '', PARAM_TEXT);
        $lessonid = optional_param('lessonid', '', PARAM_ALPHANUMEXT);
        $unitid = optional_param('unitid', '', PARAM_ALPHANUMEXT);
        $starttime = optional_param('start_time', '', PARAM_TEXT);
        $duration = max(15, optional_param('duration_minutes', 60, PARAM_INT));
        $studentids = pqlserl_parse_students(optional_param('studentids_raw', '', PARAM_RAW));
        if ($teacherid <= 0 || trim($title) === '' || trim($lessonid) === '' || trim($unitid) === '' || !$studentids) {
            pqpd_fail(403, 'Complete the required series fields before saving.');
        }
        if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', $starttime, $matches)) {
            pqpd_fail(403, 'Enter a valid class time before saving the series.');
        }
        $hour = min(23, (int)$matches[1]);
        $minute = (int)$matches[2];

        $old = [
            'teacherid' => (int)$series->teacherid,
            'title' => (string)$series->title,
            'lessonid' => (string)$series->lessonid,
            'unitid' => (string)$series->unitid,
            'start_time' => (string)$series->start_time,
            'duration_minutes' => (int)$series->duration_minutes,
            'students' => pqlserl_series_studentids($seriesid),
        ];
        $new = [
            'teacherid' => $teacherid,
            'title' => $title,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'start_time' => sprintf('%02d:%02d', $hour, $minute),
            'duration_minutes' => $duration,
            'students' => $studentids,
        ];
        $changesummary = pqlserl_change_summary($old, $new);

        $series->teacherid = $teacherid;
        $series->title = $title;
        $series->lessonid = $lessonid;
        $series->unitid = $unitid;
        $series->start_time = $new['start_time'];
        $series->duration_minutes = $duration;
        $series->session_count = (int)$DB->count_records('local_prequran_live_session', ['seriesid' => $seriesid]);
        $series->timemodified = $now;
        $DB->update_record('local_prequran_live_series', $series);

        $sessions = $DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_session}
              WHERE seriesid = :seriesid
                AND scheduled_start >= :nowtime
                AND status NOT IN ('completed', 'cancelled')
           ORDER BY scheduled_start ASC, id ASC",
            ['seriesid' => $seriesid, 'nowtime' => $now]
        );
        $changed = 0;
        $participantchanges = ['added' => [], 'removed' => []];
        foreach ($sessions as $session) {
            $date = date('Y-m-d', (int)$session->scheduled_start);
            $newstart = strtotime($date . ' ' . sprintf('%02d:%02d:00', $hour, $minute));
            if (!$newstart) {
                $newstart = (int)$session->scheduled_start;
            }
            $session->teacherid = $teacherid;
            $session->title = $title;
            $session->lessonid = $lessonid;
            $session->unitid = $unitid;
            $session->scheduled_start = (int)$newstart;
            $session->scheduled_end = (int)$newstart + ($duration * MINSECS);
            $session->max_participants = max((int)$session->max_participants, count($studentids) + 1);
            $session->timemodified = $now;
            $DB->update_record('local_prequran_live_session', $session);
            $sync = pqlserl_sync_session_participants($session, $teacherid, $studentids);
            $participantchanges['added'] = array_values(array_unique(array_merge($participantchanges['added'], $sync['added'])));
            $participantchanges['removed'] = array_values(array_unique(array_merge($participantchanges['removed'], $sync['removed'])));
            pqlserl_audit((int)$session->id, 'series_session_updated', 'series', $seriesid, ['teacherid' => $teacherid, 'students' => $studentids]);
            $changed++;
        }
        pqlserl_audit(0, 'series_updated', 'series', $seriesid, [
            'old' => $old,
            'new' => $new,
            'changed_fields' => $changesummary,
            'future_sessions_updated' => $changed,
            'participants' => $participantchanges,
        ]);

        $addedstudents = array_values(array_diff($studentids, $old['students']));
        $removedstudents = array_values(array_diff($old['students'], $studentids));
        $notificationdetails = ['teachers' => 0, 'parents' => 0, 'changed_fields' => $changesummary];
        if ($changesummary) {
            $message = 'A recurring ' . $brandname . ' live class series was updated: ' . $title . '. Future sessions have been adjusted.';
            if ((int)$old['teacherid'] !== $teacherid) {
                if (pqlserl_notify_teacher($seriesid, (int)$old['teacherid'], 'Live class series reassigned', 'A recurring live class series was reassigned away from you: ' . (string)$old['title'] . '.', 'series_teacher_reassigned')) {
                    $notificationdetails['teachers']++;
                }
                if (pqlserl_notify_teacher($seriesid, $teacherid, 'New live class series assigned', 'A recurring live class series was assigned to you: ' . $title . '.', 'series_teacher_assigned')) {
                    $notificationdetails['teachers']++;
                }
            } else if (pqlserl_notify_teacher($seriesid, $teacherid, 'Live class series updated', $message, 'series_teacher_updated')) {
                $notificationdetails['teachers']++;
            }

            if (array_intersect($changesummary, ['title', 'start_time', 'duration_minutes', 'teacherid'])) {
                $parentmessage = 'A recurring ' . $brandname . ' live class schedule was updated. Please check the live class schedule for the latest class time and teacher.';
                $notificationdetails['parents'] += pqlserl_notify_parents($seriesid, $studentids, 'Live class schedule updated', $parentmessage, 'series_parent_schedule_updated');
            }
            if ($addedstudents) {
                $notificationdetails['parents'] += pqlserl_notify_parents($seriesid, $addedstudents, 'Student added to live class series', 'Your student was added to a recurring ' . $brandname . ' live class series. Please check the live class schedule for upcoming classes.', 'series_parent_student_added');
            }
            if ($removedstudents) {
                $notificationdetails['parents'] += pqlserl_notify_parents($seriesid, $removedstudents, 'Live class schedule changed', 'Your student was removed from future sessions in a recurring ' . $brandname . ' live class series. Please contact the academy if you have questions.', 'series_parent_student_removed');
            }
            pqlserl_audit(0, 'series_change_notifications_processed', 'series', $seriesid, $notificationdetails);
        }
        echo json_encode([
            'ok' => true,
            'message' => $changed . ' future session(s) updated for the series. '
                . ($notificationdetails['teachers'] + $notificationdetails['parents']) . ' notification(s) processed.',
            'seriesid' => $seriesid,
            'updated' => $changed,
            'notified' => $notificationdetails['teachers'] + $notificationdetails['parents'],
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: cancel_session (legacy action=cancel_session, verbatim) ---------
    if ($do === 'cancel_session') {
        $_POST['seriesid'] = (string)($body['seriesid'] ?? 0);
        $_POST['sessionid'] = (string)($body['sessionid'] ?? 0);
        $_POST['reason'] = (string)($body['reason'] ?? '');

        $seriesid = optional_param('seriesid', 0, PARAM_INT);
        $sessionid = optional_param('sessionid', 0, PARAM_INT);
        $reason = trim(optional_param('reason', '', PARAM_TEXT));
        $series = $seriesid > 0 ? $DB->get_record('local_prequran_live_series', ['id' => $seriesid]) : false;
        $session = $sessionid > 0 && $seriesid > 0
            ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'seriesid' => $seriesid], '*', IGNORE_MISSING)
            : false;
        if (!$series || !$session) {
            pqpd_fail(403, 'Choose a valid live class session before cancelling it.');
        }
        if (!$canoperate && (int)$series->teacherid !== (int)$USER->id) {
            pqpd_fail(403, 'You cannot cancel this class session.');
        }
        $session->status = 'cancelled';
        $session->cancelledby = (int)$USER->id;
        $session->cancellation_reason = $reason;
        $session->timemodified = time();
        $DB->update_record('local_prequran_live_session', $session);
        pqlserl_audit((int)$session->id, 'series_single_session_cancelled', 'series', $seriesid, ['reason' => $reason]);
        $studentids = pqlserl_series_studentids($seriesid);
        $sent = 0;
        if (pqlserl_notify_teacher($seriesid, (int)$series->teacherid, 'Live class session cancelled', 'One session in your recurring live class series was cancelled: ' . (string)$series->title . '.', 'series_teacher_session_cancelled')) {
            $sent++;
        }
        $sent += pqlserl_notify_parents($seriesid, $studentids, 'Live class session cancelled', 'One upcoming ' . $brandname . ' live class session was cancelled. Please check the live class schedule for details.', 'series_parent_session_cancelled');
        pqlserl_audit((int)$session->id, 'series_single_cancel_notice', 'series', $seriesid, ['sent' => $sent]);
        echo json_encode([
            'ok' => true,
            'message' => 'One session in the series was cancelled. ' . $sent . ' notification(s) processed.',
            'seriesid' => $seriesid,
            'sessioncancelled' => 1,
            'notified' => $sent,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: cancel_series (legacy action=cancel_series, verbatim) -----------
    if ($do === 'cancel_series') {
        $_POST['seriesid'] = (string)($body['seriesid'] ?? 0);
        $_POST['reason'] = (string)($body['reason'] ?? '');

        $seriesid = optional_param('seriesid', 0, PARAM_INT);
        $series = $seriesid > 0 ? $DB->get_record('local_prequran_live_series', ['id' => $seriesid]) : false;
        if (!$series) {
            pqpd_fail(403, 'Choose a valid live class series before cancelling it.');
        }
        if (!$canoperate && (int)$series->teacherid !== (int)$USER->id) {
            pqpd_fail(403, 'You cannot cancel this class series.');
        }
        $reason = trim(optional_param('reason', '', PARAM_TEXT));
        $now = time();
        $series->status = 'cancelled';
        $series->cancelledby = (int)$USER->id;
        $series->cancellation_reason = $reason;
        $series->timemodified = $now;
        $DB->update_record('local_prequran_live_series', $series);

        $sessions = $DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_session}
              WHERE seriesid = :seriesid
                AND scheduled_start >= :nowtime
                AND status NOT IN ('completed', 'cancelled')",
            ['seriesid' => $seriesid, 'nowtime' => $now]
        );
        foreach ($sessions as $session) {
            $session->status = 'cancelled';
            $session->cancelledby = (int)$USER->id;
            $session->cancellation_reason = $reason;
            $session->timemodified = $now;
            $DB->update_record('local_prequran_live_session', $session);
            pqlserl_audit((int)$session->id, 'session_cancelled', 'series', $seriesid, ['reason' => $reason]);
        }
        pqlserl_audit(0, 'series_cancelled', 'series', $seriesid, ['reason' => $reason, 'sessions' => count($sessions)]);
        $studentids = pqlserl_series_studentids($seriesid);
        $sent = 0;
        if (pqlserl_notify_teacher($seriesid, (int)$series->teacherid, 'Live class series cancelled', 'Future sessions in your recurring live class series were cancelled: ' . (string)$series->title . '.', 'series_teacher_cancelled')) {
            $sent++;
        }
        $sent += pqlserl_notify_parents($seriesid, $studentids, 'Live class series cancelled', 'Future sessions in a ' . $brandname . ' recurring live class series were cancelled. Please check the live class schedule for details.', 'series_parent_cancelled');
        pqlserl_audit(0, 'series_cancel_notifications_processed', 'series', $seriesid, ['sent' => $sent]);
        echo json_encode([
            'ok' => true,
            'message' => 'Series cancelled. Future sessions in the series were cancelled. ' . $sent . ' notification(s) processed.',
            'seriesid' => $seriesid,
            'cancelled' => 1,
            'notified' => $sent,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: remind_ack (legacy action=remind_ack, verbatim) -----------------
    if ($do === 'remind_ack') {
        $_POST['seriesid'] = (string)($body['seriesid'] ?? 0);

        $seriesid = optional_param('seriesid', 0, PARAM_INT);
        $series = $seriesid > 0 ? $DB->get_record('local_prequran_live_series', ['id' => $seriesid]) : false;
        if (!$series) {
            pqpd_fail(403, 'Choose a valid live class series before sending reminders.');
        }
        if (!$canoperate && (int)$series->teacherid !== (int)$USER->id) {
            pqpd_fail(403, 'You cannot send reminders for this class series.');
        }
        if (!pqlserl_ack_ready()) {
            pqpd_fail(403, 'Schedule acknowledgement reminders are not available yet.');
        }
        $latestchange = pqlserl_latest_change_time($seriesid);
        $sent = 0;
        $skipped = 0;
        foreach (pqlserl_series_studentids($seriesid) as $studentid) {
            $parents = function_exists('local_prequran_notify_parent_ids_for_student') ? local_prequran_notify_parent_ids_for_student($studentid) : [];
            if (!$parents) {
                pqlserl_audit(0, 'series_ack_reminder_skipped', 'series', $seriesid, ['studentid' => $studentid, 'reason' => 'no linked parents']);
                $skipped++;
                continue;
            }
            foreach ($parents as $parentid) {
                if (pqlserl_ack_current($seriesid, $studentid, (int)$parentid, $latestchange)) {
                    pqlserl_audit(0, 'series_ack_reminder_skipped', 'series', $seriesid, ['studentid' => $studentid, 'parentid' => (int)$parentid, 'reason' => 'already acknowledged']);
                    $skipped++;
                    continue;
                }
                if (local_prequran_notify_user_live_update(
                    pqlserl_first_future_sessionid($seriesid),
                    (int)$parentid,
                    'Please acknowledge live class schedule change',
                    'Please review and acknowledge the latest recurring ' . $brandname . ' live class schedule change.',
                    new moodle_url('/local/hubredirect/live_series_schedule.php', ['childid' => $studentid]),
                    'Recurring live class schedule',
                    'series_ack_reminder',
                    $studentid
                )) {
                    $sent++;
                    pqlserl_audit(0, 'series_ack_reminder_sent', 'series', $seriesid, ['studentid' => $studentid, 'parentid' => (int)$parentid]);
                    if (pqlserl_ack_ready()) {
                        $ack = $DB->get_record('local_prequran_live_ack', ['seriesid' => $seriesid, 'studentid' => $studentid, 'parentid' => (int)$parentid]);
                        $now = time();
                        if ($ack) {
                            $ack->remindedat = $now;
                            $ack->timemodified = $now;
                            $DB->update_record('local_prequran_live_ack', $ack);
                        } else {
                            $DB->insert_record('local_prequran_live_ack', (object)[
                                'seriesid' => $seriesid,
                                'studentid' => $studentid,
                                'parentid' => (int)$parentid,
                                'ack_status' => 'pending',
                                'ack_message' => '',
                                'acknowledgedat' => 0,
                                'lastchangeat' => $latestchange,
                                'remindedat' => $now,
                                'timecreated' => $now,
                                'timemodified' => $now,
                            ]);
                        }
                    }
                }
            }
        }
        echo json_encode([
            'ok' => true,
            'message' => $sent . ' acknowledgement reminder(s) sent; ' . $skipped . ' skipped.',
            'seriesid' => $seriesid,
            'ackreminded' => $sent,
            'ackskipped' => $skipped,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown live-series action.');
}

// ---- GET: the series manager state (same computation order as the page) -------
$nameids = [];

$seriesrows = [];
if ($ready) {
    $where = $canoperate ? "1 = 1" : "se.teacherid = :teacherid";
    $params = $canoperate ? [] : ['teacherid' => (int)$USER->id];
    $seriesrows = array_values($DB->get_records_sql(
        "SELECT se.*,
                (SELECT COUNT(1) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id) AS generated_sessions,
                (SELECT COUNT(1) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id AND s.status <> 'cancelled') AS active_sessions,
                (SELECT COUNT(1) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id AND s.status = 'completed') AS completed_sessions,
                (SELECT COUNT(1) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id AND s.status = 'cancelled') AS cancelled_sessions,
                (SELECT COUNT(1) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id AND s.scheduled_start >= :futuretime AND s.status NOT IN ('completed', 'cancelled')) AS future_sessions,
                (SELECT MIN(s.scheduled_start) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id AND s.scheduled_start >= :nowtime) AS next_start
           FROM {local_prequran_live_series} se
          WHERE {$where}
       ORDER BY se.date_start DESC, se.id DESC",
        ['nowtime' => time(), 'futuretime' => time()] + $params,
        0,
        50
    ));
}

$seriessessions = [];
$seriescommunications = [];
$seriesacks = [];
if ($ready && $seriesrows) {
    $seriesids = array_map(static function($row): int {
        return (int)$row->id;
    }, $seriesrows);
    list($insql, $inparams) = $DB->get_in_or_equal($seriesids, SQL_PARAMS_NAMED, 'seriesid');
    $sessions = $DB->get_records_sql(
        "SELECT id, seriesid, series_sequence, title, scheduled_start, scheduled_end, status
           FROM {local_prequran_live_session}
          WHERE seriesid {$insql}
       ORDER BY seriesid DESC, scheduled_start ASC, id ASC",
        $inparams
    );
    foreach ($sessions as $session) {
        $seriessessions[(int)$session->seriesid][] = $session;
    }

    if (pqlserl_table_exists('local_prequran_live_audit')) {
        $sessionidsbyseries = [];
        foreach ($sessions as $session) {
            $sessionidsbyseries[(int)$session->seriesid][] = (int)$session->id;
        }
        foreach ($seriesids as $seriesid) {
            $ids = $sessionidsbyseries[$seriesid] ?? [];
            $conditions = ['(targettype = :targettypeseries' . $seriesid . ' AND targetid = :targetidseries' . $seriesid . ')'];
            $params = ['targettypeseries' . $seriesid => 'series', 'targetidseries' . $seriesid => $seriesid];
            if ($ids) {
                list($sessioninsql, $sessionparams) = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'comm' . $seriesid);
                $conditions[] = "sessionid {$sessioninsql}";
                $params += $sessionparams;
            }
            $seriescommunications[$seriesid] = array_values($DB->get_records_sql(
                "SELECT id, sessionid, actorid, action, targettype, targetid, details, timecreated
                   FROM {local_prequran_live_audit}
                  WHERE (" . implode(' OR ', $conditions) . ")
                    AND action IN (
                        'notification_sent',
                        'notification_failed',
                        'notification_skipped',
                        'series_change_notifications_processed',
                        'series_cancel_notifications_processed',
                        'series_single_cancel_notice'
                    )
               ORDER BY id DESC",
                $params,
                0,
                8
            ));
        }
    }

    if (pqlserl_ack_ready()) {
        foreach ($seriesids as $seriesid) {
            $latestchange = pqlserl_latest_change_time((int)$seriesid);
            $expected = 0;
            $current = 0;
            $pending = 0;
            foreach (pqlserl_series_studentids((int)$seriesid) as $studentid) {
                $parents = function_exists('local_prequran_notify_parent_ids_for_student') ? local_prequran_notify_parent_ids_for_student($studentid) : [];
                foreach ($parents as $parentid) {
                    $expected++;
                    if (pqlserl_ack_current((int)$seriesid, $studentid, (int)$parentid, $latestchange)) {
                        $current++;
                    } else {
                        $pending++;
                    }
                }
            }
            $latestack = (int)$DB->get_field_sql(
                "SELECT MAX(acknowledgedat) FROM {local_prequran_live_ack} WHERE seriesid = :seriesid",
                ['seriesid' => (int)$seriesid]
            );
            $seriesacks[(int)$seriesid] = [
                'latestchange' => $latestchange,
                'expected' => $expected,
                'current' => $current,
                'pending' => $pending,
                'latestack' => $latestack,
            ];
        }
    }
}

// Curate each series exactly as the page's render loop derives it.
$curateseries = static function($series) use (&$nameids, $seriessessions, $seriescommunications, $seriesacks): array {
    $seriesid = (int)$series->id;
    $studentids = pqlserl_series_studentids($seriesid);
    $nameids[] = (int)$series->teacherid;

    $derivedstatus = (string)$series->status;
    if ($derivedstatus !== 'cancelled') {
        if ((int)$series->generated_sessions > 0 && (int)$series->completed_sessions >= (int)$series->generated_sessions) {
            $derivedstatus = 'completed';
        } else if ((int)$series->cancelled_sessions > 0) {
            $derivedstatus = 'partially cancelled';
        } else if ((int)$series->future_sessions === 0) {
            $derivedstatus = 'needs review';
        }
    }

    $sessionsout = [];
    foreach ($seriessessions[$seriesid] ?? [] as $s) {
        $sessionsout[] = [
            'id' => (int)$s->id,
            'series_sequence' => (int)$s->series_sequence,
            'title' => (string)$s->title,
            'scheduled_start' => (int)$s->scheduled_start,
            'scheduled_end' => (int)$s->scheduled_end,
            'status' => (string)$s->status,
            'cancellable' => (int)$s->scheduled_start >= time() && !in_array((string)$s->status, ['completed', 'cancelled'], true),
        ];
    }

    $commout = [];
    foreach ($seriescommunications[$seriesid] ?? [] as $comm) {
        $commout[] = [
            'timecreated' => (int)$comm->timecreated,
            'action' => (string)$comm->action,
            'details' => (string)$comm->details !== '' ? substr((string)$comm->details, 0, 140) : '',
            'targetid' => (int)$comm->targetid,
        ];
    }

    $ack = $seriesacks[$seriesid] ?? null;

    return [
        'id' => $seriesid,
        'title' => (string)$series->title,
        'status' => (string)$series->status,
        'derived_status' => $derivedstatus,
        'pattern' => (string)$series->pattern,
        'weekdays' => (string)$series->weekdays,
        'teacherid' => (int)$series->teacherid,
        'lessonid' => (string)$series->lessonid,
        'unitid' => (string)$series->unitid,
        'start_time' => substr((string)$series->start_time, 0, 5),
        'duration_minutes' => (int)$series->duration_minutes,
        'generated_sessions' => (int)$series->generated_sessions,
        'active_sessions' => (int)$series->active_sessions,
        'completed_sessions' => (int)$series->completed_sessions,
        'cancelled_sessions' => (int)$series->cancelled_sessions,
        'future_sessions' => (int)$series->future_sessions,
        'next_start' => (int)($series->next_start ?? 0),
        'studentids' => $studentids,
        'sessions' => $sessionsout,
        'communications' => $commout,
        'ack' => $ack,
    ];
};

$seriesout = array_map($curateseries, $seriesrows);

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'brand' => $brandname,
    'canoperate' => $canoperate,
    'ack_ready' => pqlserl_ack_ready(),
    'series' => $seriesout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
