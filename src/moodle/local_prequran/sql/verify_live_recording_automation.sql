SELECT 'recording_table' AS check_name,
       CASE WHEN COUNT(*) >= 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_recording;

SELECT 'pending_review_queue' AS check_name,
       'INFO' AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_recording
WHERE status = 'available'
  AND playback_url <> ''
  AND (reviewedat = 0 OR visible_to_parent = 0);

SELECT 'parent_visible_safety' AS check_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_recording
WHERE visible_to_parent = 1
  AND (
      reviewedat = 0
      OR status <> 'available'
      OR playback_url = ''
      OR (expiresat > 0 AND expiresat < UNIX_TIMESTAMP(NOW()))
  );

SELECT 'expired_visible_recordings' AS check_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_recording
WHERE visible_to_parent = 1
  AND expiresat > 0
  AND expiresat < UNIX_TIMESTAMP(NOW());

SELECT 'recent_auto_sync_audit' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'INFO' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_audit
WHERE action IN ('recordings_auto_synced', 'recording_available_detected')
  AND timecreated >= UNIX_TIMESTAMP(NOW()) - 86400;

SELECT 'recent_queue_reminders' AS check_name,
       'INFO' AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_audit
WHERE action = 'recording_review_queue_reminder'
  AND timecreated >= UNIX_TIMESTAMP(NOW()) - 86400;

SELECT 'recent_expiry_reminders' AS check_name,
       'INFO' AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_audit
WHERE action = 'recording_expiry_reminder'
  AND timecreated >= UNIX_TIMESTAMP(NOW()) - 86400;
