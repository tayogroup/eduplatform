import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

export interface InstitutionSchoolModelResult {
  finalUrl: string;
  checks: string[];
  workspaces: Array<{ label: string; workspaceId: string }>;
  users: Array<{ role: string; userId: string; username: string }>;
}

export interface InstitutionOperationsIsolationResult {
  runid: string;
  workspaces: {
    branch_a: number;
    branch_b: number;
    franchise: number;
  };
  admissions: Record<string, unknown>;
  finance: Record<string, unknown>;
  parent_visibility: Record<string, unknown>;
  checks: Array<{ name: string; pass: boolean }>;
}

export interface InstitutionReportingBrandingResult {
  runid: string;
  schools: Record<string, unknown>;
  rows: Array<{
    school_key: string;
    school_name: string;
    workspaceid: number;
    relationship: string;
    report_bucket: string;
    domain: string;
    logo: string;
    portal_url: string;
    invoice_count: number;
    revenue: string;
  }>;
  owned_operational_total: string;
  franchise_governance_total: string;
  checks: Array<{ name: string; pass: boolean }>;
}

export interface InstitutionMobilityLifecycleResult {
  runid: string;
  workspaces: {
    branch_a: number;
    branch_b: number;
    franchise: number;
  };
  users: Record<string, { id: number; username: string; email: string }>;
  mobility: Record<string, unknown>;
  lifecycle: Record<string, unknown>;
  checks: Array<{ name: string; pass: boolean }>;
}

export interface InstitutionSecurityMatrixResult {
  runid: string;
  workspaces: Record<string, number>;
  users: Record<string, { id: number; username: string; email: string }>;
  security: Record<string, unknown>;
  checks: Array<{ name: string; pass: boolean }>;
}

export interface InstitutionCommunicationsIsolationResult {
  runid: string;
  workspaces: Record<string, number>;
  communications: Record<string, unknown>;
  checks: Array<{ name: string; pass: boolean }>;
}

export interface InstitutionAcademicIsolationResult {
  runid: string;
  workspaces: Record<string, number>;
  academic: Record<string, unknown>;
  checks: Array<{ name: string; pass: boolean }>;
}

export interface InstitutionReadinessRollupResult {
  runid: string;
  phases: Record<string, string>;
  audit: Record<string, unknown>;
  checks: Array<{ name: string; pass: boolean }>;
}

const REQUIRED_CHECKS = [
  'school_admin_member',
  'teacher_member',
  'student_member',
  'parent_member',
  'class_group_workspaceid',
  'live_session_workspaceid',
  'owned_branch_institution_admin_can_manage',
  'school_admin_only_huda',
  'teacher_can_teach_huda',
  'teacher_no_other_school_classes',
  'parent_only_huda_membership',
  'student_only_huda_membership',
  'franchise_governance_only',
  'second_owned_branch_workspace_created',
  'second_owned_branch_linked',
  'institution_admin_can_manage_both_owned_branches',
  'huda_admin_cannot_manage_branch_b',
  'branch_b_admin_cannot_manage_huda',
  'huda_teacher_cannot_teach_branch_b',
  'branch_b_teacher_cannot_teach_huda',
  'branch_b_teacher_no_huda_classes',
  'franchise_workspace_created',
  'franchise_workspace_governance_only_link',
  'franchise_admin_has_governance_not_operations',
  'institution_admin_cannot_manage_franchise',
  'franchise_not_linked_to_owned_group',
] as const;

const OPERATIONS_ISOLATION_CHECKS = [
  'branch_a_admissions_scoped_to_branch_a',
  'branch_a_admissions_do_not_leak_to_branch_b',
  'branch_b_admissions_do_not_leak_to_branch_a',
  'franchise_admissions_stay_franchise_owned',
  'institution_admin_owned_pipeline_rollup_excludes_franchise',
  'owned_branches_revenue_rolls_up',
  'franchise_revenue_is_separated',
  'parent_billing_visibility_child_school_scoped',
  'finance_audit_keeps_workspace_ids',
] as const;

const REPORTING_BRANDING_CHECKS = [
  'institution_owned_school_reports_aggregate_owned_branches',
  'franchise_excluded_from_operational_totals',
  'franchise_appears_in_governance_network_reporting',
  'csv_pdf_exports_preserve_school_identifiers',
  'branch_and_franchise_branding_is_distinct',
  'portal_links_are_workspace_scoped',
  'direct_url_cross_school_portal_blocked',
] as const;

const MOBILITY_LIFECYCLE_CHECKS = [
  'teacher_branch_a_cannot_access_branch_b_without_assignment',
  'teacher_explicit_branch_b_assignment_grants_access',
  'teacher_branch_a_assignment_removed_after_transfer',
  'student_transfer_updates_workspace_membership',
  'teacher_student_link_updates_after_transfer',
  'mobility_audit_records_teacher_transfer',
  'mobility_audit_records_student_transfer',
  'archive_franchise_does_not_archive_owned_branches',
  'archived_school_disappears_from_active_queues',
  'archived_school_retained_in_institution_audit',
] as const;

const SECURITY_MATRIX_CHECKS = [
  'student_branch_a_direct_url_branch_b_blocked',
  'parent_branch_a_only_linked_child_school',
  'branch_a_admin_cannot_manage_branch_b',
  'branch_b_admin_cannot_manage_branch_a',
  'franchise_admin_cannot_access_owned_operations',
  'institution_admin_owned_rollup_not_franchise_operations',
  'teacher_branch_a_cannot_teach_branch_b',
  'direct_url_cross_school_permission_denied',
  'session_boundary_redirect_preserves_workspace_scope',
  'security_matrix_audit_recorded',
] as const;

const COMMUNICATIONS_ISOLATION_CHECKS = [
  'branch_a_announcement_scoped_to_branch_a',
  'branch_b_announcement_scoped_to_branch_b',
  'franchise_announcement_stays_franchise_owned',
  'parent_teacher_message_does_not_cross_school',
  'support_case_school_scoped',
  'notification_audit_workspace_scoped',
  'institution_owned_announcement_rollup_excludes_franchise',
  'franchise_messages_remain_governance_only',
  'direct_cross_school_followup_blocked',
  'communications_isolation_audit_recorded',
] as const;

const ACADEMIC_ISOLATION_CHECKS = [
  'branch_a_course_offering_scoped',
  'branch_b_course_offering_scoped',
  'franchise_course_offering_governance_only',
  'lesson_resources_school_scoped',
  'gradebook_records_school_scoped',
  'attendance_records_school_scoped',
  'transcript_records_school_scoped',
  'institution_owned_academic_rollup_excludes_franchise',
  'franchise_academic_records_network_reporting_only',
  'academic_isolation_audit_recorded',
] as const;

const READINESS_ROLLUP_CHECKS = [
  'institution_phase_1_school_models_evidence',
  'institution_phase_2_operations_isolation_evidence',
  'institution_phase_3_reporting_branding_evidence',
  'institution_phase_4_mobility_lifecycle_evidence',
  'institution_phase_5_security_matrix_evidence',
  'institution_phase_6_communications_isolation_evidence',
  'institution_phase_7_academic_isolation_evidence',
  'no_stale_active_archived_institution_fixtures',
  'final_institution_readiness_export_available',
  'institution_readiness_audit_recorded',
] as const;

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function endpointMissingMessage(url: string): string {
  return [
    'Institution school functional test endpoint is not deployed on the target EduPlatform server.',
    `Missing URL: ${url}`,
    'Upload src/moodle/local_hubredirect/institution_school_functional_test.php to local/hubredirect/institution_school_functional_test.php, then rerun institution-phase1.',
  ].join('\n');
}

function operationsIsolationMissingMessage(url: string): string {
  return [
    'Institution operations isolation endpoint is not deployed on the target EduPlatform server.',
    `Missing URL: ${url}`,
    'Upload src/moodle/local_hubredirect/institution_operations_isolation.php to local/hubredirect/institution_operations_isolation.php, then rerun institution-phase2.',
  ].join('\n');
}

function reportingBrandingMissingMessage(url: string): string {
  return [
    'Institution reporting branding endpoint is not deployed on the target EduPlatform server.',
    `Missing URL: ${url}`,
    'Upload src/moodle/local_hubredirect/institution_reporting_branding.php to local/hubredirect/institution_reporting_branding.php, then rerun institution-phase3.',
  ].join('\n');
}

function mobilityLifecycleMissingMessage(url: string): string {
  return [
    'Institution mobility lifecycle endpoint is not deployed on the target EduPlatform server.',
    `Missing URL: ${url}`,
    'Upload src/moodle/local_hubredirect/institution_mobility_lifecycle.php to local/hubredirect/institution_mobility_lifecycle.php, then rerun institution-phase4.',
  ].join('\n');
}

function institutionEndpointMissingMessage(label: string, file: string, phase: string, url: string): string {
  return [
    `${label} endpoint is not deployed on the target EduPlatform server.`,
    `Missing URL: ${url}`,
    `Upload src/moodle/local_hubredirect/${file} to local/hubredirect/${file}, then rerun ${phase}.`,
  ].join('\n');
}

async function readDownloadedText(page: Page, linkName: RegExp): Promise<string> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: linkName }).click(),
  ]);
  const path = await download.path();
  const fs = await import('node:fs/promises');
  return path ? fs.readFile(path, 'utf8') : '';
}

export class InstitutionSchoolFunctionalTestPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.institutionSchoolFunctionalTest), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /institution school functional test/i }).first();
    const runButton = this.page.getByRole('button', { name: /run institution school isolation test/i });
    const rendered = (await heading.isVisible().catch(() => false)) && (await runButton.isVisible().catch(() => false));
    if (rendered) {
      return;
    }

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(endpointMissingMessage(this.page.url()));
    }
    if (/access required|access denied|only academy operations/i.test(bodyText)) {
      throw new Error(`Institution school functional test access failed: ${bodyText.slice(0, 700)}`);
    }

    const visibleErrorText = normalize((await this.page.locator(
      '.box.errorbox:visible, .alert-danger:visible, .notifyproblem:visible, .debuginfo:visible, .errorcode:visible',
    ).allTextContents()).join(' '));
    if (/error writing to database|dmlwriteexception|debug info|stack trace/i.test(visibleErrorText || bodyText)) {
      throw new Error(`Institution school functional test endpoint failed before rendering: ${(visibleErrorText || bodyText).slice(0, 1200)}`);
    }

    await expect(heading).toBeVisible();
    await expect(runButton).toBeVisible();
  }

  async runAndVerify(): Promise<InstitutionSchoolModelResult> {
    await this.goto();
    await this.expectReady();

    await this.page.getByRole('button', { name: /run institution school isolation test/i }).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await this.expectReady();

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/owned-branch isolation and franchise governance-only fixtures confirmed/i);
    expect(bodyText).toMatch(/huda branch b/i);
    expect(bodyText).toMatch(/huda franchise/i);

    const failedRows = await this.page.locator('table.pqisft-table tbody tr', { hasText: /FAIL/i }).count();
    expect(failedRows, 'institution school functional test should not report failed access checks').toBe(0);

    for (const check of REQUIRED_CHECKS) {
      const row = this.page.locator('table.pqisft-table tbody tr', { hasText: check }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    return {
      finalUrl: this.page.url(),
      checks: [...REQUIRED_CHECKS],
      workspaces: await this.extractWorkspaces(),
      users: await this.extractUsers(),
    };
  }

  async expectOperatingModelDashboardVisible(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.workspaces), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error('Workspaces operating model page is not deployed on the target EduPlatform server.');
    }
    expect(bodyText).toMatch(/institution operating model/i);
    expect(bodyText).toMatch(/owned branches/i);
    expect(bodyText).toMatch(/franchise schools/i);
    expect(bodyText).toMatch(/owned schools/i);
    expect(bodyText).toMatch(/franchise network|franchise schools/i);
  }

  private async extractWorkspaces(): Promise<Array<{ label: string; workspaceId: string }>> {
    const headings = await this.page.locator('section.pqisft-card h3').allTextContents();
    return headings
      .map((heading) => {
        const match = normalize(heading).match(/^(.*?)\s*\/\s*workspace\s*#(\d+)/i);
        return match ? { label: match[1], workspaceId: match[2] } : null;
      })
      .filter((value): value is { label: string; workspaceId: string } => Boolean(value));
  }

  private async extractUsers(): Promise<Array<{ role: string; userId: string; username: string }>> {
    const rows = await this.page.locator('table.pqisft-table tbody tr').evaluateAll((elements) => elements.map((row) => {
      const cells = Array.from(row.querySelectorAll('td')).map((cell) => (cell.textContent || '').replace(/\s+/g, ' ').trim());
      return cells;
    }));
    return rows
      .filter((cells) => cells.length >= 3 && /^\d+$/.test(cells[1] || '') && /huda\./i.test(cells[2] || ''))
      .map((cells) => ({ role: cells[0], userId: cells[1], username: cells[2] }));
  }
}

export class InstitutionOperationsIsolationPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.institutionOperationsIsolation), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /institution operations isolation/i }).first();
    const runButton = this.page.getByRole('button', { name: /run institution operations isolation test/i });
    const rendered = (await heading.isVisible().catch(() => false)) && (await runButton.isVisible().catch(() => false));
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(operationsIsolationMissingMessage(this.page.url()));
    }
    if (/access required|access denied|only academy operations/i.test(bodyText)) {
      throw new Error(`Institution operations isolation access failed: ${bodyText.slice(0, 700)}`);
    }
    const visibleErrorText = normalize((await this.page.locator(
      '.box.errorbox:visible, .alert-danger:visible, .notifyproblem:visible, .debuginfo:visible, .errorcode:visible, .pqioi-error:visible',
    ).allTextContents()).join(' '));
    if (/error reading from database|error writing to database|dmlreadexception|dmlwriteexception|debug info|stack trace|institution operations isolation failed/i.test(visibleErrorText)) {
      throw new Error(`Institution operations isolation endpoint failed before rendering: ${visibleErrorText.slice(0, 1200)}`);
    }

    if (rendered) {
      return;
    }

    await expect(heading).toBeVisible();
    await expect(runButton).toBeVisible();
  }

  async runAndVerify(params: {
    runId: string;
    courseKey: string;
    invoiceAmount: string;
  }): Promise<InstitutionOperationsIsolationResult & { finalUrl: string }> {
    await this.goto();
    await this.expectReady();

    await this.page.locator('input[name="runid"]').fill(params.runId);
    await this.page.locator('input[name="coursekey"]').fill(params.courseKey || 'pre_quraan');
    await this.page.locator('input[name="invoiceamount"]').fill(params.invoiceAmount || '25.00');
    await this.page.getByRole('button', { name: /run institution operations isolation test/i }).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await this.expectReady();

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/owned-branch admissions and finance rollups verified/i);
    expect(bodyText).toMatch(/franchise separation verified/i);
    expect(bodyText).toMatch(/parent billing scoped/i);

    const failedRows = await this.page.locator('table.pqioi-table tbody tr', { hasText: /FAIL/i }).count();
    expect(failedRows, 'institution operations isolation should not report failed access or finance checks').toBe(0);

    for (const check of OPERATIONS_ISOLATION_CHECKS) {
      const row = this.page.locator('table.pqioi-table tbody tr', { hasText: check }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    const result = JSON.parse((await this.page.locator('#pqioi-result').textContent()) || '{}') as InstitutionOperationsIsolationResult;
    expect(result.runid).toBe(params.runId);
    expect(result.checks.map((check) => check.name)).toEqual(expect.arrayContaining([...OPERATIONS_ISOLATION_CHECKS]));

    return {
      ...result,
      finalUrl: this.page.url(),
    };
  }
}

export class InstitutionReportingBrandingPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(params: Record<string, string | number> = {}): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.institutionReportingBranding, params), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /institution reporting and branding isolation/i }).first();
    const runButton = this.page.getByRole('button', { name: /run institution reporting branding test/i });
    const rendered = (await heading.isVisible().catch(() => false)) && (await runButton.isVisible().catch(() => false));
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(reportingBrandingMissingMessage(this.page.url()));
    }
    if (/access required|access denied|only academy operations/i.test(bodyText)) {
      throw new Error(`Institution reporting branding access failed: ${bodyText.slice(0, 700)}`);
    }
    const visibleErrorText = normalize((await this.page.locator(
      '.box.errorbox:visible, .alert-danger:visible, .notifyproblem:visible, .debuginfo:visible, .errorcode:visible, .pqirb-error:visible',
    ).allTextContents()).join(' '));
    if (/error reading from database|error writing to database|dmlreadexception|dmlwriteexception|debug info|stack trace|institution reporting branding failed/i.test(visibleErrorText)) {
      throw new Error(`Institution reporting branding endpoint failed before rendering: ${visibleErrorText.slice(0, 1200)}`);
    }

    if (rendered) {
      return;
    }

    await expect(heading).toBeVisible();
    await expect(runButton).toBeVisible();
  }

  async runAndVerify(params: {
    runId: string;
    invoiceAmount: string;
  }): Promise<InstitutionReportingBrandingResult & {
    finalUrl: string;
    csvText: string;
    pdfText: string;
    blockedUrl: string;
  }> {
    await this.goto();
    await this.expectReady();

    await this.page.locator('input[name="runid"]').fill(params.runId);
    await this.page.locator('input[name="invoiceamount"]').fill(params.invoiceAmount || '25.00');
    await this.page.getByRole('button', { name: /run institution reporting branding test/i }).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await this.expectReady();

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/owned school operational rollup verified/i);
    expect(bodyText).toMatch(/franchise governance reporting verified/i);
    expect(bodyText).toMatch(/branded portals isolated/i);

    const failedRows = await this.page.locator('table.pqirb-table tbody tr', { hasText: /FAIL/i }).count();
    expect(failedRows, 'institution reporting branding should not report failed rollup or portal checks').toBe(0);

    for (const check of REPORTING_BRANDING_CHECKS) {
      const row = this.page.locator('table.pqirb-table tbody tr', { hasText: check }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    const result = JSON.parse((await this.page.locator('#pqirb-result').textContent()) || '{}') as InstitutionReportingBrandingResult;
    expect(result.runid).toBe(params.runId);
    expect(result.rows.map((row) => row.school_key)).toEqual(expect.arrayContaining(['branch_a', 'branch_b', 'franchise']));
    expect(result.rows.filter((row) => row.report_bucket === 'owned_operational')).toHaveLength(2);
    expect(result.rows.filter((row) => row.report_bucket === 'governance_network')).toHaveLength(1);

    const [csvDownload] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('link', { name: /export csv/i }).click(),
    ]);
    const csvPath = await csvDownload.path();
    const fs = await import('node:fs/promises');
    const csvText = csvPath ? await fs.readFile(csvPath, 'utf8') : '';
    expect(csvText).toContain('school_key');
    expect(csvText).toContain('branch_a');
    expect(csvText).toContain('branch_b');
    expect(csvText).toContain('franchise');
    expect(csvText).toContain('workspaceid');
    expect(csvText).toContain('governance_network');
    expect(csvText).toContain('owned_operational');

    const [pdfDownload] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('link', { name: /export pdf/i }).click(),
    ]);
    const pdfPath = await pdfDownload.path();
    const pdfBuffer = pdfPath ? await fs.readFile(pdfPath) : Buffer.from('');
    const pdfText = pdfBuffer.toString('latin1');
    expect(pdfText).toContain('%PDF');
    expect(pdfText).toContain('branch_a');
    expect(pdfText).toContain('franchise');

    const branchB = result.rows.find((row) => row.school_key === 'branch_b');
    expect(branchB).toBeTruthy();
    await this.goto({
      portal: 'branch_b',
      portalworkspaceid: branchB?.workspaceid || 0,
    });
    const blockedText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(blockedText).toMatch(/cross-school branded portal access is blocked|access denied|required/i);

    return {
      ...result,
      finalUrl: buildEduPlatformUrl(this.env, HUB_ROUTES.institutionReportingBranding),
      csvText,
      pdfText,
      blockedUrl: this.page.url(),
    };
  }
}

export class InstitutionMobilityLifecyclePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.institutionMobilityLifecycle), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /institution mobility and lifecycle/i }).first();
    const runButton = this.page.getByRole('button', { name: /run institution mobility lifecycle test/i });
    const rendered = (await heading.isVisible().catch(() => false)) && (await runButton.isVisible().catch(() => false));
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(mobilityLifecycleMissingMessage(this.page.url()));
    }
    if (/access required|access denied|only academy operations/i.test(bodyText)) {
      throw new Error(`Institution mobility lifecycle access failed: ${bodyText.slice(0, 700)}`);
    }
    const visibleErrorText = normalize((await this.page.locator(
      '.box.errorbox:visible, .alert-danger:visible, .notifyproblem:visible, .debuginfo:visible, .errorcode:visible, .pqiml-error:visible',
    ).allTextContents()).join(' '));
    if (/error reading from database|error writing to database|dmlreadexception|dmlwriteexception|debug info|stack trace|institution mobility lifecycle failed/i.test(visibleErrorText)) {
      throw new Error(`Institution mobility lifecycle endpoint failed before rendering: ${visibleErrorText.slice(0, 1200)}`);
    }

    if (rendered) {
      return;
    }

    await expect(heading).toBeVisible();
    await expect(runButton).toBeVisible();
  }

  async runAndVerify(params: {
    runId: string;
  }): Promise<InstitutionMobilityLifecycleResult & { finalUrl: string }> {
    await this.goto();
    await this.expectReady();

    await this.page.locator('input[name="runid"]').fill(params.runId);
    await this.page.getByRole('button', { name: /run institution mobility lifecycle test/i }).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await this.expectReady();

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/staff mobility, transfer audit, and institution data lifecycle verified/i);
    expect(bodyText).toMatch(/active workspace queue count/i);
    expect(bodyText).toMatch(/institution audit rows/i);

    const failedRows = await this.page.locator('table.pqiml-table tbody tr', { hasText: /FAIL/i }).count();
    expect(failedRows, 'institution mobility lifecycle should not report failed transfer or archive checks').toBe(0);

    for (const check of MOBILITY_LIFECYCLE_CHECKS) {
      const row = this.page.locator('table.pqiml-table tbody tr', { hasText: check }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    const result = JSON.parse((await this.page.locator('#pqiml-result').textContent()) || '{}') as InstitutionMobilityLifecycleResult;
    expect(result.runid).toBe(params.runId);
    expect(result.checks.map((check) => check.name)).toEqual(expect.arrayContaining([...MOBILITY_LIFECYCLE_CHECKS]));
    expect(result.checks.every((check) => check.pass)).toBe(true);
    expect(Number(result.workspaces.branch_a)).toBeGreaterThan(0);
    expect(Number(result.workspaces.branch_b)).toBeGreaterThan(0);
    expect(Number(result.workspaces.franchise)).toBeGreaterThan(0);
    expect(result.mobility.teacher_initial_branch_b_access).toBe(false);
    expect(result.mobility.teacher_explicit_branch_b_access).toBe(true);
    expect(Number(result.lifecycle.active_workspace_queue_count)).toBe(2);
    expect(Number(result.lifecycle.archived_workspace_queue_count)).toBe(1);

    return {
      ...result,
      finalUrl: this.page.url(),
    };
  }
}

export class InstitutionSecurityMatrixPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.institutionSecurityMatrix), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /institution security matrix/i }).first();
    const runButton = this.page.getByRole('button', { name: /run institution security matrix test/i });
    const rendered = (await heading.isVisible().catch(() => false)) && (await runButton.isVisible().catch(() => false));
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(institutionEndpointMissingMessage('Institution security matrix', 'institution_security_matrix.php', 'institution-phase5', this.page.url()));
    }
    if (/access required|access denied|only academy operations/i.test(bodyText)) {
      throw new Error(`Institution security matrix access failed: ${bodyText.slice(0, 700)}`);
    }
    const visibleErrorText = normalize((await this.page.locator(
      '.box.errorbox:visible, .alert-danger:visible, .notifyproblem:visible, .debuginfo:visible, .errorcode:visible, .pqism-error:visible',
    ).allTextContents()).join(' '));
    if (/error reading from database|error writing to database|dmlreadexception|dmlwriteexception|debug info|stack trace|institution security matrix failed/i.test(visibleErrorText)) {
      throw new Error(`Institution security matrix endpoint failed before rendering: ${visibleErrorText.slice(0, 1200)}`);
    }
    if (rendered) {
      return;
    }
    await expect(heading).toBeVisible();
    await expect(runButton).toBeVisible();
  }

  async runAndVerify(params: { runId: string }): Promise<InstitutionSecurityMatrixResult & { finalUrl: string }> {
    await this.goto();
    await this.expectReady();
    await this.page.locator('input[name="runid"]').fill(params.runId);
    await this.page.getByRole('button', { name: /run institution security matrix test/i }).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await this.expectReady();

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/cross-school role boundary matrix verified/i);
    expect(bodyText).toMatch(/direct url permission checks verified/i);

    const failedRows = await this.page.locator('table.pqism-table tbody tr', { hasText: /FAIL/i }).count();
    expect(failedRows, 'institution security matrix should not report failed access checks').toBe(0);
    for (const check of SECURITY_MATRIX_CHECKS) {
      const row = this.page.locator('table.pqism-table tbody tr', { hasText: check }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    const result = JSON.parse((await this.page.locator('#pqism-result').textContent()) || '{}') as InstitutionSecurityMatrixResult;
    expect(result.runid).toBe(params.runId);
    expect(result.checks.map((check) => check.name)).toEqual(expect.arrayContaining([...SECURITY_MATRIX_CHECKS]));
    expect(result.checks.every((check) => check.pass)).toBe(true);
    return { ...result, finalUrl: this.page.url() };
  }
}

export class InstitutionCommunicationsIsolationPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.institutionCommunicationsIsolation), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /institution communications isolation/i }).first();
    const runButton = this.page.getByRole('button', { name: /run institution communications isolation test/i });
    const rendered = (await heading.isVisible().catch(() => false)) && (await runButton.isVisible().catch(() => false));
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(institutionEndpointMissingMessage('Institution communications isolation', 'institution_communications_isolation.php', 'institution-phase6', this.page.url()));
    }
    if (/access required|access denied|only academy operations/i.test(bodyText)) {
      throw new Error(`Institution communications isolation access failed: ${bodyText.slice(0, 700)}`);
    }
    const visibleErrorText = normalize((await this.page.locator(
      '.box.errorbox:visible, .alert-danger:visible, .notifyproblem:visible, .debuginfo:visible, .errorcode:visible, .pqici-error:visible',
    ).allTextContents()).join(' '));
    if (/error reading from database|error writing to database|dmlreadexception|dmlwriteexception|debug info|stack trace|institution communications isolation failed/i.test(visibleErrorText)) {
      throw new Error(`Institution communications isolation endpoint failed before rendering: ${visibleErrorText.slice(0, 1200)}`);
    }
    if (rendered) {
      return;
    }
    await expect(heading).toBeVisible();
    await expect(runButton).toBeVisible();
  }

  async runAndVerify(params: { runId: string }): Promise<InstitutionCommunicationsIsolationResult & { finalUrl: string }> {
    await this.goto();
    await this.expectReady();
    await this.page.locator('input[name="runid"]').fill(params.runId);
    await this.page.getByRole('button', { name: /run institution communications isolation test/i }).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await this.expectReady();

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/communications and notifications isolation verified/i);
    expect(bodyText).toMatch(/workspace-scoped notification audit/i);

    const failedRows = await this.page.locator('table.pqici-table tbody tr', { hasText: /FAIL/i }).count();
    expect(failedRows, 'institution communications isolation should not report failed scope checks').toBe(0);
    for (const check of COMMUNICATIONS_ISOLATION_CHECKS) {
      const row = this.page.locator('table.pqici-table tbody tr', { hasText: check }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    const result = JSON.parse((await this.page.locator('#pqici-result').textContent()) || '{}') as InstitutionCommunicationsIsolationResult;
    expect(result.runid).toBe(params.runId);
    expect(result.checks.map((check) => check.name)).toEqual(expect.arrayContaining([...COMMUNICATIONS_ISOLATION_CHECKS]));
    expect(result.checks.every((check) => check.pass)).toBe(true);
    return { ...result, finalUrl: this.page.url() };
  }
}

export class InstitutionAcademicIsolationPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.institutionAcademicIsolation), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /institution academic isolation/i }).first();
    const runButton = this.page.getByRole('button', { name: /run institution academic isolation test/i });
    const rendered = (await heading.isVisible().catch(() => false)) && (await runButton.isVisible().catch(() => false));
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(institutionEndpointMissingMessage('Institution academic isolation', 'institution_academic_isolation.php', 'institution-phase7', this.page.url()));
    }
    if (/access required|access denied|only academy operations/i.test(bodyText)) {
      throw new Error(`Institution academic isolation access failed: ${bodyText.slice(0, 700)}`);
    }
    const visibleErrorText = normalize((await this.page.locator(
      '.box.errorbox:visible, .alert-danger:visible, .notifyproblem:visible, .debuginfo:visible, .errorcode:visible, .pqaai-error:visible',
    ).allTextContents()).join(' '));
    if (/error reading from database|error writing to database|dmlreadexception|dmlwriteexception|debug info|stack trace|institution academic isolation failed/i.test(visibleErrorText)) {
      throw new Error(`Institution academic isolation endpoint failed before rendering: ${visibleErrorText.slice(0, 1200)}`);
    }
    if (rendered) {
      return;
    }
    await expect(heading).toBeVisible();
    await expect(runButton).toBeVisible();
  }

  async runAndVerify(params: { runId: string; courseKey: string }): Promise<InstitutionAcademicIsolationResult & { finalUrl: string }> {
    await this.goto();
    await this.expectReady();
    await this.page.locator('input[name="runid"]').fill(params.runId);
    await this.page.locator('input[name="coursekey"]').fill(params.courseKey || 'pre_quraan');
    await this.page.getByRole('button', { name: /run institution academic isolation test/i }).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await this.expectReady();

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/academic course, gradebook, attendance, and transcript isolation verified/i);
    expect(bodyText).toMatch(/franchise academic records remain governance-only/i);

    const failedRows = await this.page.locator('table.pqaai-table tbody tr', { hasText: /FAIL/i }).count();
    expect(failedRows, 'institution academic isolation should not report failed academic scope checks').toBe(0);
    for (const check of ACADEMIC_ISOLATION_CHECKS) {
      const row = this.page.locator('table.pqaai-table tbody tr', { hasText: check }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    const result = JSON.parse((await this.page.locator('#pqaai-result').textContent()) || '{}') as InstitutionAcademicIsolationResult;
    expect(result.runid).toBe(params.runId);
    expect(result.checks.map((check) => check.name)).toEqual(expect.arrayContaining([...ACADEMIC_ISOLATION_CHECKS]));
    expect(result.checks.every((check) => check.pass)).toBe(true);
    return { ...result, finalUrl: this.page.url() };
  }
}

export class InstitutionReadinessRollupPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(params: Record<string, string | number> = {}): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.institutionReadinessRollup, params), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  async expectReady(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /institution readiness rollup/i }).first();
    const runButton = this.page.getByRole('button', { name: /run institution readiness rollup/i });
    const rendered = (await heading.isVisible().catch(() => false)) && (await runButton.isVisible().catch(() => false));
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/404|not found/i.test(bodyText)) {
      throw new Error(institutionEndpointMissingMessage('Institution readiness rollup', 'institution_readiness_rollup.php', 'institution-phase8', this.page.url()));
    }
    if (/access required|access denied|only academy operations/i.test(bodyText)) {
      throw new Error(`Institution readiness rollup access failed: ${bodyText.slice(0, 700)}`);
    }
    const visibleErrorText = normalize((await this.page.locator(
      '.box.errorbox:visible, .alert-danger:visible, .notifyproblem:visible, .debuginfo:visible, .errorcode:visible, .pqirr-error:visible',
    ).allTextContents()).join(' '));
    if (/error reading from database|error writing to database|dmlreadexception|dmlwriteexception|debug info|stack trace|institution readiness rollup failed/i.test(visibleErrorText)) {
      throw new Error(`Institution readiness rollup endpoint failed before rendering: ${visibleErrorText.slice(0, 1200)}`);
    }
    if (rendered) {
      return;
    }
    await expect(heading).toBeVisible();
    await expect(runButton).toBeVisible();
  }

  async runAndVerify(params: { runId: string }): Promise<InstitutionReadinessRollupResult & { finalUrl: string; csvText: string }> {
    await this.goto();
    await this.expectReady();
    await this.page.locator('input[name="runid"]').fill(params.runId);
    await this.page.getByRole('button', { name: /run institution readiness rollup/i }).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await this.expectReady();

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/institution school readiness rollup verified/i);
    expect(bodyText).toMatch(/final institution readiness evidence/i);

    const failedRows = await this.page.locator('table.pqirr-table tbody tr', { hasText: /FAIL/i }).count();
    expect(failedRows, 'institution readiness rollup should not report failed final checks').toBe(0);
    for (const check of READINESS_ROLLUP_CHECKS) {
      const row = this.page.locator('table.pqirr-table tbody tr', { hasText: check }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/PASS/i);
    }

    const result = JSON.parse((await this.page.locator('#pqirr-result').textContent()) || '{}') as InstitutionReadinessRollupResult;
    expect(result.runid).toBe(params.runId);
    expect(result.checks.map((check) => check.name)).toEqual(expect.arrayContaining([...READINESS_ROLLUP_CHECKS]));
    expect(result.checks.every((check) => check.pass)).toBe(true);
    const csvText = await readDownloadedText(this.page, /export csv/i);
    expect(csvText).toContain('institution_readiness_rollup');
    expect(csvText).toContain('institution_phase_1_school_models_evidence');
    expect(csvText).toContain('institution_phase_7_academic_isolation_evidence');
    return { ...result, finalUrl: this.page.url(), csvText };
  }
}
