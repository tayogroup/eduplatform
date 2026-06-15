SELECT
    'today_sessions' AS metric,
    COUNT(*) AS value
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(CURDATE())
  AND scheduled_start < UNIX_TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY))
  AND status <> 'cancelled'
UNION ALL
SELECT
    'upcoming_7_days',
    COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(NOW())
  AND scheduled_start < UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 7 DAY))
  AND status <> 'cancelled'
UNION ALL
SELECT
    'bbb_errors',
    COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
UNION ALL
SELECT
    'recording_review_queue',
    COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE status = 'available'
  AND (reviewedat = 0 OR visible_to_parent = 0)
UNION ALL
SELECT
    'notification_issues_7_days',
    COUNT(*)
FROM mdlgx_local_prequran_live_audit
WHERE action IN ('notification_failed', 'notification_skipped')
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));
