-- Phase 57 verification: Parent Trust Data Retention & Purge Readiness.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Age buckets for parent trust support audit events.
SELECT
    CASE
        WHEN timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY)) THEN '0-30 days'
        WHEN timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY)) THEN '31-90 days'
        WHEN timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 180 DAY)) THEN '91-180 days'
        ELSE '180+ days'
    END AS age_bucket,
    COUNT(*) AS event_count
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
GROUP BY age_bucket
ORDER BY MIN(timecreated) DESC;

-- 2) Dry-run purge count for a 365-day retention policy.
SELECT
    COUNT(*) AS dry_run_eligible_365_days,
    MIN(FROM_UNIXTIME(timecreated)) AS oldest_candidate,
    MAX(FROM_UNIXTIME(timecreated)) AS newest_candidate
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
  AND timecreated < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 365 DAY));

-- 3) Dry-run candidate detail. This is a report only; do not delete from this query.
SELECT
    id,
    action,
    actorid AS staffid,
    targetid AS studentid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
  AND timecreated < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 365 DAY))
ORDER BY timecreated ASC, id ASC
LIMIT 100;

-- 4) Event type counts for retention review.
SELECT
    action,
    COUNT(*) AS event_count,
    MIN(FROM_UNIXTIME(timecreated)) AS oldest_event,
    MAX(FROM_UNIXTIME(timecreated)) AS newest_event
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
GROUP BY action
ORDER BY event_count DESC;

