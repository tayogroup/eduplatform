-- Group 12 verification: Final Code/SQL Consistency Audit.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is read-only and intended for final pre-release consistency checks.

-- 1) Required live and communication tables.
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
    UNION ALL SELECT 'mdlgx_local_prequran_comm_audit'
    UNION ALL SELECT 'mdlgx_local_prequran_comm_consent'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

-- 2) Required live_session columns across the full implementation.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'seriesid' AS column_name
    UNION ALL SELECT 'series_sequence'
    UNION ALL SELECT 'teacherid'
    UNION ALL SELECT 'lessonid'
    UNION ALL SELECT 'unitid'
    UNION ALL SELECT 'scheduled_start'
    UNION ALL SELECT 'scheduled_end'
    UNION ALL SELECT 'status'
    UNION ALL SELECT 'bbb_meeting_id'
    UNION ALL SELECT 'bbb_created'
    UNION ALL SELECT 'bbb_last_error'
    UNION ALL SELECT 'qa_status'
    UNION ALL SELECT 'qa_score'
    UNION ALL SELECT 'qa_checklist'
    UNION ALL SELECT 'qa_notes'
    UNION ALL SELECT 'qa_coaching_notes'
    UNION ALL SELECT 'qa_coaching_status'
    UNION ALL SELECT 'qa_coaching_due_date'
    UNION ALL SELECT 'leadership_review_status'
    UNION ALL SELECT 'leadership_reviewat'
    UNION ALL SELECT 'leadership_clearedat'
    UNION ALL SELECT 'improvement_plan_status'
    UNION ALL SELECT 'improvement_plan_due_date'
    UNION ALL SELECT 'improvement_plan_completedat'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_live_session'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 3) Required live_note columns across the full implementation.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'sessionid' AS column_name
    UNION ALL SELECT 'studentid'
    UNION ALL SELECT 'teacherid'
    UNION ALL SELECT 'strengths'
    UNION ALL SELECT 'needs_practice'
    UNION ALL SELECT 'homework'
    UNION ALL SELECT 'homework_lessonid'
    UNION ALL SELECT 'homework_unitid'
    UNION ALL SELECT 'homework_due_date'
    UNION ALL SELECT 'homework_priority'
    UNION ALL SELECT 'parent_summary'
    UNION ALL SELECT 'private_note'
    UNION ALL SELECT 'visible_to_parent'
    UNION ALL SELECT 'followup_status'
    UNION ALL SELECT 'followup_message'
    UNION ALL SELECT 'followup_resolved'
    UNION ALL SELECT 'followup_threadid'
    UNION ALL SELECT 'followup_contactedat'
    UNION ALL SELECT 'parent_response_status'
    UNION ALL SELECT 'parent_response_message'
    UNION ALL SELECT 'parent_responseat'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_live_note'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 4) Required live_recording columns for parent-safe review lifecycle.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'sessionid' AS column_name
    UNION ALL SELECT 'bbb_record_id'
    UNION ALL SELECT 'bbb_meeting_id'
    UNION ALL SELECT 'playback_url'
    UNION ALL SELECT 'duration_minutes'
    UNION ALL SELECT 'published'
    UNION ALL SELECT 'visible_to_parent'
    UNION ALL SELECT 'status'
    UNION ALL SELECT 'reviewedby'
    UNION ALL SELECT 'reviewedat'
    UNION ALL SELECT 'expiresat'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_live_recording'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 5) Required indexes for high-volume queues and lookup paths.
SELECT expected.table_name,
       expected.index_name,
       CASE WHEN actual.INDEX_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS index_status
FROM (
    SELECT 'mdlgx_local_prequran_live_session' AS table_name, 'preqlive_sess_series_ix' AS index_name
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'preqlive_sess_qa_ix'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'preqlive_sess_qacoach_ix'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'preqlive_sess_lead_ix'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session', 'preqlive_sess_imp_ix'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'preqlive_note_follow_ix'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'preqlive_note_fthread_ix'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note', 'preqlive_note_parent_ix'
    UNION ALL SELECT 'mdlgx_local_prequran_live_recording', 'preqlive_rec_parent_ix'
    UNION ALL SELECT 'mdlgx_local_prequran_live_audit', 'preqlive_audit_action_ix'
    UNION ALL SELECT 'mdlgx_local_prequran_live_ack', 'preqlive_ack_series_ix'
) expected
LEFT JOIN INFORMATION_SCHEMA.STATISTICS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
      AND actual.INDEX_NAME = expected.index_name
GROUP BY expected.table_name,
         expected.index_name,
         actual.INDEX_NAME
ORDER BY expected.table_name, expected.index_name;

-- 6) High-risk and review-needed data checks.
SELECT 'parent_visible_recordings_without_review' AS check_name,
       COUNT(*) AS issue_count
FROM mdlgx_local_prequran_live_recording
WHERE visible_to_parent = 1
  AND reviewedby = 0
UNION ALL
SELECT 'parent_visible_notes_with_private_note_stored_review_ui',
       COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE visible_to_parent = 1
  AND private_note IS NOT NULL
  AND TRIM(private_note) <> ''
UNION ALL
SELECT 'bbb_errors_open',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE bbb_last_error IS NOT NULL
  AND bbb_last_error <> ''
UNION ALL
SELECT 'duplicate_nonempty_bbb_meeting_ids',
       COUNT(*)
FROM (
    SELECT bbb_meeting_id
    FROM mdlgx_local_prequran_live_session
    WHERE bbb_meeting_id <> ''
    GROUP BY bbb_meeting_id
    HAVING COUNT(*) > 1
) dupes;

-- 7) Recent access, privacy, support, and failure audit signals.
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
   OR action LIKE '%support%'
   OR action LIKE '%failed%'
ORDER BY id DESC
LIMIT 100;
