-- Phase 5 verification: production-copy launch blocker summary.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and safe to run in phpMyAdmin after the copied site upgrade.

-- 1) Source/target version evidence.
SELECT 'plugin_config' AS section,
       plugin,
       name,
       CASE
           WHEN name = 'bbb_shared_secret' AND value <> '' THEN 'CONFIGURED'
           WHEN name = 'bbb_shared_secret' THEN 'MISSING'
           WHEN value <> '' THEN value
           ELSE 'MISSING'
       END AS value_or_status
FROM mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name IN (
      'version',
      'release',
      'bbb_base_url',
      'bbb_shared_secret',
      'bbb_record_default',
      'bbb_join_window_before_minutes',
      'bbb_join_window_after_minutes',
      'bbb_max_participants_default',
      'bbb_recording_retention_days'
  )
ORDER BY plugin, name;

-- 2) Required table blockers. Expected result: all PRESENT.
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
    UNION ALL SELECT 'mdlgx_local_prequran_student_profile'
    UNION ALL SELECT 'mdlgx_local_prequran_teacher_profile'
    UNION ALL SELECT 'mdlgx_local_prequran_group_pool'
    UNION ALL SELECT 'mdlgx_local_prequran_class_group'
    UNION ALL SELECT 'mdlgx_local_prequran_group_member'
    UNION ALL SELECT 'mdlgx_local_prequran_intake_request'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

-- 3) Critical column blockers. Expected result: all PRESENT.
SELECT expected.table_name,
       expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'mdlgx_local_prequran_live_session' AS table_name, 'groupid' AS column_name
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'seriesid'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'series_sequence'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'recording_enabled'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'recording_consent_required'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'bbb_meeting_id'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'bbb_created'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'bbb_last_error'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'qa_status'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'qa_score'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'qa_coaching_status'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'leadership_review_status'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'improvement_plan_status'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'homework_lessonid'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'homework_unitid'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'followup_status'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'followup_threadid'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'parent_response_status'
    UNION ALL SELECT 'mdlgx_local_prequran_student_profile', 'recording_consent'
    UNION ALL SELECT 'mdlgx_local_prequran_student_profile', 'groupid'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.table_name, expected.column_name;

-- 4) Launch blocker summary. Expected result: zero for all rows before release packaging.
SELECT 'duplicate_bbb_meeting_ids' AS blocker,
       COUNT(*) AS blocker_count
FROM (
    SELECT bbb_meeting_id
    FROM mdlgx_local_prequran_live_session
    WHERE bbb_meeting_id IS NOT NULL
      AND bbb_meeting_id <> ''
    GROUP BY bbb_meeting_id
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 'open_bbb_errors',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
UNION ALL
SELECT 'ended_live_sessions_not_moved',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE scheduled_end < UNIX_TIMESTAMP(NOW())
  AND status = 'live'
UNION ALL
SELECT 'recording_consent_blockers',
       COUNT(*)
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
  ON p.sessionid = s.id
 AND p.role = 'student'
 AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_consent c
  ON c.studentid = p.studentid
 AND c.consent_type = 'recording'
 AND c.granted = 1
LEFT JOIN mdlgx_local_prequran_student_profile sp
  ON sp.userid = p.studentid
 AND sp.recording_consent = 1
 AND sp.status = 'active'
WHERE s.recording_enabled = 1
  AND s.recording_consent_required = 1
  AND c.id IS NULL
  AND sp.id IS NULL
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
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));

-- 5) Current operational queues for triage. Non-zero rows may be acceptable for pilot if owner/workaround is documented.
SELECT 'awaiting_review_sessions' AS queue,
       COUNT(*) AS queue_count
FROM mdlgx_local_prequran_live_session
WHERE status = 'awaiting_review'
UNION ALL
SELECT 'recordings_pending_admin_review',
       COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE status = 'available'
  AND (reviewedat = 0 OR visible_to_parent = 0)
UNION ALL
SELECT 'open_followups',
       COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE followup_status <> 'none'
  AND followup_resolved = 0
UNION ALL
SELECT 'qa_review_queue',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND qa_status IN ('not_reviewed', 'needs_coaching', 'serious_issue');

-- 6) Latest production-copy evidence rows.
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
    'bbb_created',
    'bbb_create_failed',
    'join_redirect',
    'join_url_created',
    'review_saved',
    'session_awaiting_review',
    'session_completed',
    'recordings_synced',
    'recording_reviewed',
    'recording_published',
    'recording_unpublished',
    'recording_archived',
    'recording_expired',
    'recording_disabled_missing_consent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;
