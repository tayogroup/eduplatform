export type PaymentMode = 'manual' | 'hosted-sandbox';
export type CleanupMode = 'archive' | 'delete' | 'none';
export type CompletionMode = 'skip-step' | 'unit-state' | 'moodle-completion' | 'sql-fixture';

export interface EduPlatformEnv {
  baseUrl: string;
  workspaceId: string;
  consumer: string;
  adminUsername: string;
  adminPassword: string;
  studentPassword: string;
  teacherPassword: string;
  testOfferingId: string;
  testCourseKey: string;
  publicCourseTitle: string;
  publicCourseLinkMode: 'create_new' | 'existing';
  publicCourseMoodleCourseId: string;
  publicCourseCapacity: string;
  publicCourseTuitionAmount: string;
  publicCourseCurrency: string;
  publicCourseStartDate: string;
  publicCourseEndDate: string;
  invoiceLineAmount: string;
  completionScorePercent: string;
  paymentMode: PaymentMode;
  cleanupMode: CleanupMode;
  completionMode: CompletionMode;
  allowProductionE2E: boolean;
  enablePublicIntakeSubmit: boolean;
  enablePublicCourseCreate: boolean;
  enableAdmissionsStudentCreate: boolean;
  enableCourseEnrollment: boolean;
  enableInvoiceCreate: boolean;
  enableClassCompletion: boolean;
  enableTranscriptIssue: boolean;
  enablePaymentReceipt: boolean;
  enableFullStudentJourney: boolean;
  enableTeacherIntakeSubmit: boolean;
  enableTeacherOnboarding: boolean;
  enableFullTeacherJourney: boolean;
  enableTeacherPortalOps: boolean;
  wsToken: string;
}

interface EnvOptions {
  allowPartial?: boolean;
}

const REQUIRED_KEYS = [
  'EDUPLATFORM_BASE_URL',
  'EDUPLATFORM_WORKSPACE_ID',
  'EDUPLATFORM_CONSUMER',
  'EDUPLATFORM_ADMIN_USERNAME',
  'EDUPLATFORM_ADMIN_PASSWORD',
  'EDUPLATFORM_STUDENT_PASSWORD',
] as const;

const PRODUCTION_HOST_PATTERNS = [
  /(^|\.)eduplatform\.(com|org)$/i,
  /(^|\.)edufortomorrow\.(com|org)$/i,
  /(^|\.)ehelacademy\.com$/i,
  /(^|\.)quraanacademy\.com$/i,
  /quraanacademy\.b-cdn\.net$/i,
  /ehelacademy\.b-cdn\.net$/i,
];

function readEnv(key: string): string {
  return (process.env[key] || '').trim();
}

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function isTruthy(value: string): boolean {
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function isProductionLikeUrl(rawUrl: string): boolean {
  if (!rawUrl) {
    return false;
  }
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return false;
  }
  return PRODUCTION_HOST_PATTERNS.some((pattern) => pattern.test(host));
}

export function getEduPlatformEnv(options: EnvOptions = {}): EduPlatformEnv {
  const env: EduPlatformEnv = {
    baseUrl: readEnv('EDUPLATFORM_BASE_URL'),
    workspaceId: readEnv('EDUPLATFORM_WORKSPACE_ID'),
    consumer: readEnv('EDUPLATFORM_CONSUMER'),
    adminUsername: readEnv('EDUPLATFORM_ADMIN_USERNAME'),
    adminPassword: readEnv('EDUPLATFORM_ADMIN_PASSWORD'),
    studentPassword: readEnv('EDUPLATFORM_STUDENT_PASSWORD'),
    teacherPassword: readEnv('EDUPLATFORM_TEACHER_PASSWORD') || readEnv('EDUPLATFORM_STUDENT_PASSWORD'),
    testOfferingId: readEnv('EDUPLATFORM_TEST_OFFERING_ID'),
    testCourseKey: readEnv('EDUPLATFORM_TEST_COURSE_KEY'),
    publicCourseTitle: readEnv('EDUPLATFORM_PUBLIC_COURSE_TITLE'),
    publicCourseLinkMode: oneOf(readEnv('EDUPLATFORM_PUBLIC_COURSE_LINK_MODE'), ['create_new', 'existing'], 'create_new'),
    publicCourseMoodleCourseId: readEnv('EDUPLATFORM_PUBLIC_COURSE_MOODLE_COURSE_ID'),
    publicCourseCapacity: readEnv('EDUPLATFORM_PUBLIC_COURSE_CAPACITY') || '12',
    publicCourseTuitionAmount: readEnv('EDUPLATFORM_PUBLIC_COURSE_TUITION_AMOUNT') || '0.00',
    publicCourseCurrency: readEnv('EDUPLATFORM_PUBLIC_COURSE_CURRENCY') || 'USD',
    publicCourseStartDate: readEnv('EDUPLATFORM_PUBLIC_COURSE_START_DATE'),
    publicCourseEndDate: readEnv('EDUPLATFORM_PUBLIC_COURSE_END_DATE'),
    invoiceLineAmount: readEnv('EDUPLATFORM_INVOICE_LINE_AMOUNT') || readEnv('EDUPLATFORM_PUBLIC_COURSE_TUITION_AMOUNT') || '0.00',
    completionScorePercent: readEnv('EDUPLATFORM_COMPLETION_SCORE_PERCENT') || '95',
    paymentMode: oneOf(readEnv('EDUPLATFORM_PAYMENT_MODE'), ['manual', 'hosted-sandbox'], 'manual'),
    cleanupMode: oneOf(readEnv('EDUPLATFORM_CLEANUP_MODE'), ['archive', 'delete', 'none'], 'archive'),
    completionMode: oneOf(
      readEnv('EDUPLATFORM_COMPLETION_MODE'),
      ['skip-step', 'unit-state', 'moodle-completion', 'sql-fixture'],
      'skip-step',
    ),
    allowProductionE2E: isTruthy(readEnv('EDUPLATFORM_ALLOW_PRODUCTION_E2E')),
    enablePublicIntakeSubmit: isTruthy(readEnv('EDUPLATFORM_ENABLE_PUBLIC_INTAKE_SUBMIT')),
    enablePublicCourseCreate: isTruthy(readEnv('EDUPLATFORM_ENABLE_PUBLIC_COURSE_CREATE')),
    enableAdmissionsStudentCreate: isTruthy(readEnv('EDUPLATFORM_ENABLE_ADMISSIONS_STUDENT_CREATE')),
    enableCourseEnrollment: isTruthy(readEnv('EDUPLATFORM_ENABLE_COURSE_ENROLLMENT')),
    enableInvoiceCreate: isTruthy(readEnv('EDUPLATFORM_ENABLE_INVOICE_CREATE')),
    enableClassCompletion: isTruthy(readEnv('EDUPLATFORM_ENABLE_CLASS_COMPLETION')),
    enableTranscriptIssue: isTruthy(readEnv('EDUPLATFORM_ENABLE_TRANSCRIPT_ISSUE')),
    enablePaymentReceipt: isTruthy(readEnv('EDUPLATFORM_ENABLE_PAYMENT_RECEIPT')),
    enableFullStudentJourney: isTruthy(readEnv('EDUPLATFORM_ENABLE_FULL_STUDENT_JOURNEY')),
    enableTeacherIntakeSubmit: isTruthy(readEnv('EDUPLATFORM_ENABLE_TEACHER_INTAKE_SUBMIT')),
    enableTeacherOnboarding: isTruthy(readEnv('EDUPLATFORM_ENABLE_TEACHER_ONBOARDING')),
    enableFullTeacherJourney: isTruthy(readEnv('EDUPLATFORM_ENABLE_FULL_TEACHER_JOURNEY')),
    enableTeacherPortalOps: isTruthy(readEnv('EDUPLATFORM_ENABLE_TEACHER_PORTAL_OPS')),
    wsToken: readEnv('EDUPLATFORM_WS_TOKEN'),
  };

  if (!options.allowPartial) {
    assertEduPlatformEnv(env);
  }

  return env;
}

export function assertEduPlatformEnv(env = getEduPlatformEnv({ allowPartial: true })): void {
  const missing: string[] = REQUIRED_KEYS.filter((key) => readEnv(key) === '');
  if (!env.testOfferingId && !env.testCourseKey) {
    missing.push('EDUPLATFORM_TEST_OFFERING_ID or EDUPLATFORM_TEST_COURSE_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      [
        'EduPlatform E2E configuration is incomplete.',
        `Missing: ${missing.join(', ')}`,
        'Set these values in your shell or CI secrets. See .env.e2e.example.',
      ].join('\n'),
    );
  }

  try {
    new URL(env.baseUrl);
  } catch {
    throw new Error(`EDUPLATFORM_BASE_URL must be a valid absolute URL. Received: ${env.baseUrl}`);
  }

  if (isProductionLikeUrl(env.baseUrl) && !env.allowProductionE2E) {
    throw new Error(
      [
        `Refusing to run EduPlatform E2E tests against production-like URL: ${env.baseUrl}`,
        'Set EDUPLATFORM_ALLOW_PRODUCTION_E2E=true only for an approved production-safe smoke.',
      ].join('\n'),
    );
  }
}

export function redactedEduPlatformEnv(env = getEduPlatformEnv({ allowPartial: true })): Record<string, string | boolean> {
  return {
    baseUrl: env.baseUrl,
    workspaceId: env.workspaceId,
    consumer: env.consumer,
    adminUsername: env.adminUsername,
    adminPassword: env.adminPassword ? '[redacted]' : '',
    studentPassword: env.studentPassword ? '[redacted]' : '',
    teacherPassword: env.teacherPassword ? '[redacted]' : '',
    testOfferingId: env.testOfferingId,
    testCourseKey: env.testCourseKey,
    publicCourseTitle: env.publicCourseTitle,
    publicCourseLinkMode: env.publicCourseLinkMode,
    publicCourseMoodleCourseId: env.publicCourseMoodleCourseId,
    publicCourseCapacity: env.publicCourseCapacity,
    publicCourseTuitionAmount: env.publicCourseTuitionAmount,
    publicCourseCurrency: env.publicCourseCurrency,
    publicCourseStartDate: env.publicCourseStartDate,
    publicCourseEndDate: env.publicCourseEndDate,
    invoiceLineAmount: env.invoiceLineAmount,
    completionScorePercent: env.completionScorePercent,
    paymentMode: env.paymentMode,
    cleanupMode: env.cleanupMode,
    completionMode: env.completionMode,
    allowProductionE2E: env.allowProductionE2E,
    enablePublicIntakeSubmit: env.enablePublicIntakeSubmit,
    enablePublicCourseCreate: env.enablePublicCourseCreate,
    enableAdmissionsStudentCreate: env.enableAdmissionsStudentCreate,
    enableCourseEnrollment: env.enableCourseEnrollment,
    enableInvoiceCreate: env.enableInvoiceCreate,
    enableClassCompletion: env.enableClassCompletion,
    enableTranscriptIssue: env.enableTranscriptIssue,
    enablePaymentReceipt: env.enablePaymentReceipt,
    enableFullStudentJourney: env.enableFullStudentJourney,
    enableTeacherIntakeSubmit: env.enableTeacherIntakeSubmit,
    enableTeacherOnboarding: env.enableTeacherOnboarding,
    enableFullTeacherJourney: env.enableFullTeacherJourney,
    enableTeacherPortalOps: env.enableTeacherPortalOps,
    wsToken: env.wsToken ? '[redacted]' : '',
  };
}
