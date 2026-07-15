-- Reset already-created BBB live rooms so they are recreated with the current
-- Virtual Tutor title/link, welcome text, and public-chat lock settings.
-- Run in phpMyAdmin. Replace ehelacad_quraantest/mdlgx_ if needed.

SELECT 'before_reset' AS check_name,
       id,
       title,
       status,
       bbb_created,
       bbb_meeting_id,
       bbb_create_time
FROM ehelacad_quraantest.mdlgx_local_prequran_live_session
WHERE status = 'live'
   OR bbb_created = 1
ORDER BY timemodified DESC
LIMIT 50;

UPDATE ehelacad_quraantest.mdlgx_local_prequran_live_session
   SET bbb_created = 0,
       bbb_meeting_id = CONCAT('prequran-live-', id, '-reset-', UNIX_TIMESTAMP()),
       bbb_internal_meeting_id = '',
       bbb_create_time = 0,
       bbb_last_error = '',
       status = CASE WHEN status = 'live' THEN 'scheduled' ELSE status END,
       timemodified = UNIX_TIMESTAMP()
 WHERE status = 'live'
    OR bbb_created = 1;

SELECT 'after_reset' AS check_name,
       id,
       title,
       status,
       bbb_created,
       bbb_meeting_id,
       bbb_create_time
FROM ehelacad_quraantest.mdlgx_local_prequran_live_session
WHERE status = 'live'
   OR bbb_created = 1
ORDER BY timemodified DESC
LIMIT 50;
