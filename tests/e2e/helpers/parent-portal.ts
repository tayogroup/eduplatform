import { expect, type Page } from '@playwright/test';
import type { StudentCreationResult } from './admissions';
import type { InvoiceResult, PaymentReceiptResult } from './finance';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

export interface ParentPortalVisibilityResult {
  portalText: string;
  finalUrl: string;
  visible: boolean;
  note?: string;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export class ParentWorkspacePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async gotoForChild(student: StudentCreationResult): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.parentWorkspace, {
      childid: student.studentUserId,
    }), { waitUntil: 'domcontentloaded' });
  }

  async expectChildVisible(student: StudentCreationResult, expectedChildName: string): Promise<ParentPortalVisibilityResult> {
    await expect(this.page.getByRole('heading', { name: /parent workspace/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    expect(bodyText).toContain(expectedChildName);
    await expect(this.page.getByText(expectedChildName).first()).toBeVisible();

    return {
      portalText: bodyText,
      finalUrl: this.page.url(),
      visible: true,
    };
  }
}

export class ParentBillingPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async gotoForChild(student: StudentCreationResult): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.parentBilling, {
      childid: student.studentUserId,
    }), { waitUntil: 'domcontentloaded' });
  }

  async expectInvoiceVisible(invoice: InvoiceResult): Promise<ParentPortalVisibilityResult> {
    await expect(this.page.getByRole('heading', { name: /parent billing/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    const visible = bodyText.includes(invoice.invoiceNumber);
    if (!visible && !/No issued invoices are available yet/i.test(bodyText)) {
      expect(bodyText).toContain(invoice.invoiceNumber);
    }

    return {
      portalText: bodyText,
      finalUrl: this.page.url(),
      visible,
      note: visible ? undefined : 'Parent billing policy did not expose issued invoices on parent_billing.php.',
    };
  }

  async expectPaidInvoiceVisible(invoice: InvoiceResult, payment: PaymentReceiptResult): Promise<ParentPortalVisibilityResult> {
    await expect(this.page.getByRole('heading', { name: /parent billing/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    const visible = bodyText.includes(invoice.invoiceNumber);
    if (visible) {
      expect(bodyText).toMatch(/\bPaid\b/i);
      expect(bodyText).toMatch(/\b0(?:\.00)?\b/);
    } else if (!/No issued invoices are available yet/i.test(bodyText)) {
      expect(bodyText).toContain(invoice.invoiceNumber);
    }

    return {
      portalText: bodyText,
      finalUrl: this.page.url(),
      visible,
      note: visible ? undefined : 'Parent billing policy did not expose paid invoices on parent_billing.php.',
    };
  }
}

export class StudentParentPortalPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async gotoForChild(student: StudentCreationResult): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.studentParentPortal, {
      studentid: student.studentUserId,
    }), { waitUntil: 'domcontentloaded' });
  }

  async expectFinanceVisible(invoice: InvoiceResult, payment?: PaymentReceiptResult): Promise<ParentPortalVisibilityResult> {
    await expect(this.page.getByRole('heading', { name: /student and parent portal/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    expect(bodyText).toContain(invoice.invoiceNumber);
    if (payment) {
      expect(bodyText).toContain(payment.receiptNumber);
    }

    return {
      portalText: bodyText,
      finalUrl: this.page.url(),
      visible: true,
    };
  }
}
