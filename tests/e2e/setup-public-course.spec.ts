import { expect, test } from '@playwright/test';
import { adminCredentials, loginToEduPlatform } from './helpers/auth';
import { CourseOfferingPage } from './helpers/course-offering';
import { assertEduPlatformEnv, getEduPlatformEnv, redactedEduPlatformEnv } from './helpers/env';
import { JourneyEvidence } from './helpers/evidence';
import { buildStudentJourneyData } from './helpers/student-data';

test.describe('EduPlatform public course setup', () => {
  test.skip(
    !getEduPlatformEnv({ allowPartial: true }).enablePublicCourseCreate,
    'Set EDUPLATFORM_ENABLE_PUBLIC_COURSE_CREATE=true to create a real published institution-public course offering.',
  );

  test('creates a published institution-public course offering', async ({ page }, testInfo) => {
    const env = getEduPlatformEnv({ allowPartial: true });
    assertEduPlatformEnv(env);

    const data = buildStudentJourneyData();
    const evidence = new JourneyEvidence(testInfo, data.runId, redactedEduPlatformEnv(env));

    await loginToEduPlatform(page, env, adminCredentials(env));

    const offerings = new CourseOfferingPage(page, env);
    await offerings.goto();
    await offerings.expectReady();
    await evidence.screenshot(page, 'course-offering-form-ready');

    const result = await offerings.createPublicOffering();
    evidence.recordStage('public-course-created', 'passed', result.title);
    evidence.recordId('publicCourseTitle', result.title);
    evidence.recordId('publicCourseKey', result.courseKey);
    await evidence.attachJson('public-course-result', result);
    await evidence.screenshot(page, 'public-course-created');
    await evidence.writeSummary();

    expect(result.statusText).toMatch(/published/i);
    expect(result.statusText).toMatch(/institution_public/i);
  });
});
