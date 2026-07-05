<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/course_offeringlib.php');
require_once(__DIR__ . '/finance_lib.php');
require_once(__DIR__ . '/gradebook_progresslib.php');

function pqct_tables_ready(): bool {
    return pqco_table_ready()
        && pqh_table_exists_safe('local_prequran_workspace')
        && pqh_table_exists_safe('local_prequran_workspace_member');
}

function pqct_warning(string $code, string $severity, string $message, array $context = [], string $action = ''): array {
    return [
        'code' => $code,
        'severity' => $severity,
        'message' => $message,
        'recommended_action' => $action,
        'context' => $context,
    ];
}

function pqct_default_transcript_policy(): array {
    return [
        'policy_version' => 1,
        'completion_source' => 'moodle_then_local',
        'passing_rule' => 'completion_or_grade',
        'minimum_passing_percent' => 60,
        'grade_display_mode' => 'percent',
        'grade_rounding' => 1,
        'show_in_progress_grades' => false,
        'attendance_display' => 'sessions_and_rate',
        'drop_withdrawal_display' => 'show_with_status',
        'teacher_note_official_display' => 'none',
        'unofficial_pdf_permission' => 'workspace_admin',
        'official_issue_permission' => 'workspace_admin',
    ];
}

function pqct_policy_allowed_values(): array {
    return [
        'completion_source' => ['moodle_then_local', 'moodle_only', 'local_progress_only', 'quiz_only'],
        'passing_rule' => ['completion_or_grade', 'completion_only', 'grade_only', 'quiz_pass_only'],
        'grade_display_mode' => ['none', 'percent', 'letter', 'percent_and_letter'],
        'attendance_display' => ['none', 'sessions', 'rate', 'sessions_and_rate'],
        'drop_withdrawal_display' => ['show_with_status', 'hide_dropped', 'show_without_grade'],
        'teacher_note_official_display' => ['none', 'public_summary_only'],
        'unofficial_pdf_permission' => ['disabled', 'workspace_admin', 'student_parent_teacher'],
        'official_issue_permission' => ['workspace_admin', 'workspace_owner_only', 'platform_admin_only'],
    ];
}

function pqct_normalize_transcript_policy(array $policy): array {
    $default = pqct_default_transcript_policy();
    $allowed = pqct_policy_allowed_values();
    $clean = $default;
    foreach ($allowed as $key => $values) {
        $value = (string)($policy[$key] ?? $default[$key]);
        $clean[$key] = in_array($value, $values, true) ? $value : $default[$key];
    }
    $clean['policy_version'] = max(1, (int)($policy['policy_version'] ?? $default['policy_version']));
    $clean['minimum_passing_percent'] = max(0, min(100, (int)($policy['minimum_passing_percent'] ?? $default['minimum_passing_percent'])));
    $clean['grade_rounding'] = max(0, min(2, (int)($policy['grade_rounding'] ?? $default['grade_rounding'])));
    $clean['show_in_progress_grades'] = !empty($policy['show_in_progress_grades']);
    return $clean;
}

function pqct_policy_hash(array $policy): string {
    $policy = pqct_normalize_transcript_policy($policy);
    ksort($policy);
    return hash('sha256', json_encode($policy, JSON_UNESCAPED_SLASHES));
}

function pqct_workspace_transcript_policy(int $workspaceid): array {
    global $DB;

    $default = pqct_default_transcript_policy();
    $fallback = [
        'id' => 0,
        'workspaceid' => $workspaceid,
        'source' => 'default',
        'status' => 'default',
        'policyversion' => (int)$default['policy_version'],
        'policyhash' => pqct_policy_hash($default),
        'policy' => $default,
        'timecreated' => 0,
        'timemodified' => 0,
    ];
    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_transcript_policy')) {
        return $fallback;
    }
    try {
        $record = $DB->get_record('local_prequran_transcript_policy', ['workspaceid' => $workspaceid], '*', IGNORE_MISSING);
    } catch (Throwable $e) {
        return $fallback;
    }
    if (!$record || (string)($record->status ?? '') !== 'active') {
        return $fallback;
    }
    $policy = json_decode((string)($record->policyjson ?? ''), true);
    if (!is_array($policy)) {
        $policy = $default;
    }
    $policy = pqct_normalize_transcript_policy($policy);
    return [
        'id' => (int)$record->id,
        'workspaceid' => $workspaceid,
        'source' => 'workspace',
        'status' => (string)$record->status,
        'policyversion' => (int)($record->policyversion ?? $policy['policy_version']),
        'policyhash' => (string)($record->policyhash ?: pqct_policy_hash($policy)),
        'policy' => $policy,
        'timecreated' => (int)($record->timecreated ?? 0),
        'timemodified' => (int)($record->timemodified ?? 0),
    ];
}

function pqct_save_workspace_transcript_policy(int $workspaceid, array $policy, int $userid): int {
    global $DB;

    if ($workspaceid <= 0 || $userid <= 0 || !pqh_table_exists_safe('local_prequran_transcript_policy')) {
        throw new invalid_parameter_exception('Transcript policy table is not ready.');
    }
    $policy = pqct_normalize_transcript_policy($policy);
    $now = time();
    $record = $DB->get_record('local_prequran_transcript_policy', ['workspaceid' => $workspaceid], '*', IGNORE_MISSING);
    $data = (object)[
        'workspaceid' => $workspaceid,
        'policyversion' => (int)$policy['policy_version'],
        'policyhash' => pqct_policy_hash($policy),
        'policyjson' => json_encode($policy, JSON_UNESCAPED_SLASHES),
        'status' => 'active',
        'modifiedby' => $userid,
        'timemodified' => $now,
    ];
    if ($record) {
        $data->id = (int)$record->id;
        $DB->update_record('local_prequran_transcript_policy', $data);
        return (int)$record->id;
    }
    $data->createdby = $userid;
    $data->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_transcript_policy', $data);
}

function pqct_policy_grade_letter(float $percentage): string {
    if ($percentage >= 90) {
        return 'A';
    }
    if ($percentage >= 80) {
        return 'B';
    }
    if ($percentage >= 70) {
        return 'C';
    }
    if ($percentage >= 60) {
        return 'D';
    }
    return 'F';
}

function pqct_policy_percent_label($value, int $rounding): string {
    return is_numeric($value) ? format_float((float)$value, $rounding) . '%' : 'Not recorded';
}

function pqct_line_policy_display(array $line, array $policy): array {
    $policy = pqct_normalize_transcript_policy($policy);
    $status = (string)($line['status']['normalized'] ?? '');
    $grade = $line['grade'] ?? [];
    $completion = $line['completion'] ?? [];
    $moodlecompletion = $completion['moodle'] ?? [];
    $localprogress = $completion['local_progress'] ?? [];
    $quiz = $completion['quiz'] ?? [];
    $attendance = $line['attendance'] ?? [];
    $iscomplete = in_array($status, ['completed', 'passed', 'not_passed'], true) || !empty($moodlecompletion['completed']);
    $rounding = (int)$policy['grade_rounding'];

    $gradevalue = $grade['percentage'] ?? null;
    if ((string)$policy['grade_display_mode'] === 'none') {
        $gradelabel = 'Hidden by policy';
    } else if (!$iscomplete && empty($policy['show_in_progress_grades'])) {
        $gradelabel = 'Shown after completion';
    } else if (empty($grade['recorded']) || !is_numeric($gradevalue)) {
        $gradelabel = 'Not recorded';
    } else {
        $percent = pqct_policy_percent_label($gradevalue, $rounding);
        $letter = pqct_policy_grade_letter((float)$gradevalue);
        if ((string)$policy['grade_display_mode'] === 'letter') {
            $gradelabel = $letter;
        } else if ((string)$policy['grade_display_mode'] === 'percent_and_letter') {
            $gradelabel = $percent . ' / ' . $letter;
        } else {
            $gradelabel = $percent;
        }
    }

    $completionlabel = 'Not recorded';
    if ((string)$policy['completion_source'] === 'moodle_only') {
        $completionlabel = !empty($moodlecompletion['completed']) ? 'Completed' : 'Not recorded';
    } else if ((string)$policy['completion_source'] === 'local_progress_only') {
        $completionlabel = pqct_policy_percent_label($localprogress['percentage'] ?? null, 1);
    } else if ((string)$policy['completion_source'] === 'quiz_only') {
        $completionlabel = pqct_policy_percent_label($quiz['best_percentage'] ?? null, 1);
    } else if (!empty($moodlecompletion['completed'])) {
        $completionlabel = 'Completed';
    } else {
        $completionlabel = pqct_policy_percent_label($localprogress['percentage'] ?? null, 1);
    }

    $attendancelabel = 'Hidden by policy';
    $sessions = (int)($attendance['sessions'] ?? 0);
    $attended = (int)($attendance['attended'] ?? 0);
    $rate = $sessions > 0 ? round(($attended / $sessions) * 100, 1) : null;
    if ((string)$policy['attendance_display'] === 'sessions') {
        $attendancelabel = $sessions . ' sessions';
    } else if ((string)$policy['attendance_display'] === 'rate') {
        $attendancelabel = $rate !== null ? format_float((float)$rate, 1) . '%' : 'Not recorded';
    } else if ((string)$policy['attendance_display'] === 'sessions_and_rate') {
        $attendancelabel = $sessions . ' sessions' . ($rate !== null ? ' / ' . format_float((float)$rate, 1) . '%' : '');
    }

    return [
        'grade' => $gradelabel,
        'completion' => $completionlabel,
        'attendance' => $attendancelabel,
        'policy_hash' => pqct_policy_hash($policy),
    ];
}

function pqct_document_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_transcript_doc');
}

function pqct_hold_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_transcript_hold');
}

function pqct_override_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_transcript_override');
}

function pqct_document_prefix(?stdClass $consumercontext, int $workspaceid): string {
    $slug = strtoupper(preg_replace('/[^A-Z0-9]+/i', '', (string)($consumercontext->consumerslug ?? '')));
    if ($slug === '') {
        $slug = 'PQ';
    }
    $slug = core_text::substr($slug, 0, 8);
    return $slug . '-W' . $workspaceid . '-TR';
}

function pqct_generate_document_id(?stdClass $consumercontext, int $workspaceid): string {
    global $DB;

    $prefix = pqct_document_prefix($consumercontext, $workspaceid);
    for ($i = 0; $i < 10; $i++) {
        $candidate = $prefix . '-' . date('Ymd') . '-' . strtoupper(random_string(8));
        if (!pqct_document_schema_ready() || !$DB->record_exists('local_prequran_transcript_doc', ['documentid' => $candidate])) {
            return $candidate;
        }
    }
    return $prefix . '-' . date('YmdHis') . '-' . strtoupper(random_string(10));
}

function pqct_official_issue_blockers(array $payload): array {
    $blockers = [];
    $summary = $payload['summary'] ?? [];
    $header = $payload['header'] ?? [];
    $policy = $payload['policy'] ?? [];
    $workspaceid = (int)($header['workspace']['id'] ?? 0);
    $studentid = (int)($header['student']['id'] ?? 0);
    if ((int)($summary['blocker_count'] ?? 0) > 0) {
        $blockers[] = 'Resolve transcript blocker warnings before issue.';
    }
    if ((string)($policy['source'] ?? 'default') !== 'workspace') {
        $blockers[] = 'Save a workspace transcript policy before official issue.';
    }
    if (trim((string)($header['student']['account_no'] ?? '')) === '') {
        $blockers[] = 'Record the student account number before official issue.';
    }
    if (empty($payload['lines'])) {
        $blockers[] = 'At least one transcript course line is required before official issue.';
    }
    foreach (($payload['lines'] ?? []) as $line) {
        $status = (string)($line['status']['normalized'] ?? '');
        if (in_array($status, ['approved_pending_sync', 'requested', 'approved'], true)) {
            $blockers[] = 'Sync all approved enrollments into Moodle before official issue.';
            break;
        }
    }
    foreach (pqct_active_transcript_holds($studentid, $workspaceid) as $hold) {
        $blockers[] = 'Active transcript hold: ' . trim((string)($hold->holdtype ?? 'registrar')) . '. Resolve holds before official issue.';
    }
    $financecheck = pqfin_finance_hold_release_check($studentid, $workspaceid, null, 'transcript');
    if (!empty($financecheck['blocked'])) {
        $blockers[] = 'Active finance hold: resolve tuition or billing holds before official transcript issue.';
    }
    return array_values(array_unique($blockers));
}

function pqct_official_snapshot_from_payload(array $payload, int $issuerid, string $reason, string $documentid): array {
    $snapshot = [
        'document' => [
            'documentid' => $documentid,
            'type' => 'official',
            'status' => 'issued',
            'issuedby' => $issuerid,
            'issuedat' => time(),
            'issuereason' => $reason,
        ],
        'header' => $payload['header'] ?? [],
        'permission' => $payload['permission'] ?? [],
        'lines' => $payload['lines'] ?? [],
        'summary' => $payload['summary'] ?? [],
        'policy' => $payload['policy'] ?? [],
        'warnings' => $payload['warnings'] ?? [],
    ];
    unset($snapshot['permission']['viewerid']);
    return $snapshot;
}

function pqct_issue_official_transcript(int $studentid, int $workspaceid, ?stdClass $consumercontext, int $issuerid, string $reason, string $replacesdocumentid = ''): array {
    global $DB;

    $reason = trim($reason);
    if ($reason === '') {
        throw new invalid_parameter_exception('An issue reason is required.');
    }
    if ($workspaceid <= 0 || $studentid <= 0 || $issuerid <= 0 || !pqh_user_can_manage_workspace($issuerid, $workspaceid)) {
        throw new invalid_parameter_exception('Official transcript issue access required.');
    }
    if (!pqct_document_schema_ready()) {
        throw new invalid_parameter_exception('Transcript document table is not ready.');
    }

    $payload = pqct_resolve_student_transcript($studentid, $workspaceid, $consumercontext, [
        'viewerid' => $issuerid,
        'include_internal' => false,
    ]);
    $blockers = pqct_official_issue_blockers($payload);
    if ($blockers) {
        pqct_notify_transcript_event('official_transcript_blocked', (object)[
            'workspaceid' => $workspaceid,
            'consumerid' => (int)($consumercontext->consumerid ?? 0),
            'studentid' => $studentid,
            'documentid' => '',
        ], $consumercontext, 'Official transcript blocked', 'An official transcript could not be issued because readiness blockers remain: ' . implode(' ', $blockers));
        throw new invalid_parameter_exception(implode(' ', $blockers));
    }

    $documentid = pqct_generate_document_id($consumercontext, $workspaceid);
    $verificationtoken = random_string(32);
    $snapshot = pqct_official_snapshot_from_payload($payload, $issuerid, $reason, $documentid);
    if ($replacesdocumentid !== '') {
        $snapshot['document']['replacesdocumentid'] = $replacesdocumentid;
    }
    $snapshotjson = json_encode($snapshot, JSON_UNESCAPED_SLASHES);
    $snapshothash = hash('sha256', $snapshotjson);
    $now = time();
    $record = (object)[
        'documentid' => $documentid,
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'transcripttype' => 'official',
        'status' => 'issued',
        'policyversion' => (int)($payload['policy']['policyversion'] ?? 1),
        'policyhash' => (string)($payload['policy']['policyhash'] ?? ''),
        'snapshothash' => $snapshothash,
        'verificationtokenhash' => hash('sha256', $verificationtoken),
        'snapshotjson' => $snapshotjson,
        'issuereason' => $reason,
        'issuedby' => $issuerid,
        'issuedat' => $now,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $record->id = (int)$DB->insert_record('local_prequran_transcript_doc', $record);
    pqco_course_audit('official_transcript_issued', 'transcript_doc', $record->id, [
        'workspaceid' => $workspaceid,
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'studentid' => $studentid,
        'documentid' => $documentid,
        'snapshothash' => $snapshothash,
    ]);
    pqct_notify_transcript_event('official_transcript_issued', $record, $consumercontext, 'Official transcript issued', 'An official transcript was issued for student #' . $studentid . '.');
    return ['record' => $record, 'snapshot' => $snapshot, 'verificationtoken' => $verificationtoken];
}

function pqct_load_official_transcript_doc(string $documentid, int $viewerid): ?stdClass {
    global $DB;

    $documentid = trim($documentid);
    if ($documentid === '' || $viewerid <= 0 || !pqct_document_schema_ready()) {
        return null;
    }
    $record = $DB->get_record('local_prequran_transcript_doc', ['documentid' => $documentid], '*', IGNORE_MISSING);
    if (!$record) {
        return null;
    }
    if (!pqh_user_can_manage_workspace($viewerid, (int)$record->workspaceid)) {
        return null;
    }
    return $record;
}

function pqct_load_public_transcript_doc(string $documentid): ?stdClass {
    global $DB;

    $documentid = trim($documentid);
    if ($documentid === '' || !pqct_document_schema_ready()) {
        return null;
    }
    return $DB->get_record('local_prequran_transcript_doc', ['documentid' => $documentid], '*', IGNORE_MISSING) ?: null;
}

function pqct_recent_official_transcript_docs(int $studentid, int $workspaceid, int $limit = 5): array {
    global $DB;

    if ($studentid <= 0 || $workspaceid <= 0 || !pqct_document_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_transcript_doc', [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
    ], 'issuedat DESC, id DESC', '*', 0, $limit));
}

function pqct_user_can_download_official_doc($record, int $viewerid): bool {
    if (!$record || $viewerid <= 0) {
        return false;
    }
    return pqct_user_can_view_student_transcript($viewerid, (int)$record->studentid, (int)$record->workspaceid);
}

function pqct_official_doc_payload($record): array {
    $snapshot = json_decode((string)($record->snapshotjson ?? ''), true);
    if (!is_array($snapshot)) {
        $snapshot = [];
    }
    return [
        'header' => $snapshot['header'] ?? [],
        'lines' => $snapshot['lines'] ?? [],
        'summary' => $snapshot['summary'] ?? [],
        'policy' => $snapshot['policy'] ?? [],
        'warnings' => $snapshot['warnings'] ?? [],
        'document' => $snapshot['document'] ?? [
            'documentid' => (string)($record->documentid ?? ''),
            'type' => (string)($record->transcripttype ?? 'official'),
            'status' => (string)($record->status ?? 'issued'),
            'issuedby' => (int)($record->issuedby ?? 0),
            'issuedat' => (int)($record->issuedat ?? 0),
            'issuereason' => (string)($record->issuereason ?? ''),
        ],
    ];
}

function pqct_workspace_official_docs(int $workspaceid, int $limit = 500): array {
    global $DB;

    if ($workspaceid <= 0 || !pqct_document_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_transcript_doc', [
        'workspaceid' => $workspaceid,
    ], 'issuedat DESC, id DESC', '*', 0, $limit));
}

function pqct_mark_official_pdf_generated($record, string $pdfbytes): void {
    global $DB;

    if (!$record || empty($record->id) || !pqct_document_schema_ready()) {
        return;
    }
    try {
        $update = (object)[
            'id' => (int)$record->id,
        'pdfhash' => hash('sha256', $pdfbytes),
            'pdfgeneratedat' => time(),
            'timemodified' => time(),
        ];
        $DB->update_record('local_prequran_transcript_doc', $update);
    } catch (Throwable $e) {
        debugging('Could not update transcript PDF hash: ' . $e->getMessage(), DEBUG_DEVELOPER);
    }
}

function pqct_active_transcript_holds(int $studentid, int $workspaceid): array {
    global $DB;

    if ($studentid <= 0 || $workspaceid <= 0 || !pqct_hold_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_transcript_hold', [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'status' => 'active',
    ], 'timecreated DESC, id DESC'));
}

function pqct_all_transcript_holds(int $studentid, int $workspaceid): array {
    global $DB;

    if ($studentid <= 0 || $workspaceid <= 0 || !pqct_hold_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_transcript_hold', [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
    ], 'status ASC, timecreated DESC, id DESC'));
}

function pqct_create_transcript_hold(int $studentid, int $workspaceid, int $actorid, string $holdtype, string $reason): int {
    global $DB;

    $holdtype = trim($holdtype) !== '' ? trim($holdtype) : 'registrar';
    $reason = trim($reason);
    if ($studentid <= 0 || $workspaceid <= 0 || $actorid <= 0 || $reason === '' || !pqh_user_can_manage_workspace($actorid, $workspaceid) || !pqct_hold_schema_ready()) {
        throw new invalid_parameter_exception('Transcript hold cannot be created.');
    }
    $now = time();
    $id = (int)$DB->insert_record('local_prequran_transcript_hold', (object)[
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'holdtype' => core_text::substr($holdtype, 0, 80),
        'status' => 'active',
        'reason' => $reason,
        'resolutionnote' => '',
        'createdby' => $actorid,
        'resolvedby' => 0,
        'resolvedat' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    pqco_course_audit('transcript_hold_created', 'student', $studentid, ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'holdid' => $id, 'holdtype' => $holdtype]);
    return $id;
}

function pqct_resolve_transcript_hold(int $holdid, int $workspaceid, int $actorid, string $resolution): void {
    global $DB;

    $resolution = trim($resolution);
    if ($holdid <= 0 || $workspaceid <= 0 || $actorid <= 0 || $resolution === '' || !pqh_user_can_manage_workspace($actorid, $workspaceid) || !pqct_hold_schema_ready()) {
        throw new invalid_parameter_exception('Transcript hold cannot be resolved.');
    }
    $hold = $DB->get_record('local_prequran_transcript_hold', ['id' => $holdid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
    $hold->status = 'resolved';
    $hold->resolutionnote = $resolution;
    $hold->resolvedby = $actorid;
    $hold->resolvedat = time();
    $hold->timemodified = time();
    $DB->update_record('local_prequran_transcript_hold', $hold);
    pqco_course_audit('transcript_hold_resolved', 'student', (int)$hold->studentid, ['workspaceid' => $workspaceid, 'studentid' => (int)$hold->studentid, 'holdid' => $holdid]);
}

function pqct_create_transcript_correction(int $studentid, int $workspaceid, int $actorid, string $documentid, string $fieldpath, string $oldvalue, string $newvalue, string $reason): int {
    global $DB;

    $fieldpath = trim($fieldpath);
    $reason = trim($reason);
    if ($studentid <= 0 || $workspaceid <= 0 || $actorid <= 0 || $fieldpath === '' || $reason === '' || !pqh_user_can_manage_workspace($actorid, $workspaceid) || !pqct_override_schema_ready()) {
        throw new invalid_parameter_exception('Transcript correction cannot be recorded.');
    }
    $now = time();
    $id = (int)$DB->insert_record('local_prequran_transcript_override', (object)[
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'documentid' => core_text::substr($documentid, 0, 80),
        'fieldpath' => core_text::substr($fieldpath, 0, 255),
        'oldvalue' => $oldvalue,
        'newvalue' => $newvalue,
        'reason' => $reason,
        'status' => 'approved',
        'requestedby' => $actorid,
        'approvedby' => $actorid,
        'approvedat' => $now,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    pqco_course_audit('transcript_correction_recorded', 'student', $studentid, ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'overrideid' => $id, 'documentid' => $documentid, 'fieldpath' => $fieldpath]);
    return $id;
}

function pqct_transcript_corrections(int $studentid, int $workspaceid): array {
    global $DB;

    if ($studentid <= 0 || $workspaceid <= 0 || !pqct_override_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_transcript_override', [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
    ], 'timecreated DESC, id DESC'));
}

function pqct_revoke_official_transcript(string $documentid, int $actorid, string $reason): void {
    global $DB;

    $reason = trim($reason);
    $record = pqct_load_official_transcript_doc($documentid, $actorid);
    if (!$record || $reason === '') {
        throw new invalid_parameter_exception('Official transcript cannot be revoked.');
    }
    if (!in_array((string)$record->status, ['issued', 'reissued', 'stale'], true)) {
        throw new invalid_parameter_exception('Only issued transcripts can be revoked.');
    }
    $record->status = 'revoked';
    $record->revocationreason = $reason;
    $record->revokedby = $actorid;
    $record->revokedat = time();
    $record->timemodified = time();
    $DB->update_record('local_prequran_transcript_doc', $record);
    pqco_course_audit('official_transcript_revoked', 'transcript_doc', (int)$record->id, ['workspaceid' => (int)$record->workspaceid, 'studentid' => (int)$record->studentid, 'documentid' => $documentid]);
    pqct_notify_transcript_event('official_transcript_revoked', $record, null, 'Official transcript revoked', 'An official transcript was revoked. Document ID: ' . $documentid);
}

function pqct_reissue_official_transcript(string $documentid, int $actorid, ?stdClass $consumercontext, string $reason): array {
    global $DB;

    $reason = trim($reason);
    $old = pqct_load_official_transcript_doc($documentid, $actorid);
    if (!$old || $reason === '') {
        throw new invalid_parameter_exception('Official transcript cannot be reissued.');
    }
    if ((string)$old->status === 'revoked') {
        throw new invalid_parameter_exception('Revoked transcripts cannot be reissued directly.');
    }
    $issued = pqct_issue_official_transcript((int)$old->studentid, (int)$old->workspaceid, $consumercontext, $actorid, $reason, $documentid);
    $newdocid = (string)$issued['record']->documentid;
    $old->status = 'reissued';
    $old->replacedbydocumentid = $newdocid;
    $old->timemodified = time();
    $DB->update_record('local_prequran_transcript_doc', $old);
    pqco_course_audit('official_transcript_reissued', 'transcript_doc', (int)$old->id, ['workspaceid' => (int)$old->workspaceid, 'studentid' => (int)$old->studentid, 'documentid' => $documentid, 'newdocumentid' => $newdocid]);
    pqct_notify_transcript_event('official_transcript_reissued', $old, $consumercontext, 'Official transcript reissued', 'An official transcript was reissued. Previous document ID: ' . $documentid . '. New document ID: ' . $newdocid);
    return $issued;
}

function pqct_mark_official_transcript_stale($record, string $reason): bool {
    global $DB;

    if (!$record || empty($record->id) || (string)($record->status ?? '') !== 'issued' || trim($reason) === '' || !pqct_document_schema_ready()) {
        return false;
    }
    $record->status = 'stale';
    $record->revocationreason = 'Stale review recommended: ' . trim($reason);
    $record->timemodified = time();
    $DB->update_record('local_prequran_transcript_doc', $record);
    pqco_course_audit('official_transcript_marked_stale', 'transcript_doc', (int)$record->id, [
        'workspaceid' => (int)$record->workspaceid,
        'studentid' => (int)$record->studentid,
        'documentid' => (string)$record->documentid,
        'reason' => $reason,
    ]);
    pqct_notify_transcript_event('official_transcript_stale', $record, null, 'Official transcript may need reissue', 'Transcript-affecting data changed after issue. Document ID: ' . (string)$record->documentid);
    return true;
}

function pqct_notify_transcript_event(string $eventtype, $record, ?stdClass $consumercontext, string $subject, string $message): int {
    if (!$record || empty($record->workspaceid)) {
        return 0;
    }
    $params = ['workspaceid' => (int)$record->workspaceid, 'documentid' => (string)($record->documentid ?? '')];
    if ($consumercontext && !empty($consumercontext->consumerslug)) {
        $params['consumer'] = (string)$consumercontext->consumerslug;
    }
    $url = new moodle_url('/local/hubredirect/course_transcript_official.php', $params);
    return pqco_notify_workspace_admins((int)$record->workspaceid, $subject, $message, $url, 'Open transcript', $eventtype, [
        'workspaceid' => (int)$record->workspaceid,
        'consumerid' => (int)($record->consumerid ?? 0),
        'studentid' => (int)($record->studentid ?? 0),
        'documentid' => (string)($record->documentid ?? ''),
    ]);
}

function pqct_verification_secret(): string {
    global $CFG;

    $secret = (string)($CFG->passwordsaltmain ?? '');
    if ($secret === '') {
        $secret = (string)($CFG->wwwroot ?? 'pre-quraan-transcript-verification');
    }
    return $secret;
}

function pqct_verification_code($record): string {
    $documentid = (string)($record->documentid ?? '');
    $tokenhash = (string)($record->verificationtokenhash ?? '');
    $snapshothash = (string)($record->snapshothash ?? '');
    if ($documentid === '' || $tokenhash === '') {
        return '';
    }
    return substr(hash_hmac('sha256', $documentid . '|' . $tokenhash . '|' . $snapshothash, pqct_verification_secret()), 0, 32);
}

function pqct_verify_official_transcript_code($record, string $code = '', string $token = ''): bool {
    $code = trim($code);
    $token = trim($token);
    if (!$record || ($code === '' && $token === '')) {
        return false;
    }
    if ($code !== '') {
        $expectedcode = pqct_verification_code($record);
        if ($expectedcode !== '' && hash_equals($expectedcode, $code)) {
            return true;
        }
    }
    if ($token !== '') {
        $tokenhash = (string)($record->verificationtokenhash ?? '');
        if ($tokenhash !== '' && hash_equals($tokenhash, hash('sha256', $token))) {
            return true;
        }
    }
    return false;
}

function pqct_verification_url(?stdClass $consumercontext, string $documentid, string $code = ''): string {
    $path = '/local/hubredirect/transcript_verify.php';
    $params = ['documentid' => $documentid];
    $code = trim($code);
    if ($code !== '') {
        $params['code'] = $code;
    }
    $domain = trim((string)($consumercontext->domain ?? ''));
    if ($domain !== '') {
        return 'https://' . preg_replace('/^https?:\/\//i', '', $domain) . $path . '?' . http_build_query($params);
    }
    return (new moodle_url($path, $params))->out(false);
}

function pqct_student_assigned_to_teacher(int $teacherid, int $studentid, int $workspaceid): bool {
    global $DB;

    if ($teacherid <= 0 || $studentid <= 0 || $workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_teacher_student')) {
        return false;
    }
    return $DB->record_exists('local_prequran_teacher_student', [
        'workspaceid' => $workspaceid,
        'teacherid' => $teacherid,
        'studentid' => $studentid,
        'status' => 'active',
    ]);
}

function pqct_user_can_view_student_transcript(int $viewerid, int $studentid, int $workspaceid): bool {
    if ($viewerid <= 0 || $studentid <= 0 || $workspaceid <= 0) {
        return false;
    }
    if (pqh_user_can_manage_workspace($viewerid, $workspaceid)) {
        return true;
    }

    $role = pqh_user_workspace_role($viewerid, $workspaceid);
    if ($role === 'student') {
        return $viewerid === $studentid;
    }
    if ($role === 'parent') {
        return array_key_exists($studentid, pqco_workspace_students_for_user($workspaceid, $viewerid));
    }
    if (in_array($role, ['teacher', 'assistant_teacher'], true)) {
        return pqct_student_assigned_to_teacher($viewerid, $studentid, $workspaceid);
    }
    return false;
}

function pqct_students_for_transcript_viewer(int $viewerid, int $workspaceid): array {
    global $DB;

    if ($viewerid <= 0 || $workspaceid <= 0) {
        return [];
    }

    if (pqh_user_can_manage_workspace($viewerid, $workspaceid)) {
        return pqco_workspace_students_for_user($workspaceid, $viewerid);
    }

    $role = pqh_user_workspace_role($viewerid, $workspaceid);
    if ($role === 'student') {
        $user = core_user::get_user($viewerid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING);
        return $user ? [$viewerid => $user] : [];
    }
    if ($role === 'parent') {
        return pqco_workspace_students_for_user($workspaceid, $viewerid);
    }
    if (!in_array($role, ['teacher', 'assistant_teacher'], true) || !pqh_table_exists_safe('local_prequran_teacher_student')) {
        return [];
    }

    try {
        $rows = $DB->get_records_sql(
            "SELECT u.id, u.firstname, u.lastname, u.email, u.idnumber
               FROM {local_prequran_teacher_student} ts
               JOIN {local_prequran_workspace_member} wm
                 ON wm.workspaceid = ts.workspaceid
                AND wm.userid = ts.studentid
                AND wm.workspace_role = :studentrole
                AND wm.status = :memberstatus
               JOIN {user} u ON u.id = ts.studentid
              WHERE ts.workspaceid = :workspaceid
                AND ts.teacherid = :teacherid
                AND ts.status = :assignmentstatus
           ORDER BY u.lastname ASC, u.firstname ASC",
            [
                'workspaceid' => $workspaceid,
                'teacherid' => $viewerid,
                'assignmentstatus' => 'active',
                'studentrole' => 'student',
                'memberstatus' => 'active',
            ]
        );
    } catch (Throwable $e) {
        return [];
    }

    $students = [];
    foreach ($rows as $row) {
        $students[(int)$row->id] = $row;
    }
    return $students;
}

function pqct_transcript_url(int $studentid, int $workspaceid, ?stdClass $consumercontext = null, array $params = []): moodle_url {
    $consumercontext = $consumercontext ?: pqh_requested_consumer_context();
    if (!empty($consumercontext->consumerslug)) {
        $params['consumer'] = (string)$consumercontext->consumerslug;
    }
    if ($workspaceid > 0) {
        $params['workspaceid'] = $workspaceid;
    }
    if ($studentid > 0) {
        $params['studentid'] = $studentid;
    }
    return new moodle_url('/local/hubredirect/course_transcript.php', $params);
}

function pqct_student_active_in_workspace(int $studentid, int $workspaceid): bool {
    global $DB;

    if ($studentid <= 0 || $workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return false;
    }
    return $DB->record_exists('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $studentid,
        'workspace_role' => 'student',
        'status' => 'active',
    ]);
}

function pqct_active_moodle_enrolment_info(int $studentid, int $courseid): ?stdClass {
    global $DB;

    if ($studentid <= 0 || $courseid <= 0) {
        return null;
    }
    try {
        $row = $DB->get_record_sql(
            "SELECT ue.id AS userenrolmentid, ue.timestart, ue.timeend, ue.timecreated,
                    ue.timemodified, ue.status AS userenrolstatus,
                    e.id AS enrolid, e.status AS enrolstatus, e.enrol
               FROM {enrol} e
               JOIN {user_enrolments} ue ON ue.enrolid = e.id
              WHERE e.courseid = :courseid
                AND e.enrol = :enrolmethod
                AND e.status = 0
                AND ue.userid = :studentid
                AND ue.status = 0
           ORDER BY ue.timestart DESC, ue.id DESC",
            ['courseid' => $courseid, 'enrolmethod' => 'manual', 'studentid' => $studentid],
            IGNORE_MULTIPLE
        );
        return $row ?: null;
    } catch (Throwable $e) {
        return null;
    }
}

function pqct_course_grade_summary(int $studentid, int $courseid, int $workspaceid = 0, int $offeringid = 0): array {
    global $DB;

    $empty = [
        'recorded' => false,
        'source' => 'none',
        'finalgrade' => null,
        'rawgrade' => null,
        'rawgrademax' => null,
        'percentage' => null,
        'hidden' => false,
        'locked' => false,
        'timemodified' => 0,
    ];
    if ($studentid <= 0) {
        return $empty;
    }
    if ($workspaceid > 0 && $offeringid > 0 && pqh_table_exists_safe('local_prequran_course_grade')) {
        try {
            $local = $DB->get_record_sql(
                "SELECT *
                   FROM {local_prequran_course_grade}
                  WHERE workspaceid = :workspaceid
                    AND offeringid = :offeringid
                    AND studentid = :studentid
                    AND status = :status
               ORDER BY publishedat DESC, timemodified DESC, id DESC",
                ['workspaceid' => $workspaceid, 'offeringid' => $offeringid, 'studentid' => $studentid, 'status' => 'published'],
                IGNORE_MULTIPLE
            );
            if ($local && (string)($local->final_percent ?? '') !== '') {
                $percent = pqgp_money_float((string)$local->final_percent);
                return [
                    'recorded' => true,
                    'source' => 'local_gradebook',
                    'finalgrade' => $percent,
                    'rawgrade' => $percent,
                    'rawgrademax' => 100.0,
                    'percentage' => round($percent, 2),
                    'letter' => (string)($local->letter_grade ?? pqgp_letter($percent)),
                    'hidden' => false,
                    'locked' => false,
                    'timemodified' => (int)($local->timemodified ?? 0),
                    'coursegradeid' => (int)$local->id,
                    'publishedat' => (int)($local->publishedat ?? 0),
                ];
            }
        } catch (Throwable $e) {
            // Fall back to Moodle gradebook if the local gradebook row is unavailable.
        }
    }
    if ($courseid <= 0) {
        return $empty;
    }
    try {
        $grade = $DB->get_record_sql(
            "SELECT gg.finalgrade, gg.rawgrade, gg.rawgrademax, gg.hidden AS gradehidden,
                    gg.locked AS gradelocked, gg.timemodified,
                    gi.hidden AS itemhidden, gi.locked AS itemlocked
               FROM {grade_items} gi
               JOIN {grade_grades} gg ON gg.itemid = gi.id
              WHERE gi.courseid = :courseid
                AND gi.itemtype = :itemtype
                AND gg.userid = :studentid
           ORDER BY gi.id ASC",
            ['courseid' => $courseid, 'itemtype' => 'course', 'studentid' => $studentid],
            IGNORE_MULTIPLE
        );
    } catch (Throwable $e) {
        return $empty;
    }
    if (!$grade) {
        return $empty;
    }
    $max = (float)($grade->rawgrademax ?? 0);
    $final = $grade->finalgrade !== null ? (float)$grade->finalgrade : null;
    return [
        'recorded' => $final !== null,
        'source' => 'moodle_gradebook',
        'finalgrade' => $final,
        'rawgrade' => $grade->rawgrade !== null ? (float)$grade->rawgrade : null,
        'rawgrademax' => $max > 0 ? $max : null,
        'percentage' => ($final !== null && $max > 0) ? round(($final / $max) * 100, 2) : null,
        'hidden' => !empty($grade->gradehidden) || !empty($grade->itemhidden),
        'locked' => !empty($grade->gradelocked) || !empty($grade->itemlocked),
        'timemodified' => (int)($grade->timemodified ?? 0),
    ];
}

function pqct_course_completion_summary(int $studentid, int $courseid): array {
    global $DB;

    $empty = ['recorded' => false, 'completed' => false, 'timecompleted' => 0, 'status' => 'not_recorded'];
    if ($studentid <= 0 || $courseid <= 0 || !pqh_table_exists_safe('course_completions')) {
        return $empty;
    }
    try {
        $row = $DB->get_record('course_completions', ['userid' => $studentid, 'course' => $courseid], '*', IGNORE_MISSING);
    } catch (Throwable $e) {
        return $empty;
    }
    if (!$row) {
        return $empty;
    }
    $timecompleted = (int)($row->timecompleted ?? 0);
    return [
        'recorded' => true,
        'completed' => $timecompleted > 0,
        'timecompleted' => $timecompleted,
        'status' => $timecompleted > 0 ? 'completed' : 'in_progress',
    ];
}

function pqct_local_progress_summary(int $studentid, string $coursekey): array {
    global $DB;

    $summary = [
        'recorded' => false,
        'overall_status' => 'not_recorded',
        'completion_percent' => null,
        'overall_starttime' => 0,
        'overall_completiontime' => 0,
        'overall_lastactivity' => 0,
        'matched_rows' => 0,
    ];
    $coursekey = pqh_normalize_course_key($coursekey);
    if ($studentid <= 0 || $coursekey === '' || !pqh_table_exists_safe('local_prequran_lessonprog')) {
        return $summary;
    }

    try {
        $params = ['userid' => $studentid, 'coursekeylesson' => $coursekey, 'coursekeyunit' => $coursekey];
        $envsql = '';
        if (pqh_table_has_field_safe('local_prequran_lessonprog', 'environment')) {
            $params['environment'] = 'production';
            $envsql = " AND (environment = :environment OR environment = '' OR environment IS NULL)";
        }
        $rows = $DB->get_records_sql(
            "SELECT id, overall_status, overall_starttime, overall_completiontime,
                    overall_lastactivity, completion_percent, steps_total, steps_completed
               FROM {local_prequran_lessonprog}
              WHERE userid = :userid
                AND (lessonid = :coursekeylesson OR unitid = :coursekeyunit)
                    {$envsql}
           ORDER BY overall_lastactivity DESC, timemodified DESC",
            $params,
            0,
            20
        );
    } catch (Throwable $e) {
        return $summary;
    }

    if (!$rows) {
        return $summary;
    }
    $beststatusrank = ['completed' => 3, 'in_progress' => 2, 'not_started' => 1, 'not_recorded' => 0];
    $beststatus = 'not_recorded';
    $maxpercent = 0;
    $start = 0;
    $complete = 0;
    $last = 0;
    foreach ($rows as $row) {
        $status = (string)($row->overall_status ?? 'not_started');
        if (($beststatusrank[$status] ?? 0) > ($beststatusrank[$beststatus] ?? 0)) {
            $beststatus = $status;
        }
        $maxpercent = max($maxpercent, (int)($row->completion_percent ?? 0));
        $start = max($start, (int)($row->overall_starttime ?? 0));
        $complete = max($complete, (int)($row->overall_completiontime ?? 0));
        $last = max($last, (int)($row->overall_lastactivity ?? 0));
    }
    return [
        'recorded' => true,
        'overall_status' => $beststatus,
        'completion_percent' => $maxpercent,
        'overall_starttime' => $start,
        'overall_completiontime' => $complete,
        'overall_lastactivity' => $last,
        'matched_rows' => count($rows),
    ];
}

function pqct_quiz_summary(int $studentid, string $coursekey): array {
    global $DB;

    $summary = [
        'recorded' => false,
        'best_percent' => null,
        'completed_attempts' => 0,
        'latest_completed_at' => 0,
    ];
    $coursekey = pqh_normalize_course_key($coursekey);
    if ($studentid <= 0 || $coursekey === '' || !pqh_table_exists_safe('local_prequran_quiz_attempt')) {
        return $summary;
    }
    try {
        $params = ['userid' => $studentid, 'coursekeylesson' => $coursekey, 'coursekeyunit' => $coursekey];
        $envsql = '';
        if (pqh_table_has_field_safe('local_prequran_quiz_attempt', 'environment')) {
            $params['environment'] = 'production';
            $envsql = " AND (environment = :environment OR environment = '' OR environment IS NULL)";
        }
        $rows = $DB->get_records_sql(
            "SELECT id, status, percent, completed_at, last_activity_at
               FROM {local_prequran_quiz_attempt}
              WHERE userid = :userid
                AND (lessonid = :coursekeylesson OR unitid = :coursekeyunit)
                    {$envsql}
           ORDER BY last_activity_at DESC, completed_at DESC",
            $params,
            0,
            30
        );
    } catch (Throwable $e) {
        return $summary;
    }
    if (!$rows) {
        return $summary;
    }
    $best = 0;
    $completed = 0;
    $latest = 0;
    foreach ($rows as $row) {
        $best = max($best, (int)($row->percent ?? 0));
        if ((int)($row->completed_at ?? 0) > 0 || in_array((string)($row->status ?? ''), ['completed', 'submitted'], true)) {
            $completed++;
            $latest = max($latest, (int)($row->completed_at ?? 0));
        }
    }
    return [
        'recorded' => true,
        'best_percent' => $best,
        'completed_attempts' => $completed,
        'latest_completed_at' => $latest,
    ];
}

function pqct_attendance_summary(int $studentid, int $workspaceid, string $coursekey): array {
    global $DB;

    $summary = [
        'recorded' => false,
        'present' => 0,
        'late' => 0,
        'absent' => 0,
        'attended' => 0,
        'technical_issue' => 0,
        'total_marked' => 0,
    ];
    $coursekey = pqh_normalize_course_key($coursekey);
    if ($studentid <= 0 || $workspaceid <= 0 || $coursekey === ''
        || !pqh_table_exists_safe('local_prequran_live_attendance')
        || !pqh_table_exists_safe('local_prequran_live_session')) {
        return $summary;
    }
    try {
        $params = [
            'studentid' => $studentid,
            'workspaceid' => $workspaceid,
            'lessonid' => $coursekey,
            'unitid' => $coursekey,
        ];
        $where = "a.studentid = :studentid AND (s.lessonid = :lessonid OR s.unitid = :unitid)";
        if (pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')) {
            $where .= " AND (a.workspaceid = :workspaceid OR (COALESCE(a.workspaceid, 0) = 0 AND s.workspaceid = :workspaceidfallback))";
            $params['workspaceidfallback'] = $workspaceid;
        } else {
            $where .= " AND s.workspaceid = :workspaceid";
        }
        $rows = $DB->get_records_sql(
            "SELECT a.attendance_status,
                    COUNT(1) AS statuscount,
                    SUM(CASE WHEN a.technical_issue = 1 THEN 1 ELSE 0 END) AS technicalcount
               FROM {local_prequran_live_attendance} a
               JOIN {local_prequran_live_session} s ON s.id = a.sessionid
              WHERE {$where}
           GROUP BY a.attendance_status",
            $params
        );
    } catch (Throwable $e) {
        return $summary;
    }
    foreach ($rows as $row) {
        $status = (string)($row->attendance_status ?? '');
        $count = (int)($row->statuscount ?? 0);
        if (array_key_exists($status, $summary)) {
            $summary[$status] += $count;
        }
        if (in_array($status, ['present', 'late', 'attended'], true)) {
            $summary['attended'] += $count;
        }
        $summary['technical_issue'] += (int)($row->technicalcount ?? 0);
        $summary['total_marked'] += $count;
    }
    $summary['recorded'] = $summary['total_marked'] > 0;
    return $summary;
}

function pqct_teacher_of_record(int $studentid, int $workspaceid): array {
    global $DB;

    if ($studentid <= 0 || $workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_teacher_student')) {
        return [];
    }
    try {
        $rows = $DB->get_records_sql(
            "SELECT u.id, u.firstname, u.lastname, u.email, u.idnumber
               FROM {local_prequran_teacher_student} ts
               JOIN {user} u ON u.id = ts.teacherid
              WHERE ts.workspaceid = :workspaceid
                AND ts.studentid = :studentid
                AND ts.status = :status
           ORDER BY ts.timemodified DESC, ts.id DESC",
            ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'status' => 'active'],
            0,
            5
        );
    } catch (Throwable $e) {
        return [];
    }
    $teachers = [];
    foreach ($rows as $row) {
        $teachers[] = [
            'userid' => (int)$row->id,
            'name' => fullname($row),
            'email' => (string)$row->email,
            'account_no' => pqh_account_no_value($row),
        ];
    }
    return $teachers;
}

function pqct_normalize_line_status($request, ?stdClass $moodleenrol, array $completion, array $progress, array $grade, array &$warnings): string {
    $status = (string)($request->status ?? '');
    $context = [
        'requestid' => (int)($request->id ?? 0),
        'offeringid' => (int)($request->offeringid ?? 0),
        'studentid' => (int)($request->studentid ?? 0),
        'moodlecourseid' => (int)($request->moodlecourseid ?? 0),
    ];

    if ($status === 'pending') {
        return 'requested';
    }
    if ($status === 'cancelled' || $status === 'rejected' || $status === 'dropped') {
        return $status;
    }
    if ($status === 'drop_requested') {
        return 'withdrawn';
    }
    if ($status === 'approved') {
        if ($moodleenrol) {
            if ((int)($request->moodleenrolledat ?? 0) <= 0) {
                $warnings[] = pqct_warning(
                    'moodle_enrolled_timestamp_missing',
                    'warning',
                    'Moodle enrollment is active but the local enrollment timestamp is missing.',
                    $context,
                    'Backfill or retry Moodle sync after confirming the enrollment.'
                );
            }
            return 'enrolled';
        }
        $warnings[] = pqct_warning(
            'approved_pending_moodle_sync',
            'blocker',
            'The request is approved locally but active Moodle enrollment was not found.',
            $context,
            'Retry Moodle sync or repair the linked Moodle manual enrollment.'
        );
        return 'approved_pending_sync';
    }
    if ($status === 'enrolled') {
        if (!$moodleenrol) {
            $warnings[] = pqct_warning(
                'local_enrolled_without_active_moodle_enrollment',
                'blocker',
                'The local request is marked enrolled but active Moodle enrollment was not found.',
                $context,
                'Repair Moodle enrollment or adjust the local request status.'
            );
            return 'enrolled';
        }
        if (!empty($completion['completed']) || (string)($progress['overall_status'] ?? '') === 'completed') {
            return 'completed';
        }
        if ((int)($progress['completion_percent'] ?? 0) > 0 || !empty($grade['recorded'])) {
            return 'in_progress';
        }
        return 'enrolled';
    }
    return $status !== '' ? $status : 'unknown';
}

function pqct_resolve_student_transcript(int $studentid, int $workspaceid, ?stdClass $consumercontext = null, array $options = []): array {
    global $DB, $USER;

    $warnings = [];
    $lines = [];
    $diagnostics = [
        'moodle_only_enrollments' => [],
        'orphan_requests' => [],
        'resolver_version' => 'phase1',
    ];

    $consumercontext = $consumercontext ?: pqh_requested_consumer_context();
    $viewerid = (int)($options['viewerid'] ?? ($USER->id ?? 0));
    $includeinternal = !empty($options['include_internal']);
    $policyinfo = pqct_workspace_transcript_policy($workspaceid);
    $policy = $policyinfo['policy'];

    if (!pqct_tables_ready()) {
        $warnings[] = pqct_warning('schema_missing', 'blocker', 'Course transcript source tables are not ready.');
    }

    $workspace = $workspaceid > 0 && pqh_table_exists_safe('local_prequran_workspace')
        ? $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING)
        : false;
    if (!$workspace) {
        $warnings[] = pqct_warning('workspace_missing', 'blocker', 'The requested workspace could not be found.', ['workspaceid' => $workspaceid]);
    }

    $student = $studentid > 0 ? core_user::get_user($studentid, 'id,firstname,lastname,email,idnumber,deleted,suspended', IGNORE_MISSING) : false;
    if (!$student || !empty($student->deleted)) {
        $warnings[] = pqct_warning('student_identity_incomplete', 'blocker', 'The requested student could not be found.', ['studentid' => $studentid]);
    }

    $canview = $workspace && $student ? pqct_user_can_view_student_transcript($viewerid, $studentid, $workspaceid) : false;
    if (!$canview) {
        $warnings[] = pqct_warning(
            'transcript_access_denied',
            'blocker',
            'The current user is not allowed to view this student transcript.',
            ['viewerid' => $viewerid, 'studentid' => $studentid, 'workspaceid' => $workspaceid]
        );
    }

    if ($student && !pqct_student_active_in_workspace($studentid, $workspaceid)) {
        $warnings[] = pqct_warning(
            'student_not_workspace_member',
            'blocker',
            'The student is not an active student member of this workspace.',
            ['studentid' => $studentid, 'workspaceid' => $workspaceid],
            'Repair workspace membership before using official transcript data.'
        );
    }

    $accountno = $student ? pqh_account_no_value($student) : '';
    if ($student && $accountno === '') {
        $warnings[] = pqct_warning(
            'student_account_no_missing',
            'warning',
            'The student does not have the expected account number in Moodle idnumber.',
            ['studentid' => $studentid],
            'Repair the student account number before official issue if the workspace requires it.'
        );
    }
    if ((string)$policyinfo['source'] !== 'workspace') {
        $warnings[] = pqct_warning(
            'transcript_policy_defaulted',
            'warning',
            'This workspace is using the default transcript policy.',
            ['workspaceid' => $workspaceid],
            'Review and save transcript policy settings before official transcript issue.'
        );
    }

    $header = [
        'transcript_type' => 'unofficial',
        'generated_at' => time(),
        'policy' => [
            'source' => (string)$policyinfo['source'],
            'version' => (int)$policyinfo['policyversion'],
            'hash' => (string)$policyinfo['policyhash'],
            'settings' => $policy,
        ],
        'consumer' => [
            'id' => (int)($consumercontext->consumerid ?? 0),
            'slug' => (string)($consumercontext->consumerslug ?? ''),
            'name' => (string)($consumercontext->consumername ?? 'EduPlatform'),
            'domain' => (string)($consumercontext->domain ?? ''),
            'supportemail' => (string)($consumercontext->supportemail ?? ''),
        ],
        'workspace' => [
            'id' => $workspaceid,
            'name' => $workspace ? (string)$workspace->name : '',
            'slug' => $workspace ? (string)$workspace->slug : '',
            'type' => $workspace ? (string)$workspace->workspace_type : '',
        ],
        'student' => [
            'id' => $studentid,
            'name' => $student ? fullname($student) : '',
            'email' => $student ? (string)$student->email : '',
            'account_no' => $accountno,
            'suspended' => $student ? (int)$student->suspended : 0,
        ],
    ];

    if (!$canview || !$workspace || !$student || !pqco_table_ready()) {
        return [
            'header' => $header,
            'permission' => ['viewerid' => $viewerid, 'can_view' => $canview],
            'lines' => [],
            'summary' => ['line_count' => 0, 'warnings' => count($warnings)],
            'policy' => $policyinfo,
            'warnings' => $warnings,
            'diagnostics' => $includeinternal ? $diagnostics : [],
        ];
    }

    try {
        $requests = array_values($DB->get_records_sql(
            "SELECT r.*, o.consumerid AS offering_consumerid, o.workspaceid AS offering_workspaceid,
                    o.moodlecourseid, o.course_key, o.title AS offering_title, o.summary AS offering_summary,
                    o.syllabus, o.prerequisites, o.startdate, o.enddate, o.visibility,
                    o.status AS offering_status,
                    c.fullname AS moodle_fullname, c.shortname AS moodle_shortname,
                    c.idnumber AS moodle_idnumber, c.visible AS moodle_visible,
                    c.startdate AS moodle_startdate, c.enddate AS moodle_enddate
               FROM {local_prequran_course_enrol_req} r
               JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
          LEFT JOIN {course} c ON c.id = o.moodlecourseid
              WHERE r.workspaceid = :workspaceid
                AND r.studentid = :studentid
           ORDER BY COALESCE(o.startdate, r.timecreated) ASC, r.timecreated ASC, r.id ASC",
            ['workspaceid' => $workspaceid, 'studentid' => $studentid],
            0,
            500
        ));
    } catch (Throwable $e) {
        $requests = [];
        $warnings[] = pqct_warning('resolver_query_failed', 'blocker', 'The transcript resolver could not load course requests.');
    }

    foreach ($requests as $request) {
        $linewarnings = [];
        $courseid = (int)($request->moodlecourseid ?? 0);
        $coursekey = pqh_normalize_course_key((string)($request->course_key ?? ''));
        $moodleenrol = pqct_active_moodle_enrolment_info($studentid, $courseid);
        $grade = pqct_course_grade_summary($studentid, $courseid, $workspaceid, (int)$request->offeringid);
        $completion = pqct_course_completion_summary($studentid, $courseid);
        $progress = pqct_local_progress_summary($studentid, $coursekey);
        $quiz = pqct_quiz_summary($studentid, $coursekey);
        $attendance = pqct_attendance_summary($studentid, $workspaceid, $coursekey);

        if ($courseid <= 0 || empty($request->moodle_fullname)) {
            $linewarnings[] = pqct_warning(
                'moodle_course_missing',
                'blocker',
                'The course offering is not linked to an existing Moodle course.',
                ['requestid' => (int)$request->id, 'offeringid' => (int)$request->offeringid, 'moodlecourseid' => $courseid],
                'Link or create the Moodle course before official transcript issue.'
            );
        } else if ((int)($request->moodle_visible ?? 0) !== 1) {
            $linewarnings[] = pqct_warning(
                'moodle_course_hidden',
                'warning',
                'The linked Moodle course is hidden.',
                ['requestid' => (int)$request->id, 'offeringid' => (int)$request->offeringid, 'moodlecourseid' => $courseid],
                'Confirm whether hidden courses are intended to appear on transcripts.'
            );
        }
        if (!$grade['recorded']) {
            $linewarnings[] = pqct_warning('grade_not_recorded', 'warning', 'No published local or Moodle course final grade was found.', ['requestid' => (int)$request->id, 'moodlecourseid' => $courseid]);
        } else if ($grade['hidden'] || $grade['locked']) {
            $linewarnings[] = pqct_warning('grade_hidden_or_locked', 'warning', 'The Moodle course grade is hidden or locked.', ['requestid' => (int)$request->id, 'moodlecourseid' => $courseid]);
        }
        if (!$completion['recorded'] && !$progress['recorded']) {
            $linewarnings[] = pqct_warning('completion_not_recorded', 'warning', 'No Moodle or local completion evidence was found.', ['requestid' => (int)$request->id, 'moodlecourseid' => $courseid]);
        }

        $normalizedstatus = pqct_normalize_line_status($request, $moodleenrol, $completion, $progress, $grade, $linewarnings);
        $warnings = array_merge($warnings, $linewarnings);

        $line = [
            'source' => 'course_offering',
            'requestid' => (int)$request->id,
            'offeringid' => (int)$request->offeringid,
            'consumerid' => (int)($request->consumerid ?? $request->offering_consumerid ?? 0),
            'workspaceid' => $workspaceid,
            'course' => [
                'key' => $coursekey !== '' ? $coursekey : (string)($request->course_key ?? ''),
                'title' => (string)($request->offering_title ?: $request->moodle_fullname),
                'moodlecourseid' => $courseid,
                'moodle_fullname' => (string)($request->moodle_fullname ?? ''),
                'moodle_shortname' => (string)($request->moodle_shortname ?? ''),
                'moodle_idnumber' => (string)($request->moodle_idnumber ?? ''),
                'visible' => (int)($request->moodle_visible ?? 0),
                'startdate' => (int)($request->startdate ?: $request->moodle_startdate ?? 0),
                'enddate' => (int)($request->enddate ?: $request->moodle_enddate ?? 0),
            ],
            'status' => [
                'local' => (string)$request->status,
                'normalized' => $normalizedstatus,
                'offering' => (string)$request->offering_status,
            ],
            'dates' => [
                'requestedat' => (int)$request->timecreated,
                'approvedat' => (int)$request->approvedat,
                'moodleenrolledat' => (int)$request->moodleenrolledat,
                'moodle_timestart' => $moodleenrol ? (int)($moodleenrol->timestart ?? 0) : 0,
                'droppedat' => (int)($request->droppedat ?? 0),
            ],
            'grade' => $grade,
            'completion' => [
                'moodle' => $completion,
                'local_progress' => $progress,
                'quiz' => $quiz,
            ],
            'attendance' => $attendance,
            'teachers' => pqct_teacher_of_record($studentid, $workspaceid),
            'warnings' => $linewarnings,
        ];
        $line['display'] = pqct_line_policy_display($line, $policy);
        $lines[] = $line;
    }

    $diagnostics['moodle_only_enrollments'] = pqct_moodle_only_enrollments($studentid, $workspaceid);
    foreach ($diagnostics['moodle_only_enrollments'] as $row) {
        $warnings[] = pqct_warning(
            'moodle_only_enrollment',
            'blocker',
            'An active Moodle enrollment exists in a linked offering course without a matching local approved/enrolled request.',
            ['studentid' => $studentid, 'workspaceid' => $workspaceid, 'offeringid' => (int)$row['offeringid'], 'moodlecourseid' => (int)$row['moodlecourseid']],
            'Create or reconcile the local course request before official issue.'
        );
    }

    $statuscounts = [];
    foreach ($lines as $line) {
        $status = (string)$line['status']['normalized'];
        $statuscounts[$status] = ($statuscounts[$status] ?? 0) + 1;
    }

    return [
        'header' => $header,
        'permission' => [
            'viewerid' => $viewerid,
            'viewer_role' => pqh_user_workspace_role($viewerid, $workspaceid),
            'can_view' => true,
        ],
        'lines' => $lines,
        'summary' => [
            'line_count' => count($lines),
            'status_counts' => $statuscounts,
            'warning_count' => count($warnings),
            'blocker_count' => count(array_filter($warnings, static function(array $warning): bool {
                return (string)($warning['severity'] ?? '') === 'blocker';
            })),
        ],
        'policy' => $policyinfo,
        'warnings' => $warnings,
        'diagnostics' => $includeinternal ? $diagnostics : [],
    ];
}

function pqct_moodle_only_enrollments(int $studentid, int $workspaceid): array {
    global $DB;

    if ($studentid <= 0 || $workspaceid <= 0 || !pqco_table_ready()) {
        return [];
    }
    try {
        $rows = $DB->get_records_sql(
            "SELECT o.id AS offeringid, o.title, o.course_key, o.moodlecourseid,
                    ue.userid AS studentid, ue.timestart, ue.timecreated
               FROM {local_prequran_course_offering} o
               JOIN {enrol} e
                 ON e.courseid = o.moodlecourseid
                AND e.enrol = :enrolmethod
                AND e.status = 0
               JOIN {user_enrolments} ue
                 ON ue.enrolid = e.id
                AND ue.status = 0
                AND ue.userid = :studentid
          LEFT JOIN {local_prequran_course_enrol_req} r
                 ON r.offeringid = o.id
                AND r.studentid = ue.userid
                AND r.status IN ('approved', 'enrolled', 'drop_requested')
              WHERE o.workspaceid = :workspaceid
                AND o.status IN ('published', 'closed')
                AND r.id IS NULL
           ORDER BY o.title ASC",
            ['enrolmethod' => 'manual', 'studentid' => $studentid, 'workspaceid' => $workspaceid],
            0,
            100
        );
    } catch (Throwable $e) {
        return [];
    }
    $items = [];
    foreach ($rows as $row) {
        $items[] = [
            'offeringid' => (int)$row->offeringid,
            'title' => (string)$row->title,
            'course_key' => (string)$row->course_key,
            'moodlecourseid' => (int)$row->moodlecourseid,
            'studentid' => (int)$row->studentid,
            'timestart' => (int)$row->timestart,
            'timecreated' => (int)$row->timecreated,
        ];
    }
    return $items;
}
