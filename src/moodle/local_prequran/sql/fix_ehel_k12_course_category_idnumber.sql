-- Stamps the Ehel K-12 course category (id 9, "Ehel K-12 School", holding all
-- 24 EHEL-* courses via its Primary / Lower Secondary sub-categories) with the
-- idnumber the platform uses to bind a category to a consumer.
--
-- Why: the consumer and workspace were renamed to "Ehel Primary & Secondary",
-- but the Moodle category kept the old name and had no idnumber -- so nothing
-- could link the two. Name matching is inherently rename-fragile; the idnumber
-- is the stable key pqco_consumer_category_id() already looks for, so setting
-- it fixes this permanently.
--
-- Two things start working once this runs:
--   1. The Course Inventory block on course_offerings.php finds all 24 courses
--      (it walks the category plus every descendant).
--   2. New courses created through the offering form file themselves INTO this
--      existing category instead of pqco_consumer_category_id() creating a
--      second, parallel "Ehel Primary & Secondary" category next to it.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

UPDATE ehelacad_quraantest.mdlgx_course_categories
SET idnumber = 'pqco_consumer_8'
WHERE id = 9
  AND name = 'Ehel K-12 School';

-- Verify: category 9 now carries the consumer binding.
SELECT id, name, idnumber, parent, path, depth
FROM ehelacad_quraantest.mdlgx_course_categories
WHERE id = 9;

-- Verify: the 24 courses now resolve through category 9 and its descendants,
-- which is exactly the set the Course Inventory block will list.
SELECT COUNT(1) AS courses_now_in_scope
FROM ehelacad_quraantest.mdlgx_course c
JOIN ehelacad_quraantest.mdlgx_course_categories cc ON cc.id = c.category
WHERE cc.id = 9 OR cc.path LIKE '/14/9/%';
