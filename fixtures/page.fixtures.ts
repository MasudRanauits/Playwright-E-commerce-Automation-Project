import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { AddToCartModalComponent } from '../pages/components/AddToCartModalComponent';
import { blockAds } from '../utils/common.helper';
import { ConsoleRecorder, recordConsoleErrors } from '../utils/browser.helper';

/** Page objects made available to every spec that imports this fixture. */
export type PageFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  productsPage: ProductsPage;
  cartPage: CartPage;
  productDetailPage: ProductDetailPage;
  cartModal: AddToCartModalComponent;
  /** Severe console output for the life of the test, third-party noise filtered. */
  consoleErrors: ConsoleRecorder;
};

export const test = base.extend<PageFixtures>({
  /**
   * The storefront serves Google interstitials (#google_vignette) that cover the
   * page and swallow clicks. Blocking the ad hosts keeps runs deterministic.
   */
  page: async ({ page }, use) => {
    await blockAds(page);
    await use(page);
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },

  cartModal: async ({ page }, use) => {
    await use(new AddToCartModalComponent(page));
  },

  /* Attached before the first navigation so nothing logged during load is missed. */
  consoleErrors: async ({ page }, use) => {
    await use(recordConsoleErrors(page));
  },
});

export { expect } from '@playwright/test';
