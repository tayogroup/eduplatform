import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export interface AdminSmokeResult {
  name: string;
  route: string;
  finalUrl: string;
  title: string;
  bodyText: string;
}

export interface AdminSmokeTarget {
  name: string;
  route: string;
  expectedText: RegExp[];
  params?: Record<string, string | number | boolean | undefined | null>;
}

export const ADMIN_SMOKE_TARGETS: AdminSmokeTarget[] = [
  {
    name: 'master-dashboard',
    route: HUB_ROUTES.dashboard,
    expectedText: [/workspace dashboard/i, /operations/i, /student intake/i],
  },
  {
    name: 'workspace-dashboard',
    route: HUB_ROUTES.workspaceDashboard,
    expectedText: [/course offerings/i, /student intake/i, /teacher onboarding/i, /workspace members/i],
  },
  {
    name: 'workspace-people',
    route: HUB_ROUTES.workspacePeople,
    expectedText: [/people/i, /workspace members/i, /teachers/i, /students/i],
  },
  {
    name: 'course-offerings',
    route: HUB_ROUTES.courseOfferings,
    expectedText: [/course offerings/i, /offerings/i, /enrollment requests/i],
  },
  {
    name: 'invoices',
    route: HUB_ROUTES.invoices,
    expectedText: [/invoices/i, /create draft/i, /student/i],
  },
  {
    name: 'intake-requests',
    route: HUB_ROUTES.intakeRequests,
    expectedText: [/intake requests/i, /student intake/i],
  },
];

export class AdminOperationsSmokePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async gotoWorkspaceDashboard(): Promise<AdminSmokeResult> {
    return this.gotoAndExpect(ADMIN_SMOKE_TARGETS.find((target) => target.name === 'workspace-dashboard')!);
  }

  async gotoAndExpect(target: AdminSmokeTarget): Promise<AdminSmokeResult> {
    const url = buildEduPlatformUrl(this.env, target.route, target.params || {});
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(this.page.locator('body')).toBeVisible();

    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    const title = await this.page.title().catch(() => '');
    const loginForm = this.page.locator('form').filter({ has: this.page.getByLabel(/username|email/i) }).first();
    const hasLoginForm = await loginForm.isVisible().catch(() => false);
    const hasPermissionError = /invalid login|access denied|permission denied|not authorized|do not have permission/i.test(bodyText);
    if (hasLoginForm || hasPermissionError) {
      throw new Error(
        [
          `Admin operations smoke could not access ${target.name}.`,
          `URL: ${this.page.url()}`,
          `Title: ${title}`,
          `Body: ${bodyText.slice(0, 500)}`,
        ].join('\n'),
      );
    }

    for (const expected of target.expectedText) {
      expect(bodyText, `${target.name} should include ${expected}`).toMatch(expected);
    }

    return {
      name: target.name,
      route: target.route,
      finalUrl: this.page.url(),
      title,
      bodyText: bodyText.slice(0, 1_000),
    };
  }

  async expectWorkspaceDashboardLinks(): Promise<void> {
    await this.gotoWorkspaceDashboard();
    for (const linkText of [
      /course offerings/i,
      /people & assignments/i,
      /finance operations|invoices/i,
      /student intake/i,
      /teacher onboarding/i,
    ]) {
      await expect(this.page.locator('a', { hasText: linkText }).first()).toBeVisible();
    }
  }
}

export class AdminAuditDiagnosticsPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async expectRecentAuditForRequest(requestId: string, expectedActions: RegExp[]): Promise<string> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.liveDiagnostics), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /live session diagnostics/i })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /recent audit/i })).toBeVisible();

    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    expect(bodyText).toContain(`intake_request #${requestId}`);
    for (const action of expectedActions) {
      expect(bodyText, `Recent audit should include ${action} for intake request ${requestId}`).toMatch(action);
    }

    return bodyText;
  }
}

export interface ReportingAuditPageResult {
  name: string;
  finalUrl: string;
  title: string;
  bodyText: string;
}

export interface ReportingAuditDownloadResult {
  name: string;
  suggestedFilename: string;
  finalUrl: string;
}

export class ReportingAuditOperationsPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  private async gotoAndExpect(name: string, route: string, expectedText: RegExp[]): Promise<ReportingAuditPageResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, route), { waitUntil: 'domcontentloaded' });
    await expect(this.page.locator('body')).toBeVisible();

    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    const title = await this.page.title().catch(() => '');
    if (/invalid login|access denied|permission denied|not authorized|do not have permission/i.test(bodyText)) {
      throw new Error(
        [
          `Reporting/audit operations could not access ${name}.`,
          `URL: ${this.page.url()}`,
          `Title: ${title}`,
          `Body: ${bodyText.slice(0, 500)}`,
        ].join('\n'),
      );
    }

    for (const expected of expectedText) {
      expect(bodyText, `${name} should include ${expected}`).toMatch(expected);
    }

    return {
      name,
      finalUrl: this.page.url(),
      title,
      bodyText: bodyText.slice(0, 1_000),
    };
  }

  async expectManagedReports(): Promise<ReportingAuditPageResult[]> {
    return [
      await this.gotoAndExpect('course-seat-report', HUB_ROUTES.courseSeatReport, [/seat utilization/i, /capacity/i, /open seats|utilization/i]),
      await this.gotoAndExpect('course-sync-report', HUB_ROUTES.courseSyncReport, [/moodle sync report/i, /requests needing moodle sync/i, /offering link issues/i]),
      await this.gotoAndExpect('student-course-history', HUB_ROUTES.courseStudentHistory, [/student course history/i, /course request|enrollment lifecycle/i]),
    ];
  }

  async expectFinanceAudit(): Promise<ReportingAuditPageResult> {
    return this.gotoAndExpect('finance-audit', HUB_ROUTES.financeAudit, [/finance audit/i, /invoice|payment|receipt/i, /filter/i]);
  }

  async expectTranscriptAudit(): Promise<ReportingAuditPageResult[]> {
    return [
      await this.gotoAndExpect('transcript-readiness', HUB_ROUTES.transcriptReadiness, [/transcript readiness/i, /blockers|warnings/i, /export csv/i]),
      await this.gotoAndExpect('transcript-policy', HUB_ROUTES.transcriptPolicy, [/transcript policy settings/i, /display and issue policy/i, /current policy/i]),
    ];
  }

  async downloadTranscriptReadinessCsv(): Promise<ReportingAuditDownloadResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.transcriptReadiness), { waitUntil: 'domcontentloaded' });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('button', { name: /export csv/i }).click(),
    ]);
    const failure = await download.failure();
    expect(failure).toBeNull();
    expect(download.suggestedFilename()).toMatch(/transcript-readiness.*\.csv$/i);

    return {
      name: 'transcript-readiness-csv',
      suggestedFilename: download.suggestedFilename(),
      finalUrl: this.page.url(),
    };
  }

  async downloadGovernanceAuditCsv(): Promise<ReportingAuditDownloadResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.complianceGovernance), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByText(/compliance, audit, and data governance/i).first()).toBeVisible();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('link', { name: /export csv/i }).click(),
    ]);
    const failure = await download.failure();
    expect(failure).toBeNull();
    expect(download.suggestedFilename()).toMatch(/governance-audit.*\.csv$/i);

    return {
      name: 'governance-audit-csv',
      suggestedFilename: download.suggestedFilename(),
      finalUrl: this.page.url(),
    };
  }
}
