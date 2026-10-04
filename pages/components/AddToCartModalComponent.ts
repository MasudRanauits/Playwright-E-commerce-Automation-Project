import { Locator, Page, expect } from '@playwright/test';
import { locators, paths } from '../../data/locators';
import { clickAndWaitForUrl } from '../../utils/browser.helper';

/**
 * The "Added!" confirmation modal.
 *
 * Every intermittent failure seen in the cart workflows traced back to a click
 * landing on the fading backdrop, so dismissal always waits for invisibility.
 */
export class AddToCartModalComponent {
  readonly page: Page;

  readonly content: Locator;
  readonly title: Locator;
  readonly body: Locator;
  readonly continueShopping: Locator;
  readonly viewCart: Locator;
  readonly backdrop: Locator;

  constructor(page: Page) {
    this.page = page;
    this.content = page.locator(locators.MODAL_CONTENT);
    this.title = page.locator(locators.MODAL_TITLE);
    this.body = page.locator(locators.MODAL_BODY);
    this.continueShopping = page.locator(locators.MODAL_CONTINUE_SHOPPING);
    this.viewCart = page.locator(locators.MODAL_VIEW_CART);
    this.backdrop = page.locator('.modal-backdrop');
  }

  async waitVisible(): Promise<void> {
    await expect(this.content).toBeVisible();
  }

  /** TC-W06-005, TC-W11-002 — the invisibility wait is mandatory before any further click. */
  async dismiss(): Promise<void> {
    await this.continueShopping.click();
    await expect(this.content).toBeHidden();
    await expect(this.backdrop).toHaveCount(0);
  }

  /** TC-W06-006, TC-W11-003 — the boundary transition into the cart workflows. */
  /** TC-W06-006, TC-W11-003 — the boundary transition into the cart workflows. */
  async openCart(): Promise<void> {
    await clickAndWaitForUrl(this.page, this.viewCart, new RegExp(paths.cart));
  }
}
