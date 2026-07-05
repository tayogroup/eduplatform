import { expect, type Page } from '@playwright/test';
import type { StudentCreationResult } from './admissions';
import type { EduPlatformEnv } from './env';
import { type MoodleWsClient } from './moodle-ws';
import { buildEduPlatformUrl, HUB_ROUTES } from './routes';

export interface TranscriptJsonResult {
  ok: boolean;
  message: string;
  payload_json: string;
  warnings_json: string;
}

export interface TranscriptActionResult {
  ok: boolean;
  message: string;
  documentid: string;
  status: string;
  url: string;
  payload_json: string;
}

export interface TranscriptUiIssueResult {
  ok: boolean;
  message: string;
  documentid: string;
  status: string;
  url: string;
  finalUrl: string;
}

export interface TranscriptUiVerificationResult {
  ok: boolean;
  statusText: string;
  finalUrl: string;
}

export interface TranscriptPreviewPayload {
  header?: {
    student?: {
      id?: number;
      name?: string;
      email?: string;
      account_no?: string;
    };
  };
  lines?: Array<{
    requestid?: number;
    offeringid?: number;
    course?: {
      key?: string;
      title?: string;
      moodlecourseid?: number;
    };
    status?: {
      normalized?: string;
      local?: string;
    };
    grade?: {
      recorded?: boolean;
      percentage?: number | string;
      letter?: string;
    };
    display?: {
      grade?: string;
      completion?: string;
      attendance?: string;
    };
    warnings?: Array<{ code?: string; severity?: string; message?: string }>;
  }>;
  summary?: {
    line_count?: number;
    warning_count?: number;
    blocker_count?: number;
  };
  warnings?: Array<{ code?: string; severity?: string; message?: string }>;
}

export interface TranscriptPreviewResult {
  payload: TranscriptPreviewPayload;
  targetLineText: string;
  warningCodes: string[];
}

export interface TranscriptDocumentDownloadResult {
  url: string;
  status: number;
  contentType: string;
  byteLength: number;
}

export interface TranscriptIssueResult {
  preview: TranscriptPreviewResult;
  issued: TranscriptActionResult;
  document: TranscriptActionResult;
  download: TranscriptDocumentDownloadResult;
  verification: TranscriptActionResult;
  verificationCode: string;
}

function parseJson<T>(raw: string, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function warningCodes(payload: TranscriptPreviewPayload): string[] {
  return (payload.warnings || []).map((warning) => String(warning.code || '')).filter(Boolean);
}

function absoluteEduPlatformUrl(env: EduPlatformEnv, url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return new URL(url, env.baseUrl.endsWith('/') ? env.baseUrl : `${env.baseUrl}/`).toString();
}

function verificationCodeFromUrl(url: string): string {
  try {
    return new URL(url.replace(/&amp;/g, '&')).searchParams.get('code') || '';
  } catch {
    return '';
  }
}

function sameEnvironmentVerificationUrl(env: EduPlatformEnv, verificationUrl: string): string {
  const parsed = new URL(verificationUrl.replace(/&amp;/g, '&'), env.baseUrl);
  const target = new URL(HUB_ROUTES.transcriptVerify, env.baseUrl.endsWith('/') ? env.baseUrl : `${env.baseUrl}/`);
  target.searchParams.set('documentid', parsed.searchParams.get('documentid') || '');
  const code = parsed.searchParams.get('code') || '';
  if (code) {
    target.searchParams.set('code', code);
  }
  return target.toString();
}

export class TranscriptPolicyPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.transcriptPolicy), { waitUntil: 'domcontentloaded' });
  }

  async saveWorkspaceDefaults(): Promise<string> {
    await expect(this.page.getByRole('heading', { name: /transcript policy settings/i }).first()).toBeVisible();
    const form = this.page.locator('form.pqctp-panel').first();
    await expect(form).toBeVisible();
    await form.locator('select[name="completion_source"]').selectOption('moodle_then_local');
    await form.locator('select[name="passing_rule"]').selectOption('completion_or_grade');
    await form.locator('input[name="minimum_passing_percent"]').fill('60');
    await form.locator('select[name="grade_display_mode"]').selectOption('percent_and_letter');
    await form.locator('input[name="grade_rounding"]').fill('1');
    await form.locator('input[name="show_in_progress_grades"]').check();
    await form.locator('select[name="attendance_display"]').selectOption('sessions_and_rate');
    await form.locator('select[name="drop_withdrawal_display"]').selectOption('show_with_status');
    await form.locator('select[name="teacher_note_official_display"]').selectOption('none');
    await form.locator('select[name="unofficial_pdf_permission"]').selectOption('workspace_admin');
    await form.locator('select[name="official_issue_permission"]').selectOption('workspace_admin');
    await form.getByRole('button', { name: /save transcript policy/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('.pqctp-alert--ok').first()).toContainText(/transcript policy saved/i);
    return normalize((await this.page.locator('.pqctp-meta').first().textContent()) || '');
  }
}

export class TranscriptWsPage {
  constructor(
    private readonly wsClient: MoodleWsClient,
    private readonly env: EduPlatformEnv,
  ) {}

  async preview(student: StudentCreationResult, expectedCourseTitle: string): Promise<TranscriptPreviewResult> {
    const result = await this.wsClient.call<TranscriptJsonResult>({
      wsfunction: 'local_prequran_transcript_preview',
      args: {
        workspaceid: this.env.workspaceId,
        studentid: student.studentUserId,
        consumer: this.env.consumer,
      },
    });

    if (!result.ok) {
      throw new Error(`Transcript preview failed: ${result.message}`);
    }

    const payload = parseJson<TranscriptPreviewPayload>(result.payload_json, {});
    const lines = payload.lines || [];
    const targetLine = lines.find((line) => {
      const title = String(line.course?.title || '').toLowerCase();
      const key = String(line.course?.key || '').toLowerCase();
      return title.includes(expectedCourseTitle.toLowerCase())
        || title.includes((this.env.testCourseKey || '').toLowerCase())
        || key.includes((this.env.testCourseKey || '').toLowerCase());
    }) || lines[0];

    if (!targetLine) {
      throw new Error(`Transcript preview did not contain any course lines. Warnings: ${warningCodes(payload).join(', ')}`);
    }
    if (!targetLine.grade?.recorded) {
      throw new Error(`Transcript preview course line has no recorded grade. Line: ${JSON.stringify(targetLine)}`);
    }
    if ((payload.summary?.blocker_count || 0) > 0) {
      throw new Error(`Transcript preview has blockers: ${warningCodes(payload).join(', ')}`);
    }

    return {
      payload,
      targetLineText: normalize(JSON.stringify(targetLine)),
      warningCodes: warningCodes(payload),
    };
  }

  async issueOfficial(student: StudentCreationResult, reason: string): Promise<TranscriptActionResult> {
    return this.wsClient.call<TranscriptActionResult>({
      wsfunction: 'local_prequran_transcript_issue_official',
      args: {
        workspaceid: this.env.workspaceId,
        studentid: student.studentUserId,
        reason,
        consumer: this.env.consumer,
      },
    });
  }

  async document(documentId: string): Promise<TranscriptActionResult> {
    return this.wsClient.call<TranscriptActionResult>({
      wsfunction: 'local_prequran_transcript_document',
      args: {
        documentid: documentId,
        format: 'pdf',
        consumer: this.env.consumer,
      },
    });
  }

  async verify(documentId: string, code: string): Promise<TranscriptActionResult> {
    return this.wsClient.call<TranscriptActionResult>({
      wsfunction: 'local_prequran_transcript_verify',
      args: {
        documentid: documentId,
        code,
      },
    });
  }
}

export class TranscriptUiPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async preview(student: StudentCreationResult, expectedCourseTitle: string, expectedScorePercent: string): Promise<TranscriptPreviewResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.courseTranscript, {
      studentid: student.studentUserId,
    }), { waitUntil: 'domcontentloaded' });

    await expect(this.page.locator('.pqct-kicker', { hasText: /unofficial transcript/i }).first()).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /student record/i }).first()).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent()) || '');
    expect(bodyText).toContain(expectedCourseTitle);
    expect(bodyText).toContain(expectedScorePercent);

    return {
      payload: {
        summary: {
          line_count: 1,
          warning_count: (bodyText.match(/warning/gi) || []).length,
          blocker_count: (bodyText.match(/blocker/gi) || []).length,
        },
      },
      targetLineText: bodyText,
      warningCodes: [],
    };
  }

  async issueOfficial(student: StudentCreationResult, reason: string): Promise<TranscriptUiIssueResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.officialTranscript, {
      studentid: student.studentUserId,
    }), { waitUntil: 'domcontentloaded' });

    await expect(this.page.locator('.pqcto-kicker', { hasText: /official transcript draft/i }).first()).toBeVisible();
    const blockerPanel = this.page.locator('.pqcto-panel', { hasText: /issue blockers/i }).first();
    if (await blockerPanel.isVisible().catch(() => false)) {
      throw new Error(`Official transcript issue blocked: ${normalize((await blockerPanel.textContent()) || '')}`);
    }

    const issueForm = this.page.locator('form:has(input[name="action"][value="issue"])').first();
    await expect(issueForm).toBeVisible();
    await issueForm.locator('input[name="issuereason"]').fill(reason);
    await issueForm.getByRole('button', { name: /issue official transcript/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('.pqcto-kicker', { hasText: /issued official transcript/i }).first()).toBeVisible();
    await expect(this.page.locator('.pqcto-alert--ok').first()).toContainText(/official transcript issued/i);

    const documentid = new URL(this.page.url()).searchParams.get('documentid') || '';
    const verificationUrl = await this.page.locator('a[href*="transcript_verify.php"]').first().getAttribute('href') || '';
    if (!documentid || !verificationUrl) {
      throw new Error(`Official transcript issue did not expose document id and verification URL. URL: ${this.page.url()}`);
    }

    return {
      ok: true,
      message: 'issued',
      documentid,
      status: 'issued',
      url: verificationUrl.replace(/&amp;/g, '&'),
      finalUrl: this.page.url(),
    };
  }

  async document(documentId: string): Promise<TranscriptActionResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.officialTranscript, {
      documentid: documentId,
    }), { waitUntil: 'domcontentloaded' });

    await expect(this.page.locator('.pqcto-kicker', { hasText: /issued official transcript/i }).first()).toBeVisible();
    const url = await this.page.getByRole('link', { name: /^pdf$/i }).first().getAttribute('href') || '';
    if (!url) {
      throw new Error(`Official transcript PDF URL was not found for document ${documentId}.`);
    }
    return {
      ok: true,
      message: 'ready',
      documentid: documentId,
      status: 'issued',
      url,
      payload_json: '',
    };
  }

  async verify(verificationUrl: string, documentId: string): Promise<TranscriptUiVerificationResult> {
    await this.page.goto(sameEnvironmentVerificationUrl(this.env, verificationUrl), { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByText(/valid issued transcript/i).first()).toBeVisible();
    await expect(this.page.getByText(documentId).first()).toBeVisible();
    return {
      ok: true,
      statusText: normalize((await this.page.locator('body').textContent()) || ''),
      finalUrl: this.page.url(),
    };
  }
}

export async function downloadOfficialTranscript(page: Page, env: EduPlatformEnv, documentUrl: string): Promise<TranscriptDocumentDownloadResult> {
  const url = absoluteEduPlatformUrl(env, documentUrl);
  const response = await page.request.get(url);
  const body = await response.body();
  return {
    url,
    status: response.status(),
    contentType: response.headers()['content-type'] || '',
    byteLength: body.length,
  };
}

export function verificationCodeFromIssuedUrl(issuedUrl: string): string {
  return verificationCodeFromUrl(issuedUrl);
}
