<?php
// ---- report: live-create-wizard (guided session creation wizard) -------------
// Ported from local_hubredirect/live_create_wizard.php via
// live_create_wizard_portallib (pqlcwl_*), reusing the deployed pqlsesl_*
// library for everything the wizard shared with live_sessions.php. Dispatched
// from portal_data.php AFTER token auth: $claims is verified, $USER is the
// token user, JSON exception handler + CORS headers are installed. The legacy
// page stays live in parallel and is untouched.
//
// The legacy wizard keeps ALL its step state in GET params (no $SESSION, no
// per-step server writes): steps 1-5 are method="get" navigation, and the only
// write is the step-6 form POSTing action=create (+ created_from_wizard=1) to
// live_sessions.php. The portal page therefore holds the draft client-side and:
//
// GET  ?report=live-create-wizard&token=…[&workspaceid=&consumer=&teacherid=&
//      groupid=&studentids_raw=&title=&lessonid=&unitid=&sessiondate=&
//      sessiontime=&timezone=&duration=&session_type=&practice_access_mode=&
//      participantids_raw=]
//      -> wizard bootstrap (teachers, class groups, student picker profiles +
//         timezones, session-type/practice-mode option maps, weekday names,
//         defaults) plus the server-computed draft state the legacy page
//         derives from the same params (merged student ids + names, teacher
//         availability calendar, start timestamp/label, conflicts preview).
// POST body JSON {"do":"create", ...}
//      -> the legacy final submission verbatim: the exact live_sessions.php
//         action=create block (same validation order and messages, conflict
//         detection + override/exception audit, series branch, audits), with
//         confirm_sesskey dropped (token auth replaces the session key) and
//         the redirect replaced by {"ok":true, created, seriesid, sessionids,
//         approval, message}.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_sessions_portallib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_create_wizard_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// ---- entry access check (replicated from the legacy wizard preamble) ---------
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$pqlwizisadmin = is_siteadmin($USER) || pqh_can_manage_academy_operations($userid);
$resolvedworkspaceid = $requestedworkspaceid;
if ($resolvedworkspaceid <= 0 && !$pqlwizisadmin && pqh_has_independent_teacher_profile($userid)) {
    foreach (pqh_independent_teacher_workspace_ids($userid) as $independentworkspaceid) {
        if ($independentworkspaceid > 0) {
            $resolvedworkspaceid = (int)$independentworkspaceid;
            break;
        }
    }
}
if ($resolvedworkspaceid <= 0) {
    $resolvedworkspaceid = (int)($consumercontext->workspaceid ?? 0);
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($resolvedworkspaceid > 0) {
    $urlparams['workspaceid'] = $resolvedworkspaceid;
}
$pqlwizworkspaceid = (int)($urlparams['workspaceid'] ?? 0);
if (!$pqlwizisadmin && !pqh_user_can_create_live_sessions($userid, $pqlwizworkspaceid)) {
    pqpd_fail(403, 'Only approved teachers and administrators can use the guided live-session wizard.');
}

// The legacy step-6 form POSTs to live_sessions.php, whose preamble resolves
// $pageworkspaceid (param -> consumer context -> teacher workspaces). The
// wizard passes its resolved workspaceid in that POST, so composing the two
// chains reproduces the real request flow. $pageworkspaceid is a page global
// read by pqlsesl_visible_sessions(); this handler runs at file top level, so
// the plain assignment satisfies that contract.
$pageworkspaceid = $pqlwizworkspaceid;
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

    pqpd_fail(400, 'Unknown live-create-wizard action.');
}

// ---- GET: wizard bootstrap + server-computed draft state ---------------------
// Same param intake and derivations as the legacy page preamble; the portal
// page carries the draft between steps client-side and re-requests this to
// refresh group-merged student ids, availability, and the conflicts preview.
$tablesready = pqlsesl_table_exists('local_prequran_live_session')
    && pqlsesl_table_exists('local_prequran_live_participant');

$teacherid = $pqlwizisadmin ? optional_param('teacherid', 0, PARAM_INT) : $userid;
$groupid = optional_param('groupid', 0, PARAM_INT);
$studentraw = trim(optional_param('studentids_raw', '', PARAM_TEXT));
$workspaceid = $pqlwizworkspaceid;
$studentids = array_values(array_unique(array_merge(pqlcwl_group_student_ids($groupid, $workspaceid), pqlcwl_parse_students($studentraw))));
$title = trim(optional_param('title', 'Pre-Quran review session', PARAM_TEXT));
$lessonid = trim(optional_param('lessonid', 'alphabet', PARAM_TEXT));
$unitid = trim(optional_param('unitid', 'alphabet_listen', PARAM_TEXT));
$sessiondate = optional_param('sessiondate', '', PARAM_TEXT);
$sessiontime = optional_param('sessiontime', '', PARAM_TEXT);
$timezone = pqlsesl_valid_timezone(optional_param('timezone', pqlsesl_default_schedule_timezone(), PARAM_TEXT));
$duration = max(15, min(240, optional_param('duration', 60, PARAM_INT)));
$sessiontype = pqlcwl_normalize_session_type(optional_param('session_type', 'teacher_led', PARAM_ALPHANUMEXT));
$teacherrequired = !in_array($sessiontype, ['supervised_practice', 'parent_meeting'], true);
$meetingroom = pqlcwl_session_is_meeting_type($sessiontype);
$practiceaccessmode = pqlcwl_normalize_practice_access_mode(optional_param('practice_access_mode', 'bbb_and_lesson', PARAM_ALPHANUMEXT));
$participantidsraw = trim(optional_param('participantids_raw', '', PARAM_TEXT));
$datevalue = pqlcwl_clean_date($sessiondate, 0);
$start = pqlsesl_parse_local_datetime($sessiondate, $sessiontime, $timezone);
$conflicts = $tablesready ? pqlcwl_conflicts($teacherid, $studentids, $start, $duration, $teacherrequired, $workspaceid) : [];
$teachers = $pqlwizisadmin
    ? pqlcwl_teacher_candidates($workspaceid)
    : [['id' => $userid, 'name' => pqlcwl_user_name($userid, 'Teacher ' . $userid)]];
$classgroups = pqlcwl_class_groups($workspaceid);
$studentnames = pqlcwl_student_names($studentids);
$pickerteacherid = $meetingroom ? 0 : ($pqlwizisadmin ? $teacherid : $userid);
$studentprofiles = pqlcwl_student_picker_profiles($workspaceid, $pickerteacherid);
$studenttimezones = pqlcwl_student_picker_timezones($studentprofiles);

// Flatten the picker profiles into the roster rows the legacy table renders
// (same columns and the same lowercased data-* filter/search text).
$profilesout = [];
foreach ($studentprofiles as $profile) {
    $profileuserid = (int)$profile->userid;
    $studentname = pqlcwl_student_picker_name($profile);
    $language = pqlcwl_profile_field($profile, 'primary_language') ?: pqlcwl_profile_field($profile, 'language');
    $rowtext = strtolower(implode(' ', [
        $studentname,
        (string)$profileuserid,
        pqlcwl_profile_field($profile, 'idnumber'),
        pqlcwl_profile_field($profile, 'username'),
        pqlcwl_profile_field($profile, 'city'),
        pqlcwl_profile_field($profile, 'country'),
        pqlcwl_profile_field($profile, 'current_level'),
        $language,
    ]));
    $profilesout[] = [
        'userid' => $profileuserid,
        'name' => $studentname,
        'account_label' => pqh_account_no_label($profileuserid),
        'age_years' => (int)$profile->age_years,
        'gender' => pqlcwl_profile_field($profile, 'gender'),
        'level' => pqlcwl_profile_field($profile, 'current_level'),
        'language' => $language,
        'timezone' => pqlcwl_profile_field($profile, 'timezone'),
        'city' => pqlcwl_profile_field($profile, 'city'),
        'country' => pqlcwl_profile_field($profile, 'country'),
        'live_class_consent' => !empty($profile->live_class_consent),
        'recording_consent' => !empty($profile->recording_consent),
        'search' => $rowtext,
    ];
}

// Session-type and practice-mode option maps (labels + per-type wizard help,
// via the extracted legacy helpers, so the page mirrors the exact wording).
$sessiontypesout = [];
foreach (['teacher_led', 'supervised_practice', 'parent_meeting', 'teacher_meeting', 'student_room', 'teacher_parent_room'] as $type) {
    $sessiontypesout[] = [
        'value' => $type,
        'label' => pqlcwl_session_type_label($type),
        'meeting' => pqlcwl_session_is_meeting_type($type),
        'teacherrequired' => !in_array($type, ['supervised_practice', 'parent_meeting'], true),
        'owner_label' => pqlcwl_room_owner_label($type),
        'detail_help' => pqlcwl_room_detail_help($type),
        'owner_help' => pqlcwl_room_owner_help($type),
    ];
}
$practicemodesout = [];
foreach (['bbb_and_lesson', 'lesson_only'] as $mode) {
    $practicemodesout[] = ['value' => $mode, 'label' => pqlcwl_practice_access_label($mode)];
}

$availability = [
    'teacherid' => $teacherid,
    'teacher_name' => $teacherid > 0 ? pqlcwl_user_name($teacherid, 'Teacher ' . $teacherid) : '',
    'calendar' => pqlcwl_teacher_availability($teacherid),
    'selected_weekday' => $datevalue > 0 ? (int)date('w', $datevalue) : -1,
    'manage_url' => $teacherid > 0
        ? (new moodle_url('/local/hubredirect/live_availability.php', pqlcwl_url_params($urlparams, ['teacherid' => $teacherid])))->out(false)
        : '',
];

$classgroupsout = [];
foreach ($classgroups as $group) {
    $classgroupsout[] = ['id' => (int)$group->id, 'title' => (string)$group->title, 'status' => (string)$group->status];
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'userid' => $userid,
    'isadmin' => $pqlwizisadmin,
    'workspaceid' => $workspaceid,
    'tables_ready' => $tablesready,
    'tables_message' => $tablesready ? '' : 'Live-session tables are required before using the wizard.',
    'cancreate' => $cancreate,
    'recordingdefault' => $recordingdefault,
    'default_timezone' => pqlsesl_default_schedule_timezone(),
    'durations' => [45, 60, 75, 90],
    'weekdays' => pqlcwl_weekdays(),
    'session_types' => $sessiontypesout,
    'practice_modes' => $practicemodesout,
    'teachers' => $teachers,
    'classgroups' => $classgroupsout,
    'studentprofiles' => $profilesout,
    'studenttimezones' => array_values($studenttimezones),
    'availability' => $availability,
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
        'timezone' => $timezone,
        'duration' => $duration,
        'session_type' => $sessiontype,
        'session_type_label' => pqlcwl_session_type_label($sessiontype),
        'teacherrequired' => $teacherrequired,
        'meetingroom' => $meetingroom,
        'owner_label' => pqlcwl_room_owner_label($sessiontype),
        'owner_help' => pqlcwl_room_owner_help($sessiontype),
        'detail_help' => pqlcwl_room_detail_help($sessiontype),
        'practice_access_mode' => $practiceaccessmode,
        'practice_access_label' => pqlcwl_practice_access_label($practiceaccessmode),
        'participantids_raw' => $participantidsraw,
        'start' => $start,
        'start_label' => $start > 0 ? pqlcwl_format_datetime($start, $timezone) : '',
        'conflicts' => $conflicts,
    ],
    'names' => pqpd_names(array_merge([$teacherid], $studentids)),
], JSON_UNESCAPED_SLASHES);
exit;
