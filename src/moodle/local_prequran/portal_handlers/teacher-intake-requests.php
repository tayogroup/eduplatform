<?php
// ---- report: teacher-intake-requests (admin review queue for teacher applications) ----
// Ported from local_hubredirect/teacher_intake_requests.php via
// teacher_intake_requests_portallib (pqtirql_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent.
// GET  = the consumer-scoped teacher-application queue (profile-merged display
//        values computed server-side, same helpers the page uses inline).
// POST = do=save_review (legacy action=save_review, verbatim: status whitelist,
//        admin notes, reviewer stamp, audit). confirm_sesskey() dropped: token
//        auth replaces the session key.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_intake_requests_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Legacy entry gate: pqh_require_academy_operations(...) — same check, JSON fail.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can review teacher applications.');
}

// Legacy readiness gate before both the POST branch and the queue render.
if (!pqtirql_table_exists('local_prequran_teacher_intake_request')) {
    echo json_encode(['ok' => true, 'ready' => false], JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: save_review (legacy action=save_review, verbatim) --
    if ($do === 'save_review') {
        $requestid = (int)($body['requestid'] ?? 0);
        $request = $requestid > 0
            ? $DB->get_record('local_prequran_teacher_intake_request', ['id' => $requestid], '*', IGNORE_MISSING)
            : false;
        if (!$request) {
            pqpd_fail(404, 'Choose a valid teacher application before saving a review.');
        }
        $status = clean_param((string)($body['status'] ?? ''), PARAM_ALPHANUMEXT);
        if (!array_key_exists($status, pqtirql_statuses())) {
            pqpd_fail(400, 'Invalid teacher application status.');
        }
        $request->status = $status;
        $request->admin_notes = trim(clean_param((string)($body['admin_notes'] ?? ''), PARAM_TEXT));
        $request->reviewedby = (int)$USER->id;
        $request->reviewedat = time();
        $request->timemodified = time();
        $DB->update_record('local_prequran_teacher_intake_request', $request);
        pqtirql_audit('teacher_intake_request_review_saved', $requestid, [
            'status' => $status,
        ]);
        echo json_encode([
            'ok' => true,
            'message' => 'Teacher application #' . $requestid . ' review saved.',
            'requestid' => $requestid,
            'status' => $status,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Choose a valid teacher application review action.');
}

// -- GET: the queue (legacy consumer scoping + ordering, verbatim SQL) --------
$consumercontext = pqh_requested_consumer_context();
$filterstatus = optional_param('status', '', PARAM_ALPHANUMEXT);
if ($filterstatus !== '' && !array_key_exists($filterstatus, pqtirql_statuses())) {
    $filterstatus = '';
}

$whereparts = [];
$params = [];
$consumerid = (int)($consumercontext->consumerid ?? 0);
$consumerslug = (string)($consumercontext->consumerslug ?? '');
$isplatformfoundation = $consumerslug === 'eduplatform'
    && (string)($consumercontext->consumer_type ?? '') === 'platform_foundation';
if ($consumerid > 0 && !$isplatformfoundation) {
    $scopeparts = ['r.consumerid = :consumerid'];
    $params['consumerid'] = $consumerid;
    $workspaceids = pqh_consumer_context_workspace_ids($consumercontext);
    if ($workspaceids) {
        [$insql, $inparams] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_NAMED, 'requestworkspace');
        $scopeparts[] = "(COALESCE(r.consumerid, 0) = 0 AND r.workspaceid {$insql})";
        $params += $inparams;
    }
    $whereparts[] = '(' . implode(' OR ', $scopeparts) . ')';
}

// Status chip counts over the scoped queue (before the chip filter applies).
$scopewhere = $whereparts ? 'WHERE ' . implode(' AND ', $whereparts) : '';
$statuscounts = array_fill_keys(array_keys(pqtirql_statuses()), 0);
foreach ($DB->get_records_sql(
    "SELECT r.status, COUNT(1) AS total
       FROM {local_prequran_teacher_intake_request} r
      {$scopewhere}
   GROUP BY r.status",
    $params
) as $row) {
    $statuscounts[(string)$row->status] = (int)$row->total;
}

$requestwhereparts = $whereparts;
$requestparams = $params;
if ($filterstatus !== '') {
    $requestwhereparts[] = 'r.status = :filterstatus';
    $requestparams['filterstatus'] = $filterstatus;
}
$where = $requestwhereparts ? 'WHERE ' . implode(' AND ', $requestwhereparts) : '';
$requests = array_values($DB->get_records_sql(
    "SELECT r.*, c.slug AS consumer_slug, c.name AS consumer_name, c.consumer_type
       FROM {local_prequran_teacher_intake_request} r
  LEFT JOIN {local_prequran_consumer} c ON c.id = r.consumerid
      {$where}
   ORDER BY CASE r.status
                WHEN 'new' THEN 1
                WHEN 'reviewing' THEN 2
                WHEN 'approved' THEN 3
                WHEN 'needs_update' THEN 4
                WHEN 'converted' THEN 5
                WHEN 'rejected' THEN 6
                ELSE 7
            END,
            r.timecreated DESC",
    $requestparams,
    0,
    100
));

// Decorate exactly as the page renders each card: profile-merged values, the
// application-JSON fallbacks, and the same pqtirql_short truncation limits.
$nameids = [];
$list = [];
foreach ($requests as $request) {
    $consumername = trim((string)($request->consumer_name ?? '')) ?: 'Unknown consumer';
    $display = pqtirql_request_with_profile_values($request);
    $application = pqtirql_application_json($display);
    $convertedid = (int)($request->converted_userid ?? 0);
    $reviewedby = (int)($request->reviewedby ?? 0);
    $nameids[] = $convertedid;
    $nameids[] = $reviewedby;
    $list[] = [
        'id' => (int)$request->id,
        'teacher_name' => (string)($display->teacher_name ?? ''),
        'timecreated' => (int)$request->timecreated,
        'consumer_name' => $consumername,
        'consumer_slug' => (string)($request->consumer_slug ?? ''),
        'workspaceid' => (int)($request->workspaceid ?? 0),
        'status' => (string)$request->status,
        'status_label' => pqtirql_status_label((string)$request->status),
        'status_tone' => trim(str_replace('pqtirq-pill--', '', pqtirql_status_class((string)$request->status))),
        'email' => (string)($display->email ?? ''),
        'phone' => (string)($display->phone ?? ''),
        'country' => (string)($display->country ?? ''),
        'city' => (string)($display->city ?? ''),
        'timezone' => (string)($display->timezone ?? ''),
        'primary_language' => (string)($display->primary_language ?? ''),
        'other_languages' => (string)($display->other_languages ?? ''),
        'work_models' => pqtirql_short(pqtirql_request_or_app($display, $application, 'teacher_work_models', 'teacher_work_models', 'teacher_work_model_labels')),
        'service_modes' => pqtirql_short(pqtirql_request_or_app($display, $application, 'service_modes', 'service_modes', 'service_mode_labels')),
        'subject_language' => pqtirql_short(pqtirql_request_or_app($display, $application, 'subject_language', 'subject_language', 'subject_language_label')),
        'other_subjects' => pqtirql_short(trim(pqtirql_request_or_app($display, $application, 'subject_areas', 'subject_areas', 'subject_area_labels') . ' ' . pqtirql_request_or_app($display, $application, 'subject_other')), 260),
        'learner_levels' => pqtirql_short(pqtirql_request_or_app($display, $application, 'age_groups', 'age_groups', 'age_group_labels')),
        'levels' => pqtirql_short(pqtirql_request_or_app($display, $application, 'general_levels', 'general_levels', 'general_level_labels') ?: (string)($display->levels ?? '')),
        'availability' => pqtirql_short((string)($display->availability_summary ?? ''), 260),
        'converted_userid' => $convertedid,
        'converted_profileid' => (int)($request->converted_profileid ?? 0),
        'account_label' => $convertedid > 0 ? pqh_account_no_label($convertedid) : '',
        'workspace_preferences' => pqtirql_short(pqtirql_request_or_app($display, $application, 'workspace_preferences'), 420),
        'years_experience' => pqtirql_request_or_app_int($display, $application, 'years_experience'),
        'institution_experience' => pqtirql_short(pqtirql_request_or_app($display, $application, 'institution_experience'), 420),
        'experience' => pqtirql_short((string)($display->experience ?? ''), 420),
        'education' => pqtirql_short((string)($display->education ?? ''), 260),
        'bio' => pqtirql_short((string)($display->bio ?? ''), 420),
        'desired_services' => pqtirql_short((string)($display->desired_services ?? ''), 260),
        'online_profile' => pqtirql_short(pqtirql_app_value($application, 'online_profile_name') ?: pqtirql_app_value($application, 'instagram_handle'), 220),
        'social_url' => pqtirql_short(pqtirql_app_value($application, 'social_profile_url'), 220),
        'website_url' => pqtirql_short(pqtirql_app_value($application, 'website_or_booking_url'), 220),
        'demo_url' => pqtirql_short(pqtirql_app_value($application, 'demo_video_url'), 220),
        'teaching_offer' => pqtirql_short(pqtirql_app_value($application, 'teaching_offer_summary'), 420),
        'learner_outcomes' => pqtirql_short(pqtirql_app_value($application, 'learner_outcomes'), 420),
        'curriculum_social' => pqtirql_short(trim(pqtirql_app_value($application, 'curriculum_materials') . "\n" . pqtirql_app_value($application, 'social_proof')), 420),
        'applicant_notes' => pqtirql_short((string)($display->notes ?? ''), 360),
        'admin_notes_short' => pqtirql_short((string)($display->admin_notes ?? ''), 260),
        'admin_notes' => (string)($request->admin_notes ?? ''),
        'reviewedby' => $reviewedby,
        'reviewedat' => (int)($request->reviewedat ?? 0),
        'intake_url' => (new moodle_url('/local/hubredirect/teacher_intake.php', pqtirql_intake_params($request)))->out(false),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'filters' => ['status' => $filterstatus],
    'statusoptions' => pqtirql_statuses(),
    'statuscounts' => $statuscounts,
    'requests' => $list,
    'links' => [
        'publicform' => pqh_consumer_url('/local/hubredirect/public_teacher_intake.php', $consumercontext)->out(false),
        'teacherintake' => (new moodle_url('/local/hubredirect/teacher_intake.php'))->out(false),
        'adminmenu' => (new moodle_url('/local/hubredirect/live_admin.php'))->out(false),
        'legacy' => (new moodle_url('/local/hubredirect/teacher_intake_requests.php'))->out(false),
    ],
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
