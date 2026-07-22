<?php
// Teacher-marketplace admin-console library — extracted VERBATIM from
// teacher_marketplace_admin.php (renamed pqtma_ -> pqtmal_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqtmal_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtmal_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtmal_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqtmal_ready(): bool {
    return pqtmal_table_exists('local_prequran_teacher_profile')
        && pqtmal_table_exists('local_prequran_teacher_request')
        && pqtmal_column_exists('local_prequran_teacher_profile', 'marketplace_visible')
        && pqtmal_column_exists('local_prequran_teacher_profile', 'marketplace_status')
        && pqtmal_column_exists('local_prequran_teacher_profile', 'vetting_status');
}

function pqtmal_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : ($userid > 0 ? 'User ' . $userid : 'Not selected');
}

function pqtmal_live_session_student_names(int $sessionid): array {
    global $DB;
    if ($sessionid <= 0 || !pqtmal_table_exists('local_prequran_live_participant')) {
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
            $names[$studentid] = pqtmal_user_name($studentid);
        }
    }
    return array_values($names);
}

function pqtmal_short(string $value, int $max = 120): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqtmal_application(stdClass $profile): array {
    $decoded = json_decode((string)($profile->application_json ?? ''), true);
    return is_array($decoded) ? $decoded : [];
}

function pqtmal_marketing_draft(stdClass $profile): array {
    $application = pqtmal_application($profile);
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

function pqtmal_public_url(string $value): string {
    $value = trim($value);
    if (!filter_var($value, FILTER_VALIDATE_URL)) {
        return '';
    }
    return in_array(strtolower((string)parse_url($value, PHP_URL_SCHEME)), ['http', 'https'], true) ? $value : '';
}

function pqtmal_marketing_preference_key(int $consumerid): string {
    return 'local_hubredirect_mktstatus_' . max(0, $consumerid);
}

function pqtmal_apply_approved_marketing(stdClass $profile, array $draft, string $reviewnote, int $reviewerid, int $now): stdClass {
    $application = pqtmal_application($profile);
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

function pqtmal_sync_approved_marketing(stdClass $approvedprofile, array $draft, string $reviewnote, int $now): void {
    global $DB, $USER;
    $conditions = ['userid' => (int)$approvedprofile->userid];
    if (pqtmal_column_exists('local_prequran_teacher_profile', 'consumerid')) {
        $conditions['consumerid'] = (int)($approvedprofile->consumerid ?? 0);
    }
    foreach ($DB->get_records('local_prequran_teacher_profile', $conditions) as $profile) {
        if ((int)$profile->id === (int)$approvedprofile->id || (string)($profile->status ?? '') !== 'active') {
            continue;
        }
        $profile = pqtmal_apply_approved_marketing($profile, $draft, $reviewnote, (int)$USER->id, $now);
        $DB->update_record('local_prequran_teacher_profile', $profile);
    }
}

function pqtmal_audit(string $action, int $profileid, array $details = []): void {
    global $DB, $USER;
    if (!pqtmal_table_exists('local_prequran_live_audit')) {
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

function pqtmal_schedule_title(stdClass $request): string {
    $teachername = trim((string)($request->teacher_display_name ?? ''));
    if ($teachername === '') {
        $teachername = pqtmal_user_name((int)$request->teacherid);
    }

    $studentname = pqtmal_user_name((int)$request->studentid);
    $consumername = trim((string)($request->consumer_name ?? ''));
    if ($consumername === '') {
        $consumername = 'Marketplace';
    }

    return pqtmal_short($consumername . ' class: ' . $teachername . ' and ' . $studentname, 180);
}

function pqtmal_request_context_params(stdClass $request, array $fallbackparams): array {
    $params = $fallbackparams;
    if (trim((string)($request->consumer_slug ?? '')) !== '') {
        $params['consumer'] = (string)$request->consumer_slug;
    }
    if ((int)($request->assignmentworkspaceid ?? 0) > 0) {
        $params['workspaceid'] = (int)$request->assignmentworkspaceid;
    }
    return $params;
}

function pqtmal_live_series_url(stdClass $request, array $contextparams = []): moodle_url {
    return new moodle_url('/local/hubredirect/live_series_wizard.php', $contextparams + [
        'step' => 3,
        'teacherid' => (int)$request->teacherid,
        'studentids_raw' => (string)(int)$request->studentid,
        'title' => pqtmal_schedule_title($request),
        'recording_enabled' => 1,
    ]);
}

function pqtmal_one_time_session_url(stdClass $request, array $contextparams = []): moodle_url {
    return new moodle_url('/local/hubredirect/live_sessions.php', $contextparams + [
        'teacherid' => (int)$request->teacherid,
        'studentids_raw' => (string)(int)$request->studentid,
        'title' => pqtmal_schedule_title($request),
        'recording_enabled' => 1,
    ]);
}

function pqtmal_student_workspace_url(stdClass $request, array $contextparams = []): ?moodle_url {
    $workspaceid = (int)($request->assignmentworkspaceid ?? 0);
    if ($workspaceid <= 0 || (int)$request->studentid <= 0) {
        return null;
    }

    return new moodle_url('/local/hubredirect/workspace_student.php', $contextparams + [
        'workspaceid' => $workspaceid,
        'studentid' => (int)$request->studentid,
    ]);
}

function pqtmal_request_statuses(): array {
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

function pqtmal_request_status_label(string $status): string {
    $statuses = pqtmal_request_statuses();
    return $statuses[$status] ?? $status;
}

function pqtmal_quick_request_statuses(): array {
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

function pqtmal_request_transition_allowed(string $from, string $to): bool {
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

function pqtmal_quick_request_statuses_for(string $status): array {
    if ($status === 'assigned') {
        return ['closed' => 'Close'];
    }
    if (in_array($status, ['closed', 'declined'], true)) {
        return ['academy_review' => 'Reopen review'];
    }
    return pqtmal_quick_request_statuses();
}

function pqtmal_assignment_workspaceid(stdClass $request): int {
    global $DB;

    foreach (pqh_independent_teacher_workspace_ids((int)$request->teacherid) as $workspaceid) {
        if ($workspaceid > 0) {
            return (int)$workspaceid;
        }
    }

    if (pqtmal_column_exists('local_prequran_teacher_request', 'consumerid') && !empty($request->consumerid)
        && pqtmal_table_exists('local_prequran_consumer')) {
        $workspaceid = (int)$DB->get_field('local_prequran_consumer', 'primaryworkspaceid', ['id' => (int)$request->consumerid], IGNORE_MISSING);
        if ($workspaceid > 0) {
            return $workspaceid;
        }
    }

    if ((int)$request->studentid > 0 && pqtmal_table_exists('local_prequran_student_profile')
        && pqtmal_column_exists('local_prequran_student_profile', 'workspaceid')) {
        $workspaceid = (int)$DB->get_field('local_prequran_student_profile', 'workspaceid', ['userid' => (int)$request->studentid], IGNORE_MISSING);
        if ($workspaceid > 0) {
            return $workspaceid;
        }
    }

    return 0;
}

function pqtmal_upsert_workspace_member(int $workspaceid, int $userid, string $role, string $note): void {
    global $DB, $USER;
    if ($workspaceid <= 0 || $userid <= 0 || !pqtmal_table_exists('local_prequran_workspace_member')) {
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

function pqtmal_assign_teacher_request(stdClass $request): int {
    global $DB, $USER;

    if (!pqtmal_table_exists('local_prequran_teacher_student')) {
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

    $workspaceid = pqtmal_assignment_workspaceid($request);
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

    pqtmal_upsert_workspace_member($workspaceid, (int)$request->teacherid, 'teacher', 'Independent teacher assignment approved by marketplace operations.');
    pqtmal_upsert_workspace_member($workspaceid, (int)$request->studentid, 'student', 'Student connection approved by marketplace operations.');
    if ((int)$request->parentid > 0) {
        pqtmal_upsert_workspace_member($workspaceid, (int)$request->parentid, 'parent', 'Guardian linked through approved teacher-student connection.');
    }

    $transaction->allow_commit();
    return $assignmentid;
}
