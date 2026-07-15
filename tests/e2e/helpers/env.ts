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
  enableFullTeacherGoldenPath: boolean;
  enableParentPortalVisibility: boolean;
  enableParentPaymentVisibility: boolean;
  enableAdminDashboardSmoke: boolean;
  enableAdmissionsOperations: boolean;
  enableCourseOfferingOperations: boolean;
  enableFinanceOperations: boolean;
  enableReportingAuditOperations: boolean;
  enableSupportCommunications: boolean;
  enableAcademicContentVisibility: boolean;
  enableAcademicResourceLifecycle: boolean;
  enableAcademicGradebookConsistency: boolean;
  enableAcademicAttendanceProgressAudit: boolean;
  enableAcademicQualityControls: boolean;
  enableSecurityAccessControl: boolean;
  enableNotificationsDelivery: boolean;
  enableDataExportCompliance: boolean;
  enableDataLifecycleCleanup: boolean;
  enableFailureWorkflowControls: boolean;
  enableInstitutionSchoolModels: boolean;
  enableInstitutionOperationsIsolation: boolean;
  enableInstitutionReportingBranding: boolean;
  enableInstitutionMobilityLifecycle: boolean;
  enableInstitutionSecurityMatrix: boolean;
  enableInstitutionCommunicationsIsolation: boolean;
  enableInstitutionAcademicIsolation: boolean;
  enableInstitutionReadinessRollup: boolean;
  enableCrossRoleGoldenPath: boolean;
  enablePerformanceReliabilitySmoke: boolean;
  enableAccessibilityResponsiveSmoke: boolean;
  enableLiveBbbOperationsSmoke: boolean;
  enableLiveBbbMeetingLifecycle: boolean;
  enableLiveBbbPostClassEvidence: boolean;
  enableLiveBbbStudentParentVisibility: boolean;
  enableLiveBbbTrustRetentionAudit: boolean;
  enableLiveBbbInstructionalReadiness: boolean;
  enableLiveBbbQualityLeadership: boolean;
  enableLiveBbbSchedulingCapacity: boolean;
  enableLiveBbbOperationalResilience: boolean;
  enableLiveBbbBackupDrReadiness: boolean;
  enableLiveBbbRetentionControls: boolean;
  enableLiveBbbConsentGrouping: boolean;
  enableLiveBbbPilotReadiness: boolean;
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
    enableFullTeacherGoldenPath: isTruthy(readEnv('EDUPLATFORM_ENABLE_FULL_TEACHER_GOLDEN_PATH')),
    enableParentPortalVisibility: isTruthy(readEnv('EDUPLATFORM_ENABLE_PARENT_PORTAL_VISIBILITY')),
    enableParentPaymentVisibility: isTruthy(readEnv('EDUPLATFORM_ENABLE_PARENT_PAYMENT_VISIBILITY')),
    enableAdminDashboardSmoke: isTruthy(readEnv('EDUPLATFORM_ENABLE_ADMIN_DASHBOARD_SMOKE')),
    enableAdmissionsOperations: isTruthy(readEnv('EDUPLATFORM_ENABLE_ADMISSIONS_OPERATIONS')),
    enableCourseOfferingOperations: isTruthy(readEnv('EDUPLATFORM_ENABLE_COURSE_OFFERING_OPERATIONS')),
    enableFinanceOperations: isTruthy(readEnv('EDUPLATFORM_ENABLE_FINANCE_OPERATIONS')),
    enableReportingAuditOperations: isTruthy(readEnv('EDUPLATFORM_ENABLE_REPORTING_AUDIT_OPERATIONS')),
    enableSupportCommunications: isTruthy(readEnv('EDUPLATFORM_ENABLE_SUPPORT_COMMUNICATIONS')),
    enableAcademicContentVisibility: isTruthy(readEnv('EDUPLATFORM_ENABLE_ACADEMIC_CONTENT_VISIBILITY')),
    enableAcademicResourceLifecycle: isTruthy(readEnv('EDUPLATFORM_ENABLE_ACADEMIC_RESOURCE_LIFECYCLE')),
    enableAcademicGradebookConsistency: isTruthy(readEnv('EDUPLATFORM_ENABLE_ACADEMIC_GRADEBOOK_CONSISTENCY')),
    enableAcademicAttendanceProgressAudit: isTruthy(readEnv('EDUPLATFORM_ENABLE_ACADEMIC_ATTENDANCE_PROGRESS_AUDIT')),
    enableAcademicQualityControls: isTruthy(readEnv('EDUPLATFORM_ENABLE_ACADEMIC_QUALITY_CONTROLS')),
    enableSecurityAccessControl: isTruthy(readEnv('EDUPLATFORM_ENABLE_SECURITY_ACCESS_CONTROL')),
    enableNotificationsDelivery: isTruthy(readEnv('EDUPLATFORM_ENABLE_NOTIFICATIONS_DELIVERY')),
    enableDataExportCompliance: isTruthy(readEnv('EDUPLATFORM_ENABLE_DATA_EXPORT_COMPLIANCE')),
    enableDataLifecycleCleanup: isTruthy(readEnv('EDUPLATFORM_ENABLE_DATA_LIFECYCLE_CLEANUP')),
    enableFailureWorkflowControls: isTruthy(readEnv('EDUPLATFORM_ENABLE_FAILURE_WORKFLOW_CONTROLS')),
    enableInstitutionSchoolModels: isTruthy(readEnv('EDUPLATFORM_ENABLE_INSTITUTION_SCHOOL_MODELS')),
    enableInstitutionOperationsIsolation: isTruthy(readEnv('EDUPLATFORM_ENABLE_INSTITUTION_OPERATIONS_ISOLATION')),
    enableInstitutionReportingBranding: isTruthy(readEnv('EDUPLATFORM_ENABLE_INSTITUTION_REPORTING_BRANDING')),
    enableInstitutionMobilityLifecycle: isTruthy(readEnv('EDUPLATFORM_ENABLE_INSTITUTION_MOBILITY_LIFECYCLE')),
    enableInstitutionSecurityMatrix: isTruthy(readEnv('EDUPLATFORM_ENABLE_INSTITUTION_SECURITY_MATRIX')),
    enableInstitutionCommunicationsIsolation: isTruthy(readEnv('EDUPLATFORM_ENABLE_INSTITUTION_COMMUNICATIONS_ISOLATION')),
    enableInstitutionAcademicIsolation: isTruthy(readEnv('EDUPLATFORM_ENABLE_INSTITUTION_ACADEMIC_ISOLATION')),
    enableInstitutionReadinessRollup: isTruthy(readEnv('EDUPLATFORM_ENABLE_INSTITUTION_READINESS_ROLLUP')),
    enableCrossRoleGoldenPath: isTruthy(readEnv('EDUPLATFORM_ENABLE_CROSS_ROLE_GOLDEN_PATH')),
    enablePerformanceReliabilitySmoke: isTruthy(readEnv('EDUPLATFORM_ENABLE_PERFORMANCE_RELIABILITY_SMOKE')),
    enableAccessibilityResponsiveSmoke: isTruthy(readEnv('EDUPLATFORM_ENABLE_ACCESSIBILITY_RESPONSIVE_SMOKE')),
    enableLiveBbbOperationsSmoke: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONS_SMOKE')),
    enableLiveBbbMeetingLifecycle: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_MEETING_LIFECYCLE')),
    enableLiveBbbPostClassEvidence: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_POST_CLASS_EVIDENCE')),
    enableLiveBbbStudentParentVisibility: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_STUDENT_PARENT_VISIBILITY')),
    enableLiveBbbTrustRetentionAudit: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_TRUST_RETENTION_AUDIT')),
    enableLiveBbbInstructionalReadiness: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_INSTRUCTIONAL_READINESS')),
    enableLiveBbbQualityLeadership: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_QUALITY_LEADERSHIP')),
    enableLiveBbbSchedulingCapacity: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_SCHEDULING_CAPACITY')),
    enableLiveBbbOperationalResilience: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_OPERATIONAL_RESILIENCE')),
    enableLiveBbbBackupDrReadiness: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_BACKUP_DR_READINESS')),
    enableLiveBbbRetentionControls: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_RETENTION_CONTROLS')),
    enableLiveBbbConsentGrouping: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_CONSENT_GROUPING')),
    enableLiveBbbPilotReadiness: isTruthy(readEnv('EDUPLATFORM_ENABLE_LIVE_BBB_PILOT_READINESS')),
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
    enableFullTeacherGoldenPath: env.enableFullTeacherGoldenPath,
    enableParentPortalVisibility: env.enableParentPortalVisibility,
    enableParentPaymentVisibility: env.enableParentPaymentVisibility,
    enableAdminDashboardSmoke: env.enableAdminDashboardSmoke,
    enableAdmissionsOperations: env.enableAdmissionsOperations,
    enableCourseOfferingOperations: env.enableCourseOfferingOperations,
    enableFinanceOperations: env.enableFinanceOperations,
    enableReportingAuditOperations: env.enableReportingAuditOperations,
    enableSupportCommunications: env.enableSupportCommunications,
    enableAcademicContentVisibility: env.enableAcademicContentVisibility,
    enableAcademicResourceLifecycle: env.enableAcademicResourceLifecycle,
    enableAcademicGradebookConsistency: env.enableAcademicGradebookConsistency,
    enableAcademicAttendanceProgressAudit: env.enableAcademicAttendanceProgressAudit,
    enableAcademicQualityControls: env.enableAcademicQualityControls,
    enableSecurityAccessControl: env.enableSecurityAccessControl,
    enableNotificationsDelivery: env.enableNotificationsDelivery,
    enableDataExportCompliance: env.enableDataExportCompliance,
    enableDataLifecycleCleanup: env.enableDataLifecycleCleanup,
    enableFailureWorkflowControls: env.enableFailureWorkflowControls,
    enableInstitutionSchoolModels: env.enableInstitutionSchoolModels,
    enableInstitutionOperationsIsolation: env.enableInstitutionOperationsIsolation,
    enableInstitutionReportingBranding: env.enableInstitutionReportingBranding,
    enableInstitutionMobilityLifecycle: env.enableInstitutionMobilityLifecycle,
    enableInstitutionSecurityMatrix: env.enableInstitutionSecurityMatrix,
    enableInstitutionCommunicationsIsolation: env.enableInstitutionCommunicationsIsolation,
    enableInstitutionAcademicIsolation: env.enableInstitutionAcademicIsolation,
    enableInstitutionReadinessRollup: env.enableInstitutionReadinessRollup,
    enableCrossRoleGoldenPath: env.enableCrossRoleGoldenPath,
    enablePerformanceReliabilitySmoke: env.enablePerformanceReliabilitySmoke,
    enableAccessibilityResponsiveSmoke: env.enableAccessibilityResponsiveSmoke,
    enableLiveBbbOperationsSmoke: env.enableLiveBbbOperationsSmoke,
    enableLiveBbbMeetingLifecycle: env.enableLiveBbbMeetingLifecycle,
    enableLiveBbbPostClassEvidence: env.enableLiveBbbPostClassEvidence,
    enableLiveBbbStudentParentVisibility: env.enableLiveBbbStudentParentVisibility,
    enableLiveBbbTrustRetentionAudit: env.enableLiveBbbTrustRetentionAudit,
    enableLiveBbbInstructionalReadiness: env.enableLiveBbbInstructionalReadiness,
    enableLiveBbbQualityLeadership: env.enableLiveBbbQualityLeadership,
    enableLiveBbbSchedulingCapacity: env.enableLiveBbbSchedulingCapacity,
    enableLiveBbbOperationalResilience: env.enableLiveBbbOperationalResilience,
    enableLiveBbbBackupDrReadiness: env.enableLiveBbbBackupDrReadiness,
    enableLiveBbbRetentionControls: env.enableLiveBbbRetentionControls,
    enableLiveBbbConsentGrouping: env.enableLiveBbbConsentGrouping,
    enableLiveBbbPilotReadiness: env.enableLiveBbbPilotReadiness,
    wsToken: env.wsToken ? '[redacted]' : '',
  };
}
