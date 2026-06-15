-- Phase 29 verification: Follow-Up Command Center.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Follow-up command center queue data.
SELECT
    n.id AS noteid,
    n.sessionid,
    s.title,
    n.studentid,
    s.teacherid,
    n.followup_status,
    n.followup_resolved,
    FROM_UNIXTIME(NULLIF(n.followup_contactedat, 0)) AS followup_contactedat,
    n.parent_response_status,
    FROM_UNIXTIME(NULLIF(n.parent_responseat, 0)) AS parent_responseat,
    CASE
        WHEN n.followup_status <> 'none'
             AND n.followup_resolved = 0
             AND COALESCE(NULLIF(n.followup_contactedat, 0), n.timemodified) <= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 2 DAY))
            THEN 'OVERDUE'
        WHEN n.followup_status = 'admin_support_requested'
             AND n.followup_resolved = 0
            THEN 'ADMIN_SUPPORT'
        WHEN n.parent_response_status = 'needs_help'
             AND n.followup_resolved = 0
            THEN 'PARENT_NEEDS_HELP'
        WHEN n.followup_resolved = 1
            THEN 'RESOLVED'
        ELSE 'OPEN'
    END AS command_center_status,
    FROM_UNIXTIME(n.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s
     ON s.id = n.sessionid
WHERE n.followup_status <> 'none'
ORDER BY
    n.followup_resolved ASC,
    command_center_status ASC,
    COALESCE(NULLIF(n.followup_contactedat, 0), n.timemodified) ASC
LIMIT 100;

-- 2) Command center action audit rows.
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
    'followup_resolved_command_center',
    'followup_reopened_command_center',
    'followup_escalated_command_center',
    'followup_updated_command_center'
)
ORDER BY id DESC
LIMIT 100;

-- 3) Current command center metrics.
SELECT 'open' AS metric, COUNT(*) AS value
FROM mdlgx_local_prequran_live_note
WHERE followup_status <> 'none'
  AND followup_resolved = 0
UNION ALL
SELECT 'parent_needs_help', COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE followup_status <> 'none'
  AND followup_resolved = 0
  AND parent_response_status = 'needs_help'
UNION ALL
SELECT 'overdue', COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE followup_status <> 'none'
  AND followup_resolved = 0
  AND COALESCE(NULLIF(followup_contactedat, 0), timemodified) <= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 2 DAY))
UNION ALL
SELECT 'admin_support', COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE followup_status = 'admin_support_requested'
  AND followup_resolved = 0
UNION ALL
SELECT 'resolved', COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE followup_status <> 'none'
  AND followup_resolved = 1;
