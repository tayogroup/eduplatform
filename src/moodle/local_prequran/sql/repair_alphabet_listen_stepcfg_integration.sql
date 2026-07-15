-- Repair Alphabet Listen step configuration for quraantest/integration.
-- This aligns local_prequran_stepcfg with the current frontend step contract:
-- lecture, rules, listen, watch, phonetics, repeat, letterclue, speak,
-- match, soundclue, animate, write, submit.
--
-- Adjust the table prefix if the target Moodle database is not using mdlgx_.

START TRANSACTION;

SET @env := CONVERT('integration' USING utf8mb4) COLLATE utf8mb4_general_ci;
SET @lessonid := CONVERT('alphabet' USING utf8mb4) COLLATE utf8mb4_general_ci;
SET @unitid := CONVERT('alphabet_listen' USING utf8mb4) COLLATE utf8mb4_general_ci;
SET @now := UNIX_TIMESTAMP();

UPDATE mdlgx_local_prequran_stepcfg
   SET step_index = 1,
       step_title = 'Lecture',
       default_passes_required = 1,
       default_repeats_per_letter = 1,
       active = 1,
       timemodified = @now
 WHERE lessonid = @lessonid AND unitid = @unitid AND environment = @env AND step_id = 'lecture';

INSERT INTO mdlgx_local_prequran_stepcfg
    (lessonid, unitid, step_index, step_id, step_type, step_title,
     default_passes_required, default_repeats_per_letter, active,
     timecreated, timemodified, environment)
SELECT @lessonid, @unitid, 2, 'rules', 'content', 'Rules',
       1, 1, 1, @now, @now, @env
 WHERE NOT EXISTS (
       SELECT 1
         FROM mdlgx_local_prequran_stepcfg
        WHERE lessonid = @lessonid AND unitid = @unitid AND environment = @env AND step_id = 'rules'
 );

UPDATE mdlgx_local_prequran_stepcfg
   SET step_index = 2,
       step_type = 'content',
       step_title = 'Rules',
       default_passes_required = 1,
       default_repeats_per_letter = 1,
       active = 1,
       timemodified = @now
 WHERE lessonid = @lessonid AND unitid = @unitid AND environment = @env AND step_id = 'rules';

UPDATE mdlgx_local_prequran_stepcfg
   SET step_index = CASE step_id
       WHEN 'listen' THEN 3
       WHEN 'watch' THEN 4
       WHEN 'phonetics' THEN 5
       WHEN 'repeat' THEN 6
       WHEN 'letterclue' THEN 7
       WHEN 'speak' THEN 8
       WHEN 'match' THEN 9
       WHEN 'soundclue' THEN 10
       WHEN 'animate' THEN 11
       WHEN 'write' THEN 12
       WHEN 'submit' THEN 13
       ELSE step_index
   END,
       step_type = CASE step_id
       WHEN 'listen' THEN 'playlist'
       WHEN 'watch' THEN 'video_playlist'
       WHEN 'phonetics' THEN 'phonetics'
       WHEN 'repeat' THEN 'playlist'
       WHEN 'letterclue' THEN 'letterclue'
       WHEN 'speak' THEN 'speak'
       WHEN 'match' THEN 'match'
       WHEN 'soundclue' THEN 'soundclue'
       WHEN 'animate' THEN 'animate'
       WHEN 'write' THEN 'write'
       WHEN 'submit' THEN 'submit'
       ELSE step_type
   END,
       default_passes_required = 1,
       default_repeats_per_letter = 1,
       active = 1,
       timemodified = @now
 WHERE lessonid = @lessonid
   AND unitid = @unitid
   AND environment = @env
   AND step_id IN ('listen', 'watch', 'phonetics', 'repeat', 'letterclue',
                   'speak', 'match', 'soundclue', 'animate', 'write', 'submit');

COMMIT;

SELECT step_index, step_id, step_type, step_title,
       default_passes_required, default_repeats_per_letter, active, environment
  FROM mdlgx_local_prequran_stepcfg
 WHERE lessonid = @lessonid AND unitid = @unitid AND environment = @env
 ORDER BY step_index;
