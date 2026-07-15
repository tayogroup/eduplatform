SELECT 'workspace_series_ready' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK' END AS status
FROM mdlgx_local_prequran_live_series
WHERE workspaceid = 2;

SELECT 'series_management_audit' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_AFTER_SERIES_ACTION' END AS status
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'workspace_series_updated',
    'workspace_series_session_rescheduled',
    'workspace_series_single_session_cancelled',
    'workspace_series_cancelled'
)
  AND details LIKE '%"workspaceid":2%';

SELECT 'material_notification_audit' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_AFTER_MATERIAL_ACTION' END AS status
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'workspace_material_reviewed_parent_notified',
    'workspace_material_completed_teacher_notified'
)
  AND targettype = 'material_assignment';

SELECT 'weekly_digest_task_registered' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_AFTER_MOODLE_UPGRADE' END AS status
FROM mdlgx_task_scheduled
WHERE classname = '\\local_prequran\\task\\workspace_weekly_digest';

SELECT 'weekly_digest_audit' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_AFTER_TASK_RUNS' END AS status
FROM mdlgx_local_prequran_live_audit
WHERE action = 'workspace_weekly_digest_sent'
  AND targettype = 'workspace'
  AND targetid = 2;
