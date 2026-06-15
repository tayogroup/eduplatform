-- Group 10 verification: Stable Operations & Continuous Improvement.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and intended for monthly operational health review.

-- 1) Monthly live-session volume and completion trend.
SELECT DATE_FORMAT(FROM_UNIXTIME(scheduled_start), '%Y-%m') AS month,
       COUNT(*) AS scheduled_sessions,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_sessions,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_sessions,
       SUM(CASE WHEN status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) AS other_status_sessions,
       COUNT(DISTINCT teacherid) AS active_teachers
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
GROUP BY DATE_FORMAT(FROM_UNIXTIME(scheduled_start), '%Y-%m')
ORDER BY month DESC;

-- 2) Monthly student reach and average class size.
SELECT DATE_FORMAT(FROM_UNIXTIME(s.scheduled_start), '%Y-%m') AS month,
       COUNT(DISTINCT p.studentid) AS students_served,
       COUNT(DISTINCT s.id) AS sessions,
       ROUND(COUNT(DISTINCT p.studentid) / NULLIF(COUNT(DISTINCT s.id), 0), 1) AS avg_students_per_session
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
WHERE s.scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
  AND s.status <> 'cancelled'
GROUP BY DATE_FORMAT(FROM_UNIXTIME(s.scheduled_start), '%Y-%m')
ORDER BY month DESC;

-- 3) Teacher monthly quality and completion health.
SELECT s.teacherid,
       DATE_FORMAT(FROM_UNIXTIME(s.scheduled_start), '%Y-%m') AS month,
       COUNT(DISTINCT s.id) AS sessions,
       COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) AS completed_sessions,
       COUNT(DISTINCT p.studentid) AS distinct_students,
       COUNT(DISTINCT a.id) AS attendance_rows,
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
       ROUND(AVG(NULLIF(s.qa_score, 0)), 1) AS avg_qa_score,
       COUNT(DISTINCT CASE WHEN s.qa_coaching_status <> 'none' THEN s.id END) AS coaching_sessions,
       COUNT(DISTINCT CASE WHEN s.improvement_plan_status <> 'none' THEN s.id END) AS improvement_plan_sessions
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
WHERE s.scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
  AND s.status <> 'cancelled'
GROUP BY s.teacherid,
         DATE_FORMAT(FROM_UNIXTIME(s.scheduled_start), '%Y-%m')
ORDER BY month DESC, sessions DESC;

-- 4) Parent trust monthly indicators.
SELECT DATE_FORMAT(FROM_UNIXTIME(s.scheduled_start), '%Y-%m') AS month,
       COUNT(DISTINCT n.id) AS notes,
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
       COUNT(DISTINCT CASE WHEN n.followup_status <> 'none' THEN n.id END) AS followup_items,
       COUNT(DISTINCT CASE WHEN n.parent_response_status <> 'none' THEN n.id END) AS parent_responses,
       COUNT(DISTINCT CASE WHEN n.followup_status <> 'none' AND n.followup_resolved = 0 THEN n.id END) AS unresolved_followups
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
WHERE s.scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
GROUP BY DATE_FORMAT(FROM_UNIXTIME(s.scheduled_start), '%Y-%m')
ORDER BY month DESC;

-- 5) Recording lifecycle monthly indicators.
SELECT DATE_FORMAT(FROM_UNIXTIME(r.timecreated), '%Y-%m') AS month,
       COUNT(*) AS recordings_created,
       SUM(CASE WHEN r.reviewedby > 0 THEN 1 ELSE 0 END) AS recordings_reviewed,
       SUM(CASE WHEN r.visible_to_parent = 1 THEN 1 ELSE 0 END) AS recordings_visible_to_parent,
       SUM(CASE WHEN r.status = 'available' AND r.reviewedby = 0 THEN 1 ELSE 0 END) AS pending_review,
       SUM(CASE WHEN r.expiresat > 0 AND r.expiresat <= UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 30 DAY)) THEN 1 ELSE 0 END) AS expiring_30_days
FROM mdlgx_local_prequran_live_recording r
WHERE r.timecreated >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
GROUP BY DATE_FORMAT(FROM_UNIXTIME(r.timecreated), '%Y-%m')
ORDER BY month DESC;

-- 6) Support, privacy, and incident trend.
SELECT DATE_FORMAT(FROM_UNIXTIME(timecreated), '%Y-%m') AS month,
       SUM(CASE WHEN action LIKE '%support%' THEN 1 ELSE 0 END) AS support_audit_rows,
       SUM(CASE WHEN action LIKE '%privacy%' THEN 1 ELSE 0 END) AS privacy_audit_rows,
       SUM(CASE WHEN action LIKE '%denied%' THEN 1 ELSE 0 END) AS denied_access_rows,
       SUM(CASE WHEN action = 'notification_failed' THEN 1 ELSE 0 END) AS notification_failed_rows,
       SUM(CASE WHEN action LIKE '%purge%' THEN 1 ELSE 0 END) AS purge_related_rows
FROM mdlgx_local_prequran_live_audit
WHERE timecreated >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
GROUP BY DATE_FORMAT(FROM_UNIXTIME(timecreated), '%Y-%m')
ORDER BY month DESC;

-- 7) Current operational queues that should be reviewed monthly.
SELECT 'bbb_errors_open' AS queue,
       COUNT(*) AS item_count
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
SELECT 'unresolved_followups',
       COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE followup_status <> 'none'
  AND followup_resolved = 0
UNION ALL
SELECT 'qa_needs_review',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE qa_status = 'needs_review'
UNION ALL
SELECT 'open_coaching',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE qa_coaching_status <> 'none'
  AND qa_coaching_completedat = 0
UNION ALL
SELECT 'open_improvement_plans',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE improvement_plan_status <> 'none'
  AND improvement_plan_completedat = 0;

-- 8) Teacher capacity trend for future planning.
SELECT teacherid,
       COUNT(DISTINCT id) AS sessions_30_days,
       ROUND(SUM(GREATEST(scheduled_end - scheduled_start, 0)) / 3600, 1) AS live_hours_30_days,
       COUNT(DISTINCT DATE(FROM_UNIXTIME(scheduled_start))) AS active_days_30_days,
       ROUND(SUM(GREATEST(scheduled_end - scheduled_start, 0)) / 3600 / NULLIF(COUNT(DISTINCT DATE(FROM_UNIXTIME(scheduled_start))), 0), 1) AS avg_hours_per_active_day
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 30 DAY))
  AND status <> 'cancelled'
GROUP BY teacherid
ORDER BY live_hours_30_days DESC;

