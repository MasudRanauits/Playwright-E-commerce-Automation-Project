import { test, expect } from '../../fixtures/base.fixture';

/**
 * Smoke: the Products menu critical path only — clicking it opens the page.
 * Needs no session, so the smoke run can skip auth.setup.ts entirely.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Products menu @smoke', () => {
  test('TC_005 — clicking Products in the header opens the Products page', async ({
    homePage,
    productsPage,
  }) => {
    await homePage.goto();
    await homePage.expectLoaded();

    await expect(homePage.productsLink).toBeVisible();
    await homePage.goToProducts();

    await productsPage.expectLoaded();
  });
});
