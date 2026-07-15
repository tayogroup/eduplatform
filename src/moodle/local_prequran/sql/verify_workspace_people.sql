SELECT 'workspace_members' AS metric, COUNT(*) AS value
FROM mdlgx_local_prequran_workspace_member;

SELECT 'workspace_teacher_student_assignments' AS metric, COUNT(*) AS value
FROM mdlgx_local_prequran_teacher_student
WHERE status = 'active';

SELECT w.id AS workspaceid,
       w.name AS workspace,
       wm.workspace_role,
       COUNT(*) AS members
FROM mdlgx_local_prequran_workspace w
JOIN mdlgx_local_prequran_workspace_member wm ON wm.workspaceid = w.id
WHERE wm.status = 'active'
GROUP BY w.id, w.name, wm.workspace_role
ORDER BY w.name, wm.workspace_role;

SELECT w.name AS workspace,
       CONCAT(t.firstname, ' ', t.lastname) AS teacher,
       CONCAT(s.firstname, ' ', s.lastname) AS student,
       ts.status,
       FROM_UNIXTIME(ts.timemodified) AS updated_at
FROM mdlgx_local_prequran_teacher_student ts
JOIN mdlgx_local_prequran_workspace w ON w.id = ts.workspaceid
JOIN mdlgx_user t ON t.id = ts.teacherid
JOIN mdlgx_user s ON s.id = ts.studentid
WHERE ts.status = 'active'
ORDER BY ts.timemodified DESC;
