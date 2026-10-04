import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { locators, paths } from '../data/locators';
import { parsePrice } from '../utils/common.helper';
import { ProductGridComponent } from './components/ProductGridComponent';
import { HeaderComponent } from './components/HeaderComponent';
import { FooterSubscriptionComponent } from './components/FooterSubscriptionComponent';

/** One cart row, read from the rendered table. */
export interface CartRow {
  id: string;
  name: string;
  category: string;
  priceText: string;
  price: number;
  quantity: number;
  totalText: string;
  total: number;
  href: string;
  productId: number | null;
  imageSrc: string;
  imageWidth: number;
  cellCount: number;
}

/** Shopping cart (/view_cart). */
export class CartPage extends BasePage {
  readonly header: HeaderComponent;
  /** WF-20 asserts this is the same component the home page footer exposes. */
  readonly subscription: FooterSubscriptionComponent;

  readonly table: Locator;
  readonly headerCells: Locator;
  readonly rows: Locator;
  readonly emptyBlock: Locator;
  readonly emptyLink: Locator;
  readonly breadcrumb: Locator;
  readonly checkoutButton: Locator;

  readonly checkoutModal: Locator;
  readonly checkoutModalBody: Locator;
  readonly registerLoginLink: Locator;
  readonly checkoutModalClose: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.subscription = new FooterSubscriptionComponent(page);

    this.table = page.locator(locators.CART_TABLE);
    this.headerCells = page.locator(locators.CART_HEADER_CELLS);
    this.rows = page.locator(locators.CART_ROWS);
    this.emptyBlock = page.locator(locators.CART_EMPTY_BLOCK);
    this.emptyLink = page.locator(locators.CART_EMPTY_LINK);
    this.breadcrumb = page.locator(locators.CART_BREADCRUMB);
    this.checkoutButton = page.locator(locators.CART_CHECKOUT_BUTTON);

    this.checkoutModal = page.locator(locators.CHECKOUT_MODAL);
    this.checkoutModalBody = page.locator(locators.CHECKOUT_MODAL_BODY);
    this.registerLoginLink = page.locator(locators.MODAL_REGISTER_LOGIN);
    this.checkoutModalClose = page.locator(locators.CHECKOUT_MODAL_CLOSE);
  }

  async goto(): Promise<void> {
    await this.page.goto(paths.cart, { waitUntil: 'domcontentloaded' });
    await this.waitForReady();
  }

  async rowCount(): Promise<number> {
    return this.rows.count();
  }

  /**
   * Reads the whole table in ONE evaluation. Reading each cell through its own
   * locator is both slower and liable to catch a half-updated table mid-render
   * (TC-W15-003).
   */
  async readRows(): Promise<CartRow[]> {
    const raw: Array<Omit<CartRow, 'price' | 'total' | 'productId'>> = await this.rows.evaluateAll(
      (els) =>
        els.map((el) => {
          const img = el.querySelector('.cart_product img') as HTMLImageElement | null;
          const link = el.querySelector('.cart_description h4 a');
          const text = (selector: string): string =>
            (el.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
          return {
            id: el.getAttribute('id') ?? '',
            name: (link?.textContent ?? '').replace(/\s+/g, ' ').trim(),
            category: text('.cart_description p'),
            priceText: text('.cart_price p'),
            quantity: Number.parseInt(text('.cart_quantity button') || '0', 10),
            totalText: text('.cart_total .cart_total_price'),
            href: link?.getAttribute('href') ?? '',
            imageSrc: img?.getAttribute('src') ?? '',
            imageWidth: img?.naturalWidth ?? 0,
            cellCount: el.querySelectorAll('td').length,
          };
        }),
    );

    return raw.map((row) => ({
      ...row,
      price: parsePrice(row.priceText),
      total: parsePrice(row.totalText),
      productId: ProductGridComponent.productIdFrom(row.href),
    }));
  }

  async rowNames(): Promise<string[]> {
    return (await this.readRows()).map((row) => row.name);
  }

  async headerTexts(): Promise<string[]> {
    const texts = await this.headerCells.allInnerTexts();
    return texts.map((text) => text.replace(/\s+/g, ' ').trim());
  }

  rowByName(name: string): Locator {
    /* Exact match: a substring match resolves two rows when one product name
       is a prefix of another. */
    return this.rows.filter({
      has: this.page.getByRole('link', { name, exact: true }),
    });
  }

  /**
   * TC-W17-001 — resolve the target row by its product name, never by index.
   * An index-based deletion silently removes the wrong row and still passes.
   */
  async deleteRowByName(name: string): Promise<void> {
    const row = this.rowByName(name);
    await expect(row).toHaveCount(1);
    const rowId = await row.getAttribute('id');
    await row.locator(locators.CART_ROW_DELETE).click();
    /* Wait for the row element itself to go, not for a recomputed count. */
    await expect(this.page.locator('#' + rowId)).toHaveCount(0);
  }

  async deleteFirstRow(): Promise<string> {
    const rows = await this.readRows();
    const first = rows[0];
    await this.deleteRowByName(first.name);
    return first.name;
  }

  /**
   * The teardown every cart test calls. Implemented once here so the removal
   * loop is not duplicated (TC-W14-005).
   */
  async clearCart(): Promise<void> {
    if (!this.page.url().includes(paths.cart)) await this.goto();
    while ((await this.rowCount()) > 0) {
      await this.deleteFirstRow();
    }
    await expect(this.emptyBlock).toBeVisible();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    if ((await this.emptyBlock.count()) === 0) return false;
    return this.emptyBlock.isVisible();
  }

  async isTableVisible(): Promise<boolean> {
    if ((await this.table.count()) === 0) return false;
    return this.table.isVisible();
  }

  /** TC-W19-002 — a guest is prompted rather than navigated. */
  async clickCheckout(): Promise<void> {
    await this.scrollIntoCentre(this.checkoutButton);
    await this.checkoutButton.click();
  }

  async expectEmpty(): Promise<void> {
    await expect(this.emptyBlock).toBeVisible();
    await expect(this.rows).toHaveCount(0);
  }

  async expectLoadedWithItems(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(paths.cart));
    await expect(this.table).toBeVisible();
    expect(await this.rowCount()).toBeGreaterThan(0);
  }
}
