<?php
// ---- report: teacher-marketplace-admin (marketplace administration console) ----
// Ported from local_hubredirect/teacher_marketplace_admin.php via
// teacher_marketplace_admin_portallib (pqtmal_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent.
// GET  = the full admin console state (marketing drafts pending review,
//        marketplace profiles, academy vetting profiles, live-session requests
//        pending marketplace approval, parent requests with quick actions).
// POST = do=marketing_action (approve|reject, verbatim publish/sync/audit/pref)
//      | do=quick_update_request (one-click status move, verbatim incl. assign)
//      | do=update_request (full status + admin-notes save, verbatim incl.
//        assign). confirm_sesskey() dropped: token auth replaces the session
//        key. Legacy sets $error and re-renders on failure; here the same
//        message comes back as JSON via pqpd_fail.
// The approve_session / reject_session forms on the legacy page POST to
// live_sessions.php (a different page's writes) — NOT ported here; the portal
// links to the legacy live_sessions.php review URL instead.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_marketplace_admin_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Legacy entry gate: pqh_require_academy_operations(...) — same check, JSON fail.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can manage the teacher marketplace.');
}

// Legacy consumer-context resolution (computed before the POST branches, so the
// consumer scoping guards inside every write behave identically). The portal
// page passes ?consumer=… through on both GET and POST fetches.
$consumerfilter = trim(optional_param('consumer', '', PARAM_ALPHANUMEXT));
$currentconsumercontext = pqh_current_consumer_context();
$consumercontext = null;
if ($consumerfilter !== '') {
    $consumercontext = pqh_requested_consumer_context('consumer');
} else if (!pqh_context_is_platform_foundation($currentconsumercontext)) {
    $consumercontext = $currentconsumercontext;
}
$consumerparams = $consumercontext ? ['consumer' => (string)$consumercontext->consumerslug] : [];
if ($consumercontext && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $consumerparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
$pqtma_brand = $consumercontext ? trim((string)$consumercontext->consumername) : 'Academy';
if ($pqtma_brand === '') {
    $pqtma_brand = 'Academy';
}
$consumerfilterid = $consumercontext ? (int)$consumercontext->consumerid : 0;

$ready = pqtmal_ready();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: marketing_action (legacy marketing_action=approve|reject, verbatim) --
    if ($do === 'marketing_action') {
        try {
            $action = clean_param((string)($body['marketing_action'] ?? ''), PARAM_ALPHANUMEXT);
            if (!in_array($action, ['approve', 'reject'], true)) {
                throw new invalid_parameter_exception('Choose a valid marketing review action.');
            }
            $profileid = (int)($body['profileid'] ?? 0);
            $profile = $profileid > 0 ? $DB->get_record('local_prequran_teacher_profile', ['id' => $profileid], '*', IGNORE_MISSING) : false;
            if (!$profile) {
                throw new invalid_parameter_exception('Choose a valid teacher marketing profile.');
            }
            if ($consumerfilterid > 0 && pqtmal_column_exists('local_prequran_teacher_profile', 'consumerid')
                    && (int)$profile->consumerid !== $consumerfilterid) {
                throw new invalid_parameter_exception('This marketing profile does not belong to the selected consumer.');
            }
            $application = pqtmal_application($profile);
            $draft = pqtmal_marketing_draft($profile);
            if (!$draft || (string)($draft['review_status'] ?? '') !== 'pending_review') {
                throw new invalid_parameter_exception('This teacher has no pending marketing update.');
            }
            $reviewnote = trim(clean_param((string)($body['marketing_review_note'] ?? ''), PARAM_TEXT));
            $now = time();
            $auditaction = '';
            $message = '';
            if ($action === 'approve') {
                if ((string)$profile->status !== 'active' || (string)$profile->vetting_status !== 'approved') {
                    throw new invalid_parameter_exception('Only active, vetted teachers can publish marketing profiles.');
                }
                $profile->teacher_display_name = (string)($draft['display_name'] ?? $profile->teacher_display_name);
                $profile->marketplace_bio = (string)($draft['bio'] ?? '');
                $profile->marketplace_skills = (string)($draft['skills'] ?? '');
                $profile->marketplace_experience = (string)($draft['experience'] ?? '');
                $profile->marketplace_education = (string)($draft['education'] ?? '');
                $profile->marketplace_teaching_style = (string)($draft['teaching_style'] ?? '');
                $profile->marketplace_courses = (string)($draft['services'] ?? '');
                $profile->marketplace_status = 'published';
                $profile->marketplace_visible = 1;
                foreach ([
                    'social_media_handle',
                    'social_profile_url',
                    'website_or_booking_url',
                    'demo_video_url',
                    'learner_outcomes',
                    'curriculum_materials',
                    'pricing_summary',
                ] as $field) {
                    $application[$field] = (string)($draft[$field] ?? '');
                }
                $application['marketplace_marketing_last_review'] = [
                    'status' => 'approved',
                    'reviewed_by' => (int)$USER->id,
                    'reviewed_at' => $now,
                    'review_note' => $reviewnote,
                ];
                unset($application['marketplace_marketing_draft']);
                $message = 'Teacher marketing profile approved and published.';
                $auditaction = 'teacher_marketing_approved';
            } else {
                $draft['review_status'] = 'rejected';
                $draft['reviewed_by'] = (int)$USER->id;
                $draft['reviewed_at'] = $now;
                $draft['review_note'] = $reviewnote;
                $application['marketplace_marketing_draft'] = $draft;
                $message = 'Teacher marketing update returned for revision.';
                $auditaction = 'teacher_marketing_rejected';
            }
            $profile->application_json = json_encode($application, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $profile->timemodified = $now;
            $DB->update_record('local_prequran_teacher_profile', $profile);
            if ($action === 'approve') {
                pqtmal_sync_approved_marketing($profile, $draft, $reviewnote, $now);
            }
            pqtmal_audit($auditaction, (int)$profile->id, ['teacherid' => (int)$profile->userid, 'review_note' => $reviewnote]);
            $preferenceconsumerid = pqtmal_column_exists('local_prequran_teacher_profile', 'consumerid')
                ? (int)($profile->consumerid ?? 0)
                : $consumerfilterid;
            set_user_preference(
                pqtmal_marketing_preference_key($preferenceconsumerid),
                $action === 'approve' ? 'published' : 'rejected',
                (int)$profile->userid
            );
            echo json_encode([
                'ok' => true,
                'message' => $message,
                'profileid' => (int)$profile->id,
                'action' => $action,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            pqpd_fail(400, 'Marketing review failed: ' . $e->getMessage());
        }
    }

    // -- write: quick_update_request (legacy quick_update_request=1, verbatim) --
    if ($do === 'quick_update_request') {
        try {
            if (!$ready) {
                throw new invalid_parameter_exception('Teacher marketplace schema is not ready.');
            }
            $requestid = (int)($body['requestid'] ?? 0);
            $status = clean_param((string)($body['quick_request_status'] ?? ''), PARAM_ALPHANUMEXT);
            $quickstatuses = pqtmal_quick_request_statuses();
            if (!array_key_exists($status, $quickstatuses)) {
                throw new invalid_parameter_exception('Invalid quick request action.');
            }
            $request = $requestid > 0 ? $DB->get_record('local_prequran_teacher_request', ['id' => $requestid], '*', IGNORE_MISSING) : false;
            if (!$request) {
                throw new invalid_parameter_exception('Choose a valid teacher marketplace request.');
            }
            if (!pqtmal_request_transition_allowed((string)$request->request_status, $status)) {
                throw new invalid_parameter_exception('That status change is not allowed from the current request state.');
            }
            if ($consumerfilterid > 0 && pqtmal_column_exists('local_prequran_teacher_request', 'consumerid') && (int)$request->consumerid !== $consumerfilterid) {
                throw new invalid_parameter_exception('This request does not belong to the selected consumer.');
            }
            $existingnotes = trim((string)$request->admin_notes);
            $assignmentid = 0;
            if ($status === 'assigned') {
                $assignmentid = pqtmal_assign_teacher_request($request);
            }
            $noteline = userdate(time()) . ' - ' . fullname($USER) . ': ' . $quickstatuses[$status] . '.';
            if ($assignmentid > 0) {
                $noteline .= ' Teacher-student assignment #' . $assignmentid . ' active.';
            }
            $request->request_status = $status;
            $request->admin_notes = $existingnotes !== '' ? $existingnotes . "\n" . $noteline : $noteline;
            $request->reviewedby = (int)$USER->id;
            $request->reviewedat = time();
            $request->timemodified = time();
            $DB->update_record('local_prequran_teacher_request', $request);
            echo json_encode([
                'ok' => true,
                'message' => 'Teacher request moved to ' . pqtmal_request_status_label($status) . '.',
                'requestid' => $requestid,
                'status' => $status,
                'assignmentid' => $assignmentid,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            pqpd_fail(400, 'Quick request update failed: ' . $e->getMessage());
        }
    }

    // -- write: update_request (legacy update_request=1, verbatim) --
    if ($do === 'update_request') {
        try {
            if (!$ready) {
                throw new invalid_parameter_exception('Teacher marketplace schema is not ready.');
            }
            $requestid = (int)($body['requestid'] ?? 0);
            $status = clean_param((string)($body['request_status'] ?? ''), PARAM_ALPHANUMEXT);
            if (!array_key_exists($status, pqtmal_request_statuses())) {
                throw new invalid_parameter_exception('Invalid request status.');
            }
            $request = $requestid > 0 ? $DB->get_record('local_prequran_teacher_request', ['id' => $requestid], '*', IGNORE_MISSING) : false;
            if (!$request) {
                throw new invalid_parameter_exception('Choose a valid teacher marketplace request.');
            }
            if (!pqtmal_request_transition_allowed((string)$request->request_status, $status)) {
                throw new invalid_parameter_exception('That status change is not allowed from the current request state.');
            }
            if ($consumerfilterid > 0 && pqtmal_column_exists('local_prequran_teacher_request', 'consumerid') && (int)$request->consumerid !== $consumerfilterid) {
                throw new invalid_parameter_exception('This request does not belong to the selected consumer.');
            }
            $assignmentid = 0;
            if ($status === 'assigned') {
                $assignmentid = pqtmal_assign_teacher_request($request);
            }
            $request->request_status = $status;
            $adminnotes = trim(clean_param((string)($body['admin_notes'] ?? ''), PARAM_TEXT));
            if ($assignmentid > 0) {
                $assignmentline = userdate(time()) . ' - ' . fullname($USER) . ': Teacher-student assignment #' . $assignmentid . ' active.';
                $adminnotes = $adminnotes !== '' ? $adminnotes . "\n" . $assignmentline : $assignmentline;
            }
            $request->admin_notes = $adminnotes;
            $request->reviewedby = (int)$USER->id;
            $request->reviewedat = time();
            $request->timemodified = time();
            $DB->update_record('local_prequran_teacher_request', $request);
            echo json_encode([
                'ok' => true,
                'message' => 'Teacher request updated.',
                'requestid' => $requestid,
                'status' => $status,
                'assignmentid' => $assignmentid,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            pqpd_fail(400, 'Request update failed: ' . $e->getMessage());
        }
    }

    pqpd_fail(400, 'Unknown teacher-marketplace-admin action.');
}

// -- GET: the admin console state (legacy queries verbatim, then decorated the
// same way the page renders each table row) --------------------------------
if (!$ready) {
    echo json_encode([
        'ok' => true, 'ready' => false,
        'brand' => $pqtma_brand,
        'consumer' => $consumercontext ? [
            'slug' => (string)$consumercontext->consumerslug,
            'name' => (string)$consumercontext->consumername,
        ] : null,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

$profiles = [];
$academyprofiles = [];
$requests = [];
$livesessionrequests = [];
$marketingdrafts = [];

$profilewhere = '';
$profileparams = [];
$requestexistsconsumerwhere = '';
$requestexistsconsumerparams = [];
if ($consumerfilterid > 0 && pqtmal_column_exists('local_prequran_teacher_profile', 'consumerid')) {
    $profilewhere = ' AND tp.consumerid = :profileconsumerid';
    $profileparams['profileconsumerid'] = $consumerfilterid;
}
if ($consumerfilterid > 0 && pqtmal_column_exists('local_prequran_teacher_request', 'consumerid')) {
    $requestexistsconsumerwhere = ' AND tr.consumerid = :requestconsumerid';
    $requestexistsconsumerparams['requestconsumerid'] = $consumerfilterid;
}
$profiles = array_values($DB->get_records_sql(
    "SELECT tp.*, u.firstname, u.lastname, u.email, u.idnumber
       FROM {local_prequran_teacher_profile} tp
       JOIN {user} u ON u.id = tp.userid
      WHERE u.deleted = 0
        AND (
             tp.marketplace_visible = 1
          OR tp.marketplace_status <> :draftstatus
          OR tp.marketplace_bio <> ''
          OR tp.marketplace_skills <> ''
          OR tp.marketplace_experience <> ''
          OR tp.marketplace_education <> ''
          OR tp.marketplace_teaching_style <> ''
          OR tp.marketplace_courses <> ''
          OR tp.application_json LIKE :marketingdraft
          OR EXISTS (
                SELECT 1
                  FROM {local_prequran_teacher_request} tr
                 WHERE tr.teacherid = tp.userid
                   {$requestexistsconsumerwhere}
             )
        )
        {$profilewhere}
   ORDER BY tp.marketplace_status DESC, tp.vetting_status ASC, tp.timemodified DESC",
    ['draftstatus' => 'draft', 'marketingdraft' => '%marketplace_marketing_draft%'] + $profileparams + $requestexistsconsumerparams,
    0,
    300
));
foreach ($profiles as $profile) {
    $draft = pqtmal_marketing_draft($profile);
    if ($draft && (string)($draft['review_status'] ?? '') === 'pending_review') {
        $marketingdrafts[] = ['profile' => $profile, 'draft' => $draft];
    }
}
$academyprofiles = array_values($DB->get_records_sql(
    "SELECT tp.*, u.firstname, u.lastname, u.email, u.idnumber
       FROM {local_prequran_teacher_profile} tp
       JOIN {user} u ON u.id = tp.userid
      WHERE u.deleted = 0
        AND NOT (
             tp.marketplace_visible = 1
          OR tp.marketplace_status <> :draftstatus
          OR tp.marketplace_bio <> ''
          OR tp.marketplace_skills <> ''
          OR tp.marketplace_experience <> ''
          OR tp.marketplace_education <> ''
          OR tp.marketplace_teaching_style <> ''
          OR tp.marketplace_courses <> ''
          OR tp.application_json LIKE :marketingdraft
          OR EXISTS (
                SELECT 1
                  FROM {local_prequran_teacher_request} tr
                 WHERE tr.teacherid = tp.userid
                   {$requestexistsconsumerwhere}
             )
        )
        {$profilewhere}
   ORDER BY tp.vetting_status ASC, tp.timemodified DESC",
    ['draftstatus' => 'draft', 'marketingdraft' => '%marketplace_marketing_draft%'] + $profileparams + $requestexistsconsumerparams,
    0,
    300
));
$hasrequestconsumer = pqtmal_column_exists('local_prequran_teacher_request', 'consumerid');
$requestconsumerselect = $hasrequestconsumer ? ', c.slug AS consumer_slug, c.name AS consumer_name' : ", '' AS consumer_slug, '' AS consumer_name";
$requestconsumerjoin = $hasrequestconsumer ? 'LEFT JOIN {local_prequran_consumer} c ON c.id = tr.consumerid' : '';
$requestconsumerwhere = '';
$requestparams = [];
if ($consumerfilterid > 0 && $hasrequestconsumer) {
    $requestconsumerwhere = ' WHERE tr.consumerid = :consumerid';
    $requestparams['consumerid'] = $consumerfilterid;
}
$assignmentselect = pqtmal_table_exists('local_prequran_teacher_student')
    ? ", COALESCE((SELECT MAX(ts.id)
                     FROM {local_prequran_teacher_student} ts
                    WHERE ts.teacherid = tr.teacherid
                      AND ts.studentid = tr.studentid
                      AND ts.status = 'active'), 0) AS assignmentid,
         COALESCE((SELECT MAX(ts.workspaceid)
                     FROM {local_prequran_teacher_student} ts
                    WHERE ts.teacherid = tr.teacherid
                      AND ts.studentid = tr.studentid
                      AND ts.status = 'active'), 0) AS assignmentworkspaceid"
    : ', 0 AS assignmentid, 0 AS assignmentworkspaceid';
$requests = array_values($DB->get_records_sql(
    "SELECT tr.*, tp.teacher_display_name, tp.marketplace_status, tp.marketplace_visible, tp.vetting_status {$requestconsumerselect} {$assignmentselect}
       FROM {local_prequran_teacher_request} tr
  LEFT JOIN {local_prequran_teacher_profile} tp ON tp.userid = tr.teacherid
       {$requestconsumerjoin}
       {$requestconsumerwhere}
   ORDER BY tr.timecreated DESC",
    $requestparams,
    0,
    200
));

if (pqtmal_table_exists('local_prequran_live_session')) {
    $livewhere = ['ls.status = :livestatus'];
    $liveparams = ['livestatus' => 'pending_marketplace_approval'];
    if ($consumerfilterid > 0 && pqtmal_column_exists('local_prequran_teacher_profile', 'consumerid')) {
        $livewhere[] = 'EXISTS (
            SELECT 1
              FROM {local_prequran_teacher_profile} ltp
             WHERE ltp.userid = ls.teacherid
               AND ltp.consumerid = :liveconsumerid
        )';
        $liveparams['liveconsumerid'] = $consumerfilterid;
    }
    $livesessionrequests = array_values($DB->get_records_sql(
        "SELECT ls.*, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_live_session} ls
           JOIN {user} u ON u.id = ls.teacherid
          WHERE " . implode(' AND ', $livewhere) . "
       ORDER BY ls.timecreated ASC, ls.scheduled_start ASC",
        $liveparams,
        0,
        200
    ));
}

// Decorate exactly as the page renders each table row.
$nameids = [];

$draftlist = [];
foreach ($marketingdrafts as $item) {
    $profile = $item['profile'];
    $draft = $item['draft'];
    $draftsocialurl = pqtmal_public_url((string)($draft['social_profile_url'] ?? ''));
    $draftlist[] = [
        'profileid' => (int)$profile->id,
        'teacherid' => (int)$profile->userid,
        'display_name' => (string)($draft['display_name'] ?? pqtmal_user_name((int)$profile->userid)),
        'submitted_at' => (int)($draft['submitted_at'] ?? 0),
        'bio_short' => pqtmal_short((string)($draft['bio'] ?? ''), 300),
        'services_short' => pqtmal_short((string)($draft['services'] ?? ''), 220),
        'pricing_short' => pqtmal_short((string)($draft['pricing_summary'] ?? ''), 160),
        'social_url' => $draftsocialurl,
        'social_handle' => (string)($draft['social_media_handle'] ?? 'social profile'),
    ];
}

$profilelist = [];
foreach ($profiles as $profile) {
    $published = (int)$profile->marketplace_visible === 1 && (string)$profile->marketplace_status === 'published'
        && (string)$profile->vetting_status === 'approved' && (string)$profile->status === 'active';
    $profilelist[] = [
        'id' => (int)$profile->id,
        'userid' => (int)$profile->userid,
        'name' => trim((string)$profile->teacher_display_name) !== '' ? (string)$profile->teacher_display_name : fullname($profile),
        'account_label' => pqh_account_no_label($profile),
        'published' => $published,
        'marketplace_status' => (string)$profile->marketplace_status,
        'marketplace_visible' => (int)$profile->marketplace_visible,
        'vetting_status' => (string)$profile->vetting_status,
        'vetting_summary_short' => pqtmal_short((string)$profile->vetting_summary),
        'subjects_short' => pqtmal_short((string)$profile->courses_taught . ' ' . (string)$profile->marketplace_skills),
        'intake_url' => (new moodle_url('/local/hubredirect/teacher_intake.php', ['existing_teacherid' => (int)$profile->userid] + $consumerparams))->out(false),
        'public_url' => $published ? pqh_teacher_public_profile_url($profile, $consumercontext)->out(false) : '',
    ];
}

$academylist = [];
foreach ($academyprofiles as $profile) {
    $academylist[] = [
        'id' => (int)$profile->id,
        'userid' => (int)$profile->userid,
        'name' => trim((string)$profile->teacher_display_name) !== '' ? (string)$profile->teacher_display_name : fullname($profile),
        'account_label' => pqh_account_no_label($profile),
        'status' => (string)$profile->status,
        'vetting_status' => (string)$profile->vetting_status,
        'vetting_summary_short' => pqtmal_short((string)$profile->vetting_summary),
        'subjects_short' => pqtmal_short((string)$profile->courses_taught . ' ' . (string)$profile->levels_taught),
        'intake_url' => (new moodle_url('/local/hubredirect/teacher_intake.php', ['existing_teacherid' => (int)$profile->userid] + $consumerparams))->out(false),
    ];
}

$livelist = [];
foreach ($livesessionrequests as $session) {
    $sessionparams = $consumerparams;
    if ((int)($session->workspaceid ?? 0) > 0) {
        $sessionparams['workspaceid'] = (int)$session->workspaceid;
    }
    $sessionurl = new moodle_url('/local/hubredirect/live_sessions.php', $sessionparams);
    $livelist[] = [
        'id' => (int)$session->id,
        'teacherid' => (int)$session->teacherid,
        'teacher_name' => pqtmal_user_name((int)$session->teacherid),
        'students' => pqtmal_live_session_student_names((int)$session->id),
        'title' => (string)$session->title,
        'lessonid' => (string)$session->lessonid,
        'unitid' => (string)$session->unitid,
        'scheduled_start' => (int)$session->scheduled_start,
        'timezone' => (string)$session->timezone,
        'description_short' => pqtmal_short((string)$session->description, 260),
        // Approve/reject are live_sessions.php writes — review on the legacy page.
        'review_url' => $sessionurl->out(false),
    ];
}

$requestlist = [];
foreach ($requests as $request) {
    $requestcontextparams = pqtmal_request_context_params($request, $consumerparams);
    $studentworkspaceurl = pqtmal_student_workspace_url($request, $requestcontextparams);
    $status = (string)$request->request_status;
    $nameids[] = (int)($request->reviewedby ?? 0);
    $quickactions = [];
    foreach (pqtmal_quick_request_statuses_for($status) as $value => $label) {
        if ($status === $value) {
            continue;
        }
        $quickactions[] = ['value' => $value, 'label' => $label];
    }
    $allowedstatuses = [];
    foreach (pqtmal_request_statuses() as $value => $label) {
        if (!pqtmal_request_transition_allowed($status, $value)) {
            continue;
        }
        $allowedstatuses[] = ['value' => $value, 'label' => $label];
    }
    $canschedule = (int)($request->assignmentid ?? 0) > 0 && (int)$request->teacherid > 0 && (int)$request->studentid > 0;
    $requestlist[] = [
        'id' => (int)$request->id,
        'parent_name' => pqtmal_user_name((int)$request->parentid),
        'teacher_name' => trim((string)($request->teacher_display_name ?? '')) !== ''
            ? (string)$request->teacher_display_name
            : pqtmal_user_name((int)$request->teacherid),
        'student_name' => pqtmal_user_name((int)$request->studentid),
        'timecreated' => (int)$request->timecreated,
        'consumer_name' => (string)($request->consumer_name ?? ''),
        'message_short' => pqtmal_short((string)$request->message, 260),
        'thread_url' => (int)$request->threadid > 0
            ? (new moodle_url('/local/hubredirect/communications.php', $requestcontextparams + ['threadid' => (int)$request->threadid, 'opencomm' => 'messages']))->out(false)
            : '',
        'teacher_profile_url' => (new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', $requestcontextparams + ['teacherid' => (int)$request->teacherid]))->out(false),
        'status' => $status,
        'status_label' => pqtmal_request_status_label($status),
        'assignmentid' => (int)($request->assignmentid ?? 0),
        'admin_notes' => (string)$request->admin_notes,
        'admin_notes_short' => pqtmal_short((string)$request->admin_notes),
        'marketplace_status' => (string)($request->marketplace_status ?? ''),
        'vetting_status' => (string)($request->vetting_status ?? ''),
        'reviewedby' => (int)($request->reviewedby ?? 0),
        'reviewedat' => (int)($request->reviewedat ?? 0),
        'can_schedule' => $canschedule,
        'needs_student_link' => !$canschedule && $status === 'assigned',
        'series_url' => $canschedule ? pqtmal_live_series_url($request, $requestcontextparams)->out(false) : '',
        'onetime_url' => $canschedule ? pqtmal_one_time_session_url($request, $requestcontextparams)->out(false) : '',
        'workspace_url' => ($canschedule && $studentworkspaceurl) ? $studentworkspaceurl->out(false) : '',
        'calendar_url' => $canschedule
            ? (new moodle_url('/local/hubredirect/live_calendar.php', $requestcontextparams + ['childid' => (int)$request->studentid]))->out(false)
            : '',
        'messages_url' => $canschedule
            ? (new moodle_url('/local/hubredirect/communications.php', $requestcontextparams + ['studentid' => (int)$request->studentid, 'opencomm' => 'messages']))->out(false)
            : '',
        'quick_actions' => $quickactions,
        'allowed_statuses' => $allowedstatuses,
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'brand' => $pqtma_brand,
    'consumer' => $consumercontext ? [
        'slug' => (string)$consumercontext->consumerslug,
        'name' => (string)$consumercontext->consumername,
    ] : null,
    'marketingdrafts' => $draftlist,
    'profiles' => $profilelist,
    'academyprofiles' => $academylist,
    'livesessions' => $livelist,
    'requests' => $requestlist,
    'links' => [
        'legacy' => (new moodle_url('/local/hubredirect/teacher_marketplace_admin.php', $consumerparams))->out(false),
        'teacherintake' => (new moodle_url('/local/hubredirect/teacher_intake.php', $consumerparams))->out(false),
        'parentmarketplace' => (new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams))->out(false),
        'adminmenu' => (new moodle_url('/local/hubredirect/live_admin.php'))->out(false),
    ],
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
