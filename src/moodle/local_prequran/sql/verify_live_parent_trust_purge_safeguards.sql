-- Phase 59 verification: Parent Trust Purge Execution Safeguards.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Purge safeguard audit rows.
SELECT
    id,
    actorid AS adminid,
    action,
    targettype,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_purge_blocked',
    'parent_trust_purge_started',
    'parent_trust_purge_completed'
)
ORDER BY id DESC
LIMIT 100;

-- 2) Remaining eligible parent trust support audit records for 365-day policy.
SELECT
    COUNT(*) AS remaining_eligible_365_days
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
  AND timecreated < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 365 DAY));

-- 3) Confirm broader live audit rows are not part of the purge target list.
SELECT
    action,
    COUNT(*) AS event_count
FROM mdlgx_local_prequran_live_audit
WHERE action NOT IN (
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
GROUP BY action
ORDER BY event_count DESC
LIMIT 100;

-- 4) Latest purge completion detail.
SELECT
    id,
    actorid AS adminid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_purge_completed'
ORDER BY id DESC
LIMIT 1;

