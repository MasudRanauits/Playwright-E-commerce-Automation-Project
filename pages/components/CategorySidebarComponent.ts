import { Locator, Page, expect } from '@playwright/test';
import { locators } from '../../data/locators';
import { clickAndWaitForUrl } from '../../utils/browser.helper';

export type CategoryKey = 'Women' | 'Men' | 'Kids';

/**
 * The category accordion. It renders identically on the home page, the products
 * page and every filtered listing, so it is modelled as a component rather than
 * as part of any one page object.
 */
export class CategorySidebarComponent {
  readonly page: Page;

  readonly panel: Locator;
  readonly headings: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator(locators.HOME_CATEGORY_PANEL);
    this.headings = page.locator(locators.HOME_CATEGORY_HEADINGS);
  }

  header(category: CategoryKey): Locator {
    return this.page.locator('#accordian a[href="#' + category + '"]');
  }

  body(category: CategoryKey): Locator {
    return this.page.locator('#' + category);
  }

  subLinks(category: CategoryKey): Locator {
    return this.body(category).locator('ul li a');
  }

  async topLevelNames(): Promise<string[]> {
    const texts = await this.headings.allInnerTexts();
    return texts.map((text) => text.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  /** TC-W04-001 — every sub-category list must be collapsed on first render. */
  async expandedCount(): Promise<number> {
    return this.page
      .locator(locators.HOME_CATEGORY_BODIES)
      .evaluateAll((els) => els.filter((el) => el.classList.contains('in')).length);
  }

  /**
   * TC-W04-002 — wait for visibility, not presence. The accordion animates, so
   * the container exists in the DOM before it is actually visible and an early
   * click on a child lands on a zero-height element.
   */
  async expand(category: CategoryKey): Promise<void> {
    await this.panel.scrollIntoViewIfNeeded();
    if (await this.body(category).isVisible()) return;
    await this.header(category).click();
    await expect(this.body(category)).toBeVisible();
  }

  async subCategoryNames(category: CategoryKey): Promise<string[]> {
    const texts = await this.subLinks(category).allInnerTexts();
    return texts.map((text) => text.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  async subCategoryHrefs(category: CategoryKey): Promise<string[]> {
    return this.subLinks(category).evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    );
  }

  /**
   * Opens the first sub-category of a category and returns its name, read at
   * runtime. TC-W04-004: never hard-code a taxonomy value such as "Dress" —
   * reading it at runtime keeps the case valid when the catalogue changes.
   */
  async openFirstSubCategory(category: CategoryKey): Promise<string> {
    await this.expand(category);
    const link = this.subLinks(category).first();
    const name = (await link.innerText()).replace(/\s+/g, ' ').trim();
    await clickAndWaitForUrl(this.page, link, /[/]category_products[/][0-9]+/);
    return name;
  }
}
