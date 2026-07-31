-- READ-ONLY. Finds which Moodle course category the Ehel K-12 courses
-- (EHEL-ENG-G01, EHEL-MATH-G01, EHEL-SCI-G01 ...) actually live in, so the
-- Course Inventory block on course_offerings.php can be scoped to match.
--
-- The block matches courses by category: the auto-created
-- "pqco_consumer_<consumerid>" category, or a category NAMED after the
-- consumer/workspace, plus all descendant categories. If these courses sit
-- under some other category name, that is why the block reported no courses.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Where the Ehel courses actually live.
SELECT c.id AS courseid, c.shortname, c.fullname, c.category AS categoryid,
       cc.name AS category_name, cc.idnumber AS category_idnumber, cc.path
FROM ehelacad_quraantest.mdlgx_course c
JOIN ehelacad_quraantest.mdlgx_course_categories cc ON cc.id = c.category
WHERE c.shortname LIKE 'EHEL-%' OR c.fullname LIKE 'Ehel %'
ORDER BY cc.name, c.fullname;

-- 2. Every category, with how many courses each holds -- shows the full tree
--    and whether an auto-created pqco_consumer_* category exists at all.
SELECT cc.id AS categoryid, cc.name, cc.idnumber, cc.parent, cc.path, cc.depth,
       (SELECT COUNT(1) FROM ehelacad_quraantest.mdlgx_course c2 WHERE c2.category = cc.id) AS course_count
FROM ehelacad_quraantest.mdlgx_course_categories cc
ORDER BY cc.path;

-- 3. What the block searches for, for consumer 8 (Ehel K-12 / Ehel Primary &
--    Secondary): the exact idnumber and the exact names it name-matches on.
SELECT 'looking for idnumber' AS check_name, CONCAT('pqco_consumer_', c.id) AS value
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer c WHERE c.id = 8
UNION ALL
SELECT 'looking for category name (consumer)', c.name
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer c WHERE c.id = 8
UNION ALL
SELECT 'looking for category name (workspace)', w.name
FROM ehelacad_quraantest.mdlgx_local_prequran_workspace w WHERE w.id = 23;
