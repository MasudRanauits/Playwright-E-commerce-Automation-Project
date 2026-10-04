import { Locator, Page } from '@playwright/test';
import { locators } from '../../data/locators';
import { clickAndWaitForUrl } from '../../utils/browser.helper';

export interface BrandEntry {
  name: string;
  count: number;
  href: string;
}

/**
 * The brands panel. Like the category accordion it appears identically on the
 * home page, the products page and every filtered listing — one component
 * class serves all of them (TC-W05-005).
 */
export class BrandSidebarComponent {
  readonly page: Page;

  readonly panel: Locator;
  readonly links: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator(locators.HOME_BRANDS_PANEL);
    this.links = page.locator(locators.HOME_BRAND_LINKS);
  }

  /**
   * TC-W05-001 — the markup nests the count inside the same anchor, so the
   * count text is stripped out before the name is read.
   */
  async entries(): Promise<BrandEntry[]> {
    return this.links.evaluateAll((els) =>
      els.map((el) => {
        const countText = el.querySelector('.pull-right')?.textContent ?? '';
        const whole = el.textContent ?? '';
        return {
          name: whole.replace(countText, '').replace(/\s+/g, ' ').trim(),
          count: Number.parseInt(countText.replace(/[^\d]/g, ''), 10),
          href: el.getAttribute('href') ?? '',
        };
      }),
    );
  }

  linkFor(name: string): Locator {
    return this.links.filter({ hasText: name }).first();
  }

  /** Opens a brand listing and returns the sidebar entry it was opened from. */
  async open(index: number): Promise<BrandEntry> {
    const all = await this.entries();
    await this.panel.scrollIntoViewIfNeeded();
    await clickAndWaitForUrl(this.page, this.links.nth(index), /[/]brand_products[/]/);
    return all[index];
  }
}
