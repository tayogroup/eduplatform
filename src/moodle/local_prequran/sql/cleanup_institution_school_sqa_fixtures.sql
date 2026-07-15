-- Production cleanup for institution-school SQA fixtures.
-- This script is intentionally scoped to the generated huda.sqa / huda.branchb.sqa / huda.franchise.sqa identities.
-- It soft-deletes Moodle users, archives generated SQA workspaces, and inactivates fixture-only records.
-- Review the preview SELECT statements first; run inside the target Moodle database after taking a backup.

SET @now := UNIX_TIMESTAMP();

SET @huda_admin := (SELECT id FROM mdlgx_user WHERE username = 'huda.sqa.institution_admin' LIMIT 1);
SET @huda_school_admin := (SELECT id FROM mdlgx_user WHERE username = 'huda.sqa.school_admin' LIMIT 1);
SET @huda_teacher := (SELECT id FROM mdlgx_user WHERE username = 'huda.sqa.teacher' LIMIT 1);
SET @huda_student := (SELECT id FROM mdlgx_user WHERE username = 'huda.sqa.student' LIMIT 1);
SET @huda_parent := (SELECT id FROM mdlgx_user WHERE username = 'huda.sqa.parent' LIMIT 1);
SET @branchb_admin := (SELECT id FROM mdlgx_user WHERE username = 'huda.branchb.sqa.school_admin' LIMIT 1);
SET @branchb_teacher := (SELECT id FROM mdlgx_user WHERE username = 'huda.branchb.sqa.teacher' LIMIT 1);
SET @branchb_student := (SELECT id FROM mdlgx_user WHERE username = 'huda.branchb.sqa.student' LIMIT 1);
SET @branchb_parent := (SELECT id FROM mdlgx_user WHERE username = 'huda.branchb.sqa.parent' LIMIT 1);
SET @franchise_admin := (SELECT id FROM mdlgx_user WHERE username = 'huda.franchise.sqa.franchise_admin' LIMIT 1);
SET @franchise_school_admin := (SELECT id FROM mdlgx_user WHERE username = 'huda.franchise.sqa.school_admin' LIMIT 1);
SET @franchise_teacher := (SELECT id FROM mdlgx_user WHERE username = 'huda.franchise.sqa.teacher' LIMIT 1);
SET @franchise_student := (SELECT id FROM mdlgx_user WHERE username = 'huda.franchise.sqa.student' LIMIT 1);
SET @franchise_parent := (SELECT id FROM mdlgx_user WHERE username = 'huda.franchise.sqa.parent' LIMIT 1);

SET @branchb_workspace := (SELECT id FROM mdlgx_local_prequran_workspace WHERE slug = 'huda-branch-b-sqa' LIMIT 1);
SET @franchise_workspace := (SELECT id FROM mdlgx_local_prequran_workspace WHERE slug = 'huda-franchise-sqa' LIMIT 1);

SELECT 'preview_fixture_users' AS preview_name, id, username, deleted
  FROM mdlgx_user
 WHERE username IN (
       'huda.sqa.institution_admin',
       'huda.sqa.school_admin',
       'huda.sqa.teacher',
       'huda.sqa.student',
       'huda.sqa.parent',
       'huda.branchb.sqa.school_admin',
       'huda.branchb.sqa.teacher',
       'huda.branchb.sqa.student',
       'huda.branchb.sqa.parent',
       'huda.franchise.sqa.franchise_admin',
       'huda.franchise.sqa.school_admin',
       'huda.franchise.sqa.teacher',
       'huda.franchise.sqa.student',
       'huda.franchise.sqa.parent'
 );

SELECT 'preview_generated_workspaces' AS preview_name, id, slug, name, status
  FROM mdlgx_local_prequran_workspace
 WHERE slug IN ('huda-branch-b-sqa', 'huda-franchise-sqa');

UPDATE mdlgx_local_prequran_live_participant
   SET status = 'inactive',
       timemodified = @now
 WHERE userid IN (
       @huda_teacher, @huda_student,
       @branchb_teacher, @branchb_student,
       @franchise_teacher, @franchise_student
 )
    OR sessionid IN (
       SELECT id
         FROM mdlgx_local_prequran_live_session
        WHERE title IN (
              'Huda SQA Functional Live Session',
              'Huda Branch B SQA Functional Live Session',
              'Huda Franchise SQA Functional Live Session'
        )
    );

UPDATE mdlgx_local_prequran_live_session
   SET status = 'cancelled',
       cancelledby = COALESCE(NULLIF(@huda_admin, 0), 0),
       cancellation_reason = 'Production cleanup of institution-school SQA fixture.',
       timemodified = @now
 WHERE title IN (
       'Huda SQA Functional Live Session',
       'Huda Branch B SQA Functional Live Session',
       'Huda Franchise SQA Functional Live Session'
 );

UPDATE mdlgx_local_prequran_group_member
   SET assignment_status = 'inactive',
       timemodified = @now
 WHERE studentid IN (@huda_student, @branchb_student, @franchise_student)
    OR groupid IN (
       SELECT id
         FROM mdlgx_local_prequran_class_group
        WHERE title IN (
              'Huda SQA Functional Class',
              'Huda Branch B SQA Functional Class',
              'Huda Franchise SQA Functional Class'
        )
    );

UPDATE mdlgx_local_prequran_class_group
   SET status = 'archived',
       timemodified = @now
 WHERE title IN (
       'Huda SQA Functional Class',
       'Huda Branch B SQA Functional Class',
       'Huda Franchise SQA Functional Class'
 );

UPDATE mdlgx_local_prequran_group_pool
   SET status = 'archived',
       timemodified = @now
 WHERE title IN (
       'Huda SQA Functional Pool',
       'Huda Branch B SQA Functional Pool',
       'Huda Franchise SQA Functional Pool'
 );

UPDATE mdlgx_local_prequran_teacher_student
   SET status = 'inactive',
       timemodified = @now
 WHERE teacherid IN (@huda_teacher, @branchb_teacher, @franchise_teacher)
    OR studentid IN (@huda_student, @branchb_student, @franchise_student);

UPDATE mdlgx_local_prequran_comm_consent
   SET consented = 0,
       notes = CONCAT(TRIM(COALESCE(notes, '')), CASE WHEN TRIM(COALESCE(notes, '')) = '' THEN '' ELSE ' | ' END, 'Revoked during production cleanup of SQA fixture.'),
       timemodified = @now
 WHERE studentid IN (@huda_student, @branchb_student, @franchise_student)
    OR guardianid IN (@huda_parent, @branchb_parent, @franchise_parent);

UPDATE mdlgx_local_prequran_live_consent
   SET granted = 0,
       details = CONCAT(TRIM(COALESCE(details, '')), CASE WHEN TRIM(COALESCE(details, '')) = '' THEN '' ELSE ' | ' END, 'Revoked during production cleanup of SQA fixture.'),
       timemodified = @now
 WHERE studentid IN (@huda_student, @branchb_student, @franchise_student)
    OR guardianid IN (@huda_parent, @branchb_parent, @franchise_parent);

UPDATE mdlgx_local_prequran_student_profile
   SET status = 'archived',
       timemodified = @now
 WHERE userid IN (@huda_student, @branchb_student, @franchise_student);

UPDATE mdlgx_local_prequran_teacher_profile
   SET status = 'archived',
       timemodified = @now
 WHERE userid IN (@huda_teacher, @branchb_teacher, @franchise_teacher);

UPDATE mdlgx_local_prequran_workspace_member
   SET status = 'inactive',
       timemodified = @now
 WHERE userid IN (
       @huda_school_admin, @huda_teacher, @huda_student, @huda_parent,
       @branchb_admin, @branchb_teacher, @branchb_student, @branchb_parent,
       @franchise_school_admin, @franchise_teacher, @franchise_student, @franchise_parent
 );

UPDATE mdlgx_local_prequran_org_group_member
   SET status = 'inactive',
       notes = CONCAT(TRIM(COALESCE(notes, '')), CASE WHEN TRIM(COALESCE(notes, '')) = '' THEN '' ELSE ' | ' END, 'Inactive after production cleanup of SQA fixture.'),
       timemodified = @now
 WHERE memberid IN (
       @huda_admin,
       @franchise_admin,
       @branchb_workspace,
       @franchise_workspace
 )
    OR notes LIKE '%functional test%'
    OR notes LIKE '%SQA%fixture%';

UPDATE mdlgx_local_prequran_workspace
   SET status = 'archived',
       timemodified = @now
 WHERE slug IN ('huda-branch-b-sqa', 'huda-franchise-sqa');

UPDATE mdlgx_user
   SET deleted = 1,
       suspended = 1,
       emailstop = 1,
       username = CONCAT(username, '.deleted.', id),
       email = CONCAT('deleted+', id, '@example.invalid'),
       timemodified = @now
 WHERE username IN (
       'huda.sqa.institution_admin',
       'huda.sqa.school_admin',
       'huda.sqa.teacher',
       'huda.sqa.student',
       'huda.sqa.parent',
       'huda.branchb.sqa.school_admin',
       'huda.branchb.sqa.teacher',
       'huda.branchb.sqa.student',
       'huda.branchb.sqa.parent',
       'huda.franchise.sqa.franchise_admin',
       'huda.franchise.sqa.school_admin',
       'huda.franchise.sqa.teacher',
       'huda.franchise.sqa.student',
       'huda.franchise.sqa.parent'
 );

SELECT 'cleanup_complete_sqa_active_users' AS check_name,
       COUNT(*) AS active_fixture_users,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_user
 WHERE deleted = 0
   AND (
       username LIKE 'huda.sqa.%'
       OR username LIKE 'huda.branchb.sqa.%'
       OR username LIKE 'huda.franchise.sqa.%'
   );

SELECT 'cleanup_complete_generated_workspaces_archived' AS check_name,
       COUNT(*) AS active_generated_workspaces,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_workspace
 WHERE slug IN ('huda-branch-b-sqa', 'huda-franchise-sqa')
   AND status <> 'archived';
