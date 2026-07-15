-- Read-only official transcript document verification.
-- Replace :workspaceid with a concrete workspace id, or 0 for all workspaces.
-- Replace :studentid with a concrete student id, or 0 for all students.

SELECT
    td.id,
    td.documentid,
    td.workspaceid,
    w.name AS workspace_name,
    td.studentid,
    u.firstname,
    u.lastname,
    u.idnumber AS account_no,
    td.status,
    td.policyversion,
    td.policyhash,
    td.snapshothash,
    td.pdfhash,
    td.pdfgeneratedat,
    td.replacedbydocumentid,
    td.revokedby,
    td.revokedat,
    td.issuedby,
    td.issuedat,
    td.timecreated
FROM mdl_local_prequran_transcript_doc td
JOIN mdl_local_prequran_workspace w
  ON w.id = td.workspaceid
JOIN mdl_user u
  ON u.id = td.studentid
WHERE (:workspaceid = 0 OR td.workspaceid = :workspaceid)
  AND (:studentid = 0 OR td.studentid = :studentid)
ORDER BY td.issuedat DESC, td.id DESC;
