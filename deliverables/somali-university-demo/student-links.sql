-- Somali University: link students to teachers and class groups
-- Run AFTER workspace-link.sql. MySQL/MariaDB. Prefix from DB_PREFIX (mdlgx_).
--
-- Creates:
--   * 30 class groups (one per teacher, named per course section)
--   * group members: every course enrolment placed in one of the course's
--     6 sections (spread by MOD(userid, 6))
--   * one primary teacher per student (from their first course's section)
-- Safe to re-run; purge caches afterwards.

SET @workspaceid := 15;

START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS tmp_su_cmap;
CREATE TEMPORARY TABLE tmp_su_cmap (shortname VARCHAR(255) PRIMARY KEY, ci INT, title VARCHAR(255), schedule VARCHAR(80));
INSERT INTO tmp_su_cmap (shortname, ci, title, schedule) VALUES
('su-eng101', 0, 'English Foundations', 'Mon/Wed 10:00 AM'),
('su-math101', 1, 'Mathematics Foundations', 'Tue/Thu 8:00 AM'),
('su-qurn101', 2, 'Quraan Recitation and Tajweed', 'Sat/Sun 4:00 PM'),
('su-arb101', 3, 'Arabic Language Basics', 'Mon/Thu 2:00 PM'),
('su-isl101', 4, 'Islamic Studies Foundations', 'Tue/Sat 6:00 PM');

-- 1) Class groups: one per teacher ------------------------------------
INSERT INTO mdlgx_local_prequran_class_group
  (workspaceid, poolid, teacherid, title, age_min, age_max, gender_policy,
   schedule_summary, max_students, status, createdby, timecreated, timemodified)
SELECT @workspaceid, 0, t.id,
       CONCAT(m.title, ' - Group ', s.k + 1),
       18, 99, 'flexible', m.schedule, 40, 'open', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM tmp_su_cmap m
JOIN (SELECT 0 AS k UNION ALL SELECT 1 AS k UNION ALL SELECT 2 AS k UNION ALL SELECT 3 AS k UNION ALL SELECT 4 AS k UNION ALL SELECT 5 AS k) s
JOIN mdlgx_user t ON t.username = CONCAT('su-teacher', m.ci + 1 + 5 * s.k) AND t.deleted = 0
WHERE NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_class_group g
                  WHERE g.title = CONCAT(m.title, ' - Group ', s.k + 1)
                    AND g.workspaceid = @workspaceid);

-- 2) Group members: place each enrolment in its course section --------
INSERT INTO mdlgx_local_prequran_group_member
  (workspaceid, groupid, poolid, studentid, match_score, match_status,
   assignment_status, match_details, assignedby, timecreated, timemodified)
SELECT @workspaceid, g.id, 0, u.id, 100, 'manual', 'active',
       'Somali University demo assignment.', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdlgx_user u
JOIN mdlgx_user_enrolments ue ON ue.userid = u.id
JOIN mdlgx_enrol e ON e.id = ue.enrolid AND e.enrol = 'manual'
JOIN mdlgx_course c ON c.id = e.courseid
JOIN tmp_su_cmap m ON m.shortname = c.shortname
JOIN mdlgx_local_prequran_class_group g
  ON g.workspaceid = @workspaceid
 AND g.title = CONCAT(m.title, ' - Group ', MOD(u.id, 6) + 1)
WHERE u.username LIKE 'su-student%' AND u.deleted = 0
  AND NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_group_member gm
                  WHERE gm.groupid = g.id AND gm.studentid = u.id);

-- 3) Primary teacher per student (from their first course) ------------
INSERT INTO mdlgx_local_prequran_teacher_student
  (workspaceid, teacherid, studentid, cohortid, status, assignedby, timecreated, timemodified)
SELECT @workspaceid, t.id, fc.uid, 0, 'active', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM (
  SELECT u.id AS uid, MIN(m.ci) AS ci
  FROM mdlgx_user u
  JOIN mdlgx_user_enrolments ue ON ue.userid = u.id
  JOIN mdlgx_enrol e ON e.id = ue.enrolid AND e.enrol = 'manual'
  JOIN mdlgx_course c ON c.id = e.courseid
  JOIN tmp_su_cmap m ON m.shortname = c.shortname
  WHERE u.username LIKE 'su-student%' AND u.deleted = 0
  GROUP BY u.id
) fc
JOIN mdlgx_user t ON t.username = CONCAT('su-teacher', fc.ci + 1 + 5 * MOD(fc.uid, 6)) AND t.deleted = 0
WHERE NOT EXISTS (SELECT 1 FROM mdlgx_local_prequran_teacher_student ts
                  WHERE ts.workspaceid = @workspaceid AND ts.studentid = fc.uid);

DROP TEMPORARY TABLE IF EXISTS tmp_su_cmap;

COMMIT;

-- If an insert fails with "Unknown column", that optional column does
-- not exist in your plugin version - remove it and its value, re-run.
--
-- CLEANUP (when the demo is over; uncomment to use)
-- DELETE gm FROM mdlgx_local_prequran_group_member gm JOIN mdlgx_user u ON u.id = gm.studentid
--   WHERE gm.workspaceid = @workspaceid AND u.username LIKE 'su-%';
-- DELETE FROM mdlgx_local_prequran_class_group
--   WHERE workspaceid = @workspaceid AND title LIKE '%- Group %' AND createdby = 0;
-- DELETE ts FROM mdlgx_local_prequran_teacher_student ts JOIN mdlgx_user u ON u.id = ts.studentid
--   WHERE ts.workspaceid = @workspaceid AND u.username LIKE 'su-%';
