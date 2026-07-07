<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/finance_lib.php');

function pqss_schema_ready(): bool {
    return pqfin_assistance_schema_ready()
        && pqh_table_exists_safe('local_prequran_scholar_app')
        && pqh_table_exists_safe('local_prequran_donor_pledge');
}

function pqss_generate_application_number(int $applicationid, int $workspaceid): string {
    return 'SCA-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$applicationid, 6, '0', STR_PAD_LEFT);
}

function pqss_generate_pledge_number(int $pledgeid, int $workspaceid): string {
    return 'DNR-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$pledgeid, 6, '0', STR_PAD_LEFT);
}

function pqss_workspace_students(int $workspaceid): array {
    global $DB;

    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.email, u.idnumber
           FROM {user} u
           JOIN {local_prequran_workspace_member} wm ON wm.userid = u.id
          WHERE wm.workspaceid = :workspaceid
            AND wm.workspace_role = :role
            AND wm.status = :status
            AND u.deleted = 0
       ORDER BY u.firstname ASC, u.lastname ASC, u.id ASC",
        ['workspaceid' => $workspaceid, 'role' => 'student', 'status' => 'active'],
        0,
        500
    ));
}

function pqss_user_student_ids(int $workspaceid, int $userid): array {
    global $DB;

    if ($workspaceid <= 0 || $userid <= 0) {
        return [];
    }
    if (pqh_user_can_manage_workspace($userid, $workspaceid) || pqh_user_has_workspace_capability($userid, $workspaceid, 'finance.manage')) {
        return array_map(static fn($student): int => (int)$student->id, pqss_workspace_students($workspaceid));
    }
    $ids = [];
    if (pqh_user_workspace_role($userid, $workspaceid) === 'student') {
        $ids[$userid] = $userid;
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (!pqh_table_exists_safe($table) || !pqh_table_has_field_safe($table, 'guardianid')) {
            continue;
        }
        $params = ['guardianid' => $userid];
        $where = 'guardianid = :guardianid';
        if (pqh_table_has_field_safe($table, 'workspaceid')) {
            $where .= ' AND (workspaceid = :workspaceid OR workspaceid = 0)';
            $params['workspaceid'] = $workspaceid;
        }
        foreach ($DB->get_fieldset_select($table, 'studentid', $where, $params) as $studentid) {
            if ((int)$studentid > 0) {
                $ids[(int)$studentid] = (int)$studentid;
            }
        }
    }
    return array_values($ids);
}

function pqss_can_apply_for_student(int $workspaceid, int $userid, int $studentid): bool {
    if ($workspaceid <= 0 || $userid <= 0 || $studentid <= 0) {
        return false;
    }
    if (pqh_user_can_manage_workspace($userid, $workspaceid) || pqh_user_has_workspace_capability($userid, $workspaceid, 'finance.manage')) {
        return true;
    }
    return in_array($studentid, pqss_user_student_ids($workspaceid, $userid), true);
}

function pqss_offerings_for_scholarship(int $workspaceid): array {
    global $DB;

    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_course_offering')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT id, title, pricing_currency, tuition_amount, scholarship_eligible, status
           FROM {local_prequran_course_offering}
          WHERE workspaceid = :workspaceid
            AND status <> :archived
       ORDER BY scholarship_eligible DESC, title ASC",
        ['workspaceid' => $workspaceid, 'archived' => 'archived'],
        0,
        300
    ));
}

function pqss_student_invoices(int $workspaceid, int $studentid): array {
    global $DB;

    if ($workspaceid <= 0 || $studentid <= 0 || !pqfin_invoice_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT id, invoicenumber, status, currency, total, balancedue, dueat
           FROM {local_prequran_invoice}
          WHERE workspaceid = :workspaceid
            AND studentid = :studentid
            AND status <> :voidstatus
       ORDER BY dueat ASC, id DESC",
        ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'voidstatus' => 'void'],
        0,
        100
    ));
}

function pqss_create_scholarship_application(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;

    if (!pqss_schema_ready()) {
        throw new invalid_parameter_exception('Scholarship application schema is not ready.');
    }
    $studentid = (int)($data['studentid'] ?? 0);
    if (!pqss_can_apply_for_student($workspaceid, $actorid, $studentid)) {
        throw new invalid_parameter_exception('You cannot submit a scholarship application for this student.');
    }
    $requestedcents = pqfin_money_to_cents((string)($data['requestedamount'] ?? '0'));
    if ($requestedcents <= 0) {
        throw new invalid_parameter_exception('Requested scholarship amount must be greater than zero.');
    }
    $now = time();
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $record = (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'applicantid' => $actorid,
        'guardianid' => pqh_user_workspace_role($actorid, $workspaceid) === 'parent' ? $actorid : 0,
        'offeringid' => (int)($data['offeringid'] ?? 0),
        'invoiceid' => (int)($data['invoiceid'] ?? 0),
        'awardid' => 0,
        'assignedto' => 0,
        'applicationnumber' => '',
        'status' => 'submitted',
        'currency' => pqfin_normalize_currency((string)($data['currency'] ?? pqfin_default_currency())),
        'requestedamount' => pqfin_cents_to_money($requestedcents),
        'needlevel' => core_text::substr((string)($data['needlevel'] ?? 'standard'), 0, 40),
        'fundingpreference' => core_text::substr((string)($data['fundingpreference'] ?? ''), 0, 120),
        'householdnote' => trim((string)($data['householdnote'] ?? '')),
        'academicnote' => trim((string)($data['academicnote'] ?? '')),
        'documentnote' => trim((string)($data['documentnote'] ?? '')),
        'decisionnote' => '',
        'metadatajson' => pqfin_metadata(['source' => 'scholarship_portal']),
        'submittedat' => $now,
        'reviewedat' => 0,
        'decidedat' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $id = (int)$DB->insert_record('local_prequran_scholar_app', $record);
    $record->id = $id;
    $record->applicationnumber = pqss_generate_application_number($id, $workspaceid);
    $DB->update_record('local_prequran_scholar_app', $record);
    pqfin_audit('scholarship_application_submitted', $workspaceid, $studentid, $id, [
        'targettype' => 'scholarship_application',
        'applicationid' => $id,
        'applicationnumber' => (string)$record->applicationnumber,
        'amount' => (string)$record->requestedamount,
        'actorid' => $actorid,
    ]);
    return $id;
}

function pqss_scholarship_applications(int $workspaceid, int $viewerid): array {
    global $DB;

    if ($workspaceid <= 0 || !pqss_schema_ready()) {
        return [];
    }
    $manage = pqh_user_can_manage_workspace($viewerid, $workspaceid) || pqh_user_has_workspace_capability($viewerid, $workspaceid, 'finance.manage');
    $params = ['workspaceid' => $workspaceid];
    $where = 'a.workspaceid = :workspaceid';
    if (!$manage) {
        $studentids = pqss_user_student_ids($workspaceid, $viewerid);
        if (!$studentids) {
            return [];
        }
        [$studentsql, $studentparams] = $DB->get_in_or_equal($studentids, SQL_PARAMS_NAMED, 'studentid');
        $where .= " AND a.studentid {$studentsql}";
        $params += $studentparams;
    }
    return array_values($DB->get_records_sql(
        "SELECT a.*, u.firstname, u.lastname, u.email, o.title AS offeringtitle, i.invoicenumber
           FROM {local_prequran_scholar_app} a
      LEFT JOIN {user} u ON u.id = a.studentid
      LEFT JOIN {local_prequran_course_offering} o ON o.id = a.offeringid
      LEFT JOIN {local_prequran_invoice} i ON i.id = a.invoiceid
          WHERE {$where}
       ORDER BY a.timemodified DESC, a.id DESC",
        $params,
        0,
        $manage ? 300 : 100
    ));
}

function pqss_review_scholarship_application(int $applicationid, int $workspaceid, $consumercontext, int $actorid, string $status, string $decisionnote, int $invoiceid = 0): int {
    global $DB;

    if (!pqss_schema_ready()) {
        throw new invalid_parameter_exception('Scholarship application schema is not ready.');
    }
    if (!pqh_user_can_manage_workspace($actorid, $workspaceid) && !pqh_user_has_workspace_capability($actorid, $workspaceid, 'finance.manage')) {
        throw new invalid_parameter_exception('Only finance staff can review scholarship applications.');
    }
    $allowed = ['under_review', 'waitlist', 'declined', 'approved', 'awarded'];
    if (!in_array($status, $allowed, true)) {
        throw new invalid_parameter_exception('Unsupported scholarship application status.');
    }
    $application = $DB->get_record('local_prequran_scholar_app', ['id' => $applicationid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
    $now = time();
    $awardid = (int)$application->awardid;
    if ($status === 'awarded') {
        $targetinvoiceid = $invoiceid > 0 ? $invoiceid : (int)$application->invoiceid;
        if ($targetinvoiceid <= 0) {
            throw new invalid_parameter_exception('Choose an invoice before awarding this scholarship.');
        }
        $awardid = pqfin_create_scholarship_award_for_invoice(
            $targetinvoiceid,
            $consumercontext,
            $actorid,
            (string)$application->requestedamount,
            (string)$application->needlevel,
            (string)$application->fundingpreference,
            $decisionnote !== '' ? $decisionnote : (string)$application->householdnote
        );
        $application->invoiceid = $targetinvoiceid;
    }
    $application->status = $status;
    $application->decisionnote = trim($decisionnote);
    $application->awardid = $awardid;
    $application->reviewedat = $now;
    if (in_array($status, ['waitlist', 'declined', 'approved', 'awarded'], true)) {
        $application->decidedat = $now;
    }
    $application->modifiedby = $actorid;
    $application->timemodified = $now;
    $DB->update_record('local_prequran_scholar_app', $application);
    pqfin_audit('scholarship_application_reviewed', $workspaceid, (int)$application->studentid, $applicationid, [
        'targettype' => 'scholarship_application',
        'applicationid' => $applicationid,
        'status' => $status,
        'awardid' => $awardid,
        'actorid' => $actorid,
    ]);
    return $awardid;
}

function pqss_resolve_sponsor_account_for_user(int $workspaceid, $consumercontext, int $userid): int {
    global $DB, $USER;

    if ($workspaceid <= 0 || $userid <= 0 || !pqfin_schema_ready()) {
        return 0;
    }
    $account = $DB->get_record('local_prequran_billing_account', [
        'workspaceid' => $workspaceid,
        'accounttype' => 'sponsor',
        'primaryuserid' => $userid,
    ], '*', IGNORE_MISSING);
    if (!$account && !empty($USER->email)) {
        $account = $DB->get_record('local_prequran_billing_account', [
            'workspaceid' => $workspaceid,
            'accounttype' => 'sponsor',
            'billingemail' => (string)$USER->email,
        ], '*', IGNORE_MISSING);
        if ($account && (int)$account->primaryuserid <= 0) {
            $account->primaryuserid = $userid;
            $account->timemodified = time();
            $DB->update_record('local_prequran_billing_account', $account);
        }
    }
    if ($account) {
        return (int)$account->id;
    }
    $user = core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING);
    $name = $user ? fullname($user) : 'Sponsor #' . $userid;
    $email = $user ? (string)$user->email : '';
    $accountid = pqfin_create_sponsor_billing_account($workspaceid, $consumercontext, $name, $email, $userid);
    $account = $DB->get_record('local_prequran_billing_account', ['id' => $accountid], '*', MUST_EXIST);
    $account->primaryuserid = $userid;
    $account->timemodified = time();
    $DB->update_record('local_prequran_billing_account', $account);
    return $accountid;
}

function pqss_create_donor_pledge(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;

    if (!pqss_schema_ready()) {
        throw new invalid_parameter_exception('Sponsor/donor pledge schema is not ready.');
    }
    $pledgedcents = pqfin_money_to_cents((string)($data['pledgedamount'] ?? '0'));
    if ($pledgedcents <= 0) {
        throw new invalid_parameter_exception('Pledge amount must be greater than zero.');
    }
    $sponsoraccountid = pqss_resolve_sponsor_account_for_user($workspaceid, $consumercontext, $actorid);
    if ($sponsoraccountid <= 0) {
        throw new invalid_parameter_exception('A sponsor account could not be resolved.');
    }
    $now = time();
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $record = (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'sponsoraccountid' => $sponsoraccountid,
        'donoruserid' => $actorid,
        'studentid' => (int)($data['studentid'] ?? 0),
        'invoiceid' => (int)($data['invoiceid'] ?? 0),
        'commitmentid' => 0,
        'pledgenumber' => '',
        'campaign' => core_text::substr((string)($data['campaign'] ?? ''), 0, 120),
        'pledge_type' => core_text::substr((string)($data['pledge_type'] ?? 'general'), 0, 60),
        'status' => 'pledged',
        'currency' => pqfin_normalize_currency((string)($data['currency'] ?? pqfin_default_currency())),
        'pledgedamount' => pqfin_cents_to_money($pledgedcents),
        'allocatedamount' => '0.00',
        'balanceamount' => pqfin_cents_to_money($pledgedcents),
        'privacy' => core_text::substr((string)($data['privacy'] ?? 'named'), 0, 40),
        'donor_message' => trim((string)($data['donor_message'] ?? '')),
        'staffnote' => '',
        'metadatajson' => pqfin_metadata(['source' => 'sponsor_donor_portal']),
        'pledgedat' => $now,
        'expectedat' => (int)($data['expectedat'] ?? 0),
        'acceptedat' => 0,
        'completedat' => 0,
        'cancelledat' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $id = (int)$DB->insert_record('local_prequran_donor_pledge', $record);
    $record->id = $id;
    $record->pledgenumber = pqss_generate_pledge_number($id, $workspaceid);
    $DB->update_record('local_prequran_donor_pledge', $record);
    pqfin_audit('donor_pledge_created', $workspaceid, (int)$record->studentid, $id, [
        'targettype' => 'donor_pledge',
        'pledgeid' => $id,
        'pledgenumber' => (string)$record->pledgenumber,
        'amount' => (string)$record->pledgedamount,
        'actorid' => $actorid,
    ]);
    return $id;
}

function pqss_donor_pledges(int $workspaceid, int $viewerid): array {
    global $DB;

    if ($workspaceid <= 0 || !pqss_schema_ready()) {
        return [];
    }
    $manage = pqh_user_can_manage_workspace($viewerid, $workspaceid) || pqh_user_has_workspace_capability($viewerid, $workspaceid, 'finance.manage');
    $params = ['workspaceid' => $workspaceid];
    $where = 'p.workspaceid = :workspaceid';
    if (!$manage) {
        $sponsoraccountid = pqss_resolve_sponsor_account_for_user($workspaceid, pqh_current_consumer_context(), $viewerid);
        $where .= ' AND (p.donoruserid = :viewerid OR p.sponsoraccountid = :sponsoraccountid)';
        $params['viewerid'] = $viewerid;
        $params['sponsoraccountid'] = $sponsoraccountid;
    }
    return array_values($DB->get_records_sql(
        "SELECT p.*, ba.displayname AS sponsorname, ba.billingemail, u.firstname, u.lastname, i.invoicenumber
           FROM {local_prequran_donor_pledge} p
      LEFT JOIN {local_prequran_billing_account} ba ON ba.id = p.sponsoraccountid
      LEFT JOIN {user} u ON u.id = p.studentid
      LEFT JOIN {local_prequran_invoice} i ON i.id = p.invoiceid
          WHERE {$where}
       ORDER BY p.timemodified DESC, p.id DESC",
        $params,
        0,
        $manage ? 300 : 100
    ));
}

function pqss_review_donor_pledge(int $pledgeid, int $workspaceid, $consumercontext, int $actorid, string $status, string $staffnote, int $invoiceid = 0): int {
    global $DB;

    if (!pqss_schema_ready()) {
        throw new invalid_parameter_exception('Sponsor/donor pledge schema is not ready.');
    }
    if (!pqh_user_can_manage_workspace($actorid, $workspaceid) && !pqh_user_has_workspace_capability($actorid, $workspaceid, 'finance.manage')) {
        throw new invalid_parameter_exception('Only finance staff can review donor pledges.');
    }
    $allowed = ['pledged', 'accepted', 'allocated', 'completed', 'cancelled'];
    if (!in_array($status, $allowed, true)) {
        throw new invalid_parameter_exception('Unsupported donor pledge status.');
    }
    $pledge = $DB->get_record('local_prequran_donor_pledge', ['id' => $pledgeid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
    $now = time();
    $commitmentid = (int)$pledge->commitmentid;
    if ($status === 'allocated') {
        $targetinvoiceid = $invoiceid > 0 ? $invoiceid : (int)$pledge->invoiceid;
        if ($targetinvoiceid <= 0) {
            throw new invalid_parameter_exception('Choose an invoice before allocating this pledge.');
        }
        $commitmentid = pqfin_create_sponsor_commitment_for_invoice(
            $targetinvoiceid,
            $consumercontext,
            $actorid,
            (int)$pledge->sponsoraccountid,
            (string)$pledge->pledgedamount,
            (int)$pledge->expectedat,
            $staffnote !== '' ? $staffnote : (string)$pledge->donor_message
        );
        $pledge->invoiceid = $targetinvoiceid;
        $pledge->allocatedamount = (string)$pledge->pledgedamount;
        $pledge->balanceamount = '0.00';
    }
    $pledge->status = $status;
    $pledge->commitmentid = $commitmentid;
    $pledge->staffnote = trim($staffnote);
    if ($status === 'accepted' && (int)$pledge->acceptedat <= 0) {
        $pledge->acceptedat = $now;
    }
    if ($status === 'completed') {
        $pledge->completedat = $now;
        $pledge->balanceamount = '0.00';
    }
    if ($status === 'cancelled') {
        $pledge->cancelledat = $now;
    }
    $pledge->modifiedby = $actorid;
    $pledge->timemodified = $now;
    $DB->update_record('local_prequran_donor_pledge', $pledge);
    pqfin_audit('donor_pledge_reviewed', $workspaceid, (int)$pledge->studentid, $pledgeid, [
        'targettype' => 'donor_pledge',
        'pledgeid' => $pledgeid,
        'status' => $status,
        'commitmentid' => $commitmentid,
        'actorid' => $actorid,
    ]);
    return $commitmentid;
}
