import { Locator, Page, expect } from '@playwright/test';
import { locators } from '../data/locators';
import { scrollTop, waitForScrollTop } from '../utils/browser.helper';
import { timeouts } from '../config/test.config';

/**
 * Behaviour every page on the storefront shares.
 *
 * TC-W07-006 asserts the scroll-up utility from a second page, so it lives here
 * rather than on HomePage: one implementation, exercised from everywhere.
 */
export abstract class BasePage {
  readonly page: Page;
  readonly scrollUp: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.scrollUp = page.locator(locators.SCROLL_UP);
  }

  /** Scrolls an element into the centre of the viewport, clear of the sticky header. */
  async scrollIntoCentre(target: Locator): Promise<void> {
    await target.scrollIntoViewIfNeeded();
    await target.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async scrollOffset(): Promise<number> {
    return scrollTop(this.page);
  }

  /** TC-W07-005 — the control is animated, so wait on the offset rather than reading it once. */
  async clickScrollUp(): Promise<void> {
    await expect(this.scrollUp).toBeVisible();
    await this.scrollUp.click();
    await waitForScrollTop(this.page, 0);
  }

  /** TC-W07-004 — absence and invisibility are equally valid implementations. */
  async scrollUpIsHidden(): Promise<boolean> {
    if ((await this.scrollUp.count()) === 0) return true;
    return !(await this.scrollUp.isVisible());
  }

  /**
   * The page is ready to be asserted on.
   *
   * DOMContentLoaded is the gate; the load event is then given a bounded
   * window but is not required. On this target the tail of the load event
   * is third-party, and the site throttles a client that has been issuing
   * requests for half an hour, so a late load event says nothing about the
   * application. Every caller follows this with a visibility assertion on
   * an element the page owns, which is the real gate.
   */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page
      .waitForLoadState('load', { timeout: timeouts.documentReady })
      .catch(() => undefined);
  }
}
