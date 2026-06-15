-- Custom table export planning for quraantest.
-- Run against the source Moodle database.
-- Replace mdlgx_ if the source database prefix is different.
-- This script is read-only and reports table existence, row counts, and suggested import order.

SELECT 10 AS import_order, 'core_progress' AS cluster_name, 'mdlgx_local_prequran_stepcfg' AS table_name
UNION ALL SELECT 20, 'profiles', 'mdlgx_local_prequran_student_profile'
UNION ALL SELECT 30, 'profiles', 'mdlgx_local_prequran_teacher_profile'
UNION ALL SELECT 40, 'profiles', 'mdlgx_local_prequran_teacher_student'
UNION ALL SELECT 50, 'grouping', 'mdlgx_local_prequran_group_pool'
UNION ALL SELECT 60, 'grouping', 'mdlgx_local_prequran_class_group'
UNION ALL SELECT 70, 'grouping', 'mdlgx_local_prequran_group_member'
UNION ALL SELECT 80, 'intake', 'mdlgx_local_prequran_intake_request'
UNION ALL SELECT 90, 'core_progress', 'mdlgx_local_prequran_lessonprog'
UNION ALL SELECT 100, 'core_progress', 'mdlgx_local_prequran_stepprog'
UNION ALL SELECT 110, 'focus', 'mdlgx_local_prequran_focuslog'
UNION ALL SELECT 120, 'focus', 'mdlgx_local_prequran_focusagg'
UNION ALL SELECT 130, 'recordings', 'mdlgx_local_prequran_speakrec'
UNION ALL SELECT 140, 'recordings', 'mdlgx_local_prequran_submitrec'
UNION ALL SELECT 150, 'communications', 'mdlgx_local_prequran_comm_thread'
UNION ALL SELECT 160, 'communications', 'mdlgx_local_prequran_comm_participant'
UNION ALL SELECT 170, 'communications', 'mdlgx_local_prequran_comm_message'
UNION ALL SELECT 180, 'communications', 'mdlgx_local_prequran_comm_consent'
UNION ALL SELECT 190, 'live', 'mdlgx_local_prequran_live_availability'
UNION ALL SELECT 200, 'live', 'mdlgx_local_prequran_live_consent'
UNION ALL SELECT 210, 'live', 'mdlgx_local_prequran_live_series'
UNION ALL SELECT 220, 'live', 'mdlgx_local_prequran_live_session'
UNION ALL SELECT 230, 'live', 'mdlgx_local_prequran_live_participant'
UNION ALL SELECT 240, 'live', 'mdlgx_local_prequran_live_attendance'
UNION ALL SELECT 250, 'live', 'mdlgx_local_prequran_live_note'
UNION ALL SELECT 260, 'live', 'mdlgx_local_prequran_live_recording'
UNION ALL SELECT 270, 'live', 'mdlgx_local_prequran_live_ack'
UNION ALL SELECT 280, 'live', 'mdlgx_local_prequran_live_audit'
UNION ALL SELECT 290, 'quiz', 'mdlgx_local_prequran_quiz_attempt'
UNION ALL SELECT 300, 'quiz', 'mdlgx_local_prequran_quiz_pass'
UNION ALL SELECT 310, 'quiz', 'mdlgx_local_prequran_quiz_question'
ORDER BY import_order;

SELECT
    planned.import_order,
    planned.cluster_name,
    planned.table_name,
    CASE WHEN actual.table_name IS NULL THEN 'MISSING' ELSE 'EXISTS' END AS status,
    COALESCE(actual.table_rows, 0) AS approx_row_count
FROM (
    SELECT 10 AS import_order, 'core_progress' AS cluster_name, 'mdlgx_local_prequran_stepcfg' AS table_name
    UNION ALL SELECT 20, 'profiles', 'mdlgx_local_prequran_student_profile'
    UNION ALL SELECT 30, 'profiles', 'mdlgx_local_prequran_teacher_profile'
    UNION ALL SELECT 40, 'profiles', 'mdlgx_local_prequran_teacher_student'
    UNION ALL SELECT 50, 'grouping', 'mdlgx_local_prequran_group_pool'
    UNION ALL SELECT 60, 'grouping', 'mdlgx_local_prequran_class_group'
    UNION ALL SELECT 70, 'grouping', 'mdlgx_local_prequran_group_member'
    UNION ALL SELECT 80, 'intake', 'mdlgx_local_prequran_intake_request'
    UNION ALL SELECT 90, 'core_progress', 'mdlgx_local_prequran_lessonprog'
    UNION ALL SELECT 100, 'core_progress', 'mdlgx_local_prequran_stepprog'
    UNION ALL SELECT 110, 'focus', 'mdlgx_local_prequran_focuslog'
    UNION ALL SELECT 120, 'focus', 'mdlgx_local_prequran_focusagg'
    UNION ALL SELECT 130, 'recordings', 'mdlgx_local_prequran_speakrec'
    UNION ALL SELECT 140, 'recordings', 'mdlgx_local_prequran_submitrec'
    UNION ALL SELECT 150, 'communications', 'mdlgx_local_prequran_comm_thread'
    UNION ALL SELECT 160, 'communications', 'mdlgx_local_prequran_comm_participant'
    UNION ALL SELECT 170, 'communications', 'mdlgx_local_prequran_comm_message'
    UNION ALL SELECT 180, 'communications', 'mdlgx_local_prequran_comm_consent'
    UNION ALL SELECT 190, 'live', 'mdlgx_local_prequran_live_availability'
    UNION ALL SELECT 200, 'live', 'mdlgx_local_prequran_live_consent'
    UNION ALL SELECT 210, 'live', 'mdlgx_local_prequran_live_series'
    UNION ALL SELECT 220, 'live', 'mdlgx_local_prequran_live_session'
    UNION ALL SELECT 230, 'live', 'mdlgx_local_prequran_live_participant'
    UNION ALL SELECT 240, 'live', 'mdlgx_local_prequran_live_attendance'
    UNION ALL SELECT 250, 'live', 'mdlgx_local_prequran_live_note'
    UNION ALL SELECT 260, 'live', 'mdlgx_local_prequran_live_recording'
    UNION ALL SELECT 270, 'live', 'mdlgx_local_prequran_live_ack'
    UNION ALL SELECT 280, 'live', 'mdlgx_local_prequran_live_audit'
    UNION ALL SELECT 290, 'quiz', 'mdlgx_local_prequran_quiz_attempt'
    UNION ALL SELECT 300, 'quiz', 'mdlgx_local_prequran_quiz_pass'
    UNION ALL SELECT 310, 'quiz', 'mdlgx_local_prequran_quiz_question'
) planned
LEFT JOIN information_schema.tables actual
       ON actual.table_schema = DATABASE()
      AND actual.table_name = planned.table_name
ORDER BY planned.import_order;

SELECT
    CONCAT(
        'mysqldump --single-transaction --skip-triggers --no-create-info SOURCE_DB ',
        table_name,
        ' > ',
        table_name,
        '.sql'
    ) AS suggested_export_command
FROM (
    SELECT 'mdlgx_local_prequran_stepcfg' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_student_profile'
    UNION ALL SELECT 'mdlgx_local_prequran_teacher_profile'
    UNION ALL SELECT 'mdlgx_local_prequran_teacher_student'
    UNION ALL SELECT 'mdlgx_local_prequran_group_pool'
    UNION ALL SELECT 'mdlgx_local_prequran_class_group'
    UNION ALL SELECT 'mdlgx_local_prequran_group_member'
    UNION ALL SELECT 'mdlgx_local_prequran_intake_request'
    UNION ALL SELECT 'mdlgx_local_prequran_lessonprog'
    UNION ALL SELECT 'mdlgx_local_prequran_stepprog'
    UNION ALL SELECT 'mdlgx_local_prequran_focuslog'
    UNION ALL SELECT 'mdlgx_local_prequran_focusagg'
    UNION ALL SELECT 'mdlgx_local_prequran_speakrec'
    UNION ALL SELECT 'mdlgx_local_prequran_submitrec'
    UNION ALL SELECT 'mdlgx_local_prequran_comm_thread'
    UNION ALL SELECT 'mdlgx_local_prequran_comm_participant'
    UNION ALL SELECT 'mdlgx_local_prequran_comm_message'
    UNION ALL SELECT 'mdlgx_local_prequran_comm_consent'
    UNION ALL SELECT 'mdlgx_local_prequran_live_availability'
    UNION ALL SELECT 'mdlgx_local_prequran_live_consent'
    UNION ALL SELECT 'mdlgx_local_prequran_live_series'
    UNION ALL SELECT 'mdlgx_local_prequran_live_session'
    UNION ALL SELECT 'mdlgx_local_prequran_live_participant'
    UNION ALL SELECT 'mdlgx_local_prequran_live_attendance'
    UNION ALL SELECT 'mdlgx_local_prequran_live_note'
    UNION ALL SELECT 'mdlgx_local_prequran_live_recording'
    UNION ALL SELECT 'mdlgx_local_prequran_live_ack'
    UNION ALL SELECT 'mdlgx_local_prequran_live_audit'
    UNION ALL SELECT 'mdlgx_local_prequran_quiz_attempt'
    UNION ALL SELECT 'mdlgx_local_prequran_quiz_pass'
    UNION ALL SELECT 'mdlgx_local_prequran_quiz_question'
) export_tables;

