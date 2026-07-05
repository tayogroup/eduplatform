import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  assertEduPlatformEnv,
  getEduPlatformEnv,
  redactedEduPlatformEnv,
} from './helpers/env';
import { adminCredentials, consumerLoginUrl, expectLoggedInToEduPlatform, loginToEduPlatform, logoutFromEduPlatform } from './helpers/auth';
import {
  AttendanceOperationsPage,
  AcademicQualityControlsPage,
  AcademicParentWorkspacePage,
  AcademicStudentParentPortalPage,
  WorkspaceMaterialsPage,
  WorkspaceReportsPage,
  WorkspaceStudentPage,
} from './helpers/academic-content';
import { IntakeReviewPage, StudentIntakePage, type StudentCreationResult } from './helpers/admissions';
import { GradebookAssessmentPage } from './helpers/completion';
import { CourseCatalogPage, CourseOfferingAdminPage } from './helpers/course-enrollment';
import { CourseOfferingPage, type PublicCourseOfferingResult } from './helpers/course-offering';
import { JourneyEvidence } from './helpers/evidence';
import { PublicIntakePage } from './helpers/intake';
import { buildEduPlatformUrl, HUB_ROUTES } from './helpers/routes';
import { buildStudentJourneyData, type StudentJourneyData } from './helpers/student-data';
import { buildTeacherJourneyData } from './helpers/teacher-data';
import {
  PublicTeacherIntakePage,
  TeacherApplicationQueuePage,
  TeacherIntakePage,
  type TeacherOnboardingResult,
} from './helpers/teacher-intake';
import { TeacherPortalFixturePage, TeacherPortalPage } from './helpers/teacher-portal';
import { TranscriptUiPage } from './helpers/transcript';

const ACADEMIC_E2E_ENV_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
  'EDUPLATFORM_TEACHER_PASSWORD',
  'EDUPLATFORM_TEST_OFFERING_ID',
  'EDUPLATFORM_TEST_COURSE_KEY',
  'EDUPLATFORM_PUBLIC_COURSE_LINK_MODE',
  'EDUPLATFORM_PUBLIC_COURSE_CAPACITY',
  'EDUPLATFORM_PUBLIC_COURSE_TUITION_AMOUNT',
  'EDUPLATFORM_PUBLIC_COURSE_CURRENCY',
  'EDUPLATFORM_ALLOW_PRODUCTION_E2E',
  'EDUPLATFORM_ENABLE_ACADEMIC_CONTENT_VISIBILITY',
  'EDUPLATFORM_ENABLE_ACADEMIC_RESOURCE_LIFECYCLE',
  'EDUPLATFORM_ENABLE_ACADEMIC_GRADEBOOK_CONSISTENCY',
  'EDUPLATFORM_ENABLE_ACADEMIC_ATTENDANCE_PROGRESS_AUDIT',
  'EDUPLATFORM_ENABLE_ACADEMIC_QUALITY_CONTROLS',
  'EDUPLATFORM_CLEANUP_MODE',
] as const;

async function withAcademicEnv<T>(
  overrides: Partial<Record<(typeof ACADEMIC_E2E_ENV_KEYS)[number], string>>,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of ACADEMIC_E2E_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const key of ACADEMIC_E2E_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function academicRunId(): string {
  return `academic-content-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function academicEvidence(testInfo: TestInfo, runId: string) {
  return new JourneyEvidence(testInfo, runId, redactedEduPlatformEnv(getEduPlatformEnv({ allowPartial: true })), {
    artifactPrefix: 'academic-quality',
    manifestTitle: 'EduPlatform Academic Quality Manifest',
  });
}

async function createAcademicOffering(page: Page, runId: string): Promise<PublicCourseOfferingResult> {
  const env = getEduPlatformEnv({ allowPartial: true });
  await loginToEduPlatform(page, env, adminCredentials(env));
  const offerings = new CourseOfferingPage(page, env);
  await offerings.goto();
  return offerings.createOperationsOffering({
    title: `SQA Academic ${env.testCourseKey || 'pre_quraan'} ${runId}`,
    capacity: env.publicCourseCapacity || '20',
    status: 'published',
    visibility: 'institution_public',
    tuitionAmount: env.publicCourseTuitionAmount || '0.00',
  });
}

async function createStudentFixture(page: Page, data: StudentJourneyData): Promise<StudentCreationResult> {
  const env = getEduPlatformEnv({ allowPartial: true });
  await logoutFromEduPlatform(page, env).catch(() => undefined);

  const publicIntake = new PublicIntakePage(page, env);
  await publicIntake.goto();
  await publicIntake.expectReady();
  await publicIntake.expectPublicCourseAvailable();
  await publicIntake.submitValidRequest(data);

  await loginToEduPlatform(page, env, adminCredentials(env));
  const queue = new IntakeReviewPage(page, env);
  await queue.goto();
  const requestId = await queue.loadRequestIntoStudentIntake(data);

  const studentIntake = new StudentIntakePage(page);
  await studentIntake.expectPrefilled(data);
  const parentUsernameInput = page.locator('input[name="parent_username"]');
  if (await parentUsernameInput.isVisible().catch(() => false)) {
    await parentUsernameInput.fill(data.guardian.email.replace(/[^a-z0-9._-]+/gi, '.').toLowerCase());
  }
  return studentIntake.createStudentFromPrefill(requestId);
}

async function createTeacherFixture(page: Page, runId: string): Promise<TeacherOnboardingResult> {
  const env = getEduPlatformEnv({ allowPartial: true });
  const teacherData = buildTeacherJourneyData(`${runId}-teacher`);
  const publicTeacherIntake = new PublicTeacherIntakePage(page, env);

  await logoutFromEduPlatform(page, env).catch(() => undefined);
  await publicTeacherIntake.goto();
  await publicTeacherIntake.expectReady();
  const application = await publicTeacherIntake.submitValidApplication(teacherData);

  await loginToEduPlatform(page, env, adminCredentials(env));
  const queue = new TeacherApplicationQueuePage(page, env);
  await queue.goto();
  const requestId = await queue.approveAndOpenIntake(teacherData, application.requestId);

  const teacherIntake = new TeacherIntakePage(page);
  await teacherIntake.expectPrefilled(teacherData);
  return teacherIntake.createTeacherFromPrefill(teacherData, requestId);
}

test.describe('EduPlatform academic quality harness', () => {
  test('validates academic quality configuration and routes', async ({}, testInfo) => {
    await withAcademicEnv({
      EDUPLATFORM_BASE_URL: process.env.EDUPLATFORM_BASE_URL || 'https://safe-stage.example.test',
      EDUPLATFORM_WORKSPACE_ID: process.env.EDUPLATFORM_WORKSPACE_ID || '3',
      EDUPLATFORM_CONSUMER: process.env.EDUPLATFORM_CONSUMER || 'huda-school',
      EDUPLATFORM_ADMIN_USERNAME: process.env.EDUPLATFORM_ADMIN_USERNAME || 'admin',
      EDUPLATFORM_ADMIN_PASSWORD: process.env.EDUPLATFORM_ADMIN_PASSWORD || 'secret',
      EDUPLATFORM_STUDENT_PASSWORD: process.env.EDUPLATFORM_STUDENT_PASSWORD || 'Mock@001!',
      EDUPLATFORM_TEST_COURSE_KEY: process.env.EDUPLATFORM_TEST_COURSE_KEY || 'pre_quraan',
    }, async () => {
      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);
      const runId = academicRunId();
      const evidence = academicEvidence(testInfo, runId);
      const materialsUrl = buildEduPlatformUrl(env, HUB_ROUTES.workspaceMaterials);
      const studentUrl = buildEduPlatformUrl(env, HUB_ROUTES.workspaceStudent, { studentid: 123 });

      evidence.recordStage('academic-quality-helper-smoke', 'passed', 'Generated academic routes, evidence, and env guards.');
      evidence.recordId('workspaceId', env.workspaceId);
      evidence.recordId('workspaceMaterialsUrl', materialsUrl);
      evidence.recordId('workspaceStudentUrl', studentUrl);
      const summaryPath = await evidence.writeSummary();

      expect(materialsUrl).toContain('/local/hubredirect/workspace_materials.php');
      expect(studentUrl).toContain('/local/hubredirect/workspace_student.php');
      expect(summaryPath).toContain('academic-quality-summary.json');
    });
  });

  test.describe('course content visibility live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableAcademicContentVisibility,
      'Set EDUPLATFORM_ENABLE_ACADEMIC_CONTENT_VISIBILITY=true to create materials and verify student/teacher content visibility.',
    );

    test('verifies assigned course materials are visible to the correct student and teacher while restricted or archived content stays hidden', async ({ page }, testInfo) => {
      test.setTimeout(360_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = academicRunId();
      const evidence = academicEvidence(testInfo, runId);
      const courseKey = env.testCourseKey || 'pre_quraan';
      const data = buildStudentJourneyData(runId);

      const offering = await createAcademicOffering(page, runId);
      evidence.recordStage('academic-phase-1-course-offering-created', 'passed', offering.statusText);
      evidence.recordId('academicOfferingId', offering.offeringId || '');
      evidence.recordId('academicOfferingTitle', offering.title);

      const student = await createStudentFixture(page, data);
      evidence.recordStage('academic-phase-1-student-created', 'passed', `Student ${student.studentUserId}.`);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('studentUsername', student.studentUsername);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('academic-phase-1-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const materials = new WorkspaceMaterialsPage(page, env);
      const studentVisibleTitle = `SQA Visible Lesson ${runId}`;
      const teacherRestrictedTitle = `SQA Teacher Resource ${runId}`;
      const archivedTitle = `SQA Archived Draft ${runId}`;

      const studentMaterial = await materials.addMaterial({
        title: studentVisibleTitle,
        materialType: 'link',
        courseKey,
        sourceUrl: 'https://eduplatform.ai/',
        description: `Visible SQA lesson resource for ${runId}.`,
        visibility: 'students',
      });
      const teacherMaterial = await materials.addMaterial({
        title: teacherRestrictedTitle,
        materialType: 'document',
        courseKey,
        sourceUrl: 'https://eduplatform.ai/',
        description: `Teacher-only SQA resource for ${runId}.`,
        visibility: 'teachers',
      });
      const archivedMaterial = await materials.addMaterial({
        title: archivedTitle,
        materialType: 'link',
        courseKey,
        sourceUrl: 'https://eduplatform.ai/',
        description: `Archived unpublished SQA resource for ${runId}.`,
        visibility: 'workspace',
      });

      evidence.recordStage('academic-phase-1-materials-created', 'passed', `${studentMaterial.materialId}, ${teacherMaterial.materialId}, ${archivedMaterial.materialId}`);
      evidence.recordId('studentVisibleMaterialId', studentMaterial.materialId);
      evidence.recordId('teacherRestrictedMaterialId', teacherMaterial.materialId);
      evidence.recordId('archivedMaterialId', archivedMaterial.materialId);

      const studentAssignment = await materials.assignMaterial({
        title: studentVisibleTitle,
        targetType: 'student',
        targetUserId: student.studentUserId,
      });
      const teacherAssignment = await materials.assignMaterial({
        title: teacherRestrictedTitle,
        targetType: 'teacher',
        targetUserId: teacher.teacherUserId,
      });
      await materials.assignMaterial({
        title: archivedTitle,
        targetType: 'student',
        targetUserId: student.studentUserId,
      });
      await materials.archiveMaterial(archivedTitle);
      evidence.recordStage('academic-phase-1-materials-assigned-and-draft-archived', 'passed', `${studentAssignment.target}; ${teacherAssignment.target}`);
      await evidence.screenshot(page, 'academic-phase-1-admin-materials');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword || env.studentPassword,
      });
      const studentPage = new WorkspaceStudentPage(page, env);
      await studentPage.expectMaterialVisibility({
        studentUserId: student.studentUserId,
        visibleTitles: [studentVisibleTitle],
        hiddenTitles: [teacherRestrictedTitle, archivedTitle],
      });
      evidence.recordStage('academic-phase-1-student-content-visibility-verified', 'passed', studentVisibleTitle);
      await evidence.screenshot(page, 'academic-phase-1-student-materials');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: teacher.teacherPassword || env.teacherPassword,
      });
      await materials.expectTeacherMaterialVisibility({
        visibleTitles: [studentVisibleTitle, teacherRestrictedTitle],
        hiddenTitles: [archivedTitle],
      });
      evidence.recordStage('academic-phase-1-teacher-content-visibility-verified', 'passed', teacherRestrictedTitle);
      await evidence.screenshot(page, 'academic-phase-1-teacher-materials');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      if (env.cleanupMode === 'archive') {
        await materials.archiveMaterial(studentVisibleTitle);
        await materials.archiveMaterial(teacherRestrictedTitle);
        const courseOps = new CourseOfferingPage(page, env);
        await courseOps.archiveOffering(offering.title);
        evidence.recordCleanupAction({
          target: 'academic-materials',
          identifier: `${studentMaterial.materialId},${teacherMaterial.materialId},${archivedMaterial.materialId}`,
          mode: env.cleanupMode,
          status: 'completed',
          note: 'Generated academic content visibility materials were archived.',
        });
        evidence.recordCleanupAction({
          target: 'academic-course-offering',
          identifier: offering.offeringId || offering.title,
          mode: env.cleanupMode,
          status: 'completed',
          note: 'Generated academic visibility course offering was archived.',
        });
      } else {
        evidence.recordCleanupAction({
          target: 'academic-materials',
          identifier: `${studentMaterial.materialId},${teacherMaterial.materialId},${archivedMaterial.materialId}`,
          mode: env.cleanupMode,
          status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
          note: env.cleanupMode === 'delete'
            ? 'Delete cleanup is blocked; use archive mode for generated academic visibility records.'
            : 'Academic visibility cleanup skipped because EDUPLATFORM_CLEANUP_MODE=none.',
        });
      }

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('academic-phase-1-logout', 'passed');
      await evidence.attachJson('academic-phase-1-content-visibility-result', {
        offering,
        studentMaterial,
        teacherMaterial,
        archivedMaterial,
        studentAssignment,
        teacherAssignment,
      });
      await evidence.writeSummary();
    });
  });

  test.describe('assignment resource lifecycle live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableAcademicResourceLifecycle,
      'Set EDUPLATFORM_ENABLE_ACADEMIC_RESOURCE_LIFECYCLE=true to create, complete, review, and verify an academic resource assignment.',
    );

    test('publishes a resource assignment, student completes it, academic review is recorded, and parent/admin evidence reflects reviewed status', async ({ page }, testInfo) => {
      test.setTimeout(360_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = academicRunId().replace('academic-content', 'academic-lifecycle');
      const evidence = academicEvidence(testInfo, runId);
      const courseKey = env.testCourseKey || 'pre_quraan';
      const data = buildStudentJourneyData(runId);

      const offering = await createAcademicOffering(page, runId);
      evidence.recordStage('academic-phase-2-course-offering-created', 'passed', offering.statusText);
      evidence.recordId('academicOfferingId', offering.offeringId || '');
      evidence.recordId('academicOfferingTitle', offering.title);

      const student = await createStudentFixture(page, data);
      student.parentUsername = student.parentUsername || data.guardian.email.replace(/[^a-z0-9._-]+/gi, '.').toLowerCase();
      evidence.recordStage('academic-phase-2-student-created', 'passed', `Student ${student.studentUserId}.`);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('studentUsername', student.studentUsername);
      evidence.recordId('parentUsername', student.parentUsername || '');

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('academic-phase-2-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const materials = new WorkspaceMaterialsPage(page, env);
      const assignmentTitle = `SQA Lifecycle Resource ${runId}`;
      const material = await materials.addMaterial({
        title: assignmentTitle,
        materialType: 'homework',
        courseKey,
        sourceUrl: 'https://eduplatform.ai/',
        description: `SQA assignment/resource lifecycle evidence for ${runId}.`,
        visibility: 'students',
      });
      const assignment = await materials.assignMaterial({
        title: assignmentTitle,
        targetType: 'student',
        targetUserId: student.studentUserId,
      });
      evidence.recordStage('academic-phase-2-resource-published-assigned', 'passed', `${material.materialId}; ${assignment.target}`);
      evidence.recordId('academicLifecycleMaterialId', material.materialId);
      evidence.recordId('academicLifecycleAssignmentId', assignment.assignmentId);
      await evidence.screenshot(page, 'academic-phase-2-admin-assignment-published');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword || env.studentPassword,
      });
      const studentPage = new WorkspaceStudentPage(page, env);
      const completed = await studentPage.completeMaterial({
        studentUserId: student.studentUserId,
        title: assignmentTitle,
      });
      evidence.recordStage('academic-phase-2-student-completed-resource', 'passed', completed.pageText);
      await evidence.screenshot(page, 'academic-phase-2-student-completed-resource');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: teacher.teacherPassword || env.teacherPassword,
      });
      const teacherStatus = await materials.expectAssignmentStatus(assignmentTitle, /completed/i);
      evidence.recordStage('academic-phase-2-teacher-sees-completed-resource', 'passed', teacherStatus.pageText);
      await evidence.screenshot(page, 'academic-phase-2-teacher-completed-visible');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const reviewed = await materials.reviewAssignment(
        assignmentTitle,
        `Reviewed by SQA academic lifecycle automation ${runId}.`,
      );
      evidence.recordStage('academic-phase-2-academic-review-recorded', 'passed', reviewed.pageText);
      await evidence.screenshot(page, 'academic-phase-2-admin-reviewed-resource');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.parentUsername || data.guardian.email.replace(/[^a-z0-9._-]+/gi, '.').toLowerCase(),
        password: student.parentPassword || env.studentPassword,
      });
      const parentWorkspace = new AcademicParentWorkspacePage(page, env);
      const parentEvidence = await parentWorkspace.expectMaterialStatus({
        childUserId: student.studentUserId,
        title: assignmentTitle,
        status: /reviewed/i,
      });
      evidence.recordStage('academic-phase-2-parent-reviewed-evidence-verified', 'passed', parentEvidence.pageText);
      await evidence.screenshot(page, 'academic-phase-2-parent-reviewed-resource');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const adminReviewed = await materials.expectAssignmentStatus(assignmentTitle, /reviewed/i);
      evidence.recordStage('academic-phase-2-admin-reviewed-evidence-verified', 'passed', adminReviewed.pageText);

      if (env.cleanupMode === 'archive') {
        await materials.archiveMaterial(assignmentTitle);
        const courseOps = new CourseOfferingPage(page, env);
        await courseOps.archiveOffering(offering.title);
        evidence.recordCleanupAction({
          target: 'academic-lifecycle-material',
          identifier: material.materialId,
          mode: env.cleanupMode,
          status: 'completed',
          note: 'Generated academic lifecycle resource was archived.',
        });
        evidence.recordCleanupAction({
          target: 'academic-lifecycle-course-offering',
          identifier: offering.offeringId || offering.title,
          mode: env.cleanupMode,
          status: 'completed',
          note: 'Generated academic lifecycle course offering was archived.',
        });
      } else {
        evidence.recordCleanupAction({
          target: 'academic-lifecycle-material',
          identifier: material.materialId,
          mode: env.cleanupMode,
          status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
          note: env.cleanupMode === 'delete'
            ? 'Delete cleanup is blocked; use archive mode for generated academic lifecycle records.'
            : 'Academic lifecycle cleanup skipped because EDUPLATFORM_CLEANUP_MODE=none.',
        });
      }

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('academic-phase-2-logout', 'passed');
      await evidence.attachJson('academic-phase-2-resource-lifecycle-result', {
        offering,
        material,
        assignment,
        completed,
        teacherStatus,
        reviewed,
        parentEvidence,
        adminReviewed,
      });
      await evidence.writeSummary();
    });
  });

  test.describe('gradebook consistency live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableAcademicGradebookConsistency,
      'Set EDUPLATFORM_ENABLE_ACADEMIC_GRADEBOOK_CONSISTENCY=true to publish a grade and verify teacher, student, parent, and transcript consistency.',
    );

    test('verifies assignment grade appears in teacher, student, parent, and admin transcript gradebook surfaces', async ({ page }, testInfo) => {
      test.setTimeout(360_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = academicRunId().replace('academic-content', 'academic-gradebook');
      const evidence = academicEvidence(testInfo, runId);
      const data = buildStudentJourneyData(runId);

      const offering = await createAcademicOffering(page, runId);
      evidence.recordStage('academic-phase-3-course-offering-created', 'passed', offering.statusText);
      evidence.recordId('academicGradebookOfferingId', offering.offeringId || '');
      evidence.recordId('academicGradebookOfferingTitle', offering.title);

      const student = await createStudentFixture(page, data);
      student.parentUsername = student.parentUsername || data.guardian.email.replace(/[^a-z0-9._-]+/gi, '.').toLowerCase();
      evidence.recordStage('academic-phase-3-student-created', 'passed', `Student ${student.studentUserId}.`);
      evidence.recordId('studentUserId', student.studentUserId);
      evidence.recordId('studentUsername', student.studentUsername);
      evidence.recordId('parentUsername', student.parentUsername || '');

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('academic-phase-3-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword || env.studentPassword,
      });
      const catalog = new CourseCatalogPage(page, env);
      await catalog.goto();
      const enrollmentRequest = await catalog.requestEnrollmentForOffering(student, offering.title);
      evidence.recordStage('academic-phase-3-enrollment-requested', 'passed', enrollmentRequest.requestStatusText);

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const enrollmentAdmin = new CourseOfferingAdminPage(page, env);
      await enrollmentAdmin.gotoPendingForStudent(student);
      const enrollmentApproval = await enrollmentAdmin.approveEnrollment(student);
      evidence.recordStage('academic-phase-3-enrollment-approved', 'passed', enrollmentApproval.statusText);
      evidence.recordId('academicGradebookEnrollmentRequestId', enrollmentApproval.requestId);

      const gradebook = new GradebookAssessmentPage(page, env);
      await gradebook.goto();
      const grade = await gradebook.createAssessmentGradeAndPublish({
        student,
        studentEmail: data.student.email,
        offeringTitle: enrollmentRequest.offeringTitle,
        runId,
        assessmentType: 'assignment',
        assessmentTitlePrefix: 'Automated SQA Gradebook Consistency',
        assessmentDescription: `Automated SQA gradebook consistency assignment for ${runId}.`,
      });
      evidence.recordStage('academic-phase-3-admin-grade-published', 'passed', grade.courseGradeText);
      evidence.recordId('academicGradebookAssessmentTitle', grade.assessmentTitle);
      evidence.recordId('academicGradebookScorePercent', grade.scorePercent);
      evidence.recordId('academicGradebookOffering', grade.selectedOfferingLabel);
      await evidence.screenshot(page, 'academic-phase-3-admin-grade-published');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: teacher.teacherPassword || env.teacherPassword,
      });
      const teacherGradeText = await gradebook.expectPublishedGradeVisible({
        studentEmail: data.student.email,
        scorePercent: grade.scorePercent,
      });
      evidence.recordStage('academic-phase-3-teacher-grade-visible', 'passed', teacherGradeText);
      await evidence.screenshot(page, 'academic-phase-3-teacher-grade-visible');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.studentUsername,
        password: student.studentPassword || env.studentPassword,
      });
      const portal = new AcademicStudentParentPortalPage(page, env);
      const studentPortalGrade = await portal.expectPublishedGradeVisible({
        studentUserId: student.studentUserId,
        scorePercent: grade.scorePercent,
      });
      evidence.recordStage('academic-phase-3-student-grade-visible', 'passed', studentPortalGrade.pageText);
      await evidence.screenshot(page, 'academic-phase-3-student-grade-visible');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: student.parentUsername || data.guardian.email.replace(/[^a-z0-9._-]+/gi, '.').toLowerCase(),
        password: student.parentPassword || env.studentPassword,
      });
      const parentPortalGrade = await portal.expectPublishedGradeVisible({
        studentUserId: student.studentUserId,
        scorePercent: grade.scorePercent,
      });
      evidence.recordStage('academic-phase-3-parent-grade-visible', 'passed', parentPortalGrade.pageText);
      await evidence.screenshot(page, 'academic-phase-3-parent-grade-visible');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const transcript = new TranscriptUiPage(page, env);
      const transcriptPreview = await transcript.preview(student, enrollmentRequest.offeringTitle, grade.scorePercent);
      evidence.recordStage('academic-phase-3-admin-transcript-grade-consistent', 'passed', transcriptPreview.targetLineText);
      await evidence.screenshot(page, 'academic-phase-3-admin-transcript-grade-consistent');

      const adminGradeText = await gradebook.expectPublishedGradeVisible({
        studentEmail: data.student.email,
        scorePercent: grade.scorePercent,
        offeringTitle: grade.selectedOfferingLabel,
      });
      evidence.recordStage('academic-phase-3-admin-gradebook-consistent', 'passed', adminGradeText);

      if (env.cleanupMode === 'archive') {
        const courseOps = new CourseOfferingPage(page, env);
        await courseOps.archiveOffering(offering.title);
        evidence.recordCleanupAction({
          target: 'academic-gradebook-course-offering',
          identifier: offering.offeringId || offering.title,
          mode: env.cleanupMode,
          status: 'completed',
          note: 'Generated academic gradebook consistency course offering was archived.',
        });
      } else {
        evidence.recordCleanupAction({
          target: 'academic-gradebook-course-offering',
          identifier: offering.offeringId || offering.title,
          mode: env.cleanupMode,
          status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
          note: env.cleanupMode === 'delete'
            ? 'Delete cleanup is blocked; use archive mode for generated academic gradebook records.'
            : 'Academic gradebook cleanup skipped because EDUPLATFORM_CLEANUP_MODE=none.',
        });
      }

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('academic-phase-3-logout', 'passed');
      await evidence.attachJson('academic-phase-3-gradebook-consistency-result', {
        offering,
        studentUserId: student.studentUserId,
        studentUsername: student.studentUsername,
        parentUsername: student.parentUsername,
        teacherUserId: teacher.teacherUserId,
        teacherUsername: teacher.teacherUsername,
        enrollmentRequest,
        enrollmentApproval,
        grade,
        teacherGradeText,
        studentPortalGrade,
        parentPortalGrade,
        transcriptPreview,
        adminGradeText,
      });
      await evidence.writeSummary();

      expect(teacherGradeText).toContain(`${grade.scorePercent}%`);
      expect(studentPortalGrade.pageText).toContain(`${grade.scorePercent}%`);
      expect(parentPortalGrade.pageText).toContain(`${grade.scorePercent}%`);
      expect(transcriptPreview.targetLineText).toContain(grade.scorePercent);
    });
  });

  test.describe('attendance and progress audit live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableAcademicAttendanceProgressAudit,
      'Set EDUPLATFORM_ENABLE_ACADEMIC_ATTENDANCE_PROGRESS_AUDIT=true to record teacher attendance/progress and verify admin, student, and parent visibility.',
    );

    test('verifies teacher-recorded attendance and progress in admin audit, student, and parent views', async ({ page }, testInfo) => {
      test.setTimeout(360_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = academicRunId().replace('academic-content', 'academic-attendance');
      const evidence = academicEvidence(testInfo, runId);

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('academic-phase-4-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixturePage = new TeacherPortalFixturePage(page, env);
      const fixture = await fixturePage.create({
        runId,
        teacherUserId: teacher.teacherUserId,
      });
      if (!fixture.parentid || !fixture.parentusername) {
        throw new Error(
          [
            'Teacher portal fixture did not return a linked parent account.',
            `Received: ${JSON.stringify(fixture)}`,
            'Upload the current src/moodle/local_hubredirect/sqa_teacher_portal_fixture.php to local/hubredirect/sqa_teacher_portal_fixture.php, then rerun academic-phase4.',
          ].join('\n'),
        );
      }
      evidence.recordStage('academic-phase-4-fixture-created', 'passed', `Student ${fixture.studentid}; parent ${fixture.parentid}.`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);
      evidence.recordId('studentEmail', fixture.studentemail);
      evidence.recordId('parentUserId', String(fixture.parentid));
      evidence.recordId('parentUsername', fixture.parentusername);
      evidence.recordId('parentEmail', fixture.parentemail || '');
      await evidence.screenshot(page, 'academic-phase-4-fixture-created');

      await logoutFromEduPlatform(page, env);
      const teacherPortalUrl = buildEduPlatformUrl(env, HUB_ROUTES.teacherPortal);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: env.teacherPassword,
      }, {
        loginUrl: consumerLoginUrl(env, teacherPortalUrl),
      });
      await expectLoggedInToEduPlatform(page, teacher.teacherUsername);
      const teacherPortal = new TeacherPortalPage(page, env);
      await teacherPortal.goto();
      await teacherPortal.expectReady(fixture);
      await teacherPortal.saveAttendance(runId, fixture);
      await teacherPortal.saveNotesAndHomework(runId, fixture);
      await teacherPortal.saveProgress(runId, fixture);
      evidence.recordStage('academic-phase-4-teacher-attendance-progress-recorded', 'passed', `Session ${fixture.sessionid}; student ${fixture.studentid}.`);
      await evidence.screenshot(page, 'academic-phase-4-teacher-progress-saved');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const attendanceOps = new AttendanceOperationsPage(page, env);
      const attendanceAudit = await attendanceOps.expectAttendanceAuditVisible({
        studentEmail: fixture.studentemail,
        runId,
      });
      evidence.recordStage('academic-phase-4-admin-attendance-audit-visible', 'passed', attendanceAudit.finalUrl);
      await evidence.screenshot(page, 'academic-phase-4-admin-attendance-audit');

      const workspaceReports = new WorkspaceReportsPage(page, env);
      const reportAudit = await workspaceReports.expectAttendanceProgressAudit({
        studentUserId: String(fixture.studentid),
        studentEmail: fixture.studentemail,
        runId,
      });
      evidence.recordStage('academic-phase-4-admin-progress-report-visible', 'passed', reportAudit.finalUrl);
      await evidence.screenshot(page, 'academic-phase-4-admin-progress-report');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: fixture.studentusername,
        password: env.studentPassword,
      });
      const studentPage = new WorkspaceStudentPage(page, env);
      const studentEvidence = await studentPage.expectAttendanceAndProgressVisible({
        studentUserId: String(fixture.studentid),
        runId,
      });
      evidence.recordStage('academic-phase-4-student-attendance-progress-visible', 'passed', studentEvidence.finalUrl);
      await evidence.screenshot(page, 'academic-phase-4-student-progress-visible');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, {
        username: fixture.parentusername,
        password: env.studentPassword,
      });
      const parentWorkspace = new AcademicParentWorkspacePage(page, env);
      const parentEvidence = await parentWorkspace.expectAttendanceAndProgressVisible({
        childUserId: String(fixture.studentid),
        runId,
      });
      evidence.recordStage('academic-phase-4-parent-attendance-progress-visible', 'passed', parentEvidence.finalUrl);
      await evidence.screenshot(page, 'academic-phase-4-parent-progress-visible');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      if (env.cleanupMode === 'archive') {
        const archived = await fixturePage.archive({
          runId,
          teacherUserId: teacher.teacherUserId,
          fixture,
        });
        evidence.recordCleanupAction({
          target: 'academic-attendance-progress-fixture',
          identifier: `${fixture.studentid}/${fixture.sessionid}/${fixture.parentid}`,
          mode: env.cleanupMode,
          status: 'completed',
          note: `Teacher portal attendance/progress fixture archived: ${JSON.stringify(archived.counts)}.`,
        });
      } else {
        evidence.recordCleanupAction({
          target: 'academic-attendance-progress-fixture',
          identifier: `${fixture.studentid}/${fixture.sessionid}/${fixture.parentid}`,
          mode: env.cleanupMode,
          status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
          note: env.cleanupMode === 'delete'
            ? 'Delete cleanup is blocked; use archive mode for generated attendance/progress records.'
            : 'Attendance/progress cleanup skipped because EDUPLATFORM_CLEANUP_MODE=none.',
        });
      }

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('academic-phase-4-logout', 'passed');
      await evidence.attachJson('academic-phase-4-attendance-progress-audit-result', {
        teacher,
        fixture,
        attendanceAudit,
        reportAudit,
        studentEvidence,
        parentEvidence,
      });
      await evidence.writeSummary();

      expect(attendanceAudit.pageText).toContain(fixture.studentemail);
      expect(reportAudit.pageText).toContain(fixture.studentemail);
      expect(studentEvidence.pageText).toContain(`Parent-visible SQA progress summary for ${runId}.`);
      expect(parentEvidence.pageText).toContain(`Parent-visible SQA progress summary for ${runId}.`);
    });
  });

  test.describe('academic quality controls live action', () => {
    test.skip(
      !getEduPlatformEnv({ allowPartial: true }).enableAcademicQualityControls,
      'Set EDUPLATFORM_ENABLE_ACADEMIC_QUALITY_CONTROLS=true to verify missing-grade, attendance, low-score, progress-alert, and export controls.',
    );

    test('detects missing grades, incomplete attendance, low-score/progress alerts, and exports report evidence', async ({ page }, testInfo) => {
      test.setTimeout(360_000);

      const env = getEduPlatformEnv({ allowPartial: true });
      assertEduPlatformEnv(env);

      const runId = academicRunId().replace('academic-content', 'academic-controls');
      const evidence = academicEvidence(testInfo, runId);
      const lowScorePercent = '62';
      const alertStatus = 'needs_support';

      const teacher = await createTeacherFixture(page, runId);
      evidence.recordStage('academic-phase-5-teacher-created', 'passed', `Teacher ${teacher.teacherUserId}.`);
      evidence.recordId('teacherUserId', teacher.teacherUserId);
      evidence.recordId('teacherUsername', teacher.teacherUsername);

      const fixturePage = new TeacherPortalFixturePage(page, env);
      const fixture = await fixturePage.create({
        runId,
        teacherUserId: teacher.teacherUserId,
      });
      evidence.recordStage('academic-phase-5-fixture-created', 'passed', `Student ${fixture.studentid}; assessment ${fixture.assessmentid}; session ${fixture.sessionid}.`);
      evidence.recordId('studentUserId', String(fixture.studentid));
      evidence.recordId('studentUsername', fixture.studentusername);
      evidence.recordId('studentEmail', fixture.studentemail);
      evidence.recordId('assessmentId', String(fixture.assessmentid));
      evidence.recordId('sessionId', String(fixture.sessionid));
      await evidence.screenshot(page, 'academic-phase-5-fixture-created');

      const controls = new AcademicQualityControlsPage(page, env);
      const missingGrade = await controls.expectMissingGrade(fixture.studentemail);
      evidence.recordStage('academic-phase-5-missing-grade-detected', 'passed', missingGrade.pageText);
      const incompleteAttendance = await controls.expectIncompleteAttendance(fixture.studentemail);
      evidence.recordStage('academic-phase-5-incomplete-attendance-detected', 'passed', incompleteAttendance.pageText);
      await evidence.screenshot(page, 'academic-phase-5-initial-controls');

      await logoutFromEduPlatform(page, env);
      const teacherPortalUrl = buildEduPlatformUrl(env, HUB_ROUTES.teacherPortal);
      await loginToEduPlatform(page, env, {
        username: teacher.teacherUsername,
        password: env.teacherPassword,
      }, {
        loginUrl: consumerLoginUrl(env, teacherPortalUrl),
      });
      await expectLoggedInToEduPlatform(page, teacher.teacherUsername);
      const teacherPortal = new TeacherPortalPage(page, env);
      await teacherPortal.goto();
      await teacherPortal.expectReady(fixture);
      await teacherPortal.saveGrade(runId, fixture, {
        scorePercent: lowScorePercent,
        letterGrade: 'D',
        status: 'published',
        feedback: `SQA quality controls low-score evidence for ${runId}.`,
      });
      await teacherPortal.saveProgress(runId, fixture, {
        advancementStatus: alertStatus,
        recommendationReason: `SQA quality controls follow-up required for ${runId}.`,
        teacherComment: `SQA quality controls low-progress alert for ${runId}.`,
      });
      evidence.recordStage('academic-phase-5-low-score-progress-recorded', 'passed', `${lowScorePercent}% ${alertStatus}`);
      await evidence.screenshot(page, 'academic-phase-5-low-score-progress-saved');

      await logoutFromEduPlatform(page, env);
      await loginToEduPlatform(page, env, adminCredentials(env));
      const alerts = await controls.expectLowScoreAndProgressAlert({
        studentEmail: fixture.studentemail,
        scorePercent: lowScorePercent,
        progressStatus: alertStatus,
      });
      evidence.recordStage('academic-phase-5-low-score-progress-alerts-visible', 'passed', alerts.pageText);
      await evidence.screenshot(page, 'academic-phase-5-alert-controls');

      const exportCsv = await controls.downloadControlsCsv();
      evidence.recordStage('academic-phase-5-controls-export-downloaded', 'passed', exportCsv.suggestedFilename);

      if (env.cleanupMode === 'archive') {
        const archived = await fixturePage.archive({
          runId,
          teacherUserId: teacher.teacherUserId,
          fixture,
        });
        evidence.recordCleanupAction({
          target: 'academic-quality-controls-fixture',
          identifier: `${fixture.studentid}/${fixture.sessionid}/${fixture.assessmentid}`,
          mode: env.cleanupMode,
          status: 'completed',
          note: `Academic quality controls fixture archived: ${JSON.stringify(archived.counts)}.`,
        });
      } else {
        evidence.recordCleanupAction({
          target: 'academic-quality-controls-fixture',
          identifier: `${fixture.studentid}/${fixture.sessionid}/${fixture.assessmentid}`,
          mode: env.cleanupMode,
          status: env.cleanupMode === 'delete' ? 'blocked' : 'skipped',
          note: env.cleanupMode === 'delete'
            ? 'Delete cleanup is blocked; use archive mode for generated academic controls records.'
            : 'Academic quality controls cleanup skipped because EDUPLATFORM_CLEANUP_MODE=none.',
        });
      }

      await logoutFromEduPlatform(page, env);
      evidence.recordStage('academic-phase-5-logout', 'passed');
      await evidence.attachJson('academic-phase-5-quality-controls-result', {
        teacher,
        fixture,
        missingGrade,
        incompleteAttendance,
        alerts,
        exportCsv,
      });
      await evidence.writeSummary();

      expect(missingGrade.pageText).toContain(fixture.studentemail);
      expect(incompleteAttendance.pageText).toContain(fixture.studentemail);
      expect(alerts.pageText).toContain(fixture.studentemail);
      expect(exportCsv.suggestedFilename).toMatch(/academic-quality-controls.*\.csv$/i);
    });
  });

  test.describe('academic quality negative controls', () => {
    test('keeps academic content visibility live actions disabled unless explicitly truthy', async () => {
      await withAcademicEnv({
        EDUPLATFORM_BASE_URL: 'https://safe-stage.example.test',
        EDUPLATFORM_WORKSPACE_ID: '3',
        EDUPLATFORM_CONSUMER: 'huda-school',
        EDUPLATFORM_ADMIN_USERNAME: 'admin',
        EDUPLATFORM_ADMIN_PASSWORD: 'secret',
        EDUPLATFORM_STUDENT_PASSWORD: 'Mock@001!',
        EDUPLATFORM_TEST_COURSE_KEY: 'pre_quraan',
        EDUPLATFORM_ENABLE_ACADEMIC_CONTENT_VISIBILITY: 'false',
        EDUPLATFORM_ENABLE_ACADEMIC_RESOURCE_LIFECYCLE: 'false',
        EDUPLATFORM_ENABLE_ACADEMIC_GRADEBOOK_CONSISTENCY: 'false',
        EDUPLATFORM_ENABLE_ACADEMIC_ATTENDANCE_PROGRESS_AUDIT: 'false',
        EDUPLATFORM_ENABLE_ACADEMIC_QUALITY_CONTROLS: 'false',
      }, async () => {
        expect(getEduPlatformEnv({ allowPartial: true }).enableAcademicContentVisibility).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableAcademicResourceLifecycle).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableAcademicGradebookConsistency).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableAcademicAttendanceProgressAudit).toBe(false);
        expect(getEduPlatformEnv({ allowPartial: true }).enableAcademicQualityControls).toBe(false);
      });
    });
  });
});
