-- Post-migration verification for fresh ScalaHosting Moodle target.
-- Run against the target Moodle database after plugin install and targeted data import.
-- Replace mdlgx_ if the target database prefix is different.
-- This script is read-only.

SELECT 'moodle_version' AS item, value
FROM mdlgx_config
WHERE name = 'version';

SELECT plugin, name, value
FROM mdlgx_config_plugins
WHERE plugin IN ('local_prequran', 'local_ehelhome')
  AND name IN ('version', 'release')
ORDER BY plugin, name;

SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE 'mdlgx_local_prequran%'
ORDER BY table_name;

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
UNION ALL SELECT 'local_prequran_student_profile', COUNT(*) FROM mdlgx_local_prequran_student_profile
UNION ALL SELECT 'local_prequran_teacher_profile', COUNT(*) FROM mdlgx_local_prequran_teacher_profile
UNION ALL SELECT 'local_prequran_teacher_student', COUNT(*) FROM mdlgx_local_prequran_teacher_student
UNION ALL SELECT 'local_prequran_group_pool', COUNT(*) FROM mdlgx_local_prequran_group_pool
UNION ALL SELECT 'local_prequran_class_group', COUNT(*) FROM mdlgx_local_prequran_class_group
UNION ALL SELECT 'local_prequran_group_member', COUNT(*) FROM mdlgx_local_prequran_group_member
UNION ALL SELECT 'local_prequran_intake_request', COUNT(*) FROM mdlgx_local_prequran_intake_request
UNION ALL SELECT 'local_prequran_lessonprog', COUNT(*) FROM mdlgx_local_prequran_lessonprog
UNION ALL SELECT 'local_prequran_stepprog', COUNT(*) FROM mdlgx_local_prequran_stepprog
UNION ALL SELECT 'local_prequran_stepcfg', COUNT(*) FROM mdlgx_local_prequran_stepcfg
UNION ALL SELECT 'local_prequran_focuslog', COUNT(*) FROM mdlgx_local_prequran_focuslog
UNION ALL SELECT 'local_prequran_focusagg', COUNT(*) FROM mdlgx_local_prequran_focusagg
UNION ALL SELECT 'local_prequran_speakrec', COUNT(*) FROM mdlgx_local_prequran_speakrec
UNION ALL SELECT 'local_prequran_submitrec', COUNT(*) FROM mdlgx_local_prequran_submitrec
UNION ALL SELECT 'local_prequran_quiz_attempt', COUNT(*) FROM mdlgx_local_prequran_quiz_attempt
UNION ALL SELECT 'local_prequran_quiz_pass', COUNT(*) FROM mdlgx_local_prequran_quiz_pass
UNION ALL SELECT 'local_prequran_quiz_question', COUNT(*) FROM mdlgx_local_prequran_quiz_question;

SELECT 'missing_student_profile_users' AS check_name, COUNT(*) AS issue_count
FROM mdlgx_local_prequran_student_profile sp
LEFT JOIN mdlgx_user u ON u.id = sp.userid AND u.deleted = 0
WHERE sp.userid > 0 AND u.id IS NULL
UNION ALL
SELECT 'missing_teacher_profile_users', COUNT(*)
FROM mdlgx_local_prequran_teacher_profile tp
LEFT JOIN mdlgx_user u ON u.id = tp.userid AND u.deleted = 0
WHERE tp.userid > 0 AND u.id IS NULL
UNION ALL
SELECT 'missing_teacher_student_teachers', COUNT(*)
FROM mdlgx_local_prequran_teacher_student ts
LEFT JOIN mdlgx_user u ON u.id = ts.teacherid AND u.deleted = 0
WHERE ts.teacherid > 0 AND u.id IS NULL
UNION ALL
SELECT 'missing_teacher_student_students', COUNT(*)
FROM mdlgx_local_prequran_teacher_student ts
LEFT JOIN mdlgx_user u ON u.id = ts.studentid AND u.deleted = 0
WHERE ts.studentid > 0 AND u.id IS NULL
UNION ALL
SELECT 'missing_live_session_teachers', COUNT(*)
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_user u ON u.id = s.teacherid AND u.deleted = 0
WHERE s.teacherid > 0 AND u.id IS NULL
UNION ALL
SELECT 'missing_live_participant_users', COUNT(*)
FROM mdlgx_local_prequran_live_participant p
LEFT JOIN mdlgx_user u ON u.id = p.userid AND u.deleted = 0
WHERE p.userid > 0 AND u.id IS NULL
UNION ALL
SELECT 'missing_live_participant_students', COUNT(*)
FROM mdlgx_local_prequran_live_participant p
LEFT JOIN mdlgx_user u ON u.id = p.studentid AND u.deleted = 0
WHERE p.studentid > 0 AND u.id IS NULL
UNION ALL
SELECT 'missing_live_note_sessions', COUNT(*)
FROM mdlgx_local_prequran_live_note n
LEFT JOIN mdlgx_local_prequran_live_session s ON s.id = n.sessionid
WHERE s.id IS NULL
UNION ALL
SELECT 'missing_live_attendance_sessions', COUNT(*)
FROM mdlgx_local_prequran_live_attendance a
LEFT JOIN mdlgx_local_prequran_live_session s ON s.id = a.sessionid
WHERE s.id IS NULL
UNION ALL
SELECT 'missing_live_recording_sessions', COUNT(*)
FROM mdlgx_local_prequran_live_recording r
LEFT JOIN mdlgx_local_prequran_live_session s ON s.id = r.sessionid
WHERE s.id IS NULL;

SELECT id, name, shortname, enabled, restrictedusers
FROM mdlgx_external_services
WHERE shortname = 'prequran_ws'
   OR name LIKE '%PreQuran%'
ORDER BY id;

SELECT s.shortname AS service_shortname, f.name AS function_name
FROM mdlgx_external_services s
JOIN mdlgx_external_services_functions f ON f.externalserviceid = s.id
WHERE s.shortname = 'prequran_ws'
ORDER BY f.name;

SELECT classname, component, nextruntime, disabled
FROM mdlgx_task_scheduled
WHERE component = 'local_prequran'
ORDER BY classname;

SELECT 'recent_live_sessions' AS sample_name, id, title, teacherid, scheduled_start, status
FROM mdlgx_local_prequran_live_session
ORDER BY scheduled_start DESC
LIMIT 10;

