<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');

function pqfin_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_billing_account')
        && pqh_table_exists_safe('local_prequran_student_finance');
}

function pqfin_policy_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_finance_policy');
}

function pqfin_invoice_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_invoice')
        && pqh_table_exists_safe('local_prequran_invoice_line');
}

function pqfin_payment_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_payment')
        && pqh_table_exists_safe('local_prequran_payment_alloc');
}

function pqfin_correction_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_credit_note')
        && pqh_table_exists_safe('local_prequran_refund');
}

function pqfin_hold_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_finance_hold');
}

function pqfin_notification_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_finance_link')
        && pqh_table_exists_safe('local_prequran_finance_delivery');
}

function pqfin_gateway_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_pay_provider')
        && pqh_table_exists_safe('local_prequran_pay_session')
        && pqh_table_exists_safe('local_prequran_pay_webhook');
}

function pqfin_payment_plan_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_payment_plan')
        && pqh_table_exists_safe('local_prequran_payment_install');
}

function pqfin_assistance_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_scholar_award')
        && pqh_table_exists_safe('local_prequran_sponsor_commit')
        && pqh_table_exists_safe('local_prequran_market_payout');
}

function pqfin_api_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_finance_api')
        && pqh_table_has_field_safe('local_prequran_finance_api', 'idempotencyhash')
        && pqh_table_exists_safe('local_prequran_finance_scale');
}

function pqfin_finance_audit_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_finance_audit');
}

function pqfin_default_currency(): string {
    return 'USD';
}

function pqfin_normalize_currency(string $currency): string {
    $currency = strtoupper(trim($currency));
    $currency = preg_replace('/[^A-Z]/', '', $currency) ?? '';
    return strlen($currency) === 3 ? $currency : pqfin_default_currency();
}

function pqfin_user_can_manage_workspace_finance(int $userid, int $workspaceid): bool {
    return $userid > 0 && $workspaceid > 0 && pqh_user_can_manage_workspace($userid, $workspaceid);
}

function pqfin_account_type_label(string $type): string {
    $labels = [
        'parent' => 'Parent or guardian',
        'student' => 'Student self-pay',
        'sponsor' => 'Sponsor',
        'institution' => 'Institution',
        'internal' => 'Internal account',
        'other' => 'Other',
    ];
    return $labels[$type] ?? ucfirst(str_replace('_', ' ', $type));
}

function pqfin_status_label(string $status): string {
    $labels = [
        'active' => 'Active',
        'paused' => 'Paused',
        'blocked' => 'Blocked',
        'archived' => 'Archived',
    ];
    return $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

function pqfin_policy_allowed_values(): array {
    return [
        'payment_required_timing' => ['admin_review', 'before_approval', 'before_moodle_enrollment', 'before_first_live_session', 'after_admin_review'],
        'deposit_requirement' => ['none', 'deposit', 'first_installment', 'full_balance'],
        'student_billing_visibility' => ['disabled', 'enabled_for_adult_learners', 'enabled_for_all'],
        'sponsor_billing_visibility' => ['disabled', 'assigned_invoices_only'],
        'transcript_hold_behavior' => ['disabled', 'warning_only', 'block_official_issue'],
        'certificate_hold_behavior' => ['disabled', 'warning_only', 'block_certificate_issue'],
        'late_fee_behavior' => ['disabled'],
        'automatic_access_lockout' => ['disabled'],
        'invoice_issue_timing' => ['manual', 'on_enrollment_request', 'on_admin_approval'],
    ];
}

function pqfin_default_policy(): array {
    return [
        'policy_version' => 1,
        'default_currency' => pqfin_default_currency(),
        'invoice_number_prefix' => 'INV',
        'invoice_due_days' => 14,
        'invoice_issue_timing' => 'manual',
        'payment_required_timing' => 'admin_review',
        'deposit_requirement' => 'none',
        'deposit_amount' => '',
        'student_billing_visibility' => 'disabled',
        'sponsor_billing_visibility' => 'assigned_invoices_only',
        'finance_hold_balance_threshold' => '',
        'finance_hold_overdue_days' => 30,
        'transcript_hold_behavior' => 'warning_only',
        'certificate_hold_behavior' => 'warning_only',
        'late_fee_behavior' => 'disabled',
        'automatic_access_lockout' => 'disabled',
    ];
}

function pqfin_policy_hash(array $policy): string {
    ksort($policy);
    return hash('sha256', pqfin_metadata($policy));
}

function pqfin_normalize_money_string(string $value): string {
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    $value = preg_replace('/[^0-9.]/', '', $value) ?? '';
    if ($value === '' || substr_count($value, '.') > 1) {
        return '';
    }
    return $value;
}

function pqfin_normalize_policy(array $policy): array {
    $allowed = pqfin_policy_allowed_values();
    $default = pqfin_default_policy();
    $normalized = $default;
    foreach ($default as $key => $fallback) {
        if (array_key_exists($key, $policy)) {
            $normalized[$key] = $policy[$key];
        }
    }
    $normalized['policy_version'] = 1;
    $normalized['default_currency'] = pqfin_normalize_currency((string)$normalized['default_currency']);
    $prefix = strtoupper(trim((string)$normalized['invoice_number_prefix']));
    $prefix = preg_replace('/[^A-Z0-9-]/', '', $prefix) ?? '';
    $normalized['invoice_number_prefix'] = core_text::substr($prefix !== '' ? $prefix : 'INV', 0, 20);
    $normalized['invoice_due_days'] = max(0, min(365, (int)$normalized['invoice_due_days']));
    $normalized['finance_hold_overdue_days'] = max(0, min(365, (int)$normalized['finance_hold_overdue_days']));
    $normalized['deposit_amount'] = pqfin_normalize_money_string((string)$normalized['deposit_amount']);
    $normalized['finance_hold_balance_threshold'] = pqfin_normalize_money_string((string)$normalized['finance_hold_balance_threshold']);

    foreach ($allowed as $key => $values) {
        $value = (string)($normalized[$key] ?? '');
        if (!in_array($value, $values, true)) {
            $normalized[$key] = $default[$key];
        }
    }
    return $normalized;
}

function pqfin_workspace_finance_policy(int $workspaceid, $consumercontext = null): array {
    global $DB;

    $policy = pqfin_default_policy();
    $source = 'default';
    $record = null;
    if ($workspaceid > 0 && pqfin_policy_schema_ready()) {
        $record = $DB->get_record('local_prequran_finance_policy', [
            'workspaceid' => $workspaceid,
            'status' => 'active',
        ], '*', IGNORE_MISSING);
        if ($record && pqh_record_belongs_to_consumer_context($record, $consumercontext, 'workspaceid')) {
            $decoded = json_decode((string)$record->policyjson, true);
            if (is_array($decoded)) {
                $policy = $decoded;
                $source = 'saved';
            }
        }
    }
    $policy = pqfin_normalize_policy($policy);
    return [
        'policy' => $policy,
        'source' => $source,
        'policyversion' => (int)($record->policyversion ?? 1),
        'policyhash' => (string)($record->policyhash ?? pqfin_policy_hash($policy)),
        'timemodified' => (int)($record->timemodified ?? 0),
        'warnings' => $source === 'default' ? ['finance_policy_missing'] : [],
    ];
}

function pqfin_save_workspace_finance_policy(int $workspaceid, $consumercontext, array $policy, int $actorid): int {
    global $DB;

    if ($workspaceid <= 0 || !pqfin_policy_schema_ready() || !pqfin_user_can_manage_workspace_finance($actorid, $workspaceid)) {
        throw new invalid_parameter_exception('Finance policy cannot be saved.');
    }
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $policy = pqfin_normalize_policy($policy);
    $hash = pqfin_policy_hash($policy);
    $now = time();
    $existing = $DB->get_record('local_prequran_finance_policy', ['workspaceid' => $workspaceid], '*', IGNORE_MISSING);
    $record = (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'policyversion' => (int)($existing->policyversion ?? 0) + 1,
        'policyhash' => $hash,
        'policyjson' => pqfin_metadata($policy),
        'status' => 'active',
        'createdby' => (int)($existing->createdby ?? $actorid),
        'modifiedby' => $actorid,
        'timecreated' => (int)($existing->timecreated ?? $now),
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_finance_policy', $record);
        $id = (int)$existing->id;
    } else {
        $id = (int)$DB->insert_record('local_prequran_finance_policy', $record);
    }
    pqfin_audit('finance_policy_saved', $workspaceid, 0, $id, [
        'consumerid' => (int)($context->consumerid ?? 0),
        'financepolicyid' => $id,
        'policyhash' => $hash,
        'policyversion' => (int)$record->policyversion,
        'actorid' => $actorid,
    ]);
    return $id;
}

function pqfin_consumer_context_for_workspace(int $workspaceid, $consumercontext = null): stdClass {
    if ($consumercontext && (int)($consumercontext->consumerid ?? 0) > 0
            && pqh_consumer_context_allows_workspace($consumercontext, $workspaceid)) {
        return $consumercontext;
    }
    $context = pqh_consumer_context_by_workspace($workspaceid);
    return $context ?: pqh_current_consumer_context();
}

function pqfin_parent_ids_for_student(int $studentid, int $workspaceid): array {
    global $DB;

    if ($studentid <= 0 || $workspaceid <= 0) {
        return [];
    }
    $ids = [];
    if (pqh_table_exists_safe('local_prequran_comm_consent')) {
        $rows = $DB->get_fieldset_sql(
            "SELECT DISTINCT cc.guardianid
               FROM {local_prequran_comm_consent} cc
               JOIN {local_prequran_workspace_member} wm
                 ON wm.userid = cc.studentid
                AND wm.workspaceid = :workspaceid
                AND wm.workspace_role = :studentrole
                AND wm.status = :memberstatus
              WHERE cc.studentid = :studentid
                AND cc.guardianid > 0",
            [
                'workspaceid' => $workspaceid,
                'studentrole' => 'student',
                'memberstatus' => 'active',
                'studentid' => $studentid,
            ]
        );
        foreach ($rows as $id) {
            $ids[(int)$id] = (int)$id;
        }
    }
    if (pqh_table_exists_safe('local_prequran_live_consent')) {
        $rows = $DB->get_fieldset_sql(
            "SELECT DISTINCT lc.guardianid
               FROM {local_prequran_live_consent} lc
               JOIN {local_prequran_workspace_member} wm
                 ON wm.userid = lc.studentid
                AND wm.workspaceid = :workspaceid
                AND wm.workspace_role = :studentrole
                AND wm.status = :memberstatus
              WHERE lc.studentid = :studentid
                AND lc.guardianid > 0",
            [
                'workspaceid' => $workspaceid,
                'studentrole' => 'student',
                'memberstatus' => 'active',
                'studentid' => $studentid,
            ]
        );
        foreach ($rows as $id) {
            $ids[(int)$id] = (int)$id;
        }
    }
    return array_values($ids);
}

function pqfin_student_in_workspace(int $studentid, int $workspaceid): bool {
    global $DB;

    if ($studentid <= 0 || $workspaceid <= 0) {
        return false;
    }
    if (pqh_table_exists_safe('local_prequran_workspace_member')
            && $DB->record_exists('local_prequran_workspace_member', [
                'workspaceid' => $workspaceid,
                'userid' => $studentid,
                'workspace_role' => 'student',
                'status' => 'active',
            ])) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_student_profile')
            && pqh_table_has_field_safe('local_prequran_student_profile', 'workspaceid')) {
        return $DB->record_exists('local_prequran_student_profile', [
            'userid' => $studentid,
            'workspaceid' => $workspaceid,
        ]);
    }
    return false;
}

function pqfin_billing_account_belongs_to_workspace(int $billingaccountid, int $workspaceid, $consumercontext = null): bool {
    global $DB;

    if ($billingaccountid <= 0 || $workspaceid <= 0 || !pqfin_schema_ready()) {
        return false;
    }
    $account = $DB->get_record('local_prequran_billing_account', ['id' => $billingaccountid], '*', IGNORE_MISSING);
    if (!$account || (int)$account->workspaceid !== $workspaceid) {
        return false;
    }
    return pqh_record_belongs_to_consumer_context($account, $consumercontext, 'workspaceid');
}

function pqfin_metadata(array $metadata): string {
    return json_encode($metadata, JSON_UNESCAPED_SLASHES) ?: '{}';
}

function pqfin_audit(string $action, int $workspaceid, int $studentid, int $targetid, array $details = []): void {
    global $DB, $USER;

    $actorid = (int)($details['actorid'] ?? ($USER->id ?? 0));
    try {
        if (pqh_table_exists_safe('local_prequran_course_audit')) {
            $DB->insert_record('local_prequran_course_audit', (object)[
                'consumerid' => (int)($details['consumerid'] ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => (int)($details['offeringid'] ?? 0),
                'requestid' => (int)($details['requestid'] ?? 0),
                'studentid' => $studentid,
                'actorid' => $actorid,
                'action' => core_text::substr($action, 0, 80),
                'targettype' => core_text::substr((string)($details['targettype'] ?? 'student_finance'), 0, 80),
                'targetid' => $targetid,
                'details' => pqfin_metadata($details),
                'timecreated' => time(),
            ]);
        }
        if (pqfin_finance_audit_schema_ready()) {
            $DB->insert_record('local_prequran_finance_audit', (object)[
                'consumerid' => (int)($details['consumerid'] ?? 0),
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'billingaccountid' => (int)($details['billingaccountid'] ?? 0),
                'invoiceid' => (int)($details['invoiceid'] ?? 0),
                'paymentid' => (int)($details['paymentid'] ?? 0),
                'actorid' => $actorid,
                'action' => core_text::substr($action, 0, 80),
                'targettype' => core_text::substr((string)($details['targettype'] ?? 'student_finance'), 0, 80),
                'targetid' => $targetid,
                'details' => pqfin_metadata($details),
                'timecreated' => time(),
            ]);
        }
    } catch (Throwable $e) {
        debugging('Could not write student finance audit event: ' . $e->getMessage(), DEBUG_DEVELOPER);
    }
}

function pqfin_hold_status_label(string $status): string {
    $labels = [
        'suggested' => 'Suggested',
        'active' => 'Active',
        'resolved' => 'Resolved',
        'dismissed' => 'Dismissed',
    ];
    return $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

function pqfin_hold_type_label(string $type): string {
    $labels = [
        'manual' => 'Manual finance hold',
        'overdue_balance' => 'Overdue balance',
        'balance_threshold' => 'Balance threshold',
        'disputed_invoice' => 'Disputed invoice',
        'manual_review' => 'Manual review',
    ];
    return $labels[$type] ?? ucfirst(str_replace('_', ' ', $type));
}

function pqfin_active_hold_statuses(): array {
    return ['active'];
}

function pqfin_unresolved_hold_statuses(): array {
    return ['active', 'suggested'];
}

function pqfin_finance_holds(int $studentid, int $workspaceid, string $status = ''): array {
    global $DB;

    if ($studentid <= 0 || $workspaceid <= 0 || !pqfin_hold_schema_ready()) {
        return [];
    }
    $params = ['studentid' => $studentid, 'workspaceid' => $workspaceid];
    $statussql = '';
    if ($status !== '') {
        $params['status'] = $status;
        $statussql = ' AND h.status = :status';
    }
    return array_values($DB->get_records_sql(
        "SELECT h.*
           FROM {local_prequran_finance_hold} h
          WHERE h.workspaceid = :workspaceid
            AND h.studentid = :studentid
            $statussql
          ORDER BY h.status ASC, h.detectedat DESC, h.timemodified DESC",
        $params
    ));
}

function pqfin_active_finance_holds(int $studentid, int $workspaceid): array {
    return pqfin_finance_holds($studentid, $workspaceid, 'active');
}

function pqfin_hold_parent_safe_message($hold): string {
    $message = trim((string)($hold->parentmessage ?? ''));
    if ($message !== '') {
        return $message;
    }
    $type = pqfin_hold_type_label((string)($hold->holdtype ?? 'manual'));
    return 'A finance review is pending for this student account. Please contact the academy finance office for assistance.';
}

function pqfin_invoice_hold_candidates_for_student(int $studentid, int $workspaceid, $consumercontext = null): array {
    global $DB;

    if (!pqfin_invoice_schema_ready() || $studentid <= 0 || $workspaceid <= 0) {
        return [];
    }
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $policyinfo = pqfin_workspace_finance_policy($workspaceid, $context);
    $policy = pqfin_normalize_policy($policyinfo['policy']);
    $overduedays = max(0, (int)$policy['finance_hold_overdue_days']);
    $thresholdcents = pqfin_money_to_cents((string)$policy['finance_hold_balance_threshold']);
    $now = time();
    $rows = $DB->get_records_sql(
        "SELECT i.*
           FROM {local_prequran_invoice} i
          WHERE i.workspaceid = :workspaceid
            AND i.studentid = :studentid
            AND i.status IN ('issued', 'sent', 'partially_paid', 'disputed')
            AND i.balancedue <> '0.00'
          ORDER BY i.dueat ASC, i.timemodified DESC",
        ['workspaceid' => $workspaceid, 'studentid' => $studentid]
    );
    $candidates = [];
    foreach ($rows as $invoice) {
        if (!pqh_record_belongs_to_consumer_context($invoice, $context, 'workspaceid')) {
            continue;
        }
        $balancecents = pqfin_money_to_cents((string)$invoice->balancedue);
        if ($balancecents <= 0) {
            continue;
        }
        $base = [
            'consumerid' => (int)($invoice->consumerid ?? $context->consumerid ?? 0),
            'workspaceid' => $workspaceid,
            'billingaccountid' => (int)($invoice->billingaccountid ?? 0),
            'studentid' => $studentid,
            'invoiceid' => (int)$invoice->id,
            'paymentid' => 0,
            'source' => 'automatic_candidate',
            'severity' => 'warning',
            'status' => 'suggested',
            'policyaction' => 'warning_only',
            'currency' => pqfin_normalize_currency((string)($invoice->currency ?? $policy['default_currency'])),
            'amount' => pqfin_cents_to_money($balancecents),
            'metadata' => [
                'invoicenumber' => (string)($invoice->invoicenumber ?? ''),
                'invoice_status' => (string)($invoice->status ?? ''),
                'dueat' => (int)($invoice->dueat ?? 0),
                'policyhash' => (string)$policyinfo['policyhash'],
            ],
        ];
        if ((int)($invoice->dueat ?? 0) > 0 && $overduedays >= 0 && (int)$invoice->dueat + ($overduedays * DAYSECS) < $now) {
            $candidates[] = $base + [
                'holdtype' => 'overdue_balance',
                'reasoncode' => 'overdue_balance',
                'reason' => 'Invoice ' . ((string)($invoice->invoicenumber ?? '') !== '' ? (string)$invoice->invoicenumber : '#' . (int)$invoice->id) . ' has an overdue balance of ' . pqfin_cents_to_money($balancecents) . ' ' . (string)$base['currency'] . '.',
                'parentmessage' => 'A tuition balance is overdue. Please contact the academy finance office to clear the account.',
            ];
        }
        if ($thresholdcents > 0 && $balancecents >= $thresholdcents) {
            $candidates[] = $base + [
                'holdtype' => 'balance_threshold',
                'reasoncode' => 'balance_threshold',
                'reason' => 'Student balance meets or exceeds the workspace hold threshold of ' . pqfin_cents_to_money($thresholdcents) . ' ' . (string)$base['currency'] . '.',
                'parentmessage' => 'A tuition balance requires finance review before some official academic releases.',
            ];
        }
        if ((string)($invoice->status ?? '') === 'disputed') {
            $candidates[] = $base + [
                'holdtype' => 'disputed_invoice',
                'reasoncode' => 'disputed_invoice',
                'reason' => 'Invoice ' . ((string)($invoice->invoicenumber ?? '') !== '' ? (string)$invoice->invoicenumber : '#' . (int)$invoice->id) . ' is disputed and needs finance resolution.',
                'parentmessage' => 'A disputed tuition invoice is under finance review.',
            ];
        }
    }
    return $candidates;
}

function pqfin_create_finance_hold(int $studentid, int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;

    if (!pqfin_hold_schema_ready() || !pqfin_student_in_workspace($studentid, $workspaceid)) {
        throw new invalid_parameter_exception('Finance hold schema is not ready for this student.');
    }
    if (!pqfin_user_can_manage_workspace_finance($actorid, $workspaceid)) {
        throw new invalid_parameter_exception('Finance hold management access required.');
    }
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $profile = pqfin_student_finance_profile($studentid, $workspaceid, $context, true, $actorid);
    $account = $profile['billingaccount'];
    $status = (string)($data['status'] ?? 'active');
    $status = in_array($status, ['active', 'suggested'], true) ? $status : 'active';
    $reason = trim((string)($data['reason'] ?? ''));
    if ($reason === '') {
        throw new invalid_parameter_exception('A finance hold reason is required.');
    }
    $holdtype = core_text::substr((string)($data['holdtype'] ?? 'manual'), 0, 80);
    $reasoncode = core_text::substr((string)($data['reasoncode'] ?? $holdtype), 0, 120);
    $now = time();
    $record = (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'billingaccountid' => (int)($account->id ?? 0),
        'studentid' => $studentid,
        'invoiceid' => max(0, (int)($data['invoiceid'] ?? 0)),
        'paymentid' => max(0, (int)($data['paymentid'] ?? 0)),
        'holdtype' => $holdtype,
        'source' => core_text::substr((string)($data['source'] ?? 'manual'), 0, 80),
        'severity' => core_text::substr((string)($data['severity'] ?? ($status === 'active' ? 'blocker' : 'warning')), 0, 40),
        'status' => $status,
        'policyaction' => core_text::substr((string)($data['policyaction'] ?? 'warning_only'), 0, 80),
        'currency' => pqfin_normalize_currency((string)($data['currency'] ?? ($account->currency ?? pqfin_default_currency()))),
        'amount' => pqfin_cents_to_money(max(0, pqfin_money_to_cents((string)($data['amount'] ?? '0')))),
        'reasoncode' => $reasoncode,
        'reason' => $reason,
        'parentmessage' => trim((string)($data['parentmessage'] ?? '')),
        'resolutionnote' => '',
        'metadatajson' => pqfin_metadata((array)($data['metadata'] ?? [])),
        'detectedat' => (int)($data['detectedat'] ?? $now),
        'activatedat' => $status === 'active' ? $now : 0,
        'resolvedat' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $id = (int)$DB->insert_record('local_prequran_finance_hold', $record);
    pqfin_audit($status === 'active' ? 'finance_hold_created' : 'finance_hold_suggested', $workspaceid, $studentid, $id, [
        'targettype' => 'finance_hold',
        'consumerid' => (int)$record->consumerid,
        'billingaccountid' => (int)$record->billingaccountid,
        'invoiceid' => (int)$record->invoiceid,
        'holdtype' => (string)$record->holdtype,
        'reasoncode' => (string)$record->reasoncode,
        'status' => (string)$record->status,
        'actorid' => $actorid,
    ]);
    return $id;
}

function pqfin_refresh_finance_hold_candidates(int $studentid, int $workspaceid, $consumercontext, int $actorid): array {
    global $DB;

    if (!pqfin_hold_schema_ready()) {
        throw new invalid_parameter_exception('Finance hold schema is not ready.');
    }
    $created = [];
    foreach (pqfin_invoice_hold_candidates_for_student($studentid, $workspaceid, $consumercontext) as $candidate) {
        $existing = $DB->record_exists_select(
            'local_prequran_finance_hold',
            'workspaceid = :workspaceid AND studentid = :studentid AND invoiceid = :invoiceid AND reasoncode = :reasoncode AND status IN (:active, :suggested)',
            [
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'invoiceid' => (int)$candidate['invoiceid'],
                'reasoncode' => (string)$candidate['reasoncode'],
                'active' => 'active',
                'suggested' => 'suggested',
            ]
        );
        if ($existing) {
            continue;
        }
        $created[] = pqfin_create_finance_hold($studentid, $workspaceid, $consumercontext, $actorid, $candidate);
    }
    return $created;
}

function pqfin_activate_finance_hold(int $holdid, int $workspaceid, int $actorid): void {
    global $DB;

    if ($holdid <= 0 || !pqfin_hold_schema_ready() || !pqfin_user_can_manage_workspace_finance($actorid, $workspaceid)) {
        throw new invalid_parameter_exception('Finance hold cannot be activated.');
    }
    $hold = $DB->get_record('local_prequran_finance_hold', ['id' => $holdid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
    if (!in_array((string)$hold->status, ['suggested', 'active'], true)) {
        throw new invalid_parameter_exception('Only suggested finance holds can be activated.');
    }
    $hold->status = 'active';
    $hold->severity = 'blocker';
    $hold->activatedat = (int)$hold->activatedat > 0 ? (int)$hold->activatedat : time();
    $hold->modifiedby = $actorid;
    $hold->timemodified = time();
    $DB->update_record('local_prequran_finance_hold', $hold);
    pqfin_audit('finance_hold_activated', $workspaceid, (int)$hold->studentid, $holdid, [
        'targettype' => 'finance_hold',
        'consumerid' => (int)$hold->consumerid,
        'billingaccountid' => (int)$hold->billingaccountid,
        'invoiceid' => (int)$hold->invoiceid,
        'holdtype' => (string)$hold->holdtype,
        'actorid' => $actorid,
    ]);
}

function pqfin_resolve_finance_hold(int $holdid, int $workspaceid, int $actorid, string $resolutionnote): void {
    global $DB;

    $resolutionnote = trim($resolutionnote);
    if ($resolutionnote === '') {
        throw new invalid_parameter_exception('A resolution note is required.');
    }
    if ($holdid <= 0 || !pqfin_hold_schema_ready() || !pqfin_user_can_manage_workspace_finance($actorid, $workspaceid)) {
        throw new invalid_parameter_exception('Finance hold cannot be resolved.');
    }
    $hold = $DB->get_record('local_prequran_finance_hold', ['id' => $holdid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
    if (!in_array((string)$hold->status, pqfin_unresolved_hold_statuses(), true)) {
        throw new invalid_parameter_exception('This finance hold is already closed.');
    }
    $hold->status = 'resolved';
    $hold->resolutionnote = $resolutionnote;
    $hold->resolvedat = time();
    $hold->modifiedby = $actorid;
    $hold->timemodified = time();
    $DB->update_record('local_prequran_finance_hold', $hold);
    pqfin_audit('finance_hold_resolved', $workspaceid, (int)$hold->studentid, $holdid, [
        'targettype' => 'finance_hold',
        'consumerid' => (int)$hold->consumerid,
        'billingaccountid' => (int)$hold->billingaccountid,
        'invoiceid' => (int)$hold->invoiceid,
        'holdtype' => (string)$hold->holdtype,
        'resolutionnote' => $resolutionnote,
        'actorid' => $actorid,
    ]);
}

function pqfin_finance_hold_release_check(int $studentid, int $workspaceid, $consumercontext = null, string $release = 'transcript'): array {
    $policyinfo = pqfin_workspace_finance_policy($workspaceid, $consumercontext);
    $policy = pqfin_normalize_policy($policyinfo['policy']);
    $holds = pqfin_active_finance_holds($studentid, $workspaceid);
    $suggested = pqfin_finance_holds($studentid, $workspaceid, 'suggested');
    $behavior = 'disabled';
    if ($release === 'transcript') {
        $behavior = (string)$policy['transcript_hold_behavior'];
    } else if ($release === 'certificate') {
        $behavior = (string)$policy['certificate_hold_behavior'];
    } else if (in_array($release, ['enrollment', 'live_session'], true)) {
        $behavior = !empty($holds) || !empty($suggested) ? 'warning_only' : 'disabled';
    }
    $blocked = $behavior === 'block_official_issue' && !empty($holds);
    if ($release === 'certificate') {
        $blocked = $behavior === 'block_certificate_issue' && !empty($holds);
    }
    $warnings = [];
    foreach ($holds as $hold) {
        $warnings[] = pqfin_hold_type_label((string)$hold->holdtype) . ': ' . trim((string)$hold->reason);
    }
    foreach ($suggested as $hold) {
        $warnings[] = 'Suggested ' . pqfin_hold_type_label((string)$hold->holdtype) . ': ' . trim((string)$hold->reason);
    }
    return [
        'blocked' => $blocked,
        'behavior' => $behavior,
        'policyhash' => (string)$policyinfo['policyhash'],
        'holds' => $holds,
        'suggested' => $suggested,
        'warnings' => array_values(array_unique(array_filter($warnings))),
        'safe_message' => !empty($holds) || !empty($suggested)
            ? 'A finance review is pending for this student account. Official releases may require finance clearance.'
            : '',
    ];
}

function pqfin_report_workspace_context(int $workspaceid, $consumercontext = null): array {
    global $DB;

    $workspace = $workspaceid > 0 && pqh_table_exists_safe('local_prequran_workspace')
        ? $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING)
        : null;
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $domain = '';
    if (pqh_table_exists_safe('local_prequran_consumer_domain') && (int)($context->consumerid ?? 0) > 0) {
        $domain = (string)$DB->get_field_sql(
            "SELECT domain
               FROM {local_prequran_consumer_domain}
              WHERE consumerid = :consumerid
                AND (workspaceid = :workspaceid OR workspaceid = 0)
                AND status = :status
           ORDER BY isprimary DESC, workspaceid DESC, id ASC",
            ['consumerid' => (int)$context->consumerid, 'workspaceid' => $workspaceid, 'status' => 'active'],
            IGNORE_MULTIPLE
        );
    }
    return [
        'workspaceid' => $workspaceid,
        'workspace' => $workspace ? (string)$workspace->name : 'Workspace #' . $workspaceid,
        'consumerid' => (int)($context->consumerid ?? 0),
        'consumer' => (string)($context->consumername ?? $context->consumerdisplayname ?? $context->consumerslug ?? ''),
        'domain' => $domain,
    ];
}

function pqfin_report_money_sum(array $rows, string $field): int {
    $total = 0;
    foreach ($rows as $row) {
        $total += pqfin_money_to_cents((string)($row->{$field} ?? '0'));
    }
    return $total;
}

function pqfin_operations_dashboard_metrics(int $workspaceid, $consumercontext = null): array {
    global $DB;

    $metrics = [
        'open_invoices' => 0,
        'overdue_invoices' => 0,
        'payments_received_cents' => 0,
        'outstanding_balance_cents' => 0,
        'paid_not_enrolled' => 0,
        'enrolled_unpaid' => 0,
        'finance_holds' => 0,
    ];
    if ($workspaceid <= 0) {
        return $metrics;
    }
    $now = time();
    if (pqfin_invoice_schema_ready()) {
        $invoices = $DB->get_records_sql(
            "SELECT id, status, balancedue
               FROM {local_prequran_invoice}
              WHERE workspaceid = :workspaceid
                AND status IN ('issued', 'sent', 'partially_paid', 'disputed')",
            ['workspaceid' => $workspaceid]
        );
        $metrics['open_invoices'] = count($invoices);
        $metrics['outstanding_balance_cents'] = pqfin_report_money_sum($invoices, 'balancedue');
        $metrics['overdue_invoices'] = (int)$DB->count_records_select(
            'local_prequran_invoice',
            "workspaceid = :workspaceid AND status IN ('issued', 'sent', 'partially_paid', 'disputed') AND dueat > 0 AND dueat < :now AND balancedue <> '0.00'",
            ['workspaceid' => $workspaceid, 'now' => $now]
        );
    }
    if (pqfin_payment_schema_ready()) {
        $payments = $DB->get_records_sql(
            "SELECT id, amount
               FROM {local_prequran_payment}
              WHERE workspaceid = :workspaceid
                AND status = :status",
            ['workspaceid' => $workspaceid, 'status' => 'posted']
        );
        $metrics['payments_received_cents'] = pqfin_report_money_sum($payments, 'amount');
    }
    if (pqfin_hold_schema_ready()) {
        $metrics['finance_holds'] = (int)$DB->count_records('local_prequran_finance_hold', ['workspaceid' => $workspaceid, 'status' => 'active']);
    }
    $exceptions = pqfin_enrollment_finance_exceptions($workspaceid, $consumercontext, 10000);
    $metrics['paid_not_enrolled'] = count($exceptions['paid_not_enrolled']);
    $metrics['enrolled_unpaid'] = count($exceptions['enrolled_unpaid']);
    return $metrics;
}

function pqfin_invoice_aging_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_invoice_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $now = time();
    $rows = $DB->get_records_sql(
        "SELECT i.*, ba.displayname AS accountname, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_invoice} i
           JOIN {local_prequran_billing_account} ba ON ba.id = i.billingaccountid
      LEFT JOIN {user} u ON u.id = i.studentid
          WHERE i.workspaceid = :workspaceid
            AND i.status IN ('issued', 'sent', 'partially_paid', 'disputed')
            AND i.balancedue <> '0.00'
       ORDER BY i.dueat ASC, i.timemodified DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    $out = [];
    foreach ($rows as $row) {
        $days = (int)$row->dueat > 0 ? (int)floor(($now - (int)$row->dueat) / DAYSECS) : 0;
        $bucket = 'current';
        if ($days > 90) {
            $bucket = '90_plus';
        } else if ($days > 60) {
            $bucket = '61_90';
        } else if ($days > 30) {
            $bucket = '31_60';
        } else if ($days > 0) {
            $bucket = '1_30';
        }
        $row->agingdays = max(0, $days);
        $row->agingbucket = $bucket;
        $row->reconciliationid = 'INV-' . (int)$row->workspaceid . '-' . (int)$row->id;
        $out[] = $row;
    }
    return $out;
}

function pqfin_payments_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_payment_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT p.*, ba.displayname AS accountname, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_payment} p
           JOIN {local_prequran_billing_account} ba ON ba.id = p.billingaccountid
      LEFT JOIN {user} u ON u.id = p.studentid
          WHERE p.workspaceid = :workspaceid
       ORDER BY p.receivedat DESC, p.id DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    foreach ($rows as $row) {
        $row->reconciliationid = 'PAY-' . (int)$row->workspaceid . '-' . (int)$row->id;
    }
    return array_values($rows);
}

function pqfin_balances_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_invoice_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT i.workspaceid, i.studentid, i.billingaccountid, ba.displayname AS accountname,
                u.firstname, u.lastname, u.email, u.idnumber,
                COUNT(i.id) AS invoicecount,
                SUM(CAST(i.total AS DECIMAL(18,2))) AS totalamount,
                SUM(CAST(i.paidamount AS DECIMAL(18,2))) AS paidamount,
                SUM(CAST(i.balancedue AS DECIMAL(18,2))) AS balancedue
           FROM {local_prequran_invoice} i
           JOIN {local_prequran_billing_account} ba ON ba.id = i.billingaccountid
      LEFT JOIN {user} u ON u.id = i.studentid
          WHERE i.workspaceid = :workspaceid
            AND i.status <> 'void'
       GROUP BY i.workspaceid, i.studentid, i.billingaccountid, ba.displayname, u.firstname, u.lastname, u.email, u.idnumber
       ORDER BY balancedue DESC, accountname ASC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    foreach ($rows as $row) {
        $row->reconciliationid = 'BAL-' . (int)$row->workspaceid . '-' . (int)$row->billingaccountid . '-' . (int)$row->studentid;
    }
    return array_values($rows);
}

function pqfin_corrections_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_correction_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $credits = $DB->get_records_sql(
        "SELECT 'credit' AS reporttype, c.id, c.workspaceid, c.studentid, c.billingaccountid, c.invoiceid, 0 AS paymentid,
                c.creditnumber AS documentnumber, c.credittype AS subtype, c.status, c.currency, c.amount,
                c.reasoncode, c.reason, c.issuedat AS eventtime
           FROM {local_prequran_credit_note} c
          WHERE c.workspaceid = :workspaceid",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    $refunds = $DB->get_records_sql(
        "SELECT 'refund' AS reporttype, r.id, r.workspaceid, r.studentid, r.billingaccountid, r.invoiceid, r.paymentid,
                r.refundnumber AS documentnumber, r.refundmethod AS subtype, r.status, r.currency, r.amount,
                '' AS reasoncode, r.reason, r.refundedat AS eventtime
           FROM {local_prequran_refund} r
          WHERE r.workspaceid = :workspaceid",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    $rows = array_merge(array_values($credits), array_values($refunds));
    usort($rows, static fn($a, $b): int => ((int)$b->eventtime <=> (int)$a->eventtime) ?: ((int)$b->id <=> (int)$a->id));
    foreach ($rows as $row) {
        $row->reconciliationid = strtoupper((string)$row->reporttype) . '-' . (int)$row->workspaceid . '-' . (int)$row->id;
    }
    return array_slice($rows, 0, $limit);
}

function pqfin_holds_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_hold_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT h.*, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_finance_hold} h
      LEFT JOIN {user} u ON u.id = h.studentid
          WHERE h.workspaceid = :workspaceid
       ORDER BY h.status ASC, h.detectedat DESC, h.id DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    foreach ($rows as $row) {
        $row->reconciliationid = 'HOLD-' . (int)$row->workspaceid . '-' . (int)$row->id;
    }
    return array_values($rows);
}

function pqfin_gateway_webhook_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_gateway_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT w.*
           FROM {local_prequran_pay_webhook} w
          WHERE w.workspaceid = :workspaceid
       ORDER BY CASE WHEN w.processingstatus IN ('failed', 'received') THEN 0 ELSE 1 END,
                w.receivedat DESC, w.id DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    foreach ($rows as $row) {
        $row->reconciliationid = 'WH-' . (int)$row->workspaceid . '-' . (int)$row->id;
    }
    return array_values($rows);
}

function pqfin_hardening_snapshots_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_api_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT s.*
           FROM {local_prequran_finance_scale} s
          WHERE s.workspaceid = :workspaceid
       ORDER BY s.checkedat DESC, s.id DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    foreach ($rows as $row) {
        $row->reconciliationid = 'SCALE-' . (int)$row->workspaceid . '-' . (int)$row->id;
        $row->studentid = 0;
        $row->currency = '';
        $row->amount = '';
        $row->accountname = (string)$row->snapshotkey;
    }
    return array_values($rows);
}

function pqfin_enrollment_finance_exceptions(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    $out = ['paid_not_enrolled' => [], 'enrolled_unpaid' => []];
    if (!pqfin_invoice_schema_ready() || !pqh_table_exists_safe('local_prequran_course_enrol_req') || $workspaceid <= 0) {
        return $out;
    }
    $out['paid_not_enrolled'] = array_values($DB->get_records_sql(
        "SELECT DISTINCT r.id AS requestid, r.workspaceid, r.studentid, r.status AS requeststatus, r.offeringid,
                o.title AS offeringtitle, i.id AS invoiceid, i.invoicenumber, i.status AS invoicestatus,
                i.currency, i.total, i.paidamount, i.balancedue, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
           JOIN {local_prequran_invoice_line} il ON il.requestid = r.id
           JOIN {local_prequran_invoice} i ON i.id = il.invoiceid
      LEFT JOIN {user} u ON u.id = r.studentid
          WHERE r.workspaceid = :workspaceid
            AND i.status = 'paid'
            AND il.status = 'active'
            AND r.status NOT IN ('approved', 'enrolled')
       ORDER BY i.timemodified DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    ));
    $out['enrolled_unpaid'] = array_values($DB->get_records_sql(
        "SELECT DISTINCT r.id AS requestid, r.workspaceid, r.studentid, r.status AS requeststatus, r.offeringid,
                o.title AS offeringtitle, i.id AS invoiceid, i.invoicenumber, i.status AS invoicestatus,
                i.currency, i.total, i.paidamount, i.balancedue, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
           JOIN {local_prequran_invoice_line} il ON il.requestid = r.id
           JOIN {local_prequran_invoice} i ON i.id = il.invoiceid
      LEFT JOIN {user} u ON u.id = r.studentid
          WHERE r.workspaceid = :workspaceid
            AND r.status IN ('approved', 'enrolled')
            AND i.status NOT IN ('paid', 'void')
            AND il.status = 'active'
            AND i.balancedue <> '0.00'
       ORDER BY i.dueat ASC, i.timemodified DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    ));
    foreach ($out as $type => $rows) {
        foreach ($rows as $row) {
            $row->exceptiontype = $type;
            $row->reconciliationid = 'EXC-' . (int)$row->workspaceid . '-' . (int)$row->requestid . '-' . (int)$row->invoiceid;
        }
    }
    return $out;
}

function pqfin_discounts_scholarships_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_invoice_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT l.*, i.invoicenumber, i.status AS invoicestatus, i.studentid, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_invoice_line} l
           JOIN {local_prequran_invoice} i ON i.id = l.invoiceid
      LEFT JOIN {user} u ON u.id = i.studentid
          WHERE l.workspaceid = :workspaceid
            AND (l.discountamount <> '0.00' OR l.description LIKE :scholarship)
       ORDER BY l.timemodified DESC, l.id DESC",
        ['workspaceid' => $workspaceid, 'scholarship' => '%scholarship%'],
        0,
        $limit
    );
    foreach ($rows as $row) {
        $row->reconciliationid = 'DISC-' . (int)$row->workspaceid . '-' . (int)$row->invoiceid . '-' . (int)$row->id;
    }
    return array_values($rows);
}

function pqfin_scholarships_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_assistance_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT a.*, i.invoicenumber, i.status AS invoicestatus, c.creditnumber,
                u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_scholar_award} a
           JOIN {local_prequran_invoice} i ON i.id = a.invoiceid
      LEFT JOIN {local_prequran_credit_note} c ON c.id = a.creditnoteid
      LEFT JOIN {user} u ON u.id = a.studentid
          WHERE a.workspaceid = :workspaceid
       ORDER BY a.approvedat DESC, a.id DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    foreach ($rows as $row) {
        $row->reconciliationid = 'SCH-' . (int)$row->workspaceid . '-' . (int)$row->id;
    }
    return array_values($rows);
}

function pqfin_sponsorships_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_assistance_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT sc.*, i.invoicenumber, i.status AS invoicestatus,
                ba.displayname AS sponsorname, ba.billingemail AS sponsoremail,
                u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_sponsor_commit} sc
           JOIN {local_prequran_invoice} i ON i.id = sc.invoiceid
      LEFT JOIN {local_prequran_billing_account} ba ON ba.id = sc.sponsoraccountid
      LEFT JOIN {user} u ON u.id = sc.studentid
          WHERE sc.workspaceid = :workspaceid
       ORDER BY sc.status ASC, sc.expectedat ASC, sc.id DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    foreach ($rows as $row) {
        $row->reconciliationid = 'SPN-' . (int)$row->workspaceid . '-' . (int)$row->id;
        $row->accountname = (string)($row->sponsorname ?? '');
    }
    return array_values($rows);
}

function pqfin_marketplace_payouts_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_assistance_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT mp.*, i.invoicenumber, i.status AS invoicestatus,
                stu.firstname, stu.lastname, stu.email, stu.idnumber,
                teach.firstname AS teacherfirstname, teach.lastname AS teacherlastname, teach.email AS teacheremail
           FROM {local_prequran_market_payout} mp
           JOIN {local_prequran_invoice} i ON i.id = mp.invoiceid
      LEFT JOIN {user} stu ON stu.id = mp.studentid
      LEFT JOIN {user} teach ON teach.id = mp.teacherid
          WHERE mp.workspaceid = :workspaceid
       ORDER BY mp.status ASC, mp.readyat DESC, mp.id DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    foreach ($rows as $row) {
        $row->reconciliationid = 'MPO-' . (int)$row->workspaceid . '-' . (int)$row->id;
        $row->accountname = trim((string)($row->teacherfirstname ?? '') . ' ' . (string)($row->teacherlastname ?? ''));
    }
    return array_values($rows);
}

function pqfin_refresh_operations_snapshot(int $workspaceid, $consumercontext = null, int $actorid = 0): array {
    $metrics = pqfin_operations_dashboard_metrics($workspaceid, $consumercontext);
    pqfin_audit('finance_operations_snapshot_refreshed', $workspaceid, 0, $workspaceid, [
        'targettype' => 'workspace_finance',
        'actorid' => $actorid,
        'metrics' => $metrics,
    ]);
    return $metrics;
}

function pqfin_api_request_hash(array $payload): string {
    ksort($payload);
    return hash('sha256', pqfin_metadata($payload));
}

function pqfin_begin_api_guard(
    int $workspaceid,
    $consumercontext,
    int $actorid,
    string $endpoint,
    string $idempotencykey,
    array $payload,
    int $limit = 60,
    int $windowseconds = 60
): array {
    global $DB;

    if (!pqfin_api_schema_ready()) {
        return ['status' => 'unguarded', 'recordid' => 0, 'cached' => false, 'response' => null];
    }
    $endpoint = core_text::substr(preg_replace('/[^a-zA-Z0-9_:-]/', '', $endpoint) ?? 'finance_api', 0, 120);
    $idempotencykey = core_text::substr(trim($idempotencykey), 0, 180);
    $idempotencyhash = $idempotencykey === '' ? '' : hash('sha256', $idempotencykey);
    $requesthash = pqfin_api_request_hash($payload);
    if ($idempotencykey !== '') {
        $existing = $DB->get_record_sql(
            "SELECT *
               FROM {local_prequran_finance_api}
              WHERE workspaceid = :workspaceid
                AND endpoint = :endpoint
                AND idempotencyhash = :idempotencyhash
           ORDER BY id DESC",
            ['workspaceid' => $workspaceid, 'endpoint' => $endpoint, 'idempotencyhash' => $idempotencyhash],
            IGNORE_MULTIPLE
        );
        if ($existing && (string)$existing->requesthash !== $requesthash) {
            throw new invalid_parameter_exception('This idempotency key was already used for a different finance API request.');
        }
        if ($existing && (string)$existing->status === 'accepted') {
            throw new moodle_exception('requestinprogress', '', '', 'This finance API request is already in progress.');
        }
        if ($existing && (string)$existing->status === 'completed') {
            $response = json_decode((string)$existing->responsejson, true);
            return ['status' => 'cached', 'recordid' => (int)$existing->id, 'cached' => true, 'response' => is_array($response) ? $response : null];
        }
    }
    $now = time();
    $windowstart = $now - max(10, $windowseconds);
    $recent = (int)$DB->count_records_select(
        'local_prequran_finance_api',
        "workspaceid = :workspaceid AND actorid = :actorid AND endpoint = :endpoint AND timecreated >= :windowstart",
        ['workspaceid' => $workspaceid, 'actorid' => $actorid, 'endpoint' => $endpoint, 'windowstart' => $windowstart]
    );
    if ($recent >= max(1, $limit)) {
        throw new moodle_exception('ratelimit', '', '', 'Finance API rate limit exceeded. Please retry later.');
    }
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $record = (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'actorid' => $actorid,
        'endpoint' => $endpoint,
        'idempotencykey' => $idempotencykey,
        'idempotencyhash' => $idempotencyhash,
        'requesthash' => $requesthash,
        'status' => 'accepted',
        'responseid' => 0,
        'responsejson' => '',
        'error' => '',
        'windowstart' => $windowstart,
        'expiresat' => $now + DAYSECS,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $recordid = (int)$DB->insert_record('local_prequran_finance_api', $record);
    return ['status' => 'accepted', 'recordid' => $recordid, 'cached' => false, 'response' => null];
}

function pqfin_complete_api_guard(int $recordid, array $response, int $responseid = 0, string $status = 'completed'): void {
    global $DB;

    if ($recordid <= 0 || !pqfin_api_schema_ready()) {
        return;
    }
    $DB->update_record('local_prequran_finance_api', (object)[
        'id' => $recordid,
        'status' => core_text::substr($status, 0, 40),
        'responseid' => $responseid,
        'responsejson' => pqfin_metadata($response),
        'timemodified' => time(),
    ]);
}

function pqfin_fail_api_guard(int $recordid, Throwable $e): void {
    global $DB;

    if ($recordid <= 0 || !pqfin_api_schema_ready()) {
        return;
    }
    $DB->update_record('local_prequran_finance_api', (object)[
        'id' => $recordid,
        'status' => 'failed',
        'error' => core_text::substr($e->getMessage(), 0, 1000),
        'timemodified' => time(),
    ]);
}

function pqfin_finance_hardening_report(int $workspaceid, $consumercontext = null): array {
    global $DB;

    $metrics = pqfin_operations_dashboard_metrics($workspaceid, $consumercontext);
    $warnings = [];
    $now = time();
    if (pqfin_gateway_schema_ready()) {
        $metrics['stale_payment_sessions'] = (int)$DB->count_records_select(
            'local_prequran_pay_session',
            "workspaceid = :workspaceid AND status = :status AND expiresat > 0 AND expiresat < :now",
            ['workspaceid' => $workspaceid, 'status' => 'pending', 'now' => $now]
        );
        $duplicates = $DB->get_records_sql(
            "SELECT idempotencykey, COUNT(*) AS duplicatecount
               FROM {local_prequran_pay_webhook}
              WHERE workspaceid = :workspaceid
                AND idempotencykey <> ''
           GROUP BY idempotencykey
             HAVING COUNT(*) > 1",
            ['workspaceid' => $workspaceid],
            0,
            50
        );
        $metrics['duplicate_webhook_keys'] = count($duplicates);
        if ($metrics['stale_payment_sessions'] > 0) {
            $warnings[] = 'Stale hosted payment sessions require provider reconciliation.';
        }
        if ($metrics['duplicate_webhook_keys'] > 0) {
            $warnings[] = 'Duplicate webhook idempotency keys were detected.';
        }
    } else {
        $metrics['stale_payment_sessions'] = 0;
        $metrics['duplicate_webhook_keys'] = 0;
    }
    if (pqfin_api_schema_ready()) {
        $metrics['failed_api_requests_24h'] = (int)$DB->count_records_select(
            'local_prequran_finance_api',
            "workspaceid = :workspaceid AND status = :status AND timecreated >= :since",
            ['workspaceid' => $workspaceid, 'status' => 'failed', 'since' => $now - DAYSECS]
        );
        if ($metrics['failed_api_requests_24h'] > 0) {
            $warnings[] = 'Finance API failures were recorded in the last 24 hours.';
        }
    } else {
        $metrics['failed_api_requests_24h'] = 0;
    }
    if (($metrics['overdue_invoices'] ?? 0) > 0) {
        $warnings[] = 'Overdue invoices are present.';
    }
    if (($metrics['finance_holds'] ?? 0) > 0) {
        $warnings[] = 'Active finance holds are present.';
    }
    return [
        'status' => $warnings ? 'review' : 'ok',
        'metrics' => $metrics,
        'warnings' => array_values(array_unique($warnings)),
    ];
}

function pqfin_refresh_finance_hardening_snapshot(int $workspaceid, $consumercontext = null, int $actorid = 0): array {
    global $DB;

    $report = pqfin_finance_hardening_report($workspaceid, $consumercontext);
    if (pqfin_api_schema_ready()) {
        $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
        $now = time();
        $DB->insert_record('local_prequran_finance_scale', (object)[
            'consumerid' => (int)($context->consumerid ?? 0),
            'workspaceid' => $workspaceid,
            'snapshotkey' => 'daily_hardening',
            'status' => (string)$report['status'],
            'metricsjson' => pqfin_metadata($report['metrics']),
            'warningsjson' => pqfin_metadata($report['warnings']),
            'checkedat' => $now,
            'createdby' => $actorid,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }
    pqfin_audit('finance_hardening_snapshot_refreshed', $workspaceid, 0, $workspaceid, [
        'targettype' => 'workspace_finance',
        'actorid' => $actorid,
        'status' => (string)$report['status'],
        'metrics' => $report['metrics'],
        'warnings' => $report['warnings'],
    ]);
    return $report;
}

function pqfin_money_to_cents(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $negative = strpos($value, '-') === 0;
    $value = preg_replace('/[^0-9.]/', '', $value) ?? '';
    if ($value === '' || substr_count($value, '.') > 1) {
        return 0;
    }
    [$whole, $decimal] = array_pad(explode('.', $value, 2), 2, '');
    $whole = preg_replace('/[^0-9]/', '', $whole) ?? '0';
    $decimal = preg_replace('/[^0-9]/', '', $decimal) ?? '';
    $decimal = str_pad(core_text::substr($decimal, 0, 2), 2, '0');
    $cents = ((int)$whole * 100) + (int)$decimal;
    return $negative ? -$cents : $cents;
}

function pqfin_cents_to_money(int $cents): string {
    $negative = $cents < 0;
    $cents = abs($cents);
    $whole = intdiv($cents, 100);
    $decimal = $cents % 100;
    return ($negative ? '-' : '') . $whole . '.' . str_pad((string)$decimal, 2, '0', STR_PAD_LEFT);
}

function pqfin_normalize_quantity(string $quantity): string {
    $quantity = trim($quantity);
    $quantity = preg_replace('/[^0-9]/', '', $quantity) ?? '';
    $quantity = $quantity === '' ? '1' : $quantity;
    return (string)max(1, min(999, (int)$quantity));
}

function pqfin_invoice_status_label(string $status): string {
    $labels = [
        'draft' => 'Draft',
        'issued' => 'Issued',
        'sent' => 'Sent',
        'partially_paid' => 'Partially paid',
        'paid' => 'Paid',
        'disputed' => 'Disputed',
        'void' => 'Void',
    ];
    return $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

function pqfin_payment_method_options(): array {
    return [
        'cash' => 'Cash',
        'bank_transfer' => 'Bank transfer',
        'check' => 'Check',
        'mobile_money' => 'Mobile money',
        'hosted_gateway' => 'Hosted payment gateway',
        'sponsor_transfer' => 'Sponsor transfer',
        'internal_scholarship' => 'Internal scholarship allocation',
        'admin_adjustment' => 'Admin adjustment',
    ];
}

function pqfin_payment_method_label(string $method): string {
    $options = pqfin_payment_method_options();
    return $options[$method] ?? ucfirst(str_replace('_', ' ', $method));
}

function pqfin_payment_plan_status_label(string $status): string {
    $labels = [
        'draft' => 'Draft',
        'active' => 'Active',
        'past_due' => 'Past due',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled',
    ];
    return $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

function pqfin_installment_status_label(string $status): string {
    $labels = [
        'scheduled' => 'Scheduled',
        'partial' => 'Partially paid',
        'paid' => 'Paid',
        'past_due' => 'Past due',
        'cancelled' => 'Cancelled',
    ];
    return $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

function pqfin_invoice_belongs_to_workspace(int $invoiceid, int $workspaceid, $consumercontext = null) {
    global $DB;

    if ($invoiceid <= 0 || $workspaceid <= 0 || !pqfin_invoice_schema_ready()) {
        return false;
    }
    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', IGNORE_MISSING);
    if (!$invoice || (int)$invoice->workspaceid !== $workspaceid) {
        return false;
    }
    return pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid') ? $invoice : false;
}

function pqfin_invoice_payer_visible_statuses(): array {
    return ['issued', 'sent', 'partially_paid', 'paid'];
}

function pqfin_parent_can_access_student(int $parentid, int $studentid): bool {
    global $DB;

    if ($parentid <= 0 || $studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (pqh_table_exists_safe($table) && $DB->record_exists($table, ['guardianid' => $parentid, 'studentid' => $studentid])) {
            return true;
        }
    }
    return pqh_table_exists_safe('local_prequran_comm_thread')
        && pqh_table_exists_safe('local_prequran_comm_participant')
        && $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = ?
                AND p.role = ?
                AND t.studentid = ?",
            [$parentid, 'parent', $studentid]
        );
}

function pqfin_student_billing_visible(int $workspaceid, int $studentid, int $viewerid, $consumercontext = null): bool {
    $policyinfo = pqfin_workspace_finance_policy($workspaceid, $consumercontext);
    $policy = pqfin_normalize_policy($policyinfo['policy']);
    $visibility = (string)$policy['student_billing_visibility'];
    if ($visibility === 'enabled_for_all') {
        return true;
    }
    if ($visibility === 'enabled_for_adult_learners' && $viewerid === $studentid) {
        return true;
    }
    return pqfin_user_can_manage_workspace_finance($viewerid, $workspaceid);
}

function pqfin_sponsor_billing_visible(int $workspaceid, int $viewerid, $consumercontext = null): bool {
    $policyinfo = pqfin_workspace_finance_policy($workspaceid, $consumercontext);
    $policy = pqfin_normalize_policy($policyinfo['policy']);
    return (string)$policy['sponsor_billing_visibility'] === 'assigned_invoices_only'
        || pqfin_user_can_manage_workspace_finance($viewerid, $workspaceid);
}

function pqfin_invoice_rows_for_student(int $workspaceid, int $studentid, int $viewerid, $consumercontext = null): array {
    global $DB;

    if (!pqfin_invoice_schema_ready() || $workspaceid <= 0 || $studentid <= 0
            || !pqfin_student_billing_visible($workspaceid, $studentid, $viewerid, $consumercontext)) {
        return [];
    }
    [$statussql, $params] = $DB->get_in_or_equal(pqfin_invoice_payer_visible_statuses(), SQL_PARAMS_NAMED, 'status');
    $params['workspaceid'] = $workspaceid;
    $params['studentid'] = $studentid;
    return array_values($DB->get_records_sql(
        "SELECT i.*, ba.displayname AS accountname, ba.billingemail,
                w.name AS workspace_name, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_invoice} i
           JOIN {local_prequran_billing_account} ba ON ba.id = i.billingaccountid
           JOIN {local_prequran_workspace} w ON w.id = i.workspaceid
      LEFT JOIN {user} u ON u.id = i.studentid
          WHERE i.workspaceid = :workspaceid
            AND i.studentid = :studentid
            AND i.status {$statussql}
       ORDER BY i.dueat ASC, i.timemodified DESC, i.id DESC",
        $params,
        0,
        100
    ));
}

function pqfin_invoice_rows_for_parent(int $workspaceid, int $parentid, array $studentids, $consumercontext = null): array {
    global $DB;

    $studentids = array_values(array_filter(array_unique(array_map('intval', $studentids)), static fn(int $id): bool => $id > 0));
    if (!pqfin_invoice_schema_ready() || $workspaceid <= 0 || !$studentids) {
        return [];
    }
    $allowed = [];
    foreach ($studentids as $studentid) {
        if (pqfin_parent_can_access_student($parentid, $studentid)
                && pqfin_student_billing_visible($workspaceid, $studentid, $parentid, $consumercontext)) {
            $allowed[] = $studentid;
        }
    }
    if (!$allowed) {
        return [];
    }
    [$studentsql, $studentparams] = $DB->get_in_or_equal($allowed, SQL_PARAMS_NAMED, 'student');
    [$statussql, $statusparams] = $DB->get_in_or_equal(pqfin_invoice_payer_visible_statuses(), SQL_PARAMS_NAMED, 'status');
    $params = $studentparams + $statusparams + ['workspaceid' => $workspaceid];
    return array_values($DB->get_records_sql(
        "SELECT i.*, ba.displayname AS accountname, ba.billingemail,
                w.name AS workspace_name, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_invoice} i
           JOIN {local_prequran_billing_account} ba ON ba.id = i.billingaccountid
           JOIN {local_prequran_workspace} w ON w.id = i.workspaceid
      LEFT JOIN {user} u ON u.id = i.studentid
          WHERE i.workspaceid = :workspaceid
            AND i.studentid {$studentsql}
            AND i.status {$statussql}
       ORDER BY i.dueat ASC, i.timemodified DESC, i.id DESC",
        $params,
        0,
        150
    ));
}

function pqfin_invoice_rows_for_sponsor(int $workspaceid, int $sponsorid, $consumercontext = null): array {
    global $DB;

    if (!pqfin_invoice_schema_ready() || $workspaceid <= 0 || $sponsorid <= 0
            || !pqfin_sponsor_billing_visible($workspaceid, $sponsorid, $consumercontext)) {
        return [];
    }
    [$statussql, $params] = $DB->get_in_or_equal(pqfin_invoice_payer_visible_statuses(), SQL_PARAMS_NAMED, 'status');
    $params['workspaceid'] = $workspaceid;
    $params['sponsorid'] = $sponsorid;
    return array_values($DB->get_records_sql(
        "SELECT i.*, ba.displayname AS accountname, ba.billingemail,
                w.name AS workspace_name, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_invoice} i
           JOIN {local_prequran_billing_account} ba ON ba.id = i.billingaccountid
           JOIN {local_prequran_workspace} w ON w.id = i.workspaceid
      LEFT JOIN {user} u ON u.id = i.studentid
          WHERE i.workspaceid = :workspaceid
            AND ba.accounttype = 'sponsor'
            AND ba.primaryuserid = :sponsorid
            AND i.status {$statussql}
       ORDER BY i.dueat ASC, i.timemodified DESC, i.id DESC",
        $params,
        0,
        150
    ));
}

function pqfin_user_can_view_hosted_invoice($invoice, int $userid, $consumercontext = null): bool {
    global $DB;

    if (!$invoice || $userid <= 0 || !pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        return false;
    }
    $workspaceid = (int)$invoice->workspaceid;
    if (pqfin_user_can_manage_workspace_finance($userid, $workspaceid)) {
        return true;
    }
    if (!in_array((string)$invoice->status, pqfin_invoice_payer_visible_statuses(), true)) {
        return false;
    }
    if ((int)$invoice->studentid === $userid && pqfin_student_billing_visible($workspaceid, (int)$invoice->studentid, $userid, $consumercontext)) {
        return true;
    }
    if (pqfin_parent_can_access_student($userid, (int)$invoice->studentid)
            && pqfin_student_billing_visible($workspaceid, (int)$invoice->studentid, $userid, $consumercontext)) {
        return true;
    }
    $account = $DB->get_record('local_prequran_billing_account', ['id' => (int)$invoice->billingaccountid], '*', IGNORE_MISSING);
    return $account
        && (string)$account->accounttype === 'sponsor'
        && (int)$account->primaryuserid === $userid
        && pqfin_sponsor_billing_visible($workspaceid, $userid, $consumercontext);
}

function pqfin_secure_link_token_hash(string $token): string {
    return hash('sha256', trim($token));
}

function pqfin_secure_link_ttl(string $purpose): int {
    if ($purpose === 'receipt_view') {
        return 60 * DAYSECS;
    }
    return 30 * DAYSECS;
}

function pqfin_domain_aware_url(int $workspaceid, $consumercontext, string $path, array $params = []): moodle_url {
    global $CFG, $DB;

    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    if (!empty($context->consumerslug) && !isset($params['consumer'])) {
        $params['consumer'] = (string)$context->consumerslug;
    }
    if ($workspaceid > 0 && !isset($params['workspaceid'])) {
        $params['workspaceid'] = $workspaceid;
    }
    $relative = (new moodle_url($path, $params))->out_as_local_url(false);
    $domain = '';
    if (pqh_table_exists_safe('local_prequran_consumer_domain') && (int)($context->consumerid ?? 0) > 0) {
        $domain = (string)$DB->get_field_sql(
            "SELECT domain
               FROM {local_prequran_consumer_domain}
              WHERE consumerid = :consumerid
                AND (workspaceid = :workspaceid OR workspaceid = 0)
                AND status = :status
           ORDER BY isprimary DESC, workspaceid DESC, id ASC",
            ['consumerid' => (int)$context->consumerid, 'workspaceid' => $workspaceid, 'status' => 'active'],
            IGNORE_MULTIPLE
        );
    }
    if ($domain !== '') {
        return new moodle_url('https://' . $domain . $relative);
    }
    return new moodle_url((string)$CFG->wwwroot . $relative);
}

function pqfin_create_secure_link(string $purpose, int $targetid, $consumercontext, int $actorid, array $metadata = []): array {
    global $DB;

    if (!pqfin_notification_schema_ready()) {
        throw new invalid_parameter_exception('Finance notification schema is not ready.');
    }
    $purpose = in_array($purpose, ['invoice_view', 'receipt_view'], true) ? $purpose : 'invoice_view';
    $invoice = null;
    $payment = null;
    if ($purpose === 'receipt_view') {
        $payment = $DB->get_record('local_prequran_payment', ['id' => $targetid], '*', MUST_EXIST);
        $allocations = pqfin_payment_allocations($targetid);
        foreach ($allocations as $allocation) {
            if ((int)$allocation->invoiceid > 0) {
                $invoice = $DB->get_record('local_prequran_invoice', ['id' => (int)$allocation->invoiceid], '*', IGNORE_MISSING);
                break;
            }
        }
    } else {
        $invoice = $DB->get_record('local_prequran_invoice', ['id' => $targetid], '*', MUST_EXIST);
    }
    $source = $purpose === 'receipt_view' ? $payment : $invoice;
    if (!$source || !pqh_record_belongs_to_consumer_context($source, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Finance link target is outside this workspace.');
    }
    $workspaceid = (int)$source->workspaceid;
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $token = random_string(48);
    $now = time();
    $record = (object)[
        'consumerid' => (int)($source->consumerid ?? $context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'billingaccountid' => (int)($source->billingaccountid ?? 0),
        'studentid' => (int)($source->studentid ?? 0),
        'invoiceid' => (int)($invoice->id ?? 0),
        'paymentid' => (int)($payment->id ?? 0),
        'purpose' => $purpose,
        'targettype' => $purpose === 'receipt_view' ? 'payment' : 'invoice',
        'targetid' => $targetid,
        'tokenhash' => pqfin_secure_link_token_hash($token),
        'status' => 'active',
        'expiresat' => $now + pqfin_secure_link_ttl($purpose),
        'revokedat' => 0,
        'lastusedat' => 0,
        'usecount' => 0,
        'metadatajson' => pqfin_metadata($metadata),
        'createdby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $linkid = (int)$DB->insert_record('local_prequran_finance_link', $record);
    $path = $purpose === 'receipt_view' ? '/local/hubredirect/payment_receipt.php' : '/local/hubredirect/invoice_view.php';
    $params = $purpose === 'receipt_view'
        ? ['paymentid' => $targetid, 'financetoken' => $token]
        : ['invoiceid' => $targetid, 'financetoken' => $token];
    $url = pqfin_domain_aware_url($workspaceid, $context, $path, $params);
    pqfin_audit('finance_secure_link_created', $workspaceid, (int)$record->studentid, $linkid, [
        'targettype' => 'finance_link',
        'consumerid' => (int)$record->consumerid,
        'billingaccountid' => (int)$record->billingaccountid,
        'invoiceid' => (int)$record->invoiceid,
        'paymentid' => (int)$record->paymentid,
        'purpose' => $purpose,
        'expiresat' => (int)$record->expiresat,
        'actorid' => $actorid,
    ]);
    return ['id' => $linkid, 'token' => $token, 'url' => $url, 'record' => $record];
}

function pqfin_validate_secure_link(string $purpose, int $targetid, string $token) {
    global $DB;

    $token = trim($token);
    if ($token === '' || $targetid <= 0 || !pqfin_notification_schema_ready()) {
        return false;
    }
    $link = $DB->get_record('local_prequran_finance_link', [
        'purpose' => $purpose,
        'targetid' => $targetid,
        'tokenhash' => pqfin_secure_link_token_hash($token),
    ], '*', IGNORE_MISSING);
    if (!$link || (string)$link->status !== 'active' || (int)$link->revokedat > 0 || ((int)$link->expiresat > 0 && (int)$link->expiresat < time())) {
        if ($link) {
            pqfin_audit('finance_secure_link_rejected', (int)$link->workspaceid, (int)$link->studentid, (int)$link->id, [
                'targettype' => 'finance_link',
                'consumerid' => (int)$link->consumerid,
                'invoiceid' => (int)$link->invoiceid,
                'paymentid' => (int)$link->paymentid,
                'purpose' => $purpose,
                'reason' => (string)$link->status !== 'active' ? 'inactive' : (((int)$link->revokedat > 0) ? 'revoked' : 'expired'),
            ]);
        }
        return false;
    }
    $link->lastusedat = time();
    $link->usecount = ((int)$link->usecount) + 1;
    $link->timemodified = time();
    $DB->update_record('local_prequran_finance_link', $link);
    pqfin_audit('finance_secure_link_used', (int)$link->workspaceid, (int)$link->studentid, (int)$link->id, [
        'targettype' => 'finance_link',
        'consumerid' => (int)$link->consumerid,
        'invoiceid' => (int)$link->invoiceid,
        'paymentid' => (int)$link->paymentid,
        'purpose' => $purpose,
    ]);
    return $link;
}

function pqfin_revoke_secure_links(string $purpose, int $targetid, int $workspaceid, int $actorid): int {
    global $DB;

    if (!pqfin_notification_schema_ready()) {
        return 0;
    }
    $links = $DB->get_records('local_prequran_finance_link', [
        'workspaceid' => $workspaceid,
        'purpose' => $purpose,
        'targetid' => $targetid,
        'status' => 'active',
    ]);
    $count = 0;
    foreach ($links as $link) {
        $link->status = 'revoked';
        $link->revokedat = time();
        $link->timemodified = time();
        $DB->update_record('local_prequran_finance_link', $link);
        $count++;
    }
    if ($count > 0) {
        pqfin_audit('finance_secure_links_revoked', $workspaceid, 0, $targetid, [
            'targettype' => $purpose === 'receipt_view' ? 'payment' : 'invoice',
            'purpose' => $purpose,
            'count' => $count,
            'actorid' => $actorid,
        ]);
    }
    return $count;
}

function pqfin_notification_recipients_for_invoice($invoice): array {
    global $DB;

    if (!$invoice) {
        return [];
    }
    $recipients = [];
    $account = $DB->get_record('local_prequran_billing_account', ['id' => (int)$invoice->billingaccountid], '*', IGNORE_MISSING);
    if ($account && (int)$account->primaryuserid > 0) {
        $recipients[(int)$account->primaryuserid] = (int)$account->primaryuserid;
    }
    foreach (pqfin_parent_ids_for_student((int)$invoice->studentid, (int)$invoice->workspaceid) as $parentid) {
        $recipients[(int)$parentid] = (int)$parentid;
    }
    if ((int)$invoice->studentid > 0) {
        $recipients[(int)$invoice->studentid] = (int)$invoice->studentid;
    }
    return array_values($recipients);
}

function pqfin_workspace_finance_admin_ids(int $workspaceid): array {
    global $DB;

    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return array_map(static fn($admin): int => (int)$admin->id, get_admins());
    }
    [$rolesql, $params] = $DB->get_in_or_equal(['owner', 'admin', 'coordinator'], SQL_PARAMS_NAMED, 'role');
    $params['workspaceid'] = $workspaceid;
    $params['status'] = 'active';
    $ids = $DB->get_fieldset_select(
        'local_prequran_workspace_member',
        'userid',
        "workspaceid = :workspaceid AND status = :status AND workspace_role {$rolesql}",
        $params
    );
    $ids = array_values(array_unique(array_map('intval', $ids)));
    return $ids ?: array_map(static fn($admin): int => (int)$admin->id, get_admins());
}

function pqfin_finance_message_template(string $eventtype, $invoice = null, $payment = null): array {
    $number = trim((string)($invoice->invoicenumber ?? 'invoice'));
    $receipt = trim((string)($payment->receiptnumber ?? 'receipt'));
    $balance = trim((string)($invoice->balancedue ?? ''));
    $templates = [
        'invoice_issued' => ['Invoice issued', 'A tuition invoice has been issued: ' . $number . '. Balance due: ' . $balance . '.'],
        'payment_received' => ['Payment received', 'A tuition payment has been recorded. Receipt: ' . $receipt . '.'],
        'payment_failed' => ['Payment needs attention', 'A tuition payment attempt could not be completed. Please contact the finance office.'],
        'payment_due_soon' => ['Invoice due soon', 'A tuition invoice is due soon: ' . $number . '.'],
        'payment_overdue' => ['Invoice overdue', 'A tuition invoice is overdue: ' . $number . '.'],
        'receipt_available' => ['Receipt available', 'A receipt is available for your tuition payment: ' . $receipt . '.'],
        'refund_processed' => ['Refund processed', 'A tuition refund has been recorded for invoice ' . $number . '.'],
        'credit_note_issued' => ['Credit note issued', 'A credit note has been issued for invoice ' . $number . '.'],
        'finance_hold_added' => ['Finance hold added', 'A finance hold has been added to the student billing account.'],
        'finance_hold_resolved' => ['Finance hold resolved', 'A finance hold has been resolved for the student billing account.'],
        'admin_exception_alert' => ['Finance exception alert', 'A finance exception needs admin review.'],
    ];
    return $templates[$eventtype] ?? ['Finance update', 'A finance update is available.'];
}

function pqfin_send_finance_message(int $recipientid, string $eventtype, string $subject, string $message, moodle_url $url, string $urlname, array $details): bool {
    global $DB;

    $recipient = core_user::get_user($recipientid, '*', IGNORE_MISSING);
    $now = time();
    $deliveryid = 0;
    if (pqfin_notification_schema_ready()) {
        $deliveryid = (int)$DB->insert_record('local_prequran_finance_delivery', (object)[
            'consumerid' => (int)($details['consumerid'] ?? 0),
            'workspaceid' => (int)($details['workspaceid'] ?? 0),
            'billingaccountid' => (int)($details['billingaccountid'] ?? 0),
            'studentid' => (int)($details['studentid'] ?? 0),
            'invoiceid' => (int)($details['invoiceid'] ?? 0),
            'paymentid' => (int)($details['paymentid'] ?? 0),
            'linkid' => (int)($details['linkid'] ?? 0),
            'recipientid' => $recipientid,
            'recipientemail' => core_text::substr((string)($recipient->email ?? ''), 0, 255),
            'eventtype' => core_text::substr($eventtype, 0, 80),
            'status' => 'pending',
            'subject' => core_text::substr($subject, 0, 255),
            'messagebody' => $message,
            'error' => '',
            'metadatajson' => pqfin_metadata($details),
            'sentat' => 0,
            'createdby' => (int)($details['actorid'] ?? 0),
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }
    if (!$recipient || !empty($recipient->deleted) || !empty($recipient->suspended)) {
        if ($deliveryid > 0) {
            $DB->set_field('local_prequran_finance_delivery', 'status', 'skipped', ['id' => $deliveryid]);
            $DB->set_field('local_prequran_finance_delivery', 'error', 'recipient unavailable', ['id' => $deliveryid]);
        }
        return false;
    }
    $body = $message . "\n\nOpen: " . $url->out(false);
    $eventdata = new \core\message\message();
    $eventdata->component = 'local_prequran';
    $eventdata->name = 'finance_update';
    $eventdata->userfrom = function_exists('local_prequran_notify_sender_user') ? local_prequran_notify_sender_user() : core_user::get_noreply_user();
    $eventdata->userto = $recipient;
    $eventdata->subject = $subject;
    $eventdata->fullmessage = $body;
    $eventdata->fullmessageformat = FORMAT_PLAIN;
    $eventdata->fullmessagehtml = nl2br(s($body));
    $eventdata->smallmessage = $subject;
    $eventdata->notification = 1;
    $eventdata->contexturl = $url->out(false);
    $eventdata->contexturlname = $urlname;
    try {
        $messageid = message_send($eventdata);
        if ($deliveryid > 0) {
            $DB->update_record('local_prequran_finance_delivery', (object)[
                'id' => $deliveryid,
                'status' => 'sent',
                'metadatajson' => pqfin_metadata($details + ['messageid' => $messageid]),
                'sentat' => time(),
                'timemodified' => time(),
            ]);
        }
        pqfin_audit('finance_notification_sent', (int)($details['workspaceid'] ?? 0), (int)($details['studentid'] ?? 0), $deliveryid, $details + [
            'targettype' => 'finance_delivery',
            'recipientid' => $recipientid,
            'eventtype' => $eventtype,
        ]);
        return true;
    } catch (Throwable $e) {
        if ($deliveryid > 0) {
            $DB->update_record('local_prequran_finance_delivery', (object)[
                'id' => $deliveryid,
                'status' => 'failed',
                'error' => $e->getMessage(),
                'timemodified' => time(),
            ]);
        }
        pqfin_audit('finance_notification_failed', (int)($details['workspaceid'] ?? 0), (int)($details['studentid'] ?? 0), $deliveryid, $details + [
            'targettype' => 'finance_delivery',
            'recipientid' => $recipientid,
            'eventtype' => $eventtype,
            'error' => $e->getMessage(),
        ]);
        return false;
    }
}

function pqfin_send_invoice_notification(int $invoiceid, string $eventtype, $consumercontext, int $actorid): int {
    global $DB;

    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    $link = pqfin_create_secure_link('invoice_view', $invoiceid, $consumercontext, $actorid, ['eventtype' => $eventtype]);
    [$subject, $message] = pqfin_finance_message_template($eventtype, $invoice, null);
    $sent = 0;
    foreach (pqfin_notification_recipients_for_invoice($invoice) as $recipientid) {
        if (pqfin_send_finance_message((int)$recipientid, $eventtype, $subject, $message, $link['url'], 'Open invoice', [
            'consumerid' => (int)$invoice->consumerid,
            'workspaceid' => (int)$invoice->workspaceid,
            'billingaccountid' => (int)$invoice->billingaccountid,
            'studentid' => (int)$invoice->studentid,
            'invoiceid' => $invoiceid,
            'linkid' => (int)$link['id'],
            'actorid' => $actorid,
        ])) {
            $sent++;
        }
    }
    return $sent;
}

function pqfin_send_receipt_notification(int $paymentid, string $eventtype, $consumercontext, int $actorid): int {
    global $DB;

    $payment = $DB->get_record('local_prequran_payment', ['id' => $paymentid], '*', MUST_EXIST);
    $invoice = null;
    foreach (pqfin_payment_allocations($paymentid) as $allocation) {
        if ((int)$allocation->invoiceid > 0) {
            $invoice = $DB->get_record('local_prequran_invoice', ['id' => (int)$allocation->invoiceid], '*', IGNORE_MISSING);
            break;
        }
    }
    $link = pqfin_create_secure_link('receipt_view', $paymentid, $consumercontext, $actorid, ['eventtype' => $eventtype]);
    [$subject, $message] = pqfin_finance_message_template($eventtype, $invoice, $payment);
    $sent = 0;
    $recipients = $invoice ? pqfin_notification_recipients_for_invoice($invoice) : [];
    foreach ($recipients as $recipientid) {
        if (pqfin_send_finance_message((int)$recipientid, $eventtype, $subject, $message, $link['url'], 'Open receipt', [
            'consumerid' => (int)$payment->consumerid,
            'workspaceid' => (int)$payment->workspaceid,
            'billingaccountid' => (int)$payment->billingaccountid,
            'studentid' => (int)$payment->studentid,
            'invoiceid' => (int)($invoice->id ?? 0),
            'paymentid' => $paymentid,
            'linkid' => (int)$link['id'],
            'actorid' => $actorid,
        ])) {
            $sent++;
        }
    }
    return $sent;
}

function pqfin_send_admin_exception_alert(int $workspaceid, $consumercontext, int $actorid = 0): int {
    $exceptions = pqfin_enrollment_finance_exceptions($workspaceid, $consumercontext, 1000);
    $count = count($exceptions['paid_not_enrolled']) + count($exceptions['enrolled_unpaid']);
    if ($count <= 0) {
        return 0;
    }
    [$subject, $message] = pqfin_finance_message_template('admin_exception_alert');
    $message .= "\n\nPaid but not enrolled: " . count($exceptions['paid_not_enrolled'])
        . "\nEnrolled but unpaid: " . count($exceptions['enrolled_unpaid']);
    $url = pqfin_domain_aware_url($workspaceid, $consumercontext, '/local/hubredirect/finance_operations.php', ['report' => 'exceptions']);
    $sent = 0;
    foreach (pqfin_workspace_finance_admin_ids($workspaceid) as $recipientid) {
        if (pqfin_send_finance_message((int)$recipientid, 'admin_exception_alert', $subject, $message, $url, 'Open finance exceptions', [
            'workspaceid' => $workspaceid,
            'eventtype' => 'admin_exception_alert',
            'exception_count' => $count,
            'paid_not_enrolled' => count($exceptions['paid_not_enrolled']),
            'enrolled_unpaid' => count($exceptions['enrolled_unpaid']),
            'actorid' => $actorid,
        ])) {
            $sent++;
        }
    }
    return $sent;
}

function pqfin_gateway_status_map(string $eventtype, string $providerstatus = ''): string {
    $value = strtolower(trim($providerstatus !== '' ? $providerstatus : $eventtype));
    $map = [
        'payment.pending' => 'pending',
        'pending' => 'pending',
        'payment.authorized' => 'authorized',
        'authorized' => 'authorized',
        'payment.succeeded' => 'succeeded',
        'checkout.session.completed' => 'succeeded',
        'succeeded' => 'succeeded',
        'paid' => 'succeeded',
        'payment.failed' => 'failed',
        'failed' => 'failed',
        'payment.cancelled' => 'cancelled',
        'canceled' => 'cancelled',
        'cancelled' => 'cancelled',
        'refund.processed' => 'refunded',
        'refunded' => 'refunded',
        'partially_refunded' => 'partially_refunded',
        'dispute.created' => 'disputed',
        'disputed' => 'disputed',
        'payment.reversed' => 'reversed',
        'reversed' => 'reversed',
    ];
    return $map[$value] ?? 'pending';
}

function pqfin_platform_gateway_config(): array {
    $enabled = (int)get_config('local_prequran', 'finance_payment_enabled') === 1;
    return [
        'id' => 0,
        'scope' => 'platform',
        'consumerid' => 0,
        'workspaceid' => 0,
        'provider' => trim((string)get_config('local_prequran', 'finance_payment_provider')) ?: 'generic_hosted',
        'mode' => trim((string)get_config('local_prequran', 'finance_payment_mode')) === 'live' ? 'live' : 'test',
        'accountid' => trim((string)get_config('local_prequran', 'finance_payment_account_id')),
        'displayname' => 'Platform hosted payments',
        'checkoutbaseurl' => trim((string)get_config('local_prequran', 'finance_payment_checkout_base_url')),
        'apikey' => trim((string)get_config('local_prequran', 'finance_payment_api_key')),
        'webhooksecret' => trim((string)get_config('local_prequran', 'finance_payment_webhook_secret')),
        'status' => $enabled ? 'active' : 'disabled',
        'source' => 'platform_config',
    ];
}

function pqfin_effective_gateway_config(int $workspaceid, $consumercontext = null): array {
    global $DB;

    $fallback = pqfin_platform_gateway_config();
    if (!pqfin_gateway_schema_ready()) {
        return $fallback;
    }
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $records = [];
    if ($workspaceid > 0) {
        $record = $DB->get_record('local_prequran_pay_provider', [
            'workspaceid' => $workspaceid,
            'scope' => 'workspace',
            'status' => 'active',
        ], '*', IGNORE_MISSING);
        if ($record) {
            $records[] = $record;
        }
    }
    if ((int)($context->consumerid ?? 0) > 0) {
        $record = $DB->get_record('local_prequran_pay_provider', [
            'consumerid' => (int)$context->consumerid,
            'workspaceid' => 0,
            'scope' => 'consumer',
            'status' => 'active',
        ], '*', IGNORE_MISSING);
        if ($record) {
            $records[] = $record;
        }
    }
    foreach ($records as $record) {
        return [
            'id' => (int)$record->id,
            'scope' => (string)$record->scope,
            'consumerid' => (int)$record->consumerid,
            'workspaceid' => (int)$record->workspaceid,
            'provider' => (string)$record->provider,
            'mode' => (string)$record->mode,
            'accountid' => (string)$record->accountid,
            'displayname' => (string)$record->displayname,
            'checkoutbaseurl' => (string)$record->checkoutbaseurl,
            'apikey' => (string)$record->apikey,
            'webhooksecret' => (string)$record->webhooksecret,
            'status' => (string)$record->status,
            'source' => 'database',
        ];
    }
    return $fallback;
}

function pqfin_gateway_config_ready(array $config): bool {
    return (string)($config['status'] ?? '') === 'active'
        && trim((string)($config['checkoutbaseurl'] ?? '')) !== ''
        && trim((string)($config['webhooksecret'] ?? '')) !== '';
}

function pqfin_save_workspace_gateway_config(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;

    if (!pqfin_gateway_schema_ready() || !pqfin_user_can_manage_workspace_finance($actorid, $workspaceid)) {
        throw new invalid_parameter_exception('Payment provider configuration cannot be saved.');
    }
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $now = time();
    $existing = $DB->get_record('local_prequran_pay_provider', [
        'workspaceid' => $workspaceid,
        'scope' => 'workspace',
    ], '*', IGNORE_MISSING);
    $record = (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'scope' => 'workspace',
        'provider' => core_text::substr(trim((string)($data['provider'] ?? 'generic_hosted')), 0, 80),
        'mode' => (string)($data['mode'] ?? 'test') === 'live' ? 'live' : 'test',
        'accountid' => core_text::substr(trim((string)($data['accountid'] ?? '')), 0, 120),
        'displayname' => core_text::substr(trim((string)($data['displayname'] ?? 'Workspace hosted payments')), 0, 255),
        'checkoutbaseurl' => core_text::substr(trim((string)($data['checkoutbaseurl'] ?? '')), 0, 255),
        'apikey' => trim((string)($data['apikey'] ?? ($existing->apikey ?? ''))),
        'webhooksecret' => trim((string)($data['webhooksecret'] ?? ($existing->webhooksecret ?? ''))),
        'status' => (string)($data['status'] ?? 'disabled') === 'active' ? 'active' : 'disabled',
        'metadatajson' => pqfin_metadata(['source' => 'workspace_admin']),
        'createdby' => (int)($existing->createdby ?? $actorid),
        'modifiedby' => $actorid,
        'timecreated' => (int)($existing->timecreated ?? $now),
        'timemodified' => $now,
    ];
    if ($record->provider === '') {
        $record->provider = 'generic_hosted';
    }
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_pay_provider', $record);
        $id = (int)$existing->id;
    } else {
        $id = (int)$DB->insert_record('local_prequran_pay_provider', $record);
    }
    pqfin_audit('payment_provider_config_saved', $workspaceid, 0, $id, [
        'targettype' => 'payment_provider',
        'consumerid' => (int)$record->consumerid,
        'provider' => (string)$record->provider,
        'mode' => (string)$record->mode,
        'status' => (string)$record->status,
        'actorid' => $actorid,
    ]);
    return $id;
}

function pqfin_next_payable_installment_for_invoice(int $invoiceid) {
    global $DB;

    if ($invoiceid <= 0 || !pqfin_payment_plan_schema_ready()) {
        return false;
    }
    return $DB->get_record_sql(
        "SELECT ins.*
           FROM {local_prequran_payment_install} ins
           JOIN {local_prequran_payment_plan} p ON p.id = ins.planid
          WHERE ins.invoiceid = :invoiceid
            AND p.status IN ('active', 'past_due')
            AND ins.status IN ('scheduled', 'partial', 'past_due')
            AND ins.balancedue <> '0.00'
       ORDER BY ins.dueat ASC, ins.installmentnumber ASC, ins.id ASC",
        ['invoiceid' => $invoiceid],
        IGNORE_MULTIPLE
    );
}

function pqfin_create_hosted_payment_session(int $invoiceid, $consumercontext, int $actorid): array {
    global $DB;

    if (!pqfin_gateway_schema_ready() || !pqfin_invoice_schema_ready()) {
        throw new invalid_parameter_exception('Hosted payment schema is not ready.');
    }
    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Invoice is outside this workspace.');
    }
    if (!in_array((string)$invoice->status, ['issued', 'sent', 'partially_paid'], true)) {
        throw new invalid_parameter_exception('Only open issued invoices can be paid online.');
    }
    $balancecents = pqfin_money_to_cents((string)$invoice->balancedue);
    if ($balancecents <= 0) {
        throw new invalid_parameter_exception('This invoice has no balance due.');
    }
    $chargecents = $balancecents;
    $planmetadata = [];
    $installment = pqfin_next_payable_installment_for_invoice($invoiceid);
    if ($installment) {
        $installmentcents = pqfin_money_to_cents((string)$installment->balancedue);
        if ($installmentcents > 0) {
            $chargecents = min($balancecents, $installmentcents);
            $planmetadata = [
                'paymentplanid' => (int)$installment->planid,
                'installmentid' => (int)$installment->id,
                'installmentnumber' => (int)$installment->installmentnumber,
            ];
        }
    }
    $config = pqfin_effective_gateway_config((int)$invoice->workspaceid, $consumercontext);
    if (!pqfin_gateway_config_ready($config)) {
        throw new invalid_parameter_exception('Hosted payments are not configured for this workspace.');
    }
    $now = time();
    $localsessionid = 'pqpay_' . random_string(32);
    $returnurl = pqfin_domain_aware_url((int)$invoice->workspaceid, $consumercontext, '/local/hubredirect/invoice_view.php', ['invoiceid' => $invoiceid, 'payment_return' => '1']);
    $cancelurl = pqfin_domain_aware_url((int)$invoice->workspaceid, $consumercontext, '/local/hubredirect/invoice_view.php', ['invoiceid' => $invoiceid, 'payment_cancelled' => '1']);
    $checkouturl = new moodle_url((string)$config['checkoutbaseurl'], [
        'session_id' => $localsessionid,
        'invoice_id' => $invoiceid,
        'invoice_number' => (string)$invoice->invoicenumber,
        'amount' => pqfin_cents_to_money($chargecents),
        'currency' => (string)$invoice->currency,
        'mode' => (string)$config['mode'],
        'return_url' => $returnurl->out(false),
        'cancel_url' => $cancelurl->out(false),
    ]);
    $session = (object)[
        'consumerid' => (int)$invoice->consumerid,
        'workspaceid' => (int)$invoice->workspaceid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'studentid' => (int)$invoice->studentid,
        'invoiceid' => $invoiceid,
        'providerconfigid' => (int)$config['id'],
        'provider' => (string)$config['provider'],
        'mode' => (string)$config['mode'],
        'localsessionid' => $localsessionid,
        'providersessionid' => '',
        'providertransactionid' => '',
        'status' => 'pending',
        'currency' => (string)$invoice->currency,
        'amount' => pqfin_cents_to_money($chargecents),
        'checkouturl' => $checkouturl->out(false),
        'returnurl' => $returnurl->out(false),
        'cancelurl' => $cancelurl->out(false),
        'metadatajson' => pqfin_metadata(['config_source' => (string)$config['source'], 'accountid' => (string)$config['accountid']] + $planmetadata),
        'expiresat' => $now + DAYSECS,
        'completedat' => 0,
        'createdby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $session->id = (int)$DB->insert_record('local_prequran_pay_session', $session);
    pqfin_audit('hosted_payment_session_created', (int)$invoice->workspaceid, (int)$invoice->studentid, (int)$session->id, [
        'targettype' => 'payment_session',
        'consumerid' => (int)$invoice->consumerid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'invoiceid' => $invoiceid,
        'provider' => (string)$session->provider,
        'mode' => (string)$session->mode,
        'amount' => (string)$session->amount,
        'actorid' => $actorid,
    ]);
    return ['session' => $session, 'checkouturl' => $checkouturl, 'config' => $config];
}

function pqfin_gateway_signature_valid(string $payload, string $signature, string $secret): bool {
    $signature = trim($signature);
    $secret = trim($secret);
    if ($payload === '' || $signature === '' || $secret === '') {
        return false;
    }
    $expected = hash_hmac('sha256', $payload, $secret);
    $signature = preg_replace('/^sha256=/i', '', $signature) ?? $signature;
    return hash_equals($expected, $signature);
}

function pqfin_gateway_config_for_webhook(array $payload): array {
    $workspaceid = max(0, (int)($payload['workspaceid'] ?? $payload['workspace_id'] ?? 0));
    return pqfin_effective_gateway_config($workspaceid, pqh_consumer_context_by_workspace($workspaceid));
}

function pqfin_record_provider_payment($session, array $payload, int $webhookid): int {
    global $DB;

    $invoice = $DB->get_record('local_prequran_invoice', ['id' => (int)$session->invoiceid], '*', MUST_EXIST);
    $transactionid = trim((string)($payload['transaction_id'] ?? $payload['providertransactionid'] ?? $payload['payment_intent'] ?? ''));
    if ($transactionid === '') {
        $transactionid = 'webhook-' . $webhookid;
    }
    $existing = $DB->get_record('local_prequran_payment', [
        'workspaceid' => (int)$invoice->workspaceid,
        'paymentmethod' => 'hosted_gateway',
        'reference' => core_text::substr($transactionid, 0, 120),
    ], '*', IGNORE_MISSING);
    if ($existing) {
        return (int)$existing->id;
    }
    $amount = pqfin_cents_to_money(max(0, pqfin_money_to_cents((string)($payload['amount'] ?? $session->amount))));
    $now = time();
    $payment = (object)[
        'consumerid' => (int)$invoice->consumerid,
        'workspaceid' => (int)$invoice->workspaceid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'studentid' => (int)$invoice->studentid,
        'receiptnumber' => '',
        'paymentmethod' => 'hosted_gateway',
        'status' => 'recorded',
        'currency' => (string)($payload['currency'] ?? $invoice->currency),
        'amount' => $amount,
        'allocatedamount' => $amount,
        'unallocatedamount' => '0.00',
        'reference' => core_text::substr($transactionid, 0, 120),
        'notes' => 'Hosted gateway payment',
        'metadatajson' => pqfin_metadata(['source' => 'hosted_gateway_webhook', 'webhookid' => $webhookid, 'sessionid' => (int)$session->id]),
        'receivedat' => $now,
        'reversedat' => 0,
        'reversalofid' => 0,
        'createdby' => 0,
        'modifiedby' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $paymentid = (int)$DB->insert_record('local_prequran_payment', $payment);
    $payment->id = $paymentid;
    $payment->receiptnumber = pqfin_generate_receipt_number($paymentid, (int)$invoice->workspaceid);
    $DB->update_record('local_prequran_payment', $payment);
    $DB->insert_record('local_prequran_payment_alloc', (object)[
        'paymentid' => $paymentid,
        'invoiceid' => (int)$invoice->id,
        'consumerid' => (int)$invoice->consumerid,
        'workspaceid' => (int)$invoice->workspaceid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'studentid' => (int)$invoice->studentid,
        'status' => 'active',
        'currency' => (string)$payment->currency,
        'amount' => $amount,
        'metadatajson' => pqfin_metadata(['source' => 'hosted_gateway_webhook', 'webhookid' => $webhookid]),
        'allocatedat' => $now,
        'reversedat' => 0,
        'createdby' => 0,
        'modifiedby' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    pqfin_recalculate_invoice_totals((int)$invoice->id, 0);
    pqfin_audit('hosted_gateway_payment_recorded', (int)$invoice->workspaceid, (int)$invoice->studentid, $paymentid, [
        'targettype' => 'payment',
        'consumerid' => (int)$invoice->consumerid,
        'invoiceid' => (int)$invoice->id,
        'paymentid' => $paymentid,
        'webhookid' => $webhookid,
        'transactionid' => $transactionid,
    ]);
    try {
        pqfin_send_receipt_notification($paymentid, 'payment_received', pqh_consumer_context_by_workspace((int)$invoice->workspaceid), 0);
    } catch (Throwable $e) {
        pqfin_audit('finance_notification_failed', (int)$invoice->workspaceid, (int)$invoice->studentid, $paymentid, [
            'targettype' => 'payment',
            'invoiceid' => (int)$invoice->id,
            'paymentid' => $paymentid,
            'eventtype' => 'payment_received',
            'error' => $e->getMessage(),
        ]);
    }
    return $paymentid;
}

function pqfin_process_gateway_webhook(string $payloadjson, string $signature): array {
    global $DB;

    if (!pqfin_gateway_schema_ready()) {
        throw new invalid_parameter_exception('Payment gateway schema is not ready.');
    }
    $payload = json_decode($payloadjson, true);
    if (!is_array($payload)) {
        throw new invalid_parameter_exception('Invalid webhook JSON.');
    }
    $config = pqfin_gateway_config_for_webhook($payload);
    $signatureok = pqfin_gateway_signature_valid($payloadjson, $signature, (string)($config['webhooksecret'] ?? ''));
    $eventid = trim((string)($payload['event_id'] ?? $payload['id'] ?? ''));
    $eventtype = trim((string)($payload['event_type'] ?? $payload['type'] ?? 'payment.pending'));
    $localsessionid = trim((string)($payload['session_id'] ?? $payload['localsessionid'] ?? ''));
    $idempotencykey = trim((string)($payload['idempotency_key'] ?? $eventid));
    if ($idempotencykey === '') {
        $idempotencykey = hash('sha256', $payloadjson);
    }
    $existing = $DB->get_record('local_prequran_pay_webhook', [
        'provider' => (string)$config['provider'],
        'idempotencykey' => $idempotencykey,
    ], '*', IGNORE_MISSING);
    if ($existing && in_array((string)$existing->processingstatus, ['processed', 'duplicate'], true)) {
        return ['status' => 'duplicate', 'webhookid' => (int)$existing->id, 'paymentid' => (int)$existing->paymentid];
    }
    $session = $localsessionid !== ''
        ? $DB->get_record('local_prequran_pay_session', ['localsessionid' => $localsessionid], '*', IGNORE_MISSING)
        : null;
    $mapped = pqfin_gateway_status_map($eventtype, (string)($payload['status'] ?? ''));
    $now = time();
    $webhook = (object)[
        'consumerid' => (int)($session->consumerid ?? 0),
        'workspaceid' => (int)($session->workspaceid ?? ($payload['workspaceid'] ?? $payload['workspace_id'] ?? 0)),
        'invoiceid' => (int)($session->invoiceid ?? ($payload['invoice_id'] ?? 0)),
        'paymentid' => 0,
        'sessionid' => (int)($session->id ?? 0),
        'provider' => (string)$config['provider'],
        'mode' => (string)$config['mode'],
        'eventid' => core_text::substr($eventid, 0, 180),
        'idempotencykey' => core_text::substr($idempotencykey, 0, 180),
        'eventtype' => core_text::substr($eventtype, 0, 120),
        'mappedstatus' => $mapped,
        'signaturestatus' => $signatureok ? 'valid' : 'invalid',
        'processingstatus' => $signatureok ? 'received' : 'failed',
        'currency' => pqfin_normalize_currency((string)($payload['currency'] ?? ($session->currency ?? pqfin_default_currency()))),
        'amount' => pqfin_cents_to_money(max(0, pqfin_money_to_cents((string)($payload['amount'] ?? ($session->amount ?? '0'))))),
        'providertransactionid' => core_text::substr((string)($payload['transaction_id'] ?? $payload['providertransactionid'] ?? ''), 0, 180),
        'payloadjson' => $payloadjson,
        'error' => $signatureok ? '' : 'Invalid webhook signature',
        'receivedat' => $now,
        'processedat' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $webhookid = (int)$DB->insert_record('local_prequran_pay_webhook', $webhook);
    if (!$signatureok) {
        pqfin_audit('payment_webhook_signature_rejected', (int)$webhook->workspaceid, 0, $webhookid, [
            'targettype' => 'payment_webhook',
            'provider' => (string)$webhook->provider,
            'eventtype' => (string)$webhook->eventtype,
        ]);
        return ['status' => 'invalid_signature', 'webhookid' => $webhookid, 'paymentid' => 0];
    }
    if (!$session) {
        $DB->update_record('local_prequran_pay_webhook', (object)[
            'id' => $webhookid,
            'processingstatus' => 'failed',
            'error' => 'Payment session not found',
            'timemodified' => time(),
        ]);
        return ['status' => 'failed', 'webhookid' => $webhookid, 'paymentid' => 0];
    }
    $paymentid = 0;
    if ($mapped === 'succeeded') {
        $paymentid = pqfin_record_provider_payment($session, $payload, $webhookid);
        $session->status = 'succeeded';
        $session->providertransactionid = core_text::substr((string)($payload['transaction_id'] ?? $payload['providertransactionid'] ?? ''), 0, 180);
        $session->completedat = time();
    } else {
        $session->status = $mapped;
        if ($mapped === 'failed') {
            try {
                pqfin_send_invoice_notification((int)$session->invoiceid, 'payment_failed', pqh_consumer_context_by_workspace((int)$session->workspaceid), 0);
            } catch (Throwable $e) {
                pqfin_audit('finance_notification_failed', (int)$session->workspaceid, (int)$session->studentid, (int)$session->invoiceid, [
                    'targettype' => 'invoice',
                    'invoiceid' => (int)$session->invoiceid,
                    'eventtype' => 'payment_failed',
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
    if (!empty($payload['provider_session_id'])) {
        $session->providersessionid = core_text::substr((string)$payload['provider_session_id'], 0, 180);
    }
    $session->timemodified = time();
    $DB->update_record('local_prequran_pay_session', $session);
    $DB->update_record('local_prequran_pay_webhook', (object)[
        'id' => $webhookid,
        'paymentid' => $paymentid,
        'processingstatus' => 'processed',
        'processedat' => time(),
        'timemodified' => time(),
    ]);
    pqfin_audit('payment_webhook_processed', (int)$session->workspaceid, (int)$session->studentid, $webhookid, [
        'targettype' => 'payment_webhook',
        'consumerid' => (int)$session->consumerid,
        'invoiceid' => (int)$session->invoiceid,
        'paymentid' => $paymentid,
        'sessionid' => (int)$session->id,
        'eventtype' => $eventtype,
        'mappedstatus' => $mapped,
    ]);
    return ['status' => 'processed', 'webhookid' => $webhookid, 'paymentid' => $paymentid];
}

function pqfin_invoice_lines(int $invoiceid): array {
    global $DB;

    if ($invoiceid <= 0 || !pqfin_invoice_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_invoice_line', ['invoiceid' => $invoiceid, 'status' => 'active'], 'linesequence ASC, id ASC'));
}

function pqfin_invoice_amount_metrics(array $invoices): array {
    $total = 0;
    $paid = 0;
    $balance = 0;
    $overdue = 0;
    foreach ($invoices as $invoice) {
        $total += pqfin_money_to_cents((string)$invoice->total);
        $paid += pqfin_money_to_cents((string)$invoice->paidamount);
        $balance += pqfin_money_to_cents((string)$invoice->balancedue);
        if ((int)$invoice->dueat > 0 && (int)$invoice->dueat < time() && pqfin_money_to_cents((string)$invoice->balancedue) > 0) {
            $overdue++;
        }
    }
    return [
        'count' => count($invoices),
        'total' => pqfin_cents_to_money($total),
        'paid' => pqfin_cents_to_money($paid),
        'balance' => pqfin_cents_to_money($balance),
        'overdue' => $overdue,
    ];
}

function pqfin_invoice_support_label($workspace = null, $consumercontext = null): string {
    $name = trim((string)($workspace->name ?? ($consumercontext->consumername ?? 'Academy finance team')));
    return $name !== '' ? $name . ' finance office' : 'Academy finance office';
}

function pqfin_generate_invoice_number(int $invoiceid, int $workspaceid, array $policy): string {
    $prefix = (string)($policy['invoice_number_prefix'] ?? 'INV');
    $prefix = strtoupper(preg_replace('/[^A-Z0-9-]/', '', $prefix) ?? '');
    $prefix = $prefix !== '' ? $prefix : 'INV';
    return $prefix . '-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$invoiceid, 6, '0', STR_PAD_LEFT);
}

function pqfin_invoice_line_total_cents(array $line): int {
    $quantity = max(1, (int)($line['quantity'] ?? 1));
    $subtotal = $quantity * pqfin_money_to_cents((string)($line['unitamount'] ?? '0'));
    $discount = max(0, pqfin_money_to_cents((string)($line['discountamount'] ?? '0')));
    $tax = max(0, pqfin_money_to_cents((string)($line['taxamount'] ?? '0')));
    return max(0, $subtotal - $discount + $tax);
}

function pqfin_recalculate_invoice_totals(int $invoiceid, int $actorid = 0) {
    global $DB;

    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    $lines = $DB->get_records('local_prequran_invoice_line', ['invoiceid' => $invoiceid, 'status' => 'active'], 'linesequence ASC, id ASC');
    $subtotal = 0;
    $discounttotal = 0;
    $taxtotal = 0;
    $total = 0;
    foreach ($lines as $line) {
        $quantity = max(1, (int)$line->quantity);
        $lineunit = pqfin_money_to_cents((string)$line->unitamount);
        $linediscount = max(0, pqfin_money_to_cents((string)$line->discountamount));
        $linetax = max(0, pqfin_money_to_cents((string)$line->taxamount));
        $linetotal = max(0, ($quantity * $lineunit) - $linediscount + $linetax);
        $subtotal += $quantity * $lineunit;
        $discounttotal += $linediscount;
        $taxtotal += $linetax;
        $total += $linetotal;
        if ((string)$line->linetotal !== pqfin_cents_to_money($linetotal)) {
            $line->linetotal = pqfin_cents_to_money($linetotal);
            $line->modifiedby = $actorid;
            $line->timemodified = time();
            $DB->update_record('local_prequran_invoice_line', $line);
        }
    }
    $paid = max(0, pqfin_money_to_cents((string)$invoice->paidamount));
    if (pqfin_payment_schema_ready()) {
        $allocated = $DB->get_field_sql(
            "SELECT COALESCE(SUM(CAST(amount AS DECIMAL(12,2))), 0)
               FROM {local_prequran_payment_alloc}
              WHERE invoiceid = :invoiceid
                AND status = :status",
            ['invoiceid' => $invoiceid, 'status' => 'active']
        );
        $paid = pqfin_money_to_cents((string)$allocated);
    }
    $credited = max(0, pqfin_money_to_cents((string)$invoice->creditedamount));
    if (pqfin_correction_schema_ready()) {
        $credit = $DB->get_field_sql(
            "SELECT COALESCE(SUM(CAST(amount AS DECIMAL(12,2))), 0)
               FROM {local_prequran_credit_note}
              WHERE invoiceid = :invoiceid
                AND status = :status",
            ['invoiceid' => $invoiceid, 'status' => 'active']
        );
        $credited = pqfin_money_to_cents((string)$credit);
    }
    $balance = max(0, $total - $paid - $credited);
    $invoice->subtotal = pqfin_cents_to_money($subtotal);
    $invoice->discounttotal = pqfin_cents_to_money($discounttotal);
    $invoice->taxtotal = pqfin_cents_to_money($taxtotal);
    $invoice->total = pqfin_cents_to_money($total);
    $invoice->paidamount = pqfin_cents_to_money($paid);
    $invoice->creditedamount = pqfin_cents_to_money($credited);
    $invoice->balancedue = pqfin_cents_to_money($balance);
    if ((string)$invoice->status !== 'void' && (string)$invoice->status !== 'disputed' && in_array((string)$invoice->status, ['issued', 'sent', 'partially_paid', 'paid'], true)) {
        if ($total > 0 && $balance === 0) {
            $invoice->status = 'paid';
        } else if ($paid > 0) {
            $invoice->status = 'partially_paid';
        } else if ((string)$invoice->status === 'paid' || (string)$invoice->status === 'partially_paid') {
            $invoice->status = (int)$invoice->sentat > 0 ? 'sent' : 'issued';
        }
    }
    $invoice->modifiedby = $actorid;
    $invoice->timemodified = time();
    $DB->update_record('local_prequran_invoice', $invoice);
    if (pqfin_payment_plan_schema_ready()) {
        pqfin_recalculate_invoice_payment_plans($invoiceid, $actorid);
    }
    return $invoice;
}

function pqfin_generate_receipt_number(int $paymentid, int $workspaceid): string {
    return 'RCT-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$paymentid, 6, '0', STR_PAD_LEFT);
}

function pqfin_generate_credit_number(int $creditid, int $workspaceid): string {
    return 'CR-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$creditid, 6, '0', STR_PAD_LEFT);
}

function pqfin_generate_refund_number(int $refundid, int $workspaceid): string {
    return 'RF-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$refundid, 6, '0', STR_PAD_LEFT);
}

function pqfin_invoice_credit_notes(int $invoiceid): array {
    global $DB;

    if ($invoiceid <= 0 || !pqfin_correction_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_credit_note', ['invoiceid' => $invoiceid], 'issuedat DESC, id DESC'));
}

function pqfin_invoice_refunds(int $invoiceid): array {
    global $DB;

    if ($invoiceid <= 0 || !pqfin_correction_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_refund', ['invoiceid' => $invoiceid], 'refundedat DESC, id DESC'));
}

function pqfin_payment_allocations(int $paymentid): array {
    global $DB;

    if ($paymentid <= 0 || !pqfin_payment_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_payment_alloc', ['paymentid' => $paymentid], 'id ASC'));
}

function pqfin_invoice_payments(int $invoiceid): array {
    global $DB;

    if ($invoiceid <= 0 || !pqfin_payment_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT p.*, pa.id AS allocationid, pa.amount AS allocationamount, pa.status AS allocationstatus
           FROM {local_prequran_payment_alloc} pa
           JOIN {local_prequran_payment} p ON p.id = pa.paymentid
          WHERE pa.invoiceid = :invoiceid
       ORDER BY p.receivedat DESC, p.id DESC",
        ['invoiceid' => $invoiceid]
    ));
}

function pqfin_generate_payment_plan_number(int $planid, int $workspaceid): string {
    return 'PLN-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$planid, 6, '0', STR_PAD_LEFT);
}

function pqfin_generate_scholarship_award_number(int $awardid, int $workspaceid): string {
    return 'SCH-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$awardid, 6, '0', STR_PAD_LEFT);
}

function pqfin_generate_sponsor_commitment_number(int $commitmentid, int $workspaceid): string {
    return 'SPN-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$commitmentid, 6, '0', STR_PAD_LEFT);
}

function pqfin_generate_marketplace_payout_number(int $payoutid, int $workspaceid): string {
    return 'MPO-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$payoutid, 6, '0', STR_PAD_LEFT);
}

function pqfin_scholarship_awards_for_invoice(int $invoiceid): array {
    global $DB;

    if ($invoiceid <= 0 || !pqfin_assistance_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_scholar_award', ['invoiceid' => $invoiceid], 'approvedat DESC, id DESC'));
}

function pqfin_sponsor_commitments_for_invoice(int $invoiceid): array {
    global $DB;

    if ($invoiceid <= 0 || !pqfin_assistance_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT sc.*, ba.displayname AS sponsorname, ba.billingemail AS sponsoremail
           FROM {local_prequran_sponsor_commit} sc
      LEFT JOIN {local_prequran_billing_account} ba ON ba.id = sc.sponsoraccountid
          WHERE sc.invoiceid = :invoiceid
       ORDER BY sc.committedat DESC, sc.id DESC",
        ['invoiceid' => $invoiceid]
    ));
}

function pqfin_sponsor_commitments_for_user(int $workspaceid, int $sponsorid, $consumercontext = null): array {
    global $DB;

    if ($workspaceid <= 0 || $sponsorid <= 0 || !pqfin_assistance_schema_ready()
            || !pqfin_sponsor_billing_visible($workspaceid, $sponsorid, $consumercontext)) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT sc.*, i.invoicenumber, i.status AS invoicestatus,
                ba.displayname AS sponsorname, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_sponsor_commit} sc
           JOIN {local_prequran_billing_account} ba ON ba.id = sc.sponsoraccountid
           JOIN {local_prequran_invoice} i ON i.id = sc.invoiceid
      LEFT JOIN {user} u ON u.id = sc.studentid
          WHERE sc.workspaceid = :workspaceid
            AND ba.primaryuserid = :sponsorid
       ORDER BY sc.expectedat ASC, sc.committedat DESC, sc.id DESC",
        ['workspaceid' => $workspaceid, 'sponsorid' => $sponsorid],
        0,
        150
    ));
}

function pqfin_marketplace_payouts_for_invoice(int $invoiceid): array {
    global $DB;

    if ($invoiceid <= 0 || !pqfin_assistance_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_market_payout', ['invoiceid' => $invoiceid], 'readyat DESC, id DESC'));
}

function pqfin_create_scholarship_award_for_invoice(
    int $invoiceid,
    $consumercontext,
    int $actorid,
    string $amount,
    string $awardtype,
    string $fundingsource,
    string $reason
): int {
    global $DB;

    if (!pqfin_invoice_schema_ready() || !pqfin_correction_schema_ready() || !pqfin_assistance_schema_ready()) {
        throw new invalid_parameter_exception('Scholarship schema is not ready.');
    }
    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Invoice is outside this workspace.');
    }
    if ((string)$invoice->status === 'void') {
        throw new invalid_parameter_exception('Voided invoices cannot receive scholarship awards.');
    }
    $amountcents = pqfin_money_to_cents($amount);
    if ($amountcents <= 0) {
        throw new invalid_parameter_exception('Enter a scholarship amount greater than zero.');
    }
    $reason = trim($reason);
    if ($reason === '') {
        throw new invalid_parameter_exception('A scholarship reason is required.');
    }
    $creditid = pqfin_create_credit_note_for_invoice(
        $invoiceid,
        $consumercontext,
        $actorid,
        pqfin_cents_to_money($amountcents),
        $reason,
        'credit',
        'scholarship_award'
    );
    $now = time();
    $award = (object)[
        'consumerid' => (int)$invoice->consumerid,
        'workspaceid' => (int)$invoice->workspaceid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'studentid' => (int)$invoice->studentid,
        'invoiceid' => $invoiceid,
        'creditnoteid' => $creditid,
        'awardnumber' => '',
        'awardtype' => core_text::substr($awardtype !== '' ? $awardtype : 'need_based', 0, 60),
        'fundingsource' => core_text::substr(trim($fundingsource), 0, 120),
        'status' => 'approved',
        'currency' => (string)$invoice->currency,
        'amount' => pqfin_cents_to_money($amountcents),
        'reason' => $reason,
        'metadatajson' => pqfin_metadata(['source' => 'invoice_detail', 'creditnoteid' => $creditid]),
        'approvedby' => $actorid,
        'approvedat' => $now,
        'voidedat' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $awardid = (int)$DB->insert_record('local_prequran_scholar_award', $award);
    $award->id = $awardid;
    $award->awardnumber = pqfin_generate_scholarship_award_number($awardid, (int)$invoice->workspaceid);
    $DB->update_record('local_prequran_scholar_award', $award);
    pqfin_audit('scholarship_award_approved', (int)$invoice->workspaceid, (int)$invoice->studentid, $awardid, [
        'targettype' => 'scholarship_award',
        'consumerid' => (int)$invoice->consumerid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'invoiceid' => $invoiceid,
        'creditnoteid' => $creditid,
        'awardid' => $awardid,
        'awardnumber' => (string)$award->awardnumber,
        'amount' => (string)$award->amount,
        'awardtype' => (string)$award->awardtype,
        'fundingsource' => (string)$award->fundingsource,
        'actorid' => $actorid,
    ]);
    return $awardid;
}

function pqfin_create_sponsor_commitment_for_invoice(
    int $invoiceid,
    $consumercontext,
    int $actorid,
    int $sponsoraccountid,
    string $amount,
    int $expectedat,
    string $termsnote = ''
): int {
    global $DB;

    if (!pqfin_invoice_schema_ready() || !pqfin_assistance_schema_ready() || !pqfin_schema_ready()) {
        throw new invalid_parameter_exception('Sponsorship schema is not ready.');
    }
    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Invoice is outside this workspace.');
    }
    $sponsor = $DB->get_record('local_prequran_billing_account', ['id' => $sponsoraccountid], '*', MUST_EXIST);
    if ((int)$sponsor->workspaceid !== (int)$invoice->workspaceid || (string)$sponsor->accounttype !== 'sponsor') {
        throw new invalid_parameter_exception('Choose a sponsor billing account in this workspace.');
    }
    $amountcents = pqfin_money_to_cents($amount);
    if ($amountcents <= 0) {
        throw new invalid_parameter_exception('Enter a sponsor commitment amount greater than zero.');
    }
    $now = time();
    $commitment = (object)[
        'consumerid' => (int)$invoice->consumerid,
        'workspaceid' => (int)$invoice->workspaceid,
        'sponsoraccountid' => $sponsoraccountid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'studentid' => (int)$invoice->studentid,
        'invoiceid' => $invoiceid,
        'commitmentnumber' => '',
        'status' => 'pledged',
        'currency' => (string)$invoice->currency,
        'committedamount' => pqfin_cents_to_money($amountcents),
        'receivedamount' => '0.00',
        'balanceamount' => pqfin_cents_to_money($amountcents),
        'termsnote' => trim($termsnote),
        'metadatajson' => pqfin_metadata(['source' => 'invoice_detail']),
        'committedat' => $now,
        'expectedat' => $expectedat > 0 ? $expectedat : 0,
        'completedat' => 0,
        'cancelledat' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $commitmentid = (int)$DB->insert_record('local_prequran_sponsor_commit', $commitment);
    $commitment->id = $commitmentid;
    $commitment->commitmentnumber = pqfin_generate_sponsor_commitment_number($commitmentid, (int)$invoice->workspaceid);
    $DB->update_record('local_prequran_sponsor_commit', $commitment);
    pqfin_audit('sponsor_commitment_created', (int)$invoice->workspaceid, (int)$invoice->studentid, $commitmentid, [
        'targettype' => 'sponsor_commitment',
        'consumerid' => (int)$invoice->consumerid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'invoiceid' => $invoiceid,
        'sponsoraccountid' => $sponsoraccountid,
        'commitmentid' => $commitmentid,
        'commitmentnumber' => (string)$commitment->commitmentnumber,
        'amount' => (string)$commitment->committedamount,
        'actorid' => $actorid,
    ]);
    return $commitmentid;
}

function pqfin_create_marketplace_payout_for_invoice(
    int $invoiceid,
    $consumercontext,
    int $actorid,
    int $teacherid,
    string $grossamount,
    string $platformfee,
    string $notes = ''
): int {
    global $DB;

    if (!pqfin_invoice_schema_ready() || !pqfin_assistance_schema_ready()) {
        throw new invalid_parameter_exception('Marketplace payout schema is not ready.');
    }
    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Invoice is outside this workspace.');
    }
    if ($teacherid <= 0) {
        $teacherid = (int)$DB->get_field_sql(
            "SELECT teacherid
               FROM {local_prequran_invoice_line}
              WHERE invoiceid = :invoiceid
                AND status = :status
                AND teacherid > 0
           ORDER BY id ASC",
            ['invoiceid' => $invoiceid, 'status' => 'active'],
            IGNORE_MULTIPLE
        );
    }
    if ($teacherid <= 0) {
        throw new invalid_parameter_exception('Choose a teacher for marketplace payout readiness.');
    }
    $grosscents = pqfin_money_to_cents($grossamount);
    if ($grosscents <= 0) {
        $grosscents = pqfin_money_to_cents((string)$invoice->paidamount);
    }
    if ($grosscents <= 0) {
        throw new invalid_parameter_exception('Payout readiness requires a paid amount or gross amount.');
    }
    $feecents = max(0, pqfin_money_to_cents($platformfee));
    if ($feecents > $grosscents) {
        throw new invalid_parameter_exception('Platform fee cannot exceed gross payout basis.');
    }
    $requestid = 0;
    if (pqh_table_exists_safe('local_prequran_teacher_request')) {
        $requestid = (int)$DB->get_field_sql(
            "SELECT id
               FROM {local_prequran_teacher_request}
              WHERE teacherid = :teacherid
                AND studentid = :studentid
           ORDER BY timemodified DESC, id DESC",
            ['teacherid' => $teacherid, 'studentid' => (int)$invoice->studentid],
            IGNORE_MULTIPLE
        );
    }
    $now = time();
    $payout = (object)[
        'consumerid' => (int)$invoice->consumerid,
        'workspaceid' => (int)$invoice->workspaceid,
        'teacherid' => $teacherid,
        'studentid' => (int)$invoice->studentid,
        'invoiceid' => $invoiceid,
        'requestid' => $requestid,
        'paymentid' => 0,
        'payoutnumber' => '',
        'status' => 'ready_for_review',
        'currency' => (string)$invoice->currency,
        'grossamount' => pqfin_cents_to_money($grosscents),
        'platformfee' => pqfin_cents_to_money($feecents),
        'payoutamount' => pqfin_cents_to_money(max(0, $grosscents - $feecents)),
        'payoutmethod' => 'manual',
        'reference' => '',
        'notes' => trim($notes),
        'metadatajson' => pqfin_metadata(['source' => 'invoice_detail']),
        'readyat' => $now,
        'approvedby' => 0,
        'approvedat' => 0,
        'paidat' => 0,
        'voidedat' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $payoutid = (int)$DB->insert_record('local_prequran_market_payout', $payout);
    $payout->id = $payoutid;
    $payout->payoutnumber = pqfin_generate_marketplace_payout_number($payoutid, (int)$invoice->workspaceid);
    $DB->update_record('local_prequran_market_payout', $payout);
    pqfin_audit('marketplace_payout_ready', (int)$invoice->workspaceid, (int)$invoice->studentid, $payoutid, [
        'targettype' => 'marketplace_payout',
        'consumerid' => (int)$invoice->consumerid,
        'invoiceid' => $invoiceid,
        'payoutid' => $payoutid,
        'payoutnumber' => (string)$payout->payoutnumber,
        'teacherid' => $teacherid,
        'requestid' => $requestid,
        'grossamount' => (string)$payout->grossamount,
        'platformfee' => (string)$payout->platformfee,
        'payoutamount' => (string)$payout->payoutamount,
        'actorid' => $actorid,
    ]);
    return $payoutid;
}

function pqfin_payment_plan_date_interval(string $frequency): string {
    $frequency = strtolower(trim($frequency));
    if ($frequency === 'weekly') {
        return '+7 days';
    }
    if ($frequency === 'biweekly') {
        return '+14 days';
    }
    return '+1 month';
}

function pqfin_payment_plans_for_invoice(int $invoiceid): array {
    global $DB;

    if ($invoiceid <= 0 || !pqfin_payment_plan_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_payment_plan', ['invoiceid' => $invoiceid], 'timecreated DESC, id DESC'));
}

function pqfin_installments_for_plan(int $planid): array {
    global $DB;

    if ($planid <= 0 || !pqfin_payment_plan_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_payment_install', ['planid' => $planid], 'installmentnumber ASC, id ASC'));
}

function pqfin_active_payment_plan_for_invoice(int $invoiceid) {
    global $DB;

    if ($invoiceid <= 0 || !pqfin_payment_plan_schema_ready()) {
        return false;
    }
    return $DB->get_record_sql(
        "SELECT *
           FROM {local_prequran_payment_plan}
          WHERE invoiceid = :invoiceid
            AND status IN ('draft', 'active', 'past_due')
       ORDER BY id DESC",
        ['invoiceid' => $invoiceid],
        IGNORE_MULTIPLE
    );
}

function pqfin_create_payment_plan_for_invoice(
    int $invoiceid,
    $consumercontext,
    int $actorid,
    int $installmentcount,
    int $firstdueat,
    string $frequency,
    string $termsnote = ''
): int {
    global $DB;

    if (!pqfin_invoice_schema_ready() || !pqfin_payment_plan_schema_ready()) {
        throw new invalid_parameter_exception('Payment plan schema is not ready.');
    }
    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Invoice is outside this workspace.');
    }
    if (!in_array((string)$invoice->status, ['issued', 'sent', 'partially_paid'], true)) {
        throw new invalid_parameter_exception('Payment plans can only be created for issued invoices with an open balance.');
    }
    if (pqfin_active_payment_plan_for_invoice($invoiceid)) {
        throw new invalid_parameter_exception('This invoice already has an active payment plan.');
    }
    $principalcents = pqfin_money_to_cents((string)$invoice->balancedue);
    if ($principalcents <= 0) {
        throw new invalid_parameter_exception('Payment plans require an open invoice balance.');
    }
    $installmentcount = max(2, min(24, $installmentcount));
    $firstdueat = $firstdueat > 0 ? $firstdueat : time();
    $frequency = in_array($frequency, ['weekly', 'biweekly', 'monthly'], true) ? $frequency : 'monthly';
    $now = time();
    $plan = (object)[
        'consumerid' => (int)$invoice->consumerid,
        'workspaceid' => (int)$invoice->workspaceid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'studentid' => (int)$invoice->studentid,
        'invoiceid' => $invoiceid,
        'plannumber' => '',
        'status' => 'active',
        'plantype' => $frequency . '_installments',
        'currency' => (string)$invoice->currency,
        'principalamount' => pqfin_cents_to_money($principalcents),
        'scheduledamount' => pqfin_cents_to_money($principalcents),
        'paidamount' => '0.00',
        'pastdueamount' => '0.00',
        'installmentcount' => $installmentcount,
        'firstdueat' => $firstdueat,
        'lastdueat' => 0,
        'activatedat' => $now,
        'completedat' => 0,
        'cancelledat' => 0,
        'termsnote' => trim($termsnote),
        'metadatajson' => pqfin_metadata(['source' => 'admin_invoice_detail', 'frequency' => $frequency]),
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $planid = (int)$DB->insert_record('local_prequran_payment_plan', $plan);
    $plan->id = $planid;
    $plan->plannumber = pqfin_generate_payment_plan_number($planid, (int)$invoice->workspaceid);
    $DB->update_record('local_prequran_payment_plan', $plan);

    $basecents = intdiv($principalcents, $installmentcount);
    $remainder = $principalcents % $installmentcount;
    $interval = pqfin_payment_plan_date_interval($frequency);
    $lastdueat = $firstdueat;
    for ($i = 1; $i <= $installmentcount; $i++) {
        $dueat = $i === 1 ? $firstdueat : (int)strtotime($interval, $lastdueat);
        $amountcents = $basecents + ($i <= $remainder ? 1 : 0);
        $lastdueat = $dueat;
        $DB->insert_record('local_prequran_payment_install', (object)[
            'planid' => $planid,
            'invoiceid' => $invoiceid,
            'consumerid' => (int)$invoice->consumerid,
            'workspaceid' => (int)$invoice->workspaceid,
            'billingaccountid' => (int)$invoice->billingaccountid,
            'studentid' => (int)$invoice->studentid,
            'installmentnumber' => $i,
            'status' => 'scheduled',
            'currency' => (string)$invoice->currency,
            'amount' => pqfin_cents_to_money($amountcents),
            'paidamount' => '0.00',
            'balancedue' => pqfin_cents_to_money($amountcents),
            'dueat' => $dueat,
            'paidat' => 0,
            'cancelledat' => 0,
            'metadatajson' => pqfin_metadata(['frequency' => $frequency]),
            'createdby' => $actorid,
            'modifiedby' => $actorid,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }
    $plan->lastdueat = $lastdueat;
    $DB->update_record('local_prequran_payment_plan', $plan);
    pqfin_recalculate_payment_plan($planid, $actorid);
    pqfin_audit('payment_plan_created', (int)$invoice->workspaceid, (int)$invoice->studentid, $planid, [
        'targettype' => 'payment_plan',
        'consumerid' => (int)$invoice->consumerid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'invoiceid' => $invoiceid,
        'paymentplanid' => $planid,
        'plannumber' => (string)$plan->plannumber,
        'installmentcount' => $installmentcount,
        'frequency' => $frequency,
        'principalamount' => (string)$plan->principalamount,
        'actorid' => $actorid,
    ]);
    return $planid;
}

function pqfin_recalculate_payment_plan(int $planid, int $actorid = 0) {
    global $DB;

    if ($planid <= 0 || !pqfin_payment_plan_schema_ready()) {
        return false;
    }
    $plan = $DB->get_record('local_prequran_payment_plan', ['id' => $planid], '*', IGNORE_MISSING);
    if (!$plan || (string)$plan->status === 'cancelled') {
        return $plan;
    }
    $installments = pqfin_installments_for_plan($planid);
    $paidcents = pqfin_money_to_cents((string)$DB->get_field('local_prequran_invoice', 'paidamount', ['id' => (int)$plan->invoiceid]));
    $remainingpaid = max(0, $paidcents);
    $scheduled = 0;
    $allocatedpaid = 0;
    $pastdue = 0;
    $allpaid = true;
    $now = time();
    foreach ($installments as $installment) {
        if ((string)$installment->status === 'cancelled') {
            continue;
        }
        $amountcents = pqfin_money_to_cents((string)$installment->amount);
        $applied = min($remainingpaid, $amountcents);
        $remainingpaid -= $applied;
        $balance = max(0, $amountcents - $applied);
        $scheduled += $amountcents;
        $allocatedpaid += $applied;
        if ($balance === 0) {
            $status = 'paid';
            $paidat = (int)$installment->paidat > 0 ? (int)$installment->paidat : $now;
        } else if ($applied > 0) {
            $status = (int)$installment->dueat > 0 && (int)$installment->dueat < $now ? 'past_due' : 'partial';
            $paidat = 0;
        } else {
            $status = (int)$installment->dueat > 0 && (int)$installment->dueat < $now ? 'past_due' : 'scheduled';
            $paidat = 0;
        }
        if ($status === 'past_due') {
            $pastdue += $balance;
        }
        if ($balance > 0) {
            $allpaid = false;
        }
        $installment->status = $status;
        $installment->paidamount = pqfin_cents_to_money($applied);
        $installment->balancedue = pqfin_cents_to_money($balance);
        $installment->paidat = $paidat;
        $installment->modifiedby = $actorid;
        $installment->timemodified = $now;
        $DB->update_record('local_prequran_payment_install', $installment);
    }
    $plan->scheduledamount = pqfin_cents_to_money($scheduled);
    $plan->paidamount = pqfin_cents_to_money($allocatedpaid);
    $plan->pastdueamount = pqfin_cents_to_money($pastdue);
    if ($allpaid && $scheduled > 0) {
        $plan->status = 'completed';
        $plan->completedat = (int)$plan->completedat > 0 ? (int)$plan->completedat : $now;
    } else {
        $plan->status = $pastdue > 0 ? 'past_due' : 'active';
        $plan->completedat = 0;
    }
    $plan->modifiedby = $actorid;
    $plan->timemodified = $now;
    $DB->update_record('local_prequran_payment_plan', $plan);
    return $plan;
}

function pqfin_recalculate_invoice_payment_plans(int $invoiceid, int $actorid = 0): void {
    foreach (pqfin_payment_plans_for_invoice($invoiceid) as $plan) {
        if (in_array((string)$plan->status, ['draft', 'active', 'past_due', 'completed'], true)) {
            pqfin_recalculate_payment_plan((int)$plan->id, $actorid);
        }
    }
}

function pqfin_cancel_payment_plan(int $planid, int $workspaceid, $consumercontext, int $actorid, string $reason = '') {
    global $DB;

    if ($planid <= 0 || !pqfin_payment_plan_schema_ready()) {
        throw new invalid_parameter_exception('Payment plan is not available.');
    }
    $plan = $DB->get_record('local_prequran_payment_plan', ['id' => $planid], '*', MUST_EXIST);
    if ((int)$plan->workspaceid !== $workspaceid || !pqh_record_belongs_to_consumer_context($plan, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Payment plan is outside this workspace.');
    }
    if ((string)$plan->status === 'cancelled') {
        return $plan;
    }
    $now = time();
    $metadata = json_decode((string)$plan->metadatajson, true);
    $metadata = is_array($metadata) ? $metadata : [];
    $metadata['cancel_reason'] = trim($reason);
    $plan->status = 'cancelled';
    $plan->cancelledat = $now;
    $plan->metadatajson = pqfin_metadata($metadata);
    $plan->modifiedby = $actorid;
    $plan->timemodified = $now;
    $DB->update_record('local_prequran_payment_plan', $plan);
    foreach (pqfin_installments_for_plan($planid) as $installment) {
        if ((string)$installment->status === 'paid') {
            continue;
        }
        $installment->status = 'cancelled';
        $installment->cancelledat = $now;
        $installment->modifiedby = $actorid;
        $installment->timemodified = $now;
        $DB->update_record('local_prequran_payment_install', $installment);
    }
    pqfin_audit('payment_plan_cancelled', (int)$plan->workspaceid, (int)$plan->studentid, $planid, [
        'targettype' => 'payment_plan',
        'consumerid' => (int)$plan->consumerid,
        'billingaccountid' => (int)$plan->billingaccountid,
        'invoiceid' => (int)$plan->invoiceid,
        'paymentplanid' => $planid,
        'reason' => $reason,
        'actorid' => $actorid,
    ]);
    return $plan;
}

function pqfin_payment_plans_report(int $workspaceid, $consumercontext = null, int $limit = 500): array {
    global $DB;

    if (!pqfin_payment_plan_schema_ready() || $workspaceid <= 0) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT p.*, i.invoicenumber, i.status AS invoicestatus, i.balancedue,
                ba.displayname AS accountname, u.firstname, u.lastname, u.email, u.idnumber,
                (SELECT MIN(ins.dueat)
                   FROM {local_prequran_payment_install} ins
                  WHERE ins.planid = p.id
                    AND ins.status IN ('scheduled', 'partial', 'past_due')) AS nextdueat
           FROM {local_prequran_payment_plan} p
           JOIN {local_prequran_invoice} i ON i.id = p.invoiceid
           JOIN {local_prequran_billing_account} ba ON ba.id = p.billingaccountid
      LEFT JOIN {user} u ON u.id = p.studentid
          WHERE p.workspaceid = :workspaceid
       ORDER BY p.status ASC, nextdueat ASC, p.timemodified DESC",
        ['workspaceid' => $workspaceid],
        0,
        $limit
    );
    foreach ($rows as $row) {
        $row->reconciliationid = 'PLAN-' . (int)$row->workspaceid . '-' . (int)$row->id;
    }
    return array_values($rows);
}

function pqfin_record_manual_payment_for_invoice(
    int $invoiceid,
    $consumercontext,
    int $actorid,
    string $amount,
    string $method,
    string $reference,
    string $notes,
    int $receivedat = 0
): int {
    global $DB;

    if (!pqfin_invoice_schema_ready() || !pqfin_payment_schema_ready()) {
        throw new invalid_parameter_exception('Payment schema is not ready.');
    }
    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Invoice is outside this workspace.');
    }
    if (!in_array((string)$invoice->status, ['issued', 'sent', 'partially_paid', 'paid'], true)) {
        throw new invalid_parameter_exception('Payments can only be recorded against issued invoices.');
    }
    $amountcents = pqfin_money_to_cents($amount);
    if ($amountcents <= 0) {
        throw new invalid_parameter_exception('Enter a payment amount greater than zero.');
    }
    $methods = pqfin_payment_method_options();
    if (!array_key_exists($method, $methods)) {
        throw new invalid_parameter_exception('Choose a valid payment method.');
    }
    $receivedat = $receivedat > 0 ? $receivedat : time();
    $now = time();
    $context = pqfin_consumer_context_for_workspace((int)$invoice->workspaceid, $consumercontext);
    $payment = (object)[
        'consumerid' => (int)($context->consumerid ?? (int)$invoice->consumerid),
        'workspaceid' => (int)$invoice->workspaceid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'studentid' => (int)$invoice->studentid,
        'receiptnumber' => '',
        'paymentmethod' => $method,
        'status' => 'recorded',
        'currency' => (string)$invoice->currency,
        'amount' => pqfin_cents_to_money($amountcents),
        'allocatedamount' => pqfin_cents_to_money($amountcents),
        'unallocatedamount' => '0.00',
        'reference' => core_text::substr(trim($reference), 0, 120),
        'notes' => trim($notes),
        'metadatajson' => pqfin_metadata(['source' => 'manual_invoice_payment', 'invoiceid' => $invoiceid]),
        'receivedat' => $receivedat,
        'reversedat' => 0,
        'reversalofid' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $paymentid = (int)$DB->insert_record('local_prequran_payment', $payment);
    $payment->id = $paymentid;
    $payment->receiptnumber = pqfin_generate_receipt_number($paymentid, (int)$invoice->workspaceid);
    $DB->update_record('local_prequran_payment', $payment);

    $DB->insert_record('local_prequran_payment_alloc', (object)[
        'paymentid' => $paymentid,
        'invoiceid' => $invoiceid,
        'consumerid' => (int)$payment->consumerid,
        'workspaceid' => (int)$invoice->workspaceid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'studentid' => (int)$invoice->studentid,
        'status' => 'active',
        'currency' => (string)$invoice->currency,
        'amount' => pqfin_cents_to_money($amountcents),
        'metadatajson' => pqfin_metadata(['source' => 'manual_invoice_payment']),
        'allocatedat' => $receivedat,
        'reversedat' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    pqfin_recalculate_invoice_totals($invoiceid, $actorid);
    pqfin_audit('manual_payment_recorded', (int)$invoice->workspaceid, (int)$invoice->studentid, $paymentid, [
        'targettype' => 'payment',
        'consumerid' => (int)$payment->consumerid,
        'paymentid' => $paymentid,
        'invoiceid' => $invoiceid,
        'receiptnumber' => (string)$payment->receiptnumber,
        'amount' => (string)$payment->amount,
        'method' => $method,
        'actorid' => $actorid,
    ]);
    try {
        pqfin_send_receipt_notification($paymentid, 'payment_received', $consumercontext, $actorid);
    } catch (Throwable $e) {
        pqfin_audit('finance_notification_failed', (int)$invoice->workspaceid, (int)$invoice->studentid, $paymentid, [
            'targettype' => 'payment',
            'consumerid' => (int)$payment->consumerid,
            'paymentid' => $paymentid,
            'invoiceid' => $invoiceid,
            'eventtype' => 'payment_received',
            'error' => $e->getMessage(),
            'actorid' => $actorid,
        ]);
    }
    return $paymentid;
}

function pqfin_reverse_payment(int $paymentid, $consumercontext, int $actorid, string $reason = '') {
    global $DB;

    if ($paymentid <= 0 || !pqfin_payment_schema_ready()) {
        throw new invalid_parameter_exception('Payment is not available.');
    }
    $payment = $DB->get_record('local_prequran_payment', ['id' => $paymentid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($payment, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Payment is outside this workspace.');
    }
    if ((string)$payment->status === 'reversed') {
        throw new invalid_parameter_exception('Payment is already reversed.');
    }
    $now = time();
    $allocations = pqfin_payment_allocations($paymentid);
    foreach ($allocations as $allocation) {
        if ((string)$allocation->status !== 'active') {
            continue;
        }
        $allocation->status = 'reversed';
        $allocation->reversedat = $now;
        $allocation->modifiedby = $actorid;
        $allocation->timemodified = $now;
        $DB->update_record('local_prequran_payment_alloc', $allocation);
    }
    $metadata = json_decode((string)$payment->metadatajson, true);
    $metadata = is_array($metadata) ? $metadata : [];
    $metadata['reversal_reason'] = trim($reason);
    $payment->status = 'reversed';
    $payment->allocatedamount = '0.00';
    $payment->unallocatedamount = (string)$payment->amount;
    $payment->metadatajson = pqfin_metadata($metadata);
    $payment->reversedat = $now;
    $payment->modifiedby = $actorid;
    $payment->timemodified = $now;
    $DB->update_record('local_prequran_payment', $payment);
    foreach ($allocations as $allocation) {
        pqfin_recalculate_invoice_totals((int)$allocation->invoiceid, $actorid);
    }
    pqfin_audit('manual_payment_reversed', (int)$payment->workspaceid, (int)$payment->studentid, $paymentid, [
        'targettype' => 'payment',
        'consumerid' => (int)$payment->consumerid,
        'paymentid' => $paymentid,
        'reason' => $reason,
        'actorid' => $actorid,
    ]);
    return $payment;
}

function pqfin_create_credit_note_for_invoice(
    int $invoiceid,
    $consumercontext,
    int $actorid,
    string $amount,
    string $reason,
    string $credittype = 'credit',
    string $reasoncode = 'manual_correction'
): int {
    global $DB;

    if (!pqfin_invoice_schema_ready() || !pqfin_correction_schema_ready()) {
        throw new invalid_parameter_exception('Credit note schema is not ready.');
    }
    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Invoice is outside this workspace.');
    }
    if ((string)$invoice->status === 'void') {
        throw new invalid_parameter_exception('Voided invoices cannot receive credits.');
    }
    if (!in_array($credittype, ['credit', 'write_off'], true)) {
        throw new invalid_parameter_exception('Choose a valid credit type.');
    }
    $amountcents = pqfin_money_to_cents($amount);
    if ($amountcents <= 0) {
        throw new invalid_parameter_exception('Enter a correction amount greater than zero.');
    }
    $reason = trim($reason);
    if ($reason === '') {
        throw new invalid_parameter_exception('A reason is required for credits and write-offs.');
    }
    $now = time();
    $credit = (object)[
        'consumerid' => (int)$invoice->consumerid,
        'workspaceid' => (int)$invoice->workspaceid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'studentid' => (int)$invoice->studentid,
        'invoiceid' => $invoiceid,
        'creditnumber' => '',
        'credittype' => $credittype,
        'status' => 'active',
        'currency' => (string)$invoice->currency,
        'amount' => pqfin_cents_to_money($amountcents),
        'reasoncode' => core_text::substr($reasoncode, 0, 80),
        'reason' => $reason,
        'metadatajson' => pqfin_metadata(['source' => $credittype === 'write_off' ? 'manual_write_off' : 'manual_credit_note']),
        'issuedat' => $now,
        'voidedat' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $creditid = (int)$DB->insert_record('local_prequran_credit_note', $credit);
    $credit->id = $creditid;
    $credit->creditnumber = pqfin_generate_credit_number($creditid, (int)$invoice->workspaceid);
    $DB->update_record('local_prequran_credit_note', $credit);
    pqfin_recalculate_invoice_totals($invoiceid, $actorid);
    pqfin_audit($credittype === 'write_off' ? 'invoice_write_off_recorded' : 'credit_note_created', (int)$invoice->workspaceid, (int)$invoice->studentid, $creditid, [
        'targettype' => 'credit_note',
        'consumerid' => (int)$invoice->consumerid,
        'billingaccountid' => (int)$invoice->billingaccountid,
        'invoiceid' => $invoiceid,
        'creditnoteid' => $creditid,
        'creditnumber' => (string)$credit->creditnumber,
        'amount' => (string)$credit->amount,
        'credittype' => $credittype,
        'reason' => $reason,
        'actorid' => $actorid,
    ]);
    return $creditid;
}

function pqfin_record_refund_for_payment(
    int $paymentid,
    int $invoiceid,
    $consumercontext,
    int $actorid,
    string $amount,
    string $method,
    string $reference,
    string $reason,
    int $refundedat = 0
): int {
    global $DB;

    if (!pqfin_payment_schema_ready() || !pqfin_correction_schema_ready()) {
        throw new invalid_parameter_exception('Refund schema is not ready.');
    }
    $payment = $DB->get_record('local_prequran_payment', ['id' => $paymentid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($payment, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Payment is outside this workspace.');
    }
    $invoice = $invoiceid > 0 ? $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', IGNORE_MISSING) : null;
    if ($invoice && (int)$invoice->workspaceid !== (int)$payment->workspaceid) {
        throw new invalid_parameter_exception('Refund invoice is outside this workspace.');
    }
    $amountcents = pqfin_money_to_cents($amount);
    if ($amountcents <= 0) {
        throw new invalid_parameter_exception('Enter a refund amount greater than zero.');
    }
    if (trim($reason) === '') {
        throw new invalid_parameter_exception('A refund reason is required.');
    }
    $now = time();
    $refund = (object)[
        'consumerid' => (int)$payment->consumerid,
        'workspaceid' => (int)$payment->workspaceid,
        'billingaccountid' => (int)$payment->billingaccountid,
        'studentid' => (int)$payment->studentid,
        'paymentid' => $paymentid,
        'invoiceid' => $invoice ? (int)$invoice->id : 0,
        'refundnumber' => '',
        'status' => 'recorded',
        'currency' => (string)$payment->currency,
        'amount' => pqfin_cents_to_money($amountcents),
        'refundmethod' => core_text::substr($method !== '' ? $method : 'manual', 0, 60),
        'reference' => core_text::substr(trim($reference), 0, 120),
        'reason' => trim($reason),
        'metadatajson' => pqfin_metadata(['source' => 'manual_refund_record']),
        'refundedat' => $refundedat > 0 ? $refundedat : $now,
        'voidedat' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $refundid = (int)$DB->insert_record('local_prequran_refund', $refund);
    $refund->id = $refundid;
    $refund->refundnumber = pqfin_generate_refund_number($refundid, (int)$payment->workspaceid);
    $DB->update_record('local_prequran_refund', $refund);
    pqfin_audit('refund_recorded', (int)$payment->workspaceid, (int)$payment->studentid, $refundid, [
        'targettype' => 'refund',
        'consumerid' => (int)$payment->consumerid,
        'billingaccountid' => (int)$payment->billingaccountid,
        'invoiceid' => $invoice ? (int)$invoice->id : 0,
        'paymentid' => $paymentid,
        'refundid' => $refundid,
        'refundnumber' => (string)$refund->refundnumber,
        'amount' => (string)$refund->amount,
        'reason' => trim($reason),
        'actorid' => $actorid,
    ]);
    return $refundid;
}

function pqfin_mark_finance_dispute(string $targettype, int $targetid, $consumercontext, int $actorid, string $reason) {
    global $DB;

    $reason = trim($reason);
    if ($reason === '') {
        throw new invalid_parameter_exception('A dispute reason is required.');
    }
    if ($targettype === 'invoice') {
        $record = $DB->get_record('local_prequran_invoice', ['id' => $targetid], '*', MUST_EXIST);
        if (!pqh_record_belongs_to_consumer_context($record, $consumercontext, 'workspaceid')) {
            throw new invalid_parameter_exception('Invoice is outside this workspace.');
        }
        $metadata = json_decode((string)$record->metadatajson, true);
        $metadata = is_array($metadata) ? $metadata : [];
        $metadata['dispute_reason'] = $reason;
        $metadata['disputedat'] = time();
        $record->status = 'disputed';
        $record->metadatajson = pqfin_metadata($metadata);
        $record->modifiedby = $actorid;
        $record->timemodified = time();
        $DB->update_record('local_prequran_invoice', $record);
        pqfin_audit('invoice_disputed', (int)$record->workspaceid, (int)$record->studentid, $targetid, [
            'targettype' => 'invoice',
            'consumerid' => (int)$record->consumerid,
            'billingaccountid' => (int)$record->billingaccountid,
            'invoiceid' => $targetid,
            'reason' => $reason,
            'actorid' => $actorid,
        ]);
        return $record;
    }
    if ($targettype === 'payment') {
        $record = $DB->get_record('local_prequran_payment', ['id' => $targetid], '*', MUST_EXIST);
        if (!pqh_record_belongs_to_consumer_context($record, $consumercontext, 'workspaceid')) {
            throw new invalid_parameter_exception('Payment is outside this workspace.');
        }
        $metadata = json_decode((string)$record->metadatajson, true);
        $metadata = is_array($metadata) ? $metadata : [];
        $metadata['dispute_reason'] = $reason;
        $metadata['disputedat'] = time();
        $record->status = 'disputed';
        $record->metadatajson = pqfin_metadata($metadata);
        $record->modifiedby = $actorid;
        $record->timemodified = time();
        $DB->update_record('local_prequran_payment', $record);
        pqfin_audit('payment_disputed', (int)$record->workspaceid, (int)$record->studentid, $targetid, [
            'targettype' => 'payment',
            'consumerid' => (int)$record->consumerid,
            'billingaccountid' => (int)$record->billingaccountid,
            'paymentid' => $targetid,
            'reason' => $reason,
            'actorid' => $actorid,
        ]);
        return $record;
    }
    throw new invalid_parameter_exception('Choose a valid dispute target.');
}

function pqfin_create_draft_invoice(
    int $workspaceid,
    int $billingaccountid,
    int $studentid,
    $consumercontext,
    int $actorid,
    array $metadata = []
): int {
    global $DB;

    if (!pqfin_invoice_schema_ready() || !pqfin_schema_ready()) {
        throw new invalid_parameter_exception('Invoice schema is not ready.');
    }
    if (!pqfin_billing_account_belongs_to_workspace($billingaccountid, $workspaceid, $consumercontext)) {
        throw new invalid_parameter_exception('Billing account is outside this workspace.');
    }
    if ($studentid > 0 && !pqfin_student_in_workspace($studentid, $workspaceid)) {
        throw new invalid_parameter_exception('Student is outside this workspace.');
    }
    $account = $DB->get_record('local_prequran_billing_account', ['id' => $billingaccountid], '*', MUST_EXIST);
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $policyinfo = pqfin_workspace_finance_policy($workspaceid, $context);
    $policy = pqfin_normalize_policy($policyinfo['policy']);
    $now = time();
    $id = (int)$DB->insert_record('local_prequran_invoice', (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'billingaccountid' => $billingaccountid,
        'studentid' => max(0, $studentid),
        'invoicenumber' => '',
        'invoicetype' => (string)($metadata['invoicetype'] ?? 'tuition'),
        'status' => 'draft',
        'currency' => pqfin_normalize_currency((string)($metadata['currency'] ?? ($account->currency ?: $policy['default_currency']))),
        'subtotal' => '0.00',
        'discounttotal' => '0.00',
        'taxtotal' => '0.00',
        'total' => '0.00',
        'paidamount' => '0.00',
        'creditedamount' => '0.00',
        'balancedue' => '0.00',
        'policyversion' => (int)$policyinfo['policyversion'],
        'policyhash' => (string)$policyinfo['policyhash'],
        'metadatajson' => pqfin_metadata($metadata + ['policy_source' => (string)$policyinfo['source']]),
        'issuedat' => 0,
        'dueat' => 0,
        'sentat' => 0,
        'voidedat' => 0,
        'createdby' => $actorid,
        'modifiedby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    pqfin_audit('invoice_created', $workspaceid, $studentid, $id, $metadata + [
        'targettype' => 'invoice',
        'consumerid' => (int)($context->consumerid ?? 0),
        'invoiceid' => $id,
        'billingaccountid' => $billingaccountid,
        'actorid' => $actorid,
    ]);
    return $id;
}

function pqfin_offering_pricing_summary($offering, array $policy = []): array {
    $rawcurrency = trim((string)($offering->pricing_currency ?? ''));
    $currency = pqfin_normalize_currency($rawcurrency !== '' ? $rawcurrency : (string)($policy['default_currency'] ?? pqfin_default_currency()));
    $tuition = pqfin_cents_to_money(max(0, pqfin_money_to_cents((string)($offering->tuition_amount ?? '0'))));
    $registration = pqfin_cents_to_money(max(0, pqfin_money_to_cents((string)($offering->registration_fee ?? '0'))));
    $materials = pqfin_cents_to_money(max(0, pqfin_money_to_cents((string)($offering->materials_fee ?? '0'))));
    $totalcents = pqfin_money_to_cents($tuition) + pqfin_money_to_cents($registration) + pqfin_money_to_cents($materials);
    return [
        'currency' => $currency,
        'tuition_amount' => $tuition,
        'registration_fee' => $registration,
        'materials_fee' => $materials,
        'total' => pqfin_cents_to_money($totalcents),
        'installment_eligible' => (int)($offering->installment_eligible ?? 0) === 1,
        'scholarship_eligible' => (int)($offering->scholarship_eligible ?? 0) === 1,
        'tax_behavior' => (string)($offering->tax_behavior ?? 'not_configured'),
        'refund_policy_label' => (string)($offering->refund_policy_label ?? ''),
        'payment_required_timing' => (string)($offering->payment_required_timing ?? 'workspace_policy'),
        'has_price' => $totalcents > 0,
    ];
}

function pqfin_pricing_visible_for_role(array $policy, string $role): bool {
    $visibility = (string)($policy['student_billing_visibility'] ?? 'disabled');
    if ($visibility === 'enabled_for_all') {
        return true;
    }
    return $visibility === 'enabled_for_adult_learners' && $role === 'student';
}

function pqfin_invoice_summary_for_requestids(array $requestids, int $workspaceid): array {
    global $DB;

    $requestids = array_values(array_filter(array_unique(array_map('intval', $requestids)), static fn(int $id): bool => $id > 0));
    if (!$requestids || $workspaceid <= 0 || !pqfin_invoice_schema_ready()) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($requestids, SQL_PARAMS_NAMED, 'requestid');
    $params['workspaceid'] = $workspaceid;
    $rows = $DB->get_records_sql(
        "SELECT il.requestid,
                COUNT(DISTINCT CASE WHEN i.status <> 'void' THEN i.id END) AS invoicecount,
                MAX(i.id) AS latestinvoiceid,
                MAX(i.timemodified) AS latestmodified,
                MAX(CASE WHEN i.status <> 'void' THEN i.id ELSE 0 END) AS activeinvoiceid,
                MAX(CASE WHEN i.status <> 'void' THEN i.status ELSE '' END) AS activestatus,
                MAX(CASE WHEN i.status <> 'void' THEN i.currency ELSE '' END) AS currency,
                MAX(CASE WHEN i.status <> 'void' THEN i.total ELSE '' END) AS total,
                MAX(CASE WHEN i.status <> 'void' THEN i.balancedue ELSE '' END) AS balancedue,
                MAX(CASE WHEN i.status <> 'void' THEN i.dueat ELSE 0 END) AS dueat
           FROM {local_prequran_invoice_line} il
           JOIN {local_prequran_invoice} i ON i.id = il.invoiceid
          WHERE il.workspaceid = :workspaceid
            AND il.requestid {$insql}
       GROUP BY il.requestid",
        $params
    );
    $summary = [];
    foreach ($rows as $row) {
        $requestid = (int)$row->requestid;
        $activestatus = (string)($row->activestatus ?? '');
        $balancedue = (string)($row->balancedue ?? '');
        $dueat = (int)($row->dueat ?? 0);
        $warnings = [];
        if ((int)$row->invoicecount > 1) {
            $warnings[] = 'duplicate_invoice';
        }
        if ($activestatus !== '' && $activestatus !== 'paid' && $dueat > 0 && $dueat < time() && pqfin_money_to_cents($balancedue) > 0) {
            $warnings[] = 'overdue';
        }
        $summary[$requestid] = [
            'invoicecount' => (int)$row->invoicecount,
            'invoiceid' => (int)($row->activeinvoiceid ?: $row->latestinvoiceid),
            'status' => $activestatus !== '' ? $activestatus : 'void',
            'currency' => (string)($row->currency ?? ''),
            'total' => (string)($row->total ?? ''),
            'balancedue' => $balancedue,
            'dueat' => $dueat,
            'warnings' => $warnings,
        ];
    }
    return $summary;
}

function pqfin_create_invoice_from_enrollment_request(int $requestid, int $workspaceid, $consumercontext, int $actorid): int {
    global $DB;

    if (!pqfin_invoice_schema_ready() || !pqfin_schema_ready()) {
        throw new invalid_parameter_exception('Invoice schema is not ready.');
    }
    $request = $DB->get_record_sql(
        "SELECT r.*, o.title AS offering_title, o.course_key, o.moodlecourseid,
                o.tuition_amount, o.pricing_currency, o.registration_fee, o.materials_fee,
                o.installment_eligible, o.scholarship_eligible, o.tax_behavior,
                o.refund_policy_label, o.payment_required_timing
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
          WHERE r.id = :requestid
            AND r.workspaceid = :workspaceid",
        ['requestid' => $requestid, 'workspaceid' => $workspaceid],
        IGNORE_MISSING
    );
    if (!$request || !pqh_record_belongs_to_consumer_context($request, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Choose a valid enrollment request in this workspace.');
    }
    $existing = pqfin_invoice_summary_for_requestids([$requestid], $workspaceid);
    if (!empty($existing[$requestid]) && (int)$existing[$requestid]['invoiceid'] > 0 && (string)$existing[$requestid]['status'] !== 'void') {
        throw new invalid_parameter_exception('This enrollment request already has an active invoice.');
    }
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $policyinfo = pqfin_workspace_finance_policy($workspaceid, $context);
    $policy = pqfin_normalize_policy($policyinfo['policy']);
    $pricing = pqfin_offering_pricing_summary($request, $policy);
    $accountid = pqfin_resolve_or_create_family_billing_account((int)$request->studentid, $workspaceid, $context, $actorid);
    $invoiceid = pqfin_create_draft_invoice($workspaceid, $accountid, (int)$request->studentid, $context, $actorid, [
        'source' => 'course_enrollment_request',
        'offeringid' => (int)$request->offeringid,
        'requestid' => (int)$request->id,
        'course_key' => (string)$request->course_key,
        'payment_required_timing' => (string)$pricing['payment_required_timing'],
        'currency' => (string)$pricing['currency'],
        'installment_eligible' => (bool)$pricing['installment_eligible'],
        'scholarship_eligible' => (bool)$pricing['scholarship_eligible'],
        'refund_policy_label' => (string)$pricing['refund_policy_label'],
        'tax_behavior' => (string)$pricing['tax_behavior'],
    ]);

    $base = [
        'offeringid' => (int)$request->offeringid,
        'requestid' => (int)$request->id,
        'moodlecourseid' => (int)$request->moodlecourseid,
        'teacherid' => 0,
        'quantity' => '1',
    ];
    $linecount = 0;
    foreach ([
        'Tuition - ' . (string)$request->offering_title => (string)$pricing['tuition_amount'],
        'Registration fee - ' . (string)$request->offering_title => (string)$pricing['registration_fee'],
        'Materials fee - ' . (string)$request->offering_title => (string)$pricing['materials_fee'],
    ] as $description => $amount) {
        if (pqfin_money_to_cents($amount) <= 0) {
            continue;
        }
        pqfin_save_invoice_line($invoiceid, $base + [
            'description' => $description,
            'unitamount' => $amount,
            'discountamount' => '0.00',
            'taxamount' => '0.00',
        ], $actorid);
        $linecount++;
    }
    if ($linecount === 0) {
        pqfin_save_invoice_line($invoiceid, $base + [
            'description' => 'Tuition - ' . (string)$request->offering_title,
            'unitamount' => '0.00',
            'discountamount' => '0.00',
            'taxamount' => '0.00',
        ], $actorid);
    }
    pqfin_audit('invoice_created_from_enrollment', $workspaceid, (int)$request->studentid, $invoiceid, [
        'targettype' => 'invoice',
        'consumerid' => (int)($context->consumerid ?? 0),
        'offeringid' => (int)$request->offeringid,
        'requestid' => (int)$request->id,
        'invoiceid' => $invoiceid,
        'actorid' => $actorid,
    ]);
    return $invoiceid;
}

function pqfin_next_invoice_line_sequence(int $invoiceid): int {
    global $DB;

    $max = $DB->get_field_sql(
        "SELECT MAX(linesequence)
           FROM {local_prequran_invoice_line}
          WHERE invoiceid = :invoiceid",
        ['invoiceid' => $invoiceid]
    );
    return max(1, ((int)$max) + 1);
}

function pqfin_save_invoice_line(int $invoiceid, array $line, int $actorid): int {
    global $DB;

    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if ((string)$invoice->status !== 'draft') {
        throw new invalid_parameter_exception('Issued invoices cannot be edited in Phase 3.');
    }
    $now = time();
    $lineid = (int)($line['id'] ?? 0);
    $record = $lineid > 0
        ? $DB->get_record('local_prequran_invoice_line', ['id' => $lineid, 'invoiceid' => $invoiceid], '*', MUST_EXIST)
        : (object)[
            'invoiceid' => $invoiceid,
            'consumerid' => (int)$invoice->consumerid,
            'workspaceid' => (int)$invoice->workspaceid,
            'linesequence' => pqfin_next_invoice_line_sequence($invoiceid),
            'createdby' => $actorid,
            'timecreated' => $now,
        ];

    $quantity = pqfin_normalize_quantity((string)($line['quantity'] ?? '1'));
    $unitamount = pqfin_cents_to_money(max(0, pqfin_money_to_cents((string)($line['unitamount'] ?? '0'))));
    $discountamount = pqfin_cents_to_money(max(0, pqfin_money_to_cents((string)($line['discountamount'] ?? '0'))));
    $taxamount = pqfin_cents_to_money(max(0, pqfin_money_to_cents((string)($line['taxamount'] ?? '0'))));
    $record->description = core_text::substr(trim((string)($line['description'] ?? 'Tuition')), 0, 255);
    $record->description = $record->description !== '' ? $record->description : 'Tuition';
    $record->quantity = $quantity;
    $record->unitamount = $unitamount;
    $record->discountamount = $discountamount;
    $record->taxamount = $taxamount;
    $record->linetotal = pqfin_cents_to_money(pqfin_invoice_line_total_cents([
        'quantity' => $quantity,
        'unitamount' => $unitamount,
        'discountamount' => $discountamount,
        'taxamount' => $taxamount,
    ]));
    $record->offeringid = max(0, (int)($line['offeringid'] ?? ($record->offeringid ?? 0)));
    $record->requestid = max(0, (int)($line['requestid'] ?? ($record->requestid ?? 0)));
    $record->moodlecourseid = max(0, (int)($line['moodlecourseid'] ?? ($record->moodlecourseid ?? 0)));
    $record->teacherid = max(0, (int)($line['teacherid'] ?? ($record->teacherid ?? 0)));
    $record->seriesid = max(0, (int)($line['seriesid'] ?? ($record->seriesid ?? 0)));
    $record->status = (string)($line['status'] ?? 'active') === 'void' ? 'void' : 'active';
    $record->metadatajson = pqfin_metadata((array)($line['metadata'] ?? []));
    $record->modifiedby = $actorid;
    $record->timemodified = $now;

    if ($lineid > 0) {
        $DB->update_record('local_prequran_invoice_line', $record);
        $id = $lineid;
        $event = 'invoice_line_updated';
    } else {
        $id = (int)$DB->insert_record('local_prequran_invoice_line', $record);
        $event = 'invoice_line_created';
    }
    pqfin_recalculate_invoice_totals($invoiceid, $actorid);
    pqfin_audit($event, (int)$invoice->workspaceid, (int)$invoice->studentid, $invoiceid, [
        'targettype' => 'invoice',
        'consumerid' => (int)$invoice->consumerid,
        'invoiceid' => $invoiceid,
        'invoicelineid' => $id,
        'actorid' => $actorid,
    ]);
    return $id;
}

function pqfin_issue_invoice(int $invoiceid, $consumercontext, int $actorid) {
    global $DB;

    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Invoice is outside this workspace.');
    }
    if ((string)$invoice->status !== 'draft') {
        throw new invalid_parameter_exception('Only draft invoices can be issued.');
    }
    $invoice = pqfin_recalculate_invoice_totals($invoiceid, $actorid);
    $context = pqfin_consumer_context_for_workspace((int)$invoice->workspaceid, $consumercontext);
    $policyinfo = pqfin_workspace_finance_policy((int)$invoice->workspaceid, $context);
    $policy = pqfin_normalize_policy($policyinfo['policy']);
    $now = time();
    if (trim((string)$invoice->invoicenumber) === '') {
        $invoice->invoicenumber = pqfin_generate_invoice_number($invoiceid, (int)$invoice->workspaceid, $policy);
    }
    $invoice->status = 'issued';
    $invoice->issuedat = $now;
    $invoice->dueat = $now + (max(0, (int)$policy['invoice_due_days']) * DAYSECS);
    $invoice->modifiedby = $actorid;
    $invoice->timemodified = $now;
    $DB->update_record('local_prequran_invoice', $invoice);
    pqfin_audit('invoice_issued', (int)$invoice->workspaceid, (int)$invoice->studentid, $invoiceid, [
        'targettype' => 'invoice',
        'consumerid' => (int)$invoice->consumerid,
        'invoiceid' => $invoiceid,
        'invoicenumber' => (string)$invoice->invoicenumber,
        'actorid' => $actorid,
    ]);
    try {
        pqfin_send_invoice_notification($invoiceid, 'invoice_issued', $context, $actorid);
    } catch (Throwable $e) {
        pqfin_audit('finance_notification_failed', (int)$invoice->workspaceid, (int)$invoice->studentid, $invoiceid, [
            'targettype' => 'invoice',
            'consumerid' => (int)$invoice->consumerid,
            'invoiceid' => $invoiceid,
            'eventtype' => 'invoice_issued',
            'error' => $e->getMessage(),
            'actorid' => $actorid,
        ]);
    }
    return $invoice;
}

function pqfin_mark_invoice_sent(int $invoiceid, $consumercontext, int $actorid) {
    global $DB;

    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Invoice is outside this workspace.');
    }
    if (!in_array((string)$invoice->status, ['issued', 'sent'], true)) {
        throw new invalid_parameter_exception('Only issued invoices can be marked sent.');
    }
    $invoice->status = 'sent';
    $invoice->sentat = time();
    $invoice->modifiedby = $actorid;
    $invoice->timemodified = time();
    $DB->update_record('local_prequran_invoice', $invoice);
    pqfin_audit('invoice_send_marked', (int)$invoice->workspaceid, (int)$invoice->studentid, $invoiceid, [
        'targettype' => 'invoice',
        'consumerid' => (int)$invoice->consumerid,
        'invoiceid' => $invoiceid,
        'actorid' => $actorid,
    ]);
    return $invoice;
}

function pqfin_void_invoice(int $invoiceid, $consumercontext, int $actorid, string $reason = '') {
    global $DB;

    $invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
    if (!pqh_record_belongs_to_consumer_context($invoice, $consumercontext, 'workspaceid')) {
        throw new invalid_parameter_exception('Invoice is outside this workspace.');
    }
    if (!in_array((string)$invoice->status, ['draft', 'issued', 'sent'], true)) {
        throw new invalid_parameter_exception('Invoice cannot be voided.');
    }
    if (pqfin_money_to_cents((string)$invoice->paidamount) > 0 || pqfin_money_to_cents((string)$invoice->creditedamount) > 0) {
        throw new invalid_parameter_exception('Paid or credited invoices require a correction workflow in a later phase.');
    }
    $metadata = json_decode((string)$invoice->metadatajson, true);
    $metadata = is_array($metadata) ? $metadata : [];
    $metadata['void_reason'] = trim($reason);
    $invoice->status = 'void';
    $invoice->metadatajson = pqfin_metadata($metadata);
    $invoice->voidedat = time();
    $invoice->modifiedby = $actorid;
    $invoice->timemodified = time();
    $DB->update_record('local_prequran_invoice', $invoice);
    pqfin_audit('invoice_voided', (int)$invoice->workspaceid, (int)$invoice->studentid, $invoiceid, [
        'targettype' => 'invoice',
        'consumerid' => (int)$invoice->consumerid,
        'invoiceid' => $invoiceid,
        'reason' => $reason,
        'actorid' => $actorid,
    ]);
    return $invoice;
}

function pqfin_create_billing_account(
    int $workspaceid,
    int $consumerid,
    string $accounttype,
    int $primaryuserid,
    string $displayname,
    string $billingemail,
    string $billingphone,
    string $currency,
    int $actorid,
    array $metadata = []
): int {
    global $DB;

    if ($workspaceid <= 0 || !pqfin_schema_ready()) {
        throw new invalid_parameter_exception('Billing account schema is not ready.');
    }
    $now = time();
    $id = (int)$DB->insert_record('local_prequran_billing_account', (object)[
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'accounttype' => core_text::substr($accounttype !== '' ? $accounttype : 'parent', 0, 40),
        'primaryuserid' => max(0, $primaryuserid),
        'displayname' => core_text::substr($displayname !== '' ? $displayname : 'Billing account', 0, 255),
        'billingemail' => core_text::substr($billingemail, 0, 255),
        'billingphone' => core_text::substr($billingphone, 0, 100),
        'currency' => pqfin_normalize_currency($currency),
        'status' => 'active',
        'metadatajson' => pqfin_metadata($metadata),
        'createdby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    pqfin_audit('billing_account_created', $workspaceid, (int)($metadata['studentid'] ?? 0), $id, $metadata + [
        'consumerid' => $consumerid,
        'billingaccountid' => $id,
        'accounttype' => $accounttype,
        'actorid' => $actorid,
    ]);
    return $id;
}

function pqfin_create_sponsor_billing_account(
    int $workspaceid,
    $consumercontext,
    string $displayname,
    string $billingemail,
    int $actorid,
    string $currency = ''
): int {
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $policyinfo = pqfin_workspace_finance_policy($workspaceid, $context);
    $policycurrency = (string)($policyinfo['policy']['default_currency'] ?? pqfin_default_currency());
    return pqfin_create_billing_account(
        $workspaceid,
        (int)($context->consumerid ?? 0),
        'sponsor',
        0,
        $displayname,
        $billingemail,
        '',
        $currency !== '' ? $currency : $policycurrency,
        $actorid,
        ['source' => 'manual_sponsor_account']
    );
}

function pqfin_link_student_finance(
    int $studentid,
    int $workspaceid,
    int $billingaccountid,
    $consumercontext,
    int $actorid,
    array $policy = []
): int {
    global $DB;

    if (!pqfin_schema_ready() || !pqfin_student_in_workspace($studentid, $workspaceid)) {
        throw new invalid_parameter_exception('Student finance profile cannot be linked.');
    }
    if (!pqfin_billing_account_belongs_to_workspace($billingaccountid, $workspaceid, $consumercontext)) {
        throw new invalid_parameter_exception('Billing account is outside this workspace.');
    }
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $now = time();
    $existing = $DB->get_record('local_prequran_student_finance', [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
    ], '*', IGNORE_MISSING);

    $record = (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'billingaccountid' => $billingaccountid,
        'financepolicyjson' => pqfin_metadata($policy),
        'holdstatus' => (string)($existing->holdstatus ?? 'none'),
        'status' => 'active',
        'createdby' => (int)($existing->createdby ?? $actorid),
        'timecreated' => (int)($existing->timecreated ?? $now),
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_student_finance', $record);
        pqfin_audit('student_finance_profile_updated', $workspaceid, $studentid, (int)$existing->id, [
            'consumerid' => (int)($context->consumerid ?? 0),
            'studentfinanceid' => (int)$existing->id,
            'billingaccountid' => $billingaccountid,
            'actorid' => $actorid,
        ]);
        return (int)$existing->id;
    }
    $id = (int)$DB->insert_record('local_prequran_student_finance', $record);
    pqfin_audit('student_finance_profile_created', $workspaceid, $studentid, $id, [
        'consumerid' => (int)($context->consumerid ?? 0),
        'studentfinanceid' => $id,
        'billingaccountid' => $billingaccountid,
        'actorid' => $actorid,
    ]);
    return $id;
}

function pqfin_resolve_or_create_family_billing_account(int $studentid, int $workspaceid, $consumercontext, int $actorid): int {
    global $DB;

    if (!pqfin_schema_ready() || !pqfin_student_in_workspace($studentid, $workspaceid)) {
        throw new invalid_parameter_exception('Student finance profile cannot be created.');
    }
    $existing = $DB->get_record('local_prequran_student_finance', [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'status' => 'active',
    ], '*', IGNORE_MISSING);
    if ($existing && (int)$existing->billingaccountid > 0
            && pqfin_billing_account_belongs_to_workspace((int)$existing->billingaccountid, $workspaceid, $consumercontext)) {
        return (int)$existing->billingaccountid;
    }

    $student = core_user::get_user($studentid, 'id,firstname,lastname,email,idnumber', MUST_EXIST);
    $parentids = pqfin_parent_ids_for_student($studentid, $workspaceid);
    $payer = null;
    foreach ($parentids as $parentid) {
        $candidate = core_user::get_user((int)$parentid, 'id,firstname,lastname,email', IGNORE_MISSING);
        if ($candidate) {
            $payer = $candidate;
            break;
        }
    }
    $accounttype = $payer ? 'parent' : 'student';
    $primaryuserid = $payer ? (int)$payer->id : $studentid;
    $billingemail = trim((string)($payer->email ?? $student->email ?? ''));
    $displayname = $payer
        ? 'Family account - ' . fullname($student)
        : 'Student account - ' . fullname($student);
    $context = pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
    $policyinfo = pqfin_workspace_finance_policy($workspaceid, $context);
    $policycurrency = (string)($policyinfo['policy']['default_currency'] ?? pqfin_default_currency());

    $billingaccountid = pqfin_create_billing_account(
        $workspaceid,
        (int)($context->consumerid ?? 0),
        $accounttype,
        $primaryuserid,
        $displayname,
        $billingemail,
        '',
        $policycurrency,
        $actorid,
        [
            'source' => 'student_finance_profile',
            'studentid' => $studentid,
            'payer_userid' => $primaryuserid,
            'parent_ids' => $parentids,
        ]
    );
    pqfin_link_student_finance($studentid, $workspaceid, $billingaccountid, $context, $actorid);
    return $billingaccountid;
}

function pqfin_student_finance_profile(int $studentid, int $workspaceid, $consumercontext = null, bool $create = false, int $actorid = 0): array {
    global $DB;

    if (!pqfin_schema_ready() || $studentid <= 0 || $workspaceid <= 0) {
        return ['finance' => null, 'billingaccount' => null, 'warnings' => ['billing_schema_missing']];
    }
    if ($create) {
        pqfin_resolve_or_create_family_billing_account($studentid, $workspaceid, $consumercontext, $actorid);
    }
    $finance = $DB->get_record('local_prequran_student_finance', [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'status' => 'active',
    ], '*', IGNORE_MISSING);
    $account = null;
    $warnings = [];
    if (!$finance) {
        $warnings[] = 'billing_account_missing';
    } else if ((int)$finance->billingaccountid <= 0) {
        $warnings[] = 'billing_account_missing';
    } else {
        $account = $DB->get_record('local_prequran_billing_account', ['id' => (int)$finance->billingaccountid], '*', IGNORE_MISSING);
        if (!$account) {
            $warnings[] = 'billing_account_missing';
        } else if (!pqfin_billing_account_belongs_to_workspace((int)$account->id, $workspaceid, $consumercontext)) {
            $warnings[] = 'billing_account_cross_workspace';
        }
    }
    return ['finance' => $finance ?: null, 'billingaccount' => $account ?: null, 'warnings' => $warnings];
}
