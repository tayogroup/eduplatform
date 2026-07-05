import type { Page, TestInfo } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type JourneyStageStatus = 'pending' | 'passed' | 'failed' | 'blocked' | 'skipped';

export interface JourneyStage {
  name: string;
  status: JourneyStageStatus;
  at: string;
  note?: string;
}

export interface JourneyCleanupAction {
  target: string;
  identifier: string;
  mode: string;
  status: 'planned' | 'completed' | 'skipped' | 'blocked';
  note: string;
}

export interface JourneyEvidenceSummary {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  verdict?: 'passed' | 'failed' | 'blocked' | 'skipped';
  failedStage?: JourneyStage;
  environment: Record<string, unknown>;
  records: Record<string, string | number | boolean>;
  stages: JourneyStage[];
  cleanup: {
    mode: string;
    status: 'not-planned' | 'planned' | 'completed' | 'skipped' | 'blocked';
    actions: JourneyCleanupAction[];
  };
  artifacts: string[];
}

export class JourneyEvidence {
  private readonly summary: JourneyEvidenceSummary;

  constructor(
    private readonly testInfo: TestInfo,
    runId: string,
    environment: Record<string, unknown>,
  ) {
    this.summary = {
      runId,
      startedAt: new Date().toISOString(),
      environment,
      records: {},
      stages: [],
      cleanup: {
        mode: String(environment.cleanupMode || 'archive'),
        status: 'not-planned',
        actions: [],
      },
      artifacts: [],
    };
  }

  recordStage(name: string, status: JourneyStageStatus, note?: string): void {
    this.summary.stages.push({
      name,
      status,
      note,
      at: new Date().toISOString(),
    });
  }

  recordId(name: string, value: string | number | boolean): void {
    this.summary.records[name] = value;
  }

  recordCleanupAction(action: JourneyCleanupAction): void {
    this.summary.cleanup.mode = action.mode;
    this.summary.cleanup.actions.push(action);
    this.summary.cleanup.status = this.summary.cleanup.actions.some((item) => item.status === 'blocked')
      ? 'blocked'
      : this.summary.cleanup.actions.some((item) => item.status === 'completed')
        ? 'completed'
        : this.summary.cleanup.actions.some((item) => item.status === 'planned')
          ? 'planned'
          : 'skipped';
  }

  async attachJson(name: string, data: unknown): Promise<void> {
    await this.testInfo.attach(name, {
      body: JSON.stringify(data, null, 2),
      contentType: 'application/json',
    });
  }

  async screenshot(page: Page, name: string): Promise<void> {
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filePath = this.testInfo.outputPath(`${safeName}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    this.summary.artifacts.push(filePath);
    await this.testInfo.attach(name, { path: filePath, contentType: 'image/png' });
  }

  async writeSummary(): Promise<string> {
    this.summary.finishedAt = new Date().toISOString();
    this.summary.durationMs = new Date(this.summary.finishedAt).getTime() - new Date(this.summary.startedAt).getTime();
    this.summary.failedStage = this.summary.stages.find((stage) => ['failed', 'blocked'].includes(stage.status));
    this.summary.verdict = this.summary.failedStage
      ? (this.summary.failedStage.status === 'blocked' ? 'blocked' : 'failed')
      : this.summary.stages.length > 0 && this.summary.stages.every((stage) => stage.status === 'skipped')
        ? 'skipped'
        : 'passed';

    const outputDir = this.testInfo.outputPath('summary');
    await mkdir(outputDir, { recursive: true });
    const summaryPath = path.join(outputDir, 'student-journey-summary.json');
    const manifestPath = path.join(outputDir, 'student-journey-manifest.md');

    for (const artifactPath of [summaryPath, manifestPath]) {
      if (!this.summary.artifacts.includes(artifactPath)) {
        this.summary.artifacts.push(artifactPath);
      }
    }

    await writeFile(summaryPath, JSON.stringify(this.summary, null, 2), 'utf8');
    await writeFile(manifestPath, this.renderManifest(), 'utf8');
    await this.testInfo.attach('student-journey-summary', {
      path: summaryPath,
      contentType: 'application/json',
    });
    await this.testInfo.attach('student-journey-manifest', {
      path: manifestPath,
      contentType: 'text/markdown',
    });
    return summaryPath;
  }

  snapshot(): JourneyEvidenceSummary {
    return JSON.parse(JSON.stringify(this.summary)) as JourneyEvidenceSummary;
  }

  private renderManifest(): string {
    const lines = [
      '# EduPlatform Student Journey Manifest',
      '',
      `Run ID: ${this.summary.runId}`,
      `Verdict: ${this.summary.verdict || 'pending'}`,
      `Started: ${this.summary.startedAt}`,
      `Finished: ${this.summary.finishedAt || 'pending'}`,
      `Duration ms: ${this.summary.durationMs ?? 'pending'}`,
      `Cleanup mode: ${this.summary.cleanup.mode}`,
      `Cleanup status: ${this.summary.cleanup.status}`,
      '',
      '## Records',
      '',
      ...Object.entries(this.summary.records).map(([key, value]) => `- ${key}: ${String(value)}`),
      '',
      '## Stages',
      '',
      ...this.summary.stages.map((stage) => `- ${stage.status.toUpperCase()} ${stage.name} (${stage.at})${stage.note ? ` - ${stage.note}` : ''}`),
      '',
      '## Cleanup Actions',
      '',
      ...(this.summary.cleanup.actions.length > 0
        ? this.summary.cleanup.actions.map((action) => `- ${action.status.toUpperCase()} ${action.target} ${action.identifier} [${action.mode}] - ${action.note}`)
        : ['- No cleanup actions were recorded.']),
      '',
      '## Artifacts',
      '',
      ...this.summary.artifacts.map((artifact) => `- ${artifact}`),
      '',
    ];

    if (this.summary.failedStage) {
      lines.splice(8, 0, `Failed stage: ${this.summary.failedStage.name}`);
    }

    return `${lines.join('\n')}\n`;
  }
}
