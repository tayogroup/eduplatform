<?php
// Institution records library: report cards (periodic per-term student report,
// distinct from the cumulative transcript), reusable fee schedules, and the
// student enrolment-status lifecycle. Requires accesslib.php.
defined('MOODLE_INTERNAL') || die();

function pqir_ready(): bool {
    return pqh_table_exists_safe('local_prequran_report_card');
}

function pqir_money(string $value): string {
    $n = (float)preg_replace('/[^0-9.\-]/', '', $value);
    return number_format($n, 2, '.', '');
}

/**
 * Tenant-isolation guard: assert that $studentid is an active member of
 * $workspaceid before a handler is allowed to read/write that student's
 * profile-scoped records. student_profile / course_grade rows are keyed on a
 * global userid, so without this a workspace admin could target a user who
 * belongs to a different tenant. Fails closed (throws) unless membership is
 * confirmed; only skipped when the membership table itself is absent.
 */
function pqir_require_workspace_member(int $workspaceid, int $studentid): void {
    global $DB;
    if ($studentid <= 0) {
        throw new invalid_parameter_exception('Choose a student.');
    }
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return;
    }
    if (!$DB->record_exists_select('local_prequran_workspace_member',
            "workspaceid = :ws AND userid = :uid AND status = 'active'",
            ['ws' => $workspaceid, 'uid' => $studentid])) {
        throw new invalid_parameter_exception('That student is not an active member of this workspace.');
    }
}

function pqir_conduct_options(): array {
    return ['not_assessed' => 'Not assessed', 'excellent' => 'Excellent', 'good' => 'Good',
        'satisfactory' => 'Satisfactory', 'needs_improvement' => 'Needs improvement', 'concern' => 'Concern'];
}

/**
 * Compute the grade + attendance snapshot for a student in a term and return a
 * draft report-card payload (never published automatically — a teacher reviews,
 * adds the narrative, then publishes).
 */
function pqir_compute_report_card(int $workspaceid, int $studentid, int $termid): array {
    global $DB;

    $term = $DB->get_record('local_prequran_acad_term', ['id' => $termid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING);
    $termstart = $term ? (int)$term->startdate : 0;
    $termend = $term ? (int)$term->enddate : 0;

    // Published course grades (the release-controlled academic record).
    $grades = [];
    $sum = 0.0;
    $count = 0;
    if (pqh_table_exists_safe('local_prequran_course_grade')) {
        $rows = $DB->get_records_select('local_prequran_course_grade',
            "workspaceid = :ws AND studentid = :sid AND status = 'published'",
            ['ws' => $workspaceid, 'sid' => $studentid], 'timemodified DESC', '*', 0, 200);
        foreach ($rows as $g) {
            $title = '';
            if ((int)$g->offeringid > 0 && pqh_table_exists_safe('local_prequran_course_offering')) {
                $title = (string)$DB->get_field('local_prequran_course_offering', 'title', ['id' => (int)$g->offeringid], IGNORE_MISSING);
            }
            $pct = (float)preg_replace('/[^0-9.]/', '', (string)$g->final_percent);
            $grades[] = [
                'offeringid' => (int)$g->offeringid,
                'course' => $title !== '' ? $title : ('Course #' . (int)$g->offeringid),
                'percent' => (string)$g->final_percent,
                'letter' => (string)$g->letter_grade,
            ];
            $sum += $pct;
            $count++;
        }
    }
    $overallpct = $count > 0 ? round($sum / $count, 1) : null;

    // Attendance within the term window (falls back to all-time if no dates).
    $present = 0;
    $total = 0;
    if (pqh_table_exists_safe('local_prequran_live_attendance')) {
        $params = ['ws' => $workspaceid, 'sid' => $studentid];
        $where = 'workspaceid = :ws AND studentid = :sid';
        if ($termstart > 0 && $termend > 0) {
            $where .= ' AND timecreated >= :ts AND timecreated <= :te';
            $params['ts'] = $termstart;
            $params['te'] = $termend + DAYSECS;
        }
        $rows = $DB->get_records_select('local_prequran_live_attendance', $where, $params, '', 'id,attendance_status', 0, 5000);
        foreach ($rows as $r) {
            $total++;
            if (in_array((string)$r->attendance_status, ['present', 'late', 'excused', 'makeup_completed'], true)) {
                $present++;
            }
        }
    }
    $attrate = $total > 0 ? round(100 * $present / $total, 1) : null;

    return [
        'overall_percent' => $overallpct,
        'attendance_rate' => $attrate,
        'attendance_present' => $present,
        'attendance_total' => $total,
        'grades' => $grades,
        'term_title' => $term ? (string)$term->title : '',
    ];
}

/**
 * Create or refresh a DRAFT report card for a (student, term). Recomputes the
 * grade/attendance snapshot but preserves any teacher narrative/conduct already
 * entered. Never publishes.
 */
function pqir_upsert_report_card(int $workspaceid, $consumercontext, int $studentid, int $termid, int $actorid): int {
    global $DB;

    if (!pqir_ready()) {
        throw new invalid_parameter_exception('Report card schema is not ready. Run the local_prequran upgrade first.');
    }
    if ($studentid <= 0 || $termid <= 0) {
        throw new invalid_parameter_exception('Choose a student and a term.');
    }
    pqir_require_workspace_member($workspaceid, $studentid);
    $snapshot = pqir_compute_report_card($workspaceid, $studentid, $termid);
    $now = time();
    $existing = $DB->get_record('local_prequran_report_card',
        ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'termid' => $termid], '*', IGNORE_MISSING);
    $record = (object)[
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'termid' => $termid,
        'overall_grade' => $snapshot['overall_percent'] !== null ? (string)$snapshot['overall_percent'] : '',
        'attendance_rate' => $snapshot['attendance_rate'] !== null ? (string)$snapshot['attendance_rate'] : '',
        'grades_json' => json_encode($snapshot['grades'], JSON_UNESCAPED_SLASHES),
        'attendance_json' => json_encode([
            'rate' => $snapshot['attendance_rate'],
            'present' => $snapshot['attendance_present'],
            'total' => $snapshot['attendance_total'],
        ], JSON_UNESCAPED_SLASHES),
        'timemodified' => $now,
    ];
    if ($existing) {
        if ((string)$existing->status === 'published') {
            throw new invalid_parameter_exception('This report card is already published. Unpublish it before rebuilding.');
        }
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_report_card', $record);
        $id = (int)$existing->id;
    } else {
        $record->status = 'draft';
        $record->conduct = 'not_assessed';
        $record->effort = 'not_assessed';
        $record->teacher_narrative = '';
        $record->head_comment = '';
        $record->cardnumber = '';
        $record->createdby = $actorid;
        $record->timecreated = $now;
        $id = (int)$DB->insert_record('local_prequran_report_card', $record);
        $DB->set_field('local_prequran_report_card', 'cardnumber',
            'RC-' . gmdate('Ym', $now) . '-W' . $workspaceid . '-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT),
            ['id' => $id]);
    }
    pqir_audit($workspaceid, $studentid, $id, 'report_card_built', ['termid' => $termid], $actorid);
    return $id;
}

function pqir_save_report_card_narrative(int $cardid, int $workspaceid, int $actorid, array $data): void {
    global $DB;
    $card = $DB->get_record('local_prequran_report_card', ['id' => $cardid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
    if ((string)$card->status === 'published') {
        throw new invalid_parameter_exception('Published report cards cannot be edited. Unpublish first.');
    }
    $conductopts = pqir_conduct_options();
    $conduct = (string)($data['conduct'] ?? 'not_assessed');
    $effort = (string)($data['effort'] ?? 'not_assessed');
    $DB->update_record('local_prequran_report_card', (object)[
        'id' => $cardid,
        'conduct' => isset($conductopts[$conduct]) ? $conduct : 'not_assessed',
        'effort' => isset($conductopts[$effort]) ? $effort : 'not_assessed',
        'teacher_narrative' => core_text::substr((string)($data['teacher_narrative'] ?? ''), 0, 4000),
        'head_comment' => core_text::substr((string)($data['head_comment'] ?? ''), 0, 2000),
        'timemodified' => time(),
    ]);
    pqir_audit($workspaceid, (int)$card->studentid, $cardid, 'report_card_narrative_saved', [], $actorid);
}

function pqir_publish_report_card(int $cardid, int $workspaceid, $consumercontext, int $actorid, bool $publish): void {
    global $DB, $CFG;
    $card = $DB->get_record('local_prequran_report_card', ['id' => $cardid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
    $now = time();
    if ($publish) {
        // Register a generated PDF document so it flows through the existing
        // document_pdf pipeline (doc_type 'report_card').
        $generatedid = (int)$card->generateddocid;
        if ($generatedid <= 0 && pqh_table_exists_safe('local_prequran_generated_doc')) {
            $student = core_user::get_user((int)$card->studentid, 'id,firstname,lastname', IGNORE_MISSING);
            $generatedid = (int)$DB->insert_record('local_prequran_generated_doc', (object)[
                'workspaceid' => $workspaceid,
                'doc_type' => 'report_card',
                'source_type' => 'report_card',
                'source_id' => $cardid,
                'document_key' => (string)$card->cardnumber,
                'status' => 'issued',
                'payloadjson' => json_encode([
                    'title' => 'Report Card ' . ($student ? fullname($student) : ('Student #' . (int)$card->studentid)),
                    'cardid' => $cardid,
                ], JSON_UNESCAPED_SLASHES),
                'pdfhash' => '',
                'download_url' => '',
                'generatedby' => $actorid,
                'generatedat' => $now,
            ]);
        }
        $DB->update_record('local_prequran_report_card', (object)[
            'id' => $cardid,
            'status' => 'published',
            'generateddocid' => $generatedid,
            'issuedby' => $actorid,
            'issuedat' => $now,
            'timemodified' => $now,
        ]);
        pqir_audit($workspaceid, (int)$card->studentid, $cardid, 'report_card_published', [], $actorid);
        // Milestone notification (reuses the achievement provider, gated).
        if ((string)get_config('local_prequran', 'achievement_notify_mode') === 'enforce') {
            @include_once($CFG->dirroot . '/local/prequran/notificationlib.php');
            if (function_exists('local_prequran_notify_achievement_family')) {
                local_prequran_notify_achievement_family(
                    (int)$card->studentid,
                    'Report card available',
                    'A new report card has been published to your family portal.',
                    new moodle_url('/local/prequran/portal_launch.php', ['report' => 'student-parent-portal', 'workspaceid' => $workspaceid, 'studentid' => (int)$card->studentid]),
                    'Family portal',
                    'report_card_published'
                );
            }
        }
    } else {
        $DB->update_record('local_prequran_report_card', (object)[
            'id' => $cardid, 'status' => 'draft', 'issuedby' => 0, 'issuedat' => 0, 'timemodified' => $now,
        ]);
        pqir_audit($workspaceid, (int)$card->studentid, $cardid, 'report_card_unpublished', [], $actorid);
    }
}

function pqir_audit(int $workspaceid, int $studentid, int $targetid, string $action, array $details, int $actorid): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_course_audit')) {
        return;
    }
    try {
        $DB->insert_record('local_prequran_course_audit', (object)[
            'consumerid' => 0, 'workspaceid' => $workspaceid, 'offeringid' => 0, 'requestid' => 0,
            'studentid' => $studentid, 'actorid' => $actorid, 'action' => $action,
            'targettype' => 'report_card', 'targetid' => $targetid,
            'details' => json_encode($details, JSON_UNESCAPED_SLASHES), 'timecreated' => time(),
        ]);
    } catch (Throwable $e) {
        // Audit best-effort.
    }
}

// ---- Fee schedule / price book -------------------------------------------

function pqir_fee_ready(): bool {
    return pqh_table_exists_safe('local_prequran_fee_schedule');
}

function pqir_save_fee_schedule(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;
    if (!pqir_fee_ready()) {
        throw new invalid_parameter_exception('Fee schedule schema is not ready. Run the local_prequran upgrade first.');
    }
    $title = trim((string)($data['title'] ?? ''));
    if ($title === '') {
        throw new invalid_parameter_exception('Give the fee schedule a title.');
    }
    $appliesto = (string)($data['applies_to'] ?? 'grade');
    if (!in_array($appliesto, ['grade', 'level', 'program', 'all'], true)) {
        $appliesto = 'grade';
    }
    $now = time();
    $id = (int)($data['id'] ?? 0);
    $record = (object)[
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'title' => core_text::substr($title, 0, 255),
        'applies_to' => $appliesto,
        'applies_value' => core_text::substr(trim((string)($data['applies_value'] ?? '')), 0, 120),
        'academic_year' => core_text::substr(trim((string)($data['academic_year'] ?? '')), 0, 40),
        'currency' => core_text::substr(trim((string)($data['currency'] ?? 'USD')), 0, 10),
        'tuition_amount' => pqir_money((string)($data['tuition_amount'] ?? '0')),
        'registration_fee' => pqir_money((string)($data['registration_fee'] ?? '0')),
        'materials_fee' => pqir_money((string)($data['materials_fee'] ?? '0')),
        'sibling_discount_percent' => pqir_money((string)($data['sibling_discount_percent'] ?? '0')),
        'early_payment_discount_percent' => pqir_money((string)($data['early_payment_discount_percent'] ?? '0')),
        'status' => in_array((string)($data['status'] ?? 'active'), ['active', 'archived'], true) ? (string)($data['status'] ?? 'active') : 'active',
        'notes' => trim((string)($data['notes'] ?? '')),
        'timemodified' => $now,
    ];
    if ($id > 0) {
        $current = $DB->get_record('local_prequran_fee_schedule', ['id' => $id, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
        $record->id = $id;
        $record->schedule_code = (string)$current->schedule_code;
        $DB->update_record('local_prequran_fee_schedule', $record);
    } else {
        $record->schedule_code = '';
        $record->createdby = $actorid;
        $record->timecreated = $now;
        $id = (int)$DB->insert_record('local_prequran_fee_schedule', $record);
        $DB->set_field('local_prequran_fee_schedule', 'schedule_code',
            'FEE-W' . $workspaceid . '-' . str_pad((string)$id, 5, '0', STR_PAD_LEFT), ['id' => $id]);
    }
    pqir_audit($workspaceid, 0, $id, 'fee_schedule_saved', ['applies_to' => $appliesto], $actorid);
    return $id;
}

// ---- Student enrolment-status lifecycle ----------------------------------

function pqir_student_status_options(): array {
    return ['enrolled' => 'Enrolled', 'withdrawn' => 'Withdrawn', 'graduated' => 'Graduated',
        'suspended' => 'Suspended', 'alumni' => 'Alumni', 'on_leave' => 'On leave'];
}

function pqir_set_student_status(int $workspaceid, int $studentid, string $status, int $actorid, string $reason = ''): void {
    global $DB;
    $options = pqir_student_status_options();
    if (!isset($options[$status])) {
        throw new invalid_parameter_exception('Invalid student status.');
    }
    if (!pqh_table_exists_safe('local_prequran_student_profile')) {
        throw new invalid_parameter_exception('Student profiles are not available.');
    }
    pqir_require_workspace_member($workspaceid, $studentid);
    $profile = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', IGNORE_MISSING);
    if (!$profile) {
        throw new invalid_parameter_exception('No student profile for that user.');
    }
    $columns = $DB->get_columns('local_prequran_student_profile');
    $update = (object)['id' => (int)$profile->id];
    if (isset($columns['enrolment_status'])) {
        $update->enrolment_status = $status;
    }
    if (isset($columns['enrolment_status_at'])) {
        $update->enrolment_status_at = time();
    }
    $DB->update_record('local_prequran_student_profile', $update);
    pqir_audit($workspaceid, $studentid, (int)$profile->id, 'student_status_changed',
        ['status' => $status, 'reason' => core_text::substr($reason, 0, 300)], $actorid);
}

// ---- SIS records completeness: admission number, demographics, behaviour ----

function pqir_behaviour_ready(): bool {
    return pqh_table_exists_safe('local_prequran_behaviour');
}

function pqir_staff_ready(): bool {
    return pqh_table_exists_safe('local_prequran_staff_record');
}

/**
 * Assign (once) a sequential per-workspace admission number ADM-<year>-<seq>,
 * distinct from the shared random 5-digit user.idnumber. Idempotent and
 * lock-serialised so concurrent intakes cannot collide on the sequence.
 */
function pqir_assign_admission_number(int $workspaceid, int $studentid): string {
    global $DB;

    if (!pqh_table_exists_safe('local_prequran_student_profile')
            || !pqh_table_exists_safe('local_prequran_adm_seq')) {
        return '';
    }
    $columns = $DB->get_columns('local_prequran_student_profile');
    if (!isset($columns['admission_number'])) {
        return '';
    }
    $profile = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], 'id,admission_number', IGNORE_MISSING);
    if (!$profile) {
        return '';
    }
    if (trim((string)$profile->admission_number) !== '') {
        return (string)$profile->admission_number;
    }
    $yearcode = gmdate('Y');
    $lockfactory = \core\lock\lock_config::get_lock_factory('local_prequran_adm_seq');
    $lock = $lockfactory->get_lock('adm-' . $workspaceid . '-' . $yearcode, 5);
    try {
        $seqrow = $DB->get_record('local_prequran_adm_seq', ['workspaceid' => $workspaceid, 'year_code' => $yearcode], '*', IGNORE_MISSING);
        if ($seqrow) {
            $next = (int)$seqrow->lastseq + 1;
            $DB->update_record('local_prequran_adm_seq', (object)['id' => (int)$seqrow->id, 'lastseq' => $next, 'timemodified' => time()]);
        } else {
            $next = 1;
            $DB->insert_record('local_prequran_adm_seq', (object)[
                'workspaceid' => $workspaceid, 'year_code' => $yearcode, 'lastseq' => $next, 'timemodified' => time(),
            ]);
        }
    } finally {
        if ($lock) {
            $lock->release();
        }
    }
    $number = 'ADM-' . $yearcode . '-' . str_pad((string)$next, 4, '0', STR_PAD_LEFT);
    $DB->set_field('local_prequran_student_profile', 'admission_number', $number, ['id' => (int)$profile->id]);
    pqir_audit($workspaceid, $studentid, (int)$profile->id, 'admission_number_assigned', ['number' => $number], 0);
    return $number;
}

function pqir_save_student_demographics(int $workspaceid, int $studentid, int $actorid, array $data): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_student_profile')) {
        throw new invalid_parameter_exception('Student profiles are not available.');
    }
    pqir_require_workspace_member($workspaceid, $studentid);
    $profile = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', MUST_EXIST);
    $columns = $DB->get_columns('local_prequran_student_profile');
    $update = (object)['id' => (int)$profile->id, 'timemodified' => time()];
    $fields = [
        'nationality' => 100, 'address_line' => 255, 'postal_code' => 40,
        'country' => 100, 'city' => 100, 'gender' => 40, 'date_of_birth' => 20,
    ];
    foreach ($fields as $field => $max) {
        if (isset($columns[$field]) && array_key_exists($field, $data)) {
            $update->{$field} = core_text::substr(trim((string)$data[$field]), 0, $max);
        }
    }
    if (isset($columns['admission_date']) && !empty($data['admission_date'])) {
        $ts = (int)strtotime((string)$data['admission_date'] . ' 12:00:00');
        $update->admission_date = $ts > 0 ? $ts : 0;
    }
    $DB->update_record('local_prequran_student_profile', $update);
    pqir_audit($workspaceid, $studentid, (int)$profile->id, 'student_demographics_saved', [], $actorid);
}

function pqir_behaviour_severity_options(): array {
    return ['low' => 'Low', 'medium' => 'Medium', 'high' => 'High', 'safeguarding' => 'Safeguarding'];
}

function pqir_save_behaviour(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;
    if (!pqir_behaviour_ready()) {
        throw new invalid_parameter_exception('Behaviour record schema is not ready. Run the local_prequran upgrade first.');
    }
    $studentid = (int)($data['studentid'] ?? 0);
    if ($studentid <= 0) {
        throw new invalid_parameter_exception('Choose a student.');
    }
    pqir_require_workspace_member($workspaceid, $studentid);
    $type = (string)($data['record_type'] ?? 'incident');
    if (!in_array($type, ['incident', 'merit', 'note'], true)) {
        $type = 'incident';
    }
    $sev = (string)($data['severity'] ?? 'low');
    if (!isset(pqir_behaviour_severity_options()[$sev])) {
        $sev = 'low';
    }
    $title = trim((string)($data['title'] ?? ''));
    if ($title === '') {
        throw new invalid_parameter_exception('Give the record a short title.');
    }
    $now = time();
    $id = (int)($data['id'] ?? 0);
    $incidentdate = !empty($data['incident_date']) ? (int)strtotime((string)$data['incident_date'] . ' 12:00:00') : $now;
    $record = (object)[
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'record_type' => $type,
        'category' => core_text::substr(trim((string)($data['category'] ?? '')), 0, 80),
        'severity' => $type === 'merit' ? 'low' : $sev,
        'title' => core_text::substr($title, 0, 255),
        'description' => trim((string)($data['description'] ?? '')),
        'action_taken' => trim((string)($data['action_taken'] ?? '')),
        'incident_date' => $incidentdate ?: $now,
        'parent_visible' => !empty($data['parent_visible']) ? 1 : 0,
        'status' => in_array((string)($data['status'] ?? 'open'), ['open', 'resolved'], true) ? (string)($data['status'] ?? 'open') : 'open',
        'timemodified' => $now,
    ];
    if ((string)$record->status === 'resolved') {
        $record->resolvedby = $actorid;
        $record->resolvedat = $now;
    }
    if ($id > 0) {
        $current = $DB->get_record('local_prequran_behaviour', ['id' => $id, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
        $record->id = $id;
        $DB->update_record('local_prequran_behaviour', $record);
    } else {
        $record->recordedby = $actorid;
        $record->timecreated = $now;
        $id = (int)$DB->insert_record('local_prequran_behaviour', $record);
    }
    pqir_audit($workspaceid, $studentid, $id, 'behaviour_record_saved', ['type' => $type, 'severity' => $record->severity], $actorid);
    return $id;
}

// ---- Staff HR records -----------------------------------------------------

function pqir_staff_employment_options(): array {
    return ['full_time' => 'Full time', 'part_time' => 'Part time', 'contract' => 'Contract',
        'volunteer' => 'Volunteer', 'intern' => 'Intern'];
}

function pqir_save_staff_record(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;
    if (!pqir_staff_ready()) {
        throw new invalid_parameter_exception('Staff record schema is not ready. Run the local_prequran upgrade first.');
    }
    $userid = (int)($data['userid'] ?? 0);
    if ($userid <= 0) {
        throw new invalid_parameter_exception('Choose a staff member (an active workspace member).');
    }
    if (pqh_table_exists_safe('local_prequran_workspace_member')
            && !$DB->record_exists_select('local_prequran_workspace_member',
                "workspaceid = :ws AND userid = :uid AND status = 'active'", ['ws' => $workspaceid, 'uid' => $userid])) {
        throw new invalid_parameter_exception('That user is not an active member of this workspace.');
    }
    $emptype = (string)($data['employment_type'] ?? 'full_time');
    if (!isset(pqir_staff_employment_options()[$emptype])) {
        $emptype = 'full_time';
    }
    $now = time();
    $existing = $DB->get_record('local_prequran_staff_record', ['workspaceid' => $workspaceid, 'userid' => $userid], '*', IGNORE_MISSING);
    $record = (object)[
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'role_title' => core_text::substr(trim((string)($data['role_title'] ?? '')), 0, 120),
        'employment_type' => $emptype,
        'department' => core_text::substr(trim((string)($data['department'] ?? '')), 0, 120),
        'start_date' => !empty($data['start_date']) ? (int)strtotime((string)$data['start_date'] . ' 12:00:00') : 0,
        'end_date' => !empty($data['end_date']) ? (int)strtotime((string)$data['end_date'] . ' 12:00:00') : 0,
        'payroll_ref' => core_text::substr(trim((string)($data['payroll_ref'] ?? '')), 0, 80),
        'emergency_contact_name' => core_text::substr(trim((string)($data['emergency_contact_name'] ?? '')), 0, 255),
        'emergency_contact_phone' => core_text::substr(trim((string)($data['emergency_contact_phone'] ?? '')), 0, 100),
        'qualifications' => trim((string)($data['qualifications'] ?? '')),
        'status' => in_array((string)($data['status'] ?? 'active'), ['active', 'on_leave', 'ended'], true) ? (string)($data['status'] ?? 'active') : 'active',
        'notes' => trim((string)($data['notes'] ?? '')),
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->staff_number = (string)$existing->staff_number;
        $DB->update_record('local_prequran_staff_record', $record);
        $id = (int)$existing->id;
    } else {
        $record->staff_number = '';
        $record->createdby = $actorid;
        $record->timecreated = $now;
        $id = (int)$DB->insert_record('local_prequran_staff_record', $record);
        $DB->set_field('local_prequran_staff_record', 'staff_number',
            'STF-W' . $workspaceid . '-' . str_pad((string)$id, 4, '0', STR_PAD_LEFT), ['id' => $id]);
    }
    pqir_audit($workspaceid, 0, $id, 'staff_record_saved', ['userid' => $userid, 'status' => $record->status], $actorid);
    return $id;
}
