SELECT
    id,
    sessionid,
    actorid,
    action,
    targettype,
    targetid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'live_reminder_24h_sent',
    'live_reminder_1h_sent',
    'live_followup_teacher_sent',
    'live_followup_admin_sent',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;
