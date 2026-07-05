import type { Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';

export interface LoginCredentials {
  username: string;
  password: string;
}

export function adminCredentials(env: EduPlatformEnv): LoginCredentials {
  return {
    username: env.adminUsername,
    password: env.adminPassword,
  };
}

export async function loginToEduPlatform(page: Page, env: EduPlatformEnv, credentials: LoginCredentials): Promise<void> {
  const loginUrl = new URL('/login/index.php', env.baseUrl).toString();

  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/username|email/i).fill(credentials.username);
  await page.getByLabel(/password/i).fill(credentials.password);

  const loginButton = page.getByRole('button', { name: /log in|login|sign in|enter platform/i });
  const submitButton = page.locator('form button[type="submit"], form input[type="submit"]').first();
  if (await loginButton.isVisible()) {
    await loginButton.click();
  } else {
    await submitButton.click();
  }

  await page.waitForLoadState('domcontentloaded');
}

export async function logoutFromEduPlatform(page: Page, env: EduPlatformEnv): Promise<void> {
  const sesskey = await page.evaluate(() => (
    window as unknown as { M?: { cfg?: { sesskey?: string } } }
  ).M?.cfg?.sesskey || '').catch(() => '');
  const logoutUrl = new URL('/login/logout.php', env.baseUrl);
  if (sesskey) {
    logoutUrl.searchParams.set('sesskey', sesskey);
  }

  await page.goto(logoutUrl.toString(), { waitUntil: 'domcontentloaded' });

  const continueButton = page.getByRole('button', { name: /continue/i });
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click();
    await page.waitForLoadState('domcontentloaded');
  }
}
