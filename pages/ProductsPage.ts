import { Locator, Page, expect } from '@playwright/test';

/**
 * All Products page (/products).
 * Locators live at the top, actions below, assertions last.
 */
export class ProductsPage {
  readonly page: Page;

  readonly title: Locator;
  readonly productCards: Locator;
  readonly productNameCells: Locator;
  readonly viewProductLinks: Locator;
  readonly addToCartButtons: Locator;

  readonly searchInput: Locator;
  readonly searchButton: Locator;

  readonly categoryPanel: Locator;
  readonly brandsPanel: Locator;

  /** The header entry that brought us here; the site marks the active one orange. */
  readonly navProductsLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.title = page.locator('.features_items h2.title');
    this.productCards = page.locator('.features_items .product-image-wrapper');
    this.productNameCells = page.locator('.features_items .productinfo p');
    this.viewProductLinks = page.locator('.features_items .choose a');
    this.addToCartButtons = page.locator('.features_items .productinfo .add-to-cart');

    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');

    this.categoryPanel = page.locator('#accordian');
    this.brandsPanel = page.locator('.brands_products');

    this.navProductsLink = page.locator('.navbar-nav a[href="/products"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/products');
  }

  /** Clicks the Products entry in the header — available from every page. */
  async openFromHeader(): Promise<void> {
    await this.navProductsLink.click();
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  async productCount(): Promise<number> {
    return this.productCards.count();
  }

  /**
   * Product names from the visible cards. Third-party ads inject <a> tags into
   * the name <p>, so only the element's own text nodes count.
   */
  async productNames(): Promise<string[]> {
    const names = await this.productNameCells.evaluateAll((els) =>
      els.map((el) =>
        Array.from(el.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent ?? '')
          .join(''),
      ),
    );
    return names.map((n) => n.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  async openProduct(index = 0): Promise<void> {
    await this.viewProductLinks.nth(index).click();
  }

  /** The page is "opened" when the URL, the title and the grid all agree. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/products\/?$/);
    await expect(this.title).toHaveText(/All Products/i);
    await expect(this.productCards.first()).toBeVisible();
  }
}
