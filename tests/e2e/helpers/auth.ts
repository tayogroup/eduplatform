import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginOptions {
  loginUrl?: string;
}

export function adminCredentials(env: EduPlatformEnv): LoginCredentials {
  return {
    username: env.adminUsername,
    password: env.adminPassword,
  };
}

export function consumerLoginUrl(env: EduPlatformEnv, wantsUrl?: string): string {
  const loginUrl = new URL('/local/hubredirect/consumer_login.php', env.baseUrl);
  loginUrl.searchParams.set('consumer', env.consumer);
  if (env.workspaceId) {
    loginUrl.searchParams.set('workspaceid', env.workspaceId);
  }
  if (wantsUrl) {
    loginUrl.searchParams.set('wantsurl', wantsUrl);
  }
  return loginUrl.toString();
}

export async function loginToEduPlatform(
  page: Page,
  env: EduPlatformEnv,
  credentials: LoginCredentials,
  options: LoginOptions = {},
): Promise<void> {
  const loginUrl = options.loginUrl || new URL('/login/index.php', env.baseUrl).toString();

  await page.goto(loginUrl, { waitUntil: 'commit', timeout: 60_000 });
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
  await expectLoggedInToEduPlatform(page, credentials.username);
}

export async function expectLoggedInToEduPlatform(page: Page, username: string): Promise<void> {
  const loginForm = page.locator('form').filter({ has: page.getByLabel(/username|email/i) }).first();
  const loginError = page.locator('.loginerrors, .alert-danger, [role="alert"]').first();
  if (await loginForm.isVisible().catch(() => false)) {
    const bodyText = ((await page.locator('body').textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    const errorText = await loginError.isVisible().catch(() => false)
      ? ((await loginError.textContent()) || '').replace(/\s+/g, ' ').trim()
      : '';
    throw new Error(
      [
        `Login did not complete for ${username}.`,
        errorText ? `Login error: ${errorText}` : '',
        `URL: ${page.url()}`,
        `Page: ${bodyText.slice(0, 300)}`,
      ].filter(Boolean).join('\n'),
    );
  }

  await expect(page.locator('body')).not.toContainText(/invalid login/i, { timeout: 5_000 });
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
