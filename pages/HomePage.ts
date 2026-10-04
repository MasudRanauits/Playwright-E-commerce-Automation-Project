import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components/HeaderComponent';
import { SliderComponent } from './components/SliderComponent';
import { CategorySidebarComponent } from './components/CategorySidebarComponent';
import { BrandSidebarComponent } from './components/BrandSidebarComponent';
import { ProductGridComponent } from './components/ProductGridComponent';
import { RecommendedCarouselComponent } from './components/RecommendedCarouselComponent';
import { FooterSubscriptionComponent } from './components/FooterSubscriptionComponent';
import { locators } from '../data/locators';

/**
 * Home page of the storefront.
 * Locators live at the top, actions below, assertions last.
 */
export class HomePage extends BasePage {
  /* Shared components — each one is also exercised from the products and cart pages. */
  readonly header: HeaderComponent;
  readonly slider: SliderComponent;
  readonly categories: CategorySidebarComponent;
  readonly brands: BrandSidebarComponent;
  readonly grid: ProductGridComponent;
  readonly recommended: RecommendedCarouselComponent;
  readonly subscription: FooterSubscriptionComponent;

  readonly logo: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productsLink: Locator;
  readonly signupLoginLink: Locator;
  readonly logoutLink: Locator;
  readonly cartLink: Locator;
  readonly loggedInAs: Locator;
  readonly featuresTitle: Locator;
  readonly featuredProducts: Locator;
  readonly categoryPanel: Locator;
  readonly subscriptionEmail: Locator;
  readonly subscribeButton: Locator;
  readonly subscribeSuccess: Locator;
  readonly scrollUpButton: Locator;

  constructor(page: Page) {
    super(page);

    this.header = new HeaderComponent(page);
    this.slider = new SliderComponent(page);
    this.categories = new CategorySidebarComponent(page);
    this.brands = new BrandSidebarComponent(page);
    this.grid = new ProductGridComponent(page);
    this.recommended = new RecommendedCarouselComponent(page);
    this.subscription = new FooterSubscriptionComponent(page);

    this.logo = page.locator(locators.HDR_LOGO);
    this.searchInput = page.locator(locators.PRD_SEARCH_INPUT);
    this.searchButton = page.locator(locators.PRD_SEARCH_SUBMIT);
    this.productsLink = page.locator('.navbar-nav a[href="/products"]');
    this.signupLoginLink = page.getByRole('link', { name: 'Signup / Login' });
    this.logoutLink = page.getByRole('link', { name: 'Logout' });
    this.cartLink = page.getByRole('link', { name: 'Cart' }).first();
    this.loggedInAs = page.locator('li', { hasText: 'Logged in as' });
    this.featuresTitle = page.locator(locators.HOME_FEATURES_TITLE);
    this.featuredProducts = page.locator(locators.HOME_PRODUCT_CARDS);
    this.categoryPanel = page.locator(locators.HOME_CATEGORY_PANEL);
    this.subscriptionEmail = page.locator(locators.FTR_SUBSCRIBE_EMAIL);
    this.subscribeButton = page.locator(locators.FTR_SUBSCRIBE_SUBMIT);
    this.subscribeSuccess = page.locator('#success-subscribe');
    this.scrollUpButton = page.locator(locators.SCROLL_UP);
  }

  async goto(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  /** TC-W01-001 — the gate for the whole run: navigate and wait for a real render. */
  async open(): Promise<void> {
    await this.goto();
    await this.waitForReady();
    await expect(this.featuresTitle).toBeVisible();
  }

  /** The search box lives on /products, so navigate there if we're not already on it. */
  async search(term: string): Promise<void> {
    if (!(await this.searchInput.isVisible())) {
      await this.page.goto('/products');
    }
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  /**
   * Product names from the visible result cards. Third-party ads inject
   * <a> tags into the name <p>, so only the element's own text nodes count.
   */
  async productNames(): Promise<string[]> {
    return this.grid.names();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  /** Products lives in the header nav and is reachable from every page. */
  async goToProducts(): Promise<void> {
    await this.productsLink.click();
  }

  async goToSignupLogin(): Promise<void> {
    await this.signupLoginLink.click();
  }

  async subscribe(email: string): Promise<void> {
    await this.subscriptionEmail.fill(email);
    await this.subscribeButton.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.logo).toBeVisible();
    await expect(this.featuredProducts.first()).toBeVisible();
  }

  async expectLoggedIn(username: string): Promise<void> {
    await expect(this.loggedInAs).toContainText(username);
  }
}
