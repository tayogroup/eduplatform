-- Group 8 verification: Pilot Findings Fix Pack & Rollout Readiness.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and intended to run after pilot fixes and before expanding rollout.

-- 1) Rollout blocker summary.
SELECT 'bbb_errors_open' AS blocker,
       COUNT(*) AS count_value
FROM mdlgx_local_prequran_live_session
WHERE bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
UNION ALL
SELECT 'parent_visible_recordings_without_review',
       COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE visible_to_parent = 1
  AND reviewedby = 0
UNION ALL
SELECT 'completed_sessions_missing_attendance',
       COUNT(*)
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
     ON p.sessionid = s.id
    AND p.role = 'student'
    AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
      AND a.studentid = p.studentid
WHERE s.status = 'completed'
  AND a.id IS NULL
UNION ALL
SELECT 'completed_sessions_missing_parent_summary',
       COUNT(*)
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
     ON p.sessionid = s.id
    AND p.role = 'student'
    AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
      AND n.studentid = p.studentid
      AND n.visible_to_parent = 1
WHERE s.status = 'completed'
  AND n.id IS NULL
UNION ALL
SELECT 'failed_notifications_7_days',
       COUNT(*)
FROM mdlgx_local_prequran_live_audit
WHERE action = 'notification_failed'
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY))
UNION ALL
SELECT 'privacy_or_denied_audit_7_days',
       COUNT(*)
FROM mdlgx_local_prequran_live_audit
WHERE (action LIKE '%privacy%' OR action LIKE '%denied%')
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));

-- 2) Recent pilot sessions by class size.
SELECT s.id,
       s.title,
       s.teacherid,
       FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
       s.status,
       COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.studentid END) AS active_students,
       CASE
           WHEN COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.studentid END) <= 3 THEN 'PILOT_1_TO_3'
           WHEN COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.studentid END) <= 5 THEN 'PILOT_5'
           WHEN COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.studentid END) <= 9 THEN 'PILOT_9'
           ELSE 'FULL_OR_OVERSIZED'
       END AS rollout_stage_shape,
       COUNT(DISTINCT a.id) AS attendance_rows,
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
       COUNT(DISTINCT r.id) AS recording_rows,
       COUNT(DISTINCT CASE WHEN r.visible_to_parent = 1 AND r.status = 'available' THEN r.id END) AS parent_visible_recordings,
       s.qa_status,
       s.qa_score
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_recording r
       ON r.sessionid = s.id
WHERE s.status <> 'cancelled'
GROUP BY s.id,
         s.title,
         s.teacherid,
         s.scheduled_start,
         s.status,
         s.qa_status,
         s.qa_score
ORDER BY s.scheduled_start DESC
LIMIT 50;

-- 3) Teacher readiness for rollout.
SELECT s.teacherid,
       COUNT(DISTINCT s.id) AS session_count,
       COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) AS completed_sessions,
       COUNT(DISTINCT p.studentid) AS distinct_students,
       COUNT(DISTINCT a.id) AS attendance_rows,
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
       ROUND(AVG(NULLIF(s.qa_score, 0)), 1) AS average_qa_score,
       COUNT(DISTINCT CASE WHEN s.qa_coaching_status <> 'none' AND s.qa_coaching_completedat = 0 THEN s.id END) AS open_coaching_items,
       COUNT(DISTINCT CASE WHEN s.improvement_plan_status <> 'none' AND s.improvement_plan_completedat = 0 THEN s.id END) AS open_improvement_plans
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
WHERE s.status <> 'cancelled'
GROUP BY s.teacherid
ORDER BY session_count DESC, average_qa_score DESC
LIMIT 50;

-- 4) Open follow-up and parent response issues before rollout.
SELECT n.id AS noteid,
       n.sessionid,
       s.title,
       n.studentid,
       n.teacherid,
       n.followup_status,
       n.followup_resolved,
       FROM_UNIXTIME(NULLIF(n.followup_contactedat, 0)) AS followup_contactedat,
       n.parent_response_status,
       FROM_UNIXTIME(NULLIF(n.parent_responseat, 0)) AS parent_responseat,
       CASE
           WHEN n.followup_status <> 'none'
            AND n.followup_resolved = 0
            AND COALESCE(NULLIF(n.followup_contactedat, 0), n.timemodified) <= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 2 DAY)) THEN 'OVERDUE'
           WHEN n.parent_response_status = 'needs_help' AND n.followup_resolved = 0 THEN 'PARENT_NEEDS_HELP'
           WHEN n.followup_status <> 'none' AND n.followup_resolved = 0 THEN 'OPEN'
           ELSE 'OK'
       END AS rollout_followup_status
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s
     ON s.id = n.sessionid
WHERE n.followup_status <> 'none'
   OR n.parent_response_status <> 'none'
ORDER BY rollout_followup_status ASC, n.timemodified DESC
LIMIT 100;

-- 5) Reminder and notification stability for the last 7 days.
SELECT action,
       COUNT(*) AS audit_count,
       MIN(FROM_UNIXTIME(timecreated)) AS first_seen,
       MAX(FROM_UNIXTIME(timecreated)) AS last_seen
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'live_reminder_24h_sent',
    'live_reminder_1h_sent',
    'followup_parent_reminder_sent',
    'followup_teacher_reminder_sent',
    'series_ack_parent_reminder_sent',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY))
GROUP BY action
ORDER BY last_seen DESC, action ASC;

-- 6) Recent severe-risk audit signals to review before rollout.
SELECT id,
       sessionid,
       actorid,
       action,
       targettype,
       targetid,
       LEFT(COALESCE(details, ''), 220) AS details_preview,
       FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action LIKE '%denied%'
   OR action LIKE '%privacy%'
   OR action LIKE '%failed%'
   OR action LIKE '%bbb%'
ORDER BY id DESC
LIMIT 100;

