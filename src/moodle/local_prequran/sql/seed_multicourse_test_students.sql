-- Seed 18 test students: 3 per academy course.
-- Replace mdlgx_ with your Moodle database prefix if needed.
--
-- Expected Moodle course shortnames or idnumbers:
--   pre_quraan
--   tarbiyah_kids
--   essential_arabic
--   quran_reading
--   quran_tafsir
--   quraan_memorization
--
-- This script creates Moodle user records, local_prequran student profiles,
-- manual enrolment rows for matching Moodle courses, and student role
-- assignments when the student role exists.
--
-- Test password for all created users:
--   Test@12345!
--
SET @now := UNIX_TIMESTAMP();
SET @password_hash := '$2y$10$kU6boPRAEds1RL6/uCN/cu0M/qc4v.lgo/A/IFM3fvezF8FPzTwDi';
SET @student_roleid := COALESCE((SELECT id FROM mdlgx_role WHERE shortname = 'student' LIMIT 1), 5);
SET @mnethostid := COALESCE(
    (
        SELECT id
        FROM mdlgx_mnet_host
        WHERE deleted = 0
          AND COALESCE(wwwroot, '') <> ''
          AND LOWER(COALESCE(name, '')) <> 'all hosts'
        ORDER BY
            CASE
                WHEN LOWER(COALESCE(name, '')) IN ('localhost', 'local host') THEN 0
                WHEN COALESCE(applicationid, 0) = 1 THEN 1
                ELSE 2
            END,
            id
        LIMIT 1
    ),
    (
        SELECT id
        FROM mdlgx_mnet_host
        WHERE deleted = 0
          AND LOWER(COALESCE(name, '')) <> 'all hosts'
        ORDER BY id
        LIMIT 1
    ),
    1
);

CREATE TEMPORARY TABLE IF NOT EXISTS qa_seed_students (
    username VARCHAR(100) NOT NULL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    course_type VARCHAR(60) NOT NULL,
    course_title VARCHAR(120) NOT NULL,
    age_years INT NOT NULL,
    gender VARCHAR(40) NOT NULL,
    current_level VARCHAR(100) NOT NULL,
    learning_base VARCHAR(100) NOT NULL,
    parent_name VARCHAR(255) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(100) NOT NULL
) ENGINE=Memory;

DELETE FROM qa_seed_students;

INSERT INTO qa_seed_students
    (username, firstname, lastname, email, course_type, course_title, age_years, gender, current_level, learning_base, parent_name, parent_email, parent_phone)
VALUES
    ('qa.prequran.01', 'Ayaan', 'Prequran', 'qa.prequran.01@quraanacademy.test', 'pre_quraan', 'Pre-Quraan', 6, 'female', 'alphabet', 'new learner', 'Parent Prequran 01', 'parent.prequran.01@quraanacademy.test', '+15550001001'),
    ('qa.prequran.02', 'Bilal', 'Prequran', 'qa.prequran.02@quraanacademy.test', 'pre_quraan', 'Pre-Quraan', 7, 'male', 'alphabet, level 1', 'knows letters', 'Parent Prequran 02', 'parent.prequran.02@quraanacademy.test', '+15550001002'),
    ('qa.prequran.03', 'Maryam', 'Prequran', 'qa.prequran.03@quraanacademy.test', 'pre_quraan', 'Pre-Quraan', 8, 'female', 'level 1', 'can blend sounds', 'Parent Prequran 03', 'parent.prequran.03@quraanacademy.test', '+15550001003'),

    ('qa.tarbiyah.01', 'Hana', 'Tarbiyah', 'qa.tarbiyah.01@quraanacademy.test', 'tarbiyah_kids', 'Tarbiyah Kids', 7, 'female', 'level 1', 'new learner', 'Parent Tarbiyah 01', 'parent.tarbiyah.01@quraanacademy.test', '+15550002001'),
    ('qa.tarbiyah.02', 'Yusuf', 'Tarbiyah', 'qa.tarbiyah.02@quraanacademy.test', 'tarbiyah_kids', 'Tarbiyah Kids', 9, 'male', 'level 2', 'knows basics', 'Parent Tarbiyah 02', 'parent.tarbiyah.02@quraanacademy.test', '+15550002002'),
    ('qa.tarbiyah.03', 'Sumaya', 'Tarbiyah', 'qa.tarbiyah.03@quraanacademy.test', 'tarbiyah_kids', 'Tarbiyah Kids', 10, 'female', 'level 2', 'needs assessment', 'Parent Tarbiyah 03', 'parent.tarbiyah.03@quraanacademy.test', '+15550002003'),

    ('qa.arabic.01', 'Layla', 'Arabic', 'qa.arabic.01@quraanacademy.test', 'essential_arabic', 'Essential Arabic', 8, 'female', 'level 1', 'knows letters', 'Parent Arabic 01', 'parent.arabic.01@quraanacademy.test', '+15550002501'),
    ('qa.arabic.02', 'Khalid', 'Arabic', 'qa.arabic.02@quraanacademy.test', 'essential_arabic', 'Essential Arabic', 10, 'male', 'level 2', 'can read short words', 'Parent Arabic 02', 'parent.arabic.02@quraanacademy.test', '+15550002502'),
    ('qa.arabic.03', 'Noor', 'Arabic', 'qa.arabic.03@quraanacademy.test', 'essential_arabic', 'Essential Arabic', 12, 'female', 'level 2', 'needs assessment', 'Parent Arabic 03', 'parent.arabic.03@quraanacademy.test', '+15550002503'),

    ('qa.reading.01', 'Ibrahim', 'Reading', 'qa.reading.01@quraanacademy.test', 'quran_reading', 'Quran Reading', 9, 'male', 'level 1', 'can read short words', 'Parent Reading 01', 'parent.reading.01@quraanacademy.test', '+15550003001'),
    ('qa.reading.02', 'Aisha', 'Reading', 'qa.reading.02@quraanacademy.test', 'quran_reading', 'Quran Reading', 11, 'female', 'level 2', 'can read short words', 'Parent Reading 02', 'parent.reading.02@quraanacademy.test', '+15550003002'),
    ('qa.reading.03', 'Omar', 'Reading', 'qa.reading.03@quraanacademy.test', 'quran_reading', 'Quran Reading', 12, 'male', 'level 3', 'fluency practice', 'Parent Reading 03', 'parent.reading.03@quraanacademy.test', '+15550003003'),

    ('qa.tafsir.01', 'Zaynab', 'Tafsir', 'qa.tafsir.01@quraanacademy.test', 'quran_tafsir', 'Quran Tafsir', 10, 'female', 'level 1', 'age appropriate discussion', 'Parent Tafsir 01', 'parent.tafsir.01@quraanacademy.test', '+15550004001'),
    ('qa.tafsir.02', 'Adam', 'Tafsir', 'qa.tafsir.02@quraanacademy.test', 'quran_tafsir', 'Quran Tafsir', 12, 'male', 'level 2', 'reflection practice', 'Parent Tafsir 02', 'parent.tafsir.02@quraanacademy.test', '+15550004002'),
    ('qa.tafsir.03', 'Safiya', 'Tafsir', 'qa.tafsir.03@quraanacademy.test', 'quran_tafsir', 'Quran Tafsir', 14, 'female', 'level 3', 'topic discussion', 'Parent Tafsir 03', 'parent.tafsir.03@quraanacademy.test', '+15550004003'),

    ('qa.memorization.01', 'Musa', 'Memorization', 'qa.memorization.01@quraanacademy.test', 'quraan_memorization', 'Quran Memorization', 8, 'male', 'level 1', 'short surah target', 'Parent Memorization 01', 'parent.memorization.01@quraanacademy.test', '+15550005001'),
    ('qa.memorization.02', 'Fatima', 'Memorization', 'qa.memorization.02@quraanacademy.test', 'quraan_memorization', 'Quran Memorization', 10, 'female', 'level 2', 'revision schedule', 'Parent Memorization 02', 'parent.memorization.02@quraanacademy.test', '+15550005002'),
    ('qa.memorization.03', 'Hamza', 'Memorization', 'qa.memorization.03@quraanacademy.test', 'quraan_memorization', 'Quran Memorization', 13, 'male', 'level 3', 'memorization history', 'Parent Memorization 03', 'parent.memorization.03@quraanacademy.test', '+15550005003');

UPDATE mdlgx_user u
JOIN qa_seed_students s ON s.username = u.username
SET
    u.mnethostid = @mnethostid,
    u.timemodified = @now
WHERE u.deleted = 0
  AND u.mnethostid <> @mnethostid
  AND NOT EXISTS (
      SELECT 1
      FROM mdlgx_user target
      WHERE target.username = u.username
        AND target.mnethostid = @mnethostid
        AND target.deleted = 0
  );

INSERT INTO mdlgx_user
    (auth, confirmed, policyagreed, deleted, suspended, mnethostid, username, password, idnumber,
     firstname, lastname, email, emailstop, city, country, timezone, lang, description,
     timecreated, timemodified)
SELECT
    'manual', 1, 0, 0, 0, @mnethostid, s.username, @password_hash, CONCAT('QA-STU-', UPPER(REPLACE(s.course_type, '_', '-')), '-', RIGHT(s.username, 2)),
    s.firstname, s.lastname, s.email, 1, 'Test City', 'US', '99', 'en',
    CONCAT('Seed test student for ', s.course_title, '.'),
    @now, @now
FROM qa_seed_students s
WHERE NOT EXISTS (
    SELECT 1
    FROM mdlgx_user u
    WHERE u.username = s.username
      AND u.mnethostid = @mnethostid
      AND u.deleted = 0
);

UPDATE mdlgx_user u
JOIN qa_seed_students s ON s.username = u.username
SET
    u.firstname = s.firstname,
    u.lastname = s.lastname,
    u.email = s.email,
    u.password = @password_hash,
    u.suspended = 0,
    u.timemodified = @now
WHERE u.mnethostid = @mnethostid
  AND u.deleted = 0;

INSERT INTO mdlgx_local_prequran_student_profile
    (userid, student_display_name, date_of_birth, timezone, primary_language, language,
     age_years, age_band, current_level, learning_base, country, city, gender, special_needs,
     course_type, parent_name, parent_email, parent_phone, live_class_consent, recording_consent,
     consent_notes, availability, parent_preferences, enrollment_approval_status,
     enrollment_approvedby, enrollment_approvedat, enrollment_approval_notes, status,
     createdby, timecreated, timemodified)
SELECT
    u.id,
    CONCAT(s.firstname, ' ', s.lastname),
    '',
    'Africa/Nairobi',
    'English',
    'English',
    s.age_years,
    CASE
        WHEN s.age_years <= 7 THEN '6-7'
        WHEN s.age_years <= 10 THEN '8-10'
        WHEN s.age_years <= 13 THEN '11-13'
        ELSE '14-17'
    END,
    s.current_level,
    s.learning_base,
    'United States',
    'Test City',
    s.gender,
    'no',
    s.course_type,
    s.parent_name,
    s.parent_email,
    s.parent_phone,
    1,
    1,
    'Seed consent for test data only.',
    'Sessions/week: 2; Preferred: weekday evenings.',
    CONCAT('Seed test profile for ', s.course_title, '.'),
    'approved',
    0,
    @now,
    'Seed approval for test data only.',
    'active',
    0,
    @now,
    @now
FROM qa_seed_students s
JOIN mdlgx_user u
  ON u.username = s.username
 AND u.mnethostid = @mnethostid
 AND u.deleted = 0
WHERE NOT EXISTS (
    SELECT 1
    FROM mdlgx_local_prequran_student_profile sp
    WHERE sp.userid = u.id
);

UPDATE mdlgx_local_prequran_student_profile sp
JOIN mdlgx_user u ON u.id = sp.userid
JOIN qa_seed_students s ON s.username = u.username
SET
    sp.student_display_name = CONCAT(s.firstname, ' ', s.lastname),
    sp.course_type = s.course_type,
    sp.current_level = s.current_level,
    sp.learning_base = s.learning_base,
    sp.parent_name = s.parent_name,
    sp.parent_email = s.parent_email,
    sp.parent_phone = s.parent_phone,
    sp.enrollment_approval_status = 'approved',
    sp.status = 'active',
    sp.timemodified = @now;

INSERT INTO mdlgx_enrol
    (enrol, status, courseid, sortorder, name, enrolperiod, enrolstartdate, enrolenddate,
     expirynotify, expirythreshold, notifyall, password, cost, currency, roleid,
     customint1, customint2, customint3, customint4, customint5, customint6, customint7, customint8,
     customchar1, customchar2, customchar3, customdec1, customdec2, customtext1, customtext2, customtext3, customtext4,
     timecreated, timemodified)
SELECT
    'manual', 0, c.id, 0, CONCAT('Seed manual enrolment - ', s.course_title), 0, 0, 0,
    0, 0, 0, '', '', '', @student_roleid,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    @now, @now
FROM (
    SELECT DISTINCT course_type, course_title
    FROM qa_seed_students
) s
JOIN mdlgx_course c
  ON c.shortname = s.course_type
  OR c.idnumber = s.course_type
  OR c.fullname = s.course_title
WHERE NOT EXISTS (
    SELECT 1
    FROM mdlgx_enrol e
    WHERE e.courseid = c.id
      AND e.enrol = 'manual'
);

INSERT INTO mdlgx_user_enrolments
    (status, enrolid, userid, timestart, timeend, modifierid, timecreated, timemodified)
SELECT
    0, e.id, u.id, @now, 0, 0, @now, @now
FROM qa_seed_students s
JOIN mdlgx_user u
  ON u.username = s.username
 AND u.mnethostid = @mnethostid
 AND u.deleted = 0
JOIN mdlgx_course c
  ON c.shortname = s.course_type
  OR c.idnumber = s.course_type
  OR c.fullname = s.course_title
JOIN mdlgx_enrol e
  ON e.courseid = c.id
 AND e.enrol = 'manual'
WHERE NOT EXISTS (
    SELECT 1
    FROM mdlgx_user_enrolments ue
    WHERE ue.enrolid = e.id
      AND ue.userid = u.id
);

INSERT INTO mdlgx_role_assignments
    (roleid, contextid, userid, timemodified, modifierid, component, itemid, sortorder)
SELECT
    @student_roleid, ctx.id, u.id, @now, 0, '', 0, 0
FROM qa_seed_students s
JOIN mdlgx_user u
  ON u.username = s.username
 AND u.mnethostid = @mnethostid
 AND u.deleted = 0
JOIN mdlgx_course c
  ON c.shortname = s.course_type
  OR c.idnumber = s.course_type
  OR c.fullname = s.course_title
JOIN mdlgx_context ctx
  ON ctx.contextlevel = 50
 AND ctx.instanceid = c.id
WHERE NOT EXISTS (
    SELECT 1
    FROM mdlgx_role_assignments ra
    WHERE ra.roleid = @student_roleid
      AND ra.contextid = ctx.id
      AND ra.userid = u.id
);

SELECT
    s.course_title,
    s.course_type,
    COUNT(u.id) AS seeded_students,
    SUM(CASE WHEN c.id IS NULL THEN 1 ELSE 0 END) AS missing_course_matches
FROM qa_seed_students s
JOIN mdlgx_user u
  ON u.username = s.username
 AND u.mnethostid = @mnethostid
 AND u.deleted = 0
LEFT JOIN mdlgx_course c
  ON c.shortname = s.course_type
  OR c.idnumber = s.course_type
  OR c.fullname = s.course_title
GROUP BY s.course_title, s.course_type
ORDER BY FIELD(s.course_type, 'pre_quraan', 'tarbiyah_kids', 'essential_arabic', 'quran_reading', 'quran_tafsir', 'quraan_memorization');

SELECT
    'login_diagnostic' AS check_name,
    u.username,
    u.auth,
    u.confirmed,
    u.suspended,
    u.deleted,
    u.mnethostid,
    CASE WHEN u.password LIKE '$2y$%' THEN 'bcrypt_hash_ready' ELSE 'unexpected_password_hash' END AS password_hash_status
FROM mdlgx_user u
WHERE u.username IN ('qa.tarbiyah.01', 'qa.prequran.01', 'qa.arabic.01', 'qa.reading.01', 'qa.tafsir.01', 'qa.memorization.01')
ORDER BY FIELD(u.username, 'qa.prequran.01', 'qa.tarbiyah.01', 'qa.arabic.01', 'qa.reading.01', 'qa.tafsir.01', 'qa.memorization.01'), u.id;

DROP TEMPORARY TABLE IF EXISTS qa_seed_students;
