-- Somali University: rename already-imported courses to Year 1 titles
-- Only needed if you ran the earlier demo-data.sql / workspace-link.sql /
-- student-links.sql with the old course names. Fresh installs from the
-- regenerated scripts do not need this. Prefix: mdlgx_. Safe to re-run.

START TRANSACTION;

-- Moodle courses -------------------------------------------------------
UPDATE mdlgx_course SET fullname = 'Academic English I',
  summary = 'Academic English I - Somali University Year 1 course. Schedule: Mon/Wed 10:00 AM.'
WHERE shortname = 'su-eng101';
UPDATE mdlgx_course SET fullname = 'University Mathematics I',
  summary = 'University Mathematics I - Somali University Year 1 course. Schedule: Tue/Thu 8:00 AM.'
WHERE shortname = 'su-math101';
UPDATE mdlgx_course SET fullname = 'Quraan Studies I',
  summary = 'Quraan Studies I - Somali University Year 1 course. Schedule: Sat/Sun 4:00 PM.'
WHERE shortname = 'su-qurn101';
UPDATE mdlgx_course SET fullname = 'Arabic Language I',
  summary = 'Arabic Language I - Somali University Year 1 course. Schedule: Mon/Thu 2:00 PM.'
WHERE shortname = 'su-arb101';
UPDATE mdlgx_course SET fullname = 'Islamic Studies I',
  summary = 'Islamic Studies I - Somali University Year 1 course. Schedule: Tue/Sat 6:00 PM.'
WHERE shortname = 'su-isl101';

-- Workspace course offerings ------------------------------------------
UPDATE mdlgx_local_prequran_course_offering o
JOIN mdlgx_course c ON c.id = o.moodlecourseid
SET o.title = c.fullname,
    o.summary = CONCAT(c.fullname, ' - Somali University Year 1 offering.')
WHERE o.course_key LIKE 'su-%';

-- Class group titles (if student-links.sql was already run) ------------
UPDATE mdlgx_local_prequran_class_group
SET title = REPLACE(title, 'English Foundations', 'Academic English I')
WHERE title LIKE 'English Foundations - Group %';
UPDATE mdlgx_local_prequran_class_group
SET title = REPLACE(title, 'Mathematics Foundations', 'University Mathematics I')
WHERE title LIKE 'Mathematics Foundations - Group %';
UPDATE mdlgx_local_prequran_class_group
SET title = REPLACE(title, 'Quraan Recitation and Tajweed', 'Quraan Studies I')
WHERE title LIKE 'Quraan Recitation and Tajweed - Group %';
UPDATE mdlgx_local_prequran_class_group
SET title = REPLACE(title, 'Arabic Language Basics', 'Arabic Language I')
WHERE title LIKE 'Arabic Language Basics - Group %';
UPDATE mdlgx_local_prequran_class_group
SET title = REPLACE(title, 'Islamic Studies Foundations', 'Islamic Studies I')
WHERE title LIKE 'Islamic Studies Foundations - Group %';

COMMIT;
