<?php
declare(strict_types=1);
// Course-offerings admin library — extracted VERBATIM from course_offerings.php
// (renamed pqcoa_ -> pqcoal_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php, course_offeringlib.php and
// finance_lib.php loaded first (pqh_*, pqco_*, pqfin_* are shared, not copied).

defined('MOODLE_INTERNAL') || die();

function pqcoal_user_can_manage_offerings(int $userid, int $workspaceid, ?stdClass $workspace): bool {
    if ($workspaceid <= 0 || !$workspace) {
        return false;
    }
    if (pqh_user_can_manage_workspace($userid, $workspaceid)) {
        return true;
    }
    return (string)($workspace->workspace_type ?? '') === 'solo_teacher'
        && pqh_has_independent_teacher_profile($userid)
        && pqh_user_workspace_role($userid, $workspaceid) === 'teacher';
}

function pqcoal_offering_record_for_form(stdClass $offering): array {
    return [
        'offeringid' => (string)((int)($offering->id ?? 0)),
        'course_link_mode' => 'existing',
        'course_key' => (string)($offering->course_key ?? ''),
        'moodlecourseid' => (string)((int)($offering->moodlecourseid ?? 0)),
        'title' => (string)($offering->title ?? ''),
        'summary' => (string)($offering->summary ?? ''),
        'syllabus' => (string)($offering->syllabus ?? ''),
        'prerequisites' => (string)($offering->prerequisites ?? ''),
        'startdate' => pqco_time_to_date((int)($offering->startdate ?? 0)),
        'enddate' => pqco_time_to_date((int)($offering->enddate ?? 0)),
        'capacity' => (string)((int)($offering->capacity ?? 0)),
        'tuition_amount' => (string)($offering->tuition_amount ?? ''),
        'pricing_currency' => (string)($offering->pricing_currency ?? pqfin_default_currency()),
        'registration_fee' => (string)($offering->registration_fee ?? ''),
        'materials_fee' => (string)($offering->materials_fee ?? ''),
        'installment_eligible' => (string)((int)($offering->installment_eligible ?? 0)),
        'scholarship_eligible' => (string)((int)($offering->scholarship_eligible ?? 0)),
        'tax_behavior' => (string)($offering->tax_behavior ?? 'not_configured'),
        'refund_policy_label' => (string)($offering->refund_policy_label ?? ''),
        'payment_required_timing' => (string)($offering->payment_required_timing ?? 'workspace_policy'),
        'visibility' => (string)($offering->visibility ?? 'workspace'),
        'status' => (string)($offering->status ?? 'draft'),
    ];
}

function pqcoal_param_text(string $name): string {
    return trim(optional_param($name, '', PARAM_TEXT));
}

function pqcoal_validation_error(string $message): void {
    throw new RuntimeException($message);
}

function pqcoal_review_enrollment_request(int $requestid, string $decision, string $notes, int $workspaceid, $consumercontext): string {
    global $DB, $USER;

    $request = $DB->get_record_sql(
        "SELECT r.*, o.title AS offering_title, o.moodlecourseid, o.course_key, o.capacity, o.startdate, o.enddate, o.status AS offering_status
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
          WHERE r.id = :requestid
            AND r.workspaceid = :workspaceid",
        ['requestid' => $requestid, 'workspaceid' => $workspaceid],
        IGNORE_MISSING
    );
    if (!$request) {
        pqcoal_validation_error('Choose a valid enrollment request.');
    }
    if ((string)$request->status !== 'pending') {
        pqcoal_validation_error('Only pending enrollment requests can be reviewed.');
    }
    if (!in_array($decision, ['approved', 'rejected'], true)) {
        pqcoal_validation_error('Choose approve or reject.');
    }

    $updatedrequest = (object)[
        'id' => (int)$request->id,
        'status' => $decision,
        'admin_notes' => $notes,
        'approvedby' => $decision === 'approved' ? (int)$USER->id : 0,
        'approvedat' => $decision === 'approved' ? time() : 0,
        'moodleenrolledat' => (int)($request->moodleenrolledat ?? 0),
        'timemodified' => time(),
    ];
    $message = $decision === 'approved' ? 'Enrollment approved.' : 'Enrollment request rejected.';
    if ($decision === 'approved') {
        if ((string)$request->offering_status !== 'published') {
            pqcoal_validation_error('Only published course offerings can accept new approvals.');
        }
        if (pqco_offering_has_ended($request)) {
            pqcoal_validation_error('Enrollment has closed for this course offering. Reject the request with an alternative note or extend the offering end date.');
        }
        $seatcounts = pqco_offering_counts([(int)$request->offeringid]);
        if (pqco_open_seats((object)[
            'id' => (int)$request->offeringid,
            'capacity' => (int)$request->capacity,
        ], $seatcounts) <= 0) {
            pqcoal_validation_error('This course offering is full. Add seats or reject the request with an alternative note.');
        }
        if (pqco_enrol_student_in_moodle_course((int)$request->studentid, (int)$request->moodlecourseid)) {
            pqco_append_profile_course((int)$request->studentid, (string)$request->course_key);
            $teacherenrolledcount = pqco_enrol_assigned_teachers_in_moodle_course(
                (int)$request->studentid,
                (int)$request->moodlecourseid,
                $workspaceid,
                [
                    'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                    'workspaceid' => $workspaceid,
                    'offeringid' => (int)$request->offeringid,
                    'requestid' => (int)$request->id,
                    'studentid' => (int)$request->studentid,
                    'moodlecourseid' => (int)$request->moodlecourseid,
                ]
            );
            $updatedrequest->status = 'enrolled';
            $updatedrequest->moodleenrolledat = time();
            $message = 'Enrollment approved and Moodle enrollment completed.';
            pqco_course_audit('moodle_enrollment_completed', 'course_enrol_req', (int)$request->id, [
                'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$request->offeringid,
                'requestid' => (int)$request->id,
                'studentid' => (int)$request->studentid,
                'moodlecourseid' => (int)$request->moodlecourseid,
                'teacher_enrollment_count' => $teacherenrolledcount,
            ]);
        } else {
            $message = 'Enrollment approved. Moodle auto-enrollment was not completed; check the linked Moodle course manual enrollment setup.';
            pqco_notify_workspace_admins(
                $workspaceid,
                'Course Moodle sync failed',
                'A course enrollment was approved but Moodle enrollment did not complete for ' . (string)$request->offering_title . '.',
                new moodle_url('/local/hubredirect/course_offerings.php', ['workspaceid' => $workspaceid, 'request_status' => 'approved']),
                'Open course requests',
                'course_moodle_sync_failed',
                [
                    'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                    'workspaceid' => $workspaceid,
                    'offeringid' => (int)$request->offeringid,
                    'requestid' => (int)$request->id,
                    'studentid' => (int)$request->studentid,
                    'moodlecourseid' => (int)$request->moodlecourseid,
                ]
            );
        }
    }

    $DB->update_record('local_prequran_course_enrol_req', $updatedrequest);
    pqco_course_audit($decision === 'approved' ? 'enrollment_approved' : 'enrollment_rejected', 'course_enrol_req', (int)$request->id, [
        'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'offeringid' => (int)$request->offeringid,
        'requestid' => (int)$request->id,
        'studentid' => (int)$request->studentid,
        'previous_status' => (string)$request->status,
        'status' => (string)$updatedrequest->status,
        'admin_notes' => $notes,
    ]);
    $request->status = (string)$updatedrequest->status;
    $outcome = (string)$updatedrequest->status;
    if ($decision === 'rejected') {
        pqco_notify_request_outcome(
            $request,
            'course_enrollment_rejected',
            'Course enrollment request rejected',
            'Your enrollment request for ' . (string)$request->offering_title . ' was rejected.' . ($notes !== '' ? "\n\nNote: " . $notes : ''),
            $workspaceid
        );
    } else if ($outcome === 'enrolled') {
        pqco_notify_request_outcome(
            $request,
            'course_enrollment_enrolled',
            'Course enrollment approved',
            'Your enrollment for ' . (string)$request->offering_title . ' was approved and the course is ready to open.',
            $workspaceid
        );
    } else {
        pqco_notify_request_outcome(
            $request,
            'course_enrollment_needs_followup',
            'Course enrollment approved - follow-up needed',
            'Your enrollment for ' . (string)$request->offering_title . ' was approved. The academy is completing the Moodle course access setup.',
            $workspaceid
        );
    }
    return $message;
}

function pqcoal_request_filters(): array {
    return [
        'request_status' => optional_param('request_status', '', PARAM_ALPHANUMEXT),
        'request_offeringid' => optional_param('request_offeringid', 0, PARAM_INT),
        'request_student' => trim(optional_param('request_student', '', PARAM_TEXT)),
    ];
}

function pqcoal_request_filter_url_params(array $baseparams, array $filters, array $extra = []): array {
    if ((string)$filters['request_status'] !== '') {
        $baseparams['request_status'] = (string)$filters['request_status'];
    }
    if ((int)$filters['request_offeringid'] > 0) {
        $baseparams['request_offeringid'] = (int)$filters['request_offeringid'];
    }
    if ((string)$filters['request_student'] !== '') {
        $baseparams['request_student'] = (string)$filters['request_student'];
    }
    return array_merge($baseparams, $extra);
}

function pqcoal_audit_details_label(string $details): string {
    $details = trim($details);
    if ($details === '') {
        return '';
    }
    $decoded = json_decode($details, true);
    if (!is_array($decoded)) {
        return core_text::strlen($details) > 180 ? core_text::substr($details, 0, 180) . '...' : $details;
    }
    $labels = [];
    foreach (['title', 'status', 'previous_status', 'decision', 'admin_notes', 'request_notes', 'moodlecourseid'] as $key) {
        if (array_key_exists($key, $decoded) && trim((string)$decoded[$key]) !== '') {
            $labels[] = str_replace('_', ' ', $key) . ': ' . (string)$decoded[$key];
        }
    }
    if (!$labels) {
        foreach (['offeringid', 'requestid', 'studentid'] as $key) {
            if (array_key_exists($key, $decoded) && (int)$decoded[$key] > 0) {
                $labels[] = $key . ': ' . (int)$decoded[$key];
            }
        }
    }
    $label = implode(' / ', $labels);
    return core_text::strlen($label) > 180 ? core_text::substr($label, 0, 180) . '...' : $label;
}

function pqcoal_finance_status_label(array $summary): string {
    if (!$summary) {
        return 'No invoice';
    }
    return pqfin_invoice_status_label((string)$summary['status']);
}

function pqcoal_finance_warning_labels($request, array $summary, array $pricing): array {
    $warnings = [];
    if (!$summary && in_array((string)$request->status, ['approved', 'enrolled'], true) && pqfin_money_to_cents((string)$pricing['total']) > 0) {
        $warnings[] = 'approved without invoice';
    }
    if ($summary && in_array((string)$request->status, ['approved', 'enrolled'], true)
            && !in_array((string)$summary['status'], ['paid', 'void'], true)
            && pqfin_money_to_cents((string)$summary['balancedue']) > 0) {
        $warnings[] = 'enrolled with unpaid invoice';
    }
    if ($summary && (string)$summary['status'] === 'paid' && !in_array((string)$request->status, ['approved', 'enrolled'], true)) {
        $warnings[] = 'paid but not approved';
    }
    if ($summary && (string)$summary['currency'] !== '' && (string)$summary['currency'] !== (string)$pricing['currency']) {
        $warnings[] = 'currency mismatch';
    }
    foreach (($summary['warnings'] ?? []) as $warning) {
        $warnings[] = str_replace('_', ' ', (string)$warning);
    }
    if ((int)($request->studentid ?? 0) > 0 && (int)($request->workspaceid ?? 0) > 0 && function_exists('pqfin_finance_hold_release_check')) {
        $holdcheck = pqfin_finance_hold_release_check((int)$request->studentid, (int)$request->workspaceid, null, 'enrollment');
        if (!empty($holdcheck['warnings'])) {
            $warnings[] = 'finance hold review';
        }
    }
    return array_values(array_unique($warnings));
}
