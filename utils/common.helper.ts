import { Page } from '@playwright/test';
import path from 'path';
import { ensureDir, resolveFromRoot } from './file.helper';
import { timestamp } from './date.helper';

/** Random integer in [min, max]. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomString(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[randomInt(0, chars.length - 1)]).join('');
}

/** Unique address so repeated signup runs never collide. */
export function randomEmail(domain = 'example.com'): string {
  return `qa_${Date.now()}_${randomString(4)}@${domain}`;
}

export function pickOne<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

/** Strips currency symbols and separators: "Rs. 1,200" -> 1200 */
export function parsePrice(text: string): number {
  const digits = text.replace(/[^\d.]/g, '');
  return Number.parseFloat(digits);
}

export async function screenshot(page: Page, name: string): Promise<string> {
  const dir = ensureDir(resolveFromRoot('screenshots'));
  const file = path.join(dir, `${name}_${timestamp()}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

/** Scrolls to the bottom so lazy-loaded sections render before assertions. */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
}

/** Retries an action that is expected to settle, e.g. a flaky third-party widget. */
export async function retry<T>(action: () => Promise<T>, attempts = 3, delayMs = 500): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
