-- Course offering verification.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Required course offering tables.
SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_course_offering' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_course_enrol_req'
    UNION ALL SELECT 'mdlgx_local_prequran_course_audit'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

-- 2) Required offering fields.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'consumerid' AS column_name
    UNION ALL SELECT 'workspaceid'
    UNION ALL SELECT 'moodlecourseid'
    UNION ALL SELECT 'course_key'
    UNION ALL SELECT 'title'
    UNION ALL SELECT 'summary'
    UNION ALL SELECT 'syllabus'
    UNION ALL SELECT 'prerequisites'
    UNION ALL SELECT 'startdate'
    UNION ALL SELECT 'enddate'
    UNION ALL SELECT 'capacity'
    UNION ALL SELECT 'visibility'
    UNION ALL SELECT 'approval_mode'
    UNION ALL SELECT 'status'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_course_offering'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 3) Required request fields.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'offeringid' AS column_name
    UNION ALL SELECT 'consumerid'
    UNION ALL SELECT 'workspaceid'
    UNION ALL SELECT 'studentid'
    UNION ALL SELECT 'requesterid'
    UNION ALL SELECT 'requester_role'
    UNION ALL SELECT 'status'
    UNION ALL SELECT 'request_notes'
    UNION ALL SELECT 'admin_notes'
    UNION ALL SELECT 'approvedby'
    UNION ALL SELECT 'approvedat'
    UNION ALL SELECT 'moodleenrolledat'
    UNION ALL SELECT 'droppedby'
    UNION ALL SELECT 'droppedat'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_course_enrol_req'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 4) Required course audit fields.
SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'consumerid' AS column_name
    UNION ALL SELECT 'workspaceid'
    UNION ALL SELECT 'offeringid'
    UNION ALL SELECT 'requestid'
    UNION ALL SELECT 'studentid'
    UNION ALL SELECT 'actorid'
    UNION ALL SELECT 'action'
    UNION ALL SELECT 'targettype'
    UNION ALL SELECT 'targetid'
    UNION ALL SELECT 'details'
    UNION ALL SELECT 'timecreated'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_course_audit'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

-- 5) Published/closed offerings and open seats by workspace.
SELECT o.id AS offeringid,
       o.workspaceid,
       o.title,
       o.course_key,
       o.moodlecourseid,
       FROM_UNIXTIME(NULLIF(o.startdate, 0)) AS startdate,
       FROM_UNIXTIME(NULLIF(o.enddate, 0)) AS enddate,
       o.capacity,
       COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) AS approved_students,
       COUNT(CASE WHEN r.status = 'pending' THEN 1 END) AS pending_requests,
       COUNT(CASE WHEN r.status = 'drop_requested' THEN 1 END) AS drop_requests,
       COUNT(CASE WHEN r.status = 'dropped' THEN 1 END) AS dropped_students,
       CASE
           WHEN o.capacity <= 0 THEN 'UNLIMITED'
           WHEN COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) >= o.capacity THEN 'FULL'
           ELSE CAST(o.capacity - COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) AS CHAR)
       END AS open_seats,
       o.status
FROM mdlgx_local_prequran_course_offering o
LEFT JOIN mdlgx_local_prequran_course_enrol_req r
       ON r.offeringid = o.id
GROUP BY o.id, o.workspaceid, o.title, o.course_key, o.moodlecourseid, o.startdate, o.enddate, o.capacity, o.status
ORDER BY o.workspaceid ASC, o.startdate ASC, o.title ASC;

-- 6) Pending enrollment and drop requests.
SELECT r.id AS requestid,
       r.workspaceid,
       r.offeringid,
       o.title AS offering_title,
       r.studentid,
       r.requesterid,
       r.status,
       FROM_UNIXTIME(r.timecreated) AS requested_at
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o
  ON o.id = r.offeringid
WHERE r.status IN ('pending', 'drop_requested')
ORDER BY r.timecreated DESC;

-- 7) Offering to Moodle course/category/manual enrollment linkage.
SELECT o.id AS offeringid,
       o.title AS offering_title,
       o.status AS offering_status,
       c.id AS moodlecourseid,
       c.fullname AS moodle_course_name,
       c.shortname AS moodle_course_shortname,
       cc.name AS moodle_category,
       cc.idnumber AS moodle_category_idnumber,
       CASE WHEN e.id IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS manual_enrolment,
       CASE WHEN e.status = 0 THEN 'ENABLED'
            WHEN e.id IS NULL THEN 'MISSING'
            ELSE 'DISABLED'
       END AS manual_enrolment_status
FROM mdlgx_local_prequran_course_offering o
LEFT JOIN mdlgx_course c
       ON c.id = o.moodlecourseid
LEFT JOIN mdlgx_course_categories cc
       ON cc.id = c.category
LEFT JOIN mdlgx_enrol e
       ON e.courseid = c.id
      AND e.enrol = 'manual'
ORDER BY o.id DESC;

-- 8) Recent course audit events.
SELECT a.id AS auditid,
       a.workspaceid,
       a.offeringid,
       a.requestid,
       a.studentid,
       a.actorid,
       a.action,
       a.targettype,
       a.targetid,
       FROM_UNIXTIME(a.timecreated) AS activity_time,
       a.details
FROM mdlgx_local_prequran_course_audit a
ORDER BY a.timecreated DESC, a.id DESC
LIMIT 50;
