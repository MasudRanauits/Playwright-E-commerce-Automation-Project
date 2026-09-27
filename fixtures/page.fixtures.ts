import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { blockAds } from '../utils/common.helper';

/** Page objects made available to every spec that imports this fixture. */
export type PageFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
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
});

export { expect } from '@playwright/test';
