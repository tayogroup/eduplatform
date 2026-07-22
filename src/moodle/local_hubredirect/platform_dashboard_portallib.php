<?php
// Platform-dashboard helper library — extracted VERBATIM from platform_dashboard.php
// (renamed pqpd_* -> pqpdl_*) for the token-gated portal endpoint. The legacy page
// keeps its inline copies and stays untouched (parallel-run). The pqpd_ prefix is
// avoided because portal_data.php already owns pqpd_fail()/pqpd_names().
// Requires: local/hubredirect/accesslib.php loaded first (pqh_consumer_schema_ready,
// pqh_table_exists_safe are shared there and are NOT copied here).

defined('MOODLE_INTERNAL') || die();

function pqpdl_consumer_type_label(string $type): string {
    $labels = [
        'platform_foundation' => 'Foundation',
        'academy_consumer' => 'Academies',
        'institution' => 'Institutions',
        'marketplace' => 'Marketplaces',
        'teacher_workspace' => 'Teacher workspaces',
    ];
    return $labels[$type] ?? ucwords(str_replace('_', ' ', $type !== '' ? $type : 'consumer'));
}

function pqpdl_status_class(string $status): string {
    return preg_replace('/[^a-z0-9_-]/i', '', strtolower($status !== '' ? $status : 'unknown'));
}

function pqpdl_consumer_rows(): array {
    global $DB;
    if (!pqh_consumer_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT c.id, c.slug, c.name, c.consumer_type, c.status, c.primaryworkspaceid, c.supportemail,
                c.defaultpublicpath, c.defaultdashboardpath,
                w.name AS workspacename, w.slug AS workspaceslug, w.status AS workspacestatus, w.workspace_type,
                COUNT(d.id) AS domaincount,
                SUM(CASE WHEN d.status = 'active' THEN 1 ELSE 0 END) AS activedomains
           FROM {local_prequran_consumer} c
      LEFT JOIN {local_prequran_workspace} w ON w.id = c.primaryworkspaceid
      LEFT JOIN {local_prequran_consumer_domain} d ON d.consumerid = c.id
       GROUP BY c.id, c.slug, c.name, c.consumer_type, c.status, c.primaryworkspaceid, c.supportemail,
                c.defaultpublicpath, c.defaultdashboardpath, w.name, w.slug, w.status, w.workspace_type
       ORDER BY c.consumer_type ASC, c.name ASC"
    ));
}

function pqpdl_domain_rows(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_consumer_domain') || !pqh_table_exists_safe('local_prequran_consumer')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT d.id, d.domain, d.domain_type, d.status, d.sslstatus, d.verificationstatus, d.isprimary,
                c.slug AS consumerslug, c.name AS consumername, c.consumer_type
           FROM {local_prequran_consumer_domain} d
           JOIN {local_prequran_consumer} c ON c.id = d.consumerid
       ORDER BY d.status ASC, d.isprimary DESC, d.domain ASC"
    ));
}
