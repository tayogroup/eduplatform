-- READ-ONLY. Look up the account for Moodle user id 1294, plus its
-- workspace role/membership so you can tell whether this is the student
-- account (and, separately, whether a linked parent account exists).
-- Replace mdlgx_ with your real table prefix if different.

SELECT u.id, u.username, u.firstname, u.lastname, u.email, u.auth, u.suspended, u.deleted,
       wm.workspaceid, wm.workspace_role, wm.status AS membership_status
FROM mdlgx_user u
LEFT JOIN mdlgx_local_prequran_workspace_member wm ON wm.userid = u.id
WHERE u.id = 1294;
