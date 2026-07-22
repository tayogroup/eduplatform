<?php
// ---- report: live-sessions (teacher schedule + session actions) --------------
// Ported from local_hubredirect/live_sessions.php via live_sessions_portallib
// (pqlsesl_*). Dispatched from portal_data.php AFTER token auth: $claims is
// verified, $USER is the token user, JSON exception handler + CORS headers are
// installed. The legacy page stays live in parallel and is untouched.
//
// GET  ?report=live-sessions&token=…[&workspaceid=&consumer=&sessionid=]
//      -> caps + create-form data + upcoming sessions (legacy shows upcoming
//         only; past sessions leave the list once scheduled_end passes), and,
//         with sessionid, a per-session detail view with the roster
//         (participants + attendance/participation state).
// POST body JSON {"do": …}:
//      do=create           (single or recurring series; conflicts + override)
//      do=approve_session  do=reject_session
//      do=join             (BBB room create/self-heal + join URL; the legacy
//                           launch-bridge page is replaced by returning the
//                           join URL for the portal page to open)
//      do=delete_expired   (site admin only)
// Legacy action=closed is a browser-only close/localStorage bridge page with
// no server-side write — not ported.

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_sessions_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Page context, replicated from the legacy preamble. $pageworkspaceid is a
// page global read by pqlsesl_visible_sessions() — this handler runs at file
// top level, so the plain assignment satisfies that contract.
$pageworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
$pqlbrandname = trim((string)($consumercontext->consumername ?? 'EduPlatform'));
if ($pqlbrandname === '') {
    $pqlbrandname = 'EduPlatform';
}
if ($pageworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $pageworkspaceid = (int)$consumercontext->workspaceid;
}
if ($pageworkspaceid <= 0) {
    $teacherworkspaceids = pqlsesl_live_teacher_workspace_ids($userid);
    if ($teacherworkspaceids) {
        $pageworkspaceid = (int)reset($teacherworkspaceids);
    }
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($pageworkspaceid > 0) {
    $urlparams['workspaceid'] = $pageworkspaceid;
}

if (!pqlsesl_live_tables_ready()) {
    pqpd_fail(409, 'Live-session tables are not installed yet.');
}

$canmanage = is_siteadmin($USER) || (pqlsesl_is_teacher($userid) && !pqlsesl_is_managed_student($userid));
$cancreate = pqlsesl_can_create_live_session($userid, $pageworkspaceid);
$canapprove = pqlsesl_can_approve_live_session($userid, $pageworkspaceid);
$recordingdefault = pqlsesl_private_teacher_recording_default($consumercontext, $pageworkspaceid);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid JSON body.');
    }
    $do = (string)($body['do'] ?? '');

    // ---- do: delete_expired (legacy action=delete_expired) -------------------
    if ($do === 'delete_expired') {
        if (!is_siteadmin($USER)) {
            pqpd_fail(403, 'Only site administrators can delete expired live sessions.');
        }
        $deletedcount = pqlsesl_delete_expired_live_sessions(time());
        echo json_encode([
            'ok' => true,
            'deleted' => $deletedcount,
            'message' => $deletedcount > 0
                ? $deletedcount . ' expired live session(s) deleted.'
                : 'No expired live sessions were found.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: approve_session / reject_session --------------------------------
    if (in_array($do, ['approve_session', 'reject_session'], true)) {
        $sessionid = (int)($body['sessionid'] ?? 0);
        $session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
        if (!$session) {
            pqpd_fail(403, 'Choose a valid live session before approving it.');
        }
        $approvalworkspaceid = (int)($session->workspaceid ?? $pageworkspaceid);
        if (!pqlsesl_can_approve_live_session($userid, $approvalworkspaceid)) {
            pqpd_fail(403, 'You cannot approve live sessions for this workspace.');
        }
        if (!pqlsesl_session_requires_approval($session)) {
            echo json_encode(['ok' => true, 'notice' => 'alreadyreviewed', 'message' => 'Live session was already reviewed.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        $session->status = $do === 'approve_session' ? 'scheduled' : 'rejected';
        $session->timemodified = time();
        $DB->update_record('local_prequran_live_session', $session);
        pqlsesl_audit((int)$session->id, $do === 'approve_session' ? 'session_approved' : 'session_rejected', 'session', (int)$session->id, [
            'reviewedby' => (int)$USER->id,
            'workspaceid' => $approvalworkspaceid,
        ]);
        echo json_encode([
            'ok' => true,
            'notice' => $do === 'approve_session' ? 'approved' : 'rejected',
            'message' => $do === 'approve_session' ? 'Live session approved and ready to start.' : 'Live session request rejected.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: join (legacy action=join) ---------------------------------------
    // Same guards, role resolution, join window, BBB room create/self-heal,
    // agenda insert, audits, and attendance mark as the legacy block. The
    // legacy launch-bridge/redirect rendering is replaced by returning the
    // fresh server-issued join URL (the legacy directjoin semantics).
    if ($do === 'join') {
        $sessionid = (int)($body['sessionid'] ?? 0);
        $workspaceid = (int)($body['workspaceid'] ?? 0);
        if ($workspaceid <= 0) {
            $workspaceid = $pageworkspaceid;
        }
        if ($sessionid <= 0) {
            pqpd_fail(403, 'Choose a valid live session before joining.');
        }
        $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING);
        if (!$session) {
            pqpd_fail(403, 'This live session could not be found. It may have expired or been removed.');
        }
        if ($workspaceid <= 0 && !empty($session->workspaceid)) {
            $workspaceid = (int)$session->workspaceid;
        }
        $sessionurlparams = $urlparams;
        if ($workspaceid > 0) {
            $sessionurlparams['workspaceid'] = $workspaceid;
        }
        if (!pqlsesl_user_can_view_session($session)) {
            pqpd_fail(403, 'You cannot join this live session.');
        }
        if (in_array((string)$session->status, ['cancelled', 'failed'], true)) {
            pqpd_fail(403, 'This live session is not available.');
        }
        if (pqlsesl_session_requires_approval($session)) {
            pqpd_fail(403, 'This live session is waiting for approval before it can start.');
        }
        if ((string)$session->status === 'rejected') {
            pqpd_fail(403, 'This live session request was not approved.');
        }

        $participant = $DB->get_record('local_prequran_live_participant', [
            'sessionid' => (int)$session->id,
            'userid' => (int)$USER->id,
            'status' => 'active',
        ]);
        $role = '';
        if (is_siteadmin($USER)) {
            $role = 'admin_observer';
        } else if ((int)$session->teacherid === (int)$USER->id || ($participant && (string)$participant->role === 'teacher')) {
            $role = 'teacher';
        } else if ($participant && (string)$participant->role === 'student') {
            $role = 'student';
        } else if ($participant && (string)$participant->role === 'parent_observer' && !empty($session->parent_observer_allowed)) {
            $role = 'parent_observer';
        }
        if ($role === '') {
            pqpd_fail(403, 'You cannot join this live session.');
        }

        if (in_array($role, ['student', 'parent_observer'], true)) {
            $before = ((int)get_config('local_prequran', 'bbb_join_window_before_minutes') ?: 10) * MINSECS;
            $after = ((int)get_config('local_prequran', 'bbb_join_window_after_minutes') ?: 15) * MINSECS;
            $now = time();
            $teacherstarted = !empty($session->bbb_created) && (string)$session->status === 'live';
            if ($now > ((int)$session->scheduled_end + $after)
                || (!$teacherstarted && $now < ((int)$session->scheduled_start - $before))) {
                pqpd_fail(403, 'This live session is outside the student join window.');
            }
        }

        $locallib = $CFG->dirroot . '/local/prequran/locallib.php';
        if (!file_exists($locallib)) {
            pqpd_fail(403, 'The live classroom service is not ready. Please ask support to review the live-room configuration.');
        }
        require_once($locallib);

        $studentid = pqlsesl_live_tutor_studentid($session, $participant);
        $tutorurl = pqlsesl_live_tutor_url($session, $studentid, true);
        $unitid = trim((string)($session->unitid ?? ''));
        $lessonurl = pqlsesl_url('/local/hubredirect/issue_child.php', $sessionurlparams, [
            'goto' => $unitid !== '' ? $unitid : 'alphabet_listen',
            'managed_student' => 0,
            'monitor_studentid' => $studentid,
            'live_sessionid' => $sessionid,
        ]);
        // A single space suppresses the chat welcome banner: omitting the welcome
        // param entirely would make BBB fall back to the server's default message.
        $welcometext = ' ';

        // BBB ends a room when it empties or its duration passes, while
        // bbb_created stays set - joining then fails with invalidMeetingIdentifier.
        // The create call is idempotent (a running room is returned untouched, a
        // dead one is rebuilt with the same ID and passwords), so teachers and
        // admin observers always run it before joining to self-heal dead rooms.
        $roomexisted = !empty($session->bbb_created);
        $roomjustcreated = false;
        if (!$roomexisted || in_array($role, ['teacher', 'admin_observer'], true)) {
            if (!in_array($role, ['teacher', 'admin_observer'], true)) {
                pqpd_fail(403, 'The teacher has not started this live session yet.');
            }
            if (!pqlsesl_bbb_is_configured()) {
                pqpd_fail(403, 'The live room could not be started. Please ask support to review the BigBlueButton configuration.');
            }
            $recordingdecision = local_prequran_live_recording_consent_decision($session);
            $recordingallowed = !empty($recordingdecision['allowed']);
            if (!empty($recordingdecision['requested']) && !$recordingallowed) {
                pqlsesl_audit((int)$session->id, 'recording_disabled_missing_consent', 'session', (int)$session->id, [
                    'missing_studentids' => $recordingdecision['missing_studentids'],
                    'studentids' => $recordingdecision['studentids'],
                    'reason' => $recordingdecision['reason'],
                ]);
            }
            try {
                $meetingparams = [
                    'meetingID' => (string)$session->bbb_meeting_id,
                    'name' => (string)$session->title,
                    'attendeePW' => pqlsesl_bbb_password($session, 'attendee'),
                    'moderatorPW' => pqlsesl_bbb_password($session, 'moderator'),
                    'record' => $recordingallowed,
                    'autoStartRecording' => $recordingallowed,
                    'muteOnStart' => true,
                    'maxParticipants' => (int)$session->max_participants,
                    'duration' => max(60, (int)ceil(((int)$session->scheduled_end - (int)$session->scheduled_start) / 60) + 30),
                    'logoutURL' => pqlsesl_url('/local/hubredirect/live_sessions.php', $sessionurlparams, [
                        'action' => 'closed',
                        'sessionid' => (int)$session->id,
                    ])->out(false),
                    'welcome' => $welcometext,
                    // Explicit blank banner: without it some BBB setups inject a
                    // server-default banner bar across the top of the classroom.
                    'bannerText' => ' ',
                    // Classroom-first: BBB's adaptive layout puts the lesson
                    // content on stage while anything is being presented and
                    // switches to webcams when nothing is.
                    'meetingLayout' => 'SMART_LAYOUT',
                    'lockSettingsDisableCam' => true,
                    'disabledFeatures' => 'virtualBackgrounds,customVirtualBackgrounds,cameraAsContent',
                ];
                $xml = local_prequran_bbb_create_meeting($meetingparams);
            } catch (Throwable $e) {
                $session->bbb_last_error = $e->getMessage();
                $session->timemodified = time();
                $DB->update_record('local_prequran_live_session', $session);
                pqlsesl_audit((int)$session->id, 'bbb_create_failed', 'session', (int)$session->id, ['error' => $e->getMessage()]);
                pqpd_fail(403, 'The live room could not be started. Please ask support to review the BigBlueButton configuration.');
            }
            // duplicateWarning means the room was already running; anything else
            // means this create call actually built (or rebuilt) the room.
            $roomjustcreated = strtolower((string)($xml->messageKey ?? '')) !== 'duplicatewarning';
            $session->bbb_internal_meeting_id = (string)($xml->internalMeetingID ?? '');
            $session->bbb_created = 1;
            $session->bbb_create_time = time();
            if (!empty($recordingdecision['requested']) && !$recordingallowed) {
                $session->recording_enabled = 0;
            }
            $session->status = 'live';
            $session->timemodified = time();
            $DB->update_record('local_prequran_live_session', $session);
            pqlsesl_audit((int)$session->id, 'bbb_created', 'session', (int)$session->id, [
                'recording_requested' => !empty($recordingdecision['requested']),
                'recording_enabled' => $recordingallowed,
                'recording_consent_reason' => $recordingdecision['reason'],
                'recreate_check' => $roomexisted,
            ]);
        }

        // Insert the agenda deck only when the room was just built. Re-inserting
        // on every join forced BBB to re-convert the PPTX, flashing "Something
        // went wrong. Attempting to recover..." in the presentation area, and it
        // also stomped whatever deck or whiteboard the teacher had made current.
        if ($roomjustcreated && in_array($role, ['teacher', 'admin_observer'], true)) {
            pqlsesl_insert_agenda_slides_into_bbb($session, 'teacher_start_or_join');
        }

        try {
            if (!pqlsesl_bbb_is_configured()) {
                pqpd_fail(403, 'The live room is not available yet. Please ask support to review the live-room configuration.');
            }
            $joinurl = local_prequran_bbb_join_url(
                (string)$session->bbb_meeting_id,
                fullname($USER),
                in_array($role, ['teacher', 'admin_observer'], true) ? pqlsesl_bbb_password($session, 'moderator') : pqlsesl_bbb_password($session, 'attendee'),
                (int)$USER->id,
                [
                    'userdata-prequran-role' => $role,
                    // Hide the meeting title / "Open session details" control in
                    // the BBB top bar; the surrounding page already frames the
                    // class. The hosted stylesheet carries the selectors so they
                    // can be tuned without redeploying this file; the inline rule
                    // is a fallback if the client blocks external style URLs.
                    'userdata-bbb_custom_style_url' => (new moodle_url('/local/hubredirect/bbb_custom.css'))->out(false),
                    'userdata-bbb_custom_style' => '[data-test="presentationTitle"],button[aria-label*="session details" i],[class*="presentationTitle" i]{display:none!important;}',
                    // One-step joining: audio connects immediately (mic muted by
                    // muteOnStart), no listen-only detour, no echo test. Students
                    // land with the lesson visible.
                    'userdata-bbb_auto_join_audio' => 'true',
                    'userdata-bbb_listen_only_mode' => 'false',
                    'userdata-bbb_skip_check_audio' => 'true',
                    'userdata-prequran-sessionid' => (int)$session->id,
                    'userdata-prequran-workspaceid' => $workspaceid > 0 ? $workspaceid : (int)($session->workspaceid ?? 0),
                    'userdata-prequran-studentid' => $studentid,
                ]
            );
        } catch (Throwable $e) {
            pqlsesl_audit((int)$session->id, 'bbb_join_failed', 'session', (int)$session->id, ['error' => $e->getMessage()]);
            pqpd_fail(403, 'The live room is not available yet. Please ask support to review the live-room configuration.');
        }
        pqlsesl_audit((int)$session->id, 'join_redirect', 'user', (int)$USER->id, ['role' => $role]);
        pqlsesl_mark_student_join($session, $participant, $role);
        $materialsurl = pqh_live_session_materials_control_url((int)$session->id);
        echo json_encode([
            'ok' => true,
            'joinurl' => $joinurl,
            'role' => $role,
            'studentid' => $studentid,
            'status' => (string)$session->status,
            'tutorurl' => $tutorurl->out(false),
            'lessonurl' => $lessonurl->out(false),
            'materialsurl' => $materialsurl ? $materialsurl->out(false) : '',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: create (legacy action=create; single or recurring series) -------
    if ($do === 'create') {
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

    pqpd_fail(400, 'Unknown live-sessions action.');
}

// ---- GET: upcoming sessions (+ optional per-session roster detail) -----------
$detailid = optional_param('sessionid', 0, PARAM_INT);
$nameids = [];

$decorate = static function ($session) use ($userid, $USER, $pageworkspaceid) {
    $sessiontimezone = pqlsesl_valid_timezone((string)($session->timezone ?? ''));
    $sessionworkspaceid = (int)($session->workspaceid ?? 0);
    if ($sessionworkspaceid <= 0 && $pageworkspaceid > 0) {
        $sessionworkspaceid = $pageworkspaceid;
    }
    $session->status_label = pqlsesl_session_status_label((string)$session->status);
    $session->start_label = pqlsesl_format_session_datetime((int)$session->scheduled_start, $sessiontimezone);
    $session->end_label = pqlsesl_format_session_datetime((int)$session->scheduled_end, $sessiontimezone);
    $session->requires_approval = pqlsesl_session_requires_approval($session);
    $session->can_approve = pqlsesl_can_approve_live_session($userid, $sessionworkspaceid);
    $session->is_owner = (int)$session->teacherid === $userid;
    $session->can_start = $session->is_owner || is_siteadmin($USER);
    return $session;
};

$detail = null;
if ($detailid > 0) {
    $session = $DB->get_record('local_prequran_live_session', ['id' => $detailid], '*', IGNORE_MISSING);
    if (!$session) {
        pqpd_fail(404, 'This live session could not be found. It may have expired or been removed.');
    }
    if (!pqlsesl_user_can_view_session($session)) {
        pqpd_fail(403, 'You cannot view this live session.');
    }
    $session = $decorate($session);
    $nameids[] = (int)$session->teacherid;
    // Roster visibility mirrors the legacy owner/admin-only monitor + review
    // links: the session teacher, site admins, and academy-operations managers.
    $canroster = (int)$session->teacherid === $userid || is_siteadmin($USER) || pqh_can_manage_academy_operations($userid);
    $roster = [];
    if ($canroster) {
        $attendance = pqlsesl_table_exists('local_prequran_live_attendance')
            ? $DB->get_records('local_prequran_live_attendance', ['sessionid' => (int)$session->id], '',
                'studentid, attendance_status, participation_status, join_time, leave_time, technical_issue, notes, timemodified')
            : [];
        $participants = $DB->get_records('local_prequran_live_participant', ['sessionid' => (int)$session->id], 'role ASC, displayname ASC');
        foreach ($participants as $p) {
            $row = [
                'participantid' => (int)$p->id,
                'userid' => (int)$p->userid,
                'studentid' => (int)($p->studentid ?? 0),
                'role' => (string)$p->role,
                'displayname' => (string)$p->displayname,
                'status' => (string)$p->status,
                'attendance_status' => '',
                'participation_status' => '',
                'join_time' => 0,
                'leave_time' => 0,
                'technical_issue' => 0,
                'notes' => '',
            ];
            $a = $row['studentid'] > 0 && isset($attendance[$row['studentid']]) ? $attendance[$row['studentid']] : null;
            if ($a) {
                $row['attendance_status'] = (string)$a->attendance_status;
                $row['participation_status'] = (string)$a->participation_status;
                $row['join_time'] = (int)$a->join_time;
                $row['leave_time'] = (int)$a->leave_time;
                $row['technical_issue'] = (int)$a->technical_issue;
                $row['notes'] = (string)$a->notes;
            }
            $nameids[] = (int)$p->userid;
            $roster[] = $row;
        }
    }
    $detail = [
        'session' => $session,
        'roster' => $roster,
        'roster_available' => $canroster,
    ];
}

$sessions = array_map($decorate, pqlsesl_visible_sessions());
foreach ($sessions as $s) {
    $nameids[] = (int)$s->teacherid;
}

$teacherstudents = $cancreate && !is_siteadmin($USER) ? pqlsesl_teacher_students($userid) : [];
$classgroups = (is_siteadmin($USER) && pqlsesl_table_exists('local_prequran_class_group'))
    ? array_values($DB->get_records_select('local_prequran_class_group', "status IN ('open', 'active')", [], 'title ASC', 'id, title, status', 0, 100))
    : [];

echo json_encode([
    'ok' => true,
    'ready' => true,
    'brand' => $pqlbrandname,
    'workspaceid' => $pageworkspaceid,
    'userid' => $userid,
    'is_siteadmin' => is_siteadmin($USER),
    'canmanage' => $canmanage,
    'cancreate' => $cancreate,
    'canapprove' => $canapprove,
    'recordingdefault' => $recordingdefault,
    'series_ready' => pqlsesl_series_ready(),
    'default_timezone' => pqlsesl_default_schedule_timezone(),
    'teacherstudents' => $teacherstudents,
    'classgroups' => $classgroups,
    'upcoming' => array_values($sessions),
    'detail' => $detail,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
