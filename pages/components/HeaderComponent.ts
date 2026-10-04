import { Locator, Page, expect } from '@playwright/test';
import { locators, paths } from '../../data/locators';
import { clickAndWaitForUrl } from '../../utils/browser.helper';

/**
 * The global header. Every workflow reaches its page through it, so the
 * transitions live here once rather than being repeated in each spec.
 */
export class HeaderComponent {
  readonly page: Page;

  readonly logo: Locator;
  readonly nav: Locator;
  readonly navItems: Locator;
  readonly home: Locator;
  readonly products: Locator;
  readonly cart: Locator;
  readonly signupLogin: Locator;
  readonly testCases: Locator;
  readonly apiTesting: Locator;
  readonly contactUs: Locator;
  readonly logout: Locator;
  readonly deleteAccount: Locator;
  readonly loggedInAs: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator(locators.HDR_LOGO);
    this.nav = page.locator(locators.HDR_NAV);
    this.navItems = page.locator(locators.HDR_NAV_ITEMS);
    this.home = page.locator(locators.HDR_HOME);
    this.products = page.locator(locators.HDR_PRODUCTS);
    this.cart = page.locator(locators.HDR_CART);
    this.signupLogin = page.locator(locators.HDR_SIGNUP_LOGIN);
    this.testCases = page.locator(locators.HDR_TEST_CASES);
    this.apiTesting = page.locator(locators.HDR_API_TESTING);
    this.contactUs = page.locator(locators.HDR_CONTACT_US);
    this.logout = page.locator(locators.HDR_LOGOUT);
    this.deleteAccount = page.locator(locators.HDR_DELETE_ACCOUNT);
    this.loggedInAs = page.locator(locators.HDR_LOGGED_IN_AS);
  }

  /**
   * TC-W02-001 — each entry carries an icon glyph before its label, padded
   * with non-breaking and zero-width characters that neither the whitespace
   * class nor trim() removes. Everything outside printable ASCII becomes a
   * space first, so the comparison is against the label alone.
   */
  async itemTexts(): Promise<string[]> {
    const texts = await this.navItems.allInnerTexts();
    return texts
      .map((text) => text.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  async goToProducts(): Promise<void> {
    await clickAndWaitForUrl(this.page, this.products, new RegExp(paths.products + '/?$'));
  }

  async goToCart(): Promise<void> {
    await clickAndWaitForUrl(this.page, this.cart, new RegExp(paths.cart));
  }

  async goToHome(): Promise<void> {
    await clickAndWaitForUrl(this.page, this.home, /automationexercise[.]com[/]?$/);
  }

  async goToSignupLogin(): Promise<void> {
    await clickAndWaitForUrl(this.page, this.signupLogin, new RegExp(paths.login));
  }

  /** TC-W02-006 — the logo is a home link from every page. */
  async clickLogo(): Promise<void> {
    await this.logo.click();
  }

  /**
   * TC-W02-007 — the site marks the current page by colouring its entry.
   * Assert on the state marker, never on a computed colour value.
   */
  async activeStateOf(item: Locator): Promise<string> {
    return item.evaluate(
      (el) => (el.getAttribute('style') ?? '') + ' ' + (el.parentElement?.className ?? ''),
    );
  }

  async expectGuestMenu(): Promise<void> {
    await expect(this.signupLogin).toBeVisible();
    await expect(this.logout).toHaveCount(0);
    await expect(this.deleteAccount).toHaveCount(0);
  }

  async expectAuthenticatedMenu(username?: string): Promise<void> {
    await expect(this.logout).toBeVisible();
    if (username) await expect(this.loggedInAs).toContainText(username);
  }
}
