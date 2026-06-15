SELECT
  expected.table_name,
  CASE WHEN actual.table_name IS NULL THEN 'missing' ELSE 'present' END AS table_status
FROM (
  SELECT 'mdlgx_local_prequran_live_session' AS table_name
  UNION ALL SELECT 'mdlgx_local_prequran_live_participant'
  UNION ALL SELECT 'mdlgx_local_prequran_live_attendance'
  UNION ALL SELECT 'mdlgx_local_prequran_live_note'
  UNION ALL SELECT 'mdlgx_local_prequran_live_recording'
  UNION ALL SELECT 'mdlgx_local_prequran_live_consent'
  UNION ALL SELECT 'mdlgx_local_prequran_live_audit'
) expected
LEFT JOIN information_schema.tables actual
  ON actual.table_schema = DATABASE()
 AND actual.table_name = expected.table_name
ORDER BY expected.table_name;

SELECT 'mdlgx_local_prequran_live_session' AS table_name, COUNT(*) AS row_count FROM mdlgx_local_prequran_live_session
UNION ALL SELECT 'mdlgx_local_prequran_live_participant', COUNT(*) FROM mdlgx_local_prequran_live_participant
UNION ALL SELECT 'mdlgx_local_prequran_live_attendance', COUNT(*) FROM mdlgx_local_prequran_live_attendance
UNION ALL SELECT 'mdlgx_local_prequran_live_note', COUNT(*) FROM mdlgx_local_prequran_live_note
UNION ALL SELECT 'mdlgx_local_prequran_live_recording', COUNT(*) FROM mdlgx_local_prequran_live_recording
UNION ALL SELECT 'mdlgx_local_prequran_live_consent', COUNT(*) FROM mdlgx_local_prequran_live_consent
UNION ALL SELECT 'mdlgx_local_prequran_live_audit', COUNT(*) FROM mdlgx_local_prequran_live_audit;

SELECT
  table_name,
  column_name,
  column_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN (
    'mdlgx_local_prequran_live_session',
    'mdlgx_local_prequran_live_participant',
    'mdlgx_local_prequran_live_attendance',
    'mdlgx_local_prequran_live_note',
    'mdlgx_local_prequran_live_recording',
    'mdlgx_local_prequran_live_consent',
    'mdlgx_local_prequran_live_audit'
  )
  AND column_name IN (
    'id',
    'sessionid',
    'cohortid',
    'teacherid',
    'studentid',
    'guardianid',
    'lessonid',
    'unitid',
    'scheduled_start',
    'scheduled_end',
    'status',
    'recording_enabled',
    'bbb_meeting_id',
    'bbb_record_id',
    'visible_to_parent',
    'timecreated',
    'timemodified'
  )
ORDER BY table_name, ordinal_position;

SELECT
  table_name,
  index_name,
  non_unique,
  GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ', ') AS indexed_columns
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name IN (
    'mdlgx_local_prequran_live_session',
    'mdlgx_local_prequran_live_participant',
    'mdlgx_local_prequran_live_attendance',
    'mdlgx_local_prequran_live_note',
    'mdlgx_local_prequran_live_recording',
    'mdlgx_local_prequran_live_consent',
    'mdlgx_local_prequran_live_audit'
  )
GROUP BY table_name, index_name, non_unique
ORDER BY table_name, index_name;
