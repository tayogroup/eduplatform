import { expect, type Page } from '@playwright/test';
import type { EduPlatformEnv } from './env';
import { buildEduPlatformUrl, type RouteParams } from './routes';

export interface AccessibilityResponsiveResult {
  label: string;
  width: number;
  finalUrl: string;
  headingCount: number;
  visibleControls: number;
  labeledControls: number;
  namedLinksAndButtons: number;
  focusableCount: number;
  horizontalOverflowPx: number;
}

export interface AccessibilityResponsiveTarget {
  label: string;
  route: string;
  params?: RouteParams;
  expectedText: RegExp;
}

export const MOBILE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export class AccessibilityResponsivePage {
  constructor(
    private readonly page: Page,
    private readonly env: EduPlatformEnv,
  ) {}

  async checkTarget(target: AccessibilityResponsiveTarget): Promise<AccessibilityResponsiveResult[]> {
    const results: AccessibilityResponsiveResult[] = [];
    for (const viewport of MOBILE_VIEWPORTS) {
      await this.page.setViewportSize(viewport);
      results.push(await this.checkViewport(target, viewport.width));
    }
    return results;
  }

  private async checkViewport(target: AccessibilityResponsiveTarget, width: number): Promise<AccessibilityResponsiveResult> {
    await this.page.goto(buildEduPlatformUrl(this.env, target.route, target.params || {}), {
      waitUntil: 'commit',
      timeout: 60_000,
    });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
    await expect(this.page.locator('body')).toBeVisible();

    const bodyText = normalize((await this.page.locator('body').textContent().catch(() => '')) || '');
    if (/login|sessionexpired=1|access denied|permission denied|not authorized/i.test(bodyText) && !target.expectedText.test(bodyText)) {
      throw new Error(
        [
          `${target.label} did not load an accessible role page.`,
          `URL: ${this.page.url()}`,
          `Body: ${bodyText.slice(0, 600)}`,
        ].join('\n'),
      );
    }
    expect(bodyText, `${target.label} should include ${target.expectedText}`).toMatch(target.expectedText);

    const metrics = await this.page.evaluate(() => {
      const isVisible = (element: Element): boolean => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      };
      const textForIds = (ids: string): string => ids
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent || '')
        .join(' ')
        .trim();
      const accessibleName = (element: Element): string => {
        const ariaLabel = element.getAttribute('aria-label') || '';
        const ariaLabelledBy = element.getAttribute('aria-labelledby') || '';
        const title = element.getAttribute('title') || '';
        const placeholder = element.getAttribute('placeholder') || '';
        const text = element.textContent || '';
        const id = element.getAttribute('id') || '';
        const explicitLabel = id ? (document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent || '') : '';
        const wrappedLabel = element.closest('label')?.textContent || '';
        return [
          ariaLabel,
          ariaLabelledBy ? textForIds(ariaLabelledBy) : '',
          explicitLabel,
          wrappedLabel,
          title,
          placeholder,
          text,
        ].join(' ').replace(/\s+/g, ' ').trim();
      };

      const controls = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'))
        .filter(isVisible);
      const labeledControls = controls.filter((control) => accessibleName(control).length > 0);
      const actionElements = Array.from(document.querySelectorAll('a[href], button, input[type="submit"], input[type="button"]'))
        .filter(isVisible);
      const namedLinksAndButtons = actionElements.filter((element) => accessibleName(element).length > 0);
      const focusableElements = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter((element) => isVisible(element) && !(element as HTMLInputElement).disabled);

      return {
        headingCount: Array.from(document.querySelectorAll('h1,h2,h3,[role="heading"]')).filter(isVisible).length,
        visibleControls: controls.length,
        labeledControls: labeledControls.length,
        actionElements: actionElements.length,
        namedLinksAndButtons: namedLinksAndButtons.length,
        focusableCount: focusableElements.length,
        horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      };
    });

    expect(metrics.headingCount, `${target.label} should expose at least one visible heading`).toBeGreaterThan(0);
    expect(metrics.horizontalOverflowPx, `${target.label} should not overflow horizontally at ${width}px`).toBeLessThanOrEqual(48);
    expect(metrics.labeledControls, `${target.label} visible form controls should have labels`).toBe(metrics.visibleControls);
    expect(metrics.namedLinksAndButtons, `${target.label} links/buttons should have accessible names`).toBe(metrics.actionElements);
    expect(metrics.focusableCount, `${target.label} should expose keyboard-focusable controls`).toBeGreaterThan(0);

    let focused = false;
    for (let index = 0; index < 8; index += 1) {
      await this.page.keyboard.press('Tab');
      focused = await this.page.evaluate(() => {
        const active = document.activeElement;
        if (!active || active === document.body) {
          return false;
        }
        const rect = active.getBoundingClientRect();
        const style = window.getComputedStyle(active);
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      });
      if (focused) {
        break;
      }
    }
    expect(focused, `${target.label} should be reachable with keyboard Tab`).toBe(true);

    return {
      label: target.label,
      width,
      finalUrl: this.page.url(),
      headingCount: metrics.headingCount,
      visibleControls: metrics.visibleControls,
      labeledControls: metrics.labeledControls,
      namedLinksAndButtons: metrics.namedLinksAndButtons,
      focusableCount: metrics.focusableCount,
      horizontalOverflowPx: metrics.horizontalOverflowPx,
    };
  }
}
