<?php
// ---- report: live-series-wizard (guided recurring class series wizard) -------
// Ported from local_hubredirect/live_series_wizard.php via
// live_series_wizard_portallib (pqlswl_*), reusing the deployed pqlsesl_*
// (live_sessions) and pqlserl_* (live_series) libraries for everything the
// wizard shared with those pages. Dispatched from portal_data.php AFTER token
// auth: $claims is verified, $USER is the token user, JSON exception handler +
// CORS headers are installed. The legacy page stays live in parallel and is
// untouched.
//
// The legacy wizard keeps ALL its step state in GET params (no $SESSION, no
// per-step server writes): steps 1-5 are method="get" navigation, and the only
// write is the step-6 form POSTing action=create (+ created_from_wizard=1,
// recurring_enabled=1, recurrence_*) to live_sessions.php. The portal page
// therefore holds the draft client-side and:
//
// GET  ?report=live-series-wizard&token=…[&workspaceid=&consumer=&teacherid=&
//      groupid=&studentids_raw=&title=&lessonid=&unitid=&sessiondate=&
//      sessiontime=&duration=&recurrence_pattern=&recurrence_count=&
//      recurrence_until=&recurrence_weekdays[]=]
//      -> wizard bootstrap (teachers, class groups, weekday/pattern/duration
//         option maps, defaults) plus the server-computed draft state the legacy
//         page derives from the same params (group-merged student ids + names,
//         generated series dates, and the per-date conflicts preview).
// POST body JSON {"do":"create", ...}
//      -> the legacy final submission. The legacy step-6 form POSTs
//         action=create to live_sessions.php, so the write is that page's exact
//         action=create block (same validation order and messages, conflict
//         detection + override/exception audit, series branch, audits), ported
//         verbatim — identical to the live-create-wizard handler — with
//         confirm_sesskey dropped (token auth replaces the session key) and the
//         redirect replaced by {"ok":true, created, seriesid, sessionids,
//         approval, message}. This wizard always sends recurring_enabled=1.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_sessions_portallib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_series_portallib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_series_wizard_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// ---- entry access check (replicated from the legacy wizard preamble) ---------
// The legacy page calls pqh_access_denied(...); token auth turns that into a
// pqpd_fail(403, <same message>). The legacy series wizard never calls
// pqh_live_security_audit, so there is none to keep.
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($requestedworkspaceid > 0) {
    $urlparams['workspaceid'] = $requestedworkspaceid;
} else if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $urlparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
$pqlswisadmin = is_siteadmin($USER) || pqh_can_manage_academy_operations($userid);
$pqlswworkspaceid = (int)($urlparams['workspaceid'] ?? 0);
if (!$pqlswisadmin && !pqh_user_can_create_live_sessions($userid, $pqlswworkspaceid)) {
    pqpd_fail(403, 'Only approved teachers and administrators can use the recurring class wizard.');
}

// The legacy step-6 form POSTs to live_sessions.php, whose preamble resolves
// $pageworkspaceid (param -> consumer context -> teacher workspaces). The
// wizard passes its resolved workspaceid in that POST, so composing the two
// chains reproduces the real request flow. $pageworkspaceid is a page global
// read by pqlsesl_visible_sessions(); this handler runs at file top level, so
// the plain assignment satisfies that contract.
$pageworkspaceid = $pqlswworkspaceid;
if ($pageworkspaceid <= 0) {
    $teacherworkspaceids = pqlsesl_live_teacher_workspace_ids($userid);
    if ($teacherworkspaceids) {
        $pageworkspaceid = (int)reset($teacherworkspaceids);
    }
}
$cancreate = pqlsesl_can_create_live_session($userid, $pageworkspaceid);
$recordingdefault = pqlsesl_private_teacher_recording_default($consumercontext, $pageworkspaceid);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid JSON body.');
    }
    $do = (string)($body['do'] ?? '');

    // ---- do: create (the wizard's only write: legacy step-6 POST of
    // action=create to live_sessions.php, ported verbatim from that block) ----
    if ($do === 'create') {
        if (!pqlsesl_live_tables_ready()) {
            pqpd_fail(409, 'Live-session tables are not installed yet.');
        }
        if (!$cancreate) {
            pqpd_fail(403, 'You cannot create live sessions.');
        }
        $error = '';
        $createdfromwizard = (bool)clean_param($body['created_from_wizard'] ?? 0, PARAM_BOOL);

        $teacherid = is_siteadmin($USER) ? (int)($body['teacherid'] ?? 0) : (int)$USER->id;
        if (!is_siteadmin($USER)
                && !pqlsesl_has_independent_teacher_profile_record((int)$USER->id)
                && $pageworkspaceid > 0
                && !pqlsesl_user_can_teach_live_workspace((int)$USER->id, $pageworkspaceid)) {
            pqpd_fail(403, 'You cannot create live sessions for this workspace.');
        }
        $title = trim(clean_param((string)($body['title'] ?? ''), PARAM_TEXT));
        $date = trim(clean_param((string)($body['sessiondate'] ?? ''), PARAM_TEXT));
        $time = trim(clean_param((string)($body['sessiontime'] ?? ''), PARAM_TEXT));
        $duration = (int)($body['duration'] ?? 60);
        $lessonid = clean_param((string)($body['lessonid'] ?? ''), PARAM_ALPHANUMEXT);
        $unitid = clean_param((string)($body['unitid'] ?? ''), PARAM_ALPHANUMEXT);
        if ($lessonid === '') {
            $lessonid = 'alphabet';
        }
        if ($unitid === '') {
            $unitid = 'alphabet_listen';
        }
        $cohortid = (int)($body['cohortid'] ?? 0);
        $groupid = (int)($body['groupid'] ?? 0);
        $recording = (bool)clean_param($body['recording_enabled'] ?? ($recordingdefault ? 1 : 0), PARAM_BOOL);
        $recurring = (bool)clean_param($body['recurring_enabled'] ?? 0, PARAM_BOOL);
        $recurrencepattern = clean_param((string)($body['recurrence_pattern'] ?? 'none'), PARAM_ALPHANUMEXT);
        $recurrenceuntil = clean_param((string)($body['recurrence_until'] ?? ''), PARAM_TEXT);
        $recurrencecount = (int)($body['recurrence_count'] ?? 4);
        $recurrenceweekdays = array_map('intval', array_values((array)($body['recurrence_weekdays'] ?? [])));
        $overrideconflicts = (bool)clean_param($body['override_conflicts'] ?? 0, PARAM_BOOL);
        $overridereason = trim(clean_param((string)($body['override_reason'] ?? ''), PARAM_TEXT));
        $studentids = array_map('intval', array_values((array)($body['studentids'] ?? [])));
        $studentidsraw = (string)($body['studentids_raw'] ?? '');
        if ($studentidsraw !== '') {
            $studentids = array_merge($studentids, array_map('intval', preg_split('/[\s,]+/', $studentidsraw, -1, PREG_SPLIT_NO_EMPTY)));
        }
        if ($groupid > 0 && pqlsesl_table_exists('local_prequran_group_member')) {
            $groupmembers = $DB->get_records('local_prequran_group_member', ['groupid' => $groupid, 'assignment_status' => 'active'], '', 'id, studentid');
            foreach ($groupmembers as $member) {
                $studentids[] = (int)$member->studentid;
            }
        }
        $studentids = array_values(array_unique(array_filter(array_map('intval', $studentids))));
        if (!is_siteadmin($USER)) {
            $allowedstudentids = array_map(
                static function(array $student): int {
                    return (int)($student['studentid'] ?? 0);
                },
                pqlsesl_teacher_students((int)$USER->id)
            );
            $studentids = array_values(array_intersect($studentids, $allowedstudentids));
        }
        if ($teacherid <= 0) {
            $error = 'Choose a teacher user ID.';
        } else if ($title === '') {
            $error = 'Enter a live session title.';
        } else if ($date === '' || $time === '') {
            $error = 'Choose a live session date and time.';
        } else if (!$studentids) {
            $error = 'Tick at least one student in the Students list, then create the session again.';
        } else {
            $tzraw = trim(clean_param((string)($body['timezone'] ?? ''), PARAM_TEXT));
            $tz = pqlsesl_valid_timezone($tzraw !== '' ? $tzraw : pqlsesl_default_schedule_timezone());
            $start = pqlsesl_parse_local_datetime($date, $time, $tz);
            if (!$start) {
                $error = 'Enter a valid date and time.';
            } else if (($start + max(15, $duration) * MINSECS) <= time()) {
                $error = 'That time is already in the past, so the session would never appear in Upcoming Sessions. You chose '
                    . userdate($start, get_string('strftimedatetimeshort')) . ' but the server time is now '
                    . userdate(time(), get_string('strftimedatetimeshort')) . '. Pick a future date and time.';
            } else {
                if ($recurring && !pqlsesl_series_ready()) {
                    $error = 'Recurring classes need the Phase 16 series SQL installed first.';
                } else {
                    $payload = [
                        'cohortid' => $cohortid,
                        'groupid' => $groupid,
                        'workspaceid' => $pageworkspaceid,
                        'status' => pqlsesl_created_session_status((int)$USER->id, $teacherid, $pageworkspaceid),
                        'lessonid' => $lessonid,
                        'unitid' => $unitid,
                        'title' => $title,
                        'timezone' => $tz,
                        'recording_enabled' => $recording,
                    ];
                    $sessionids = [];
                    $seriesid = 0;
                    $starts = [$start];
                    if ($recurring) {
                        $until = $recurrenceuntil !== '' ? strtotime($recurrenceuntil . ' 23:59:59 ' . $tz) : ($start + (30 * DAYSECS));
                        $starts = pqlsesl_generate_recurring_starts($start, $recurrencepattern, $recurrenceweekdays, (int)$until, $recurrencecount);
                        if (!$starts) {
                            $starts = [$start];
                        }
                    }
                    $conflicts = pqlsesl_schedule_conflicts($teacherid, $studentids, $starts, $duration);
                    if ((int)$USER->id === $teacherid) {
                        // A teacher scheduling their own session is implicitly
                        // available at that time: their published availability is
                        // advisory for students booking them, not a veto on their
                        // own planning. Before approvals were removed this was
                        // handled by the pending-status exception request, which
                        // no longer exists, so filter availability conflicts here.
                        // Real double-bookings (overlap, capacity) still block.
                        $conflicts = array_values(array_filter($conflicts, static function(array $conflict): bool {
                            return (string)($conflict['type'] ?? '') !== 'availability';
                        }));
                    }
                    $creatorcanapprove = pqlsesl_can_approve_live_session((int)$USER->id, $pageworkspaceid);
                    $teacherexceptionrequest = (int)$USER->id === $teacherid;
                    $canoverride = $overrideconflicts
                        && $overridereason !== ''
                        && ($creatorcanapprove || $teacherexceptionrequest);
                    if ($conflicts && !$canoverride) {
                        pqlsesl_audit(0, 'schedule_conflict_blocked', $recurring ? 'series' : 'session', 0, ['conflicts' => $conflicts, 'teacherid' => $teacherid, 'students' => $studentids]);
                        $error = pqlsesl_conflict_message($conflicts);
                    } else if ($conflicts && $canoverride) {
                        $payload['schedule_exception_reason'] = $overridereason;
                        pqlsesl_audit(
                            0,
                            $teacherexceptionrequest ? 'schedule_exception_requested' : 'schedule_conflict_override',
                            $recurring ? 'series' : 'session',
                            0,
                            [
                                'conflicts' => $conflicts,
                                'teacherid' => $teacherid,
                                'students' => $studentids,
                                'reason' => $overridereason,
                                'approval_status' => (string)$payload['status'],
                            ]
                        );
                    }
                    if ($error !== '') {
                        // Fall through to the error response below.
                    } else
                    if ($recurring) {
                        $now = time();
                        $seriesrecord = (object)[
                            'cohortid' => $cohortid,
                            'teacherid' => $teacherid,
                            'title' => $title,
                            'lessonid' => $lessonid,
                            'unitid' => $unitid,
                            'pattern' => $recurrencepattern,
                            'weekdays' => implode(',', array_map('intval', $recurrenceweekdays)),
                            'start_time' => $time,
                            'duration_minutes' => max(15, $duration),
                            'date_start' => min($starts),
                            'date_end' => max($starts),
                            'session_count' => count($starts),
                            'status' => 'active',
                            'createdby' => (int)$USER->id,
                            'cancelledby' => 0,
                            'cancellation_reason' => '',
                            'timecreated' => $now,
                            'timemodified' => $now,
                        ];
                        if (pqlsesl_column_exists('local_prequran_live_series', 'groupid')) {
                            $seriesrecord->groupid = $groupid;
                        }
                        if (pqlsesl_column_exists('local_prequran_live_series', 'workspaceid')) {
                            $seriesrecord->workspaceid = $pageworkspaceid;
                        }
                        $seriesid = (int)$DB->insert_record('local_prequran_live_series', $seriesrecord);
                        pqlsesl_audit(0, $createdfromwizard ? 'series_created_from_wizard' : 'series_created', 'series', $seriesid, ['students' => $studentids, 'sessions' => count($starts), 'pattern' => $recurrencepattern, 'approval_status' => $payload['status']]);
                        $sequence = 1;
                        foreach ($starts as $sessionstart) {
                            $sessionid = pqlsesl_insert_live_session($teacherid, $studentids, $payload, (int)$sessionstart, $duration, $seriesid, $sequence);
                            $sessionids[] = $sessionid;
                            pqlsesl_audit($sessionid, 'series_session_created', 'series', $seriesid, ['sequence' => $sequence, 'seriesid' => $seriesid]);
                            $sequence++;
                        }
                    } else {
                        $sessionid = pqlsesl_insert_live_session($teacherid, $studentids, $payload, $start, $duration);
                        $sessionids[] = $sessionid;
                        pqlsesl_audit($sessionid, $createdfromwizard ? 'created_from_wizard' : 'created_from_ui', 'session', $sessionid, ['students' => $studentids, 'approval_status' => $payload['status']]);
                    }
                    if ($error === '') {
                        echo json_encode([
                            'ok' => true,
                            'created' => count($sessionids),
                            'seriesid' => $seriesid,
                            'wizard' => $createdfromwizard ? 1 : 0,
                            'approval' => (string)$payload['status'],
                            'sessionids' => $sessionids,
                            'message' => count($sessionids) > 1
                                ? count($sessionids) . ' recurring live sessions created.'
                                : 'Live session created.',
                        ], JSON_UNESCAPED_SLASHES);
                        exit;
                    }
                }
            }
        }
        pqpd_fail(400, $error !== '' ? $error : 'The live session could not be created.');
    }

    pqpd_fail(400, 'Unknown live-series-wizard action.');
}

// ---- GET: wizard bootstrap + server-computed draft state ---------------------
// Same param intake and derivations as the legacy page preamble; the portal
// page carries the draft between steps client-side and re-requests this to
// refresh group-merged student ids, the generated series dates, and the
// per-date conflicts preview.
$ready = pqlswl_ready();

$teacherid = $pqlswisadmin ? optional_param('teacherid', 0, PARAM_INT) : $userid;
$groupid = optional_param('groupid', 0, PARAM_INT);
$studentraw = trim(optional_param('studentids_raw', '', PARAM_TEXT));
$studentids = array_values(array_unique(array_merge(pqlswl_group_student_ids($groupid, $pqlswworkspaceid), pqlswl_parse_students($studentraw))));
$title = trim(optional_param('title', 'Pre-Quran review class series', PARAM_TEXT));
$lessonid = trim(optional_param('lessonid', 'alphabet', PARAM_TEXT));
$unitid = trim(optional_param('unitid', 'alphabet_listen', PARAM_TEXT));
$sessiondate = optional_param('sessiondate', '', PARAM_TEXT);
$sessiontime = optional_param('sessiontime', '', PARAM_TEXT);
$duration = max(15, min(240, optional_param('duration', 60, PARAM_INT)));
$pattern = optional_param('recurrence_pattern', 'weekdays', PARAM_ALPHANUMEXT);
$count = max(1, min(60, optional_param('recurrence_count', 8, PARAM_INT)));
$untilraw = optional_param('recurrence_until', '', PARAM_TEXT);
$weekdays = optional_param_array('recurrence_weekdays', [], PARAM_INT);
$recording = optional_param('recording_enabled', 0, PARAM_BOOL);
$datevalue = pqlswl_clean_date($sessiondate, 0);
$start = ($datevalue > 0 && pqlswl_minutes($sessiontime) >= 0) ? usergetmidnight($datevalue) + (pqlswl_minutes($sessiontime) * MINSECS) : 0;
$until = $untilraw !== '' ? pqlswl_clean_date($untilraw, 0) + DAYSECS - 1 : ($start > 0 ? $start + (30 * DAYSECS) : 0);
$starts = $start > 0 ? pqlswl_generate_starts($start, $pattern, $weekdays, $until, $count) : [];
$conflictrows = pqlswl_conflicts($teacherid, $studentids, $starts, $duration);
$conflictcount = 0;
foreach ($conflictrows as $row) {
    $conflictcount += count($row['messages']);
}
$teachers = $pqlswisadmin
    ? pqlswl_teacher_candidates($pqlswworkspaceid)
    : [['id' => $userid, 'name' => pqlserl_user_name($userid, 'Teacher ' . $userid)]];
$classgroups = pqlswl_class_groups($pqlswworkspaceid);

// Curate the class groups and generated-session rows for the client (labels
// computed with the same userdate() the legacy review table renders).
$classgroupsout = [];
foreach ($classgroups as $group) {
    $classgroupsout[] = ['id' => (int)$group->id, 'title' => (string)$group->title, 'status' => (string)$group->status];
}
$sessionsout = [];
foreach ($conflictrows as $row) {
    $sessionsout[] = [
        'start' => (int)$row['start'],
        'label' => userdate((int)$row['start'], get_string('strftimedatetimeshort')),
        'messages' => array_values($row['messages']),
    ];
}
$studentnames = [];
foreach ($studentids as $sid) {
    $studentnames[$sid] = pqlserl_user_name((int)$sid, 'Student ' . (int)$sid);
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'ready_message' => $ready ? '' : 'Recurring wizard requires the Phase 16 series table/columns.',
    'userid' => $userid,
    'isadmin' => $pqlswisadmin,
    'workspaceid' => $pqlswworkspaceid,
    'cancreate' => $cancreate,
    'durations' => [45, 60, 75, 90],
    'patterns' => [
        ['value' => 'daily', 'label' => 'Daily'],
        ['value' => 'weekly', 'label' => 'Weekly'],
        ['value' => 'weekdays', 'label' => 'Selected weekdays'],
    ],
    // Legacy checkbox order: Mon..Sat then Sun.
    'weekdays' => [
        ['value' => 1, 'label' => 'Mon'],
        ['value' => 2, 'label' => 'Tue'],
        ['value' => 3, 'label' => 'Wed'],
        ['value' => 4, 'label' => 'Thu'],
        ['value' => 5, 'label' => 'Fri'],
        ['value' => 6, 'label' => 'Sat'],
        ['value' => 0, 'label' => 'Sun'],
    ],
    'teachers' => $teachers,
    'classgroups' => $classgroupsout,
    'draft' => [
        'teacherid' => $teacherid,
        'groupid' => $groupid,
        'studentids' => $studentids,
        'studentnames' => $studentnames,
        'title' => $title,
        'lessonid' => $lessonid,
        'unitid' => $unitid,
        'sessiondate' => $sessiondate,
        'sessiontime' => $sessiontime,
        'duration' => $duration,
        'recurrence_pattern' => $pattern,
        'recurrence_count' => $count,
        'recurrence_until' => $untilraw,
        'recurrence_weekdays' => array_values($weekdays),
        'recording_enabled' => $recording ? 1 : 0,
        'start' => $start,
        'generated_count' => count($starts),
        'sessions' => $sessionsout,
        'conflict_count' => $conflictcount,
    ],
    'names' => pqpd_names(array_merge([$teacherid], $studentids)),
], JSON_UNESCAPED_SLASHES);
exit;
