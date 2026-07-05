import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export interface AccessProbeResult {
  label: string;
  finalUrl: string;
  pageText: string;
  outcome: 'allowed' | 'blocked' | 'login';
}

export class SecurityAccessProbe {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(route: string, params: Record<string, string | number | boolean | undefined | null> = {}): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, route, params), {
      waitUntil: 'commit',
      timeout: 60_000,
    });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
  }

  async expectTeacherPortalAllowsOnlyAssignedStudent(options: {
    assignedStudentEmail: string;
    unassignedStudentEmail: string;
  }): Promise<AccessProbeResult> {
    await this.goto(HUB_ROUTES.teacherPortal);
    await expect(this.page.getByRole('heading', { name: /teacher portal/i }).first()).toBeVisible();
    const bodyText = await this.bodyText();
    expect(bodyText).toContain(options.assignedStudentEmail);
    expect(bodyText).not.toContain(options.unassignedStudentEmail);
    return {
      label: 'teacher-portal-assigned-roster-only',
      finalUrl: this.page.url(),
      pageText: bodyText,
      outcome: 'allowed',
    };
  }

  async expectParentCanSeeLinkedChild(options: {
    childUserId: string;
    childEmail: string;
    childUsername?: string;
  }): Promise<AccessProbeResult> {
    await this.goto(HUB_ROUTES.parentWorkspace, { childid: options.childUserId });
    await expect(this.page.getByRole('heading', { name: /parent workspace/i }).first()).toBeVisible();
    const bodyText = await this.bodyText();
    const childToken = (options.childUsername || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    const visibleChildLabel = childToken ? `Portal Student ${childToken}` : options.childEmail;
    expect(bodyText).toContain(visibleChildLabel);
    return {
      label: 'parent-linked-child-visible',
      finalUrl: this.page.url(),
      pageText: bodyText,
      outcome: 'allowed',
    };
  }

  async expectBlocked(label: string): Promise<AccessProbeResult> {
    const bodyText = await this.bodyText();
    const loginFormVisible = await this.page.locator('form').filter({
      has: this.page.getByLabel(/username|email/i),
    }).first().isVisible().catch(() => false);
    if (loginFormVisible || /consumer_login\.php|\/login\/index\.php|sessionexpired=1/i.test(this.page.url())) {
      return {
        label,
        finalUrl: this.page.url(),
        pageText: bodyText,
        outcome: 'login',
      };
    }

    const blocked = /access denied|access required|not available|permission denied|not authorized|not allowed|requires .* access|only .* users|cannot access|login required|teacher portal denied|workspace access denied/i.test(bodyText);
    if (!blocked) {
      throw new Error(
        [
          `${label} was expected to be blocked, but no access-control response was detected.`,
          `URL: ${this.page.url()}`,
          `Body: ${bodyText.slice(0, 900)}`,
        ].join('\n'),
      );
    }

    return {
      label,
      finalUrl: this.page.url(),
      pageText: bodyText,
      outcome: 'blocked',
    };
  }

  async bodyText(): Promise<string> {
    return normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
  }
}
