-- Somali University: migrate already-imported courses to the final
-- Year 1 catalog (Academic English I, University Mathematics I,
-- Introduction to Computing, Arabic Language I, Principles of
-- Economics I). Cumulative: works whether your database currently has
-- the original names, the interim Year 1 religious titles, or a mix.
-- Only needed for databases imported with earlier script versions;
-- fresh installs from the regenerated scripts do not need this.
-- Prefix: mdlgx_. Safe to re-run.

START TRANSACTION;

-- Moodle courses (keyed by old or new shortname) ------------------------
UPDATE mdlgx_course SET fullname = 'Academic English I',
  summary = 'Academic English I - Somali University Year 1 course. Schedule: Mon/Wed 10:00 AM.'
WHERE shortname = 'su-eng101';

UPDATE mdlgx_course SET fullname = 'University Mathematics I',
  summary = 'University Mathematics I - Somali University Year 1 course. Schedule: Tue/Thu 8:00 AM.'
WHERE shortname = 'su-math101';

UPDATE mdlgx_course SET shortname = 'su-ict101', idnumber = 'SU-ICT101',
  fullname = 'Introduction to Computing',
  summary = 'Introduction to Computing - Somali University Year 1 course. Schedule: Sat/Sun 4:00 PM.'
WHERE shortname IN ('su-qurn101', 'su-ict101');

UPDATE mdlgx_course SET fullname = 'Arabic Language I',
  summary = 'Arabic Language I - Somali University Year 1 course. Schedule: Mon/Thu 2:00 PM.'
WHERE shortname = 'su-arb101';

UPDATE mdlgx_course SET shortname = 'su-econ101', idnumber = 'SU-ECON101',
  fullname = 'Principles of Economics I',
  summary = 'Principles of Economics I - Somali University Year 1 course. Schedule: Tue/Sat 6:00 PM.'
WHERE shortname IN ('su-isl101', 'su-econ101');

-- Workspace course offerings (sync from the renamed courses) ------------
UPDATE mdlgx_local_prequran_course_offering o
JOIN mdlgx_course c ON c.id = o.moodlecourseid
SET o.title = c.fullname,
    o.course_key = c.shortname,
    o.summary = CONCAT(c.fullname, ' - Somali University Year 1 offering.')
WHERE o.course_key LIKE 'su-%';

-- Class group titles (if student-links.sql was already run) -------------
UPDATE mdlgx_local_prequran_class_group
SET title = REPLACE(REPLACE(title, 'English Foundations', 'Academic English I'), 'Academic English I - Group', 'Academic English I - Group')
WHERE title LIKE 'English Foundations - Group %';
UPDATE mdlgx_local_prequran_class_group
SET title = REPLACE(title, 'Mathematics Foundations', 'University Mathematics I')
WHERE title LIKE 'Mathematics Foundations - Group %';
UPDATE mdlgx_local_prequran_class_group
SET title = REPLACE(REPLACE(title, 'Quraan Recitation and Tajweed', 'Introduction to Computing'), 'Quraan Studies I', 'Introduction to Computing')
WHERE title LIKE 'Quraan Recitation and Tajweed - Group %' OR title LIKE 'Quraan Studies I - Group %';
UPDATE mdlgx_local_prequran_class_group
SET title = REPLACE(title, 'Arabic Language Basics', 'Arabic Language I')
WHERE title LIKE 'Arabic Language Basics - Group %';
UPDATE mdlgx_local_prequran_class_group
SET title = REPLACE(REPLACE(title, 'Islamic Studies Foundations', 'Principles of Economics I'), 'Islamic Studies I', 'Principles of Economics I')
WHERE title LIKE 'Islamic Studies Foundations - Group %' OR title LIKE 'Islamic Studies I - Group %';

COMMIT;
