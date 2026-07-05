import type { EduPlatformEnv } from './env';

export type RouteParams = Record<string, string | number | boolean | undefined | null>;

export const HUB_ROUTES = {
  publicIntake: '/local/hubredirect/public_intake.php',
  intakeRequests: '/local/hubredirect/intake_requests.php',
  admissions: '/local/hubredirect/admissions.php',
  studentIntake: '/local/hubredirect/student_intake.php',
  courseCatalog: '/local/hubredirect/course_catalog_browse.php',
  courseOfferings: '/local/hubredirect/course_offerings.php',
  invoices: '/local/hubredirect/invoices.php',
  invoiceDetail: '/local/hubredirect/invoice_detail.php',
  invoiceView: '/local/hubredirect/invoice_view.php',
  studentBilling: '/local/hubredirect/student_billing.php',
  parentBilling: '/local/hubredirect/parent_billing.php',
  parentWorkspace: '/local/hubredirect/workspace_parent.php',
  studentParentPortal: '/local/hubredirect/student_parent_portal.php',
  gradebookAssessment: '/local/hubredirect/gradebook_assessment.php',
  courseTranscript: '/local/hubredirect/course_transcript.php',
  officialTranscript: '/local/hubredirect/course_transcript_official.php',
  transcriptPolicy: '/local/hubredirect/transcript_policy.php',
  transcriptVerify: '/local/hubredirect/transcript_verify.php',
  publicTeacherIntake: '/local/hubredirect/public_teacher_intake.php',
  teacherIntakeRequests: '/local/hubredirect/teacher_intake_requests.php',
  teacherIntake: '/local/hubredirect/teacher_intake.php',
  teacherMarketplace: '/local/hubredirect/teacher_marketplace.php',
  teacherMarketplaceAdmin: '/local/hubredirect/teacher_marketplace_admin.php',
  teacherPortal: '/local/hubredirect/teacher_portal.php',
  sqaTeacherPortalFixture: '/local/hubredirect/sqa_teacher_portal_fixture.php',
} as const;

export function defaultWorkspaceParams(env: EduPlatformEnv): RouteParams {
  return {
    consumer: env.consumer,
    workspaceid: env.workspaceId,
  };
}

export function buildEduPlatformUrl(env: EduPlatformEnv, route: string, params: RouteParams = {}): string {
  const url = new URL(route, env.baseUrl.endsWith('/') ? env.baseUrl : `${env.baseUrl}/`);
  const merged = { ...defaultWorkspaceParams(env), ...params };

  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export function publicIntakeUrl(env: EduPlatformEnv): string {
  return buildEduPlatformUrl(env, HUB_ROUTES.publicIntake);
}

export function courseCatalogUrl(env: EduPlatformEnv): string {
  return buildEduPlatformUrl(env, HUB_ROUTES.courseCatalog);
}

export function publicTeacherIntakeUrl(env: EduPlatformEnv): string {
  return buildEduPlatformUrl(env, HUB_ROUTES.publicTeacherIntake);
}
