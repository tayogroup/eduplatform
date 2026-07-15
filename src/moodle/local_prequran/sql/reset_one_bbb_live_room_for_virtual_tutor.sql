-- Reset one already-created BBB live room so BBB recreates it with the
-- current Virtual Tutor embedded panel.
-- Replace @sessionid if needed.

SET @sessionid := 52;

SELECT 'before_reset_one' AS check_name,
       id,
       title,
       status,
       bbb_created,
       bbb_meeting_id,
       bbb_create_time,
       bbb_last_error
FROM ehelacad_quraantest.mdlgx_local_prequran_live_session
WHERE id = @sessionid;

UPDATE ehelacad_quraantest.mdlgx_local_prequran_live_session
   SET bbb_created = 0,
       bbb_meeting_id = CONCAT('prequran-live-', id, '-reset-', UNIX_TIMESTAMP()),
       bbb_internal_meeting_id = '',
       bbb_create_time = 0,
       bbb_last_error = '',
       status = CASE WHEN status = 'live' THEN 'scheduled' ELSE status END,
       timemodified = UNIX_TIMESTAMP()
 WHERE id = @sessionid;

SELECT 'after_reset_one' AS check_name,
       id,
       title,
       status,
       bbb_created,
       bbb_meeting_id,
       bbb_create_time,
       bbb_last_error
FROM ehelacad_quraantest.mdlgx_local_prequran_live_session
WHERE id = @sessionid;
