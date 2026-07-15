-- Repair and verify dual-course test students.
-- Replace mdlgx_ with your Moodle database prefix if needed.

UPDATE mdlgx_local_prequran_student_profile sp
JOIN mdlgx_user u ON u.id = sp.userid
SET sp.course_type = CASE u.username
    WHEN 'qa.dual.prequran' THEN 'pre_quraan,tarbiyah_kids'
    WHEN 'qa.dual.tarbiyah' THEN 'tarbiyah_kids,essential_arabic'
    WHEN 'qa.dual.arabic' THEN 'essential_arabic,quran_reading'
    WHEN 'qa.dual.reading' THEN 'quran_reading,quran_tafsir'
    WHEN 'qa.dual.tafsir' THEN 'quran_tafsir,quraan_memorization'
    WHEN 'qa.dual.memorization' THEN 'quraan_memorization,pre_quraan'
    ELSE sp.course_type
END,
sp.timemodified = UNIX_TIMESTAMP()
WHERE u.username IN (
    'qa.dual.prequran',
    'qa.dual.tarbiyah',
    'qa.dual.arabic',
    'qa.dual.reading',
    'qa.dual.tafsir',
    'qa.dual.memorization'
)
AND u.deleted = 0;

SELECT
    'profile_course_type' AS check_name,
    u.id AS userid,
    u.username,
    sp.course_type,
    sp.status,
    sp.enrollment_approval_status
FROM mdlgx_user u
LEFT JOIN mdlgx_local_prequran_student_profile sp ON sp.userid = u.id
WHERE u.username IN (
    'qa.dual.prequran',
    'qa.dual.tarbiyah',
    'qa.dual.arabic',
    'qa.dual.reading',
    'qa.dual.tafsir',
    'qa.dual.memorization'
)
AND u.deleted = 0
ORDER BY FIELD(u.username, 'qa.dual.prequran', 'qa.dual.tarbiyah', 'qa.dual.arabic', 'qa.dual.reading', 'qa.dual.tafsir', 'qa.dual.memorization');

SELECT
    'moodle_enrolments' AS check_name,
    u.username,
    COUNT(DISTINCT c.id) AS active_moodle_courses,
    GROUP_CONCAT(DISTINCT CONCAT(c.id, ': ', c.fullname, ' [', c.shortname, ']') ORDER BY c.fullname SEPARATOR ' | ') AS courses
FROM mdlgx_user u
LEFT JOIN mdlgx_user_enrolments ue
       ON ue.userid = u.id
      AND ue.status = 0
LEFT JOIN mdlgx_enrol e
       ON e.id = ue.enrolid
      AND e.status = 0
LEFT JOIN mdlgx_course c
       ON c.id = e.courseid
      AND c.visible = 1
WHERE u.username IN (
    'qa.dual.prequran',
    'qa.dual.tarbiyah',
    'qa.dual.arabic',
    'qa.dual.reading',
    'qa.dual.tafsir',
    'qa.dual.memorization'
)
AND u.deleted = 0
GROUP BY u.username
ORDER BY FIELD(u.username, 'qa.dual.prequran', 'qa.dual.tarbiyah', 'qa.dual.arabic', 'qa.dual.reading', 'qa.dual.tafsir', 'qa.dual.memorization');

SELECT
    'expected_dashboard_courses_for_qa_dual_tafsir' AS check_name,
    'quran_tafsir' AS course_key,
    'Quran Tafsir' AS course_name
UNION ALL
SELECT
    'expected_dashboard_courses_for_qa_dual_tafsir',
    'quraan_memorization',
    'Quran Memorization';
