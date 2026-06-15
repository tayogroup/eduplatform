-- Phase 26 verification: live follow-up to parent-teacher messaging linkage.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Link columns exist.
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_live_note'
  AND COLUMN_NAME IN ('followup_threadid', 'followup_contactedat')
ORDER BY FIELD(COLUMN_NAME, 'followup_threadid', 'followup_contactedat');

-- 2) Live follow-ups linked to messaging threads.
SELECT
    n.sessionid,
    s.title,
    n.studentid,
    n.teacherid,
    n.followup_status,
    n.followup_threadid,
    t.type AS thread_type,
    t.subject,
    t.status AS thread_status,
    COUNT(DISTINCT p.userid) AS participant_count,
    COUNT(DISTINCT m.id) AS message_count,
    FROM_UNIXTIME(NULLIF(n.followup_contactedat, 0)) AS followup_contactedat
FROM mdlgx_local_prequran_live_note n
LEFT JOIN mdlgx_local_prequran_live_session s ON s.id = n.sessionid
LEFT JOIN mdlgx_local_prequran_comm_thread t ON t.id = n.followup_threadid
LEFT JOIN mdlgx_local_prequran_comm_participant p ON p.threadid = t.id
LEFT JOIN mdlgx_local_prequran_comm_message m ON m.threadid = t.id
WHERE n.followup_threadid > 0
GROUP BY
    n.sessionid,
    s.title,
    n.studentid,
    n.teacherid,
    n.followup_status,
    n.followup_threadid,
    t.type,
    t.subject,
    t.status,
    n.followup_contactedat
ORDER BY n.followup_contactedat DESC
LIMIT 50;

-- 3) Communication audit for live follow-up linking.
SELECT
    id,
    threadid,
    messageid,
    actorid,
    action,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_comm_audit
WHERE action = 'live_followup_linked'
ORDER BY id DESC
LIMIT 50;

-- 4) Live audit for messaging linkage.
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
WHERE action = 'followup_message_thread_linked'
ORDER BY id DESC
LIMIT 50;
