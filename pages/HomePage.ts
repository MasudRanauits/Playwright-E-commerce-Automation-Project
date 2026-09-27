import { Locator, Page, expect } from '@playwright/test';

/**
 * Home page of the storefront.
 * Locators live at the top, actions below, assertions last.
 */
export class HomePage {
  readonly page: Page;

  readonly logo: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly signupLoginLink: Locator;
  readonly logoutLink: Locator;
  readonly cartLink: Locator;
  readonly loggedInAs: Locator;
  readonly featuredProducts: Locator;
  readonly categoryPanel: Locator;
  readonly subscriptionEmail: Locator;
  readonly subscribeButton: Locator;
  readonly subscribeSuccess: Locator;
  readonly scrollUpButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.logo = page.locator('.logo img');
    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');
    this.signupLoginLink = page.getByRole('link', { name: 'Signup / Login' });
    this.logoutLink = page.getByRole('link', { name: 'Logout' });
    this.cartLink = page.getByRole('link', { name: 'Cart' }).first();
    this.loggedInAs = page.locator('li', { hasText: 'Logged in as' });
    this.featuredProducts = page.locator('.features_items .product-image-wrapper');
    this.categoryPanel = page.locator('#accordian');
    this.subscriptionEmail = page.locator('#susbscribe_email');
    this.subscribeButton = page.locator('#subscribe');
    this.subscribeSuccess = page.locator('#success-subscribe');
    this.scrollUpButton = page.locator('#scrollUp');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
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
    const names = await this.page.locator('.features_items .productinfo p').evaluateAll((els) =>
      els.map((el) =>
        Array.from(el.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent ?? '')
          .join(''),
      ),
    );
    return names.map((n) => n.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
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
