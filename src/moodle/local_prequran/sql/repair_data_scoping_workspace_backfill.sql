-- Repair workspace scoping gaps for existing institution/school data.
-- This script assumes the production prefix is mdlgx_.
-- It backfills from existing relationships first. It only falls back to the owned-school
-- branch when there is exactly one active owned_branch workspace link.

SET @owned_branch_count := (
    SELECT COUNT(DISTINCT gm.memberid)
      FROM mdlgx_local_prequran_org_group g
      JOIN mdlgx_local_prequran_org_group_member gm ON gm.groupid = g.id
     WHERE g.slug = 'owned-schools'
       AND g.group_type = 'owned_group'
       AND g.status = 'active'
       AND gm.member_type = 'workspace'
       AND gm.relationship_type = 'owned_branch'
       AND gm.status = 'active'
);

SET @owned_workspaceid := (
    SELECT CASE WHEN @owned_branch_count = 1 THEN MIN(gm.memberid) ELSE 0 END
      FROM mdlgx_local_prequran_org_group g
      JOIN mdlgx_local_prequran_org_group_member gm ON gm.groupid = g.id
     WHERE g.slug = 'owned-schools'
       AND g.group_type = 'owned_group'
       AND g.status = 'active'
       AND gm.member_type = 'workspace'
       AND gm.relationship_type = 'owned_branch'
       AND gm.status = 'active'
);

SELECT 'repair_target_workspace' AS check_name,
       @owned_branch_count AS owned_branch_count,
       @owned_workspaceid AS fallback_workspaceid,
       CASE WHEN @owned_workspaceid > 0 THEN 'READY' ELSE 'STOP: more than one or no owned branch workspace' END AS status;

-- Teacher intake: prefer the consumer primary workspace, then the single owned branch fallback.
UPDATE mdlgx_local_prequran_teacher_intake_request tir
  JOIN mdlgx_local_prequran_consumer c ON c.id = tir.consumerid
   SET tir.workspaceid = c.primaryworkspaceid,
       tir.timemodified = UNIX_TIMESTAMP()
 WHERE COALESCE(tir.workspaceid, 0) = 0
   AND COALESCE(c.primaryworkspaceid, 0) > 0;

UPDATE mdlgx_local_prequran_teacher_intake_request
   SET workspaceid = @owned_workspaceid,
       timemodified = UNIX_TIMESTAMP()
 WHERE COALESCE(workspaceid, 0) = 0
   AND @owned_workspaceid > 0;

-- Teacher profile: prefer the teacher's one clear active workspace membership.
UPDATE mdlgx_local_prequran_teacher_profile tp
  JOIN (
        SELECT userid, MIN(workspaceid) AS workspaceid, COUNT(DISTINCT workspaceid) AS workspace_count
          FROM mdlgx_local_prequran_workspace_member
         WHERE status = 'active'
           AND workspace_role IN ('owner', 'admin', 'teacher', 'assistant_teacher')
           AND workspaceid > 0
      GROUP BY userid
        HAVING workspace_count = 1
       ) wm ON wm.userid = tp.userid
   SET tp.workspaceid = wm.workspaceid,
       tp.timemodified = UNIX_TIMESTAMP()
 WHERE COALESCE(tp.workspaceid, 0) = 0;

-- Existing legacy profiles with no workspace membership belong to the single owned school only
-- when there is exactly one owned_branch workspace.
UPDATE mdlgx_local_prequran_teacher_profile
   SET workspaceid = @owned_workspaceid,
       timemodified = UNIX_TIMESTAMP()
 WHERE COALESCE(workspaceid, 0) = 0
   AND @owned_workspaceid > 0;

-- Live sessions: prefer class group workspace, then series workspace, then teacher workspace,
-- then the single owned branch fallback.
UPDATE mdlgx_local_prequran_live_session s
  JOIN mdlgx_local_prequran_class_group g ON g.id = s.groupid
   SET s.workspaceid = g.workspaceid,
       s.timemodified = UNIX_TIMESTAMP()
 WHERE COALESCE(s.workspaceid, 0) = 0
   AND COALESCE(g.workspaceid, 0) > 0;

UPDATE mdlgx_local_prequran_live_session s
  JOIN mdlgx_local_prequran_live_series ser ON ser.id = s.seriesid
   SET s.workspaceid = ser.workspaceid,
       s.timemodified = UNIX_TIMESTAMP()
 WHERE COALESCE(s.workspaceid, 0) = 0
   AND COALESCE(ser.workspaceid, 0) > 0;

UPDATE mdlgx_local_prequran_live_session s
  JOIN (
        SELECT userid, MIN(workspaceid) AS workspaceid, COUNT(DISTINCT workspaceid) AS workspace_count
          FROM mdlgx_local_prequran_workspace_member
         WHERE status = 'active'
           AND workspace_role IN ('owner', 'admin', 'teacher', 'assistant_teacher')
           AND workspaceid > 0
      GROUP BY userid
        HAVING workspace_count = 1
       ) wm ON wm.userid = s.teacherid
   SET s.workspaceid = wm.workspaceid,
       s.timemodified = UNIX_TIMESTAMP()
 WHERE COALESCE(s.workspaceid, 0) = 0;

UPDATE mdlgx_local_prequran_live_session
   SET workspaceid = @owned_workspaceid,
       timemodified = UNIX_TIMESTAMP()
 WHERE COALESCE(workspaceid, 0) = 0
   AND @owned_workspaceid > 0;

-- Live participants inherit workspace from the session.
UPDATE mdlgx_local_prequran_live_participant p
  JOIN mdlgx_local_prequran_live_session s ON s.id = p.sessionid
   SET p.workspaceid = s.workspaceid,
       p.timemodified = UNIX_TIMESTAMP()
 WHERE COALESCE(p.workspaceid, 0) = 0
   AND COALESCE(s.workspaceid, 0) > 0;

SELECT 'teacher_intake_workspaceid_after_repair' AS check_name,
       COUNT(*) AS missing_workspace_rows,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_teacher_intake_request
 WHERE COALESCE(workspaceid, 0) = 0;

SELECT 'teacher_profiles_workspaceid_after_repair' AS check_name,
       COUNT(*) AS missing_workspace_rows,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_teacher_profile
 WHERE COALESCE(workspaceid, 0) = 0;

SELECT 'live_sessions_workspaceid_after_repair' AS check_name,
       COUNT(*) AS missing_workspace_rows,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_live_session
 WHERE COALESCE(workspaceid, 0) = 0;

SELECT 'live_participants_workspaceid_after_repair' AS check_name,
       COUNT(*) AS missing_workspace_rows,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_live_participant
 WHERE COALESCE(workspaceid, 0) = 0;
