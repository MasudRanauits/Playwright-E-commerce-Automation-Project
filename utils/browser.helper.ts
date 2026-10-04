import { Locator, Page, expect } from '@playwright/test';
import { allowedConsoleNoiseHosts, serverErrorSignatures, viewports } from '../config/test.config';

/** One severe browser console entry, with the source that produced it. */
export interface ConsoleEntry {
  text: string;
  url: string;
}

export interface ConsoleRecorder {
  /** Severe entries with the known third-party noise filtered out. */
  applicationErrors(): ConsoleEntry[];
  /** Everything captured, for attaching to a report. */
  all(): ConsoleEntry[];
}

/**
 * Records severe console output for the life of the page.
 *
 * TC-W01-005: without the host filter this is permanently red because of the
 * advertisement frames. The allowed-noise list lives in configuration and must
 * never be widened to silence a genuine application error.
 */
export function recordConsoleErrors(page: Page): ConsoleRecorder {
  const entries: ConsoleEntry[] = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    entries.push({ text: message.text(), url: message.location().url });
  });
  page.on('pageerror', (error) => {
    entries.push({ text: error.message, url: page.url() });
  });

  const isNoise = (entry: ConsoleEntry): boolean =>
    allowedConsoleNoiseHosts.some(
      (host) => entry.url.includes(host) || entry.text.includes(host),
    );

  return {
    all: () => [...entries],
    applicationErrors: () => entries.filter((entry) => !isNoise(entry)),
  };
}

/** Renders the entries so a failure message needs no re-run to triage. */
export function formatConsoleEntries(entries: ConsoleEntry[]): string {
  if (entries.length === 0) return 'none';
  return entries.map((entry, i) => `  ${i + 1}. ${entry.text}  [${entry.url}]`).join('\n');
}

/**
 * The decoded width of every image in the set, read in one evaluation.
 *
 * TC-W01-003: a visibility check alone passes for an image that failed to load;
 * only naturalWidth proves the bytes actually decoded.
 */
export async function naturalWidths(images: Locator): Promise<number[]> {
  return images.evaluateAll((els) => els.map((el) => (el as HTMLImageElement).naturalWidth));
}

export async function naturalWidth(image: Locator): Promise<number> {
  return image.evaluate((el) => (el as HTMLImageElement).naturalWidth);
}

/**
 * TC-W02-008, TC-W09-007: the objective form of "no horizontal scrollbar".
 * Allows a one pixel rounding difference, which browsers do produce.
 */
export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth > 1;
  });
}

export async function documentWidths(page: Page): Promise<{ scroll: number; client: number }> {
  return page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
}

/** TC-W01-006, TC-W09-008 — loadEventEnd minus startTime from the navigation entry. */
export async function pageLoadDuration(page: Page): Promise<number> {
  return page.evaluate(() => {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return nav ? nav.loadEventEnd - nav.startTime : 0;
  });
}

/** TC-W09-008 — the image request count, the actionable number when the budget is breached. */
export async function imageRequestCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      performance
        .getEntriesByType('resource')
        .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === 'img').length,
  );
}

/** TC-W12-005 — WebDriver and Playwright navigation do not expose the status; read it from the entry. */
export async function documentStatus(page: Page, url: string): Promise<number> {
  const response = await page.request.get(url, { failOnStatusCode: false });
  return response.status();
}

/** TC-W01-001, TC-W10-006 — no raw server error leaked into the rendered body. */
export async function serverErrorInBody(page: Page): Promise<string | null> {
  const body = (await page.locator('body').innerText()).toLowerCase();
  const hit = serverErrorSignatures.find((signature) => body.includes(signature.toLowerCase()));
  return hit ?? null;
}

export async function expectNoServerError(page: Page): Promise<void> {
  const hit = await serverErrorInBody(page);
  expect(hit, `A server error signature was rendered in the body: ${hit}`).toBeNull();
}

export async function scrollTop(page: Page): Promise<number> {
  return page.evaluate(() => window.scrollY || document.documentElement.scrollTop);
}

/** TC-W07-005 — the scroll is animated, so poll the offset rather than reading it once. */
export async function waitForScrollTop(page: Page, expected = 0, timeout = 10_000): Promise<void> {
  await expect
    .poll(async () => scrollTop(page), { timeout, message: 'vertical scroll offset' })
    .toBeLessThanOrEqual(expected + 5);
}

/**
 * Resizes to the mobile viewport and reloads, then restores the desktop size.
 * Every mobile case must restore the viewport so the next test starts known.
 */
export async function withMobileViewport(page: Page, body: () => Promise<void>): Promise<void> {
  const original = page.viewportSize();
  try {
    await page.setViewportSize(viewports.mobile);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await body();
  } finally {
    await page.setViewportSize(original ?? viewports.desktop);
  }
}

/** TC-W08-003, TC-W08-004 — the field's own validity, not the browser's message text. */
export async function validityState(input: Locator): Promise<{ valid: boolean; message: string }> {
  return input.evaluate((el: HTMLInputElement) => ({
    valid: el.checkValidity(),
    message: el.validationMessage,
  }));
}

/**
 * TC-W08-007, TC-W10-010 — true when no dialog appeared within the window.
 * A short explicit wait, not a broad catch that would also swallow a real failure.
 */
export async function noDialogAppeared(page: Page, windowMs: number): Promise<boolean> {
  let appeared = false;
  const handler = async (dialog: { dismiss: () => Promise<void> }) => {
    appeared = true;
    await dialog.dismiss();
  };
  page.on('dialog', handler);
  await page.waitForTimeout(windowMs);
  page.off('dialog', handler);
  return !appeared;
}

/** The median of a measurement set — TC-W11-010, TC-W17-006. */
export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/**
 * Clicks something that navigates, and waits for the destination.
 *
 * A click that triggers a navigation does not finish until the navigation
 * does, so on this target it must be given the navigation budget rather than
 * the much shorter action timeout — otherwise a slow destination is reported
 * as a click that failed.
 */
export async function clickAndWaitForUrl(
  page: Page,
  target: Locator,
  url: RegExp,
  timeout = 45_000,
): Promise<void> {
  await Promise.all([page.waitForURL(url, { timeout }), target.click({ timeout })]);
}
