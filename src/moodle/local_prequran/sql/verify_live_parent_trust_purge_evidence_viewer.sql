-- Phase 61 verification: Parent Trust Purge Recovery Viewer & Evidence Export.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Rows that should open in /local/hubredirect/live_parent_trust_purge_evidence.php?id={id}
SELECT
    id,
    actorid,
    action,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.retention_days')) AS retention_days,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.candidate_count')) AS candidate_count,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.deleted_count')) AS deleted_count,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.evidence_snapshot.record_id_count')) AS snapshot_record_count,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_purge_blocked',
    'parent_trust_purge_started',
    'parent_trust_purge_completed'
)
ORDER BY id DESC
LIMIT 20;

-- 2) Evidence export audit rows written when CSV or JSON export is downloaded.
SELECT
    id,
    actorid,
    targetid AS source_purge_audit_id,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.format')) AS export_format,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.record_id_count')) AS exported_record_count,
    FROM_UNIXTIME(timecreated) AS exported_at
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_purge_evidence_exported'
ORDER BY id DESC
LIMIT 50;

-- 3) Latest completed purge evidence details for export comparison.
SELECT
    id,
    JSON_EXTRACT(details, '$.sample_ids') AS sample_ids,
    JSON_EXTRACT(details, '$.evidence_snapshot.action_counts') AS action_counts,
    JSON_EXTRACT(details, '$.evidence_snapshot.reason_counts') AS reason_counts,
    JSON_EXTRACT(details, '$.evidence_snapshot.sample_rows') AS sample_rows
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_purge_completed'
ORDER BY id DESC
LIMIT 10;
