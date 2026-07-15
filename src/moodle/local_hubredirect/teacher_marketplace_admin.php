<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

pqh_require_academy_operations('Only academy operations users can manage the teacher marketplace.');

function pqtma_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtma_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtma_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqtma_ready(): bool {
    return pqtma_table_exists('local_prequran_teacher_profile')
        && pqtma_table_exists('local_prequran_teacher_request')
        && pqtma_column_exists('local_prequran_teacher_profile', 'marketplace_visible')
        && pqtma_column_exists('local_prequran_teacher_profile', 'marketplace_status')
        && pqtma_column_exists('local_prequran_teacher_profile', 'vetting_status');
}

function pqtma_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : ($userid > 0 ? 'User ' . $userid : 'Not selected');
}

function pqtma_live_session_student_names(int $sessionid): array {
    global $DB;
    if ($sessionid <= 0 || !pqtma_table_exists('local_prequran_live_participant')) {
        return [];
    }
    $rows = $DB->get_records('local_prequran_live_participant', [
        'sessionid' => $sessionid,
        'role' => 'student',
        'status' => 'active',
    ], 'id ASC', 'id,userid');
    $names = [];
    foreach ($rows as $row) {
        $studentid = (int)$row->userid;
        if ($studentid > 0) {
            $names[$studentid] = pqtma_user_name($studentid);
        }
    }
    return array_values($names);
}

function pqtma_short(string $value, int $max = 120): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqtma_application(stdClass $profile): array {
    $decoded = json_decode((string)($profile->application_json ?? ''), true);
    return is_array($decoded) ? $decoded : [];
}

function pqtma_marketing_draft(stdClass $profile): array {
    $application = pqtma_application($profile);
    $draft = $application['marketplace_marketing_draft'] ?? [];
    if (!is_array($draft)) {
        return [];
    }
    $lastreview = $application['marketplace_marketing_last_review'] ?? [];
    if ($draft && is_array($lastreview)
            && in_array((string)($lastreview['status'] ?? ''), ['approved', 'published'], true)) {
        $approved = [
            'display_name' => (string)($profile->teacher_display_name ?? ''),
            'bio' => (string)($profile->marketplace_bio ?? ''),
            'skills' => (string)($profile->marketplace_skills ?? ''),
            'experience' => (string)($profile->marketplace_experience ?? ''),
            'education' => (string)($profile->marketplace_education ?? ''),
            'teaching_style' => (string)($profile->marketplace_teaching_style ?? ''),
            'services' => (string)($profile->marketplace_courses ?? ''),
            'social_media_handle' => (string)($application['social_media_handle'] ?? ''),
            'social_profile_url' => (string)($application['social_profile_url'] ?? ''),
            'website_or_booking_url' => (string)($application['website_or_booking_url'] ?? ''),
            'demo_video_url' => (string)($application['demo_video_url'] ?? ''),
            'learner_outcomes' => (string)($application['learner_outcomes'] ?? ''),
            'curriculum_materials' => (string)($application['curriculum_materials'] ?? ''),
            'pricing_summary' => (string)($application['pricing_summary'] ?? ''),
        ];
        $matches = true;
        foreach ($approved as $field => $value) {
            if (trim((string)($draft[$field] ?? '')) !== trim($value)) {
                $matches = false;
                break;
            }
        }
        if ($matches) {
            return [];
        }
    }
    return $draft;
}

function pqtma_public_url(string $value): string {
    $value = trim($value);
    if (!filter_var($value, FILTER_VALIDATE_URL)) {
        return '';
    }
    return in_array(strtolower((string)parse_url($value, PHP_URL_SCHEME)), ['http', 'https'], true) ? $value : '';
}

function pqtma_marketing_preference_key(int $consumerid): string {
    return 'local_hubredirect_mktstatus_' . max(0, $consumerid);
}

function pqtma_apply_approved_marketing(stdClass $profile, array $draft, string $reviewnote, int $reviewerid, int $now): stdClass {
    $application = pqtma_application($profile);
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
        'reviewed_by' => $reviewerid,
        'reviewed_at' => $now,
        'review_note' => $reviewnote,
    ];
    unset($application['marketplace_marketing_draft']);
    $profile->application_json = json_encode($application, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $profile->timemodified = $now;
    return $profile;
}

function pqtma_sync_approved_marketing(stdClass $approvedprofile, array $draft, string $reviewnote, int $now): void {
    global $DB, $USER;
    $conditions = ['userid' => (int)$approvedprofile->userid];
    if (pqtma_column_exists('local_prequran_teacher_profile', 'consumerid')) {
        $conditions['consumerid'] = (int)($approvedprofile->consumerid ?? 0);
    }
    foreach ($DB->get_records('local_prequran_teacher_profile', $conditions) as $profile) {
        if ((int)$profile->id === (int)$approvedprofile->id || (string)($profile->status ?? '') !== 'active') {
            continue;
        }
        $profile = pqtma_apply_approved_marketing($profile, $draft, $reviewnote, (int)$USER->id, $now);
        $DB->update_record('local_prequran_teacher_profile', $profile);
    }
}

function pqtma_audit(string $action, int $profileid, array $details = []): void {
    global $DB, $USER;
    if (!pqtma_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'teacher_profile',
        'targetid' => $profileid,
        'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
    ]);
}

function pqtma_schedule_title(stdClass $request): string {
    $teachername = trim((string)($request->teacher_display_name ?? ''));
    if ($teachername === '') {
        $teachername = pqtma_user_name((int)$request->teacherid);
    }

    $studentname = pqtma_user_name((int)$request->studentid);
    $consumername = trim((string)($request->consumer_name ?? ''));
    if ($consumername === '') {
        $consumername = 'Marketplace';
    }

    return pqtma_short($consumername . ' class: ' . $teachername . ' and ' . $studentname, 180);
}

function pqtma_request_context_params(stdClass $request, array $fallbackparams): array {
    $params = $fallbackparams;
    if (trim((string)($request->consumer_slug ?? '')) !== '') {
        $params['consumer'] = (string)$request->consumer_slug;
    }
    if ((int)($request->assignmentworkspaceid ?? 0) > 0) {
        $params['workspaceid'] = (int)$request->assignmentworkspaceid;
    }
    return $params;
}

function pqtma_live_series_url(stdClass $request, array $contextparams = []): moodle_url {
    return new moodle_url('/local/hubredirect/live_series_wizard.php', $contextparams + [
        'step' => 3,
        'teacherid' => (int)$request->teacherid,
        'studentids_raw' => (string)(int)$request->studentid,
        'title' => pqtma_schedule_title($request),
        'recording_enabled' => 1,
    ]);
}

function pqtma_one_time_session_url(stdClass $request, array $contextparams = []): moodle_url {
    return new moodle_url('/local/hubredirect/live_sessions.php', $contextparams + [
        'teacherid' => (int)$request->teacherid,
        'studentids_raw' => (string)(int)$request->studentid,
        'title' => pqtma_schedule_title($request),
        'recording_enabled' => 1,
    ]);
}

function pqtma_student_workspace_url(stdClass $request, array $contextparams = []): ?moodle_url {
    $workspaceid = (int)($request->assignmentworkspaceid ?? 0);
    if ($workspaceid <= 0 || (int)$request->studentid <= 0) {
        return null;
    }

    return new moodle_url('/local/hubredirect/workspace_student.php', $contextparams + [
        'workspaceid' => $workspaceid,
        'studentid' => (int)$request->studentid,
    ]);
}

function pqtma_request_statuses(): array {
    return [
        'enrollment_submitted' => 'Enrollment submitted',
        'new' => 'New message',
        'selection_requested' => 'Selection requested',
        'academy_review' => 'Platform review',
        'teacher_contacted' => 'Teacher contacted',
        'parent_confirmed' => 'Parent confirmed',
        'matched' => 'Matched',
        'contacted' => 'Contacted',
        'shortlisted' => 'Shortlisted',
        'assigned' => 'Assigned',
        'declined' => 'Declined',
        'closed' => 'Closed',
    ];
}

function pqtma_request_status_label(string $status): string {
    $statuses = pqtma_request_statuses();
    return $statuses[$status] ?? $status;
}

function pqtma_quick_request_statuses(): array {
    return [
        'academy_review' => 'Start review',
        'teacher_contacted' => 'Contact teacher',
        'parent_confirmed' => 'Parent confirmed',
        'matched' => 'Mark matched',
        'assigned' => 'Assign',
        'closed' => 'Close',
        'declined' => 'Decline',
    ];
}

function pqtma_request_transition_allowed(string $from, string $to): bool {
    if ($from === $to) {
        return true;
    }
    if ($from === 'assigned') {
        return $to === 'closed';
    }
    if (in_array($from, ['closed', 'declined'], true)) {
        return $to === 'academy_review';
    }
    return true;
}

function pqtma_quick_request_statuses_for(string $status): array {
    if ($status === 'assigned') {
        return ['closed' => 'Close'];
    }
    if (in_array($status, ['closed', 'declined'], true)) {
        return ['academy_review' => 'Reopen review'];
    }
    return pqtma_quick_request_statuses();
}

function pqtma_assignment_workspaceid(stdClass $request): int {
    global $DB;

    foreach (pqh_independent_teacher_workspace_ids((int)$request->teacherid) as $workspaceid) {
        if ($workspaceid > 0) {
            return (int)$workspaceid;
        }
    }

    if (pqtma_column_exists('local_prequran_teacher_request', 'consumerid') && !empty($request->consumerid)
        && pqtma_table_exists('local_prequran_consumer')) {
        $workspaceid = (int)$DB->get_field('local_prequran_consumer', 'primaryworkspaceid', ['id' => (int)$request->consumerid], IGNORE_MISSING);
        if ($workspaceid > 0) {
            return $workspaceid;
        }
    }

    if ((int)$request->studentid > 0 && pqtma_table_exists('local_prequran_student_profile')
        && pqtma_column_exists('local_prequran_student_profile', 'workspaceid')) {
        $workspaceid = (int)$DB->get_field('local_prequran_student_profile', 'workspaceid', ['userid' => (int)$request->studentid], IGNORE_MISSING);
        if ($workspaceid > 0) {
            return $workspaceid;
        }
    }

    return 0;
}

function pqtma_upsert_workspace_member(int $workspaceid, int $userid, string $role, string $note): void {
    global $DB, $USER;
    if ($workspaceid <= 0 || $userid <= 0 || !pqtma_table_exists('local_prequran_workspace_member')) {
        return;
    }

    $now = time();
    $conditions = [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ];
    $existing = $DB->get_record('local_prequran_workspace_member', $conditions, '*', IGNORE_MISSING);
    if ($existing) {
        $existing->status = 'active';
        $existing->notes = trim((string)($existing->notes ?? '')) !== '' ? $existing->notes : $note;
        $existing->timemodified = $now;
        $DB->update_record('local_prequran_workspace_member', $existing);
        return;
    }

    $DB->insert_record('local_prequran_workspace_member', (object)[
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
        'status' => 'active',
        'notes' => $note,
        'createdby' => (int)$USER->id,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqtma_assign_teacher_request(stdClass $request): int {
    global $DB, $USER;

    if (!pqtma_table_exists('local_prequran_teacher_student')) {
        throw new invalid_parameter_exception('Teacher-student assignment table is not ready.');
    }
    if ((int)$request->teacherid <= 0) {
        throw new invalid_parameter_exception('This request does not have a teacher.');
    }
    if ((int)$request->studentid <= 0) {
        throw new invalid_parameter_exception('Assignment requires a linked student. Create/link a student intake first, then assign again.');
    }
    if ((int)$request->parentid > 0
            && !in_array((string)$request->request_status, ['parent_confirmed', 'matched', 'assigned'], true)) {
        throw new invalid_parameter_exception('The linked parent or guardian must confirm this connection before assignment.');
    }

    $workspaceid = pqtma_assignment_workspaceid($request);
    if ($workspaceid <= 0) {
        throw new invalid_parameter_exception('Could not resolve a workspace for this assignment.');
    }

    $transaction = $DB->start_delegated_transaction();
    $now = time();
    $conditions = [
        'workspaceid' => $workspaceid,
        'teacherid' => (int)$request->teacherid,
        'studentid' => (int)$request->studentid,
    ];
    $existing = $DB->get_record('local_prequran_teacher_student', $conditions, '*', IGNORE_MISSING);
    $record = (object)[
        'workspaceid' => $workspaceid,
        'teacherid' => (int)$request->teacherid,
        'studentid' => (int)$request->studentid,
        'cohortid' => 0,
        'status' => 'active',
        'assignedby' => (int)$USER->id,
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_teacher_student', $record);
        $assignmentid = (int)$existing->id;
    } else {
        $record->timecreated = $now;
        $assignmentid = (int)$DB->insert_record('local_prequran_teacher_student', $record);
    }

    pqtma_upsert_workspace_member($workspaceid, (int)$request->teacherid, 'teacher', 'Independent teacher assignment approved by marketplace operations.');
    pqtma_upsert_workspace_member($workspaceid, (int)$request->studentid, 'student', 'Student connection approved by marketplace operations.');
    if ((int)$request->parentid > 0) {
        pqtma_upsert_workspace_member($workspaceid, (int)$request->parentid, 'parent', 'Guardian linked through approved teacher-student connection.');
    }

    $transaction->allow_commit();
    return $assignmentid;
}

$context = context_system::instance();
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
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_marketplace_admin.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Marketplace Admin');
$PAGE->set_heading('Teacher Marketplace Admin');
$PAGE->add_body_class('pqh-teacher-marketplace-admin-page');

$ready = pqtma_ready();
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('marketing_action', '', PARAM_ALPHANUMEXT) !== '') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This marketing review form expired. Please refresh and try again.');
        }
        $action = optional_param('marketing_action', '', PARAM_ALPHANUMEXT);
        if (!in_array($action, ['approve', 'reject'], true)) {
            throw new invalid_parameter_exception('Choose a valid marketing review action.');
        }
        $profileid = optional_param('profileid', 0, PARAM_INT);
        $profile = $profileid > 0 ? $DB->get_record('local_prequran_teacher_profile', ['id' => $profileid], '*', IGNORE_MISSING) : false;
        if (!$profile) {
            throw new invalid_parameter_exception('Choose a valid teacher marketing profile.');
        }
        if ($consumerfilterid > 0 && pqtma_column_exists('local_prequran_teacher_profile', 'consumerid')
                && (int)$profile->consumerid !== $consumerfilterid) {
            throw new invalid_parameter_exception('This marketing profile does not belong to the selected consumer.');
        }
        $application = pqtma_application($profile);
        $draft = pqtma_marketing_draft($profile);
        if (!$draft || (string)($draft['review_status'] ?? '') !== 'pending_review') {
            throw new invalid_parameter_exception('This teacher has no pending marketing update.');
        }
        $reviewnote = trim(optional_param('marketing_review_note', '', PARAM_TEXT));
        $now = time();
        $auditaction = '';
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
            pqtma_sync_approved_marketing($profile, $draft, $reviewnote, $now);
        }
        pqtma_audit($auditaction, (int)$profile->id, ['teacherid' => (int)$profile->userid, 'review_note' => $reviewnote]);
        $preferenceconsumerid = pqtma_column_exists('local_prequran_teacher_profile', 'consumerid')
            ? (int)($profile->consumerid ?? 0)
            : $consumerfilterid;
        set_user_preference(
            pqtma_marketing_preference_key($preferenceconsumerid),
            $action === 'approve' ? 'published' : 'rejected',
            (int)$profile->userid
        );
    } catch (Throwable $e) {
        $error = 'Marketing review failed: ' . $e->getMessage();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('quick_update_request', '', PARAM_TEXT) === '1') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This marketplace request form expired. Please refresh and try again.');
        }
        if (!$ready) {
            throw new invalid_parameter_exception('Teacher marketplace schema is not ready.');
        }
        $requestid = optional_param('requestid', 0, PARAM_INT);
        $status = optional_param('quick_request_status', '', PARAM_ALPHANUMEXT);
        $quickstatuses = pqtma_quick_request_statuses();
        if (!array_key_exists($status, $quickstatuses)) {
            throw new invalid_parameter_exception('Invalid quick request action.');
        }
        $request = $requestid > 0 ? $DB->get_record('local_prequran_teacher_request', ['id' => $requestid], '*', IGNORE_MISSING) : false;
        if (!$request) {
            throw new invalid_parameter_exception('Choose a valid teacher marketplace request.');
        }
        if (!pqtma_request_transition_allowed((string)$request->request_status, $status)) {
            throw new invalid_parameter_exception('That status change is not allowed from the current request state.');
        }
        if ($consumerfilterid > 0 && pqtma_column_exists('local_prequran_teacher_request', 'consumerid') && (int)$request->consumerid !== $consumerfilterid) {
            throw new invalid_parameter_exception('This request does not belong to the selected consumer.');
        }
        $existingnotes = trim((string)$request->admin_notes);
        $assignmentid = 0;
        if ($status === 'assigned') {
            $assignmentid = pqtma_assign_teacher_request($request);
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
        $message = 'Teacher request moved to ' . pqtma_request_status_label($status) . '.';
    } catch (Throwable $e) {
        $error = 'Quick request update failed: ' . $e->getMessage();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('update_request', '', PARAM_TEXT) === '1') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This marketplace request form expired. Please refresh and try again.');
        }
        if (!$ready) {
            throw new invalid_parameter_exception('Teacher marketplace schema is not ready.');
        }
        $requestid = optional_param('requestid', 0, PARAM_INT);
        $status = optional_param('request_status', '', PARAM_ALPHANUMEXT);
        if (!array_key_exists($status, pqtma_request_statuses())) {
            throw new invalid_parameter_exception('Invalid request status.');
        }
        $request = $requestid > 0 ? $DB->get_record('local_prequran_teacher_request', ['id' => $requestid], '*', IGNORE_MISSING) : false;
        if (!$request) {
            throw new invalid_parameter_exception('Choose a valid teacher marketplace request.');
        }
        if (!pqtma_request_transition_allowed((string)$request->request_status, $status)) {
            throw new invalid_parameter_exception('That status change is not allowed from the current request state.');
        }
        if ($consumerfilterid > 0 && pqtma_column_exists('local_prequran_teacher_request', 'consumerid') && (int)$request->consumerid !== $consumerfilterid) {
            throw new invalid_parameter_exception('This request does not belong to the selected consumer.');
        }
        $assignmentid = 0;
        if ($status === 'assigned') {
            $assignmentid = pqtma_assign_teacher_request($request);
        }
        $request->request_status = $status;
        $adminnotes = trim(optional_param('admin_notes', '', PARAM_TEXT));
        if ($assignmentid > 0) {
            $assignmentline = userdate(time()) . ' - ' . fullname($USER) . ': Teacher-student assignment #' . $assignmentid . ' active.';
            $adminnotes = $adminnotes !== '' ? $adminnotes . "\n" . $assignmentline : $assignmentline;
        }
        $request->admin_notes = $adminnotes;
        $request->reviewedby = (int)$USER->id;
        $request->reviewedat = time();
        $request->timemodified = time();
        $DB->update_record('local_prequran_teacher_request', $request);
        $message = 'Teacher request updated.';
    } catch (Throwable $e) {
        $error = 'Request update failed: ' . $e->getMessage();
    }
}

$profiles = [];
$academyprofiles = [];
$requests = [];
$livesessionrequests = [];
$marketingdrafts = [];
if ($ready) {
    $profilewhere = '';
    $profileparams = [];
    $requestexistsconsumerwhere = '';
    $requestexistsconsumerparams = [];
    if ($consumerfilterid > 0 && pqtma_column_exists('local_prequran_teacher_profile', 'consumerid')) {
        $profilewhere = ' AND tp.consumerid = :profileconsumerid';
        $profileparams['profileconsumerid'] = $consumerfilterid;
    }
    if ($consumerfilterid > 0 && pqtma_column_exists('local_prequran_teacher_request', 'consumerid')) {
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
        $draft = pqtma_marketing_draft($profile);
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
    $hasrequestconsumer = pqtma_column_exists('local_prequran_teacher_request', 'consumerid');
    $requestconsumerselect = $hasrequestconsumer ? ', c.slug AS consumer_slug, c.name AS consumer_name' : ", '' AS consumer_slug, '' AS consumer_name";
    $requestconsumerjoin = $hasrequestconsumer ? 'LEFT JOIN {local_prequran_consumer} c ON c.id = tr.consumerid' : '';
    $requestconsumerwhere = '';
    $requestparams = [];
    if ($consumerfilterid > 0 && $hasrequestconsumer) {
        $requestconsumerwhere = ' WHERE tr.consumerid = :consumerid';
        $requestparams['consumerid'] = $consumerfilterid;
    }
    $assignmentselect = pqtma_table_exists('local_prequran_teacher_student')
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

    if (pqtma_table_exists('local_prequran_live_session')) {
        $livewhere = ['ls.status = :livestatus'];
        $liveparams = ['livestatus' => 'pending_marketplace_approval'];
        if ($consumerfilterid > 0 && pqtma_column_exists('local_prequran_teacher_profile', 'consumerid')) {
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
}

echo $OUTPUT->header();
?>
<style>
body.pqh-teacher-marketplace-admin-page header,body.pqh-teacher-marketplace-admin-page footer,body.pqh-teacher-marketplace-admin-page nav.navbar,body.pqh-teacher-marketplace-admin-page #page-header,body.pqh-teacher-marketplace-admin-page #page-footer,body.pqh-teacher-marketplace-admin-page .drawer,body.pqh-teacher-marketplace-admin-page .drawer-toggles,body.pqh-teacher-marketplace-admin-page .block-region,body.pqh-teacher-marketplace-admin-page [data-region="drawer"],body.pqh-teacher-marketplace-admin-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-teacher-marketplace-admin-page #page,body.pqh-teacher-marketplace-admin-page #page-content,body.pqh-teacher-marketplace-admin-page #region-main,body.pqh-teacher-marketplace-admin-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqtma-shell{min-height:100vh;padding:28px 18px 54px;background:#f4f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqtma-wrap{max-width:1180px;margin:0 auto}.pqtma-top,.pqtma-panel{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqtma-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:14px}.pqtma-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqtma-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqtma-actions{display:flex;gap:9px;flex-wrap:wrap}.pqtma-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqtma-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqtma-panel{padding:18px;margin-bottom:14px}.pqtma-panel h2{margin:0 0 12px;font-size:20px;font-weight:950;color:#241b24}.pqtma-table{width:100%;border-collapse:collapse}.pqtma-table th,.pqtma-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqtma-table th{font-weight:950;color:#415665;background:#f7fafc}.pqtma-pill{display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border-radius:999px;background:#eef7ee;color:#2f5d42;font-size:12px;font-weight:950}.pqtma-pill--warn{background:#fff6de;color:#745323}.pqtma-pill--bad{background:#fff0ed;color:#883526}.pqtma-muted{color:#5e7280;font-weight:800}.pqtma-textarea,.pqtma-select{width:100%;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:7px 9px;font:800 13px/1.25 system-ui;background:#fff;color:#173044}.pqtma-textarea{min-height:62px}.pqtma-quick,.pqtma-next-actions{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}.pqtma-next-actions{margin:10px 0 0}.pqtma-quick form{margin:0}.pqtma-btn--tiny{min-height:30px;padding:0 9px;font-size:12px}.pqtma-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-weight:850}.pqtma-alert--ok{background:#edf9ef;color:#245c35}.pqtma-alert--bad{background:#fff0ed;color:#883526}.pqtma-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;background:#fff;color:#5e7280;font-weight:850}
@media(max-width:860px){.pqtma-top{display:block}.pqtma-actions{margin-top:12px}.pqtma-table,.pqtma-table tbody,.pqtma-table tr,.pqtma-table td{display:block}.pqtma-table thead{display:none}.pqtma-table td{border-bottom:0}.pqtma-table tr{border-bottom:1px solid rgba(23,48,68,.12);padding:8px 0}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqtma-shell">
  <div class="pqtma-wrap">
    <section class="pqtma-top pqh-workspace-top">
      <div>
        <h1 class="pqtma-title pqh-workspace-title">Teacher Marketplace Admin</h1>
        <p class="pqtma-sub pqh-workspace-sub">Review publish state, vetting state, parent messages, and formal teacher selection requests.</p>
      </div>
      <div class="pqtma-actions pqh-workspace-actions">
        <?php if (!empty($consumerparams)): ?><a class="pqtma-btn pqtma-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace_admin.php', $consumerparams))->out(false); ?>"><?php echo s((string)($consumercontext->consumername ?? 'Current marketplace')); ?></a><?php endif; ?>
        <a class="pqtma-btn pqtma-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace_admin.php'))->out(false); ?>">All consumers</a>
        <a class="pqtma-btn pqtma-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_intake.php', $consumerparams))->out(false); ?>">Teacher intake</a>
        <a class="pqtma-btn pqtma-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams))->out(false); ?>">Parent marketplace</a>
        <a class="pqtma-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
      </div>
    </section>
    <?php if ($consumercontext): ?>
      <section class="pqtma-panel"><h2><?php echo s((string)$consumercontext->consumername); ?> Request Queue</h2><div class="pqtma-muted">Showing marketplace profiles, live session requests, and parent requests for <?php echo s((string)$consumercontext->consumerslug); ?>.</div></section>
    <?php endif; ?>
    <?php if ($message !== ''): ?><div class="pqtma-alert pqtma-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqtma-alert pqtma-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <?php if (!$ready): ?>
      <div class="pqtma-empty">Teacher marketplace schema is not ready yet. Please run the local_prequran Moodle upgrade.</div>
    <?php else: ?>
      <section class="pqtma-panel">
        <h2>Marketing Profile Reviews</h2>
        <?php if (!$marketingdrafts): ?>
          <div class="pqtma-empty">No teacher marketing profiles are waiting for review.</div>
        <?php else: ?>
          <table class="pqtma-table">
            <thead><tr><th>Teacher</th><th>Profile summary</th><th>Services / pricing</th><th>Online presence</th><th>Review</th></tr></thead>
            <tbody>
              <?php foreach ($marketingdrafts as $item): $profile = $item['profile']; $draft = $item['draft']; ?>
                <tr>
                  <td><strong><?php echo s((string)($draft['display_name'] ?? pqtma_user_name((int)$profile->userid))); ?></strong><br><span class="pqtma-muted">Submitted <?php echo userdate((int)($draft['submitted_at'] ?? 0)); ?></span></td>
                  <td><?php echo s(pqtma_short((string)($draft['bio'] ?? ''), 300)); ?></td>
                  <td><?php echo s(pqtma_short((string)($draft['services'] ?? ''), 220)); ?><?php if (trim((string)($draft['pricing_summary'] ?? '')) !== ''): ?><br><span class="pqtma-muted"><?php echo s(pqtma_short((string)$draft['pricing_summary'], 160)); ?></span><?php endif; ?></td>
                  <?php $draftsocialurl = pqtma_public_url((string)($draft['social_profile_url'] ?? '')); ?>
                  <td><?php if ($draftsocialurl !== ''): ?><a href="<?php echo s($draftsocialurl); ?>" target="_blank" rel="noopener noreferrer">@<?php echo s((string)($draft['social_media_handle'] ?? 'social profile')); ?></a><?php else: ?><span class="pqtma-muted">Not provided</span><?php endif; ?></td>
                  <td>
                    <form method="post">
                      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                      <input type="hidden" name="profileid" value="<?php echo (int)$profile->id; ?>">
                      <?php foreach ($consumerparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
                      <textarea class="pqtma-textarea" name="marketing_review_note" placeholder="Review note"></textarea>
                      <div class="pqtma-quick">
                        <button class="pqtma-btn pqtma-btn--tiny" type="submit" name="marketing_action" value="approve">Approve &amp; publish</button>
                        <button class="pqtma-btn pqtma-btn--light pqtma-btn--tiny" type="submit" name="marketing_action" value="reject">Return for revision</button>
                      </div>
                    </form>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>
      <section class="pqtma-panel">
        <h2>Marketplace Profiles</h2>
        <?php if (!$profiles): ?>
          <div class="pqtma-empty">No teacher profiles found.</div>
        <?php else: ?>
          <table class="pqtma-table">
            <thead><tr><th>Teacher</th><th>Marketplace</th><th>Vetting</th><th>Subjects / skills</th><th>Actions</th></tr></thead>
            <tbody>
              <?php foreach ($profiles as $profile): ?>
                <?php $published = (int)$profile->marketplace_visible === 1 && (string)$profile->marketplace_status === 'published' && (string)$profile->vetting_status === 'approved' && (string)$profile->status === 'active'; ?>
                <tr>
                  <td><strong><?php echo s(trim((string)$profile->teacher_display_name) !== '' ? (string)$profile->teacher_display_name : fullname($profile)); ?></strong><br><span class="pqtma-muted"><?php echo s(pqh_account_no_label($profile)); ?> / Moodle ID <?php echo (int)$profile->userid; ?></span></td>
                  <td><span class="pqtma-pill<?php echo $published ? '' : ' pqtma-pill--warn'; ?>"><?php echo $published ? 'Visible' : 'Hidden'; ?></span><br><?php echo s((string)$profile->marketplace_status); ?> / <?php echo (int)$profile->marketplace_visible ? 'visible flag on' : 'visible flag off'; ?></td>
                  <td><span class="pqtma-pill<?php echo (string)$profile->vetting_status === 'approved' ? '' : ' pqtma-pill--bad'; ?>"><?php echo s((string)$profile->vetting_status); ?></span><br><?php echo s(pqtma_short((string)$profile->vetting_summary)); ?></td>
                  <td><?php echo s(pqtma_short((string)$profile->courses_taught . ' ' . (string)$profile->marketplace_skills)); ?></td>
                  <td>
                    <a class="pqtma-btn pqtma-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_intake.php', ['existing_teacherid' => (int)$profile->userid] + $consumerparams))->out(false); ?>">Update intake</a>
                    <?php if ($published): ?><a class="pqtma-btn" href="<?php echo pqh_teacher_public_profile_url($profile, $consumercontext)->out(false); ?>">View public</a><?php endif; ?>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>
      <section class="pqtma-panel">
        <h2><?php echo s($pqtma_brand); ?> Teacher Vetting</h2>
        <?php if (!$academyprofiles): ?>
          <div class="pqtma-empty">No teacher profiles are outside the marketplace pipeline.</div>
        <?php else: ?>
          <table class="pqtma-table">
            <thead><tr><th>Teacher</th><th>Teacher status</th><th>Vetting</th><th>Subjects / levels</th><th>Actions</th></tr></thead>
            <tbody>
              <?php foreach ($academyprofiles as $profile): ?>
                <tr>
                  <td><strong><?php echo s(trim((string)$profile->teacher_display_name) !== '' ? (string)$profile->teacher_display_name : fullname($profile)); ?></strong><br><span class="pqtma-muted"><?php echo s(pqh_account_no_label($profile)); ?> / Moodle ID <?php echo (int)$profile->userid; ?></span></td>
                  <td><span class="pqtma-pill<?php echo (string)$profile->status === 'active' ? '' : ' pqtma-pill--warn'; ?>"><?php echo s((string)$profile->status); ?></span><br><span class="pqtma-muted">Teacher profile</span></td>
                  <td><span class="pqtma-pill<?php echo (string)$profile->vetting_status === 'approved' ? '' : ' pqtma-pill--bad'; ?>"><?php echo s((string)$profile->vetting_status); ?></span><br><?php echo s(pqtma_short((string)$profile->vetting_summary)); ?></td>
                  <td><?php echo s(pqtma_short((string)$profile->courses_taught . ' ' . (string)$profile->levels_taught)); ?></td>
                  <td><a class="pqtma-btn pqtma-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_intake.php', ['existing_teacherid' => (int)$profile->userid] + $consumerparams))->out(false); ?>">Update intake</a></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>
      <section class="pqtma-panel">
        <h2>Live Session Requests</h2>
        <?php if (!$livesessionrequests): ?>
          <div class="pqtma-empty">No live sessions are waiting for marketplace approval.</div>
        <?php else: ?>
          <table class="pqtma-table">
            <thead><tr><th>Teacher / students</th><th>Session</th><th>Schedule</th><th>Exception / status</th><th>Actions</th></tr></thead>
            <tbody>
              <?php foreach ($livesessionrequests as $session): ?>
                <?php
                  $sessionparams = $consumerparams;
                  if ((int)($session->workspaceid ?? 0) > 0) {
                      $sessionparams['workspaceid'] = (int)$session->workspaceid;
                  }
                  $sessionurl = new moodle_url('/local/hubredirect/live_sessions.php', $sessionparams);
                  $studentnames = pqtma_live_session_student_names((int)$session->id);
                ?>
                <tr>
                  <td><strong><?php echo s(pqtma_user_name((int)$session->teacherid)); ?></strong><br><span class="pqtma-muted">Moodle ID <?php echo (int)$session->teacherid; ?></span><br>Students: <?php echo s($studentnames ? implode(', ', $studentnames) : 'Not listed'); ?></td>
                  <td><strong><?php echo s((string)$session->title); ?></strong><br><span class="pqtma-muted"><?php echo s((string)$session->lessonid); ?> / <?php echo s((string)$session->unitid); ?></span><br>Request #<?php echo (int)$session->id; ?></td>
                  <td><?php echo userdate((int)$session->scheduled_start); ?><br><span class="pqtma-muted"><?php echo s((string)$session->timezone); ?></span></td>
                  <td><span class="pqtma-pill pqtma-pill--warn">Pending marketplace approval</span><?php if (trim((string)$session->description) !== ''): ?><br><?php echo s(pqtma_short((string)$session->description, 260)); ?><?php endif; ?></td>
                  <td>
                    <div class="pqtma-quick">
                      <a class="pqtma-btn pqtma-btn--light pqtma-btn--tiny" href="<?php echo $sessionurl->out(false); ?>">Review</a>
                      <form method="post" action="<?php echo $sessionurl->out(false); ?>">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="approve_session">
                        <input type="hidden" name="sessionid" value="<?php echo (int)$session->id; ?>">
                        <button class="pqtma-btn pqtma-btn--tiny" type="submit">Approve</button>
                      </form>
                      <form method="post" action="<?php echo $sessionurl->out(false); ?>">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="reject_session">
                        <input type="hidden" name="sessionid" value="<?php echo (int)$session->id; ?>">
                        <button class="pqtma-btn pqtma-btn--light pqtma-btn--tiny" type="submit">Reject</button>
                      </form>
                    </div>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>
      <section class="pqtma-panel">
        <h2>Parent Requests</h2>
        <?php if (!$requests): ?>
          <div class="pqtma-empty">No parent marketplace requests yet.</div>
        <?php else: ?>
          <table class="pqtma-table">
            <thead><tr><th>Request</th><th>Message</th><th>Status</th><th>Update</th></tr></thead>
            <tbody>
              <?php foreach ($requests as $request): ?>
                <?php
                  $requestcontextparams = pqtma_request_context_params($request, $consumerparams);
                  $studentworkspaceurl = pqtma_student_workspace_url($request, $requestcontextparams);
                ?>
                <tr>
                  <td><strong><?php echo s(pqtma_user_name((int)$request->parentid)); ?></strong><br>Teacher: <?php echo s(trim((string)($request->teacher_display_name ?? '')) !== '' ? (string)$request->teacher_display_name : pqtma_user_name((int)$request->teacherid)); ?><br>Student: <?php echo s(pqtma_user_name((int)$request->studentid)); ?><br><?php echo userdate((int)$request->timecreated); ?><?php if ((string)($request->consumer_name ?? '') !== ''): ?><br><span class="pqtma-pill"><?php echo s((string)$request->consumer_name); ?></span><?php endif; ?></td>
                  <td><?php echo s(pqtma_short((string)$request->message, 260)); ?>
                    <?php if ((int)$request->threadid > 0): ?><br><a href="<?php echo (new moodle_url('/local/hubredirect/communications.php', $requestcontextparams + ['threadid' => (int)$request->threadid, 'opencomm' => 'messages']))->out(false); ?>">Open message thread</a><?php endif; ?>
                    <br><a href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', $requestcontextparams + ['teacherid' => (int)$request->teacherid]))->out(false); ?>">Teacher profile</a>
                  </td>
                  <td>
                    <span class="pqtma-pill"><?php echo s(pqtma_request_status_label((string)$request->request_status)); ?></span>
                    <?php if ((int)($request->assignmentid ?? 0) > 0): ?>
                      <span class="pqtma-pill">Assigned #<?php echo (int)$request->assignmentid; ?></span>
                    <?php endif; ?>
                    <br><span class="pqtma-muted"><?php echo s(pqtma_short((string)$request->admin_notes)); ?></span>
                    <?php if ((string)($request->marketplace_status ?? '') !== ''): ?>
                      <br><span class="pqtma-muted">Profile: <?php echo s((string)$request->marketplace_status); ?> / <?php echo s((string)$request->vetting_status); ?></span>
                    <?php endif; ?>
                    <?php if ((int)($request->assignmentid ?? 0) > 0 && (int)$request->teacherid > 0 && (int)$request->studentid > 0): ?>
                      <div class="pqtma-next-actions">
                        <a class="pqtma-btn pqtma-btn--tiny" href="<?php echo pqtma_live_series_url($request, $requestcontextparams)->out(false); ?>">Schedule series</a>
                        <a class="pqtma-btn pqtma-btn--light pqtma-btn--tiny" href="<?php echo pqtma_one_time_session_url($request, $requestcontextparams)->out(false); ?>">One-time session</a>
                        <?php if ($studentworkspaceurl): ?><a class="pqtma-btn pqtma-btn--light pqtma-btn--tiny" href="<?php echo $studentworkspaceurl->out(false); ?>">Student workspace</a><?php endif; ?>
                        <a class="pqtma-btn pqtma-btn--light pqtma-btn--tiny" href="<?php echo (new moodle_url('/local/hubredirect/live_calendar.php', $requestcontextparams + ['childid' => (int)$request->studentid]))->out(false); ?>">Calendar</a>
                        <a class="pqtma-btn pqtma-btn--light pqtma-btn--tiny" href="<?php echo (new moodle_url('/local/hubredirect/communications.php', $requestcontextparams + ['studentid' => (int)$request->studentid, 'opencomm' => 'messages']))->out(false); ?>">Messages</a>
                      </div>
                    <?php elseif ((string)$request->request_status === 'assigned'): ?>
                      <br><span class="pqtma-muted">Create/link the student before scheduling.</span>
                    <?php endif; ?>
                  </td>
                  <td>
                    <div class="pqtma-quick">
                      <?php foreach (pqtma_quick_request_statuses_for((string)$request->request_status) as $value => $label): ?>
                        <?php if ((string)$request->request_status === $value): ?>
                          <?php continue; ?>
                        <?php endif; ?>
                        <form method="post">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
                          <input type="hidden" name="quick_request_status" value="<?php echo s($value); ?>">
                          <?php if ($consumercontext): ?><input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>"><?php endif; ?>
                          <button class="pqtma-btn pqtma-btn--light pqtma-btn--tiny" type="submit" name="quick_update_request" value="1"><?php echo s($label); ?></button>
                        </form>
                      <?php endforeach; ?>
                    </div>
                    <form method="post">
                      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                      <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
                      <?php if ($consumercontext): ?><input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>"><?php endif; ?>
                      <select class="pqtma-select" name="request_status">
                        <?php foreach (pqtma_request_statuses() as $value => $label): ?>
                          <?php if (!pqtma_request_transition_allowed((string)$request->request_status, $value)): ?>
                            <?php continue; ?>
                          <?php endif; ?>
                          <option value="<?php echo s($value); ?>"<?php echo (string)$request->request_status === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option>
                        <?php endforeach; ?>
                      </select>
                      <textarea class="pqtma-textarea" name="admin_notes" placeholder="Admin notes"><?php echo s((string)$request->admin_notes); ?></textarea>
                      <button class="pqtma-btn" type="submit" name="update_request" value="1">Save</button>
                    </form>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
