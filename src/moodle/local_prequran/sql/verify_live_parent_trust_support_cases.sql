-- Phase 55 verification: Parent Trust Access Reason & Support Case Logging.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Reasoned parent trust preview rows.
SELECT
    id,
    actorid AS staffid,
    targetid AS studentid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_preview_opened'
  AND targettype = 'student'
  AND details LIKE '%"support_reason":%'
ORDER BY id DESC
LIMIT 100;

-- 2) Support case log and resolution events.
SELECT
    id,
    actorid AS staffid,
    action,
    targetid AS studentid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
ORDER BY id DESC
LIMIT 100;

-- 3) Preview reason counts for the last 30 days.
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
    COUNT(*) AS preview_count,
    COUNT(DISTINCT actorid) AS staff_count,
    COUNT(DISTINCT targetid) AS student_count
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_preview_opened'
  AND targettype = 'student'
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
GROUP BY support_reason
ORDER BY preview_count DESC;

-- 4) Case status counts.
SELECT
    CASE
        WHEN details LIKE '%"case_status":"resolved"%' THEN 'resolved'
        WHEN details LIKE '%"case_status":"escalated"%' THEN 'escalated'
        WHEN details LIKE '%"case_status":"open"%' THEN 'open'
        ELSE 'not_recorded'
    END AS case_status,
    COUNT(*) AS event_count
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved'
)
GROUP BY case_status
ORDER BY event_count DESC;

