-- Reset one existing BBB room so the next teacher launch recreates it with
-- the clean create/join settings from live_sessions.php.
--
-- Replace 123 with the local_prequran_live_session.id you are testing.
-- Replace mdlgx_ with your Moodle database table prefix if different.

UPDATE mdlgx_local_prequran_live_session
   SET bbb_created = 0,
       bbb_meeting_id = CONCAT('prequran-live-', id, '-clean-', UNIX_TIMESTAMP()),
       bbb_internal_meeting_id = '',
       bbb_create_time = 0,
       bbb_last_error = '',
       status = 'scheduled',
       timemodified = UNIX_TIMESTAMP()
 WHERE id = 123;
