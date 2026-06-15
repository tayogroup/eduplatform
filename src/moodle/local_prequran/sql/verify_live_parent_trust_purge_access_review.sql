-- Phase 62 verification: Parent Trust Purge Recovery Access Controls & Export Audit Review.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Purge evidence page views and exports.
SELECT
    id,
    actorid,
    action,
    targetid AS source_purge_audit_id,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.source_action')) AS source_action,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.format')) AS export_format,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.export_reason')) AS export_reason,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.record_id_count')) AS record_id_count,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_purge_evidence_viewed',
    'parent_trust_purge_evidence_exported'
)
ORDER BY id DESC
LIMIT 100;

-- 2) Export reason compliance check.
SELECT
    id,
    actorid,
    targetid AS source_purge_audit_id,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.format')) AS export_format,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.export_reason')) AS export_reason,
    CASE
        WHEN NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(details, '$.export_reason'))), '') IS NULL THEN 'MISSING_REASON'
        ELSE 'PASS'
    END AS reason_check,
    FROM_UNIXTIME(timecreated) AS exported_at
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_purge_evidence_exported'
ORDER BY id DESC
LIMIT 100;

-- 3) Access counts by purge evidence record.
SELECT
    targetid AS source_purge_audit_id,
    SUM(CASE WHEN action = 'parent_trust_purge_evidence_viewed' THEN 1 ELSE 0 END) AS views,
    SUM(CASE WHEN action = 'parent_trust_purge_evidence_exported' THEN 1 ELSE 0 END) AS exports,
    COUNT(DISTINCT actorid) AS distinct_admins,
    MAX(FROM_UNIXTIME(timecreated)) AS latest_access
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_purge_evidence_viewed',
    'parent_trust_purge_evidence_exported'
)
GROUP BY targetid
ORDER BY MAX(timecreated) DESC
LIMIT 50;
