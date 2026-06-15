-- Phase 56 verification: Parent Trust Compliance Export & Review Pack.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Review pack source events for the last 30 days.
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
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
ORDER BY timecreated DESC, id DESC
LIMIT 200;

-- 2) Review pack summary counts for the last 30 days.
SELECT
    COUNT(*) AS total_events,
    SUM(CASE WHEN action = 'parent_trust_preview_opened' THEN 1 ELSE 0 END) AS preview_events,
    SUM(CASE WHEN action = 'parent_trust_preview_opened' AND details LIKE '%"support_reason":%' THEN 1 ELSE 0 END) AS reasoned_preview_events,
    COUNT(DISTINCT actorid) AS staff_involved,
    COUNT(DISTINCT targetid) AS students_previewed,
    SUM(CASE WHEN action = 'parent_trust_support_case_logged' THEN 1 ELSE 0 END) AS cases_opened,
    SUM(CASE WHEN action = 'parent_trust_support_case_resolved' THEN 1 ELSE 0 END) AS cases_resolved,
    SUM(CASE WHEN details LIKE '%"case_status":"escalated"%' THEN 1 ELSE 0 END) AS cases_escalated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY));

-- 3) Reason breakdown for the review pack.
SELECT
    CASE
        WHEN details LIKE '%"support_reason":"parent_support_request"%' THEN 'parent_support_request'
        WHEN details LIKE '%"support_reason":"scheduling_issue"%' THEN 'scheduling_issue'
        WHEN details LIKE '%"support_reason":"recording_summary_question"%' THEN 'recording_summary_question'
        WHEN details LIKE '%"support_reason":"technical_support"%' THEN 'technical_support'
        WHEN details LIKE '%"support_reason":"safety_privacy_review"%' THEN 'safety_privacy_review'
        WHEN details LIKE '%"support_reason":"other"%' THEN 'other'
        ELSE 'not_recorded'
    END AS support_reason,
    COUNT(*) AS event_count
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
GROUP BY support_reason
ORDER BY event_count DESC;

