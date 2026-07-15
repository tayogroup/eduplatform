-- Seed 6 test students: one primary student per academy course, each enrolled in one extra course.
-- Replace mdlgx_ with your Moodle database prefix if needed.
--
-- Test password for all created users:
--   Test@12345!
--
-- Expected Moodle course shortnames or idnumbers:
--   pre_quraan
--   tarbiyah_kids
--   essential_arabic
--   quran_reading
--   quran_tafsir
--   quraan_memorization

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

CREATE TEMPORARY TABLE IF NOT EXISTS qa_seed_dual_students (
    username VARCHAR(100) NOT NULL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    primary_course_type VARCHAR(60) NOT NULL,
    primary_course_title VARCHAR(120) NOT NULL,
    extra_course_type VARCHAR(60) NOT NULL,
    extra_course_title VARCHAR(120) NOT NULL,
    age_years INT NOT NULL,
    gender VARCHAR(40) NOT NULL,
    current_level VARCHAR(100) NOT NULL,
    learning_base VARCHAR(100) NOT NULL,
    parent_name VARCHAR(255) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(100) NOT NULL
) ENGINE=Memory;

DELETE FROM qa_seed_dual_students;

INSERT INTO qa_seed_dual_students
    (username, firstname, lastname, email, primary_course_type, primary_course_title, extra_course_type, extra_course_title, age_years, gender, current_level, learning_base, parent_name, parent_email, parent_phone)
VALUES
    ('qa.dual.prequran', 'Nuh', 'Dual Prequran', 'qa.dual.prequran@quraanacademy.test', 'pre_quraan', 'Pre-Quraan', 'tarbiyah_kids', 'Tarbiyah Kids', 7, 'male', 'alphabet', 'new learner', 'Parent Dual Prequran', 'parent.dual.prequran@quraanacademy.test', '+15550006001'),
    ('qa.dual.tarbiyah', 'Ruqayya', 'Dual Tarbiyah', 'qa.dual.tarbiyah@quraanacademy.test', 'tarbiyah_kids', 'Tarbiyah Kids', 'essential_arabic', 'Essential Arabic', 9, 'female', 'level 1', 'knows basics', 'Parent Dual Tarbiyah', 'parent.dual.tarbiyah@quraanacademy.test', '+15550006002'),
    ('qa.dual.arabic', 'Salman', 'Dual Arabic', 'qa.dual.arabic@quraanacademy.test', 'essential_arabic', 'Essential Arabic', 'quran_reading', 'Quran Reading', 10, 'male', 'level 2', 'can read short words', 'Parent Dual Arabic', 'parent.dual.arabic@quraanacademy.test', '+15550006003'),
    ('qa.dual.reading', 'Ismail', 'Dual Reading', 'qa.dual.reading@quraanacademy.test', 'quran_reading', 'Quran Reading', 'quran_tafsir', 'Quran Tafsir', 11, 'male', 'level 2', 'can read short words', 'Parent Dual Reading', 'parent.dual.reading@quraanacademy.test', '+15550006004'),
    ('qa.dual.tafsir', 'Khadija', 'Dual Tafsir', 'qa.dual.tafsir@quraanacademy.test', 'quran_tafsir', 'Quran Tafsir', 'quraan_memorization', 'Quran Memorization', 12, 'female', 'level 2', 'reflection practice', 'Parent Dual Tafsir', 'parent.dual.tafsir@quraanacademy.test', '+15550006005'),
    ('qa.dual.memorization', 'Yahya', 'Dual Memorization', 'qa.dual.memorization@quraanacademy.test', 'quraan_memorization', 'Quran Memorization', 'pre_quraan', 'Pre-Quraan', 10, 'male', 'level 2', 'revision schedule', 'Parent Dual Memorization', 'parent.dual.memorization@quraanacademy.test', '+15550006006');

CREATE TEMPORARY TABLE IF NOT EXISTS qa_seed_dual_enrolments (
    username VARCHAR(100) NOT NULL,
    course_type VARCHAR(60) NOT NULL,
    course_title VARCHAR(120) NOT NULL,
    PRIMARY KEY (username, course_type)
) ENGINE=Memory;

DELETE FROM qa_seed_dual_enrolments;

INSERT INTO qa_seed_dual_enrolments (username, course_type, course_title)
SELECT username, primary_course_type, primary_course_title FROM qa_seed_dual_students
UNION ALL
SELECT username, extra_course_type, extra_course_title FROM qa_seed_dual_students;

UPDATE mdlgx_user u
JOIN qa_seed_dual_students s ON s.username = u.username
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
    'manual', 1, 0, 0, 0, @mnethostid, s.username, @password_hash, CONCAT('QA-DUAL-', UPPER(REPLACE(s.primary_course_type, '_', '-'))),
    s.firstname, s.lastname, s.email, 1, 'Test City', 'US', '99', 'en',
    CONCAT('Seed dual-enrolment test student for ', s.primary_course_title, ' and ', s.extra_course_title, '.'),
    @now, @now
FROM qa_seed_dual_students s
WHERE NOT EXISTS (
    SELECT 1
    FROM mdlgx_user u
    WHERE u.username = s.username
      AND u.mnethostid = @mnethostid
      AND u.deleted = 0
);

UPDATE mdlgx_user u
JOIN qa_seed_dual_students s ON s.username = u.username
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
    CONCAT(s.primary_course_type, ',', s.extra_course_type),
    s.parent_name,
    s.parent_email,
    s.parent_phone,
    1,
    1,
    'Seed consent for dual-enrolment test data only.',
    'Sessions/week: 2; Preferred: weekday evenings.',
    CONCAT('Primary course: ', s.primary_course_title, '; extra course: ', s.extra_course_title, '.'),
    'approved',
    0,
    @now,
    'Seed approval for dual-enrolment test data only.',
    'active',
    0,
    @now,
    @now
FROM qa_seed_dual_students s
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
JOIN qa_seed_dual_students s ON s.username = u.username
SET
    sp.student_display_name = CONCAT(s.firstname, ' ', s.lastname),
    sp.course_type = CONCAT(s.primary_course_type, ',', s.extra_course_type),
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
    'manual', 0, c.id, 0, CONCAT('Seed manual enrolment - ', e.course_title), 0, 0, 0,
    0, 0, 0, '', '', '', @student_roleid,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    @now, @now
FROM (
    SELECT DISTINCT course_type, course_title
    FROM qa_seed_dual_enrolments
) e
JOIN mdlgx_course c
  ON LOWER(REPLACE(c.shortname, '-', '_')) = LOWER(e.course_type)
  OR LOWER(REPLACE(c.idnumber, '-', '_')) = LOWER(e.course_type)
  OR LOWER(REPLACE(REPLACE(c.shortname, '-', '_'), 'quraan', 'quran')) = LOWER(REPLACE(e.course_type, 'quraan', 'quran'))
  OR LOWER(REPLACE(REPLACE(c.idnumber, '-', '_'), 'quraan', 'quran')) = LOWER(REPLACE(e.course_type, 'quraan', 'quran'))
  OR LOWER(c.fullname) = LOWER(e.course_title)
  OR LOWER(c.fullname) LIKE CONCAT('%', LOWER(e.course_title), '%')
WHERE NOT EXISTS (
    SELECT 1
    FROM mdlgx_enrol en
    WHERE en.courseid = c.id
      AND en.enrol = 'manual'
);

INSERT INTO mdlgx_user_enrolments
    (status, enrolid, userid, timestart, timeend, modifierid, timecreated, timemodified)
SELECT
    0, en.id, u.id, @now, 0, 0, @now, @now
FROM qa_seed_dual_enrolments e
JOIN mdlgx_user u
  ON u.username = e.username
 AND u.mnethostid = @mnethostid
 AND u.deleted = 0
JOIN mdlgx_course c
  ON LOWER(REPLACE(c.shortname, '-', '_')) = LOWER(e.course_type)
  OR LOWER(REPLACE(c.idnumber, '-', '_')) = LOWER(e.course_type)
  OR LOWER(REPLACE(REPLACE(c.shortname, '-', '_'), 'quraan', 'quran')) = LOWER(REPLACE(e.course_type, 'quraan', 'quran'))
  OR LOWER(REPLACE(REPLACE(c.idnumber, '-', '_'), 'quraan', 'quran')) = LOWER(REPLACE(e.course_type, 'quraan', 'quran'))
  OR LOWER(c.fullname) = LOWER(e.course_title)
  OR LOWER(c.fullname) LIKE CONCAT('%', LOWER(e.course_title), '%')
JOIN mdlgx_enrol en
  ON en.courseid = c.id
 AND en.enrol = 'manual'
WHERE NOT EXISTS (
    SELECT 1
    FROM mdlgx_user_enrolments ue
    WHERE ue.enrolid = en.id
      AND ue.userid = u.id
);

INSERT INTO mdlgx_role_assignments
    (roleid, contextid, userid, timemodified, modifierid, component, itemid, sortorder)
SELECT
    @student_roleid, ctx.id, u.id, @now, 0, '', 0, 0
FROM qa_seed_dual_enrolments e
JOIN mdlgx_user u
  ON u.username = e.username
 AND u.mnethostid = @mnethostid
 AND u.deleted = 0
JOIN mdlgx_course c
  ON LOWER(REPLACE(c.shortname, '-', '_')) = LOWER(e.course_type)
  OR LOWER(REPLACE(c.idnumber, '-', '_')) = LOWER(e.course_type)
  OR LOWER(REPLACE(REPLACE(c.shortname, '-', '_'), 'quraan', 'quran')) = LOWER(REPLACE(e.course_type, 'quraan', 'quran'))
  OR LOWER(REPLACE(REPLACE(c.idnumber, '-', '_'), 'quraan', 'quran')) = LOWER(REPLACE(e.course_type, 'quraan', 'quran'))
  OR LOWER(c.fullname) = LOWER(e.course_title)
  OR LOWER(c.fullname) LIKE CONCAT('%', LOWER(e.course_title), '%')
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
    s.username,
    s.primary_course_title AS primary_course,
    s.extra_course_title AS extra_course,
    u.auth,
    u.confirmed,
    u.suspended,
    CASE WHEN u.password LIKE '$2y$%' THEN 'bcrypt_hash_ready' ELSE 'unexpected_password_hash' END AS password_hash_status,
    COUNT(DISTINCT c.id) AS matched_moodle_courses,
    GROUP_CONCAT(DISTINCT c.fullname ORDER BY c.fullname SEPARATOR ' | ') AS enrolled_course_names
FROM qa_seed_dual_students s
JOIN mdlgx_user u
  ON u.username = s.username
 AND u.mnethostid = @mnethostid
 AND u.deleted = 0
LEFT JOIN qa_seed_dual_enrolments e ON e.username = s.username
LEFT JOIN mdlgx_course c
  ON LOWER(REPLACE(c.shortname, '-', '_')) = LOWER(e.course_type)
  OR LOWER(REPLACE(c.idnumber, '-', '_')) = LOWER(e.course_type)
  OR LOWER(REPLACE(REPLACE(c.shortname, '-', '_'), 'quraan', 'quran')) = LOWER(REPLACE(e.course_type, 'quraan', 'quran'))
  OR LOWER(REPLACE(REPLACE(c.idnumber, '-', '_'), 'quraan', 'quran')) = LOWER(REPLACE(e.course_type, 'quraan', 'quran'))
  OR LOWER(c.fullname) = LOWER(e.course_title)
  OR LOWER(c.fullname) LIKE CONCAT('%', LOWER(e.course_title), '%')
GROUP BY s.username, s.primary_course_title, s.extra_course_title, u.auth, u.confirmed, u.suspended, password_hash_status
ORDER BY FIELD(s.primary_course_type, 'pre_quraan', 'tarbiyah_kids', 'essential_arabic', 'quran_reading', 'quran_tafsir', 'quraan_memorization');

DROP TEMPORARY TABLE IF EXISTS qa_seed_dual_enrolments;
DROP TEMPORARY TABLE IF EXISTS qa_seed_dual_students;
