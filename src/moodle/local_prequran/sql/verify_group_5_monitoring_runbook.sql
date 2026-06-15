-- Group 5 verification: Production Monitoring, Support Runbook, and Launch Handoff.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and intended for daily operations monitoring.

-- 1) Today's operational summary.
SELECT 'today_sessions' AS metric,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(CURDATE())
  AND scheduled_start < UNIX_TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY))
  AND status <> 'cancelled'
UNION ALL
SELECT 'today_live_or_scheduled',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(CURDATE())
  AND scheduled_start < UNIX_TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY))
  AND status IN ('scheduled', 'live')
UNION ALL
SELECT 'today_completed',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(CURDATE())
  AND scheduled_start < UNIX_TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY))
  AND status = 'completed'
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
SELECT 'unresolved_followups',
       COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE followup_status <> 'none'
  AND followup_resolved = 0
UNION ALL
SELECT 'open_qa_coaching',
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

-- 2) Today's sessions requiring operational attention.
SELECT s.id,
       s.title,
       s.teacherid,
       FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
       FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
       s.status,
       s.bbb_created,
       LEFT(COALESCE(s.bbb_last_error, ''), 180) AS bbb_last_error,
       COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.id END) AS active_students,
       COUNT(DISTINCT a.id) AS attendance_rows,
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
WHERE s.scheduled_start >= UNIX_TIMESTAMP(CURDATE())
  AND s.scheduled_start < UNIX_TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY))
  AND s.status <> 'cancelled'
GROUP BY s.id,
         s.title,
         s.teacherid,
         s.scheduled_start,
         s.scheduled_end,
         s.status,
         s.bbb_created,
         s.bbb_last_error
ORDER BY s.scheduled_start ASC;

-- 3) Classes missing teacher, students, attendance, or summaries.
SELECT s.id,
       s.title,
       s.teacherid,
       FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
       s.status,
       COUNT(DISTINCT CASE WHEN p.role = 'teacher' THEN p.id END) AS teacher_participant_rows,
       COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.id END) AS active_students,
       COUNT(DISTINCT a.id) AS attendance_rows,
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
       CASE
           WHEN COUNT(DISTINCT CASE WHEN p.role = 'teacher' THEN p.id END) = 0 THEN 'MISSING_TEACHER_PARTICIPANT'
           WHEN COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.id END) = 0 THEN 'NO_ACTIVE_STUDENTS'
           WHEN s.status = 'completed' AND COUNT(DISTINCT a.id) = 0 THEN 'COMPLETED_WITHOUT_ATTENDANCE'
           WHEN s.status IN ('completed', 'awaiting_review', 'needs_review') AND COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) = 0 THEN 'MISSING_PARENT_SUMMARY'
           ELSE 'OK'
       END AS attention_reason
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
WHERE s.status <> 'cancelled'
GROUP BY s.id,
         s.title,
         s.teacherid,
         s.scheduled_start,
         s.status
HAVING attention_reason <> 'OK'
ORDER BY s.scheduled_start DESC
LIMIT 100;

-- 4) Open BBB errors for support triage.
SELECT id,
       title,
       teacherid,
       bbb_meeting_id,
       bbb_created,
       status,
       FROM_UNIXTIME(scheduled_start) AS scheduled_start,
       LEFT(COALESCE(bbb_last_error, ''), 240) AS bbb_last_error,
       FROM_UNIXTIME(timemodified) AS timemodified
FROM mdlgx_local_prequran_live_session
WHERE bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
ORDER BY timemodified DESC
LIMIT 50;

-- 5) Recording queue and parent visibility safety.
SELECT r.id,
       r.sessionid,
       s.title,
       r.status,
       r.published,
       r.visible_to_parent,
       r.reviewedby,
       FROM_UNIXTIME(NULLIF(r.reviewedat, 0)) AS reviewedat,
       FROM_UNIXTIME(NULLIF(r.expiresat, 0)) AS expiresat,
       CASE
           WHEN r.visible_to_parent = 1 AND r.reviewedby = 0 THEN 'VISIBLE_WITHOUT_REVIEW'
           WHEN r.status = 'available' AND r.reviewedby = 0 THEN 'PENDING_ADMIN_REVIEW'
           WHEN r.expiresat > 0 AND r.expiresat <= UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 7 DAY)) THEN 'EXPIRING_SOON'
           ELSE 'OK'
       END AS recording_status_check
FROM mdlgx_local_prequran_live_recording r
LEFT JOIN mdlgx_local_prequran_live_session s
       ON s.id = r.sessionid
WHERE r.visible_to_parent = 1
   OR r.reviewedby = 0
   OR (r.expiresat > 0 AND r.expiresat <= UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 7 DAY)))
ORDER BY r.timemodified DESC
LIMIT 100;

-- 6) Follow-up command-center queue.
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
           WHEN n.followup_status = 'admin_support_requested' AND n.followup_resolved = 0 THEN 'ADMIN_SUPPORT'
           WHEN n.followup_status <> 'none' AND n.followup_resolved = 0 THEN 'OPEN'
           ELSE 'OK'
       END AS queue_status
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s
     ON s.id = n.sessionid
WHERE n.followup_status <> 'none'
   OR n.parent_response_status <> 'none'
ORDER BY queue_status ASC, n.timemodified DESC
LIMIT 100;

-- 7) QA, coaching, leadership, and improvement-plan queue.
SELECT id,
       title,
       teacherid,
       qa_status,
       qa_score,
       qa_coaching_status,
       qa_coaching_priority,
       FROM_UNIXTIME(NULLIF(qa_coaching_due_date, 0)) AS qa_coaching_due_date,
       leadership_review_status,
       improvement_plan_status,
       improvement_plan_priority,
       FROM_UNIXTIME(NULLIF(improvement_plan_due_date, 0)) AS improvement_plan_due_date,
       CASE
           WHEN improvement_plan_status <> 'none' AND improvement_plan_completedat = 0 THEN 'IMPROVEMENT_PLAN_OPEN'
           WHEN leadership_review_status <> 'none' AND leadership_clearedat = 0 THEN 'LEADERSHIP_REVIEW_OPEN'
           WHEN qa_coaching_status <> 'none' AND qa_coaching_completedat = 0 THEN 'COACHING_OPEN'
           WHEN qa_status = 'needs_review' THEN 'QA_REVIEW_NEEDED'
           ELSE 'OK'
       END AS qa_queue_status
FROM mdlgx_local_prequran_live_session
WHERE qa_status = 'needs_review'
   OR (qa_coaching_status <> 'none' AND qa_coaching_completedat = 0)
   OR (leadership_review_status <> 'none' AND leadership_clearedat = 0)
   OR (improvement_plan_status <> 'none' AND improvement_plan_completedat = 0)
ORDER BY timemodified DESC
LIMIT 100;

-- 8) Notification and reminder health in the last 7 days.
SELECT action,
       COUNT(*) AS audit_count,
       MIN(FROM_UNIXTIME(timecreated)) AS first_seen,
       MAX(FROM_UNIXTIME(timecreated)) AS last_seen
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'live_reminder_24h_sent',
    'live_reminder_1h_sent',
    'live_followup_teacher_sent',
    'live_followup_admin_sent',
    'followup_parent_reminder_sent',
    'followup_teacher_reminder_sent',
    'followup_escalated_admin',
    'qa_review_reminder_sent',
    'qa_coaching_reminder_sent',
    'leadership_alert_sent',
    'improvement_plan_teacher_reminder_sent',
    'series_ack_parent_reminder_sent',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY))
GROUP BY action
ORDER BY last_seen DESC, action ASC;

-- 9) Parent acknowledgement queue for changed series schedules.
SELECT a.seriesid,
       se.title,
       a.studentid,
       a.parentid,
       a.ack_status,
       FROM_UNIXTIME(NULLIF(a.lastchangeat, 0)) AS lastchangeat,
       FROM_UNIXTIME(NULLIF(a.acknowledgedat, 0)) AS acknowledgedat,
       FROM_UNIXTIME(NULLIF(a.remindedat, 0)) AS remindedat,
       FROM_UNIXTIME(a.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_ack a
LEFT JOIN mdlgx_local_prequran_live_series se
       ON se.id = a.seriesid
WHERE a.ack_status <> 'acknowledged'
ORDER BY a.timemodified DESC
LIMIT 100;

-- 10) Recent privacy, support, and access-control audit rows.
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
   OR action LIKE '%support%'
   OR action LIKE '%purge%'
   OR action LIKE '%privacy%'
ORDER BY id DESC
LIMIT 100;
