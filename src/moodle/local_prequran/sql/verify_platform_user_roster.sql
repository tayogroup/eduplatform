-- Platform user roster verification.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Required roster tables.
SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_consumer' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_workspace'
    UNION ALL SELECT 'mdlgx_local_prequran_workspace_member'
    UNION ALL SELECT 'mdlgx_user'
    UNION ALL SELECT 'mdlgx_user_enrolments'
    UNION ALL SELECT 'mdlgx_enrol'
    UNION ALL SELECT 'mdlgx_course'
    UNION ALL SELECT 'mdlgx_local_prequran_course_offering'
    UNION ALL SELECT 'mdlgx_local_prequran_course_enrol_req'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

-- 2) Users by institution/workspace/role.
SELECT c.id AS consumerid,
       c.name AS consumer_name,
       c.consumer_type,
       w.id AS workspaceid,
       w.name AS workspace_name,
       w.workspace_type,
       wm.workspace_role,
       wm.status AS member_status,
       u.id AS userid,
       CONCAT(u.firstname, ' ', u.lastname) AS user_name,
       u.email
FROM mdlgx_local_prequran_workspace_member wm
JOIN mdlgx_user u ON u.id = wm.userid
LEFT JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
LEFT JOIN mdlgx_local_prequran_consumer c ON c.primaryworkspaceid = w.id
WHERE u.deleted = 0
ORDER BY c.name ASC, w.name ASC, wm.workspace_role ASC, u.lastname ASC, u.firstname ASC;

-- 3) Moodle course enrolments per user.
SELECT u.id AS userid,
       CONCAT(u.firstname, ' ', u.lastname) AS user_name,
       c.id AS moodlecourseid,
       c.fullname AS moodle_course,
       ue.status AS enrolment_status
FROM mdlgx_user_enrolments ue
JOIN mdlgx_enrol e ON e.id = ue.enrolid
JOIN mdlgx_course c ON c.id = e.courseid
JOIN mdlgx_user u ON u.id = ue.userid
WHERE u.deleted = 0
  AND c.id <> 1
ORDER BY u.lastname ASC, u.firstname ASC, c.fullname ASC;

-- 4) Course offering requests by student.
SELECT r.studentid AS userid,
       CONCAT(u.firstname, ' ', u.lastname) AS student_name,
       r.status AS request_status,
       o.title AS offering_title,
       o.course_key,
       o.workspaceid
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o ON o.id = r.offeringid
JOIN mdlgx_user u ON u.id = r.studentid
ORDER BY r.timemodified DESC, r.id DESC;
