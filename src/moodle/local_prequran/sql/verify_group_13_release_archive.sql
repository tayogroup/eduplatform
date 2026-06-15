-- Group 13 verification: Production Release Archive.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and supports release archive evidence.

-- 1) Moodle plugin version records for archive manifest.
SELECT plugin,
       name,
       value
FROM mdlgx_config_plugins
WHERE plugin IN ('local_prequran', 'local_hubredirect')
  AND name IN ('version', 'release')
ORDER BY plugin, name;

-- 2) BBB settings readiness without exposing the shared secret value.
SELECT name,
       CASE
           WHEN value IS NULL OR value = '' THEN 'MISSING'
           WHEN name = 'bbb_shared_secret' THEN CONCAT('SET_LENGTH_', CHAR_LENGTH(value))
           ELSE LEFT(value, 180)
       END AS archive_safe_value
FROM mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name IN (
      'bbb_base_url',
      'bbb_shared_secret',
      'bbb_record_default',
      'bbb_join_window_before_minutes',
      'bbb_join_window_after_minutes',
      'bbb_max_participants_default',
      'bbb_recording_retention_days'
  )
ORDER BY name;

-- 3) Required release tables are present and row counts are archive-ready.
SELECT 'local_prequran_live_session' AS table_name, COUNT(*) AS row_count FROM mdlgx_local_prequran_live_session
UNION ALL SELECT 'local_prequran_live_participant', COUNT(*) FROM mdlgx_local_prequran_live_participant
UNION ALL SELECT 'local_prequran_live_attendance', COUNT(*) FROM mdlgx_local_prequran_live_attendance
UNION ALL SELECT 'local_prequran_live_note', COUNT(*) FROM mdlgx_local_prequran_live_note
UNION ALL SELECT 'local_prequran_live_recording', COUNT(*) FROM mdlgx_local_prequran_live_recording
UNION ALL SELECT 'local_prequran_live_consent', COUNT(*) FROM mdlgx_local_prequran_live_consent
UNION ALL SELECT 'local_prequran_live_audit', COUNT(*) FROM mdlgx_local_prequran_live_audit
UNION ALL SELECT 'local_prequran_live_series', COUNT(*) FROM mdlgx_local_prequran_live_series
UNION ALL SELECT 'local_prequran_live_availability', COUNT(*) FROM mdlgx_local_prequran_live_availability
UNION ALL SELECT 'local_prequran_live_ack', COUNT(*) FROM mdlgx_local_prequran_live_ack
UNION ALL SELECT 'local_prequran_comm_thread', COUNT(*) FROM mdlgx_local_prequran_comm_thread
UNION ALL SELECT 'local_prequran_comm_message', COUNT(*) FROM mdlgx_local_prequran_comm_message
UNION ALL SELECT 'local_prequran_comm_participant', COUNT(*) FROM mdlgx_local_prequran_comm_participant
UNION ALL SELECT 'local_prequran_comm_audit', COUNT(*) FROM mdlgx_local_prequran_comm_audit
UNION ALL SELECT 'local_prequran_comm_consent', COUNT(*) FROM mdlgx_local_prequran_comm_consent;

-- 4) Current live-session status summary for release notes.
SELECT status,
       COUNT(*) AS session_count,
       MIN(FROM_UNIXTIME(NULLIF(scheduled_start, 0))) AS earliest_session,
       MAX(FROM_UNIXTIME(NULLIF(scheduled_start, 0))) AS latest_session
FROM mdlgx_local_prequran_live_session
GROUP BY status
ORDER BY status;

-- 5) Current recording lifecycle summary for release notes.
SELECT status,
       published,
       visible_to_parent,
       COUNT(*) AS recording_count,
       MIN(FROM_UNIXTIME(NULLIF(expiresat, 0))) AS earliest_expiry,
       MAX(FROM_UNIXTIME(NULLIF(expiresat, 0))) AS latest_expiry
FROM mdlgx_local_prequran_live_recording
GROUP BY status, published, visible_to_parent
ORDER BY status, published, visible_to_parent;

-- 6) Open blockers that should be documented before archive approval.
SELECT 'open_bbb_errors' AS blocker_name,
       COUNT(*) AS issue_count
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
SELECT 'open_parent_followups',
       COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE followup_status <> 'none'
  AND followup_resolved = 0
UNION ALL
SELECT 'open_qa_coaching_items',
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

-- 7) Recent release-relevant audit events for archive evidence.
SELECT id,
       sessionid,
       actorid,
       action,
       targettype,
       targetid,
       LEFT(COALESCE(details, ''), 240) AS details_preview,
       FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'recording_reviewed',
    'recording_published',
    'review_saved',
    'session_completed',
    'qa_review_saved',
    'qa_coaching_completed',
    'leadership_review_saved',
    'improvement_plan_completed',
    'parent_trust_access_reviewed',
    'purge_recovery_exported',
    'calendar_downloaded',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;

-- 8) Archive approval decision template as a query result.
SELECT 'archive_name' AS field_name, '' AS field_value
UNION ALL SELECT 'archive_location', ''
UNION ALL SELECT 'release_owner', ''
UNION ALL SELECT 'technical_owner', ''
UNION ALL SELECT 'operations_owner', ''
UNION ALL SELECT 'privacy_safety_owner', ''
UNION ALL SELECT 'secrets_excluded', 'YES / NO'
UNION ALL SELECT 'child_private_data_excluded', 'YES / NO'
UNION ALL SELECT 'raw_recordings_excluded', 'YES / NO'
UNION ALL SELECT 'group_12_consistency_passed', 'YES / NO'
UNION ALL SELECT 'group_13_archive_verification_passed', 'YES / NO'
UNION ALL SELECT 'known_issues_recorded', 'YES / NO'
UNION ALL SELECT 'decision', 'APPROVED / FIX REQUIRED'
UNION ALL SELECT 'approved_by', ''
UNION ALL SELECT 'approval_date', '';

