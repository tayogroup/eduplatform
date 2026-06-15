-- Phase 50 verification: parent schedule acknowledgement reminder automation.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Pending parent acknowledgements and reminder state.
SELECT
    a.seriesid,
    se.title,
    a.studentid,
    a.parentid,
    a.ack_status,
    FROM_UNIXTIME(NULLIF(a.lastchangeat, 0)) AS last_change,
    FROM_UNIXTIME(NULLIF(a.remindedat, 0)) AS reminded_at,
    FROM_UNIXTIME(NULLIF(a.acknowledgedat, 0)) AS acknowledged_at,
    CASE
        WHEN a.ack_status = 'acknowledged' AND a.acknowledgedat >= a.lastchangeat THEN 'CURRENT'
        WHEN a.remindedat > 0 AND a.remindedat >= a.lastchangeat THEN 'REMINDER_SENT'
        ELSE 'PENDING_REMINDER'
    END AS receipt_state
FROM mdlgx_local_prequran_live_ack a
LEFT JOIN mdlgx_local_prequran_live_series se ON se.id = a.seriesid
ORDER BY a.timemodified DESC, a.seriesid DESC
LIMIT 100;

-- 2) Automation audit rows.
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
    'series_ack_auto_reminder_sent',
    'series_ack_auto_reminder_skipped',
    'series_ack_escalated_admin',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;

-- 3) Current acknowledgement coverage by series.
SELECT
    se.id AS seriesid,
    se.title,
    COUNT(a.id) AS tracked_parent_receipts,
    SUM(CASE WHEN a.ack_status = 'acknowledged' AND a.acknowledgedat >= a.lastchangeat THEN 1 ELSE 0 END) AS current_receipts,
    SUM(CASE WHEN a.ack_status <> 'acknowledged' OR a.acknowledgedat < a.lastchangeat THEN 1 ELSE 0 END) AS pending_receipts,
    MAX(FROM_UNIXTIME(NULLIF(a.remindedat, 0))) AS latest_reminder,
    MAX(FROM_UNIXTIME(NULLIF(a.acknowledgedat, 0))) AS latest_acknowledgement
FROM mdlgx_local_prequran_live_series se
LEFT JOIN mdlgx_local_prequran_live_ack a ON a.seriesid = se.id
GROUP BY se.id, se.title
ORDER BY se.id DESC
LIMIT 50;

