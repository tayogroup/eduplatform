<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');

function pqgov_ready(): bool {
    return pqh_table_exists_safe('local_prequran_retention_rule')
        && pqh_table_exists_safe('local_prequran_privacy_req')
        && pqh_table_exists_safe('local_prequran_privacy_action')
        && pqh_table_exists_safe('local_prequran_consent_hist')
        && pqh_table_exists_safe('local_prequran_audit_report')
        && pqh_table_exists_safe('local_prequran_analytics_snap');
}

function pqgov_json(array $data): string {
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function pqgov_date_to_time(string $value, bool $endofday = false): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $time = strtotime($value . ($endofday ? ' 23:59:59' : ' 00:00:00'));
    return $time ? (int)$time : 0;
}

function pqgov_count(string $table, array $conditions): int {
    global $DB;
    return pqh_table_exists_safe($table) ? (int)$DB->count_records($table, $conditions) : 0;
}

function pqgov_count_select(string $table, string $where, array $params): int {
    global $DB;
    if (!pqh_table_exists_safe($table)) {
        return 0;
    }
    try {
        return (int)$DB->count_records_select($table, $where, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqgov_sum_select(string $table, string $field, string $where, array $params): float {
    global $DB;
    if (!pqh_table_exists_safe($table)) {
        return 0.0;
    }
    try {
        return (float)$DB->get_field_sql("SELECT COALESCE(SUM(CAST($field AS DECIMAL(20,2))), 0) FROM {" . $table . "} WHERE $where", $params);
    } catch (Throwable $e) {
        return 0.0;
    }
}

function pqgov_staff(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal(['owner', 'admin', 'coordinator', 'registrar', 'finance', 'support', 'auditor'], SQL_PARAMS_NAMED, 'role');
    $params['workspaceid'] = $workspaceid;
    $params['status'] = 'active';
    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.email, wm.workspace_role
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.status = :status
            AND wm.workspace_role $insql
       ORDER BY wm.workspace_role ASC, u.lastname ASC",
        $params
    ));
}

function pqgov_workspace_users(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.email, wm.workspace_role
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.status = :status
       ORDER BY wm.workspace_role ASC, u.lastname ASC",
        ['workspaceid' => $workspaceid, 'status' => 'active']
    ));
}

function pqgov_audit_summary(int $workspaceid, int $start, int $end): array {
    return [
        'transcript_events' => pqgov_count_select('local_prequran_course_audit', 'workspaceid = :workspaceid AND timecreated BETWEEN :start AND :end AND (targettype = :doc OR action LIKE :transcript)', ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end, 'doc' => 'transcript_doc', 'transcript' => '%transcript%']),
        'finance_events' => pqgov_count_select('local_prequran_finance_audit', 'workspaceid = :workspaceid AND timecreated BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end]),
        'enrollment_events' => pqgov_count_select('local_prequran_course_audit', 'workspaceid = :workspaceid AND timecreated BETWEEN :start AND :end AND (targettype = :request OR action LIKE :enrollment)', ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end, 'request' => 'course_enrol_req', 'enrollment' => '%enrollment%']),
        'grade_events' => pqgov_count_select('local_prequran_grade_audit', 'workspaceid = :workspaceid AND timecreated BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end]),
        'document_events' => pqgov_count_select('local_prequran_document_audit', 'workspaceid = :workspaceid AND timecreated BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end]),
        'privacy_requests' => pqgov_count_select('local_prequran_privacy_req', 'workspaceid = :workspaceid AND timecreated BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end]),
    ];
}

function pqgov_exec_metrics(int $workspaceid, int $start, int $end): array {
    $applications = pqgov_count_select('local_prequran_admission_app', 'workspaceid = :workspaceid AND timecreated BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end]);
    $accepted = pqgov_count_select('local_prequran_admission_app', 'workspaceid = :workspaceid AND decision = :accepted AND timecreated BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'accepted' => 'accepted', 'start' => $start, 'end' => $end]);
    $enrolled = pqgov_count_select('local_prequran_course_enrol_req', 'workspaceid = :workspaceid AND (status = :approved OR status = :active) AND timecreated BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'approved' => 'approved', 'active' => 'active', 'start' => $start, 'end' => $end]);
    $dropped = pqgov_count_select('local_prequran_course_enrol_req', 'workspaceid = :workspaceid AND (status = :dropped OR status = :droprequested) AND timemodified BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'dropped' => 'dropped', 'droprequested' => 'drop_requested', 'start' => $start, 'end' => $end]);
    $revenue = pqgov_sum_select('local_prequran_invoice', 'paidamount', 'workspaceid = :workspaceid AND issuedat BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end]);
    $ar = pqgov_sum_select('local_prequran_invoice', 'balancedue', 'workspaceid = :workspaceid AND status <> :voided', ['workspaceid' => $workspaceid, 'voided' => 'voided']);
    $overdue = pqgov_sum_select('local_prequran_invoice', 'balancedue', 'workspaceid = :workspaceid AND dueat > 0 AND dueat < :now AND status <> :paid', ['workspaceid' => $workspaceid, 'now' => time(), 'paid' => 'paid']);
    $collections = pqgov_sum_select('local_prequran_payment', 'amount', 'workspaceid = :workspaceid AND receivedat BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end]);
    $teacherminutes = pqgov_sum_select('local_prequran_teacher_load', 'weekly_minutes', 'workspaceid = :workspaceid AND calculatedat BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end]);
    $progress = pqgov_count_select('local_prequran_skill_mastery', 'workspaceid = :workspaceid AND mastery_status IN (:mastered, :advanced) AND timemodified BETWEEN :start AND :end', ['workspaceid' => $workspaceid, 'mastered' => 'mastered', 'advanced' => 'advanced', 'start' => $start, 'end' => $end]);
    $tuition = pqgov_sum_select('local_prequran_course_offering', 'tuition_amount', 'workspaceid = :workspaceid AND status <> :archived', ['workspaceid' => $workspaceid, 'archived' => 'archived']);
    return [
        'applications' => $applications,
        'accepted' => $accepted,
        'enrolled' => $enrolled,
        'funnel_accept_rate' => $applications > 0 ? round(($accepted / $applications) * 100, 1) : 0,
        'funnel_enroll_rate' => $applications > 0 ? round(($enrolled / $applications) * 100, 1) : 0,
        'dropped' => $dropped,
        'retention_rate' => ($enrolled + $dropped) > 0 ? round(($enrolled / ($enrolled + $dropped)) * 100, 1) : 0,
        'churn_rate' => ($enrolled + $dropped) > 0 ? round(($dropped / ($enrolled + $dropped)) * 100, 1) : 0,
        'revenue' => $revenue,
        'ar_balance' => $ar,
        'ar_overdue' => $overdue,
        'collections' => $collections,
        'teacher_minutes' => $teacherminutes,
        'mastery_updates' => $progress,
        'course_profitability_proxy' => $tuition - $teacherminutes,
    ];
}
