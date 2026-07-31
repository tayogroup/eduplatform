-- READ-ONLY. Safety check before removing the duplicate "Ehel Languages
-- School" categories and stamping consumer idnumbers. Confirms the duplicates
-- are genuinely empty (no courses anywhere beneath them) so deleting them
-- cannot destroy content.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Course count beneath EACH "Ehel Languages School" root, counting the
--    whole subtree, not just direct children. Every row must read 0 before
--    anything is deleted.
SELECT root.id AS root_categoryid, root.name, root.path,
       (SELECT COUNT(1)
          FROM ehelacad_quraantest.mdlgx_course c
          JOIN ehelacad_quraantest.mdlgx_course_categories cc ON cc.id = c.category
         WHERE cc.id = root.id OR cc.path LIKE CONCAT(root.path, '/%')) AS courses_in_subtree,
       (SELECT COUNT(1)
          FROM ehelacad_quraantest.mdlgx_course_categories sub
         WHERE sub.path LIKE CONCAT(root.path, '/%')) AS subcategories
FROM ehelacad_quraantest.mdlgx_course_categories root
WHERE root.name = 'Ehel Languages School'
ORDER BY root.id;

-- 2. Which Ehel consumers exist and what category idnumber each one needs.
SELECT c.id AS consumerid, c.slug, c.name, c.primaryworkspaceid,
       CONCAT('pqco_consumer_', c.id) AS required_category_idnumber,
       (SELECT cc.id FROM ehelacad_quraantest.mdlgx_course_categories cc
         WHERE cc.idnumber = CONCAT('pqco_consumer_', c.id)) AS bound_categoryid
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer c
WHERE c.slug LIKE '%ehel%' AND c.status = 'active'
ORDER BY c.id;

-- 3. Anything still pointing at the duplicate categories (offerings that
--    reference a course inside them). Expected: no rows.
SELECT o.id AS offeringid, o.title, o.moodlecourseid, c.category AS categoryid
FROM ehelacad_quraantest.mdlgx_local_prequran_course_offering o
JOIN ehelacad_quraantest.mdlgx_course c ON c.id = o.moodlecourseid
JOIN ehelacad_quraantest.mdlgx_course_categories cc ON cc.id = c.category
WHERE cc.path LIKE '/14/28%' OR cc.path LIKE '/14/33%';
