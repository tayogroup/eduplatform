-- READ-ONLY. Answers "how many course syllabuses exist, and which are they?"
--
-- Syllabuses are runtime rows only: nothing in the repo stores one. The table
-- is created by xmldb_local_prequran_ensure_syllabus_schema() in
-- db/upgradelib.php and written by local/hubredirect/syllabus.php. It is keyed
-- unique on (workspaceid, moodlecourseid, academicyear) -- one syllabus per
-- course, per school, per year -- so the row count IS the syllabus count.
--
-- Statuses are draft / in_review / approved / retired (pqsyl_status_options()).
-- A course with NO row reports as 'not_started' in the portal; that value is
-- computed at render time and never stored, so query 3 below is the only way
-- to see those courses here.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. The list.
SELECT
    s.id AS syllabus_id,
    s.academicyear,
    CONCAT(s.academicyear, '-', SUBSTRING(s.academicyear + 1, 3)) AS year_label,
    w.name AS workspace_name,
    c.id AS courseid,
    c.shortname,
    c.fullname,
    s.status,
    s.visibility,
    FROM_UNIXTIME(s.timecreated, '%Y-%m-%d') AS created_date,
    FROM_UNIXTIME(s.timemodified, '%Y-%m-%d') AS modified_date,
    FROM_UNIXTIME(s.approvedat, '%Y-%m-%d') AS approved_date
FROM mdlgx_local_prequran_syllabus s
LEFT JOIN mdlgx_local_prequran_workspace w ON w.id = s.workspaceid
LEFT JOIN mdlgx_course c ON c.id = s.moodlecourseid
ORDER BY s.academicyear DESC, w.name, c.shortname;

-- 2. The totals, by year and state.
SELECT
    s.academicyear,
    s.status,
    COUNT(*) AS syllabuses
FROM mdlgx_local_prequran_syllabus s
GROUP BY s.academicyear, s.status
ORDER BY s.academicyear DESC, s.status;

-- 3. Coverage: courses that have an offering but no syllabus for the given
--    year -- the 'not_started' set the portal shows. Change the academicyear
--    literal (2026 = 2026-27, the cohorts.json convention) to the year asked
--    about; leaving it stale silently reports every course as uncovered.
SELECT
    w.name AS workspace_name,
    c.id AS courseid,
    c.shortname,
    c.fullname
FROM mdlgx_local_prequran_course_offering co
JOIN mdlgx_course c ON c.id = co.moodlecourseid
LEFT JOIN mdlgx_local_prequran_workspace w ON w.id = co.workspaceid
LEFT JOIN mdlgx_local_prequran_syllabus s
       ON s.moodlecourseid = co.moodlecourseid
      AND s.workspaceid = co.workspaceid
      AND s.academicyear = 2026
WHERE co.moodlecourseid > 0
  AND co.status <> 'archived'
  AND s.id IS NULL
ORDER BY w.name, c.shortname;
