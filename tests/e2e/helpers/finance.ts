import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';
import type { StudentCreationResult } from './admissions';

export interface InvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  statusText: string;
  totalText: string;
  balanceText: string;
  finalUrl: string;
}

export interface BillingVisibilityResult {
  invoiceText: string;
  finalUrl: string;
}

export interface PaymentReceiptResult {
  paymentId: string;
  receiptNumber: string;
  amountText: string;
  methodText: string;
  reference: string;
  receiptText: string;
  finalUrl: string;
}

export interface PaidInvoiceResult {
  statusText: string;
  balanceText: string;
  paidText: string;
  invoiceText: string;
  finalUrl: string;
}

function parseInvoiceId(url: string): string {
  return new URL(url).searchParams.get('invoiceid') || '';
}

function parsePaymentId(url: string): string {
  return new URL(url).searchParams.get('paymentid') || '';
}

function moneyAmount(value: string): string {
  const trimmed = value.trim();
  if (/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return trimmed.includes('.') ? trimmed : `${trimmed}.00`;
  }

  return '0.00';
}

function labeledMoney(text: string, label: string): string {
  return text.match(new RegExp(`${label}\\s*([0-9.]+)`, 'i'))?.[1] || '';
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export class AdminInvoicesPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.invoices), { waitUntil: 'domcontentloaded' });
  }

  async createDraftForStudent(student: StudentCreationResult): Promise<string> {
    await expect(this.page.getByRole('heading', { name: /invoices/i })).toBeVisible();

    const form = this.page.locator('form:has(input[name="action"][value="create_draft"])').first();
    await expect(form).toBeVisible();
    await form.locator('select[name="studentid"]').selectOption(student.studentUserId);
    await form.getByRole('button', { name: /create draft invoice/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    const error = this.page.locator('.pqinv-alert--err, .pqid-alert--err').first();
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Draft invoice creation failed: ${((await error.textContent()) || '').trim()}`);
    }

    await expect(this.page.locator('.pqid-title').first()).toContainText(/draft invoice/i);
    const invoiceId = parseInvoiceId(this.page.url());
    if (!invoiceId) {
      throw new Error(`Could not determine created invoice id from URL: ${this.page.url()}`);
    }

    return invoiceId;
  }
}

export class InvoiceDetailPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(invoiceId: string): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.invoiceDetail, {
      invoiceid: invoiceId,
    }), { waitUntil: 'domcontentloaded' });
  }

  async addLineAndIssue(options: {
    description: string;
    amount: string;
    enrollmentRequestId?: string;
  }): Promise<InvoiceResult> {
    await expect(this.page.locator('.pqid-title').first()).toBeVisible();

    const lineForm = this.page.locator('form:has(input[name="action"][value="save_line"])').first();
    if (await lineForm.isVisible().catch(() => false)) {
      await lineForm.locator('input[name="description"]').fill(options.description);
      await lineForm.locator('input[name="quantity"]').fill('1');
      await lineForm.locator('input[name="unitamount"]').fill(moneyAmount(options.amount));
      await lineForm.locator('input[name="discountamount"]').fill('0.00');
      await lineForm.locator('input[name="taxamount"]').fill('0.00');
      if (options.enrollmentRequestId) {
        await lineForm.locator('input[name="requestid"]').fill(options.enrollmentRequestId);
      }
      await lineForm.getByRole('button', { name: /add line|save line/i }).click();
      await this.page.waitForLoadState('domcontentloaded');
      await expect(this.page.locator('table.pqid-table')).toContainText(options.description);
    }

    const issueForm = this.page.locator('form:has(input[name="action"][value="issue"])').first();
    if (await issueForm.isVisible().catch(() => false)) {
      await issueForm.getByRole('button', { name: /issue invoice/i }).click();
      await this.page.waitForLoadState('domcontentloaded');
    }

    const pageText = ((await this.page.locator('body').textContent()) || '').replace(/\s+/g, ' ').trim();
    await expect(this.page.locator('.pqid-pill', { hasText: /issued|sent|paid|partially paid/i }).first()).toBeVisible();

    const title = ((await this.page.locator('.pqid-title').first().textContent()) || '').trim();
    const invoiceId = parseInvoiceId(this.page.url());
    const totalText = labeledMoney(pageText, 'Total');
    const balanceText = labeledMoney(pageText, 'Balance');

    return {
      invoiceId,
      invoiceNumber: title,
      statusText: pageText.match(/\b(Issued|Sent|Paid|Partially paid)\b/i)?.[1] || '',
      totalText,
      balanceText,
      finalUrl: this.page.url(),
    };
  }

  async recordManualPayment(options: {
    amount: string;
    reference: string;
    notes: string;
    method?: string;
  }): Promise<PaymentReceiptResult> {
    await expect(this.page.locator('.pqid-title').first()).toBeVisible();
    const paymentForm = this.page.locator('form:has(input[name="action"][value="record_payment"])').first();
    await expect(paymentForm).toBeVisible();
    await paymentForm.locator('input[name="paymentamount"]').fill(moneyAmount(options.amount));
    await paymentForm.locator('select[name="paymentmethod"]').selectOption(options.method || 'cash');
    await paymentForm.locator('input[name="paymentreference"]').fill(options.reference);
    await paymentForm.locator('input[name="paymentnotes"]').fill(options.notes);
    await paymentForm.getByRole('button', { name: /record payment/i }).click();
    await this.page.waitForLoadState('domcontentloaded');

    await expect(this.page.getByRole('heading', { name: /^receipt$/i }).first()).toBeVisible();
    const receiptText = ((await this.page.locator('body').textContent()) || '').replace(/\s+/g, ' ').trim();
    const paymentId = parsePaymentId(this.page.url());
    const receiptNumber = ((await this.page.locator('.pqrct-number strong').first().textContent()) || '').trim();
    if (!paymentId || !receiptNumber) {
      throw new Error(`Payment receipt did not expose payment id and receipt number. URL: ${this.page.url()}`);
    }

    return {
      paymentId,
      receiptNumber,
      amountText: receiptText.match(/Total received:\s*([A-Z]{3}\s+[0-9.]+)/i)?.[1] || '',
      methodText: receiptText.match(/Method\s+(.+?)\s+Received date/i)?.[1]?.trim() || '',
      reference: options.reference,
      receiptText,
      finalUrl: this.page.url(),
    };
  }

  async expectPaid(invoice: InvoiceResult, payment: PaymentReceiptResult): Promise<PaidInvoiceResult> {
    await expect(this.page.locator('.pqid-title').first()).toContainText(invoice.invoiceNumber);
    const pageText = ((await this.page.locator('body').textContent()) || '').replace(/\s+/g, ' ').trim();
    await expect(this.page.locator('.pqid-pill', { hasText: /^Paid$/i }).first()).toBeVisible();
    await expect(this.page.locator('.pqid-kv').first()).toContainText(/Balance\s*0(?:\.00)?/i);
    await expect(this.page.locator('table.pqid-table', { hasText: payment.receiptNumber }).first()).toBeVisible();
    expect(pageText).toContain(payment.reference);

    return {
      statusText: 'Paid',
      balanceText: labeledMoney(pageText, 'Balance'),
      paidText: labeledMoney(pageText, 'Paid'),
      invoiceText: pageText,
      finalUrl: this.page.url(),
    };
  }
}

export class StudentBillingPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async gotoForStudent(student: StudentCreationResult): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.studentBilling, {
      studentid: student.studentUserId,
    }), { waitUntil: 'domcontentloaded' });
  }

  async expectInvoiceVisible(invoice: InvoiceResult): Promise<BillingVisibilityResult> {
    await expect(this.page.getByRole('heading', { name: /student billing/i })).toBeVisible();
    const bodyText = normalizeText((await this.page.locator('body').textContent()) || '');
    expect(bodyText).toContain(invoice.invoiceNumber);

    return {
      invoiceText: bodyText,
      finalUrl: this.page.url(),
    };
  }

  async expectInvoicePaid(invoice: InvoiceResult): Promise<BillingVisibilityResult> {
    await expect(this.page.getByRole('heading', { name: /student billing/i })).toBeVisible();
    const bodyText = normalizeText((await this.page.locator('body').textContent()) || '');
    const invoiceRow = this.page.locator('table.pqb-table tbody tr', { hasText: invoice.invoiceNumber }).first();

    await expect(invoiceRow).toBeVisible();
    await expect(invoiceRow).toContainText(/Paid/i);

    const balanceCell = invoiceRow.locator('td[data-label="Balance"]').first();
    if (await balanceCell.count()) {
      await expect(balanceCell).toContainText(/^0(?:\.00)?$/);
    } else {
      const rowText = normalizeText((await invoiceRow.textContent()) || '');
      expect(rowText).toMatch(/\b0(?:\.00)?\b/);
    }

    return {
      invoiceText: bodyText,
      finalUrl: this.page.url(),
    };
  }
}
