import type { EduPlatformEnv } from './env';

export type RouteParams = Record<string, string | number | boolean | undefined | null>;

export const HUB_ROUTES = {
  dashboard: '/local/hubredirect/dashboard.php',
  workspaceDashboard: '/local/hubredirect/workspace_dashboard.php',
  workspacePeople: '/local/hubredirect/workspace_people.php',
  workspaceMaterials: '/local/hubredirect/workspace_materials.php',
  workspaceStudent: '/local/hubredirect/workspace_student.php',
  workspaceReports: '/local/hubredirect/workspace_reports.php',
  attendanceOperations: '/local/hubredirect/attendance_operations.php',
  academicQualityControls: '/local/hubredirect/academic_quality_controls.php',
  publicIntake: '/local/hubredirect/public_intake.php',
  intakeRequests: '/local/hubredirect/intake_requests.php',
  admissions: '/local/hubredirect/admissions.php',
  studentIntake: '/local/hubredirect/student_intake.php',
  courseCatalog: '/local/hubredirect/course_catalog_browse.php',
  courseOfferings: '/local/hubredirect/course_offerings.php',
  courseSeatReport: '/local/hubredirect/course_seat_report.php',
  courseSyncReport: '/local/hubredirect/course_sync_report.php',
  courseStudentHistory: '/local/hubredirect/course_student_history.php',
  invoices: '/local/hubredirect/invoices.php',
  financeOperations: '/local/hubredirect/finance_operations.php',
  financePolicy: '/local/hubredirect/finance_policy.php',
  financeAudit: '/local/hubredirect/finance_audit.php',
  paymentGatewaySettings: '/local/hubredirect/payment_gateway_settings.php',
  complianceGovernance: '/local/hubredirect/compliance_governance.php',
  communicationsCenter: '/local/hubredirect/communications_center.php',
  liveOps: '/local/hubredirect/live_ops.php',
  liveAvailability: '/local/hubredirect/live_availability.php',
  liveSessions: '/local/hubredirect/live_sessions.php',
  liveCreateWizard: '/local/hubredirect/live_create_wizard.php',
  liveRecordingsAdmin: '/local/hubredirect/live_recordings_admin.php',
  liveDiagnostics: '/local/hubredirect/live_diagnostics.php',
  liveFollowups: '/local/hubredirect/live_followups.php',
  liveReview: '/local/hubredirect/live_review.php',
  liveSummaries: '/local/hubredirect/live_summaries.php',
  liveParentTrust: '/local/hubredirect/live_parent_trust.php',
  liveParentTrustAudit: '/local/hubredirect/live_parent_trust_audit.php',
  liveParentTrustReviewPack: '/local/hubredirect/live_parent_trust_review_pack.php',
  liveParentTrustRetention: '/local/hubredirect/live_parent_trust_retention.php',
  liveParentTrustPurgeEvidence: '/local/hubredirect/live_parent_trust_purge_evidence.php',
  liveParentLinks: '/local/hubredirect/live_parent_links.php',
  liveGrouping: '/local/hubredirect/live_grouping.php',
  liveSessionGuide: '/local/hubredirect/live_session_guide.php',
  liveSessionMaterials: '/local/hubredirect/live_session_materials.php',
  livePracticeCoach: '/local/hubredirect/live_practice_coach.php',
  liveVirtualTutor: '/local/hubredirect/live_virtual_tutor.php',
  liveQuality: '/local/hubredirect/live_quality.php',
  liveQualityAnalytics: '/local/hubredirect/live_quality_analytics.php',
  liveLeadership: '/local/hubredirect/live_leadership.php',
  liveImprovementPlans: '/local/hubredirect/live_improvement_plans.php',
  liveMonitor: '/local/hubredirect/live_monitor.php',
  liveReports: '/local/hubredirect/live_reports.php',
  liveSeries: '/local/hubredirect/live_series.php',
  liveSeriesSchedule: '/local/hubredirect/live_series_schedule.php',
  liveSchedule: '/local/hubredirect/live_schedule.php',
  liveCalendar: '/local/hubredirect/live_calendar.php',
  liveCapacity: '/local/hubredirect/live_capacity.php',
  liveTeacherDirectory: '/local/hubredirect/live_teacher_directory.php',
  liveTeacherProfile: '/local/hubredirect/live_teacher_profile.php',
  livePilotReadiness: '/local/hubredirect/live_pilot_readiness.php',
  backupDrChecks: '/local/hubredirect/backup_dr_checks.php',
  notificationDiagnostics: '/local/hubredirect/notification_diagnostics.php',
  notificationDeliveryAudit: '/local/hubredirect/notification_delivery_audit.php',
  dataExportCompliance: '/local/hubredirect/data_export_compliance.php',
  dataLifecycleCleanup: '/local/hubredirect/data_lifecycle_cleanup.php',
  failureWorkflowControls: '/local/hubredirect/failure_workflow_controls.php',
  crossRoleGoldenPath: '/local/hubredirect/cross_role_golden_path.php',
  performanceReliabilitySmoke: '/local/hubredirect/performance_reliability_smoke.php',
  invoiceDetail: '/local/hubredirect/invoice_detail.php',
  invoiceView: '/local/hubredirect/invoice_view.php',
  studentBilling: '/local/hubredirect/student_billing.php',
  parentBilling: '/local/hubredirect/parent_billing.php',
  parentWorkspace: '/local/hubredirect/workspace_parent.php',
  studentParentPortal: '/local/hubredirect/student_parent_portal.php',
  gradebookAssessment: '/local/hubredirect/gradebook_assessment.php',
  courseTranscript: '/local/hubredirect/course_transcript.php',
  transcriptReadiness: '/local/hubredirect/transcript_readiness.php',
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
  support: '/local/hubredirect/support.php',
  supportAudit: '/local/hubredirect/support_audit.php',
  supportReports: '/local/hubredirect/support_reports.php',
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
