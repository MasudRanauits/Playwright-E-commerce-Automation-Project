import { Locator, Page, expect } from '@playwright/test';
import { locators } from '../../data/locators';
import { parsePrice } from '../../utils/common.helper';
import { timeouts } from '../../config/test.config';

export interface RecommendedItem {
  name: string;
  priceText: string;
  price: number;
  hasAddToCart: boolean;
}

/**
 * The recommended items carousel at the foot of the home page.
 *
 * It sits below the fold, so the scroll is part of the behaviour under test,
 * not an implementation detail (TC-W07-001).
 */
export class RecommendedCarouselComponent {
  readonly page: Page;

  readonly title: Locator;
  readonly carousel: Locator;
  readonly activeCards: Locator;
  readonly next: Locator;
  readonly prev: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator(locators.HOME_RECOMMENDED_TITLE);
    this.carousel = page.locator(locators.HOME_RECOMMENDED_CAROUSEL);
    this.activeCards = page.locator(locators.HOME_RECOMMENDED_ACTIVE_CARDS);
    this.next = page.locator(locators.HOME_RECOMMENDED_NEXT);
    this.prev = page.locator(locators.HOME_RECOMMENDED_PREV);
  }

  /** Scrolls the section into view with a centred alignment, clear of the sticky header. */
  async reveal(): Promise<void> {
    await this.title.scrollIntoViewIfNeeded();
    await this.title.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(this.carousel).toBeVisible();
  }

  async items(): Promise<RecommendedItem[]> {
    const raw: Array<{ name: string; priceText: string; hasAddToCart: boolean }> =
      await this.activeCards.evaluateAll((els) =>
        els.map((el) => ({
          name: (el.querySelector('.productinfo p')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
          priceText: (el.querySelector('.productinfo h2')?.textContent ?? '')
            .replace(/\s+/g, ' ')
            .trim(),
          hasAddToCart: !!el.querySelector('.add-to-cart'),
        })),
      );
    return raw.map((item) => ({ ...item, price: parsePrice(item.priceText) }));
  }

  async names(): Promise<string[]> {
    return (await this.items()).map((item) => item.name);
  }

  /**
   * TC-W07-002 — assert on the change of the whole set rather than on a
   * specific product; the recommendation content is not deterministic.
   */
  async advance(previous: string[]): Promise<string[]> {
    await this.next.click();
    await expect
      .poll(async () => (await this.names()).join('|'), {
        timeout: timeouts.animation,
        message: 'active recommended card set',
      })
      .not.toBe(previous.join('|'));
    return this.names();
  }

  /** Captures the product before clicking, because the carousel may rotate. */
  async addToCart(index: number): Promise<RecommendedItem> {
    const card = this.activeCards.nth(index);
    await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const captured = (await this.items())[index];
    await card.locator(locators.HOME_RECOMMENDED_ADD).first().click();
    return captured;
  }
}
