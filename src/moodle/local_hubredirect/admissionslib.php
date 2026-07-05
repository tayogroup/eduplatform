<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_offeringlib.php');
require_once(__DIR__ . '/finance_lib.php');
require_once($GLOBALS['CFG']->dirroot . '/user/lib.php');

function pqadm_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_admission_app')
        && pqh_table_exists_safe('local_prequran_admission_doc');
}

function pqadm_metadata(array $data): string {
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function pqadm_date_to_time(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? (int)$time : 0;
}

function pqadm_time_to_date(int $time): string {
    return $time > 0 ? date('Y-m-d', $time) : '';
}

function pqadm_application_statuses(): array {
    return [
        'submitted' => 'Submitted',
        'in_review' => 'In review',
        'assessment' => 'Placement assessment',
        'accepted' => 'Accepted',
        'waitlisted' => 'Waitlisted',
        'declined' => 'Declined',
        'converted' => 'Converted to student',
        'withdrawn' => 'Withdrawn',
    ];
}

function pqadm_decisions(): array {
    return [
        'pending' => 'Pending',
        'accepted' => 'Accepted',
        'waitlisted' => 'Waitlisted',
        'declined' => 'Declined',
    ];
}

function pqadm_placement_statuses(): array {
    return [
        'not_assessed' => 'Not assessed',
        'scheduled' => 'Scheduled',
        'in_progress' => 'In progress',
        'ready_for_review' => 'Ready for review',
        'placed' => 'Placed',
    ];
}

function pqadm_record_for_existing_columns(string $table, stdClass $record): stdClass {
    global $DB;

    $columns = $DB->get_columns($table);
    $filtered = new stdClass();
    foreach ($record as $key => $value) {
        if (isset($columns[$key])) {
            $filtered->{$key} = $value;
        }
    }
    return $filtered;
}

function pqadm_unique_application_no(int $workspaceid): string {
    global $DB;

    $prefix = 'ADM-' . date('Ymd') . '-';
    $suffix = max(1, (int)$DB->count_records_select(
        'local_prequran_admission_app',
        'workspaceid = :workspaceid AND timecreated >= :daystart',
        ['workspaceid' => $workspaceid, 'daystart' => strtotime('today')]
    ) + 1);
    do {
        $candidate = $prefix . str_pad((string)$suffix, 3, '0', STR_PAD_LEFT);
        $suffix++;
    } while ($DB->record_exists('local_prequran_admission_app', ['workspaceid' => $workspaceid, 'application_no' => $candidate]));
    return $candidate;
}

function pqadm_unique_username(string $seed): string {
    global $CFG, $DB;

    $base = core_text::strtolower(trim($seed));
    $base = preg_replace('/[^a-z0-9._-]+/', '.', $base) ?? '';
    $base = trim($base, '.-_');
    if ($base === '') {
        $base = 'student';
    }
    $base = core_text::substr($base, 0, 70);
    $username = $base;
    $suffix = 1;
    while ($DB->record_exists('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id])) {
        $suffix++;
        $username = $base . $suffix;
    }
    return $username;
}

function pqadm_find_or_create_student(array $data, int $actorid): array {
    global $CFG, $DB;

    $studentid = (int)($data['studentid'] ?? 0);
    if ($studentid > 0) {
        $user = core_user::get_user($studentid, 'id,firstname,lastname,email,idnumber,deleted', IGNORE_MISSING);
        if ($user && empty($user->deleted)) {
            return [$studentid, false];
        }
    }

    $email = trim((string)($data['student_email'] ?? ''));
    if ($email !== '' && validate_email($email)) {
        $existing = $DB->get_record('user', [
            'email' => $email,
            'deleted' => 0,
            'mnethostid' => $CFG->mnet_localhost_id,
        ], 'id', IGNORE_MULTIPLE);
        if ($existing) {
            return [(int)$existing->id, false];
        }
    }

    $name = trim((string)($data['student_name'] ?? ''));
    $parts = preg_split('/\s+/', $name) ?: [];
    $firstname = trim((string)($data['student_firstname'] ?? ($parts[0] ?? 'Student')));
    $lastname = trim((string)($data['student_lastname'] ?? (count($parts) > 1 ? end($parts) : 'Learner')));
    if ($email === '' || !validate_email($email)) {
        $email = 'student.' . uniqid('', false) . '@eduplatform.local';
    }
    $user = (object)[
        'auth' => 'manual',
        'confirmed' => 1,
        'mnethostid' => $CFG->mnet_localhost_id,
        'username' => pqadm_unique_username($email),
        'password' => generate_password(12),
        'firstname' => $firstname !== '' ? $firstname : 'Student',
        'lastname' => $lastname !== '' ? $lastname : 'Learner',
        'email' => $email,
        'emailstop' => substr($email, -18) === '@eduplatform.local' ? 1 : 0,
        'country' => '',
        'city' => '',
        'timezone' => '99',
        'lang' => $CFG->lang ?? 'en',
    ];
    return [(int)user_create_user($user, true, false), true];
}

function pqadm_ensure_workspace_member(int $workspaceid, int $userid, string $role, int $actorid): void {
    global $DB;

    if ($workspaceid <= 0 || $userid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return;
    }
    $existing = $DB->get_record('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ], '*', IGNORE_MISSING);
    $now = time();
    if ($existing) {
        if ((string)$existing->status !== 'active') {
            $existing->status = 'active';
            $existing->timemodified = $now;
            $DB->update_record('local_prequran_workspace_member', $existing);
        }
        return;
    }
    $DB->insert_record('local_prequran_workspace_member', pqadm_record_for_existing_columns('local_prequran_workspace_member', (object)[
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
        'status' => 'active',
        'notes' => 'Created from admissions conversion.',
        'createdby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ]));
}

function pqadm_upsert_student_profile(int $studentid, int $workspaceid, stdClass $application, int $actorid): int {
    global $DB;

    if (!pqh_table_exists_safe('local_prequran_student_profile')) {
        return 0;
    }
    $existing = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', IGNORE_MISSING);
    $profile = json_decode((string)$application->student_profile_json, true);
    $profile = is_array($profile) ? $profile : [];
    $now = time();
    $record = (object)[
        'userid' => $studentid,
        'workspaceid' => $workspaceid,
        'student_display_name' => (string)$application->student_name,
        'parent_name' => (string)$application->parent_name,
        'parent_email' => (string)$application->parent_email,
        'parent_phone' => (string)$application->parent_phone,
        'current_level' => (string)($profile['current_level'] ?? ''),
        'course_type' => (string)$application->program_key,
        'status' => 'active',
        'createdby' => (int)($existing->createdby ?? $actorid),
        'timecreated' => (int)($existing->timecreated ?? $now),
        'timemodified' => $now,
    ];
    $record = pqadm_record_for_existing_columns('local_prequran_student_profile', $record);
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_student_profile', $record);
        return (int)$existing->id;
    }
    return (int)$DB->insert_record('local_prequran_student_profile', $record);
}

function pqadm_create_or_update_application(int $workspaceid, $consumercontext, array $data, int $actorid, int $applicationid = 0): int {
    global $DB;

    if ($workspaceid <= 0 || !pqadm_schema_ready()) {
        throw new invalid_parameter_exception('Admissions schema is not ready.');
    }
    $now = time();
    $existing = $applicationid > 0 ? $DB->get_record('local_prequran_admission_app', ['id' => $applicationid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
    $studentname = trim((string)($data['student_name'] ?? ''));
    $parentname = trim((string)($data['parent_name'] ?? ''));
    $record = (object)[
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'intakerequestid' => (int)($data['intakerequestid'] ?? ($existing->intakerequestid ?? 0)),
        'studentid' => (int)($data['studentid'] ?? ($existing->studentid ?? 0)),
        'parentid' => (int)($existing->parentid ?? 0),
        'billingaccountid' => (int)($existing->billingaccountid ?? 0),
        'offeringid' => (int)($data['offeringid'] ?? ($existing->offeringid ?? 0)),
        'enrolrequestid' => (int)($existing->enrolrequestid ?? 0),
        'application_no' => (string)($existing->application_no ?? pqadm_unique_application_no($workspaceid)),
        'family_name' => trim((string)($data['family_name'] ?? $parentname)),
        'student_name' => $studentname,
        'student_email' => trim((string)($data['student_email'] ?? '')),
        'parent_name' => $parentname,
        'parent_email' => trim((string)($data['parent_email'] ?? '')),
        'parent_phone' => trim((string)($data['parent_phone'] ?? '')),
        'program_key' => trim((string)($data['program_key'] ?? '')),
        'desired_start' => trim((string)($data['desired_start'] ?? '')),
        'application_status' => trim((string)($data['application_status'] ?? ($existing->application_status ?? 'submitted'))),
        'review_status' => trim((string)($data['review_status'] ?? ($existing->review_status ?? 'pending'))),
        'placement_status' => trim((string)($data['placement_status'] ?? ($existing->placement_status ?? 'not_assessed'))),
        'decision' => trim((string)($data['decision'] ?? ($existing->decision ?? 'pending'))),
        'decisionby' => (int)($existing->decisionby ?? 0),
        'decisionat' => (int)($existing->decisionat ?? 0),
        'family_profile_json' => pqadm_metadata($data['family_profile'] ?? []),
        'student_profile_json' => pqadm_metadata($data['student_profile'] ?? []),
        'placement_json' => pqadm_metadata($data['placement'] ?? []),
        'review_notes' => trim((string)($data['review_notes'] ?? ($existing->review_notes ?? ''))),
        'decision_notes' => trim((string)($data['decision_notes'] ?? ($existing->decision_notes ?? ''))),
        'conversion_json' => (string)($existing->conversion_json ?? ''),
        'convertedby' => (int)($existing->convertedby ?? 0),
        'convertedat' => (int)($existing->convertedat ?? 0),
        'createdby' => (int)($existing->createdby ?? $actorid),
        'timecreated' => (int)($existing->timecreated ?? $now),
        'timemodified' => $now,
    ];
    if (!array_key_exists($record->decision, pqadm_decisions())) {
        $record->decision = 'pending';
    }
    if (!array_key_exists($record->application_status, pqadm_application_statuses())) {
        $record->application_status = 'submitted';
    }
    if (!array_key_exists($record->placement_status, pqadm_placement_statuses())) {
        $record->placement_status = 'not_assessed';
    }
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_admission_app', $record);
        return (int)$existing->id;
    }
    return (int)$DB->insert_record('local_prequran_admission_app', $record);
}

function pqadm_save_uploaded_document(stdClass $application, array $upload, string $documenttype, string $label, int $actorid): int {
    global $DB;

    if ((int)($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file((string)($upload['tmp_name'] ?? ''))) {
        throw new invalid_parameter_exception('Choose a valid uploaded document.');
    }
    $context = context_system::instance();
    $fs = get_file_storage();
    $now = time();
    $draftname = clean_param((string)$upload['name'], PARAM_FILE);
    $filerecord = [
        'contextid' => $context->id,
        'component' => 'local_prequran',
        'filearea' => 'admissions',
        'itemid' => (int)$application->id,
        'filepath' => '/',
        'filename' => $draftname !== '' ? $draftname : ('admission-doc-' . $now),
        'userid' => $actorid,
    ];
    $existing = $fs->get_file($context->id, 'local_prequran', 'admissions', (int)$application->id, '/', $filerecord['filename']);
    if ($existing) {
        $existing->delete();
    }
    $file = $fs->create_file_from_pathname($filerecord, (string)$upload['tmp_name']);
    return (int)$DB->insert_record('local_prequran_admission_doc', (object)[
        'applicationid' => (int)$application->id,
        'workspaceid' => (int)$application->workspaceid,
        'studentid' => (int)$application->studentid,
        'document_type' => core_text::substr($documenttype !== '' ? $documenttype : 'other', 0, 80),
        'document_label' => core_text::substr($label !== '' ? $label : $filerecord['filename'], 0, 255),
        'filename' => core_text::substr($filerecord['filename'], 0, 255),
        'mimetype' => core_text::substr($file->get_mimetype(), 0, 120),
        'filesize' => (int)$file->get_filesize(),
        'filepath' => '/',
        'status' => 'received',
        'review_notes' => '',
        'uploadedby' => $actorid,
        'reviewedby' => 0,
        'reviewedat' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqadm_set_decision(int $applicationid, int $workspaceid, string $decision, string $notes, int $actorid): void {
    global $DB;

    if (!array_key_exists($decision, pqadm_decisions())) {
        throw new invalid_parameter_exception('Unsupported admissions decision.');
    }
    $application = $DB->get_record('local_prequran_admission_app', ['id' => $applicationid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
    $application->decision = $decision;
    $application->decision_notes = $notes;
    $application->decisionby = $actorid;
    $application->decisionat = time();
    $application->application_status = $decision === 'pending' ? 'in_review' : $decision;
    $application->timemodified = time();
    $DB->update_record('local_prequran_admission_app', $application);
}

function pqadm_convert_application(int $applicationid, int $workspaceid, $consumercontext, int $actorid): array {
    global $DB;

    $application = $DB->get_record('local_prequran_admission_app', ['id' => $applicationid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
    if ((string)$application->decision !== 'accepted') {
        throw new invalid_parameter_exception('Only accepted applications can be converted.');
    }
    [$studentid, $createduser] = pqadm_find_or_create_student([
        'studentid' => (int)$application->studentid,
        'student_name' => (string)$application->student_name,
        'student_email' => (string)$application->student_email,
    ], $actorid);
    pqadm_ensure_workspace_member($workspaceid, $studentid, 'student', $actorid);
    $profileid = pqadm_upsert_student_profile($studentid, $workspaceid, $application, $actorid);
    $billingaccountid = pqfin_schema_ready() ? pqfin_resolve_or_create_family_billing_account($studentid, $workspaceid, $consumercontext, $actorid) : 0;

    $enrolrequestid = 0;
    if ((int)$application->offeringid > 0 && pqco_table_ready()) {
        $offering = $DB->get_record('local_prequran_course_offering', ['id' => (int)$application->offeringid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING);
        if ($offering) {
            $existingreq = $DB->get_record('local_prequran_course_enrol_req', ['offeringid' => (int)$offering->id, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $moodleenrolled = pqco_enrol_student_in_moodle_course($studentid, (int)$offering->moodlecourseid);
            $request = (object)[
                'offeringid' => (int)$offering->id,
                'consumerid' => (int)($consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'requesterid' => $actorid,
                'requester_role' => 'admissions',
                'status' => $moodleenrolled ? 'enrolled' : 'approved',
                'request_notes' => 'Created from admissions conversion.',
                'admin_notes' => '',
                'approvedby' => $actorid,
                'approvedat' => time(),
                'moodleenrolledat' => $moodleenrolled ? time() : 0,
                'droppedby' => 0,
                'droppedat' => 0,
                'timecreated' => (int)($existingreq->timecreated ?? time()),
                'timemodified' => time(),
            ];
            if ($existingreq) {
                $request->id = (int)$existingreq->id;
                $DB->update_record('local_prequran_course_enrol_req', $request);
                $enrolrequestid = (int)$existingreq->id;
            } else {
                $enrolrequestid = (int)$DB->insert_record('local_prequran_course_enrol_req', $request);
            }
        }
    }

    $application->studentid = $studentid;
    $application->billingaccountid = $billingaccountid;
    $application->enrolrequestid = $enrolrequestid;
    $application->application_status = 'converted';
    $application->conversion_json = pqadm_metadata([
        'studentid' => $studentid,
        'student_user_created' => $createduser,
        'student_profileid' => $profileid,
        'billingaccountid' => $billingaccountid,
        'enrolrequestid' => $enrolrequestid,
    ]);
    $application->convertedby = $actorid;
    $application->convertedat = time();
    $application->timemodified = time();
    $DB->update_record('local_prequran_admission_app', $application);
    return json_decode((string)$application->conversion_json, true) ?: [];
}
