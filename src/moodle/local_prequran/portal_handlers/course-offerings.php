<?php
// Portal handler: course-offerings (admin/principal management of what each
// workspace teaches). Ported query-for-query from
// local_hubredirect/course_offerings.php, which stays live in parallel.
// Runs from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, CORS headers sent.
//
//   GET  ?report=course-offerings&token=…[&workspaceid=&consumer=&editid=
//         &request_status=&request_offeringid=&request_student=&export=requests_csv]
//   POST ?report=course-offerings&token=…  body: {"do":"<action>", …fields…}
//        do = save_offering | create_invoice_from_request | review_request |
//             bulk_review_requests | archive_offering | clone_offering |
//             review_drop | drop_enrollment | retry_moodle_enrollment

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offerings_portallib.php');

$userid = (int)$claims['sub'];

// ---- entry access check (verbatim logic from the page preamble) --------------
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);

$workspace = $workspaceid > 0
    ? $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING)
    : false;

if (!$workspace || !pqcoal_user_can_manage_offerings($userid, $workspaceid, $workspace ?: null)) {
    pqpd_fail(403, 'Only workspace admins or approved independent teachers can manage course offerings.');
}

$ready = pqco_table_ready();
$catalog = pqh_course_catalog();
$moodlecourses = pqco_moodle_courses();

// ---- writes ------------------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!$ready) {
        pqpd_fail(409, 'Course offering tables are not ready. Run the local_prequran Moodle upgrade first.');
    }
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid request body.');
    }
    $action = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    // JSON-body equivalents of the page's optional_param reads (token replaces sesskey).
    $bint = static function (string $name, int $default = 0) use ($body): int {
        return (int)clean_param($body[$name] ?? $default, PARAM_INT);
    };
    $balpha = static function (string $name, string $default = '') use ($body): string {
        return clean_param((string)($body[$name] ?? $default), PARAM_ALPHANUMEXT);
    };
    $btext = static function (string $name) use ($body): string {
        return trim(clean_param((string)($body[$name] ?? ''), PARAM_TEXT));
    };
    $braw = static function (string $name) use ($body): string {
        return trim((string)($body[$name] ?? ''));
    };

    $message = '';
    $error = '';
    try {
        if ($action === 'save_offering') {
            $form = [
                'offeringid' => (string)$bint('offeringid'),
                'course_link_mode' => $balpha('course_link_mode', 'existing'),
                'course_key' => pqh_normalize_course_key($balpha('course_key')),
                'moodlecourseid' => (string)$bint('moodlecourseid'),
                'title' => $btext('title'),
                'summary' => $btext('summary'),
                'syllabus' => $btext('syllabus'),
                'prerequisites' => $btext('prerequisites'),
                'startdate' => $btext('startdate'),
                'enddate' => $btext('enddate'),
                'capacity' => (string)$bint('capacity'),
                'tuition_amount' => pqfin_normalize_money_string($braw('tuition_amount')),
                'pricing_currency' => pqfin_normalize_currency($balpha('pricing_currency', pqfin_default_currency())),
                'registration_fee' => pqfin_normalize_money_string($braw('registration_fee')),
                'materials_fee' => pqfin_normalize_money_string($braw('materials_fee')),
                'installment_eligible' => $bint('installment_eligible') ? '1' : '0',
                'scholarship_eligible' => $bint('scholarship_eligible') ? '1' : '0',
                'tax_behavior' => $balpha('tax_behavior', 'not_configured'),
                'refund_policy_label' => $btext('refund_policy_label'),
                'payment_required_timing' => $balpha('payment_required_timing', 'workspace_policy'),
                'visibility' => $balpha('visibility', 'workspace'),
                'status' => $balpha('status', 'draft'),
            ];
            if ($form['course_key'] === '' || !isset($catalog[$form['course_key']])) {
                pqcoal_validation_error('Choose a valid course track.');
            }
            if (!in_array($form['course_link_mode'], ['existing', 'create_new'], true)) {
                pqcoal_validation_error('Choose whether to link an existing Moodle course or create a new one.');
            }
            if ($form['title'] === '') {
                $form['title'] = (string)$catalog[$form['course_key']]['title'];
            }
            if ($form['course_link_mode'] === 'create_new') {
                $createdcourseid = pqco_create_moodle_course_for_offering($consumercontext, $workspace, $form, $catalog);
                if ($createdcourseid <= 0) {
                    pqcoal_validation_error('The Moodle course could not be created. Check Moodle course category permissions and try again.');
                }
                $form['moodlecourseid'] = (string)$createdcourseid;
                $moodlecourses = pqco_moodle_courses();
                $message = 'Moodle course created and linked to this offering.';
            }
            if ((int)$form['moodlecourseid'] <= 0 || !isset($moodlecourses[(int)$form['moodlecourseid']])) {
                pqcoal_validation_error('Choose the linked Moodle course before saving this offering, or select Create new Moodle course.');
            }
            if (!array_key_exists($form['visibility'], pqco_visibility_options())) {
                pqcoal_validation_error('Choose a valid visibility.');
            }
            if (!array_key_exists($form['status'], pqco_status_options())) {
                pqcoal_validation_error('Choose a valid status.');
            }
            $policyvalues = pqfin_policy_allowed_values();
            $paymenttimingvalues = array_merge(['workspace_policy'], $policyvalues['payment_required_timing']);
            if (!in_array($form['payment_required_timing'], $paymenttimingvalues, true)) {
                pqcoal_validation_error('Choose a valid payment timing.');
            }
            if (!in_array($form['tax_behavior'], ['not_configured', 'included', 'added_later', 'exempt'], true)) {
                pqcoal_validation_error('Choose a valid tax behavior.');
            }
            $now = time();
            $record = (object)[
                'consumerid' => (int)($consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'moodlecourseid' => (int)$form['moodlecourseid'],
                'course_key' => $form['course_key'],
                'title' => $form['title'],
                'summary' => $form['summary'],
                'syllabus' => $form['syllabus'],
                'prerequisites' => $form['prerequisites'],
                'startdate' => pqco_date_to_time($form['startdate']),
                'enddate' => pqco_date_to_time($form['enddate']),
                'capacity' => max(0, (int)$form['capacity']),
                'tuition_amount' => $form['tuition_amount'],
                'pricing_currency' => $form['pricing_currency'],
                'registration_fee' => $form['registration_fee'],
                'materials_fee' => $form['materials_fee'],
                'installment_eligible' => (int)$form['installment_eligible'],
                'scholarship_eligible' => (int)$form['scholarship_eligible'],
                'tax_behavior' => $form['tax_behavior'],
                'refund_policy_label' => core_text::substr($form['refund_policy_label'], 0, 120),
                'payment_required_timing' => $form['payment_required_timing'],
                'visibility' => $form['visibility'],
                'approval_mode' => 'admin_approval',
                'status' => $form['status'],
                'createdby' => (int)$USER->id,
                'timemodified' => $now,
            ];
            $offeringid = (int)$form['offeringid'];
            $existing = $offeringid > 0 ? $DB->get_record('local_prequran_course_offering', ['id' => $offeringid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            if ($existing) {
                $previous = clone $existing;
                $record->id = (int)$existing->id;
                $record->timecreated = (int)$existing->timecreated;
                $DB->update_record('local_prequran_course_offering', $record);
                pqco_course_audit('offering_updated', 'course_offering', (int)$record->id, [
                    'consumerid' => (int)$record->consumerid,
                    'workspaceid' => $workspaceid,
                    'offeringid' => (int)$record->id,
                    'previous_status' => (string)$previous->status,
                    'status' => (string)$record->status,
                    'title' => (string)$record->title,
                    'moodlecourseid' => (int)$record->moodlecourseid,
                    'pricing_currency' => (string)$record->pricing_currency,
                    'tuition_amount' => (string)$record->tuition_amount,
                ]);
                $message = trim($message . ' Course offering updated.');
            } else {
                $record->timecreated = $now;
                $offeringid = (int)$DB->insert_record('local_prequran_course_offering', $record);
                pqco_course_audit('offering_created', 'course_offering', $offeringid, [
                    'consumerid' => (int)$record->consumerid,
                    'workspaceid' => $workspaceid,
                    'offeringid' => $offeringid,
                    'status' => (string)$record->status,
                    'title' => (string)$record->title,
                    'moodlecourseid' => (int)$record->moodlecourseid,
                    'course_link_mode' => (string)$form['course_link_mode'],
                    'pricing_currency' => (string)$record->pricing_currency,
                    'tuition_amount' => (string)$record->tuition_amount,
                ]);
                $message = trim($message . ' Course offering created.');
            }
            echo json_encode(['ok' => true, 'message' => $message, 'offeringid' => $offeringid], JSON_UNESCAPED_SLASHES);
            exit;
        } else if ($action === 'create_invoice_from_request') {
            $requestid = $bint('requestid');
            $invoiceid = pqfin_create_invoice_from_enrollment_request($requestid, $workspaceid, $consumercontext, $userid);
            $message = 'Draft invoice created for enrollment request #' . $requestid . '.';
            // Legacy redirects to invoice_detail.php; the portal returns the target instead.
            echo json_encode([
                'ok' => true,
                'message' => $message,
                'invoiceid' => (int)$invoiceid,
                'invoiceurl' => '/local/hubredirect/invoice_detail.php?invoiceid=' . (int)$invoiceid . '&workspaceid=' . $workspaceid,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        } else if ($action === 'review_request') {
            $requestid = $bint('requestid');
            $decision = $balpha('decision');
            $notes = $btext('admin_notes');
            $message = pqcoal_review_enrollment_request($requestid, $decision, $notes, $workspaceid, $consumercontext);
            echo json_encode(['ok' => true, 'message' => $message], JSON_UNESCAPED_SLASHES);
            exit;
        } else if ($action === 'bulk_review_requests') {
            $decision = $balpha('decision');
            $notes = $btext('admin_notes');
            $requestids = array_map('intval', array_values((array)($body['requestids'] ?? [])));
            if (!in_array($decision, ['approved', 'rejected'], true)) {
                pqcoal_validation_error('Choose bulk approve or bulk reject.');
            }
            if (!$requestids) {
                pqcoal_validation_error('Select at least one pending request.');
            }
            $done = 0;
            $failed = [];
            foreach (array_unique($requestids) as $requestid) {
                if ($requestid <= 0) {
                    continue;
                }
                try {
                    pqcoal_review_enrollment_request($requestid, $decision, $notes, $workspaceid, $consumercontext);
                    $done++;
                } catch (Throwable $reviewerror) {
                    $failed[] = '#' . $requestid . ': ' . $reviewerror->getMessage();
                }
            }
            $message = ucfirst($decision) . ' completed for ' . $done . ' request' . ($done === 1 ? '' : 's') . '.';
            if ($failed) {
                $error = 'Some requests were not updated: ' . implode(' | ', array_slice($failed, 0, 4));
            }
            echo json_encode(['ok' => true, 'message' => $message, 'error' => $error, 'done' => $done], JSON_UNESCAPED_SLASHES);
            exit;
        } else if ($action === 'archive_offering') {
            $offeringid = $bint('offeringid');
            $offering = $DB->get_record('local_prequran_course_offering', ['id' => $offeringid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING);
            if (!$offering) {
                pqcoal_validation_error('Choose a valid offering to archive.');
            }
            $previousstatus = (string)$offering->status;
            $offering->status = 'archived';
            $offering->timemodified = time();
            $DB->update_record('local_prequran_course_offering', $offering);
            pqco_course_audit('offering_archived', 'course_offering', (int)$offering->id, [
                'consumerid' => (int)($offering->consumerid ?? $consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$offering->id,
                'previous_status' => $previousstatus,
                'status' => 'archived',
                'title' => (string)$offering->title,
            ]);
            echo json_encode(['ok' => true, 'message' => 'Offering archived.'], JSON_UNESCAPED_SLASHES);
            exit;
        } else if ($action === 'clone_offering') {
            $offeringid = $bint('offeringid');
            $offering = $DB->get_record('local_prequran_course_offering', ['id' => $offeringid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING);
            if (!$offering) {
                pqcoal_validation_error('Choose a valid offering to clone.');
            }
            $now = time();
            $clone = clone $offering;
            unset($clone->id);
            $clone->title = trim((string)$offering->title) . ' - next cohort';
            $clone->status = 'draft';
            $clone->createdby = (int)$USER->id;
            $clone->timecreated = $now;
            $clone->timemodified = $now;
            if ((int)$clone->startdate > 0) {
                $clone->startdate = strtotime('+3 months', (int)$clone->startdate) ?: 0;
            }
            if ((int)$clone->enddate > 0) {
                $clone->enddate = strtotime('+3 months', (int)$clone->enddate) ?: 0;
            }
            $cloneid = (int)$DB->insert_record('local_prequran_course_offering', $clone);
            pqco_course_audit('offering_cloned', 'course_offering', $cloneid, [
                'consumerid' => (int)($clone->consumerid ?? $consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => $cloneid,
                'source_offeringid' => (int)$offering->id,
                'status' => 'draft',
                'title' => (string)$clone->title,
            ]);
            echo json_encode(['ok' => true, 'message' => 'Offering cloned as a draft for the next cohort.', 'offeringid' => $cloneid], JSON_UNESCAPED_SLASHES);
            exit;
        } else if ($action === 'review_drop') {
            $requestid = $bint('requestid');
            $decision = $balpha('decision');
            $notes = $btext('admin_notes');
            $request = $DB->get_record_sql(
                "SELECT r.*, o.title AS offering_title, o.moodlecourseid, o.course_key, o.status AS offering_status
                   FROM {local_prequran_course_enrol_req} r
                   JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
                  WHERE r.id = :requestid
                    AND r.workspaceid = :workspaceid",
                ['requestid' => $requestid, 'workspaceid' => $workspaceid],
                IGNORE_MISSING
            );
            if (!$request) {
                pqcoal_validation_error('Choose a valid drop request.');
            }
            if ((string)$request->status !== 'drop_requested') {
                pqcoal_validation_error('Only drop-requested enrollments can be reviewed here.');
            }
            if (!in_array($decision, ['approved', 'rejected'], true)) {
                pqcoal_validation_error('Choose approve drop or reject drop.');
            }
            if ($decision === 'approved') {
                pqco_unenrol_student_from_moodle_course((int)$request->studentid, (int)$request->moodlecourseid);
                $updatedrequest = (object)[
                    'id' => (int)$request->id,
                    'status' => 'dropped',
                    'admin_notes' => $notes,
                    'droppedby' => (int)$USER->id,
                    'droppedat' => time(),
                    'timemodified' => time(),
                ];
                $message = 'Drop approved and Moodle unenrollment attempted.';
            } else {
                $updatedrequest = (object)[
                    'id' => (int)$request->id,
                    'status' => (int)$request->moodleenrolledat > 0 ? 'enrolled' : 'approved',
                    'admin_notes' => $notes,
                    'timemodified' => time(),
                ];
                $message = 'Drop request rejected; enrollment remains active.';
            }
            $DB->update_record('local_prequran_course_enrol_req', $updatedrequest);
            pqco_course_audit($decision === 'approved' ? 'drop_approved' : 'drop_rejected', 'course_enrol_req', (int)$request->id, [
                'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$request->offeringid,
                'requestid' => (int)$request->id,
                'studentid' => (int)$request->studentid,
                'moodlecourseid' => (int)$request->moodlecourseid,
                'previous_status' => 'drop_requested',
                'status' => (string)$updatedrequest->status,
                'admin_notes' => $notes,
            ]);
            $request->status = (string)$updatedrequest->status;
            $urlparams = ['workspaceid' => $workspaceid];
            pqco_notify_request_outcome(
                $request,
                $decision === 'approved' ? 'course_enrollment_dropped' : 'course_drop_rejected',
                $decision === 'approved' ? 'Course drop approved' : 'Course drop request rejected',
                $decision === 'approved'
                    ? 'The drop request for ' . (string)$request->offering_title . ' was approved.'
                    : 'The drop request for ' . (string)$request->offering_title . ' was rejected and enrollment remains active.' . ($notes !== '' ? "\n\nNote: " . $notes : ''),
                $workspaceid,
                $urlparams
            );
            echo json_encode(['ok' => true, 'message' => $message], JSON_UNESCAPED_SLASHES);
            exit;
        } else if ($action === 'drop_enrollment') {
            $requestid = $bint('requestid');
            $notes = $btext('admin_notes');
            $request = $DB->get_record_sql(
                "SELECT r.*, o.title AS offering_title, o.moodlecourseid, o.course_key
                   FROM {local_prequran_course_enrol_req} r
                   JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
                  WHERE r.id = :requestid
                    AND r.workspaceid = :workspaceid",
                ['requestid' => $requestid, 'workspaceid' => $workspaceid],
                IGNORE_MISSING
            );
            if (!$request) {
                pqcoal_validation_error('Choose a valid enrollment to drop.');
            }
            if ((string)$request->status !== 'enrolled') {
                pqcoal_validation_error('Only Moodle-enrolled requests can be dropped. Use Retry Moodle sync first for approved requests that are still pending sync.');
            }
            pqco_unenrol_student_from_moodle_course((int)$request->studentid, (int)$request->moodlecourseid);
            $DB->update_record('local_prequran_course_enrol_req', (object)[
                'id' => (int)$request->id,
                'status' => 'dropped',
                'admin_notes' => $notes,
                'droppedby' => (int)$USER->id,
                'droppedat' => time(),
                'timemodified' => time(),
            ]);
            pqco_course_audit('enrollment_dropped_by_admin', 'course_enrol_req', (int)$request->id, [
                'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$request->offeringid,
                'requestid' => (int)$request->id,
                'studentid' => (int)$request->studentid,
                'moodlecourseid' => (int)$request->moodlecourseid,
                'previous_status' => (string)$request->status,
                'status' => 'dropped',
                'admin_notes' => $notes,
            ]);
            $request->status = 'dropped';
            $urlparams = ['workspaceid' => $workspaceid];
            pqco_notify_request_outcome(
                $request,
                'course_enrollment_dropped',
                'Course enrollment dropped',
                'Enrollment in ' . (string)$request->offering_title . ' was dropped by an admin.' . ($notes !== '' ? "\n\nNote: " . $notes : ''),
                $workspaceid,
                $urlparams
            );
            echo json_encode(['ok' => true, 'message' => 'Enrollment dropped and Moodle unenrollment attempted.'], JSON_UNESCAPED_SLASHES);
            exit;
        } else if ($action === 'retry_moodle_enrollment') {
            $requestid = $bint('requestid');
            $request = $DB->get_record_sql(
                "SELECT r.*, o.title AS offering_title, o.moodlecourseid, o.course_key
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
            if ((string)$request->status !== 'approved') {
                pqcoal_validation_error('Only approved requests pending Moodle sync can be synced to Moodle.');
            }
            $urlparams = ['workspaceid' => $workspaceid];
            if (!pqco_enrol_student_in_moodle_course((int)$request->studentid, (int)$request->moodlecourseid)) {
                pqco_notify_workspace_admins(
                    $workspaceid,
                    'Course Moodle sync failed',
                    'Retry Moodle enrollment failed for ' . (string)$request->offering_title . '. Confirm the linked Moodle course has enabled manual enrollment.',
                    new moodle_url('/local/hubredirect/course_sync_report.php', $urlparams),
                    'Open sync report',
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
                pqcoal_validation_error('Moodle enrollment could not be completed. Confirm the linked Moodle course has an enabled manual enrollment method.');
            }
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
            $updatedrequest = (object)[
                'id' => (int)$request->id,
                'status' => 'enrolled',
                'moodleenrolledat' => time(),
                'timemodified' => time(),
            ];
            $DB->update_record('local_prequran_course_enrol_req', $updatedrequest);
            pqco_course_audit('moodle_enrollment_synced', 'course_enrol_req', (int)$request->id, [
                'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$request->offeringid,
                'requestid' => (int)$request->id,
                'studentid' => (int)$request->studentid,
                'moodlecourseid' => (int)$request->moodlecourseid,
                'status' => 'enrolled',
                'teacher_enrollment_count' => $teacherenrolledcount,
            ]);
            $request->status = 'enrolled';
            pqco_notify_request_outcome(
                $request,
                'course_enrollment_enrolled',
                'Course access is ready',
                'Your access to ' . (string)$request->offering_title . ' is now ready.',
                $workspaceid,
                $urlparams
            );
            echo json_encode(['ok' => true, 'message' => 'Moodle enrollment synced for this approved request.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        pqpd_fail(400, 'Unknown course-offerings action.');
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// ---- GET: everything the page renders ----------------------------------------
if (!$ready) {
    echo json_encode([
        'ok' => true, 'ready' => false,
        'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
        'message' => 'Course offering tables are not ready. Run the local_prequran Moodle upgrade first.',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

$editid = optional_param('editid', 0, PARAM_INT);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$requestfilters = pqcoal_request_filters();

$form = [
    'offeringid' => '0',
    'course_link_mode' => 'existing',
    'course_key' => 'pre_quraan',
    'moodlecourseid' => '0',
    'title' => '',
    'summary' => '',
    'syllabus' => '',
    'prerequisites' => '',
    'startdate' => '',
    'enddate' => '',
    'capacity' => '9',
    'tuition_amount' => '',
    'pricing_currency' => pqfin_default_currency(),
    'registration_fee' => '',
    'materials_fee' => '',
    'installment_eligible' => '0',
    'scholarship_eligible' => '0',
    'tax_behavior' => 'not_configured',
    'refund_policy_label' => '',
    'payment_required_timing' => 'workspace_policy',
    'visibility' => 'workspace',
    'status' => 'draft',
];
if ($editid > 0) {
    $edit = $DB->get_record('local_prequran_course_offering', ['id' => $editid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING);
    if ($edit) {
        $form = pqcoal_offering_record_for_form($edit);
    }
}

$offerings = array_values($DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'status ASC, startdate ASC, title ASC'));
$counts = pqco_offering_counts(array_map(static fn($row): int => (int)$row->id, $offerings));
foreach ($offerings as $offering) {
    $offering->open_seats = pqco_open_seats($offering, $counts);
    $offering->approved_count = (int)($counts[(int)$offering->id] ?? 0);
    $offering->availability = pqco_offering_availability_label($offering, (int)$offering->open_seats);
    $offering->pricing = pqfin_offering_pricing_summary($offering);
    $offering->track_title = (string)($catalog[(string)$offering->course_key]['title'] ?? (string)$offering->course_key);
}

$requestwhere = ['r.workspaceid = :workspaceid'];
$requestparams = ['workspaceid' => $workspaceid];
if ((string)$requestfilters['request_status'] !== '') {
    $requestwhere[] = 'r.status = :requeststatus';
    $requestparams['requeststatus'] = (string)$requestfilters['request_status'];
}
if ((int)$requestfilters['request_offeringid'] > 0) {
    $requestwhere[] = 'r.offeringid = :requestofferingid';
    $requestparams['requestofferingid'] = (int)$requestfilters['request_offeringid'];
}
if ((string)$requestfilters['request_student'] !== '') {
    $like = '%' . $DB->sql_like_escape((string)$requestfilters['request_student']) . '%';
    $requestwhere[] = '('
        . $DB->sql_like('u.firstname', ':studentfirstname', false) . ' OR '
        . $DB->sql_like('u.lastname', ':studentlastname', false) . ' OR '
        . $DB->sql_like('u.email', ':studentemail', false) . ' OR '
        . $DB->sql_like('u.username', ':studentusername', false) . ' OR '
        . $DB->sql_like('u.idnumber', ':studentidnumber', false)
        . ')';
    $requestparams['studentfirstname'] = $like;
    $requestparams['studentlastname'] = $like;
    $requestparams['studentemail'] = $like;
    $requestparams['studentusername'] = $like;
    $requestparams['studentidnumber'] = $like;
}
$requests = array_values($DB->get_records_sql(
    "SELECT r.*, o.title AS offering_title, o.course_key, o.moodlecourseid,
            o.tuition_amount, o.pricing_currency, o.registration_fee, o.materials_fee,
            o.installment_eligible, o.scholarship_eligible, o.tax_behavior,
            o.refund_policy_label, o.payment_required_timing,
            u.firstname, u.lastname, u.email, u.username, u.idnumber
       FROM {local_prequran_course_enrol_req} r
       JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
       JOIN {user} u ON u.id = r.studentid
      WHERE " . implode(' AND ', $requestwhere) . "
   ORDER BY CASE r.status WHEN 'pending' THEN 1 WHEN 'drop_requested' THEN 2 WHEN 'approved' THEN 3 WHEN 'enrolled' THEN 4 ELSE 5 END,
            r.timecreated DESC",
    $requestparams,
    0,
    $export === 'requests_csv' ? 5000 : 120
));
$requestfinancesummaries = pqfin_invoice_summary_for_requestids(array_map(static fn($request): int => (int)$request->id, $requests), $workspaceid);
foreach ($requests as $request) {
    $request->student_name = fullname($request);
    $request->account_label = pqh_account_no_label($request);
    $request->status_label = pqco_request_status_label((string)$request->status);
    $finance = $requestfinancesummaries[(int)$request->id] ?? [];
    $pricing = pqfin_offering_pricing_summary($request);
    $request->finance = $finance ?: null;
    $request->pricing = $pricing;
    $request->finance_status_label = pqcoal_finance_status_label($finance);
    $request->finance_warnings = pqcoal_finance_warning_labels($request, $finance, $pricing);
}
$pendingrequestcount = pqco_pending_request_count($workspaceid);
$droprequestcount = (int)$DB->count_records('local_prequran_course_enrol_req', [
    'workspaceid' => $workspaceid,
    'status' => 'drop_requested',
]);

$courseaudits = [];
if (pqh_table_exists_safe('local_prequran_course_audit')) {
    $courseaudits = array_values($DB->get_records_sql(
        "SELECT a.*, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_course_audit} a
      LEFT JOIN {user} u ON u.id = a.actorid
          WHERE a.workspaceid = :workspaceid
       ORDER BY a.timecreated DESC, a.id DESC",
        ['workspaceid' => $workspaceid],
        0,
        35
    ));
    foreach ($courseaudits as $audit) {
        $audit->actor_name = (int)$audit->actorid > 0 ? fullname($audit) : 'System';
        $audit->actor_account = (int)$audit->actorid > 0 ? pqh_account_no_label($audit) : '';
        $audit->details_label = pqcoal_audit_details_label((string)$audit->details);
    }
}

$catalogout = [];
foreach ($catalog as $key => $course) {
    $catalogout[] = ['key' => (string)$key, 'title' => (string)($course['title'] ?? $key)];
}
$moodlecoursesout = [];
foreach ($moodlecourses as $courseid => $label) {
    $moodlecoursesout[] = ['id' => (int)$courseid, 'label' => (string)$label];
}

$nameids = [];
foreach ($offerings as $offering) {
    $nameids[] = (int)($offering->createdby ?? 0);
}
foreach ($requests as $request) {
    $nameids[] = (int)($request->approvedby ?? 0);
    $nameids[] = (int)($request->droppedby ?? 0);
}
foreach ($courseaudits as $audit) {
    $nameids[] = (int)($audit->actorid ?? 0);
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => [
        'id' => $workspaceid,
        'name' => (string)$workspace->name,
        'workspace_type' => (string)($workspace->workspace_type ?? ''),
    ],
    'consumer' => [
        'slug' => (string)($consumercontext->consumerslug ?? ''),
        'name' => (string)($consumercontext->consumername ?? ''),
    ],
    'form' => $form,
    'catalog' => $catalogout,
    'moodlecourses' => $moodlecoursesout,
    'options' => [
        'statuses' => pqco_status_options(),
        'visibilities' => pqco_visibility_options(),
        'payment_timings' => array_values(array_merge(['workspace_policy'], pqfin_policy_allowed_values()['payment_required_timing'])),
        'tax_behaviors' => ['not_configured' => 'Not configured', 'included' => 'Included in price', 'added_later' => 'Added later', 'exempt' => 'Exempt'],
        'request_statuses' => ['pending', 'approved', 'enrolled', 'drop_requested', 'dropped', 'rejected', 'cancelled'],
    ],
    'invoice_schema_ready' => pqfin_invoice_schema_ready(),
    'offerings' => $offerings,
    'requests' => $requests,
    'pendingrequestcount' => $pendingrequestcount,
    'droprequestcount' => $droprequestcount,
    'courseaudits' => $courseaudits,
    'filters' => $requestfilters,
    'export' => $export,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
