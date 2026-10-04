import { Locator, Page, expect } from '@playwright/test';
import { locators } from '../../data/locators';
import { parsePrice } from '../../utils/common.helper';

/** Everything a listing card exposes, captured at interaction time. */
export interface CapturedProduct {
  index: number;
  name: string;
  priceText: string;
  price: number;
  imageSrc: string;
  imageWidth: number;
  href: string;
  productId: number | null;
  hasAddToCart: boolean;
  hasOverlayAdd: boolean;
}

interface RawCard {
  name: string;
  priceText: string;
  imageSrc: string;
  imageWidth: number;
  href: string;
  hasAddToCart: boolean;
  hasOverlayAdd: boolean;
}

/**
 * The product grid, shared by the home features section, the All Products
 * listing, the searched results and every filtered listing — they use the
 * same markup, so one component serves all of them.
 */
export class ProductGridComponent {
  readonly page: Page;
  readonly cards: Locator;

  constructor(page: Page, rootSelector = '.features_items') {
    this.page = page;
    this.cards = page.locator(`${rootSelector} .product-image-wrapper`);
  }

  async count(): Promise<number> {
    return this.cards.count();
  }

  /** The same count read straight from the DOM — TC-W06-001, TC-W09-002. */
  async scriptedCount(): Promise<number> {
    return this.cards.evaluateAll((els) => els.length);
  }

  card(index: number): Locator {
    return this.cards.nth(index);
  }

  /**
   * Reads name, price, image, decoded width and detail link for every card in
   * ONE evaluation. Driving four locator calls per card is an order of
   * magnitude slower on a full grid — TC-W06-002, TC-W09-003.
   */
  async captureAll(): Promise<CapturedProduct[]> {
    const raw: RawCard[] = await this.cards.evaluateAll((els) =>
      els.map((el) => {
        const nameEl = el.querySelector('.productinfo p');
        /* Advertisement scripts inject <a> into the name <p>; take only its own text nodes. */
        const name = nameEl
          ? Array.from(nameEl.childNodes)
              .filter((node) => node.nodeType === 3)
              .map((node) => node.textContent ?? '')
              .join('')
          : '';
        const img = el.querySelector('.productinfo img') as HTMLImageElement | null;
        return {
          name: name.replace(/\s+/g, ' ').trim(),
          priceText: (el.querySelector('.productinfo h2')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
          imageSrc: img?.getAttribute('src') ?? '',
          imageWidth: img?.naturalWidth ?? 0,
          href: el.querySelector('.choose a')?.getAttribute('href') ?? '',
          hasAddToCart: !!el.querySelector('.productinfo .add-to-cart'),
          hasOverlayAdd: !!el.querySelector('.product-overlay .add-to-cart'),
        };
      }),
    );

    return raw.map((card, index) => ({
      index,
      ...card,
      price: parsePrice(card.priceText),
      productId: ProductGridComponent.productIdFrom(card.href),
    }));
  }

  async capture(index: number): Promise<CapturedProduct> {
    const all = await this.captureAll();
    expect(all.length, `product card at index ${index}`).toBeGreaterThan(index);
    return all[index];
  }

  async names(): Promise<string[]> {
    return (await this.captureAll()).map((product) => product.name);
  }

  static productIdFrom(href: string): number | null {
    const match = href.match(/\/product_details\/(\d+)/);
    return match ? Number(match[1]) : null;
  }

  /**
   * Adds the card at index through its inline action.
   * TC-W11-001: scroll to the centre first — the sticky header intercepts
   * clicks on cards near the top and the error looks like an application defect.
   */
  async addToCart(index: number): Promise<void> {
    const card = this.card(index);
    await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await card.locator(locators.HOME_CARD_ADD_TO_CART).first().click();
  }

  /** TC-W06-004, TC-W11-006 — the same anchor reached through the hover overlay. */
  async addToCartViaOverlay(index: number): Promise<void> {
    const card = this.card(index);
    await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await card.hover();
    const overlayAdd = card.locator(locators.HOME_CARD_OVERLAY_ADD).first();
    await expect(overlayAdd).toBeVisible();
    await overlayAdd.click();
  }

  async viewProductHrefs(): Promise<string[]> {
    return (await this.captureAll()).map((product) => product.href);
  }

  async openProduct(index: number): Promise<void> {
    await this.card(index).locator(locators.HOME_CARD_VIEW_PRODUCT).first().click();
  }
}
