<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_offeringlib.php');
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

function pqcoa_user_can_manage_offerings(int $userid, int $workspaceid, ?stdClass $workspace): bool {
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

$workspace = $workspaceid > 0
    ? $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING)
    : false;

if (!$workspace || !pqcoa_user_can_manage_offerings((int)$USER->id, $workspaceid, $workspace ?: null)) {
    pqh_access_denied(
        'Only workspace admins or approved independent teachers can manage course offerings.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Course offering access required'
    );
}
pqh_enforce_role_domain($consumercontext, $workspaceid, (int)$USER->id);

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/course_offerings.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Course Offerings');
$PAGE->set_heading('Course Offerings');
$PAGE->add_body_class('pqco-admin-page');

$ready = pqco_table_ready();
$message = '';
$error = '';
$catalog = pqh_course_catalog();
// Every built-in catalog track is a Quran/Islamic-studies subject (Pre-Quraan,
// Quran Tafsir, Tarbiyah Kids ...). Those belong in the Course track dropdown
// for a faith-based institution, not for a K-12, languages, technical, or
// professional school -- those should start from "Custom / other subject" and
// name their own subjects. The full $catalog is deliberately left intact: it
// still resolves titles for offerings that already use a catalog key, so
// nothing that exists today loses its label.
$pqcoinstitutiontype = trim((string)($consumercontext->institution_type ?? ''));
$catalogoptions = ($pqcoinstitutiontype === '' || $pqcoinstitutiontype === 'faith_based_education')
    ? $catalog
    : [];
$moodlecourses = pqco_moodle_courses($workspaceid);
// Courses without an approved syllabus stay selectable -- a syllabus is
// normally written for a course you are already offering, so hiding them would
// deadlock offering creation. They are flagged instead: on the option itself
// and in a note under the field.
require_once(__DIR__ . '/syllabus_portallib.php');
$approvedsyllabi = pqsyl_approved_course_ids($workspaceid);
$editid = optional_param('editid', 0, PARAM_INT);

/**
 * Course inventory for the workspace: every Moodle course filed under this
 * institution's category, plus any course an existing offering already links
 * to, each paired with its offering when one exists. Drives the "Course
 * Inventory" block, whose point is showing which courses are NOT yet offered.
 *
 * Read-only on purpose: pqh_workspace_course_category_ids() resolves the
 * institution category by lookup, never via pqco_consumer_category_id(), which
 * creates the category as a side effect and must not run just because someone
 * opened the page.
 *
 * Offerings with no linked Moodle course are intentionally absent -- this
 * lists courses, and those already appear in the offerings table above.
 */
function pqcoa_course_inventory(int $workspaceid, array $offerings, array $counts): array {
    global $DB;

    if ($workspaceid <= 0) {
        return [];
    }

    $offeringbycourse = [];
    foreach ($offerings as $offering) {
        $moodlecourseid = (int)($offering->moodlecourseid ?? 0);
        if ($moodlecourseid > 0 && !isset($offeringbycourse[$moodlecourseid])) {
            $offeringbycourse[$moodlecourseid] = $offering;
        }
    }

    // Institution category resolution lives in accesslib so this page and the
    // syllabus course picker cannot drift apart.
    $categoryids = pqh_workspace_course_category_ids($workspaceid);

    $fields = 'id,fullname,shortname,idnumber,visible,category,startdate';
    $courses = [];
    try {
        if ($categoryids) {
            [$catsql, $catparams] = $DB->get_in_or_equal($categoryids, SQL_PARAMS_NAMED, 'incat');
            foreach ($DB->get_records_select('course', "category {$catsql}", $catparams, 'fullname ASC', $fields) as $course) {
                if ((int)$course->id !== SITEID) {
                    $courses[(int)$course->id] = $course;
                }
            }
        }
        if ($offeringbycourse) {
            [$insql, $params] = $DB->get_in_or_equal(array_keys($offeringbycourse), SQL_PARAMS_NAMED, 'cid');
            foreach ($DB->get_records_select('course', "id {$insql}", $params, 'fullname ASC', $fields) as $course) {
                if ((int)$course->id !== SITEID) {
                    $courses[(int)$course->id] = $course;
                }
            }
        }
    } catch (Throwable $e) {
        return [];
    }
    if (!$courses) {
        return [];
    }

    $categorynames = [];
    $categoryids = array_values(array_unique(array_filter(array_map(static function($course): int {
        return (int)$course->category;
    }, $courses))));
    if ($categoryids) {
        [$catsql, $catparams] = $DB->get_in_or_equal($categoryids, SQL_PARAMS_NAMED, 'cat');
        foreach ($DB->get_records_select('course_categories', "id {$catsql}", $catparams, '', 'id,name') as $row) {
            $categorynames[(int)$row->id] = (string)$row->name;
        }
    }

    $inventory = [];
    foreach ($courses as $courseid => $course) {
        $offering = $offeringbycourse[$courseid] ?? null;
        $capacity = $offering ? (int)($offering->capacity ?? 0) : 0;
        $enrolled = $offering ? (int)($counts[(int)$offering->id] ?? 0) : 0;
        $inventory[] = [
            'courseid' => (int)$courseid,
            'fullname' => trim((string)$course->fullname) !== '' ? trim((string)$course->fullname) : (string)$course->shortname,
            'shortname' => (string)$course->shortname,
            'idnumber' => (string)$course->idnumber,
            'visible' => (int)$course->visible === 1,
            'category' => $categorynames[(int)$course->category] ?? '',
            'coursestart' => (int)($course->startdate ?? 0),
            'isoffered' => $offering !== null,
            'offeringid' => $offering ? (int)$offering->id : 0,
            'offeringtitle' => $offering ? trim((string)($offering->title ?? '')) : '',
            'coursekey' => $offering ? trim((string)($offering->course_key ?? '')) : '',
            'status' => $offering ? (trim((string)($offering->status ?? '')) !== '' ? trim((string)$offering->status) : 'draft') : '',
            'visibility' => $offering ? (trim((string)($offering->visibility ?? '')) !== '' ? trim((string)$offering->visibility) : 'workspace') : '',
            'capacity' => $capacity,
            'enrolled' => $enrolled,
            'openseats' => $capacity > 0 ? max(0, $capacity - $enrolled) : 0,
            'unlimited' => $offering && $capacity <= 0,
            'startdate' => $offering ? (int)($offering->startdate ?? 0) : 0,
            'enddate' => $offering ? (int)($offering->enddate ?? 0) : 0,
        ];
    }

    usort($inventory, static function(array $a, array $b): int {
        if ($a['isoffered'] !== $b['isoffered']) {
            return $a['isoffered'] ? 1 : -1;
        }
        return strcasecmp($a['fullname'], $b['fullname']);
    });
    return $inventory;
}

function pqcoa_offering_record_for_form(stdClass $offering, array $catalog): array {
    $coursekey = (string)($offering->course_key ?? '');
    $iscustom = $coursekey !== '' && !isset($catalog[$coursekey]);
    return [
        'offeringid' => (string)((int)($offering->id ?? 0)),
        'course_link_mode' => 'existing',
        'course_key' => $iscustom ? '__custom__' : $coursekey,
        'custom_course_title' => $iscustom ? (string)($offering->title ?? '') : '',
        'moodlecourseid' => (string)((int)($offering->moodlecourseid ?? 0)),
        'title' => (string)($offering->title ?? ''),
        'summary' => (string)($offering->summary ?? ''),
        'syllabus' => (string)($offering->syllabus ?? ''),
        'prerequisites' => (string)($offering->prerequisites ?? ''),
        'startdate' => pqco_time_to_date((int)($offering->startdate ?? 0)),
        'enddate' => pqco_time_to_date((int)($offering->enddate ?? 0)),
        'capacity' => (string)((int)($offering->capacity ?? 0)),
        'sessions_per_week' => (string)((int)($offering->sessions_per_week ?? 0)),
        'session_minutes' => (string)((int)($offering->session_minutes ?? 0)),
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

function pqcoa_param_text(string $name): string {
    return trim(optional_param($name, '', PARAM_TEXT));
}

function pqcoa_validation_error(string $message): void {
    throw new RuntimeException($message);
}

function pqcoa_review_enrollment_request(int $requestid, string $decision, string $notes, int $workspaceid, $consumercontext): string {
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
        pqcoa_validation_error('Choose a valid enrollment request.');
    }
    if ((string)$request->status !== 'pending') {
        pqcoa_validation_error('Only pending enrollment requests can be reviewed.');
    }
    if (!in_array($decision, ['approved', 'rejected'], true)) {
        pqcoa_validation_error('Choose approve or reject.');
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
            pqcoa_validation_error('Only published course offerings can accept new approvals.');
        }
        if (pqco_offering_has_ended($request)) {
            pqcoa_validation_error('Enrollment has closed for this course offering. Reject the request with an alternative note or extend the offering end date.');
        }
        $seatcounts = pqco_offering_counts([(int)$request->offeringid]);
        if (pqco_open_seats((object)[
            'id' => (int)$request->offeringid,
            'capacity' => (int)$request->capacity,
        ], $seatcounts) <= 0) {
            pqcoa_validation_error('This course offering is full. Add seats or reject the request with an alternative note.');
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
            $message = 'Enrollment approved and enrollment completed.';
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
            $message = 'Enrollment approved. Auto-enrollment was not completed; check the linked course manual enrollment setup.';
            pqco_notify_workspace_admins(
                $workspaceid,
                'Course sync failed',
                'A course enrollment was approved but enrollment did not complete for ' . (string)$request->offering_title . '.',
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
            'Your enrollment for ' . (string)$request->offering_title . ' was approved. The academy is completing the course access setup.',
            $workspaceid
        );
    }
    return $message;
}

function pqcoa_request_filters(): array {
    return [
        'request_status' => optional_param('request_status', '', PARAM_ALPHANUMEXT),
        'request_offeringid' => optional_param('request_offeringid', 0, PARAM_INT),
        'request_student' => trim(optional_param('request_student', '', PARAM_TEXT)),
    ];
}

function pqcoa_request_filter_url_params(array $baseparams, array $filters, array $extra = []): array {
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

function pqcoa_audit_details_label(string $details): string {
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

function pqcoa_finance_status_label(array $summary): string {
    if (!$summary) {
        return 'No invoice';
    }
    return pqfin_invoice_status_label((string)$summary['status']);
}

function pqcoa_finance_warning_labels($request, array $summary, array $pricing): array {
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

$form = [
    'offeringid' => '0',
    'course_link_mode' => 'existing',
    'course_key' => '__custom__',
    'custom_course_title' => '',
    'moodlecourseid' => '0',
    'title' => '',
    'summary' => '',
    'syllabus' => '',
    'prerequisites' => '',
    'startdate' => '',
    'enddate' => '',
    'capacity' => '9',
    'sessions_per_week' => '0',
    'session_minutes' => '0',
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

if ($ready && $editid > 0) {
    $edit = $DB->get_record('local_prequran_course_offering', ['id' => $editid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING);
    if ($edit) {
        $form = pqcoa_offering_record_for_form($edit, $catalog);
    }
}

// "Create offering" in the Course Inventory block links here with the course
// already chosen, so the form opens ready to fill in rather than making the
// admin hunt for the same course again in the Linked course dropdown.
if ($ready && $editid <= 0 && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    $prefillcourseid = optional_param('moodlecourseid', 0, PARAM_INT);
    if ($prefillcourseid > 0 && isset($moodlecourses[$prefillcourseid])) {
        $form['moodlecourseid'] = (string)$prefillcourseid;
        $form['course_link_mode'] = 'existing';
    }
}

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!confirm_sesskey()) {
            pqcoa_validation_error('This course offering form expired. Please refresh and try again.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        if ($action === 'save_offering') {
            $rawcoursekey = optional_param('course_key', '', PARAM_ALPHANUMEXT);
            $iscustomcourse = $rawcoursekey === '__custom__';
            $customcoursetitle = pqcoa_param_text('custom_course_title');
            $form = [
                'offeringid' => (string)optional_param('offeringid', 0, PARAM_INT),
                'course_link_mode' => optional_param('course_link_mode', 'existing', PARAM_ALPHANUMEXT),
                'course_key' => $iscustomcourse
                    ? pqco_slug_segment($customcoursetitle, 'custom_' . time())
                    : pqh_normalize_course_key($rawcoursekey),
                'custom_course_title' => $customcoursetitle,
                'moodlecourseid' => (string)optional_param('moodlecourseid', 0, PARAM_INT),
                'title' => pqcoa_param_text('title'),
                'summary' => pqcoa_param_text('summary'),
                'syllabus' => pqcoa_param_text('syllabus'),
                'prerequisites' => pqcoa_param_text('prerequisites'),
                'startdate' => pqcoa_param_text('startdate'),
                'enddate' => pqcoa_param_text('enddate'),
                'capacity' => (string)optional_param('capacity', 0, PARAM_INT),
                'sessions_per_week' => (string)max(0, min(7, optional_param('sessions_per_week', 0, PARAM_INT))),
                'session_minutes' => (string)max(0, min(480, optional_param('session_minutes', 0, PARAM_INT))),
                'tuition_amount' => pqfin_normalize_money_string(optional_param('tuition_amount', '', PARAM_RAW_TRIMMED)),
                'pricing_currency' => pqfin_normalize_currency(optional_param('pricing_currency', pqfin_default_currency(), PARAM_ALPHANUMEXT)),
                'registration_fee' => pqfin_normalize_money_string(optional_param('registration_fee', '', PARAM_RAW_TRIMMED)),
                'materials_fee' => pqfin_normalize_money_string(optional_param('materials_fee', '', PARAM_RAW_TRIMMED)),
                'installment_eligible' => optional_param('installment_eligible', 0, PARAM_INT) ? '1' : '0',
                'scholarship_eligible' => optional_param('scholarship_eligible', 0, PARAM_INT) ? '1' : '0',
                'tax_behavior' => optional_param('tax_behavior', 'not_configured', PARAM_ALPHANUMEXT),
                'refund_policy_label' => pqcoa_param_text('refund_policy_label'),
                'payment_required_timing' => optional_param('payment_required_timing', 'workspace_policy', PARAM_ALPHANUMEXT),
                'visibility' => optional_param('visibility', 'workspace', PARAM_ALPHANUMEXT),
                'status' => optional_param('status', 'draft', PARAM_ALPHANUMEXT),
            ];
            if ($iscustomcourse) {
                if ($customcoursetitle === '') {
                    pqcoa_validation_error('Enter a title for the custom course.');
                }
                if ($form['title'] === '') {
                    $form['title'] = $customcoursetitle;
                }
            } else {
                if ($form['course_key'] === '' || !isset($catalog[$form['course_key']])) {
                    pqcoa_validation_error('Choose a valid course track.');
                }
                if ($form['title'] === '') {
                    $form['title'] = (string)$catalog[$form['course_key']]['title'];
                }
            }
            if (!in_array($form['course_link_mode'], ['existing', 'create_new'], true)) {
                pqcoa_validation_error('Choose whether to link an existing course or create a new one.');
            }
            if ($form['course_link_mode'] === 'create_new') {
                $createdcourseid = pqco_create_moodle_course_for_offering($consumercontext, $workspace, $form, $catalog);
                if ($createdcourseid <= 0) {
                    pqcoa_validation_error('The course could not be created. Check course category permissions and try again.');
                }
                $form['moodlecourseid'] = (string)$createdcourseid;
                $moodlecourses = pqco_moodle_courses($workspaceid);
                $message = 'Course created and linked to this offering.';
            }
            if ((int)$form['moodlecourseid'] <= 0 || !isset($moodlecourses[(int)$form['moodlecourseid']])) {
                pqcoa_validation_error('Choose the linked course before saving this offering, or select Create new course.');
            }
            if (!array_key_exists($form['visibility'], pqco_visibility_options())) {
                pqcoa_validation_error('Choose a valid visibility.');
            }
            if (!array_key_exists($form['status'], pqco_status_options())) {
                pqcoa_validation_error('Choose a valid status.');
            }
            $policyvalues = pqfin_policy_allowed_values();
            $paymenttimingvalues = array_merge(['workspace_policy'], $policyvalues['payment_required_timing']);
            if (!in_array($form['payment_required_timing'], $paymenttimingvalues, true)) {
                pqcoa_validation_error('Choose a valid payment timing.');
            }
            if (!in_array($form['tax_behavior'], ['not_configured', 'included', 'added_later', 'exempt'], true)) {
                pqcoa_validation_error('Choose a valid tax behavior.');
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
                // Written conditionally below: the columns arrive with upgrade
                // 202607310028 and this page must not fatal on a DB that has
                // not run it yet.
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
            if (pqh_table_has_field_safe('local_prequran_course_offering', 'sessions_per_week')) {
                $record->sessions_per_week = max(0, (int)$form['sessions_per_week']);
                $record->session_minutes = max(0, (int)$form['session_minutes']);
            }
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
            $form['offeringid'] = (string)$offeringid;
        } else if ($action === 'create_invoice_from_request') {
            $requestid = optional_param('requestid', 0, PARAM_INT);
            $invoiceid = pqfin_create_invoice_from_enrollment_request($requestid, $workspaceid, $consumercontext, (int)$USER->id);
            $message = 'Draft invoice created for enrollment request #' . $requestid . '.';
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'review_request') {
            $requestid = optional_param('requestid', 0, PARAM_INT);
            $decision = optional_param('decision', '', PARAM_ALPHANUMEXT);
            $notes = pqcoa_param_text('admin_notes');
            $message = pqcoa_review_enrollment_request($requestid, $decision, $notes, $workspaceid, $consumercontext);
        } else if ($action === 'bulk_review_requests') {
            $decision = optional_param('decision', '', PARAM_ALPHANUMEXT);
            $notes = pqcoa_param_text('admin_notes');
            $requestids = optional_param_array('requestids', [], PARAM_INT);
            if (!in_array($decision, ['approved', 'rejected'], true)) {
                pqcoa_validation_error('Choose bulk approve or bulk reject.');
            }
            if (!$requestids) {
                pqcoa_validation_error('Select at least one pending request.');
            }
            $done = 0;
            $failed = [];
            foreach (array_unique(array_map('intval', $requestids)) as $requestid) {
                if ($requestid <= 0) {
                    continue;
                }
                try {
                    pqcoa_review_enrollment_request($requestid, $decision, $notes, $workspaceid, $consumercontext);
                    $done++;
                } catch (Throwable $reviewerror) {
                    $failed[] = '#' . $requestid . ': ' . $reviewerror->getMessage();
                }
            }
            $message = ucfirst($decision) . ' completed for ' . $done . ' request' . ($done === 1 ? '' : 's') . '.';
            if ($failed) {
                $error = 'Some requests were not updated: ' . implode(' | ', array_slice($failed, 0, 4));
            }
        } else if ($action === 'archive_offering') {
            $offeringid = optional_param('offeringid', 0, PARAM_INT);
            $offering = $DB->get_record('local_prequran_course_offering', ['id' => $offeringid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING);
            if (!$offering) {
                pqcoa_validation_error('Choose a valid offering to archive.');
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
            $message = 'Offering archived.';
        } else if ($action === 'clone_offering') {
            $offeringid = optional_param('offeringid', 0, PARAM_INT);
            $offering = $DB->get_record('local_prequran_course_offering', ['id' => $offeringid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING);
            if (!$offering) {
                pqcoa_validation_error('Choose a valid offering to clone.');
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
            $message = 'Offering cloned as a draft for the next cohort.';
        } else if ($action === 'review_drop') {
            $requestid = optional_param('requestid', 0, PARAM_INT);
            $decision = optional_param('decision', '', PARAM_ALPHANUMEXT);
            $notes = pqcoa_param_text('admin_notes');
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
                pqcoa_validation_error('Choose a valid drop request.');
            }
            if ((string)$request->status !== 'drop_requested') {
                pqcoa_validation_error('Only drop-requested enrollments can be reviewed here.');
            }
            if (!in_array($decision, ['approved', 'rejected'], true)) {
                pqcoa_validation_error('Choose approve drop or reject drop.');
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
                $message = 'Drop approved and unenrollment attempted.';
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
        } else if ($action === 'drop_enrollment') {
            $requestid = optional_param('requestid', 0, PARAM_INT);
            $notes = pqcoa_param_text('admin_notes');
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
                pqcoa_validation_error('Choose a valid enrollment to drop.');
            }
            if ((string)$request->status !== 'enrolled') {
                pqcoa_validation_error('Only enrolled requests can be dropped. Use Retry sync first for approved requests that are still pending sync.');
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
            pqco_notify_request_outcome(
                $request,
                'course_enrollment_dropped',
                'Course enrollment dropped',
                'Enrollment in ' . (string)$request->offering_title . ' was dropped by an admin.' . ($notes !== '' ? "\n\nNote: " . $notes : ''),
                $workspaceid,
                $urlparams
            );
            $message = 'Enrollment dropped and unenrollment attempted.';
        } else if ($action === 'retry_moodle_enrollment') {
            $requestid = optional_param('requestid', 0, PARAM_INT);
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
                pqcoa_validation_error('Choose a valid enrollment request.');
            }
            if ((string)$request->status !== 'approved') {
                pqcoa_validation_error('Only approved requests pending sync can be synced.');
            }
            if (!pqco_enrol_student_in_moodle_course((int)$request->studentid, (int)$request->moodlecourseid)) {
                pqco_notify_workspace_admins(
                    $workspaceid,
                    'Course sync failed',
                    'Retry enrollment failed for ' . (string)$request->offering_title . '. Confirm the linked course has enabled manual enrollment.',
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
                pqcoa_validation_error('Enrollment could not be completed. Confirm the linked course has an enabled manual enrollment method.');
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
            $message = 'Enrollment synced for this approved request.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$offerings = [];
$counts = [];
$courseinventory = [];
$requests = [];
$requestfinancesummaries = [];
$courseaudits = [];
$requestfilters = pqcoa_request_filters();
$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$pendingrequestcount = 0;
$droprequestcount = 0;
if ($ready) {
    $offerings = array_values($DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'status ASC, startdate ASC, title ASC'));
    $counts = pqco_offering_counts(array_map(static fn($row): int => (int)$row->id, $offerings));
    $courseinventory = pqcoa_course_inventory($workspaceid, $offerings, $counts);
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
    $pendingrequestcount = pqco_pending_request_count($workspaceid);
    $droprequestcount = (int)$DB->count_records('local_prequran_course_enrol_req', [
        'workspaceid' => $workspaceid,
        'status' => 'drop_requested',
    ]);
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
    }
}

if ($ready && $export === 'requests_csv') {
    $filename = clean_filename('workspace-course-enrollment-requests-' . $workspaceid . '-' . date('Ymd-His') . '.csv');
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, [
        'requestid', 'workspaceid', 'offeringid', 'offering_title', 'course_key', 'moodlecourseid',
        'studentid', 'student_name', 'account_no', 'email', 'requesterid', 'requester_role',
        'status', 'request_notes', 'admin_notes', 'approvedby', 'approved_at', 'moodle_enrolled_at',
        'droppedby', 'dropped_at', 'created_at', 'updated_at',
    ]);
    foreach ($requests as $request) {
        fputcsv($out, [
            (int)$request->id,
            (int)$request->workspaceid,
            (int)$request->offeringid,
            (string)$request->offering_title,
            (string)$request->course_key,
            (int)$request->moodlecourseid,
            (int)$request->studentid,
            fullname($request),
            (string)$request->idnumber,
            (string)$request->email,
            (int)$request->requesterid,
            (string)$request->requester_role,
            (string)$request->status,
            (string)$request->request_notes,
            (string)$request->admin_notes,
            (int)$request->approvedby,
            (int)$request->approvedat > 0 ? userdate((int)$request->approvedat, get_string('strftimedatetimeshort')) : '',
            (int)$request->moodleenrolledat > 0 ? userdate((int)$request->moodleenrolledat, get_string('strftimedatetimeshort')) : '',
            (int)($request->droppedby ?? 0),
            (int)($request->droppedat ?? 0) > 0 ? userdate((int)$request->droppedat, get_string('strftimedatetimeshort')) : '',
            (int)$request->timecreated > 0 ? userdate((int)$request->timecreated, get_string('strftimedatetimeshort')) : '',
            (int)$request->timemodified > 0 ? userdate((int)$request->timemodified, get_string('strftimedatetimeshort')) : '',
        ]);
    }
    fclose($out);
    exit;
}

echo $OUTPUT->header();
?>
<style>
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
body.pqco-admin-page header,body.pqco-admin-page footer,body.pqco-admin-page nav.navbar,body.pqco-admin-page #page-header,body.pqco-admin-page #page-footer,body.pqco-admin-page .drawer,body.pqco-admin-page .drawer-toggles,body.pqco-admin-page .block-region,body.pqco-admin-page [data-region="drawer"],body.pqco-admin-page [data-region="right-hand-drawer"]{display:none!important}
body.pqco-admin-page #page,body.pqco-admin-page #page-content,body.pqco-admin-page #region-main,body.pqco-admin-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
/* Skin only: every token below is measured off openproject.org — Lato, #1a67a3
   primary, #dfdfdf hairlines, 3px radii, 400/700 weights, #ebf3f7 tinted
   surfaces. Nothing here changes markup, copy or behaviour. */
:root{--op-font:"Lato",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans",Ubuntu,Cantarell,"Helvetica Neue",sans-serif;--op-primary:#1a67a3;--op-primary-hover:#134a81;--op-primary-subtle:#d1e1ed;--op-primary-border:#a3c2da;--op-primary-emphasis:#0a2941;--op-ink:#1f1f1f;--op-ink-muted:#555;--op-ink-soft:#707070;--op-ink-faint:#919191;--op-line:#dfdfdf;--op-line-strong:#ccc;--op-canvas:#f2f2f2;--op-surface:#fff;--op-surface-tint:#ebf3f7;--op-surface-soft:#f9f9f9;--op-ok-bg:#d1e7dd;--op-ok-line:#a3cfbb;--op-ok-ink:#0a3622;--op-bad-bg:#f8d7da;--op-bad-line:#f1aeb5;--op-bad-ink:#58151c;--op-warn-ink:#664d03;--op-radius:3px;--op-pill:50rem;--op-focus:0 0 0 .25rem rgba(26,103,163,.25);--op-header-bg:#162b48;--op-header-ink:#fff;--op-header-ink-soft:rgba(255,255,255,.72)}
.pqco-shell{min-height:100vh;padding:24px 16px 56px;background:var(--op-canvas);color:var(--op-ink);font-family:var(--op-font);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}.pqco-wrap{max-width:1280px;margin:0 auto}.pqco-top,.pqco-panel{box-sizing:border-box;padding:16px 20px;border:1px solid var(--op-line);border-radius:var(--op-radius);background:var(--op-surface);box-shadow:none}.pqco-top{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:16px}.pqco-title{margin:0;color:var(--op-ink);font-size:24px;font-weight:700;line-height:1.25;letter-spacing:0}.pqco-sub{margin:4px 0 0;color:var(--op-ink-soft);font-size:14px;font-weight:400}.pqco-panel h2{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:24px 0 14px;padding-bottom:10px;border-bottom:1px solid var(--op-line);color:var(--op-ink);font-family:var(--op-font);font-size:16px;font-weight:700;line-height:1.4}.pqco-panel h2:first-of-type{margin-top:0}.pqco-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqco-btn{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:0 14px;border:1px solid var(--op-primary);border-radius:var(--op-radius);background:var(--op-primary);color:#fff!important;text-decoration:none;font-family:var(--op-font);font-size:14px;font-weight:700;line-height:1.2;cursor:pointer;transition:background-color .15s ease,border-color .15s ease,color .15s ease}.pqco-btn:hover{background:var(--op-primary-hover);border-color:var(--op-primary-hover)}.pqco-btn:focus-visible{outline:0;box-shadow:var(--op-focus)}.pqco-btn--light{background:var(--op-surface);border-color:var(--op-line-strong);color:var(--op-ink)!important}.pqco-btn--light:hover{background:var(--op-surface-soft);border-color:var(--op-ink-faint);color:var(--op-primary-hover)!important}.pqco-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:16px;align-items:start}.pqco-field{display:grid;gap:4px;margin-bottom:14px}.pqco-field label{color:var(--op-ink-muted);font-size:13px;font-weight:700;letter-spacing:0;text-transform:none}.pqco-input,.pqco-select,.pqco-textarea{box-sizing:border-box;width:100%;min-width:0;min-height:32px;border:1px solid var(--op-line-strong);border-radius:var(--op-radius);padding:4px 10px;background:var(--op-surface);color:var(--op-ink);font-family:var(--op-font);font-size:14px;font-weight:400;line-height:1.5}.pqco-input::placeholder,.pqco-textarea::placeholder{color:var(--op-ink-faint)}.pqco-input:focus,.pqco-select:focus,.pqco-textarea:focus{outline:0;border-color:#8db3d1;box-shadow:var(--op-focus)}.pqco-input:disabled,.pqco-select:disabled{background:var(--op-surface-soft);color:var(--op-ink-soft)}.pqco-select{appearance:none;-webkit-appearance:none;padding-right:28px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23707070'%3E%3Cpath d='M8 11.2 3.2 6.1h9.6z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center;background-size:11px}.pqco-textarea{min-height:88px;padding:8px 10px}.pqco-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pqco-alert{padding:12px 16px;margin-bottom:16px;border:1px solid transparent;border-radius:var(--op-radius);font-size:14px;font-weight:400}.pqco-alert--ok{background:var(--op-ok-bg);border-color:var(--op-ok-line);color:var(--op-ok-ink)}.pqco-alert--bad{background:var(--op-bad-bg);border-color:var(--op-bad-line);color:var(--op-bad-ink)}.pqco-table{width:100%;border-collapse:separate;border-spacing:0;font-size:14px}.pqco-table thead th{padding:9px 12px;border-top:1px solid var(--op-line);border-bottom:1px solid var(--op-line);background:var(--op-surface-tint);color:var(--op-ink-muted);font-size:12px;font-weight:700;letter-spacing:.4px;text-align:left;text-transform:uppercase;vertical-align:middle;white-space:nowrap}.pqco-table td{padding:12px;border-bottom:1px solid var(--op-line);color:var(--op-ink);font-size:14px;font-weight:400;text-align:left;vertical-align:top}.pqco-table tbody tr:hover td{background:var(--op-surface-soft)}.pqco-name{display:block;color:var(--op-ink);font-size:14px;font-weight:700}.pqco-muted{display:block;margin-top:2px;color:var(--op-ink-soft);font-size:13px;font-weight:400;line-height:1.45}.pqco-pill{display:inline-flex;min-height:22px;align-items:center;margin:0 4px 4px 0;padding:0 10px;border:1px solid var(--op-primary-border);border-radius:var(--op-pill);background:var(--op-primary-subtle);color:var(--op-primary-emphasis);font-size:12px;font-weight:700;line-height:1}.pqco-empty{padding:20px;border:1px dashed var(--op-line-strong);border-radius:var(--op-radius);color:var(--op-ink-soft);font-size:14px;font-weight:400;line-height:1.6;background:var(--op-surface-soft)}.pqco-stack{display:grid;gap:16px}
.pqco-help{display:block;margin-top:4px;color:var(--op-ink-soft);font-size:12px;font-weight:400;line-height:1.45}.pqco-help--warn{color:var(--op-warn-ink)}.pqco-filter{display:grid;grid-template-columns:1fr 1fr 1fr auto auto;gap:10px;align-items:end;margin:0 0 16px;padding:12px;border:1px solid var(--op-line);border-radius:var(--op-radius);background:var(--op-surface-soft)}.pqco-filter .pqco-field{margin-bottom:0}.pqco-check{width:16px;height:16px;accent-color:var(--op-primary)}.pqco-inline-form{display:inline-flex;margin:0 4px 4px 0}
@media(max-width:1100px){.pqco-grid{grid-template-columns:1fr}}
@media(max-width:980px){.pqco-top,.pqco-grid,.pqco-row{display:block}.pqco-filter{grid-template-columns:1fr}.pqco-actions{justify-content:flex-start;margin-top:12px}.pqco-table,.pqco-table tbody,.pqco-table tr,.pqco-table td{display:block;box-sizing:border-box;width:100%}.pqco-table thead{display:none}.pqco-table tr{border-bottom:1px solid var(--op-line)}.pqco-table td{border:0}.pqco-table td::before{content:attr(data-label);display:block;margin-bottom:4px;color:var(--op-ink-soft);font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase}}
<?php echo pqh_workspace_header_css(); ?>
/* The shared workspace header ships a brown gradient, 950-weight type and a
   deep shadow. This view wears OpenProject's instead: flat white, one hairline
   rule, 24px/700 title. Last in the sheet and one level more specific so it
   beats the !important rules above without touching the shared library. */
body.pqco-admin-page{background:var(--op-canvas)!important;font-family:var(--op-font)}
.pqco-shell .pqh-workspace-top{padding:16px 20px!important;border:1px solid var(--op-header-bg)!important;border-radius:var(--op-radius)!important;background:var(--op-header-bg)!important;color:var(--op-header-ink)!important;box-shadow:none!important}
.pqco-shell .pqh-workspace-title{display:block!important;margin:0!important;color:var(--op-header-ink)!important;font-size:24px!important;font-weight:700!important;line-height:1.25!important;letter-spacing:0!important;text-shadow:none!important}
.pqco-shell .pqh-workspace-sub{margin:4px 0 0!important;color:var(--op-header-ink-soft)!important;font-size:14px!important;font-weight:400!important;opacity:1}
.pqco-shell .pqh-workspace-actions a,.pqco-shell .pqh-workspace-actions button{min-height:32px!important;padding:0 14px!important;border:1px solid var(--op-line-strong)!important;border-radius:var(--op-radius)!important;background:var(--op-surface)!important;color:var(--op-ink)!important;font-family:var(--op-font)!important;font-size:14px!important;font-weight:700!important;box-shadow:none!important}
.pqco-shell .pqh-workspace-actions a:hover,.pqco-shell .pqh-workspace-actions button:hover{background:var(--op-surface-soft)!important;border-color:var(--op-ink-faint)!important;color:var(--op-primary-hover)!important}
.pqco-shell .pqh-workspace-actions .pqco-btn:not(.pqco-btn--light),.pqco-shell .pqh-workspace-actions button.pqco-btn:not(.pqco-btn--light){background:var(--op-primary)!important;border-color:var(--op-primary)!important;color:#fff!important}
.pqco-shell .pqh-workspace-actions .pqco-btn:not(.pqco-btn--light):hover,.pqco-shell .pqh-workspace-actions button.pqco-btn:not(.pqco-btn--light):hover{background:var(--op-primary-hover)!important;border-color:var(--op-primary-hover)!important;color:#fff!important}
/* The header bar is #162b48, so its controls invert to ghosts on dark. SCOPED
   TO .pqco-top on purpose: .pqh-workspace-actions is also worn by the in-panel
   Save offering and Approve/Reject rows, and a white-on-transparent ghost would
   be invisible on a white panel. Those keep the light treatment set above. */
.pqco-shell .pqco-top .pqh-workspace-actions a,.pqco-shell .pqco-top .pqh-workspace-actions button{background:rgba(255,255,255,.10)!important;border-color:rgba(255,255,255,.30)!important;color:var(--op-header-ink)!important}
.pqco-shell .pqco-top .pqh-workspace-actions a:hover,.pqco-shell .pqco-top .pqh-workspace-actions button:hover{background:rgba(255,255,255,.20)!important;border-color:rgba(255,255,255,.50)!important;color:var(--op-header-ink)!important}
/* Logout stays distinct from its two neighbours as it always has -- a brighter
   ghost, not a filled button, so signing out is not the loudest thing in the
   header. Solid white only on hover. */
.pqco-shell .pqco-top .pqh-workspace-actions a.pqh-workspace-logout{background:rgba(255,255,255,.18)!important;border-color:rgba(255,255,255,.60)!important;color:var(--op-header-ink)!important}
.pqco-shell .pqco-top .pqh-workspace-actions a.pqh-workspace-logout:hover{background:var(--op-header-ink)!important;border-color:var(--op-header-ink)!important;color:var(--op-header-bg)!important}
.pqco-shell .pqh-workspace-actions select{min-height:32px!important;border:1px solid var(--op-line-strong)!important;border-radius:var(--op-radius)!important;font-family:var(--op-font)!important;font-size:14px!important;font-weight:400!important}
/* Controls sitting inside a table row take OpenProject's small size. The
   six-column request table shares the right-hand column, so a full-size button
   pair in Review pushes the table past its panel. */
.pqco-shell .pqco-table .pqco-btn{min-height:28px!important;padding:0 10px!important;font-size:13px!important}
.pqco-shell .pqco-table .pqco-input,.pqco-shell .pqco-table .pqco-select{min-height:28px;font-size:13px}
.pqco-shell .pqco-table .pqco-field{margin-bottom:8px}
</style>
<main class="pqco-shell">
  <div class="pqco-wrap">
    <section class="pqco-top pqh-workspace-top">
      <div>
        <h1 class="pqco-title pqh-workspace-title"><?php echo s($workspace->name); ?> Course Offerings</h1>
        <p class="pqco-sub pqh-workspace-sub">Publish institution course seats, dates, syllabus, prerequisites, and approve enrollment requests.</p>
      </div>
      <nav class="pqco-actions pqh-workspace-actions">
        <a class="pqco-btn pqco-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_catalog_browse.php', $urlparams))->out(false); ?>">Browse view</a>
        <a class="pqco-btn pqco-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a>
        <a class="pqco-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqco-alert pqco-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqco-alert pqco-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if (!$ready): ?>
      <section class="pqco-panel"><div class="pqco-empty">Course offering tables are not ready. Run the local_prequran upgrade first.</div></section>
    <?php else: ?>
      <section class="pqco-grid">
        <form class="pqco-panel" id="pqco-offering-form" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="save_offering">
          <input type="hidden" name="offeringid" value="<?php echo s($form['offeringid']); ?>">
          <h2><?php echo (int)$form['offeringid'] > 0 ? 'Edit Offering' : 'Create Offering'; ?></h2>
          <div class="pqco-row">
            <?php
            // Keep whatever track the offering being edited already uses, even
            // when this institution type no longer lists the catalog -- editing
            // an old offering must not silently switch its track.
            $pqcotrackoptions = $catalogoptions;
            if ($form['course_key'] !== '__custom__'
                    && isset($catalog[$form['course_key']])
                    && !isset($pqcotrackoptions[$form['course_key']])) {
                $pqcotrackoptions[$form['course_key']] = $catalog[$form['course_key']];
            }
            ?>
            <div class="pqco-field"><label>Course track</label><select class="pqco-select" name="course_key">
              <?php foreach ($pqcotrackoptions as $key => $course): ?><option value="<?php echo s($key); ?>"<?php echo $form['course_key'] === $key ? ' selected' : ''; ?>><?php echo s((string)$course['title']); ?></option><?php endforeach; ?>
              <option value="__custom__"<?php echo $form['course_key'] === '__custom__' ? ' selected' : ''; ?>>Custom / other subject</option>
            </select></div>
            <div class="pqco-field"><label>Course action</label><select class="pqco-select" name="course_link_mode">
              <option value="existing"<?php echo $form['course_link_mode'] === 'existing' ? ' selected' : ''; ?>>Use existing course</option>
              <option value="create_new"<?php echo $form['course_link_mode'] === 'create_new' ? ' selected' : ''; ?>>Create new course</option>
            </select>
              <span class="pqco-help">Create new will place the course in this institution's category and enable manual enrollment.</span>
            </div>
          </div>
          <div class="pqco-row">
            <div class="pqco-field"><label>Custom course title</label><input class="pqco-input" name="custom_course_title" value="<?php echo s($form['custom_course_title']); ?>" placeholder="e.g. Grade 3 English">
              <span class="pqco-help">Only used when Course track is set to Custom / other subject.</span>
            </div>
          </div>
          <div class="pqco-row">
            <div class="pqco-field"><label>Linked course</label><select class="pqco-select" name="moodlecourseid">
              <option value="0">Choose course</option>
              <?php foreach ($moodlecourses as $courseid => $label): ?><option value="<?php echo (int)$courseid; ?>"<?php echo (int)$form['moodlecourseid'] === (int)$courseid ? ' selected' : ''; ?>><?php echo s($label); ?><?php echo isset($approvedsyllabi[(int)$courseid]) ? '' : ' -- no approved syllabus'; ?></option><?php endforeach; ?>
            </select>
              <?php
                $selectedcourseid = (int)$form['moodlecourseid'];
                $selectedneedssyllabus = $selectedcourseid > 0 && !isset($approvedsyllabi[$selectedcourseid]);
              ?>
              <?php if (!$moodlecourses): ?>
                <span class="pqco-help pqco-help--warn">No courses are available to link. Create the course first, then return here.</span>
              <?php else: ?>
                <?php if ($selectedneedssyllabus): ?>
                  <span class="pqco-help pqco-help--warn">This course has no approved syllabus yet. You can still create the offering &mdash; write and approve the syllabus before families enrol.</span>
                <?php endif; ?>
                <span class="pqco-help">Required. This is the course students will be enrolled into after approval.</span>
              <?php endif; ?>
            </div>
            <div class="pqco-field"><label>Auto-created category</label><input class="pqco-input" value="<?php echo s(trim((string)($consumercontext->consumername ?? '')) !== '' ? (string)$consumercontext->consumername : (string)$workspace->name); ?>" disabled>
              <span class="pqco-help">New courses are grouped under the institution category.</span>
            </div>
          </div>
          <div class="pqco-field"><label>Title</label><input class="pqco-input" name="title" value="<?php echo s($form['title']); ?>" placeholder="e.g. Grade 3 English - Term 1"></div>
          <div class="pqco-field"><label>Summary</label><textarea class="pqco-textarea" name="summary"><?php echo s($form['summary']); ?></textarea></div>
          <div class="pqco-field"><label>Syllabus</label><textarea class="pqco-textarea" name="syllabus"><?php echo s($form['syllabus']); ?></textarea></div>
          <div class="pqco-field"><label>Prerequisites</label><textarea class="pqco-textarea" name="prerequisites"><?php echo s($form['prerequisites']); ?></textarea></div>
          <div class="pqco-row">
            <div class="pqco-field"><label>Start date</label><input class="pqco-input" type="date" name="startdate" value="<?php echo s($form['startdate']); ?>"></div>
            <div class="pqco-field"><label>End date</label><input class="pqco-input" type="date" name="enddate" value="<?php echo s($form['enddate']); ?>"></div>
          </div>
          <div class="pqco-row">
            <div class="pqco-field"><label>Seats</label><input class="pqco-input" type="number" min="0" name="capacity" value="<?php echo s($form['capacity']); ?>"></div>
            <div class="pqco-field"><label>Live sessions per week</label><input class="pqco-input" type="number" min="0" max="7" name="sessions_per_week" value="<?php echo s($form['sessions_per_week']); ?>">
              <span class="pqco-help">How many live classes each week. Availability matching uses this to check a cohort and teacher can actually meet that often. 0 = no live-session requirement.</span>
            </div>
            <div class="pqco-field"><label>Session length (minutes)</label><input class="pqco-input" type="number" min="0" max="480" step="5" name="session_minutes" value="<?php echo s($form['session_minutes']); ?>">
              <span class="pqco-help">Length of each live session, e.g. 60.</span>
            </div>
            <div class="pqco-field"><label>Status</label><select class="pqco-select" name="status"><?php foreach (pqco_status_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $form['status'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          </div>
          <h2>Pricing</h2>
          <div class="pqco-row">
            <div class="pqco-field"><label>Tuition amount</label><input class="pqco-input" name="tuition_amount" value="<?php echo s($form['tuition_amount']); ?>" placeholder="0.00"></div>
            <div class="pqco-field"><label>Currency</label><input class="pqco-input" maxlength="3" name="pricing_currency" value="<?php echo s($form['pricing_currency']); ?>"></div>
          </div>
          <div class="pqco-row">
            <div class="pqco-field"><label>Registration fee</label><input class="pqco-input" name="registration_fee" value="<?php echo s($form['registration_fee']); ?>" placeholder="0.00"></div>
            <div class="pqco-field"><label>Materials fee</label><input class="pqco-input" name="materials_fee" value="<?php echo s($form['materials_fee']); ?>" placeholder="0.00"></div>
          </div>
          <div class="pqco-row">
            <div class="pqco-field"><label>Tax behavior</label><select class="pqco-select" name="tax_behavior">
              <?php foreach (['not_configured' => 'Not configured', 'included' => 'Included in price', 'added_later' => 'Added later', 'exempt' => 'Exempt'] as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $form['tax_behavior'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?>
            </select></div>
            <div class="pqco-field"><label>Payment timing</label><select class="pqco-select" name="payment_required_timing">
              <?php foreach (array_merge(['workspace_policy'], pqfin_policy_allowed_values()['payment_required_timing']) as $value): ?><option value="<?php echo s($value); ?>"<?php echo $form['payment_required_timing'] === $value ? ' selected' : ''; ?>><?php echo s(ucwords(str_replace('_', ' ', $value))); ?></option><?php endforeach; ?>
            </select></div>
          </div>
          <div class="pqco-row">
            <div class="pqco-field"><label>Refund policy label</label><input class="pqco-input" name="refund_policy_label" value="<?php echo s($form['refund_policy_label']); ?>" placeholder="Standard tuition refund policy"></div>
            <div class="pqco-field"><label>Eligibility</label>
              <label style="display:flex;gap:8px;align-items:center;text-transform:none"><input type="checkbox" name="installment_eligible" value="1" <?php echo $form['installment_eligible'] === '1' ? 'checked' : ''; ?>> Installments allowed</label>
              <label style="display:flex;gap:8px;align-items:center;text-transform:none"><input type="checkbox" name="scholarship_eligible" value="1" <?php echo $form['scholarship_eligible'] === '1' ? 'checked' : ''; ?>> Scholarship eligible</label>
            </div>
          </div>
          <div class="pqco-field"><label>Visibility</label><select class="pqco-select" name="visibility"><?php foreach (pqco_visibility_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $form['visibility'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqco-actions pqh-workspace-actions">
            <button class="pqco-btn" type="submit">Save offering</button>
            <a class="pqco-btn pqco-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams))->out(false); ?>">New blank form</a>
          </div>
        </form>

        <div class="pqco-stack">
          <section class="pqco-panel">
            <h2>Offerings</h2>
            <?php if (!$offerings): ?><div class="pqco-empty">No course offerings yet.</div><?php else: ?>
              <table class="pqco-table"><thead><tr><th>Offering</th><th>Dates</th><th>Seats</th><th>Pricing</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                <?php foreach ($offerings as $offering): ?>
                  <?php
                    $open = pqco_open_seats($offering, $counts);
                    $availability = pqco_offering_availability_label($offering, $open);
                    $pricing = pqfin_offering_pricing_summary($offering);
                  ?>
                  <tr>
                    <td data-label="Offering"><span class="pqco-name"><?php echo s($offering->title); ?></span><span class="pqco-muted"><?php echo s($catalog[(string)$offering->course_key]['title'] ?? (string)$offering->course_key); ?> / Course #<?php echo (int)$offering->moodlecourseid; ?></span></td>
                    <td data-label="Dates"><?php echo (int)$offering->startdate > 0 ? s(userdate((int)$offering->startdate, get_string('strftimedate'))) : 'Not set'; ?><?php echo (int)$offering->enddate > 0 ? '<br>' . s(userdate((int)$offering->enddate, get_string('strftimedate'))) : ''; ?></td>
                    <td data-label="Seats"><span class="pqco-pill"><?php echo (int)($counts[(int)$offering->id] ?? 0); ?> approved</span><span class="pqco-pill"><?php echo (int)$offering->capacity <= 0 ? 'Unlimited' : ((int)$open . ' open'); ?></span></td>
                    <td data-label="Pricing"><span class="pqco-name"><?php echo s($pricing['currency'] . ' ' . $pricing['total']); ?></span><span class="pqco-muted">Tuition <?php echo s((string)$pricing['tuition_amount']); ?> / Fees <?php echo s(pqfin_cents_to_money(pqfin_money_to_cents((string)$pricing['registration_fee']) + pqfin_money_to_cents((string)$pricing['materials_fee']))); ?></span><?php if ($pricing['installment_eligible']): ?><span class="pqco-pill">Installments</span><?php endif; ?><?php if ($pricing['scholarship_eligible']): ?><span class="pqco-pill">Scholarship</span><?php endif; ?></td>
                    <td data-label="Status"><span class="pqco-pill"><?php echo s((string)$offering->status); ?></span><span class="pqco-pill"><?php echo s((string)$offering->visibility); ?></span><span class="pqco-pill"><?php echo s($availability); ?></span></td>
                    <td data-label="Actions">
                      <a class="pqco-btn pqco-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams + ['editid' => (int)$offering->id]))->out(false); ?>">Edit</a>
                      <form class="pqco-inline-form" method="post">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="clone_offering">
                        <input type="hidden" name="offeringid" value="<?php echo (int)$offering->id; ?>">
                        <button class="pqco-btn pqco-btn--light" type="submit">Clone</button>
                      </form>
                      <?php if ((string)$offering->status !== 'archived'): ?>
                        <form class="pqco-inline-form" method="post">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="action" value="archive_offering">
                          <input type="hidden" name="offeringid" value="<?php echo (int)$offering->id; ?>">
                          <button class="pqco-btn pqco-btn--light" type="submit">Archive</button>
                        </form>
                      <?php endif; ?>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody></table>
            <?php endif; ?>
          </section>

          <section class="pqco-panel">
            <h2>Enrollment Requests <span class="pqco-pill"><?php echo (int)$pendingrequestcount; ?> pending</span><span class="pqco-pill"><?php echo (int)$droprequestcount; ?> drop requests</span></h2>
            <form class="pqco-filter" method="get" aria-label="Enrollment request filters">
              <?php foreach ($urlparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
              <div class="pqco-field"><label>Status</label><select class="pqco-select" name="request_status">
                <option value="">All statuses</option>
                <?php foreach (['pending', 'approved', 'enrolled', 'drop_requested', 'dropped', 'rejected', 'cancelled'] as $status): ?><option value="<?php echo s($status); ?>"<?php echo (string)$requestfilters['request_status'] === $status ? ' selected' : ''; ?>><?php echo s(pqco_request_status_label($status)); ?></option><?php endforeach; ?>
              </select></div>
              <div class="pqco-field"><label>Offering</label><select class="pqco-select" name="request_offeringid">
                <option value="0">All offerings</option>
                <?php foreach ($offerings as $filteroffering): ?><option value="<?php echo (int)$filteroffering->id; ?>"<?php echo (int)$requestfilters['request_offeringid'] === (int)$filteroffering->id ? ' selected' : ''; ?>><?php echo s((string)$filteroffering->title); ?></option><?php endforeach; ?>
              </select></div>
              <div class="pqco-field"><label>Student</label><input class="pqco-input" name="request_student" value="<?php echo s((string)$requestfilters['request_student']); ?>" placeholder="Name, email, Account No."></div>
              <button class="pqco-btn" type="submit">Filter</button>
              <a class="pqco-btn pqco-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams))->out(false); ?>">Clear</a>
            </form>
            <div class="pqco-actions pqh-workspace-actions" style="justify-content:flex-start;margin-bottom:10px">
              <form id="pqco-bulk-form" class="pqco-inline-form" method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="bulk_review_requests">
                <input class="pqco-input" name="admin_notes" placeholder="Bulk admin note" style="max-width:220px">
                <button class="pqco-btn" name="decision" value="approved" type="submit">Bulk approve</button>
                <button class="pqco-btn pqco-btn--light" name="decision" value="rejected" type="submit">Bulk reject</button>
              </form>
              <a class="pqco-btn pqco-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', pqcoa_request_filter_url_params($urlparams, $requestfilters, ['export' => 'requests_csv'])))->out(false); ?>">Export CSV</a>
            </div>
            <?php if (!$requests): ?><div class="pqco-empty">No enrollment requests yet.</div><?php else: ?>
              <table class="pqco-table"><thead><tr><th>Select</th><th>Request</th><th>Status</th><th>Finance</th><th>Notes</th><th>Review</th></tr></thead><tbody>
                <?php foreach ($requests as $request): ?>
                  <?php
                    $finance = $requestfinancesummaries[(int)$request->id] ?? [];
                    $pricing = pqfin_offering_pricing_summary($request);
                    $financewarnings = pqcoa_finance_warning_labels($request, $finance, $pricing);
                  ?>
                  <tr>
                    <td data-label="Select"><?php if ((string)$request->status === 'pending'): ?><input class="pqco-check" form="pqco-bulk-form" type="checkbox" name="requestids[]" value="<?php echo (int)$request->id; ?>"><?php else: ?><span class="pqco-muted">-</span><?php endif; ?></td>
                    <td data-label="Request"><span class="pqco-name"><?php echo s(fullname($request)); ?></span><span class="pqco-muted"><?php echo s($request->offering_title); ?><br><?php echo s(pqh_account_no_label($request)); ?> / <?php echo s($request->email); ?></span></td>
                    <td data-label="Status">
                      <span class="pqco-pill"><?php echo s(pqco_request_status_label((string)$request->status)); ?></span>
                      <?php if ((int)($request->moodleenrolledat ?? 0) > 0): ?>
                        <span class="pqco-muted">Enrolled <?php echo s(userdate((int)$request->moodleenrolledat, get_string('strftimedatetimeshort'))); ?></span>
                      <?php elseif ((string)$request->status === 'approved'): ?>
                        <span class="pqco-muted">Awaiting enrollment sync</span>
                      <?php endif; ?>
                    </td>
                    <td data-label="Finance">
                      <span class="pqco-pill"><?php echo s(pqcoa_finance_status_label($finance)); ?></span>
                      <span class="pqco-muted"><?php echo s($pricing['currency'] . ' ' . $pricing['total']); ?> expected<?php echo $finance ? ' / balance ' . s((string)$finance['balancedue']) : ''; ?></span>
                      <?php if ($finance && (int)$finance['invoiceid'] > 0): ?>
                        <a class="pqco-btn pqco-btn--light" style="margin-top:6px" href="<?php echo (new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => (int)$finance['invoiceid']]))->out(false); ?>">Open invoice</a>
                      <?php endif; ?>
                      <?php foreach ($financewarnings as $warning): ?><span class="pqco-pill"><?php echo s($warning); ?></span><?php endforeach; ?>
                      <?php if (!$finance && pqfin_invoice_schema_ready()): ?>
                        <form method="post" style="margin-top:8px">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="action" value="create_invoice_from_request">
                          <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
                          <button class="pqco-btn pqco-btn--light" type="submit">Create invoice</button>
                        </form>
                      <?php endif; ?>
                    </td>
                    <td data-label="Notes"><?php echo s((string)$request->request_notes); ?></td>
                    <td data-label="Review">
                      <?php if ((string)$request->status === 'pending'): ?>
                        <form method="post">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="action" value="review_request">
                          <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
                          <div class="pqco-field"><label>Admin note</label><input class="pqco-input" name="admin_notes" placeholder="Optional note"></div>
                          <div class="pqco-actions pqh-workspace-actions">
                            <button class="pqco-btn" name="decision" value="approved" type="submit">Approve</button>
                            <button class="pqco-btn pqco-btn--light" name="decision" value="rejected" type="submit">Reject</button>
                          </div>
                        </form>
                      <?php elseif ((string)$request->status === 'approved'): ?>
                        <span class="pqco-muted"><?php echo s((string)$request->admin_notes); ?></span>
                        <form method="post" style="margin-top:8px">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="action" value="retry_moodle_enrollment">
                          <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
                          <button class="pqco-btn pqco-btn--light" type="submit">Retry sync</button>
                        </form>
                        <form method="post" style="margin-top:8px">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="action" value="drop_enrollment">
                          <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
                          <div class="pqco-field"><label>Drop note</label><input class="pqco-input" name="admin_notes" placeholder="Reason or admin note"></div>
                          <button class="pqco-btn pqco-btn--light" type="submit">Drop enrollment</button>
                        </form>
                      <?php elseif ((string)$request->status === 'enrolled'): ?>
                        <span class="pqco-muted"><?php echo trim((string)$request->admin_notes) !== '' ? s((string)$request->admin_notes) : 'Enrollment complete'; ?></span>
                        <a class="pqco-btn pqco-btn--light" style="margin-top:8px" href="<?php echo (new moodle_url('/course/view.php', ['id' => (int)$request->moodlecourseid]))->out(false); ?>">Open course</a>
                        <form method="post" style="margin-top:8px">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="action" value="drop_enrollment">
                          <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
                          <div class="pqco-field"><label>Drop note</label><input class="pqco-input" name="admin_notes" placeholder="Reason or admin note"></div>
                          <button class="pqco-btn pqco-btn--light" type="submit">Drop enrollment</button>
                        </form>
                      <?php elseif ((string)$request->status === 'drop_requested'): ?>
                        <span class="pqco-muted"><?php echo trim((string)$request->request_notes) !== '' ? s((string)$request->request_notes) : 'Student or parent requested to drop this course.'; ?></span>
                        <form method="post" style="margin-top:8px">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="action" value="review_drop">
                          <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
                          <div class="pqco-field"><label>Admin note</label><input class="pqco-input" name="admin_notes" placeholder="Optional decision note"></div>
                          <div class="pqco-actions pqh-workspace-actions">
                            <button class="pqco-btn" name="decision" value="approved" type="submit">Approve drop</button>
                            <button class="pqco-btn pqco-btn--light" name="decision" value="rejected" type="submit">Reject drop</button>
                          </div>
                        </form>
                      <?php else: ?>
                        <span class="pqco-muted"><?php echo s((string)$request->admin_notes); ?></span>
                      <?php endif; ?>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody></table>
            <?php endif; ?>
          </section>

          <section class="pqco-panel">
            <h2>Course Audit Log</h2>
            <?php if (!$courseaudits): ?><div class="pqco-empty">No course audit activity yet.</div><?php else: ?>
              <table class="pqco-table"><thead><tr><th>Activity</th><th>Actor</th><th>Target</th><th>Details</th><th>Time</th></tr></thead><tbody>
                <?php foreach ($courseaudits as $audit): ?>
                  <tr>
                    <td data-label="Activity"><span class="pqco-name"><?php echo s(str_replace('_', ' ', (string)$audit->action)); ?></span></td>
                    <td data-label="Actor"><span class="pqco-name"><?php echo (int)$audit->actorid > 0 ? s(fullname($audit)) : 'System'; ?></span><span class="pqco-muted"><?php echo (int)$audit->actorid > 0 ? s(pqh_account_no_label($audit)) : ''; ?></span></td>
                    <td data-label="Target"><span class="pqco-pill"><?php echo s((string)$audit->targettype); ?> #<?php echo (int)$audit->targetid; ?></span><?php if ((int)$audit->offeringid > 0): ?><span class="pqco-pill">Offering #<?php echo (int)$audit->offeringid; ?></span><?php endif; ?><?php if ((int)$audit->requestid > 0): ?><span class="pqco-pill">Request #<?php echo (int)$audit->requestid; ?></span><?php endif; ?></td>
                    <td data-label="Details"><?php echo s(pqcoa_audit_details_label((string)$audit->details)); ?></td>
                    <td data-label="Time"><?php echo s(userdate((int)$audit->timecreated, get_string('strftimedatetimeshort'))); ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody></table>
            <?php endif; ?>
          </section>
        </div>
      </section>
    <?php endif; ?>

    <?php if ($ready): ?>
    <section class="pqco-panel">
      <h2>Course Inventory</h2>
      <p class="pqco-muted" style="margin:0 0 12px">Every course in this institution's category, and whether it already has an offering. Filter to <strong>Not offered</strong> to find courses still waiting to be published for enrollment.</p>
      <?php if (!$courseinventory): ?>
        <div class="pqco-empty">
          No courses matched this institution. Courses are matched by category &mdash; the auto-created
          <strong><?php echo s(trim((string)($consumercontext->consumername ?? '')) !== '' ? (string)$consumercontext->consumername : (string)$workspace->name); ?></strong>
          category (and any sub-categories), plus any course an existing offering already links to.
          If courses were loaded straight into Moodle under a differently named category, move them
          under this institution's category and they will appear here.
        </div>
      <?php else: ?>
        <?php
          $pqcoofferedcount = count(array_filter($courseinventory, static function(array $row): bool {
              return $row['isoffered'];
          }));
          $pqcostatusoptions = [];
          foreach ($courseinventory as $inventoryopt) {
              if ((string)$inventoryopt['status'] === '') {
                  continue;
              }
              $statusopt = (string)$inventoryopt['status'];
              $pqcostatusoptions[$statusopt] = pqco_status_options()[$statusopt] ?? ucwords(str_replace('_', ' ', $statusopt));
          }
          asort($pqcostatusoptions);
        ?>
        <div class="pqco-filter">
          <div class="pqco-field">
            <label for="pqco-inv-filter">Search courses</label>
            <input class="pqco-input" id="pqco-inv-filter" type="search" placeholder="Course name, short name, ID number, or offering">
          </div>
          <div class="pqco-field">
            <label for="pqco-inv-offered-filter">Offering</label>
            <select class="pqco-select" id="pqco-inv-offered-filter">
              <option value="">All courses</option>
              <option value="yes">Offered</option>
              <option value="no">Not offered</option>
            </select>
          </div>
          <div class="pqco-field">
            <label for="pqco-inv-status-filter">Offering status</label>
            <select class="pqco-select" id="pqco-inv-status-filter">
              <option value="">All statuses</option>
              <?php foreach ($pqcostatusoptions as $statusvalue => $statuslabel): ?>
                <option value="<?php echo s(strtolower((string)$statusvalue)); ?>"><?php echo s($statuslabel); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <span class="pqco-muted"><?php echo (int)$pqcoofferedcount; ?> offered / <?php echo count($courseinventory); ?> course<?php echo count($courseinventory) === 1 ? '' : 's'; ?></span>
        </div>
        <table class="pqco-table" id="pqco-inv-table">
          <thead><tr><th>Course</th><th>Offering</th><th>Status</th><th>Visibility</th><th>Seats</th><th>Enrolled</th><th>Actions</th></tr></thead>
          <tbody>
            <?php foreach ($courseinventory as $inventory): ?>
              <?php
                $invstatuslabel = (string)$inventory['status'] !== ''
                    ? (pqco_status_options()[(string)$inventory['status']] ?? ucwords(str_replace('_', ' ', (string)$inventory['status'])))
                    : '';
                $invvisibilitylabel = (string)$inventory['visibility'] !== ''
                    ? (pqco_visibility_options()[(string)$inventory['visibility']] ?? ucwords(str_replace('_', ' ', (string)$inventory['visibility'])))
                    : '';
                $invstart = (int)$inventory['startdate'] > 0 ? userdate((int)$inventory['startdate'], get_string('strftimedate')) : '';
                $invseats = $inventory['isoffered']
                    ? ($inventory['unlimited'] ? 'Unlimited' : ((int)$inventory['openseats'] . ' of ' . (int)$inventory['capacity'] . ' open'))
                    : '';
                $invsummary = $inventory['fullname']
                    . ' / ' . ($inventory['shortname'] !== '' ? $inventory['shortname'] : '--')
                    . ' / #' . (int)$inventory['courseid'];
                $invhaystack = strtolower(trim(
                    $inventory['fullname'] . ' ' . $inventory['shortname'] . ' ' . $inventory['idnumber'] . ' '
                    . $inventory['offeringtitle'] . ' ' . $inventory['coursekey'] . ' '
                    . $invstatuslabel . ' ' . $invvisibilitylabel . ' ' . $inventory['category'] . ' '
                    . ($inventory['isoffered'] ? 'offered' : 'not offered') . ' #' . (int)$inventory['courseid'] . ' '
                    . (isset($approvedsyllabi[(int)$inventory['courseid']]) ? 'syllabus approved' : 'no approved syllabus')
                ));
              ?>
              <tr data-filter="<?php echo s($invhaystack); ?>" data-offered="<?php echo $inventory['isoffered'] ? 'yes' : 'no'; ?>" data-status="<?php echo s(strtolower((string)$inventory['status'])); ?>">
                <td data-label="Course"><span class="pqco-name"><?php echo s($invsummary); ?></span><span class="pqco-muted"><?php echo s($inventory['category'] !== '' ? $inventory['category'] : 'Uncategorised'); ?><?php echo $inventory['visible'] ? '' : ' / hidden'; ?><?php echo $inventory['idnumber'] !== '' ? ' / ' . s($inventory['idnumber']) : ''; ?><?php echo isset($approvedsyllabi[(int)$inventory['courseid']]) ? ' / syllabus approved' : ' / no approved syllabus'; ?></span></td>
                <td data-label="Offering">
                  <?php if ($inventory['isoffered']): ?>
                    <span class="pqco-name"><?php echo s($inventory['offeringtitle'] !== '' ? $inventory['offeringtitle'] : 'Offering #' . (int)$inventory['offeringid']); ?></span>
                    <span class="pqco-muted"><?php echo s($inventory['coursekey'] !== '' ? $inventory['coursekey'] : '--'); ?><?php echo $invstart !== '' ? ' / starts ' . s($invstart) : ''; ?></span>
                  <?php else: ?>
                    <span class="pqco-pill">Not offered</span>
                  <?php endif; ?>
                </td>
                <td data-label="Status"><?php echo $invstatuslabel !== '' ? '<span class="pqco-pill">' . s($invstatuslabel) . '</span>' : '<span class="pqco-muted">--</span>'; ?></td>
                <td data-label="Visibility"><?php echo $invvisibilitylabel !== '' ? '<span class="pqco-pill">' . s($invvisibilitylabel) . '</span>' : '<span class="pqco-muted">--</span>'; ?></td>
                <td data-label="Seats"><?php echo $invseats !== '' ? s($invseats) : '<span class="pqco-muted">--</span>'; ?></td>
                <td data-label="Enrolled"><?php echo $inventory['isoffered'] ? (int)$inventory['enrolled'] : '<span class="pqco-muted">--</span>'; ?></td>
                <td data-label="Actions">
                  <div class="pqco-actions">
                    <a class="pqco-btn pqco-btn--light" href="<?php echo (new moodle_url('/course/view.php', ['id' => (int)$inventory['courseid']]))->out(false); ?>">Open course</a>
                    <?php if (!$inventory['isoffered']): ?>
                      <a class="pqco-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams + ['moodlecourseid' => (int)$inventory['courseid']]))->out(false); ?>#pqco-offering-form">Create offering</a>
                    <?php endif; ?>
                  </div>
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
<script>
(function() {
  var filter = document.getElementById('pqco-inv-filter');
  var offeredSelect = document.getElementById('pqco-inv-offered-filter');
  var statusSelect = document.getElementById('pqco-inv-status-filter');
  var table = document.getElementById('pqco-inv-table');
  if (!filter || !table) {
    return;
  }
  function apply() {
    var needle = filter.value.toLowerCase().trim();
    var offered = offeredSelect ? offeredSelect.value : '';
    var status = statusSelect ? statusSelect.value : '';
    table.querySelectorAll('tbody tr').forEach(function(row) {
      var haystack = row.getAttribute('data-filter') || '';
      var matchesText = needle === '' || haystack.indexOf(needle) !== -1;
      var matchesOffered = offered === '' || row.getAttribute('data-offered') === offered;
      var matchesStatus = status === '' || row.getAttribute('data-status') === status;
      row.style.display = (matchesText && matchesOffered && matchesStatus) ? '' : 'none';
    });
  }
  filter.addEventListener('input', apply);
  if (offeredSelect) {
    offeredSelect.addEventListener('change', apply);
  }
  if (statusSelect) {
    statusSelect.addEventListener('change', apply);
  }
}());
</script>
<?php
echo $OUTPUT->footer();
