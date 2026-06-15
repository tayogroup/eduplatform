-- Phase 60 verification: Parent Trust Purge Recovery Log & Evidence Snapshot.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Latest purge recovery log rows.
SELECT
    id,
    actorid,
    action,
    targettype,
    targetid,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.retention_days')) AS retention_days,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.export_confirmed')) AS export_confirmed,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.approval_ok')) AS approval_ok,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.candidate_count')) AS candidate_count,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.deleted_count')) AS deleted_count,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.evidence_snapshot.record_id_count')) AS snapshot_record_count,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.evidence_snapshot.staff_count')) AS snapshot_staff_count,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.evidence_snapshot.student_count')) AS snapshot_student_count,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_purge_blocked',
    'parent_trust_purge_started',
    'parent_trust_purge_completed'
)
ORDER BY id DESC
LIMIT 50;

-- 2) Latest completed purge evidence snapshot, including sample IDs.
SELECT
    id,
    actorid,
    JSON_UNQUOTE(JSON_EXTRACT(details, '$.deleted_count')) AS deleted_count,
    JSON_EXTRACT(details, '$.sample_ids') AS sample_ids,
    JSON_EXTRACT(details, '$.evidence_snapshot.action_counts') AS action_counts,
    JSON_EXTRACT(details, '$.evidence_snapshot.reason_counts') AS reason_counts,
    JSON_EXTRACT(details, '$.evidence_snapshot.sample_rows') AS sample_rows,
    FROM_UNIXTIME(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(details, '$.evidence_snapshot.oldest_timecreated')), '0')
    ) AS oldest_deleted_event,
    FROM_UNIXTIME(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(details, '$.evidence_snapshot.newest_timecreated')), '0')
    ) AS newest_deleted_event,
    FROM_UNIXTIME(timecreated) AS purge_completed_at
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_purge_completed'
ORDER BY id DESC
LIMIT 10;

-- 3) Raw fallback view if your MySQL/MariaDB JSON helpers are unavailable.
SELECT
    id,
    actorid,
    action,
    LEFT(details, 2000) AS details_preview,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_purge_blocked',
    'parent_trust_purge_started',
    'parent_trust_purge_completed'
)
ORDER BY id DESC
LIMIT 20;
