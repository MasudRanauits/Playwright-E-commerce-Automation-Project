import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { locators } from '../data/locators';
import { parsePrice } from '../utils/common.helper';

/**
 * Product detail page.
 *
 * WF-12 asserts the boundary transition only; the detail page itself is
 * outside the scope of the workflow document, so this object stays minimal.
 */
export class ProductDetailPage extends BasePage {
  readonly name: Locator;
  readonly price: Locator;
  readonly category: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.locator(locators.PDP_NAME);
    this.price = page.locator(locators.PDP_PRICE);
    this.category = page.locator(locators.PDP_CATEGORY);
  }

  async gotoId(productId: number): Promise<void> {
    await this.page.goto('/product_details/' + productId, { waitUntil: 'domcontentloaded' });
    await this.waitForReady();
  }

  async renderedName(): Promise<string> {
    return (await this.name.innerText()).replace(/\s+/g, ' ').trim();
  }

  async renderedPriceText(): Promise<string> {
    return (await this.price.innerText()).replace(/\s+/g, ' ').trim();
  }

  async renderedPrice(): Promise<number> {
    return parsePrice(await this.renderedPriceText());
  }

  /** TC-W12-002 — the identity carried across the transition, not just the URL. */
  async expectShows(productName: string, productId: number | null): Promise<void> {
    if (productId !== null) {
      await expect(this.page).toHaveURL(new RegExp('/product_details/' + productId));
    }
    await expect(this.name).toContainText(productName);
  }
}
