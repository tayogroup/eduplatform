-- Platform course roster verification.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Required tables.
SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_course_offering' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_course_enrol_req'
    UNION ALL SELECT 'mdlgx_local_prequran_workspace'
    UNION ALL SELECT 'mdlgx_local_prequran_consumer'
    UNION ALL SELECT 'mdlgx_course'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

-- 2) All offerings by institution/workspace with seats and request counts.
SELECT o.id AS offeringid,
       COALESCE(ci.name, cw.name, '') AS consumer_name,
       o.workspaceid,
       w.name AS workspace_name,
       o.title,
       o.course_key,
       o.moodlecourseid,
       mc.fullname AS moodle_course_name,
       mc.shortname AS moodle_course_shortname,
       o.status,
       o.visibility,
       FROM_UNIXTIME(NULLIF(o.startdate, 0)) AS startdate,
       FROM_UNIXTIME(NULLIF(o.enddate, 0)) AS enddate,
       o.capacity,
       COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) AS approved_or_enrolled,
       COUNT(CASE WHEN r.status = 'pending' THEN 1 END) AS pending_requests,
       CASE
           WHEN o.capacity <= 0 THEN 'UNLIMITED'
           WHEN COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) >= o.capacity THEN 'FULL'
           ELSE CAST(o.capacity - COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) AS CHAR)
       END AS open_seats
FROM mdlgx_local_prequran_course_offering o
LEFT JOIN mdlgx_local_prequran_workspace w ON w.id = o.workspaceid
LEFT JOIN mdlgx_local_prequran_consumer ci ON ci.id = o.consumerid
LEFT JOIN mdlgx_local_prequran_consumer cw ON cw.primaryworkspaceid = o.workspaceid
LEFT JOIN mdlgx_course mc ON mc.id = o.moodlecourseid
LEFT JOIN mdlgx_local_prequran_course_enrol_req r ON r.offeringid = o.id
GROUP BY o.id, ci.name, cw.name, o.workspaceid, w.name, o.title, o.course_key, o.moodlecourseid,
         mc.fullname, mc.shortname, o.status, o.visibility, o.startdate, o.enddate, o.capacity
ORDER BY consumer_name ASC, workspace_name ASC, o.status ASC, o.startdate ASC, o.title ASC;

-- 3) Example individual institution/workspace report. Change workspaceid value.
SET @workspaceid := 1;
SELECT o.id AS offeringid,
       w.name AS workspace_name,
       o.title,
       o.course_key,
       mc.fullname AS moodle_course_name,
       o.status,
       o.visibility,
       o.capacity,
       COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) AS approved_or_enrolled,
       COUNT(CASE WHEN r.status = 'pending' THEN 1 END) AS pending_requests
FROM mdlgx_local_prequran_course_offering o
LEFT JOIN mdlgx_local_prequran_workspace w ON w.id = o.workspaceid
LEFT JOIN mdlgx_course mc ON mc.id = o.moodlecourseid
LEFT JOIN mdlgx_local_prequran_course_enrol_req r ON r.offeringid = o.id
WHERE o.workspaceid = @workspaceid
GROUP BY o.id, w.name, o.title, o.course_key, mc.fullname, o.status, o.visibility, o.capacity
ORDER BY o.status ASC, o.startdate ASC, o.title ASC;
