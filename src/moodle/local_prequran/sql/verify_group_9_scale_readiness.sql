-- Group 9 verification: Controlled Launch Operations & Scale Readiness.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and intended for daily controlled-launch monitoring.

-- 1) Two-week launch summary.
SELECT 'scheduled_sessions_14_days' AS metric,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 14 DAY))
  AND status <> 'cancelled'
UNION ALL
SELECT 'completed_sessions_14_days',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 14 DAY))
  AND status = 'completed'
UNION ALL
SELECT 'cancelled_sessions_14_days',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 14 DAY))
  AND status = 'cancelled'
UNION ALL
SELECT 'active_teachers_14_days',
       COUNT(DISTINCT teacherid)
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 14 DAY))
  AND status <> 'cancelled'
UNION ALL
SELECT 'students_served_14_days',
       COUNT(DISTINCT p.studentid)
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
     ON p.sessionid = s.id
    AND p.role = 'student'
    AND p.status = 'active'
WHERE s.scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 14 DAY))
  AND s.status <> 'cancelled'
UNION ALL
SELECT 'bbb_errors_open',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
UNION ALL
SELECT 'recordings_pending_review',
       COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE status = 'available'
  AND reviewedby = 0
UNION ALL
SELECT 'open_followups',
       COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE followup_status <> 'none'
  AND followup_resolved = 0;

-- 2) Daily controlled-launch volume.
SELECT DATE(FROM_UNIXTIME(s.scheduled_start)) AS class_date,
       COUNT(DISTINCT s.id) AS sessions,
       COUNT(DISTINCT s.teacherid) AS teachers,
       COUNT(DISTINCT p.studentid) AS students,
       ROUND(COUNT(DISTINCT p.studentid) / NULLIF(COUNT(DISTINCT s.id), 0), 1) AS avg_students_per_session,
       COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) AS completed_sessions,
       COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) AS cancelled_sessions,
       COUNT(DISTINCT CASE WHEN s.bbb_last_error IS NOT NULL AND s.bbb_last_error <> '' THEN s.id END) AS bbb_error_sessions
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
WHERE s.scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 14 DAY))
GROUP BY DATE(FROM_UNIXTIME(s.scheduled_start))
ORDER BY class_date DESC;

-- 3) Teacher load and completion readiness.
SELECT s.teacherid,
       COUNT(DISTINCT s.id) AS sessions_14_days,
       COUNT(DISTINCT CASE WHEN DATE(FROM_UNIXTIME(s.scheduled_start)) = CURDATE() THEN s.id END) AS sessions_today,
       ROUND(SUM(GREATEST(s.scheduled_end - s.scheduled_start, 0)) / 3600, 1) AS scheduled_hours_14_days,
       ROUND(SUM(CASE WHEN DATE(FROM_UNIXTIME(s.scheduled_start)) = CURDATE()
                      THEN GREATEST(s.scheduled_end - s.scheduled_start, 0)
                      ELSE 0 END) / 3600, 1) AS scheduled_hours_today,
       COUNT(DISTINCT p.studentid) AS distinct_students_14_days,
       COUNT(DISTINCT a.id) AS attendance_rows,
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
       ROUND(AVG(NULLIF(s.qa_score, 0)), 1) AS average_qa_score,
       COUNT(DISTINCT CASE WHEN s.qa_coaching_status <> 'none' AND s.qa_coaching_completedat = 0 THEN s.id END) AS open_coaching_items
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
WHERE s.scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 14 DAY))
  AND s.status <> 'cancelled'
GROUP BY s.teacherid
ORDER BY scheduled_hours_today DESC, sessions_today DESC, sessions_14_days DESC;

-- 4) Oversized or capacity-risk classes.
SELECT s.id,
       s.title,
       s.teacherid,
       FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
       FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
       s.status,
       COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.studentid END) AS active_students,
       COUNT(DISTINCT p.id) AS participant_rows,
       s.max_participants,
       CASE
           WHEN COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.studentid END) > 9 THEN 'OVER_9_STUDENTS'
           WHEN COUNT(DISTINCT p.id) > s.max_participants THEN 'OVER_MAX_PARTICIPANTS'
           WHEN COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.studentid END) = 0 THEN 'NO_STUDENTS'
           ELSE 'OK'
       END AS capacity_status
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
WHERE s.scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 14 DAY))
  AND s.status <> 'cancelled'
GROUP BY s.id,
         s.title,
         s.teacherid,
         s.scheduled_start,
         s.scheduled_end,
         s.status,
         s.max_participants
HAVING capacity_status <> 'OK'
ORDER BY s.scheduled_start DESC;

-- 5) Recording review workload.
SELECT r.status,
       r.visible_to_parent,
       r.reviewedby,
       COUNT(*) AS recording_count,
       MIN(FROM_UNIXTIME(r.timemodified)) AS oldest_modified,
       MAX(FROM_UNIXTIME(r.timemodified)) AS newest_modified
FROM mdlgx_local_prequran_live_recording r
GROUP BY r.status, r.visible_to_parent, r.reviewedby
ORDER BY oldest_modified ASC;

-- 6) Parent support and follow-up pressure.
SELECT n.followup_status,
       n.parent_response_status,
       n.followup_resolved,
       COUNT(*) AS item_count,
       MIN(FROM_UNIXTIME(n.timemodified)) AS oldest_modified,
       MAX(FROM_UNIXTIME(n.timemodified)) AS newest_modified
FROM mdlgx_local_prequran_live_note n
WHERE n.followup_status <> 'none'
   OR n.parent_response_status <> 'none'
GROUP BY n.followup_status,
         n.parent_response_status,
         n.followup_resolved
ORDER BY oldest_modified ASC;

-- 7) QA and leadership scale readiness.
SELECT 'qa_needs_review' AS queue,
       COUNT(*) AS item_count
FROM mdlgx_local_prequran_live_session
WHERE qa_status = 'needs_review'
UNION ALL
SELECT 'open_coaching',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE qa_coaching_status <> 'none'
  AND qa_coaching_completedat = 0
UNION ALL
SELECT 'open_leadership_reviews',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE leadership_review_status <> 'none'
  AND leadership_clearedat = 0
UNION ALL
SELECT 'open_improvement_plans',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE improvement_plan_status <> 'none'
  AND improvement_plan_completedat = 0;

-- 8) Reminder and notification stability during controlled launch.
SELECT action,
       COUNT(*) AS audit_count,
       MIN(FROM_UNIXTIME(timecreated)) AS first_seen,
       MAX(FROM_UNIXTIME(timecreated)) AS last_seen
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'live_reminder_24h_sent',
    'live_reminder_1h_sent',
    'series_ack_parent_reminder_sent',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 14 DAY))
GROUP BY action
ORDER BY last_seen DESC, action ASC;

