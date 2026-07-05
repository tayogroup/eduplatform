<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/finance_lib.php');

function pqdo_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_bulk_job')
        && pqh_table_exists_safe('local_prequran_migration_run')
        && pqh_table_exists_safe('local_prequran_backup_check');
}

function pqdo_context(int $workspaceid, $consumercontext): stdClass {
    return pqfin_consumer_context_for_workspace($workspaceid, $consumercontext);
}

function pqdo_number(string $prefix, int $id, int $workspaceid): string {
    return $prefix . '-' . gmdate('Ymd') . '-W' . $workspaceid . '-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT);
}

function pqdo_emit_csv(string $filename, array $headers, array $rows): void {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . clean_filename($filename) . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

function pqdo_workspace_export_rows(int $workspaceid, string $dataset): array {
    global $DB;

    if ($dataset === 'members' && pqh_table_exists_safe('local_prequran_workspace_member')) {
        $rows = $DB->get_records_sql(
            "SELECT wm.userid, wm.workspace_role, wm.status, wm.timecreated, wm.timemodified,
                    u.firstname, u.lastname, u.email, u.username, u.idnumber
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid
              WHERE wm.workspaceid = :workspaceid
           ORDER BY wm.workspace_role ASC, u.lastname ASC, u.firstname ASC",
            ['workspaceid' => $workspaceid]
        );
        return [
            ['user_id', 'account_no', 'username', 'email', 'first_name', 'last_name', 'role', 'status', 'created_at', 'modified_at'],
            array_map(static fn($r): array => [(int)$r->userid, (string)$r->idnumber, (string)$r->username, (string)$r->email, (string)$r->firstname, (string)$r->lastname, (string)$r->workspace_role, (string)$r->status, (int)$r->timecreated, (int)$r->timemodified], array_values($rows)),
        ];
    }
    if ($dataset === 'invoices' && pqh_table_exists_safe('local_prequran_invoice')) {
        $rows = $DB->get_records('local_prequran_invoice', ['workspaceid' => $workspaceid], 'issuedat DESC, id DESC', '*', 0, 5000);
        return [
            ['invoice_id', 'invoice_number', 'student_id', 'billing_account_id', 'status', 'currency', 'total', 'paid', 'credited', 'balance', 'issued_at', 'due_at'],
            array_map(static fn($r): array => [(int)$r->id, (string)$r->invoicenumber, (int)$r->studentid, (int)$r->billingaccountid, (string)$r->status, (string)$r->currency, (string)$r->total, (string)$r->paidamount, (string)$r->creditedamount, (string)$r->balancedue, (int)$r->issuedat, (int)$r->dueat], array_values($rows)),
        ];
    }
    if ($dataset === 'documents' && pqh_table_exists_safe('local_prequran_document')) {
        $rows = $DB->get_records('local_prequran_document', ['workspaceid' => $workspaceid], 'timemodified DESC, id DESC', '*', 0, 5000);
        return [
            ['document_id', 'student_id', 'type', 'title', 'number', 'status', 'verification_status', 'issued_at', 'expires_at', 'modified_at'],
            array_map(static fn($r): array => [(int)$r->id, (int)$r->studentid, (string)$r->document_type, (string)$r->title, (string)$r->document_number, (string)$r->status, (string)$r->verification_status, (int)$r->issuedat, (int)$r->expiresat, (int)$r->timemodified], array_values($rows)),
        ];
    }
    return [['message'], [['Dataset is empty or unavailable.']]];
}

function pqdo_parse_csv_text(string $text): array {
    $rows = [];
    foreach (preg_split('/\R+/', trim($text)) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $rows[] = array_map('trim', str_getcsv($line));
    }
    return $rows;
}

function pqdo_process_member_rows(int $workspaceid, array $rows, bool $commit, int $actorid): array {
    global $DB;

    $stats = ['total' => 0, 'success' => 0, 'errors' => 0, 'messages' => []];
    foreach ($rows as $idx => $parts) {
        if (!$parts || strtolower((string)($parts[0] ?? '')) === 'role') {
            continue;
        }
        $stats['total']++;
        $role = strtolower((string)($parts[0] ?? ''));
        $identity = (string)($parts[1] ?? '');
        if (!in_array($role, ['owner', 'admin', 'teacher', 'assistant_teacher', 'coordinator', 'registrar', 'finance', 'support', 'auditor', 'sponsor', 'parent', 'student'], true)) {
            $stats['errors']++;
            $stats['messages'][] = 'Row ' . ($idx + 1) . ': invalid role.';
            continue;
        }
        $user = null;
        if (ctype_digit($identity)) {
            $user = core_user::get_user((int)$identity, '*', IGNORE_MISSING);
        }
        if (!$user && validate_email($identity)) {
            $user = $DB->get_record('user', ['email' => $identity, 'deleted' => 0], '*', IGNORE_MULTIPLE);
        }
        if (!$user && $identity !== '') {
            $user = $DB->get_record('user', ['username' => $identity, 'deleted' => 0], '*', IGNORE_MISSING);
        }
        if (!$user || !empty($user->suspended)) {
            $stats['errors']++;
            $stats['messages'][] = 'Row ' . ($idx + 1) . ': user not found or suspended.';
            continue;
        }
        if ($commit) {
            $existing = $DB->get_record('local_prequran_workspace_member', [
                'workspaceid' => $workspaceid,
                'userid' => (int)$user->id,
                'workspace_role' => $role,
            ], '*', IGNORE_MISSING);
            $now = time();
            if ($existing) {
                $existing->status = 'active';
                $existing->timemodified = $now;
                $DB->update_record('local_prequran_workspace_member', $existing);
            } else {
                $DB->insert_record('local_prequran_workspace_member', (object)[
                    'workspaceid' => $workspaceid,
                    'userid' => (int)$user->id,
                    'workspace_role' => $role,
                    'status' => 'active',
                    'createdby' => $actorid,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ]);
            }
        }
        $stats['success']++;
        $stats['messages'][] = 'Row ' . ($idx + 1) . ': ' . ($commit ? 'added ' : 'validated ') . fullname($user) . ' as ' . $role . '.';
    }
    return $stats;
}

function pqdo_record_bulk_job(int $workspaceid, $consumercontext, int $actorid, string $jobtype, string $dataset, string $input, array $result): int {
    global $DB;

    $context = pqdo_context($workspaceid, $consumercontext);
    $now = time();
    $id = (int)$DB->insert_record('local_prequran_bulk_job', (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'jobnumber' => '',
        'jobtype' => $jobtype,
        'dataset' => $dataset,
        'status' => ((int)($result['errors'] ?? 0) > 0 && (int)($result['success'] ?? 0) === 0) ? 'failed' : 'completed',
        'sourceformat' => 'csv',
        'totalrows' => (int)($result['total'] ?? 0),
        'processedrows' => (int)($result['total'] ?? 0),
        'successrows' => (int)($result['success'] ?? 0),
        'errorrows' => (int)($result['errors'] ?? 0),
        'inputsample' => core_text::substr($input, 0, 4000),
        'resultjson' => pqfin_metadata($result),
        'notes' => '',
        'startedat' => $now,
        'completedat' => $now,
        'createdby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $DB->set_field('local_prequran_bulk_job', 'jobnumber', pqdo_number('BLK', $id, $workspaceid), ['id' => $id]);
    return $id;
}

function pqdo_migration_inventory(int $workspaceid): array {
    global $DB;
    $tables = ['local_prequran_workspace_member', 'local_prequran_course_request', 'local_prequran_invoice', 'local_prequran_document', 'local_prequran_transcript_doc'];
    $counts = [];
    foreach ($tables as $table) {
        $counts[$table] = pqh_table_exists_safe($table)
            ? (pqh_table_has_field_safe($table, 'workspaceid') ? (int)$DB->count_records($table, ['workspaceid' => $workspaceid]) : (int)$DB->count_records($table))
            : -1;
    }
    return $counts;
}

function pqdo_record_migration_run(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;

    $inventory = pqdo_migration_inventory($workspaceid);
    $errors = count(array_filter($inventory, static fn($count): bool => $count < 0));
    $sourcecount = array_sum(array_filter($inventory, static fn($count): bool => $count > 0));
    $context = pqdo_context($workspaceid, $consumercontext);
    $now = time();
    $id = (int)$DB->insert_record('local_prequran_migration_run', (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'runnumber' => '',
        'migrationtype' => core_text::substr((string)($data['migrationtype'] ?? 'moodle_to_workspace'), 0, 120),
        'source_system' => core_text::substr((string)($data['source_system'] ?? 'moodle'), 0, 120),
        'target_system' => core_text::substr((string)($data['target_system'] ?? 'prequran_workspace'), 0, 120),
        'status' => $errors > 0 ? 'needs_review' : 'validated',
        'mode' => core_text::substr((string)($data['mode'] ?? 'dry_run'), 0, 40),
        'scopejson' => pqfin_metadata($inventory),
        'mappingjson' => trim((string)($data['mappingjson'] ?? '')),
        'validationjson' => pqfin_metadata(['missing_tables' => $errors, 'inventory' => $inventory]),
        'rollbackplan' => trim((string)($data['rollbackplan'] ?? '')),
        'sourcecount' => $sourcecount,
        'mappedcount' => $sourcecount,
        'errorcount' => $errors,
        'startedat' => $now,
        'completedat' => $now,
        'approvedby' => 0,
        'approvedat' => 0,
        'createdby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $DB->set_field('local_prequran_migration_run', 'runnumber', pqdo_number('MIG', $id, $workspaceid), ['id' => $id]);
    return $id;
}

function pqdo_backup_findings(int $workspaceid): array {
    global $CFG, $DB;

    $counts = pqdo_migration_inventory($workspaceid);
    $findings = [];
    $findings[] = ['key' => 'database_inventory', 'status' => min($counts) < 0 ? 'warning' : 'ok', 'summary' => 'Workspace data tables inventoried.'];
    $findings[] = ['key' => 'moodle_dataroot', 'status' => !empty($CFG->dataroot) && is_readable($CFG->dataroot) ? 'ok' : 'warning', 'summary' => 'Moodle dataroot readable check.'];
    $findings[] = ['key' => 'transcript_documents', 'status' => (($counts['local_prequran_transcript_doc'] ?? 0) >= 0) ? 'ok' : 'warning', 'summary' => 'Transcript document registry table exists.'];
    $findings[] = ['key' => 'recent_backup_record', 'status' => pqh_table_exists_safe('local_prequran_backup_check') && $DB->record_exists_select('local_prequran_backup_check', 'workspaceid = ? AND timecreated > ?', [$workspaceid, time() - 86400 * 30]) ? 'ok' : 'warning', 'summary' => 'Backup/DR check recorded in the last 30 days.'];
    return [$counts, $findings];
}

function pqdo_record_backup_check(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;

    [$counts, $findings] = pqdo_backup_findings($workspaceid);
    $warnings = count(array_filter($findings, static fn($f): bool => $f['status'] !== 'ok'));
    $context = pqdo_context($workspaceid, $consumercontext);
    $now = time();
    $id = (int)$DB->insert_record('local_prequran_backup_check', (object)[
        'consumerid' => (int)($context->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'checknumber' => '',
        'checktype' => core_text::substr((string)($data['checktype'] ?? 'readiness'), 0, 120),
        'status' => $warnings > 0 ? 'warning' : 'ok',
        'severity' => $warnings > 0 ? 'medium' : 'low',
        'metricsjson' => pqfin_metadata($counts),
        'findingsjson' => pqfin_metadata($findings),
        'runbookurl' => trim((string)($data['runbookurl'] ?? '')),
        'evidencenote' => trim((string)($data['evidencenote'] ?? '')),
        'lastbackupat' => (int)($data['lastbackupat'] ?? 0),
        'lastrestoretestat' => (int)($data['lastrestoretestat'] ?? 0),
        'nextcheckat' => (int)($data['nextcheckat'] ?? ($now + 86400 * 30)),
        'createdby' => $actorid,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $DB->set_field('local_prequran_backup_check', 'checknumber', pqdo_number('BDR', $id, $workspaceid), ['id' => $id]);
    return $id;
}
