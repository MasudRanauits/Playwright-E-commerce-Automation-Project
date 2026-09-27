import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

/** Page objects made available to every spec that imports this fixture. */
export type PageFixtures = {
  homePage: HomePage;
};

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});

export { expect } from '@playwright/test';
