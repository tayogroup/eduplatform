-- READ-ONLY. Lists every real Moodle course currently in the system (the
-- site course itself, id 1, is excluded since it isn't a real course).
-- Joins in the course category name and, where one exists, the matching
-- local_prequran_course_offering row for workspace/pricing/status context.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT
    c.id AS courseid,
    c.fullname,
    c.shortname,
    cc.name AS category,
    c.visible,
    FROM_UNIXTIME(c.timecreated, '%Y-%m-%d') AS created_date,
    co.id AS offering_id,
    co.title AS offering_title,
    co.status AS offering_status,
    co.tuition_amount,
    co.pricing_currency,
    w.name AS workspace_name
FROM mdlgx_course c
JOIN mdlgx_course_categories cc ON cc.id = c.category
LEFT JOIN mdlgx_local_prequran_course_offering co ON co.moodlecourseid = c.id
LEFT JOIN mdlgx_local_prequran_workspace w ON w.id = co.workspaceid
WHERE c.id <> 1
ORDER BY c.timecreated DESC;
