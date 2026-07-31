-- READ-ONLY. Shows the full course category tree (id, name, parent, depth,
-- path) so we can see how "Ehel Academy", "Ehel Primary" (now renamed to
-- Ehel K-12 School in the workspace/consumer tables, but the Moodle course
-- category itself is untouched so far), "Ehel Languages School" (if it
-- exists as a category), and the subject/grade categories currently relate
-- to each other before making any changes.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT
    cc.id,
    cc.name,
    cc.parent,
    p.name AS parent_name,
    cc.depth,
    cc.path,
    cc.visible,
    (SELECT COUNT(*) FROM mdlgx_course c WHERE c.category = cc.id) AS course_count
FROM mdlgx_course_categories cc
LEFT JOIN mdlgx_course_categories p ON p.id = cc.parent
ORDER BY cc.path ASC;
