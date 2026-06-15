-- Group 6 verification: Release Packaging & Final Deployment Handoff.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and intended for final production sign-off.

-- 1) Moodle plugin/version visibility.
SELECT plugin,
       name,
       value
FROM mdlgx_config_plugins
WHERE plugin IN ('local_prequran', 'local_hubredirect')
  AND name IN ('version', 'release', 'bbb_base_url', 'bbb_record_default',
               'bbb_join_window_before_minutes', 'bbb_join_window_after_minutes',
               'bbb_max_participants_default', 'bbb_recording_retention_days')
ORDER BY plugin, name;

-- 2) Required production tables.
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

-- 3) Required high-risk columns across late-phase workflows.
SELECT expected.table_name,
       expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'mdlgx_local_prequran_live_session' AS table_name, 'qa_status' AS column_name
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'qa_score'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'qa_coaching_status'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'leadership_review_status'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'improvement_plan_status'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'seriesid'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'series_sequence'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'homework_lessonid'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'homework_unitid'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'followup_status'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'followup_threadid'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'parent_response_status'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.table_name, expected.column_name;

-- 4) Deployment blocker summary.
SELECT 'bbb_errors' AS blocker,
       COUNT(*) AS count_value
FROM mdlgx_local_prequran_live_session
WHERE bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
UNION ALL
SELECT 'parent_visible_recordings_without_review',
       COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE visible_to_parent = 1
  AND reviewedat = 0
UNION ALL
SELECT 'parent_visible_recordings_after_expiry',
       COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE visible_to_parent = 1
  AND expiresat > 0
  AND expiresat < UNIX_TIMESTAMP(NOW())
UNION ALL
SELECT 'parent_visible_recordings_non_available',
       COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE visible_to_parent = 1
  AND status <> 'available'
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
SELECT 'open_privacy_or_denied_audit_7_days',
       COUNT(*)
FROM mdlgx_local_prequran_live_audit
WHERE (action LIKE '%privacy%' OR action LIKE '%denied%')
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));

-- 5) Latest release-critical activity.
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
    'join_redirect',
    'join_url_created',
    'review_saved',
    'recordings_synced',
    'recording_reviewed',
    'recording_published',
    'recording_unpublished',
    'recording_archived',
    'recording_expired',
    'quality_review_saved',
    'followup_resolved_command_center',
    'series_ack_parent_reminder_sent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;

-- 6) First pilot readiness: latest sessions with complete operational shape.
SELECT s.id,
       s.title,
       s.teacherid,
       FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
       FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
       s.status,
       COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.id END) AS active_students,
       COUNT(DISTINCT a.id) AS attendance_rows,
       COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
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
GROUP BY s.id,
         s.title,
         s.teacherid,
         s.scheduled_start,
         s.scheduled_end,
         s.status,
         s.qa_status,
         s.qa_score
ORDER BY s.scheduled_start DESC
LIMIT 25;
