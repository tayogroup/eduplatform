-- Group 4 verification: Production Smoke Tests & Operational QA Pack.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and safe to run in phpMyAdmin.

-- 1) Core live-class table readiness.
SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_live_session' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_live_participant'
    UNION ALL SELECT 'mdlgx_local_prequran_live_attendance'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note'
    UNION ALL SELECT 'mdlgx_local_prequran_live_recording'
    UNION ALL SELECT 'mdlgx_local_prequran_live_consent'
    UNION ALL SELECT 'mdlgx_local_prequran_live_audit'
    UNION ALL SELECT 'mdlgx_local_prequran_live_series'
    UNION ALL SELECT 'mdlgx_local_prequran_live_availability'
    UNION ALL SELECT 'mdlgx_local_prequran_live_ack'
    UNION ALL SELECT 'mdlgx_local_prequran_comm_thread'
    UNION ALL SELECT 'mdlgx_local_prequran_comm_message'
    UNION ALL SELECT 'mdlgx_local_prequran_comm_participant'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

-- 2) Latest session operational snapshot.
SELECT s.id,
       s.title,
       s.teacherid,
       FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
       FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
       s.status,
       s.bbb_meeting_id,
       s.bbb_created,
       LEFT(COALESCE(s.bbb_last_error, ''), 180) AS bbb_last_error,
       COUNT(DISTINCT p.id) AS participant_count,
       COUNT(DISTINCT CASE WHEN p.role = 'student' THEN p.id END) AS student_count,
       COUNT(DISTINCT a.id) AS attendance_count,
       COUNT(DISTINCT n.id) AS note_count,
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summary_count,
       COUNT(DISTINCT r.id) AS recording_count,
       COUNT(DISTINCT CASE WHEN r.visible_to_parent = 1 AND r.status = 'available' THEN r.id END) AS parent_visible_recording_count
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_recording r
       ON r.sessionid = s.id
GROUP BY s.id,
         s.title,
         s.teacherid,
         s.scheduled_start,
         s.scheduled_end,
         s.status,
         s.bbb_meeting_id,
         s.bbb_created,
         s.bbb_last_error
ORDER BY s.id DESC
LIMIT 25;

-- 3) Recent live-class audit trail.
SELECT id,
       sessionid,
       actorid,
       action,
       targettype,
       targetid,
       LEFT(COALESCE(details, ''), 220) AS details_preview,
       FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'session_created',
    'session_rescheduled',
    'session_cancelled',
    'join_redirect',
    'join_url_created',
    'bbb_create_failed',
    'review_saved',
    'recordings_synced',
    'recording_reviewed',
    'recording_published',
    'recording_unpublished',
    'recording_archived',
    'recording_expired',
    'followup_parent_reminder_sent',
    'followup_teacher_reminder_sent',
    'followup_escalated_admin',
    'followup_resolved_command_center',
    'quality_review_saved',
    'qa_review_reminder_sent',
    'qa_coaching_reminder_sent',
    'leadership_alert_sent',
    'improvement_plan_teacher_reminder_sent',
    'series_ack_parent_reminder_sent',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;

-- 4) Parent-visible summary safety check.
-- This intentionally does not return private_note content.
SELECT s.id AS sessionid,
       s.title,
       n.studentid,
       n.teacherid,
       n.visible_to_parent,
       a.attendance_status,
       a.participation_status,
       LEFT(COALESCE(n.strengths, ''), 120) AS strengths_preview,
       LEFT(COALESCE(n.needs_practice, ''), 120) AS needs_practice_preview,
       LEFT(COALESCE(n.homework, ''), 120) AS homework_preview,
       LEFT(COALESCE(n.parent_summary, ''), 120) AS parent_summary_preview,
       CHAR_LENGTH(COALESCE(n.private_note, '')) AS private_note_length,
       FROM_UNIXTIME(n.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s
     ON s.id = n.sessionid
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = n.sessionid
      AND a.studentid = n.studentid
WHERE n.visible_to_parent = 1
ORDER BY n.timemodified DESC
LIMIT 50;

-- 5) Recording lifecycle and admin review queue.
SELECT r.id,
       r.sessionid,
       s.title,
       r.bbb_record_id,
       r.bbb_meeting_id,
       r.playback_format,
       r.duration_minutes,
       r.status,
       r.published,
       r.visible_to_parent,
       r.reviewedby,
       FROM_UNIXTIME(NULLIF(r.reviewedat, 0)) AS reviewedat,
       FROM_UNIXTIME(NULLIF(r.expiresat, 0)) AS expiresat,
       FROM_UNIXTIME(r.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_recording r
LEFT JOIN mdlgx_local_prequran_live_session s
       ON s.id = r.sessionid
ORDER BY r.timemodified DESC, r.id DESC
LIMIT 50;

-- 6) Follow-up and parent response queue.
SELECT n.id AS noteid,
       n.sessionid,
       s.title,
       n.studentid,
       n.teacherid,
       n.followup_status,
       n.followup_resolved,
       n.followup_threadid,
       FROM_UNIXTIME(NULLIF(n.followup_contactedat, 0)) AS followup_contactedat,
       n.parent_response_status,
       FROM_UNIXTIME(NULLIF(n.parent_responseat, 0)) AS parent_responseat,
       LEFT(COALESCE(n.followup_message, ''), 120) AS followup_message_preview,
       LEFT(COALESCE(n.parent_response_message, ''), 120) AS parent_response_preview,
       FROM_UNIXTIME(n.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s
     ON s.id = n.sessionid
WHERE n.followup_status <> 'none'
   OR n.parent_response_status <> 'none'
ORDER BY n.timemodified DESC
LIMIT 100;

-- 7) QA, coaching, leadership, and improvement-plan status.
SELECT s.id,
       s.title,
       s.teacherid,
       s.status,
       s.qa_status,
       s.qa_score,
       s.qa_reviewedby,
       FROM_UNIXTIME(NULLIF(s.qa_reviewedat, 0)) AS qa_reviewedat,
       s.qa_coaching_status,
       s.qa_coaching_priority,
       FROM_UNIXTIME(NULLIF(s.qa_coaching_due_date, 0)) AS qa_coaching_due_date,
       s.leadership_review_status,
       s.improvement_plan_status,
       s.improvement_plan_priority,
       FROM_UNIXTIME(NULLIF(s.improvement_plan_due_date, 0)) AS improvement_plan_due_date,
       FROM_UNIXTIME(s.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_session s
WHERE s.qa_status <> 'not_reviewed'
   OR s.qa_coaching_status <> 'none'
   OR s.leadership_review_status <> 'none'
   OR s.improvement_plan_status <> 'none'
ORDER BY s.timemodified DESC
LIMIT 100;

-- 8) Reminder, notification, and automation audit rows from the last 7 days.
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

-- 9) Known operational issues.
SELECT 'bbb_errors' AS issue_type,
       COUNT(*) AS issue_count
FROM mdlgx_local_prequran_live_session
WHERE bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
UNION ALL
SELECT 'completed_sessions_missing_attendance',
       COUNT(*)
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
      AND a.studentid = p.studentid
WHERE s.status = 'completed'
  AND p.id IS NOT NULL
  AND a.id IS NULL
UNION ALL
SELECT 'parent_visible_summary_missing',
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
WHERE s.status IN ('completed', 'awaiting_review', 'needs_review')
  AND n.id IS NULL
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
  AND followup_resolved = 0;

-- 10) Duplicate BBB meeting IDs that should be reviewed.
SELECT bbb_meeting_id,
       COUNT(*) AS session_count,
       GROUP_CONCAT(id ORDER BY id ASC) AS session_ids
FROM mdlgx_local_prequran_live_session
WHERE bbb_meeting_id IS NOT NULL
  AND bbb_meeting_id <> ''
GROUP BY bbb_meeting_id
HAVING COUNT(*) > 1
ORDER BY session_count DESC, bbb_meeting_id ASC;
