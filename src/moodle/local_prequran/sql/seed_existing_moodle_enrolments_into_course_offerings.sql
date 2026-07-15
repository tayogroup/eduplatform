-- Course offering migration/seed: create request rows from existing Moodle enrolments.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Run after offerings are created and linked to Moodle courses.
-- The script only inserts missing rows for active Moodle enrolments where the user is a student member of the same workspace.

-- 1) Preview rows that would be seeded.
SELECT o.workspaceid,
       o.id AS offeringid,
       o.title AS offering_title,
       o.course_key,
       o.moodlecourseid,
       u.id AS studentid,
       u.username,
       u.email,
       u.idnumber AS account_no,
       FROM_UNIXTIME(COALESCE(ue.timecreated, ue.timemodified, UNIX_TIMESTAMP())) AS moodle_enrolled_at
FROM mdlgx_local_prequran_course_offering o
JOIN mdlgx_enrol e
  ON e.courseid = o.moodlecourseid
 AND e.enrol = 'manual'
JOIN mdlgx_user_enrolments ue
  ON ue.enrolid = e.id
 AND ue.status = 0
JOIN mdlgx_user u
  ON u.id = ue.userid
 AND u.deleted = 0
JOIN mdlgx_local_prequran_workspace_member wm
  ON wm.workspaceid = o.workspaceid
 AND wm.userid = u.id
 AND wm.workspace_role = 'student'
 AND wm.status = 'active'
LEFT JOIN mdlgx_local_prequran_course_enrol_req existing
  ON existing.offeringid = o.id
 AND existing.studentid = u.id
WHERE existing.id IS NULL
ORDER BY o.workspaceid, o.id, u.lastname, u.firstname;

-- 2) Insert missing request rows as enrolled.
INSERT INTO mdlgx_local_prequran_course_enrol_req
    (offeringid, consumerid, workspaceid, studentid, requesterid, requester_role,
     status, request_notes, admin_notes, approvedby, approvedat, moodleenrolledat,
     droppedby, droppedat, timecreated, timemodified)
SELECT o.id AS offeringid,
       o.consumerid,
       o.workspaceid,
       u.id AS studentid,
       0 AS requesterid,
       'migration' AS requester_role,
       'enrolled' AS status,
       '[Migration] Seeded from existing Moodle enrolment.' AS request_notes,
       '[Migration] Existing active Moodle enrolment imported into course offerings.' AS admin_notes,
       0 AS approvedby,
       COALESCE(NULLIF(ue.timecreated, 0), UNIX_TIMESTAMP()) AS approvedat,
       COALESCE(NULLIF(ue.timecreated, 0), UNIX_TIMESTAMP()) AS moodleenrolledat,
       0 AS droppedby,
       0 AS droppedat,
       COALESCE(NULLIF(ue.timecreated, 0), UNIX_TIMESTAMP()) AS timecreated,
       UNIX_TIMESTAMP() AS timemodified
FROM mdlgx_local_prequran_course_offering o
JOIN mdlgx_enrol e
  ON e.courseid = o.moodlecourseid
 AND e.enrol = 'manual'
JOIN mdlgx_user_enrolments ue
  ON ue.enrolid = e.id
 AND ue.status = 0
JOIN mdlgx_user u
  ON u.id = ue.userid
 AND u.deleted = 0
JOIN mdlgx_local_prequran_workspace_member wm
  ON wm.workspaceid = o.workspaceid
 AND wm.userid = u.id
 AND wm.workspace_role = 'student'
 AND wm.status = 'active'
LEFT JOIN mdlgx_local_prequran_course_enrol_req existing
  ON existing.offeringid = o.id
 AND existing.studentid = u.id
WHERE existing.id IS NULL;

-- 3) Verify seeded/imported enrolments by workspace/offering.
SELECT o.workspaceid,
       o.id AS offeringid,
       o.title,
       COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) AS active_course_requests,
       COUNT(CASE WHEN r.requester_role = 'migration' THEN 1 END) AS migration_seeded_rows
FROM mdlgx_local_prequran_course_offering o
LEFT JOIN mdlgx_local_prequran_course_enrol_req r
  ON r.offeringid = o.id
GROUP BY o.workspaceid, o.id, o.title
ORDER BY o.workspaceid, o.title;
