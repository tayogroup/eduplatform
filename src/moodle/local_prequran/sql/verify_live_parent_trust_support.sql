-- Phase 53 verification: Parent Trust Dashboard admin preview and support tools.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Staff preview audit rows. A row should appear after an admin or teacher opens:
-- /local/hubredirect/live_parent_trust.php?childid=<student_user_id>
SELECT
    id,
    actorid,
    action,
    targettype,
    targetid AS studentid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action = 'parent_trust_preview_opened'
ORDER BY id DESC
LIMIT 50;

-- 2) Parent hub support counts for students currently assigned to live sessions.
SELECT
    p.studentid,
    COUNT(DISTINCT s.id) AS total_sessions,
    COUNT(DISTINCT CASE WHEN s.scheduled_start >= UNIX_TIMESTAMP(NOW()) AND s.status <> 'cancelled' THEN s.id END) AS upcoming_sessions,
    COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS visible_summaries,
    COUNT(DISTINCT CASE WHEN n.followup_status <> 'none' AND n.followup_resolved = 0 THEN n.id END) AS open_followups,
    COUNT(DISTINCT CASE WHEN r.visible_to_parent = 1 AND r.status = 'available' THEN r.id END) AS visible_recordings
FROM mdlgx_local_prequran_live_participant p
JOIN mdlgx_local_prequran_live_session s
     ON s.id = p.sessionid
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
      AND n.studentid = p.studentid
LEFT JOIN mdlgx_local_prequran_live_recording r
       ON r.sessionid = s.id
WHERE p.role = 'student'
  AND p.status = 'active'
GROUP BY p.studentid
ORDER BY p.studentid ASC
LIMIT 100;

-- 3) Linked parent/guardian records visible to the support preview.
SELECT
    c.studentid,
    c.guardianid AS parentid,
    FROM_UNIXTIME(c.timemodified) AS timemodified
FROM mdlgx_local_prequran_comm_consent c
ORDER BY c.studentid ASC, c.guardianid ASC
LIMIT 100;

-- 4) Pending schedule acknowledgements for parent trust support.
SELECT
    a.studentid,
    a.parentid,
    a.seriesid,
    a.ack_status,
    FROM_UNIXTIME(NULLIF(a.acknowledgedat, 0)) AS acknowledgedat,
    FROM_UNIXTIME(NULLIF(a.lastchangeat, 0)) AS lastchangeat,
    CASE
        WHEN a.ack_status <> 'acknowledged' OR a.acknowledgedat < a.lastchangeat THEN 'PENDING'
        ELSE 'CURRENT'
    END AS acknowledgement_state
FROM mdlgx_local_prequran_live_ack a
ORDER BY a.timemodified DESC, a.id DESC
LIMIT 100;

