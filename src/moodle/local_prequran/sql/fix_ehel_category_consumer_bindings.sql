-- Binds each Ehel school's Moodle course category to its consumer via the
-- idnumber convention the platform already looks for
-- (pqco_consumer_<consumerid>, read by pqco_consumer_category_id()).
--
-- NON-DESTRUCTIVE: this only sets idnumbers. It does NOT delete the duplicate
-- "Ehel Languages School" categories -- deleting a Moodle category in raw SQL
-- orphans its mdl_context row and leaves the category cache stale, so those
-- two go through the Moodle UI instead (see the notes below).
--
-- Run check_ehel_category_cleanup_safety.sql first and confirm every
-- courses_in_subtree reads 0 for the Languages duplicates.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- Ehel Languages School (consumer 7) -> category 23, the lowest-numbered of
-- the three identical empty copies. Categories 28 and 33 are deleted in the
-- UI afterwards; binding 23 first means the survivor is unambiguous.
UPDATE ehelacad_quraantest.mdlgx_course_categories
SET idnumber = 'pqco_consumer_7'
WHERE id = 23
  AND name = 'Ehel Languages School';

-- Verify: every active Ehel consumer and the category now bound to it.
-- Ehel Academy (6) is a parent brand with no school courses of its own, so a
-- NULL there is expected. Ehel Skills (9) stays NULL until its category is
-- created -- see the note below.
SELECT c.id AS consumerid, c.slug, c.name,
       CONCAT('pqco_consumer_', c.id) AS required_category_idnumber,
       cc.id AS bound_categoryid, cc.name AS bound_category_name, cc.path
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer c
LEFT JOIN ehelacad_quraantest.mdlgx_course_categories cc
       ON cc.idnumber = CONCAT('pqco_consumer_', c.id)
WHERE c.slug LIKE '%ehel%' AND c.status = 'active'
ORDER BY c.id;

-- NOTE 1 -- delete the duplicate Languages categories in the Moodle UI:
--   Site administration > Courses > Manage courses and categories
--   Delete category id 28 ("Ehel Languages School") and id 33, including
--   their empty English / Arabic / Kiswahili / Somali children. Keep id 23.
--   The UI removes the context records and purges the category cache; raw
--   SQL deletes do neither.
--
-- NOTE 2 -- three schools have no course category at all yet:
--     consumer  9  Ehel Skills School   -> ID number pqco_consumer_9
--     consumer 10  Ehel Technology      -> ID number pqco_consumer_10
--     consumer 11  Ehel Adult School    -> ID number pqco_consumer_11
--   Create each in the same UI as a child of "Ehel Academy" and set the ID
--   number shown above, mirroring how category 9 sits at /14/9 for K-12.
--
--   Doing nothing also works -- the first course created through the offering
--   form calls pqco_consumer_category_id(), which creates the category on
--   demand. But it creates it with parent 0, i.e. at the TOP LEVEL rather than
--   nested under "Ehel Academy", so the tree ends up inconsistent. Creating
--   them by hand now avoids that.
--
--   Ehel Academy (consumer 6) is the parent brand and owns no school courses
--   of its own, so it needs no category.
