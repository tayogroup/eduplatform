-- Phase 47 verification: series change notifications and communication history.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Series-level notification processing audit rows.
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
    'series_change_notifications_processed',
    'series_cancel_notifications_processed',
    'series_single_session_cancel_notifications_processed'
)
ORDER BY id DESC
LIMIT 50;

-- 2) Recipient notification audit rows caused by series changes.
SELECT
    id,
    sessionid,
    actorid,
    action,
    targettype,
    targetid AS recipient_userid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN ('notification_sent', 'notification_failed', 'notification_skipped')
  AND (
      details LIKE '%series_teacher_%'
      OR details LIKE '%series_parent_%'
      OR details LIKE '%series_%cancel%'
  )
ORDER BY id DESC
LIMIT 100;

-- 3) Recent communication history by recurring series.
SELECT
    se.id AS seriesid,
    se.title,
    a.action,
    a.targettype,
    a.targetid,
    a.details,
    FROM_UNIXTIME(a.timecreated) AS timecreated
FROM mdlgx_local_prequran_live_series se
JOIN mdlgx_local_prequran_live_session s
     ON s.seriesid = se.id
JOIN mdlgx_local_prequran_live_audit a
     ON a.sessionid = s.id
WHERE a.action IN ('notification_sent', 'notification_failed', 'notification_skipped')
ORDER BY a.id DESC
LIMIT 100;

