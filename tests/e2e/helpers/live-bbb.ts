import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, HUB_ROUTES, type RouteParams } from './routes';
import type { TeacherPortalFixtureResult } from './teacher-portal';

export interface LiveBbbPageResult {
  name: string;
  url: string;
  title: string;
}

export interface LiveBbbSmokeResult {
  operations: LiveBbbPageResult;
  sessions: LiveBbbPageResult;
  createWizard: LiveBbbPageResult;
  diagnostics: LiveBbbPageResult;
  recordings: LiveBbbPageResult;
}

export interface LiveBbbScheduledSession {
  sessionId: string;
  title: string;
  teacherUserId: string;
  studentUserId: string;
  scheduledDate: string;
  scheduledTime: string;
  startUrl: string;
  reviewUrl: string;
  finalUrl: string;
}

export interface LiveBbbRecurringSeriesResult extends LiveBbbScheduledSession {
  seriesId: string;
  recurrenceCount: number;
  capacityCsvUrl?: string;
}

export interface LiveBbbStartBridgeResult {
  title: string;
  startUrl: string;
  bridgeUrl: string;
  status: number;
  bodyExcerpt: string;
}

export interface LiveBbbParentResponseResult extends LiveBbbPageResult {
  responseStatus: string;
  pageText: string;
}

export interface LiveBbbReviewPackDownloadResult extends LiveBbbPageResult {
  csvUrl: string;
  status: number;
  contentType: string;
  excerpt: string;
}

export interface LiveBbbQualityReviewResult extends LiveBbbPageResult {
  qaStatus: string;
  leadershipStatus: string;
  coachingStatus: string;
  expectedReason: string;
}

export interface LiveBbbOperationalResilienceResult extends LiveBbbPageResult {
  seriesId: string;
  reason: string;
  excerpt: string;
}

export interface LiveBbbBackupDrReadinessResult {
  backupDr: LiveBbbPageResult;
  diagnostics: LiveBbbPageResult;
  reports: LiveBbbPageResult;
}

export interface LiveBbbRetentionControlsResult {
  requested: LiveBbbPageResult;
  rejected: LiveBbbPageResult;
  blockedPurge: LiveBbbPageResult;
  evidence: LiveBbbPageResult;
}

export interface LiveBbbConsentGroupingResult {
  availability: LiveBbbPageResult;
  grouping: LiveBbbPageResult;
  parentLinks: LiveBbbReviewPackDownloadResult;
}

export interface LiveBbbPilotReadinessResult {
  rollup: LiveBbbPageResult;
  diagnostics: LiveBbbPageResult;
  reports: LiveBbbPageResult;
  readinessCsv: LiveBbbReviewPackDownloadResult;
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function expectNoBbbSecrets(bodyText: string, surface: string): void {
  expect(bodyText, `${surface} should not expose BBB shared secret or meeting passwords`).not.toMatch(
    /\b(?:moderatorpw|attendeepw|checksum|bbb_shared_secret|sharedsecret|meetingpw)\s*[=:]/i,
  );
}

function localDateTime(minutesFromNow: number): { date: string; time: string } {
  const value = new Date(Date.now() + (minutesFromNow * 60_000));
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  const hh = String(value.getHours()).padStart(2, '0');
  const min = String(value.getMinutes()).padStart(2, '0');
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
  };
}

function queryParamFromUrl(rawUrl: string, key: string): string {
  try {
    const parsed = new URL(rawUrl.replace(/&amp;/g, '&'));
    const value = parsed.searchParams.get(key);
    if (value) {
      return value;
    }
  } catch {
    // Fall through to regex parsing below for Moodle-escaped redirect URLs.
  }
  const match = rawUrl.match(new RegExp(`[?&](?:amp;)?${key}=([^&#]+)`, 'i'));
  return match ? decodeURIComponent(match[1]) : '';
}

export class LiveBbbOperationsPage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async expectOperationsDashboard(): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live operations dashboard', HUB_ROUTES.liveOps, /live operations dashboard|BBB errors|recording review|teacher workload/i);
    await expect(this.page.getByRole('link', { name: /create wizard/i }).first()).toBeVisible();
    await expect(this.page.getByRole('link', { name: /recording review/i }).first()).toBeVisible();
    await expect(this.page.getByRole('link', { name: /diagnostics/i }).first()).toBeVisible();
    return result;
  }

  async expectLiveSessions(): Promise<LiveBbbPageResult> {
    return this.gotoAndExpect('live sessions', HUB_ROUTES.liveSessions, /live sessions|BigBlueButton|create session|upcoming sessions|recording review|diagnostics/i);
  }

  async expectCreateWizard(): Promise<LiveBbbPageResult> {
    return this.gotoAndExpect('live create wizard', HUB_ROUTES.liveCreateWizard, /live-session wizard|create live session|teacher availability|recording|consent|BBB/i);
  }

  async expectDiagnostics(): Promise<LiveBbbPageResult> {
    return this.gotoAndExpect('live session diagnostics', HUB_ROUTES.liveDiagnostics, /live session diagnostics|BBB base URL configured|BBB shared secret configured|recent sessions|recent audit/i);
  }

  async expectRecordingReview(): Promise<LiveBbbPageResult> {
    return this.gotoAndExpect('live recording review', HUB_ROUTES.liveRecordingsAdmin, /live recording review|sync BBB recordings|pilot operations checklist|BBB sessions|admin quality review/i);
  }

  async runSmoke(): Promise<LiveBbbSmokeResult> {
    return {
      operations: await this.expectOperationsDashboard(),
      sessions: await this.expectLiveSessions(),
      createWizard: await this.expectCreateWizard(),
      diagnostics: await this.expectDiagnostics(),
      recordings: await this.expectRecordingReview(),
    };
  }

  async createScheduledSession(options: {
    runId: string;
    teacherUserId: string;
    studentUserId: string;
    title?: string;
  }): Promise<LiveBbbScheduledSession> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.liveSessions), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(this.page.getByRole('heading', { name: /live sessions/i }).first()).toBeVisible();
    const form = this.page.locator('form:has(input[name="action"][value="create"])').first();
    await expect(form).toBeVisible();

    const title = options.title || `SQA BBB Lifecycle ${options.runId}`;
    const scheduled = localDateTime(30);
    await form.locator('input[name="teacherid"]').fill(options.teacherUserId);
    await form.locator('input[name="studentids_raw"]').fill(options.studentUserId);
    await form.locator('input[name="title"]').fill(title);
    await form.locator('input[name="sessiondate"]').fill(scheduled.date);
    await form.locator('input[name="sessiontime"]').fill(scheduled.time);
    await form.locator('select[name="duration"]').selectOption('60');
    await form.locator('input[name="lessonid"]').fill('alphabet');
    await form.locator('input[name="unitid"]').fill(this.env.testCourseKey || 'pre_quraan');
    const recording = form.locator('input[name="recording_enabled"]').first();
    if (await recording.isVisible().catch(() => false)) {
      await recording.check();
    }

    const override = form.locator('input[name="override_conflicts"]').first();
    if (await override.isVisible().catch(() => false)) {
      await override.check();
      await form.locator('input[name="override_reason"]').fill(`SQA BBB lifecycle retry guard ${options.runId}`);
    }

    await form.getByRole('button', { name: /create live session/i }).click({ noWaitAfter: true });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    const validation = this.page.locator('.pql-alert--bad').first();
    if (await validation.isVisible().catch(() => false)) {
      throw new Error(`Live BBB session scheduling failed: ${normalize((await validation.textContent()) || '')}`);
    }

    const card = this.sessionCard(title);
    try {
      await expect(card).toBeVisible({ timeout: 15_000 });
    } catch {
      const notice = normalize((await this.page.locator('.pql-alert').first().textContent().catch(() => '')) || '');
      const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
      throw new Error(
        [
          'Live BBB session scheduling did not create a visible upcoming session card.',
          `URL: ${this.page.url()}`,
          notice ? `Notice: ${notice}` : '',
          `Expected title: ${title}`,
          `Body: ${bodyText.slice(0, 900)}`,
        ].filter(Boolean).join('\n'),
      );
    }
    const startUrl = await this.startUrlForSession(title);
    const reviewUrl = await this.reviewUrlForSession(title);
    const sessionId = new URL(reviewUrl).searchParams.get('sessionid') || '';
    return {
      sessionId,
      title,
      teacherUserId: options.teacherUserId,
      studentUserId: options.studentUserId,
      scheduledDate: scheduled.date,
      scheduledTime: scheduled.time,
      startUrl,
      reviewUrl,
      finalUrl: this.page.url(),
    };
  }

  async createRecurringSeries(options: {
    runId: string;
    teacherUserId: string;
    studentUserId: string;
    title?: string;
  }): Promise<LiveBbbRecurringSeriesResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.liveSessions), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(this.page.getByRole('heading', { name: /live sessions/i }).first()).toBeVisible();
    const form = this.page.locator('form:has(input[name="action"][value="create"])').first();
    await expect(form).toBeVisible();

    const title = options.title || `SQA BBB Series ${options.runId}`;
    const scheduled = localDateTime(90);
    await form.locator('input[name="teacherid"]').fill(options.teacherUserId);
    await form.locator('input[name="studentids_raw"]').fill(options.studentUserId);
    await form.locator('input[name="title"]').fill(title);
    await form.locator('input[name="sessiondate"]').fill(scheduled.date);
    await form.locator('input[name="sessiontime"]').fill(scheduled.time);
    await form.locator('select[name="duration"]').selectOption('60');
    await form.locator('input[name="lessonid"]').fill('alphabet');
    await form.locator('input[name="unitid"]').fill(this.env.testCourseKey || 'pre_quraan');

    const recurring = form.locator('input[name="recurring_enabled"]').first();
    await expect(recurring).toBeVisible();
    await recurring.check();
    await form.locator('select[name="recurrence_pattern"]').selectOption('daily');
    await form.locator('input[name="recurrence_count"]').fill('2');
    await form.locator('input[name="recurrence_until"]').fill(localDateTime(3 * 24 * 60).date);

    const recording = form.locator('input[name="recording_enabled"]').first();
    if (await recording.isVisible().catch(() => false)) {
      await recording.check();
    }

    const override = form.locator('input[name="override_conflicts"]').first();
    if (await override.isVisible().catch(() => false)) {
      await override.check();
      await form.locator('input[name="override_reason"]').fill(`SQA BBB recurring series guard ${options.runId}`);
    }

    await form.getByRole('button', { name: /create live session/i }).click({ noWaitAfter: true });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    const validation = this.page.locator('.pql-alert--bad').first();
    if (await validation.isVisible().catch(() => false)) {
      throw new Error(`Live BBB recurring series scheduling failed: ${normalize((await validation.textContent()) || '')}`);
    }

    const currentUrl = String(this.page.url());
    const seriesId = queryParamFromUrl(currentUrl, 'seriesid')
      || (/[?&](?:amp;)?seriesid=([^&#]+)/i.exec(currentUrl)?.[1] ?? '');
    const created = queryParamFromUrl(currentUrl, 'created')
      || (/[?&](?:amp;)?created=([^&#]+)/i.exec(currentUrl)?.[1] ?? '');
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (seriesId === '0') {
      throw new Error(
        [
          'Live BBB recurring series scheduling did not return a generated series.',
          `URL: ${currentUrl}`,
          `Expected title: ${title}`,
          `Series ID: ${seriesId || '(missing)'}`,
          `Created count: ${created || '(missing)'}`,
          `Body: ${bodyText.slice(0, 900)}`,
        ].join('\n'),
      );
    }

    const card = this.sessionCard(title);
    try {
      await expect(card).toBeVisible({ timeout: 15_000 });
    } catch {
      throw new Error(
        [
          'Live BBB recurring series scheduling did not create a visible upcoming session card.',
          `URL: ${currentUrl}`,
          `Expected title: ${title}`,
          `Series ID: ${seriesId || '(redirect omitted)'}`,
          `Created count: ${created || '(redirect omitted)'}`,
          `Body: ${bodyText.slice(0, 900)}`,
        ].join('\n'),
      );
    }
    const startUrl = await this.startUrlForSession(title);
    const reviewUrl = await this.reviewUrlForSession(title);
    const sessionId = new URL(reviewUrl).searchParams.get('sessionid') || '';
    return {
      seriesId: seriesId || `session-${sessionId || 'visible-card'}`,
      sessionId,
      title,
      teacherUserId: options.teacherUserId,
      studentUserId: options.studentUserId,
      scheduledDate: scheduled.date,
      scheduledTime: scheduled.time,
      recurrenceCount: Number(created || 2),
      startUrl,
      reviewUrl,
      finalUrl: this.page.url(),
    };
  }

  async startSessionBridge(title: string): Promise<LiveBbbStartBridgeResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.liveSessions), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(this.page.getByRole('heading', { name: /live sessions/i }).first()).toBeVisible();
    const startUrl = await this.startUrlForSession(title);
    const response = await this.page.context().request.get(startUrl, {
      maxRedirects: 0,
      timeout: 60_000,
    });
    const bodyText = normalize(await response.text());
    if (!response.ok()) {
      throw new Error(
        [
          `Live BBB start bridge returned HTTP ${response.status()}.`,
          `URL: ${startUrl}`,
          `Body: ${bodyText.slice(0, 700)}`,
        ].join('\n'),
      );
    }
    if (/live room unavailable|could not be started|bbb_config_missing|access denied|permission denied|not authorized/i.test(bodyText)) {
      throw new Error(
        [
          'Live BBB start bridge reported a provider or permission failure.',
          `URL: ${startUrl}`,
          `Body: ${bodyText.slice(0, 900)}`,
        ].join('\n'),
      );
    }
    expect(bodyText).toMatch(/Opening the BBB classroom|Opening the live classroom|Continue to Class|Please wait while the Live Session is being loaded/i);
    expect(bodyText).toContain(title);
    return {
      title,
      startUrl,
      bridgeUrl: response.url(),
      status: response.status(),
      bodyExcerpt: bodyText.slice(0, 700),
    };
  }

  async expectDiagnosticsForSession(title: string): Promise<LiveBbbPageResult> {
    const result = await this.expectDiagnostics();
    const sessionRow = this.page.locator('article.pqld-panel', { hasText: /recent sessions/i })
      .locator('table.pqld-table tr', { hasText: title })
      .first();
    await expect(sessionRow).toBeVisible();
    await expect(sessionRow).toContainText(/live|scheduled/i);
    await expect(sessionRow).toContainText(/created/i);
    const auditRow = this.page.locator('article.pqld-panel', { hasText: /recent audit/i })
      .locator('table.pqld-table tr', { hasText: /bbb_created|join_redirect|join_url_created/i })
      .first();
    await expect(auditRow).toBeVisible();
    return result;
  }

  async expectDiagnosticsForScheduledSession(title: string): Promise<LiveBbbPageResult> {
    const result = await this.expectDiagnostics();
    const sessionRow = this.page.locator('article.pqld-panel', { hasText: /recent sessions/i })
      .locator('table.pqld-table tr', { hasText: title })
      .first();
    await expect(sessionRow).toBeVisible();
    await expect(sessionRow).toContainText(/live|scheduled/i);
    await expect(sessionRow).toContainText(/pending|created/i);

    const sessionText = normalize((await sessionRow.textContent().catch(() => '')) || '');
    expectNoBbbSecrets(sessionText, 'live BBB diagnostics scheduled session row');

    const auditPanel = this.page.locator('article.pqld-panel', { hasText: /recent audit/i }).first();
    await expect(auditPanel).toBeVisible();
    const auditText = normalize((await auditPanel.textContent().catch(() => '')) || '');
    expectNoBbbSecrets(auditText, 'live BBB diagnostics scheduled audit');

    return result;
  }

  async savePostClassReview(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    await this.page.goto(session.reviewUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(this.page.locator('body')).toContainText(/attendance and notes|session review|parent summary/i);
    const form = this.page.locator('form:has(input[name="action"][value="save_review"])').first();
    await expect(form).toBeVisible();

    const prefix = `student_${session.studentUserId}_`;
    await form.locator(`select[name="${prefix}attendance_status"]`).selectOption('present');
    await form.locator(`input[name="${prefix}participation_status"]`).fill('joined; recitation reviewed');
    await form.locator(`input[name="${prefix}visible_to_parent"]`).check();
    await form.locator(`textarea[name="${prefix}strengths"]`).fill(`SQA BBB strength evidence for ${session.title}.`);
    await form.locator(`textarea[name="${prefix}needs_practice"]`).fill('Continue short daily revision with teacher follow-up.');
    await form.locator(`textarea[name="${prefix}homework"]`).fill('Review assigned pre-quraan practice before the next live class.');
    await form.locator(`textarea[name="${prefix}parent_summary"]`).fill(`Parent-visible BBB class summary for ${session.title}.`);
    await form.locator(`textarea[name="${prefix}private_note"]`).fill('Private SQA teacher note for BBB post-class evidence.');
    await form.locator(`textarea[name="${prefix}attendance_notes"]`).fill('SQA attendance evidence recorded after BBB bridge start.');

    const followup = form.locator(`select[name="${prefix}followup_status"]`).first();
    if (await followup.isVisible().catch(() => false)) {
      await followup.selectOption('parent_contact_requested');
      await form.locator(`textarea[name="${prefix}followup_message"]`).fill('Please review the BBB class homework and reply if support is needed.');
    }

    const complete = form.locator('input[name="mark_completed"]').first();
    if (await complete.isVisible().catch(() => false)) {
      await complete.check();
    }

    await form.getByRole('button', { name: /save attendance and notes/i }).click({ noWaitAfter: true });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/error writing to database|dmlwriteexception|data too long/i.test(bodyText)) {
      throw new Error(`Live BBB post-class review save failed: ${bodyText.slice(0, 900)}`);
    }
    await expect(this.page.locator('body')).toContainText(/attendance and notes saved|session completed|saved, but completion is blocked/i);
    return {
      name: 'live BBB post-class review',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
    };
  }

  async expectFollowupEvidence(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live BBB follow-up command center', HUB_ROUTES.liveFollowups, /live follow-ups|follow-up metrics|parent follow-up/i, {
      q: session.title,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(session.title);
    expect(bodyText).toMatch(/parent contact requested|teacher follow-up|follow-up requested/i);
    return result;
  }

  async expectRecordingReviewForSession(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.expectRecordingReview();
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/sync BBB recordings|recordings remain hidden until admin review|publish rule/i);
    expect(bodyText).toContain(session.title);
    return result;
  }

  async expectStudentScheduleVisible(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('student live BBB schedule', HUB_ROUTES.liveSessions, /live sessions|upcoming sessions|join class/i);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(session.title);
    expect(bodyText).toMatch(/join class|upcoming|scheduled/i);
    expectNoBbbSecrets(bodyText, 'student live BBB schedule');
    return result;
  }

  async expectParentLiveHubVisible(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('parent live BBB hub', HUB_ROUTES.liveParentTrust, /parent live hub|upcoming classes|teacher feedback|recordings/i, {
      childid: session.studentUserId,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(session.title);
    expect(bodyText).toMatch(/upcoming classes|teacher feedback|parent-visible BBB class summary/i);
    expect(bodyText).not.toContain('Private SQA teacher note');
    expectNoBbbSecrets(bodyText, 'parent live BBB hub');
    return result;
  }

  async expectParentSummaryAndRespond(session: LiveBbbScheduledSession): Promise<LiveBbbParentResponseResult> {
    await this.gotoAndExpect('parent live BBB summaries', HUB_ROUTES.liveSummaries, /teacher feedback|live session summaries|parent summary/i, {
      childid: session.studentUserId,
    });
    let bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(session.title);
    expect(bodyText).toContain(`Parent-visible BBB class summary for ${session.title}.`);
    expect(bodyText).toMatch(/need teacher help|marked as reviewed|homework completed/i);
    expect(bodyText).not.toContain('Private SQA teacher note');
    expectNoBbbSecrets(bodyText, 'parent live BBB summaries');

    const responseForm = this.page.locator('article.pqls-card', { hasText: session.title })
      .locator('form:has(input[name="action"][value="parent_followup_response"])')
      .first();
    if (await responseForm.isVisible().catch(() => false)) {
      await responseForm.locator('textarea[name="parent_response_message"]').fill(`SQA parent needs help response for ${session.title}.`);
      await responseForm.getByRole('button', { name: /need teacher help/i }).click({ noWaitAfter: true });
      await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
      bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
      expect(bodyText).toMatch(/follow-up response saved|needs help|teacher help/i);
      expect(bodyText).toContain('SQA parent needs help response');
    }

    return {
      name: 'parent live BBB summaries',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
      responseStatus: 'needs_help',
      pageText: bodyText.slice(0, 1200),
    };
  }

  async saveParentTrustSupportCase(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    await this.gotoAndExpect('parent trust support case', HUB_ROUTES.liveParentTrust, /parent live hub|support reason|teacher feedback/i, {
      childid: session.studentUserId,
    });
    const form = this.page.locator('form:has(input[name="action"][value="log_support_case"])').first();
    await expect(form).toBeVisible();
    await form.locator('select[name="support_reason"]').selectOption('recording_summary_question');
    await form.locator('select[name="case_status"]').selectOption('open');
    await form.locator('textarea[name="case_note"]').fill(`SQA parent trust audit reason for ${session.title}.`);
    await form.getByRole('button', { name: /save support reason/i }).click({ noWaitAfter: true });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/support reason and case note saved|parent live hub/i);
    expect(bodyText).toContain(session.title);
    expectNoBbbSecrets(bodyText, 'parent trust support case');
    return {
      name: 'parent trust support case',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
    };
  }

  async expectParentTrustAuditForSession(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('parent trust support audit', HUB_ROUTES.liveParentTrustAudit, /parent trust support audit|preview history|support case/i, {
      studentid: session.studentUserId,
      reason: 'recording_summary_question',
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/parent trust support audit|filtered previews/i);
    expect(bodyText).toMatch(/recording or summary question|recording_summary_question/i);
    expect(bodyText).toContain(`SQA parent trust audit reason for ${session.title}.`);
    expect(bodyText).toMatch(/parent trust support case|case events|open/i);
    expect(bodyText).not.toContain('Private SQA teacher note');
    expectNoBbbSecrets(bodyText, 'parent trust support audit');
    return result;
  }

  async expectParentTrustReviewPackDownload(session: LiveBbbScheduledSession): Promise<LiveBbbReviewPackDownloadResult> {
    const result = await this.gotoAndExpect('parent trust compliance review pack', HUB_ROUTES.liveParentTrustReviewPack, /parent trust compliance review pack|download csv|audit event detail/i, {
      studentid: session.studentUserId,
      reason: 'recording_summary_question',
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/preview events|case events|audit event detail/i);
    expect(bodyText).toContain(`SQA parent trust audit reason for ${session.title}.`);
    expect(bodyText).not.toContain('Private SQA teacher note');
    expectNoBbbSecrets(bodyText, 'parent trust compliance review pack');

    const csvLink = this.page.getByRole('link', { name: /download csv/i }).first();
    await expect(csvLink).toBeVisible();
    const href = await csvLink.getAttribute('href');
    if (!href) {
      throw new Error('Parent trust review pack did not expose a CSV download URL.');
    }
    const csvUrl = new URL(href, this.page.url()).toString();
    const response = await this.page.context().request.get(csvUrl, { timeout: 60_000 });
    const text = await response.text();
    expect(response.ok(), `review pack CSV should return HTTP 2xx for ${csvUrl}`).toBe(true);
    expect(text).toContain('Parent Trust Compliance Review Pack');
    expect(text).toContain('parent_trust_support_case_logged');
    expect(text).toContain(`SQA parent trust audit reason for ${session.title}.`);
    expect(text).not.toContain('Private SQA teacher note');
    expectNoBbbSecrets(normalize(text), 'parent trust review pack CSV');

    return {
      ...result,
      csvUrl,
      status: response.status(),
      contentType: response.headers()['content-type'] || '',
      excerpt: text.slice(0, 1200),
    };
  }

  async expectParentTrustRetentionReadiness(): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('parent trust retention readiness', HUB_ROUTES.liveParentTrustRetention, /parent trust retention readiness|retention|purge/i);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/retention readiness|retention days|purge review|export/i);
    expect(bodyText).toMatch(/dry-run|candidate|approval|required|retention/i);
    expectNoBbbSecrets(bodyText, 'parent trust retention readiness');
    return result;
  }

  async exerciseParentTrustRetentionControls(runId: string): Promise<LiveBbbRetentionControlsResult> {
    await this.gotoAndExpect('parent trust retention controls', HUB_ROUTES.liveParentTrustRetention, /parent trust retention readiness|purge review|purge execution safeguards/i);

    const workflowForm = this.page.locator('form:has(textarea[name="review_note"])')
      .filter({ hasText: /request purge review/i })
      .first();
    await expect(workflowForm).toBeVisible();
    await workflowForm.locator('textarea[name="review_note"]').fill(`SQA BBB retention review request ${runId}`);
    await Promise.all([
      this.page.waitForURL(/workflow=requested/i, { timeout: 60_000 }),
      workflowForm.getByRole('button', { name: /request purge review/i }).click(),
    ]);
    await expect(this.page.getByText(/retention approval workflow updated/i).first()).toBeVisible({ timeout: 60_000 });
    let bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/parent trust purge review requested|last workflow decision|purge review/i);
    expectNoBbbSecrets(bodyText, 'live BBB retention review request');
    const requested: LiveBbbPageResult = {
      name: 'live BBB retention review requested',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
    };

    const rejectForm = this.page.locator('form:has(textarea[name="review_note"])')
      .filter({ hasText: /reject with note/i })
      .first();
    await expect(rejectForm).toBeVisible();
    await rejectForm.locator('textarea[name="review_note"]').fill(`SQA BBB retention rejection guard ${runId}`);
    await Promise.all([
      this.page.waitForURL(/workflow=rejected/i, { timeout: 60_000 }),
      rejectForm.getByRole('button', { name: /reject with note/i }).click(),
    ]);
    await expect(this.page.getByText(/retention approval workflow updated/i).first()).toBeVisible({ timeout: 60_000 });
    bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/parent trust purge review rejected|last workflow decision|rejected/i);
    expectNoBbbSecrets(bodyText, 'live BBB retention review rejection');
    const rejected: LiveBbbPageResult = {
      name: 'live BBB retention review rejected',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
    };

    const purgeForm = this.page.locator('form:has(input[name="action"][value="execute_parent_trust_purge"])').first();
    await expect(purgeForm).toBeVisible();
    await purgeForm.locator('textarea[name="review_note"]').fill(`SQA BBB blocked purge guard ${runId}`);
    await Promise.all([
      this.page.waitForURL(/purge=blocked/i, { timeout: 60_000 }),
      purgeForm.getByRole('button', { name: /execute guarded purge/i }).click(),
    ]);
    await expect(this.page.getByText(/purge was blocked/i).first()).toBeVisible({ timeout: 60_000 });
    bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (!/purge was blocked|parent trust purge blocked|confirmation phrase missing|export confirmation required|approval required/i.test(bodyText)) {
      throw new Error(
        [
          'Live BBB retention guarded purge did not render blocked evidence.',
          `URL: ${this.page.url()}`,
          `Title: ${await this.page.title().catch(() => '')}`,
          `Body: ${bodyText.slice(0, 1000)}`,
        ].join('\n'),
      );
    }
    expectNoBbbSecrets(bodyText, 'live BBB blocked retention purge');
    const blockedPurge: LiveBbbPageResult = {
      name: 'live BBB retention purge blocked',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
    };

    const evidenceLink = this.page.locator('table.pqlptr-table tr', { hasText: /parent trust purge blocked/i })
      .getByRole('link', { name: /view\/export evidence/i })
      .first();
    await expect(evidenceLink).toBeVisible();
    await Promise.all([
      this.page.waitForURL(/live_parent_trust_purge_evidence\.php.*id=/i, { timeout: 60_000 }),
      evidenceLink.click(),
    ]);
    await expect(this.page.getByRole('heading', { name: /parent trust purge evidence/i }).first()).toBeVisible({ timeout: 60_000 });
    bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/parent trust purge evidence|purge|blocked|evidence/i);
    expect(bodyText).toMatch(/confirmation_phrase_missing|export_confirmation_required|approval_required|block/i);
    expectNoBbbSecrets(bodyText, 'live BBB retention purge evidence');
    const evidence: LiveBbbPageResult = {
      name: 'live BBB retention purge evidence',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
    };

    return {
      requested,
      rejected,
      blockedPurge,
      evidence,
    };
  }

  async exerciseConsentAvailabilityAndGrouping(options: {
    runId: string;
    teacherUserId: string;
    fixture: TeacherPortalFixtureResult;
  }): Promise<LiveBbbConsentGroupingResult> {
    const availability = await this.saveTeacherAvailability(options.teacherUserId);
    const grouping = await this.saveGroupingProfileConsent(options);
    const parentLinks = await this.refreshParentLinkAndExport(options);
    return {
      availability,
      grouping,
      parentLinks,
    };
  }

  private async saveTeacherAvailability(teacherUserId: string): Promise<LiveBbbPageResult> {
    await this.gotoAndExpect('live BBB teacher availability', HUB_ROUTES.liveAvailability, /teacher availability|weekly availability|conflict prevention/i, {
      teacherid: teacherUserId,
    });
    const form = this.page.locator('form:has(input[name="action"][value="save_calendar"])').first();
    await expect(form).toBeVisible();
    const teacherInput = form.locator('input[name="teacherid"]').first();
    if (await teacherInput.isVisible().catch(() => false)) {
      await teacherInput.fill(teacherUserId);
    }
    const slots = form.locator('input[name="slots[]"]');
    await expect(slots.first()).toBeVisible();
    await slots.nth(0).check();
    await slots.nth(1).check();
    await Promise.all([
      this.page.waitForURL(/saved=1/i, { timeout: 60_000 }),
      form.getByRole('button', { name: /save availability calendar/i }).click(),
    ]);
    await expect(this.page.getByText(/availability updated/i).first()).toBeVisible({ timeout: 60_000 });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/teacher availability|weekly availability|availability updated/i);
    expectNoBbbSecrets(bodyText, 'live BBB teacher availability');
    return {
      name: 'live BBB teacher availability',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
    };
  }

  private async saveGroupingProfileConsent(options: {
    runId: string;
    fixture: TeacherPortalFixtureResult;
  }): Promise<LiveBbbPageResult> {
    await this.gotoAndExpect('live BBB student grouping', HUB_ROUTES.liveGrouping, /student grouping|student intake|matching pool|current class groups/i);
    const form = this.page.locator('form:has(input[name="action"][value="save_profile"])').first();
    await expect(form).toBeVisible();
    const displayName = `SQA Live Consent ${options.runId}`;
    const parentName = `SQA Guardian ${options.runId}`;
    const parentEmail = options.fixture.parentemail || `${options.fixture.parentusername || `parent.${options.runId}`}@example.test`;

    await form.locator('input[name="userid"]').fill(String(options.fixture.studentid));
    await form.locator('input[name="student_display_name"]').fill(displayName);
    await form.locator('input[name="age_years"]').fill('7');
    await form.locator('select[name="gender"]').selectOption('female');
    await form.locator('select[name="special_needs"]').selectOption('no');
    await form.locator('input[name="country"]').fill('Kenya');
    await form.locator('input[name="city"]').fill('Nairobi');
    await form.locator('input[name="timezone"]').fill('Africa/Nairobi');
    await form.locator('input[name="primary_language"]').fill('Somali');
    await form.locator('input[name="language"]').fill('English, Arabic');
    await form.locator('input[name="current_level"]').fill('alphabet');
    await form.locator('input[name="learning_base"]').fill('new_learner');
    await form.locator('textarea[name="availability"]').fill(`SQA live availability notes ${options.runId}`);
    await form.locator('input[name="parent_name"]').fill(parentName);
    await form.locator('input[name="parent_email"]').fill(parentEmail);
    await form.locator('input[name="parent_phone"]').fill('+254700000000');
    await form.locator('input[name="live_class_consent"]').check();
    await form.locator('input[name="recording_consent"]').check();
    await form.locator('textarea[name="consent_notes"]').fill(`SQA live class and recording consent confirmed ${options.runId}`);
    await form.locator('textarea[name="parent_preferences"]').fill('Prefers parent-visible summaries and no hidden meeting details.');
    await form.getByRole('button', { name: /save intake profile/i }).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    await expect(this.page.getByText(/student intake profile saved/i).first()).toBeVisible({ timeout: 60_000 });

    const row = this.page.locator('table.pqlgrp-table tbody tr', { hasText: displayName }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(/live yes/i);
    await expect(row).toContainText(/record yes/i);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(parentEmail);
    expectNoBbbSecrets(bodyText, 'live BBB student grouping consent');
    return {
      name: 'live BBB student grouping consent',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
    };
  }

  private async refreshParentLinkAndExport(options: {
    runId: string;
    fixture: TeacherPortalFixtureResult;
  }): Promise<LiveBbbReviewPackDownloadResult> {
    if (!options.fixture.parentid) {
      throw new Error(`Live BBB consent/grouping fixture did not include a parent account: ${JSON.stringify(options.fixture)}`);
    }
    await this.gotoAndExpect('live BBB student parent links', HUB_ROUTES.liveParentLinks, /student parent links|guardian account links|live-session consent/i);
    const form = this.page.locator('form:has(input[name="link_studentid"])').first();
    await expect(form).toBeVisible();
    const note = `SQA live BBB parent link governance ${options.runId}`;
    await form.locator('input[name="link_studentid"]').fill(String(options.fixture.studentid));
    await form.locator('input[name="link_parentid"]').fill(String(options.fixture.parentid));
    await form.locator('input[name="link_live_consent"]').check();
    await form.locator('input[name="link_recording_consent"]').check();
    await form.locator('input[name="link_update_profile"]').check();
    await form.locator('textarea[name="link_notes"]').fill(note);
    await form.getByRole('button', { name: /create \/ refresh link/i }).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    await expect(this.page.getByText(/linked .+ to .+/i).first()).toBeVisible({ timeout: 60_000 });

    const row = this.page.locator('table.pqlpl-table tr', { hasText: String(options.fixture.studentid) })
      .filter({ hasText: String(options.fixture.parentid) })
      .first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(/communication link/i);
    await expect(row).toContainText(/yes/i);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expectNoBbbSecrets(bodyText, 'live BBB student parent links');

    const csvLink = this.page.getByRole('link', { name: /export csv/i }).first();
    await expect(csvLink).toBeVisible();
    const href = await csvLink.getAttribute('href');
    if (!href) {
      throw new Error('Live BBB parent links did not expose a CSV export URL.');
    }
    const csvUrl = new URL(href, this.page.url()).toString();
    const response = await this.page.context().request.get(csvUrl, { timeout: 60_000 });
    const text = await response.text();
    expect(response.ok(), `parent links CSV should return HTTP 2xx for ${csvUrl}`).toBe(true);
    expect(text).toContain('studentid,student,student_email,parentid');
    expect(text).toContain(String(options.fixture.studentid));
    expect(text).toContain(String(options.fixture.parentid));
    expect(text).toContain('manual_parent_student_link');
    expectNoBbbSecrets(normalize(text), 'live BBB parent links CSV');

    return {
      name: 'live BBB student parent links export',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
      csvUrl,
      status: response.status(),
      contentType: response.headers()['content-type'] || '',
      excerpt: text.slice(0, 1200),
    };
  }

  async expectLiveSessionGuideReady(): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live session guide', HUB_ROUTES.liveSessionGuide, /live session guide|join.*audio|lesson and tutor|dashboard/i);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/live session guide|walkthrough/i);
    await expect(this.page.locator('video').first()).toBeVisible();
    expectNoBbbSecrets(bodyText, 'live session guide');
    return result;
  }

  async expectSessionMaterialsReady(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live session materials', HUB_ROUTES.liveSessionMaterials, /quraan materials|agenda deck|workspace materials|live room/i, {
      sessionid: session.sessionId,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(session.title);
    expect(bodyText).toMatch(/agenda deck|default lecture deck|workspace materials|manage library/i);
    expectNoBbbSecrets(bodyText, 'live session materials');
    return result;
  }

  async expectVirtualTutorReady(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live virtual tutor', HUB_ROUTES.liveVirtualTutor, /virtual tutor|question for the virtual tutor|open current lesson/i, {
      sessionid: session.sessionId,
      studentid: session.studentUserId,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(session.title);
    expect(bodyText).toMatch(/live-session help|open current lesson|ask tutor/i);
    expectNoBbbSecrets(bodyText, 'live virtual tutor');
    return result;
  }

  async expectPracticeCoachReportReady(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live practice coach report', HUB_ROUTES.livePracticeCoach, /chatbot practice coach report|practice coach|teacher follow-up|student/i, {
      sessionid: session.sessionId,
      studentid: session.studentUserId,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/chatbot practice coach report|practice coach/i);
    expect(bodyText).toMatch(/teacher|student|session/i);
    expectNoBbbSecrets(bodyText, 'live practice coach report');
    return result;
  }

  async saveQualityReviewForLeadership(session: LiveBbbScheduledSession): Promise<LiveBbbQualityReviewResult> {
    await this.gotoAndExpect('live session quality review', HUB_ROUTES.liveQuality, /live session quality review|quality outcome|teacher coaching loop/i, {
      sessionid: session.sessionId,
    });
    const form = this.page.locator('form:has(input[name="action"][value="save_quality"])').first();
    await expect(form).toBeVisible();

    await form.locator('select[name="qa_status"]').selectOption('needs_coaching');
    for (const key of [
      'teacher_on_time',
      'student_safety',
      'appropriate_interaction',
      'lesson_reviewed',
      'arabic_practice_quality',
      'interactive_tools',
      'student_participation',
      'parent_summary_ready',
      'recording_reviewed',
    ]) {
      await form.locator(`select[name="qa_${key}"]`).selectOption('pass');
    }
    await form.locator('select[name="qa_technical_quality"]').selectOption('concern');
    await form.locator('textarea[name="qa_notes"]').fill(`SQA BBB quality leadership review for ${session.title}.`);
    await form.locator('textarea[name="qa_coaching_notes"]').fill('Coach audio setup checks and classroom pacing before the next live session.');

    const dueDate = localDateTime(7 * 24 * 60).date;
    const coachingStatus = form.locator('select[name="qa_coaching_status"]').first();
    if (await coachingStatus.isVisible().catch(() => false)) {
      await coachingStatus.selectOption('assigned');
      await form.locator('select[name="qa_coaching_priority"]').selectOption('high');
      await form.locator('input[name="qa_coaching_due_date"]').fill(dueDate);
    }

    const expectedReason = `SQA BBB leadership quality signal for ${session.title}.`;
    const leadershipStatus = form.locator('select[name="leadership_review_status"]').first();
    if (await leadershipStatus.isVisible().catch(() => false)) {
      await leadershipStatus.selectOption('flagged');
      await form.locator('textarea[name="leadership_review_reason"]').fill(expectedReason);
      await form.locator('textarea[name="leadership_review_notes"]').fill('Verify coaching owner and follow-up plan before clearing.');
    }

    await form.getByRole('button', { name: /save quality review/i }).click({ noWaitAfter: true });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/quality review saved|needs coaching|leadership review/i);
    expect(bodyText).toContain(expectedReason);
    expectNoBbbSecrets(bodyText, 'live session quality review');
    return {
      name: 'live session quality review',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
      qaStatus: 'needs_coaching',
      leadershipStatus: 'flagged',
      coachingStatus: 'assigned',
      expectedReason,
    };
  }

  async assignLeadershipImprovementPlan(session: LiveBbbScheduledSession, expectedReason: string): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live leadership review command center', HUB_ROUTES.liveLeadership, /leadership review command center|quality case|improvement plan/i, {
      teacherid: session.teacherUserId,
      status: 'all',
    });
    const caseCard = this.page.locator('article.pqll-case', { hasText: session.title }).first();
    await expect(caseCard).toBeVisible();
    await expect(caseCard).toContainText(expectedReason);

    const form = caseCard.locator('form:has(input[name="action"][value="update_case"])').first();
    await expect(form).toBeVisible();
    await form.locator('select[name="leadership_review_status"]').selectOption('in_review');
    await form.locator('textarea[name="leadership_review_reason"]').fill(expectedReason);
    await form.locator('textarea[name="leadership_review_notes"]').fill('SQA leadership owner confirmed coaching plan assignment.');

    const planStatus = form.locator('select[name="improvement_plan_status"]').first();
    if (await planStatus.isVisible().catch(() => false)) {
      await planStatus.selectOption('assigned');
      await form.locator('select[name="improvement_plan_priority"]').selectOption('high');
      await form.locator('input[name="improvement_plan_due_date"]').fill(localDateTime(14 * 24 * 60).date);
      await form.locator('textarea[name="improvement_plan_goals"]').fill(`Improve live session technical quality for ${session.title}.`);
      await form.locator('textarea[name="improvement_plan_actions"]').fill('Review headset check, pacing checklist, and post-class feedback before next session.');
      await form.locator('textarea[name="improvement_plan_completion_notes"]').fill('');
    }

    await form.getByRole('button', { name: /update case/i }).click({ noWaitAfter: true });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/leadership review updated|in review|improvement plan/i);
    expect(bodyText).toContain(session.title);
    expectNoBbbSecrets(bodyText, 'live leadership review command center');
    return result;
  }

  async expectQualityAnalyticsForSession(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live QA analytics', HUB_ROUTES.liveQualityAnalytics, /QA analytics|teacher performance|teacher performance trends/i, {
      teacherid: session.teacherUserId,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/teacher performance trends|needs attention|leadership open|average score/i);
    expect(bodyText).toMatch(/needs coaching|in review|flagged|leadership/i);
    expectNoBbbSecrets(bodyText, 'live QA analytics');
    return result;
  }

  async expectImprovementPlansForSession(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live improvement plans', HUB_ROUTES.liveImprovementPlans, /teacher improvement plans|improvement plan history|teacher history/i, {
      teacherid: session.teacherUserId,
      status: 'all',
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(session.title);
    expect(bodyText).toMatch(/assigned|high|improvement plan history|teacher history/i);
    expectNoBbbSecrets(bodyText, 'live improvement plans');
    return result;
  }

  async expectLiveReportsQualityEvidence(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live reports quality evidence', HUB_ROUTES.liveReports, /live reports|session summary|teacher workload|risk and trust audit/i, {
      teacherid: session.teacherUserId,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/session summary|teacher workload|risk and trust audit/i);
    expect(bodyText).toMatch(/needs coaching|QA|quality|coaching/i);
    expectNoBbbSecrets(bodyText, 'live reports quality evidence');
    return result;
  }

  async expectLiveReportsReadinessEvidence(): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live BBB reports readiness evidence', HUB_ROUTES.liveReports, /live reports|session summary|teacher workload|risk and trust audit/i);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/session summary|teacher workload|risk and trust audit/i);
    expectNoBbbSecrets(bodyText, 'live BBB reports readiness evidence');
    return result;
  }

  async expectLiveMonitorForSession(session: LiveBbbScheduledSession): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live lesson monitor', HUB_ROUTES.liveMonitor, /live lesson monitor|session lesson focus|latest progress/i, {
      sessionid: session.sessionId,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/session lesson focus|latest progress|completion/i);
    expectNoBbbSecrets(bodyText, 'live lesson monitor');
    return result;
  }

  async expectSeriesDashboardForSeries(series: LiveBbbRecurringSeriesResult): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live class series dashboard', HUB_ROUTES.liveSeries, /live class series|series wizard|generated|active/i);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(series.title);
    expect(bodyText).toMatch(/generated|active|future sessions|students/i);
    expectNoBbbSecrets(bodyText, 'live class series dashboard');
    return result;
  }

  async expectCapacityPlanningForSeries(series: LiveBbbRecurringSeriesResult): Promise<LiveBbbReviewPackDownloadResult> {
    const result = await this.gotoAndExpect('live BBB capacity planning', HUB_ROUTES.liveCapacity, /teacher assignment & capacity planning|calculate capacity|export csv/i, {
      classdate: series.scheduledDate,
      classtime: series.scheduledTime,
      duration: '60',
      students: '1',
      filter: 'all',
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/teachers shown|slot conflicts|assigned|profile/i);
    expect(bodyText).toContain(`#${series.teacherUserId}`);
    expectNoBbbSecrets(bodyText, 'live BBB capacity planning');

    const csvUrl = buildEduPlatformUrl(this.env, HUB_ROUTES.liveCapacity, {
      classdate: series.scheduledDate,
      classtime: series.scheduledTime,
      duration: '60',
      students: '1',
      filter: 'all',
      export: 'capacity',
    });
    const response = await this.page.context().request.get(csvUrl, { timeout: 60_000 });
    const text = await response.text();
    expect(response.ok(), `capacity CSV should return HTTP 2xx for ${csvUrl}`).toBe(true);
    expect(text).toContain('teacherid,teacher,available_hours,assigned_hours');
    expect(text).toContain(series.teacherUserId);
    expectNoBbbSecrets(normalize(text), 'live BBB capacity CSV');

    return {
      ...result,
      csvUrl,
      status: response.status(),
      contentType: response.headers()['content-type'] || '',
      excerpt: text.slice(0, 1200),
    };
  }

  async expectTeacherDirectoryAndProfileForSeries(series: LiveBbbRecurringSeriesResult): Promise<{
    directory: LiveBbbPageResult;
    profile: LiveBbbPageResult;
  }> {
    const directory = await this.gotoAndExpect('live BBB teacher directory', HUB_ROUTES.liveTeacherDirectory, /teacher directory|profile finder|teacher workspace/i, {
      q: series.teacherUserId,
    });
    let bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(`#${series.teacherUserId}`);
    expect(bodyText).toMatch(/profile|workspace|sessions|students/i);
    expectNoBbbSecrets(bodyText, 'live BBB teacher directory');

    const profile = await this.gotoAndExpect('live BBB teacher performance profile', HUB_ROUTES.liveTeacherProfile, /teacher performance profile|leadership review pack|class timeline/i, {
      teacherid: series.teacherUserId,
    });
    bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/sessions|students|leadership review pack|class timeline/i);
    expect(bodyText).toContain(series.title);
    expectNoBbbSecrets(bodyText, 'live BBB teacher performance profile');
    return { directory, profile };
  }

  async expectSeriesScheduleVisible(series: LiveBbbRecurringSeriesResult): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live BBB recurring series schedule', HUB_ROUTES.liveSeriesSchedule, /series schedule|recurring live classes|calendar/i, {
      childid: series.studentUserId,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(series.title);
    expect(bodyText).toMatch(/teacher|class|summary|calendar/i);
    expectNoBbbSecrets(bodyText, 'live BBB recurring series schedule');
    return result;
  }

  async expectLiveCalendarVisible(series: LiveBbbRecurringSeriesResult): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live BBB class calendar', HUB_ROUTES.liveCalendar, /live class calendar|add to calendar|schedule/i, {
      childid: series.studentUserId,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toContain(series.title);
    expect(bodyText).toMatch(/add to calendar|trust center|schedule/i);
    expectNoBbbSecrets(bodyText, 'live BBB class calendar');
    return result;
  }

  async cancelOneSessionInSeries(series: LiveBbbRecurringSeriesResult, reason: string): Promise<LiveBbbOperationalResilienceResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.liveSeries), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    const card = this.seriesCard(series.title);
    await expect(card).toBeVisible();
    const form = card.locator('form:has(input[name="action"][value="cancel_session"])').first();
    await expect(form).toBeVisible();
    await form.locator('input[name="reason"]').fill(reason);
    await form.getByRole('button', { name: /cancel this session/i }).click({ noWaitAfter: true });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/one session in the series was cancelled|partially cancelled/i);
    await expect(this.seriesCard(series.title)).toContainText(/partially cancelled|cancelled/i);
    expectNoBbbSecrets(bodyText, 'live BBB single-session cancellation');
    return {
      name: 'live BBB single-session cancellation',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
      seriesId: series.seriesId,
      reason,
      excerpt: bodyText.slice(0, 1200),
    };
  }

  async cancelFutureSessionsInSeries(series: LiveBbbRecurringSeriesResult, reason: string): Promise<LiveBbbOperationalResilienceResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, HUB_ROUTES.liveSeries), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    const card = this.seriesCard(series.title);
    await expect(card).toBeVisible();
    const form = card.locator('form:has(input[name="action"][value="cancel_series"])').first();
    await expect(form).toBeVisible();
    await form.locator('input[name="reason"]').fill(reason);
    await form.getByRole('button', { name: /cancel future sessions/i }).click({ noWaitAfter: true });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    const cardAfterCancel = this.seriesCard(series.title);
    await expect(cardAfterCancel).toBeVisible();
    await expect(cardAfterCancel).toContainText(/cancelled/i);
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/series cancelled|future sessions in the series were cancelled|cancelled/i);
    expectNoBbbSecrets(bodyText, 'live BBB series cancellation');
    return {
      name: 'live BBB series cancellation',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
      seriesId: series.seriesId,
      reason,
      excerpt: bodyText.slice(0, 1200),
    };
  }

  async expectCancelledSeriesHiddenFromActiveSchedule(series: LiveBbbRecurringSeriesResult): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live BBB cancelled series hidden from active schedule', HUB_ROUTES.liveSchedule, /live class schedule|upcoming classes|schedule/i, {
      childid: series.studentUserId,
    });
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).not.toContain(series.title);
    expectNoBbbSecrets(bodyText, 'live BBB active schedule after cancellation');
    return result;
  }

  async expectCancelledJoinBlocked(series: LiveBbbRecurringSeriesResult): Promise<LiveBbbPageResult> {
    await this.page.goto(series.startUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(this.page.locator('body')).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/not available|unavailable|access required|not open|cancelled|expired/i);
    expectNoBbbSecrets(bodyText, 'live BBB cancelled direct join');
    return {
      name: 'live BBB cancelled direct join blocked',
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
    };
  }

  async expectCancellationAuditForSeries(series: LiveBbbRecurringSeriesResult): Promise<LiveBbbPageResult> {
    const result = await this.expectDiagnostics();
    const auditPanel = this.page.locator('article.pqld-panel', { hasText: /recent audit/i }).first();
    await expect(auditPanel).toBeVisible();
    const runToken = /live-bbb-[a-z0-9-]+/i.exec(series.title)?.[0] || series.title;
    const singleCancel = auditPanel
      .locator('table.pqld-table tr', { hasText: /series_single_session_cancelled/i })
      .filter({ hasText: runToken })
      .first();
    await expect(singleCancel).toBeVisible();
    const seriesCancel = auditPanel
      .locator('table.pqld-table tr', { hasText: /series_cancelled/i })
      .filter({ hasText: runToken })
      .first();
    await expect(seriesCancel).toBeVisible();
    const auditText = normalize((await auditPanel.textContent().catch(() => '')) || '');
    expectNoBbbSecrets(auditText, 'live BBB cancellation audit');
    return result;
  }

  async recordBackupDrReadinessEvidence(runId: string): Promise<LiveBbbPageResult> {
    const result = await this.gotoAndExpect('live BBB backup and DR readiness', HUB_ROUTES.backupDrChecks, /backup and dr checks|current findings|backup scope|check history/i);
    const form = this.page.locator('form:has(input[name="action"][value="record_check"])').first();
    await expect(form).toBeVisible();

    const today = localDateTime(0).date;
    const nextCheck = localDateTime(30 * 24 * 60).date;
    await form.locator('select[name="checktype"]').selectOption('readiness');
    await form.locator('input[name="lastbackup_date"]').fill(today);
    await form.locator('input[name="lastrestoretest_date"]').fill(today);
    await form.locator('input[name="nextcheck_date"]').fill(nextCheck);
    await form.locator('input[name="runbookurl"]').fill('https://quraantest.academy/local/hubredirect/live_admin.php');
    await form.locator('textarea[name="evidencenote"]').fill(`SQA live BBB backup and DR readiness evidence ${runId}`);
    await form.getByRole('button', { name: /record check/i }).click({ noWaitAfter: true });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => undefined);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/backup and disaster recovery check recorded|check history/i);
    expect(bodyText).toMatch(/current findings|backup scope|recorded checks/i);
    await expect(this.page.locator('table.pqdo-table', { hasText: /check|status|backup|restore test/i }).last())
      .toContainText(/BDR-\d{8}-W\d+-\d+/);
    const renderedEvidenceNote = this.page.getByText(`SQA live BBB backup and DR readiness evidence ${runId}`).first();
    if (await renderedEvidenceNote.isVisible().catch(() => false)) {
      await expect(renderedEvidenceNote).toBeVisible();
    }
    expectNoBbbSecrets(bodyText, 'live BBB backup and DR readiness');
    return {
      name: 'live BBB backup and DR readiness',
      url: this.page.url(),
      title: await this.page.title().catch(() => result.title),
    };
  }

  async verifyBackupDrReadiness(runId: string): Promise<LiveBbbBackupDrReadinessResult> {
    const backupDr = await this.recordBackupDrReadinessEvidence(runId);
    const diagnostics = await this.expectDiagnostics();
    const reports = await this.expectLiveReportsReadinessEvidence();
    return {
      backupDr,
      diagnostics,
      reports,
    };
  }

  async verifyPilotReadinessRollup(): Promise<LiveBbbPilotReadinessResult> {
    const rollup = await this.gotoAndExpect(
      'live BBB pilot readiness',
      HUB_ROUTES.livePilotReadiness,
      /live BBB pilot readiness|phase 1-12 evidence|final BBB readiness export|stale active SQA/i,
    );
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    expect(bodyText).toMatch(/phase evidence and cleanup checks/i);
    expect(bodyText).toMatch(/no stale active SQA sessions/i);
    expect(bodyText).toMatch(/final BBB readiness export/i);
    await expect(this.page.locator('table.pqlpr-table tbody tr').filter({ hasText: /\bFAIL\b/ })).toHaveCount(0);
    const result = JSON.parse((await this.page.locator('#pqlpr-result').textContent()) || '{}') as {
      failed_checks?: number;
      reportable_sessions?: number;
      audit_rows?: number;
    };
    expect(result.failed_checks, 'live BBB pilot readiness failed check count').toBe(0);
    expect(Number(result.reportable_sessions || 0), 'live BBB reports should include reportable session evidence').toBeGreaterThan(0);
    expect(Number(result.audit_rows || 0), 'live BBB diagnostics should include audit evidence').toBeGreaterThan(0);
    expectNoBbbSecrets(bodyText, 'live BBB pilot readiness rollup');

    const diagnostics = await this.expectDiagnostics();
    const reports = await this.expectLiveReportsReadinessEvidence();
    const csvUrl = buildEduPlatformUrl(this.env, HUB_ROUTES.livePilotReadiness, { export: 'csv' });
    const response = await this.page.context().request.get(csvUrl, { timeout: 60_000 });
    const text = await response.text();
    expect(response.ok(), `pilot readiness CSV should return HTTP 2xx for ${csvUrl}`).toBe(true);
    expect(text).toContain('check,status,count,note');
    expect(text).toContain('final BBB readiness export');
    expect(text).toContain('no stale active SQA sessions');
    expect(text).not.toMatch(/\bFAIL\b/);
    expectNoBbbSecrets(normalize(text), 'live BBB pilot readiness CSV');

    return {
      rollup,
      diagnostics,
      reports,
      readinessCsv: {
        name: 'live BBB pilot readiness CSV',
        url: this.page.url(),
        title: await this.page.title().catch(() => rollup.title),
        csvUrl,
        status: response.status(),
        contentType: response.headers()['content-type'] || '',
        excerpt: text.slice(0, 1200),
      },
    };
  }

  private async gotoAndExpect(
    name: string,
    route: string,
    expectedText: RegExp,
    params: RouteParams = {},
  ): Promise<LiveBbbPageResult> {
    const url = buildEduPlatformUrl(this.env, route, params);
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(this.page.locator('body')).toBeVisible();
    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    const hasExpectedText = expectedText.test(bodyText);
    if (!hasExpectedText && /404|page not found|endpoint not found/i.test(bodyText)) {
      throw new Error(
        [
          `Live BBB endpoint for ${name} is not deployed on the target EduPlatform server.`,
          `Missing URL: ${this.page.url()}`,
          `Upload the current src/moodle/local_hubredirect/${route.split('/').pop()} to local/hubredirect/${route.split('/').pop()}, then rerun bbb-phase1.`,
        ].join('\n'),
      );
    }
    if (/invalid login|access denied|permission denied|not authorized|do not have permission|session expired/i.test(bodyText)) {
      throw new Error(
        [
          `Live BBB operations smoke could not access ${name}.`,
          `URL: ${this.page.url()}`,
          `Title: ${await this.page.title().catch(() => '')}`,
          `Body: ${bodyText.slice(0, 700)}`,
        ].join('\n'),
      );
    }
    expect(bodyText, `${name} should include ${expectedText}`).toMatch(expectedText);
    return {
      name,
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
    };
  }

  private sessionCard(title: string) {
    return this.page.locator('article.pql-card', { hasText: title }).first();
  }

  private seriesCard(title: string) {
    return this.page.locator('article.pqlser-card', { hasText: title }).first();
  }

  private async startUrlForSession(title: string): Promise<string> {
    const card = this.sessionCard(title);
    await expect(card).toBeVisible();
    const link = card.getByRole('link', { name: /start class|join class/i }).first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    if (!href) {
      throw new Error(`Live BBB session ${title} did not expose a start/join URL.`);
    }
    return new URL(href, this.page.url()).toString();
  }

  private async reviewUrlForSession(title: string): Promise<string> {
    const card = this.sessionCard(title);
    await expect(card).toBeVisible();
    const link = card.getByRole('link', { name: /attendance.*notes/i }).first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    if (!href) {
      throw new Error(`Live BBB session ${title} did not expose an attendance and notes URL.`);
    }
    return new URL(href, this.page.url()).toString();
  }
}
