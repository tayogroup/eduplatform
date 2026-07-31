-- READ-ONLY. Re-derives the complete list of leftover Huda/SQA-test Moodle
-- courses by pattern rather than by a truncated manual list, so nothing is
-- missed or wrongly included. Matches on shortname containing "HUDA" or
-- category name starting with "SQA".
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT
    c.id AS courseid,
    c.fullname,
    c.shortname,
    cc.name AS category,
    c.visible,
    FROM_UNIXTIME(c.timecreated, '%Y-%m-%d') AS created_date
FROM mdlgx_course c
JOIN mdlgx_course_categories cc ON cc.id = c.category
WHERE c.id <> 1
  AND (
        c.shortname LIKE '%HUDA%'
     OR cc.name LIKE 'SQA%'
  )
ORDER BY c.id ASC;

-- Count for a quick sanity check against what you expect.
SELECT COUNT(*) AS huda_sqa_course_count
FROM mdlgx_course c
JOIN mdlgx_course_categories cc ON cc.id = c.category
WHERE c.id <> 1
  AND (
        c.shortname LIKE '%HUDA%'
     OR cc.name LIKE 'SQA%'
  );
