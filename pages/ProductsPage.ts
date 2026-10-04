import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components/HeaderComponent';
import { CategorySidebarComponent } from './components/CategorySidebarComponent';
import { BrandSidebarComponent } from './components/BrandSidebarComponent';
import { ProductGridComponent } from './components/ProductGridComponent';
import { FooterSubscriptionComponent } from './components/FooterSubscriptionComponent';
import { locators, paths } from '../data/locators';
import { expectedText } from '../config/test.config';

/**
 * All Products page (/products), the searched products view and every filtered
 * listing — the site renders all three with the same markup.
 * Locators live at the top, actions below, assertions last.
 */
export class ProductsPage extends BasePage {
  readonly header: HeaderComponent;
  readonly categories: CategorySidebarComponent;
  readonly brands: BrandSidebarComponent;
  readonly grid: ProductGridComponent;
  readonly subscription: FooterSubscriptionComponent;

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
    super(page);

    this.header = new HeaderComponent(page);
    this.categories = new CategorySidebarComponent(page);
    this.brands = new BrandSidebarComponent(page);
    this.grid = new ProductGridComponent(page);
    this.subscription = new FooterSubscriptionComponent(page);

    this.title = page.locator(locators.PRD_PAGE_TITLE);
    this.productCards = page.locator(locators.PRD_PRODUCT_CARDS);
    this.productNameCells = page.locator('.features_items .productinfo p');
    this.viewProductLinks = page.locator(locators.PRD_VIEW_PRODUCT_LINKS);
    this.addToCartButtons = page.locator('.features_items .productinfo .add-to-cart');

    this.searchInput = page.locator(locators.PRD_SEARCH_INPUT);
    this.searchButton = page.locator(locators.PRD_SEARCH_SUBMIT);

    this.categoryPanel = page.locator(locators.PRD_CATEGORY_PANEL);
    this.brandsPanel = page.locator(locators.HOME_BRANDS_PANEL);

    this.navProductsLink = page.locator('.navbar-nav a[href="/products"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(paths.products, { waitUntil: 'domcontentloaded' });
  }

  /** TC-W09-001 — direct navigation keeps the products stage independent of the header. */
  async open(): Promise<void> {
    await this.goto();
    await this.waitForReady();
    await expect(this.title).toBeVisible();
  }

  /** Clicks the Products entry in the header — available from every page. */
  async openFromHeader(): Promise<void> {
    await this.navProductsLink.click();
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await expect(this.title).toBeVisible();
  }

  /** The heading of whatever listing is rendered: All Products, Searched Products or a filter. */
  async headingText(): Promise<string> {
    return (await this.title.innerText()).replace(/\s+/g, ' ').trim();
  }

  async productCount(): Promise<number> {
    return this.productCards.count();
  }

  /**
   * Product names from the visible cards. Third-party ads inject <a> tags into
   * the name <p>, so only the element's own text nodes count.
   */
  async productNames(): Promise<string[]> {
    return this.grid.names();
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

  async expectSearchResultView(): Promise<void> {
    await expect(this.title).toHaveText(new RegExp(expectedText.searchedProducts, 'i'));
  }
}
