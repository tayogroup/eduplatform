import { defineConfig, devices } from '@playwright/test';
import { getEduPlatformEnv } from './tests/e2e/helpers/env';

const env = getEduPlatformEnv({ allowPartial: true });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: 'test-results/artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/student-journey-results.json' }],
  ],
  use: {
    baseURL: env.baseUrl || 'http://127.0.0.1',
    trace: process.env.EDUPLATFORM_TRACE === 'on' ? 'on' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
