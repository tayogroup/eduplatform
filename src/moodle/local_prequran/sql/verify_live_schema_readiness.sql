-- Group 2 verification: live-system schema readiness.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Required live tables.
SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_live_session' AS table_name UNION ALL
    SELECT 'mdlgx_local_prequran_live_participant' UNION ALL
    SELECT 'mdlgx_local_prequran_live_attendance' UNION ALL
    SELECT 'mdlgx_local_prequran_live_note' UNION ALL
    SELECT 'mdlgx_local_prequran_live_recording' UNION ALL
    SELECT 'mdlgx_local_prequran_live_consent' UNION ALL
    SELECT 'mdlgx_local_prequran_live_audit' UNION ALL
    SELECT 'mdlgx_local_prequran_live_series' UNION ALL
    SELECT 'mdlgx_local_prequran_live_availability' UNION ALL
    SELECT 'mdlgx_local_prequran_live_ack'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

-- 2) Critical live_session columns introduced across later phases.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'seriesid' AS column_name UNION ALL
    SELECT 'series_sequence' UNION ALL
    SELECT 'qa_status' UNION ALL
    SELECT 'qa_score' UNION ALL
    SELECT 'qa_reviewedby' UNION ALL
    SELECT 'qa_reviewedat' UNION ALL
    SELECT 'qa_coaching_status' UNION ALL
    SELECT 'qa_coaching_due_date' UNION ALL
    SELECT 'leadership_review_status' UNION ALL
    SELECT 'leadership_reviewat' UNION ALL
    SELECT 'improvement_plan_status' UNION ALL
    SELECT 'improvement_plan_due_date'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_live_session'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 3) Critical live_note columns introduced across later phases.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'homework_lessonid' AS column_name UNION ALL
    SELECT 'homework_unitid' UNION ALL
    SELECT 'homework_due_date' UNION ALL
    SELECT 'homework_priority' UNION ALL
    SELECT 'followup_status' UNION ALL
    SELECT 'followup_message' UNION ALL
    SELECT 'followup_resolved' UNION ALL
    SELECT 'followup_threadid' UNION ALL
    SELECT 'followup_contactedat' UNION ALL
    SELECT 'parent_response_status' UNION ALL
    SELECT 'parent_response_message' UNION ALL
    SELECT 'parent_responseat'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_live_note'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 4) Existing BBB meeting IDs should be unique when non-empty.
SELECT bbb_meeting_id, COUNT(*) AS duplicate_count
FROM mdlgx_local_prequran_live_session
WHERE bbb_meeting_id <> ''
GROUP BY bbb_meeting_id
HAVING COUNT(*) > 1;

-- 5) Basic row counts for operational smoke check.
SELECT 'live_session' AS table_name, COUNT(*) AS row_count FROM mdlgx_local_prequran_live_session
UNION ALL SELECT 'live_participant', COUNT(*) FROM mdlgx_local_prequran_live_participant
UNION ALL SELECT 'live_attendance', COUNT(*) FROM mdlgx_local_prequran_live_attendance
UNION ALL SELECT 'live_note', COUNT(*) FROM mdlgx_local_prequran_live_note
UNION ALL SELECT 'live_recording', COUNT(*) FROM mdlgx_local_prequran_live_recording
UNION ALL SELECT 'live_audit', COUNT(*) FROM mdlgx_local_prequran_live_audit;
